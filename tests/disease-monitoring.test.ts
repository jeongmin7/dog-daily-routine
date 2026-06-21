import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/api-auth", () => ({ getUserId: vi.fn() }));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    dog: { findFirst: vi.fn() },
    disease: { findMany: vi.fn(), findUnique: vi.fn() },
    dogDisease: { findMany: vi.fn(), upsert: vi.fn(), deleteMany: vi.fn() },
    measurementSession: { findMany: vi.fn(), create: vi.fn() },
  },
}));

import { getUserId } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { GET as CATALOG } from "@/app/api/diseases/route";
import { GET as DOG_DISEASES, POST as REGISTER } from "@/app/api/dogs/[id]/diseases/route";
import { DELETE as UNREGISTER } from "@/app/api/dogs/[id]/diseases/[diseaseKey]/route";
import { GET as MEASURES, POST as ADD_MEASURE } from "@/app/api/dogs/[id]/measurements/route";
import { ctx, jsonReq } from "./helpers";

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(getUserId).mockResolvedValue("user-1");
});

describe("GET /api/diseases", () => {
  it("인증 없으면 401", async () => {
    vi.mocked(getUserId).mockResolvedValue(null);
    const res = await CATALOG(new Request("http://test.local"));
    expect(res.status).toBe(401);
  });

  it("인증되면 카탈로그 반환", async () => {
    vi.mocked(prisma.disease.findMany).mockResolvedValue([{ key: "heart" }] as never);
    const res = await CATALOG(new Request("http://test.local"));
    expect(res.status).toBe(200);
    expect((await res.json()).data).toEqual([{ key: "heart" }]);
  });
});

describe("POST /api/dogs/[id]/diseases (등록)", () => {
  it("강아지 소유 아니면 404", async () => {
    vi.mocked(prisma.dog.findFirst).mockResolvedValue(null as never);
    const res = await REGISTER(jsonReq({ diseaseKey: "heart" }), ctx({ id: "d-x" }));
    expect(res.status).toBe(404);
    expect(prisma.dogDisease.upsert).not.toHaveBeenCalled();
  });

  it("없는 지병이면 400", async () => {
    vi.mocked(prisma.dog.findFirst).mockResolvedValue({ id: "d1" } as never);
    vi.mocked(prisma.disease.findUnique).mockResolvedValue(null as never);
    const res = await REGISTER(jsonReq({ diseaseKey: "nope" }), ctx({ id: "d1" }));
    expect(res.status).toBe(400);
    expect(prisma.dogDisease.upsert).not.toHaveBeenCalled();
  });

  it("유효하면 등록(upsert)", async () => {
    vi.mocked(prisma.dog.findFirst).mockResolvedValue({ id: "d1" } as never);
    vi.mocked(prisma.disease.findUnique).mockResolvedValue({ key: "heart" } as never);
    vi.mocked(prisma.dogDisease.upsert).mockResolvedValue({ id: "dd1" } as never);
    const res = await REGISTER(jsonReq({ diseaseKey: "heart" }), ctx({ id: "d1" }));
    expect(res.status).toBe(201);
    expect(prisma.dogDisease.upsert).toHaveBeenCalled();
  });
});

describe("GET dog diseases / DELETE", () => {
  it("GET 소유 아니면 404", async () => {
    vi.mocked(prisma.dog.findFirst).mockResolvedValue(null as never);
    const res = await DOG_DISEASES(new Request("http://test.local"), ctx({ id: "d-x" }));
    expect(res.status).toBe(404);
  });

  it("DELETE 소유 아니면 404 (해제 안 함)", async () => {
    vi.mocked(prisma.dog.findFirst).mockResolvedValue(null as never);
    const res = await UNREGISTER(new Request("http://test.local", { method: "DELETE" }), ctx({ id: "d-x", diseaseKey: "heart" }));
    expect(res.status).toBe(404);
    expect(prisma.dogDisease.deleteMany).not.toHaveBeenCalled();
  });
});

describe("측정 (measurements)", () => {
  it("POST value가 숫자 아니면 400", async () => {
    vi.mocked(prisma.dog.findFirst).mockResolvedValue({ id: "d1" } as never);
    const res = await ADD_MEASURE(jsonReq({ metricKey: "resp_rate", value: "삼십" }), ctx({ id: "d1" }));
    expect(res.status).toBe(400);
    expect(prisma.measurementSession.create).not.toHaveBeenCalled();
  });

  it("POST metricKey 없으면 400", async () => {
    vi.mocked(prisma.dog.findFirst).mockResolvedValue({ id: "d1" } as never);
    const res = await ADD_MEASURE(jsonReq({ value: 22 }), ctx({ id: "d1" }));
    expect(res.status).toBe(400);
  });

  it("POST 유효하면 저장", async () => {
    vi.mocked(prisma.dog.findFirst).mockResolvedValue({ id: "d1" } as never);
    vi.mocked(prisma.measurementSession.create).mockResolvedValue({ id: "ms1" } as never);
    const res = await ADD_MEASURE(jsonReq({ metricKey: "resp_rate", value: 22 }), ctx({ id: "d1" }));
    expect(res.status).toBe(201);
    const data = vi.mocked(prisma.measurementSession.create).mock.calls[0][0].data;
    expect(data.dogId).toBe("d1");
    expect(data.metricKey).toBe("resp_rate");
    expect(data.value).toBe(22);
  });

  it("GET 소유 아니면 404", async () => {
    vi.mocked(prisma.dog.findFirst).mockResolvedValue(null as never);
    const res = await MEASURES(new Request("http://test.local/api/dogs/d-x/measurements?metricKey=resp_rate"), ctx({ id: "d-x" }));
    expect(res.status).toBe(404);
    expect(prisma.measurementSession.findMany).not.toHaveBeenCalled();
  });

  it("GET metricKey로 필터", async () => {
    vi.mocked(prisma.dog.findFirst).mockResolvedValue({ id: "d1" } as never);
    vi.mocked(prisma.measurementSession.findMany).mockResolvedValue([] as never);
    await MEASURES(new Request("http://test.local/api/dogs/d1/measurements?metricKey=resp_rate"), ctx({ id: "d1" }));
    const arg = vi.mocked(prisma.measurementSession.findMany).mock.calls[0][0]!;
    expect(arg.where).toMatchObject({ dogId: "d1", metricKey: "resp_rate" });
  });
});
