import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/api-auth", () => ({ getUserId: vi.fn() }));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    dog: { findFirst: vi.fn() },
    dogRecord: { findFirst: vi.fn(), update: vi.fn(), delete: vi.fn() },
  },
}));

import { getUserId } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { DELETE, PATCH } from "@/app/api/dogs/[id]/records/[recordId]/route";
import { ctx, jsonReq } from "./helpers";

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(getUserId).mockResolvedValue("user-1");
});

describe("PATCH /api/dogs/[id]/records/[recordId] — 3단계 소유 확인", () => {
  it("강아지가 내 소유가 아니면 404", async () => {
    vi.mocked(prisma.dog.findFirst).mockResolvedValue(null as never);
    const res = await PATCH(jsonReq({ meal: 100 }, "PATCH"), ctx({ id: "d-others", recordId: "r1" }));
    expect(res.status).toBe(404);
    expect(prisma.dogRecord.update).not.toHaveBeenCalled();
  });

  it("내 강아지 + 남의 기록 조합이면 404 (record findFirst가 dogId로 걸러 null)", async () => {
    vi.mocked(prisma.dog.findFirst).mockResolvedValue({ id: "d1" } as never);
    vi.mocked(prisma.dogRecord.findFirst).mockResolvedValue(null as never);
    const res = await PATCH(jsonReq({ meal: 100 }, "PATCH"), ctx({ id: "d1", recordId: "r-others" }));
    expect(res.status).toBe(404);
    expect(prisma.dogRecord.findFirst).toHaveBeenCalledWith({
      where: { id: "r-others", dogId: "d1" },
    });
    expect(prisma.dogRecord.update).not.toHaveBeenCalled();
  });

  it("화이트리스트 외 필드는 update에 안 넘긴다 (mass assignment 차단)", async () => {
    vi.mocked(prisma.dog.findFirst).mockResolvedValue({ id: "d1" } as never);
    vi.mocked(prisma.dogRecord.findFirst).mockResolvedValue({ id: "r1", dogId: "d1" } as never);
    vi.mocked(prisma.dogRecord.update).mockResolvedValue({ id: "r1" } as never);

    // 공격: id/dogId/userId 등 권한 관련 필드 주입 시도
    const res = await PATCH(
      jsonReq({ meal: 150, id: "r-evil", dogId: "d-evil", userId: "attacker" }, "PATCH"),
      ctx({ id: "d1", recordId: "r1" }),
    );

    expect(res.status).toBe(200);
    const data = vi.mocked(prisma.dogRecord.update).mock.calls[0][0].data;
    expect(data.meal).toBe(150);
    expect(data).not.toHaveProperty("id");
    expect(data).not.toHaveProperty("dogId");
    expect(data).not.toHaveProperty("userId");
  });

  it("잘못된 JSON 바디는 400", async () => {
    vi.mocked(prisma.dog.findFirst).mockResolvedValue({ id: "d1" } as never);
    vi.mocked(prisma.dogRecord.findFirst).mockResolvedValue({ id: "r1", dogId: "d1" } as never);
    const res = await PATCH(jsonReq("{nope", "PATCH"), ctx({ id: "d1", recordId: "r1" }));
    expect(res.status).toBe(400);
    expect(prisma.dogRecord.update).not.toHaveBeenCalled();
  });
});

describe("DELETE /api/dogs/[id]/records/[recordId]", () => {
  it("남의 기록이면 404이고 delete 안 함", async () => {
    vi.mocked(prisma.dog.findFirst).mockResolvedValue({ id: "d1" } as never);
    vi.mocked(prisma.dogRecord.findFirst).mockResolvedValue(null as never);
    const res = await DELETE(new Request("http://test.local", { method: "DELETE" }), ctx({ id: "d1", recordId: "r-others" }));
    expect(res.status).toBe(404);
    expect(prisma.dogRecord.delete).not.toHaveBeenCalled();
  });

  it("내 기록은 삭제 후 200", async () => {
    vi.mocked(prisma.dog.findFirst).mockResolvedValue({ id: "d1" } as never);
    vi.mocked(prisma.dogRecord.findFirst).mockResolvedValue({ id: "r1", dogId: "d1" } as never);
    vi.mocked(prisma.dogRecord.delete).mockResolvedValue({ id: "r1" } as never);
    const res = await DELETE(new Request("http://test.local", { method: "DELETE" }), ctx({ id: "d1", recordId: "r1" }));
    expect(res.status).toBe(200);
    expect(prisma.dogRecord.delete).toHaveBeenCalledWith({ where: { id: "r1" } });
  });
});
