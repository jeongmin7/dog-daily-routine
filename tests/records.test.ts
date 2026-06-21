import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/auth", () => ({ auth: vi.fn() }));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    dog: { findFirst: vi.fn() },
    dogRecord: { findMany: vi.fn(), create: vi.fn() },
  },
}));

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { GET, POST } from "@/app/api/dogs/[id]/records/route";
import { ctx, jsonReq, SESSION } from "./helpers";

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(auth).mockResolvedValue(SESSION as never);
});

describe("GET /api/dogs/[id]/records", () => {
  it("강아지가 내 소유가 아니면 404 (중첩 소유 확인)", async () => {
    vi.mocked(prisma.dog.findFirst).mockResolvedValue(null as never);
    const res = await GET(new Request("http://test.local"), ctx({ id: "d-others" }));
    expect(res.status).toBe(404);
    expect(prisma.dogRecord.findMany).not.toHaveBeenCalled();
  });
});

describe("POST /api/dogs/[id]/records", () => {
  it("강아지가 내 소유가 아니면 404", async () => {
    vi.mocked(prisma.dog.findFirst).mockResolvedValue(null as never);
    const res = await POST(jsonReq({ date: "2026-06-21" }), ctx({ id: "d-others" }));
    expect(res.status).toBe(404);
    expect(prisma.dogRecord.create).not.toHaveBeenCalled();
  });

  it("date가 없으면 400", async () => {
    vi.mocked(prisma.dog.findFirst).mockResolvedValue({ id: "d1" } as never);
    const res = await POST(jsonReq({ meal: 100 }), ctx({ id: "d1" }));
    expect(res.status).toBe(400);
    expect(prisma.dogRecord.create).not.toHaveBeenCalled();
  });

  it("잘못된 JSON 바디는 400", async () => {
    vi.mocked(prisma.dog.findFirst).mockResolvedValue({ id: "d1" } as never);
    const res = await POST(jsonReq("{not json", "POST"), ctx({ id: "d1" }));
    expect(res.status).toBe(400);
  });

  it("dogId는 body가 아닌 검증된 dog.id를 쓴다", async () => {
    vi.mocked(prisma.dog.findFirst).mockResolvedValue({ id: "d1" } as never);
    vi.mocked(prisma.dogRecord.create).mockResolvedValue({ id: "r1" } as never);

    // 공격: body로 다른 dogId 주입 시도
    const res = await POST(
      jsonReq({ date: "2026-06-21", meal: 130, dogId: "d-others" }),
      ctx({ id: "d1" }),
    );

    expect(res.status).toBe(201);
    const arg = vi.mocked(prisma.dogRecord.create).mock.calls[0][0];
    expect(arg.data.dogId).toBe("d1");
  });
});
