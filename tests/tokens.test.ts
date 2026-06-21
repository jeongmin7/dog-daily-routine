import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/auth", () => ({ auth: vi.fn() }));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    apiToken: {
      findMany: vi.fn(),
      create: vi.fn(),
      findFirst: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hashToken } from "@/lib/api-auth";
import { GET, POST } from "@/app/api/tokens/route";
import { DELETE } from "@/app/api/tokens/[id]/route";
import { ctx, jsonReq, SESSION } from "./helpers";

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(auth).mockResolvedValue(SESSION as never);
});

describe("POST /api/tokens", () => {
  it("세션 없으면 401", async () => {
    vi.mocked(auth).mockResolvedValue(null as never);
    const res = await POST(jsonReq({ name: "t" }));
    expect(res.status).toBe(401);
    expect(prisma.apiToken.create).not.toHaveBeenCalled();
  });

  it("이름 없으면 400", async () => {
    const res = await POST(jsonReq({ name: "   " }));
    expect(res.status).toBe(400);
    expect(prisma.apiToken.create).not.toHaveBeenCalled();
  });

  it("평문 토큰을 1회 반환하고 DB엔 해시만 저장", async () => {
    vi.mocked(prisma.apiToken.create).mockResolvedValue({
      id: "t1",
      name: "내 스크립트",
      createdAt: new Date(),
    } as never);

    const res = await POST(jsonReq({ name: "내 스크립트" }));
    const body = await res.json();

    expect(res.status).toBe(201);
    // 응답엔 평문 token 포함
    expect(typeof body.data.token).toBe("string");
    expect(body.data.token.startsWith("haru_")).toBe(true);
    // DB엔 평문이 아니라 해시가 저장됨 (응답 평문의 해시와 일치)
    const stored = vi.mocked(prisma.apiToken.create).mock.calls[0][0].data;
    expect(stored.tokenHash).toBe(hashToken(body.data.token));
    expect(stored.userId).toBe("user-1");
  });
});

describe("GET /api/tokens", () => {
  it("해시·평문을 반환하지 않는다 (select에 tokenHash 없음)", async () => {
    vi.mocked(prisma.apiToken.findMany).mockResolvedValue([] as never);
    const res = await GET();
    expect(res.status).toBe(200);
    const arg = vi.mocked(prisma.apiToken.findMany).mock.calls[0][0]!;
    expect(arg.where).toEqual({ userId: "user-1" });
    expect(arg.select).toEqual({
      id: true,
      name: true,
      createdAt: true,
      lastUsedAt: true,
    });
    expect(arg.select).not.toHaveProperty("tokenHash");
  });
});

describe("DELETE /api/tokens/[id]", () => {
  it("내 토큰이 아니면 404이고 delete 안 함", async () => {
    vi.mocked(prisma.apiToken.findFirst).mockResolvedValue(null as never);
    const res = await DELETE(new Request("http://test.local", { method: "DELETE" }), ctx({ id: "t-others" }));
    expect(res.status).toBe(404);
    expect(prisma.apiToken.findFirst).toHaveBeenCalledWith({
      where: { id: "t-others", userId: "user-1" },
    });
    expect(prisma.apiToken.delete).not.toHaveBeenCalled();
  });

  it("내 토큰은 삭제 후 200", async () => {
    vi.mocked(prisma.apiToken.findFirst).mockResolvedValue({ id: "t1" } as never);
    vi.mocked(prisma.apiToken.delete).mockResolvedValue({ id: "t1" } as never);
    const res = await DELETE(new Request("http://test.local", { method: "DELETE" }), ctx({ id: "t1" }));
    expect(res.status).toBe(200);
    expect(prisma.apiToken.delete).toHaveBeenCalledWith({ where: { id: "t1" } });
  });
});
