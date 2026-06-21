import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/api-auth", () => ({ getUserId: vi.fn() }));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    dog: { findFirst: vi.fn() },
    medication: {
      findMany: vi.fn(),
      create: vi.fn(),
      findFirst: vi.fn(),
      delete: vi.fn(),
      update: vi.fn(),
    },
    medicationDose: { upsert: vi.fn(), deleteMany: vi.fn() },
  },
}));

import { getUserId } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { GET, POST } from "@/app/api/dogs/[id]/medications/route";
import { DELETE as DELETE_MED } from "@/app/api/dogs/[id]/medications/[medId]/route";
import {
  DELETE as UNMARK,
  POST as MARK,
} from "@/app/api/dogs/[id]/medications/[medId]/doses/route";
import { ctx, jsonReq } from "./helpers";

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(getUserId).mockResolvedValue("user-1");
});

describe("POST /api/dogs/[id]/medications", () => {
  it("강아지가 내 소유가 아니면 404", async () => {
    vi.mocked(prisma.dog.findFirst).mockResolvedValue(null as never);
    const res = await POST(jsonReq({ name: "심장약", times: ["08:00"] }), ctx({ id: "d-others" }));
    expect(res.status).toBe(404);
    expect(prisma.medication.create).not.toHaveBeenCalled();
  });

  it("이름이 없으면 400", async () => {
    vi.mocked(prisma.dog.findFirst).mockResolvedValue({ id: "d1" } as never);
    const res = await POST(jsonReq({ times: ["08:00"] }), ctx({ id: "d1" }));
    expect(res.status).toBe(400);
  });

  it("times가 비었거나 형식이 틀리면 400", async () => {
    vi.mocked(prisma.dog.findFirst).mockResolvedValue({ id: "d1" } as never);
    const empty = await POST(jsonReq({ name: "약", times: [] }), ctx({ id: "d1" }));
    expect(empty.status).toBe(400);
    const bad = await POST(jsonReq({ name: "약", times: ["8시"] }), ctx({ id: "d1" }));
    expect(bad.status).toBe(400);
    expect(prisma.medication.create).not.toHaveBeenCalled();
  });

  it("성공 시 약을 만든다", async () => {
    vi.mocked(prisma.dog.findFirst).mockResolvedValue({ id: "d1" } as never);
    vi.mocked(prisma.medication.create).mockResolvedValue({ id: "m1" } as never);
    const res = await POST(
      jsonReq({ name: "심장약", dosage: "5mg", times: ["08:00", "20:00"], remainingCount: 30 }),
      ctx({ id: "d1" }),
    );
    expect(res.status).toBe(201);
    const data = vi.mocked(prisma.medication.create).mock.calls[0][0].data;
    expect(data.dogId).toBe("d1");
    expect(data.times).toEqual(["08:00", "20:00"]);
    expect(data.remainingCount).toBe(30);
  });
});

describe("GET /api/dogs/[id]/medications", () => {
  it("소유 아니면 404", async () => {
    vi.mocked(prisma.dog.findFirst).mockResolvedValue(null as never);
    const res = await GET(new Request("http://test.local"), ctx({ id: "d-others" }));
    expect(res.status).toBe(404);
    expect(prisma.medication.findMany).not.toHaveBeenCalled();
  });
});

describe("DELETE /api/dogs/[id]/medications/[medId]", () => {
  it("남의 약이면 404", async () => {
    vi.mocked(prisma.dog.findFirst).mockResolvedValue({ id: "d1" } as never);
    vi.mocked(prisma.medication.findFirst).mockResolvedValue(null as never);
    const res = await DELETE_MED(new Request("http://test.local", { method: "DELETE" }), ctx({ id: "d1", medId: "m-x" }));
    expect(res.status).toBe(404);
    expect(prisma.medication.delete).not.toHaveBeenCalled();
  });
});

describe("복용 체크 (doses)", () => {
  it("POST 복용 처리 시 잔량 1 감소", async () => {
    vi.mocked(prisma.dog.findFirst).mockResolvedValue({ id: "d1" } as never);
    vi.mocked(prisma.medication.findFirst).mockResolvedValue({ id: "m1", remainingCount: 10 } as never);
    vi.mocked(prisma.medicationDose.upsert).mockResolvedValue({} as never);

    const res = await MARK(jsonReq({ time: "08:00" }), ctx({ id: "d1", medId: "m1" }));
    expect(res.status).toBe(200);
    expect(prisma.medicationDose.upsert).toHaveBeenCalled();
    expect(prisma.medication.update).toHaveBeenCalledWith({
      where: { id: "m1" },
      data: { remainingCount: 9 },
    });
  });

  it("POST에 time 없으면 400", async () => {
    vi.mocked(prisma.dog.findFirst).mockResolvedValue({ id: "d1" } as never);
    vi.mocked(prisma.medication.findFirst).mockResolvedValue({ id: "m1", remainingCount: 10 } as never);
    const res = await MARK(jsonReq({}), ctx({ id: "d1", medId: "m1" }));
    expect(res.status).toBe(400);
    expect(prisma.medicationDose.upsert).not.toHaveBeenCalled();
  });

  it("DELETE 복용 취소가 실제로 지웠으면 잔량 1 증가", async () => {
    vi.mocked(prisma.dog.findFirst).mockResolvedValue({ id: "d1" } as never);
    vi.mocked(prisma.medication.findFirst).mockResolvedValue({ id: "m1", remainingCount: 9 } as never);
    vi.mocked(prisma.medicationDose.deleteMany).mockResolvedValue({ count: 1 } as never);

    const res = await UNMARK(jsonReq({ time: "08:00" }, "DELETE"), ctx({ id: "d1", medId: "m1" }));
    expect(res.status).toBe(200);
    expect(prisma.medication.update).toHaveBeenCalledWith({
      where: { id: "m1" },
      data: { remainingCount: 10 },
    });
  });

  it("DELETE가 아무것도 안 지웠으면 잔량 안 바뀜", async () => {
    vi.mocked(prisma.dog.findFirst).mockResolvedValue({ id: "d1" } as never);
    vi.mocked(prisma.medication.findFirst).mockResolvedValue({ id: "m1", remainingCount: 9 } as never);
    vi.mocked(prisma.medicationDose.deleteMany).mockResolvedValue({ count: 0 } as never);

    const res = await UNMARK(jsonReq({ time: "08:00" }, "DELETE"), ctx({ id: "d1", medId: "m1" }));
    expect(res.status).toBe(200);
    expect(prisma.medication.update).not.toHaveBeenCalled();
  });

  it("남의 약에 복용 처리하면 404", async () => {
    vi.mocked(prisma.dog.findFirst).mockResolvedValue({ id: "d1" } as never);
    vi.mocked(prisma.medication.findFirst).mockResolvedValue(null as never);
    const res = await MARK(jsonReq({ time: "08:00" }), ctx({ id: "d1", medId: "m-x" }));
    expect(res.status).toBe(404);
    expect(prisma.medicationDose.upsert).not.toHaveBeenCalled();
  });
});
