import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/auth", () => ({ auth: vi.fn() }));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    dog: { findMany: vi.fn(), create: vi.fn() },
  },
}));

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { GET, POST } from "@/app/api/dogs/route";
import { jsonReq, SESSION } from "./helpers";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("GET /api/dogs", () => {
  it("세션이 없으면 401", async () => {
    vi.mocked(auth).mockResolvedValue(null as never);
    const res = await GET(new Request("http://test.local"));
    expect(res.status).toBe(401);
  });

  it("기본은 활성(archivedAt: null) + userId 스코프만 조회", async () => {
    vi.mocked(auth).mockResolvedValue(SESSION as never);
    vi.mocked(prisma.dog.findMany).mockResolvedValue([{ id: "d1" }] as never);

    const res = await GET(new Request("http://test.local/api/dogs"));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.data).toEqual([{ id: "d1" }]);
    expect(prisma.dog.findMany).toHaveBeenCalledWith({
      where: { userId: "user-1", archivedAt: null },
    });
  });

  it("?archived=true 면 보관된 것만 조회 (archivedAt: not null)", async () => {
    vi.mocked(auth).mockResolvedValue(SESSION as never);
    vi.mocked(prisma.dog.findMany).mockResolvedValue([{ id: "d-arc" }] as never);

    const res = await GET(new Request("http://test.local/api/dogs?archived=true"));

    expect(res.status).toBe(200);
    expect(prisma.dog.findMany).toHaveBeenCalledWith({
      where: { userId: "user-1", archivedAt: { not: null } },
    });
  });
});

describe("POST /api/dogs", () => {
  it("세션이 없으면 401", async () => {
    vi.mocked(auth).mockResolvedValue(null as never);
    const res = await POST(jsonReq({ name: "보리" }));
    expect(res.status).toBe(401);
    expect(prisma.dog.create).not.toHaveBeenCalled();
  });

  it("이름이 없으면 400", async () => {
    vi.mocked(auth).mockResolvedValue(SESSION as never);
    const res = await POST(jsonReq({ breed: "시바" }));
    expect(res.status).toBe(400);
    expect(prisma.dog.create).not.toHaveBeenCalled();
  });

  it("userId는 body가 아닌 세션에서 주입한다", async () => {
    vi.mocked(auth).mockResolvedValue(SESSION as never);
    vi.mocked(prisma.dog.create).mockResolvedValue({ id: "d9" } as never);

    // 공격: body로 남의 userId 주입 시도
    const res = await POST(jsonReq({ name: "보리", userId: "attacker" }));

    expect(res.status).toBe(201);
    const arg = vi.mocked(prisma.dog.create).mock.calls[0][0];
    expect(arg.data.userId).toBe("user-1");
  });
});
