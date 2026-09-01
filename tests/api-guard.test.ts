import { beforeEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";

vi.mock("@/lib/auth", () => ({ auth: vi.fn() }));
vi.mock("@/lib/api-auth", () => ({ getUserId: vi.fn() }));
vi.mock("@/lib/prisma", () => ({
  prisma: { dog: { findFirst: vi.fn() } },
}));

import { auth } from "@/lib/auth";
import { getUserId } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import {
  parseBody,
  requireDog,
  requireSessionUser,
  requireUser,
  serverError,
} from "@/lib/api-guard";
import { jsonReq, SESSION } from "./helpers";

beforeEach(() => {
  vi.clearAllMocks();
});

/* 19개 라우트가 전부 이 가드를 통과한다 — 여기가 뚫리면 전부 뚫린다. */

describe("requireUser", () => {
  it("인증 없으면 401", async () => {
    vi.mocked(getUserId).mockResolvedValue(null);
    const ctx = await requireUser(new Request("http://t"));
    expect(ctx.error?.status).toBe(401);
  });

  it("인증되면 userId를 준다", async () => {
    vi.mocked(getUserId).mockResolvedValue("user-1");
    const ctx = await requireUser(new Request("http://t"));
    if (ctx.error) throw new Error("인증에 성공해야 한다");
    expect(ctx.userId).toBe("user-1");
  });

  // 가드가 try 밖에서 호출되므로, 여기서 터져도 JSON 500이어야 한다.
  it("인증 조회가 실패해도 JSON 500을 돌려준다", async () => {
    vi.mocked(getUserId).mockRejectedValue(new Error("db down"));
    vi.spyOn(console, "error").mockImplementation(() => {});
    const ctx = await requireUser(new Request("http://t"));
    expect(ctx.error?.status).toBe(500);
    await expect(ctx.error?.json()).resolves.toHaveProperty("error");
  });
});

describe("requireSessionUser", () => {
  it("세션 없으면 401", async () => {
    vi.mocked(auth).mockResolvedValue(null as never);
    const ctx = await requireSessionUser();
    expect(ctx.error?.status).toBe(401);
  });

  // Bearer로 토큰을 발급/삭제하는 권한 상승을 막는다.
  it("Bearer 헤더가 있어도 세션이 없으면 401 (getUserId를 쓰지 않는다)", async () => {
    vi.mocked(auth).mockResolvedValue(null as never);
    vi.mocked(getUserId).mockResolvedValue("bearer-user");
    const ctx = await requireSessionUser();
    expect(ctx.error?.status).toBe(401);
    expect(getUserId).not.toHaveBeenCalled();
  });

  it("세션이 있으면 userId를 준다", async () => {
    vi.mocked(auth).mockResolvedValue(SESSION as never);
    const ctx = await requireSessionUser();
    if (ctx.error) throw new Error("세션이 있으면 성공해야 한다");
    expect(ctx.userId).toBe("user-1");
  });
});

describe("requireDog", () => {
  it("인증 없으면 401이고 조회하지 않는다", async () => {
    vi.mocked(getUserId).mockResolvedValue(null);
    const ctx = await requireDog(new Request("http://t"), "d1");
    expect(ctx.error?.status).toBe(401);
    expect(prisma.dog.findFirst).not.toHaveBeenCalled();
  });

  it("소유 스코프(userId)로 조회한다", async () => {
    vi.mocked(getUserId).mockResolvedValue("user-1");
    vi.mocked(prisma.dog.findFirst).mockResolvedValue({ id: "d1" } as never);
    await requireDog(new Request("http://t"), "d1");
    expect(prisma.dog.findFirst).toHaveBeenCalledWith({
      where: { id: "d1", userId: "user-1" },
    });
  });

  // 남의 것은 403이 아니라 404 — 존재 여부 자체를 알려주지 않는다.
  it("남의 강아지면 404", async () => {
    vi.mocked(getUserId).mockResolvedValue("user-1");
    vi.mocked(prisma.dog.findFirst).mockResolvedValue(null as never);
    const ctx = await requireDog(new Request("http://t"), "d-others");
    expect(ctx.error?.status).toBe(404);
  });
});

describe("parseBody", () => {
  const schema = z.object({ name: z.string().min(1, "이름 필수") });

  it("잘못된 JSON은 400", async () => {
    const ctx = await parseBody(jsonReq("{nope"), schema);
    expect(ctx.error?.status).toBe(400);
  });

  it("스키마 위반은 첫 메시지로 400", async () => {
    const ctx = await parseBody(jsonReq({ name: "" }), schema);
    expect(ctx.error?.status).toBe(400);
    await expect(ctx.error?.json()).resolves.toEqual({ error: "이름 필수" });
  });

  // 이것이 mass assignment 방어선이다 — 파싱 결과를 그대로 Prisma에 넘기므로.
  it("스키마에 없는 키는 잘라낸다", async () => {
    const ctx = await parseBody(
      jsonReq({ name: "보리", userId: "attacker", id: "위조" }),
      schema,
    );
    if (ctx.error) throw new Error("유효한 body는 통과해야 한다");
    expect(ctx.data).toEqual({ name: "보리" });
  });
});

describe("serverError", () => {
  it("원인을 로그로 남기고 응답에는 담지 않는다", async () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const res = serverError(new Error("내부 스택"), "저장 중 오류");
    expect(spy).toHaveBeenCalled();
    expect(res.status).toBe(500);
    await expect(res.json()).resolves.toEqual({ error: "저장 중 오류" });
  });
});
