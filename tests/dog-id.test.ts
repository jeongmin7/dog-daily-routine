import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/auth", () => ({ auth: vi.fn() }));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    dog: { findFirst: vi.fn(), delete: vi.fn() },
  },
}));

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { DELETE, GET } from "@/app/api/dogs/[id]/route";
import { ctx, SESSION } from "./helpers";

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(auth).mockResolvedValue(SESSION as never);
});

describe("GET /api/dogs/[id]", () => {
  it("내 소유가 아니면 404 (findFirst가 null)", async () => {
    vi.mocked(prisma.dog.findFirst).mockResolvedValue(null as never);
    const res = await GET(new Request("http://test.local"), ctx({ id: "d-others" }));
    expect(res.status).toBe(404);
    // 소유 확인은 id + userId 둘 다로 조회
    expect(prisma.dog.findFirst).toHaveBeenCalledWith({
      where: { id: "d-others", userId: "user-1" },
    });
  });

  it("내 강아지는 200으로 반환", async () => {
    vi.mocked(prisma.dog.findFirst).mockResolvedValue({ id: "d1", name: "보리" } as never);
    const res = await GET(new Request("http://test.local"), ctx({ id: "d1" }));
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.data.name).toBe("보리");
  });
});

describe("DELETE /api/dogs/[id]", () => {
  it("내 소유가 아니면 404이고 delete를 호출하지 않는다", async () => {
    vi.mocked(prisma.dog.findFirst).mockResolvedValue(null as never);
    const res = await DELETE(new Request("http://test.local", { method: "DELETE" }), ctx({ id: "d-others" }));
    expect(res.status).toBe(404);
    expect(prisma.dog.delete).not.toHaveBeenCalled();
  });

  it("내 강아지는 삭제 후 200", async () => {
    vi.mocked(prisma.dog.findFirst).mockResolvedValue({ id: "d1" } as never);
    vi.mocked(prisma.dog.delete).mockResolvedValue({ id: "d1" } as never);
    const res = await DELETE(new Request("http://test.local", { method: "DELETE" }), ctx({ id: "d1" }));
    expect(res.status).toBe(200);
    expect(prisma.dog.delete).toHaveBeenCalledWith({ where: { id: "d1" } });
  });
});
