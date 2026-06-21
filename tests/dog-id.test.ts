import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/auth", () => ({ auth: vi.fn() }));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    dog: { findFirst: vi.fn(), delete: vi.fn(), update: vi.fn() },
  },
}));

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { DELETE, GET, PATCH } from "@/app/api/dogs/[id]/route";
import { ctx, jsonReq, SESSION } from "./helpers";

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

describe("PATCH /api/dogs/[id] — 보관/복원 (soft delete)", () => {
  it("archived:true 면 archivedAt에 시각을 세팅", async () => {
    vi.mocked(prisma.dog.findFirst).mockResolvedValue({ id: "d1" } as never);
    vi.mocked(prisma.dog.update).mockResolvedValue({ id: "d1" } as never);

    const res = await PATCH(jsonReq({ archived: true }, "PATCH"), ctx({ id: "d1" }));

    expect(res.status).toBe(200);
    const arg = vi.mocked(prisma.dog.update).mock.calls[0][0];
    expect(arg.where).toEqual({ id: "d1" });
    expect(arg.data.archivedAt).toBeInstanceOf(Date);
  });

  it("archived:false 면 archivedAt을 null로 (복원)", async () => {
    vi.mocked(prisma.dog.findFirst).mockResolvedValue({ id: "d1" } as never);
    vi.mocked(prisma.dog.update).mockResolvedValue({ id: "d1" } as never);

    const res = await PATCH(jsonReq({ archived: false }, "PATCH"), ctx({ id: "d1" }));

    expect(res.status).toBe(200);
    expect(vi.mocked(prisma.dog.update).mock.calls[0][0].data.archivedAt).toBeNull();
  });

  it("내 소유가 아니면 404이고 update 안 함", async () => {
    vi.mocked(prisma.dog.findFirst).mockResolvedValue(null as never);
    const res = await PATCH(jsonReq({ archived: true }, "PATCH"), ctx({ id: "d-others" }));
    expect(res.status).toBe(404);
    expect(prisma.dog.update).not.toHaveBeenCalled();
  });

  it("archived가 boolean이 아니면 400", async () => {
    const res = await PATCH(jsonReq({ archived: "yes" }, "PATCH"), ctx({ id: "d1" }));
    expect(res.status).toBe(400);
    expect(prisma.dog.update).not.toHaveBeenCalled();
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
