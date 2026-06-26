import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/api-auth", () => ({ getUserId: vi.fn() }));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    dog: { findFirst: vi.fn() },
    feedAnalysis: { findMany: vi.fn(), create: vi.fn() },
  },
}));
vi.mock("@vercel/blob", () => ({ put: vi.fn(), del: vi.fn() }));
vi.mock("@/lib/feed-analysis", () => ({
  MODEL: "test-model",
  analyzeFeedLabel: vi.fn(),
}));

import { GET, POST } from "@/app/api/dogs/[id]/feed-analyses/route";
import { getUserId } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { put } from "@vercel/blob";
import { analyzeFeedLabel } from "@/lib/feed-analysis";

const params = Promise.resolve({ id: "dog1" });

function postReq(form: FormData) {
  return new Request("http://t/api/dogs/dog1/feed-analyses", {
    method: "POST",
    body: form,
  });
}
function imageForm() {
  const f = new FormData();
  f.set("file", new File(["x"], "label.jpg", { type: "image/jpeg" }));
  return f;
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("GET feed-analyses", () => {
  it("인증 없으면 401", async () => {
    (getUserId as any).mockResolvedValue(null);
    const res = await GET(new Request("http://t"), { params });
    expect(res.status).toBe(401);
  });
  it("남의 강아지면 404", async () => {
    (getUserId as any).mockResolvedValue("u1");
    (prisma.dog.findFirst as any).mockResolvedValue(null);
    const res = await GET(new Request("http://t"), { params });
    expect(res.status).toBe(404);
    expect((prisma.dog.findFirst as any).mock.calls[0][0].where).toEqual({
      id: "dog1",
      userId: "u1",
    });
  });
  it("이력 목록 200", async () => {
    (getUserId as any).mockResolvedValue("u1");
    (prisma.dog.findFirst as any).mockResolvedValue({ id: "dog1" });
    (prisma.feedAnalysis.findMany as any).mockResolvedValue([{ id: "a1" }]);
    const res = await GET(new Request("http://t"), { params });
    expect(res.status).toBe(200);
    expect((await res.json()).data).toHaveLength(1);
  });
});

describe("POST feed-analyses", () => {
  it("인증 없으면 401", async () => {
    (getUserId as any).mockResolvedValue(null);
    const res = await POST(postReq(imageForm()), { params });
    expect(res.status).toBe(401);
  });
  it("파일 없으면 400", async () => {
    (getUserId as any).mockResolvedValue("u1");
    (prisma.dog.findFirst as any).mockResolvedValue({ id: "dog1" });
    const res = await POST(postReq(new FormData()), { params });
    expect(res.status).toBe(400);
  });
  it("이미지 아니면 400", async () => {
    (getUserId as any).mockResolvedValue("u1");
    (prisma.dog.findFirst as any).mockResolvedValue({ id: "dog1" });
    const f = new FormData();
    f.set("file", new File(["x"], "a.txt", { type: "text/plain" }));
    const res = await POST(postReq(f), { params });
    expect(res.status).toBe(400);
  });
  it("정상: dog.id로 저장하고 201", async () => {
    (getUserId as any).mockResolvedValue("u1");
    (prisma.dog.findFirst as any).mockResolvedValue({
      id: "dog1",
      name: "보리",
      birthdate: null,
      weight: null,
      diseases: [{ disease: { name: "신장병" } }],
    });
    (put as any).mockResolvedValue({ url: "https://blob/label.jpg" });
    (analyzeFeedLabel as any).mockResolvedValue({
      result: {
        rating: 4,
        summary: "좋음",
        nutrients: [],
        cautions: [],
        benefits: [],
      },
      model: "test-model",
    });
    (prisma.feedAnalysis.create as any).mockResolvedValue({ id: "a1" });
    const res = await POST(postReq(imageForm()), { params });
    expect(res.status).toBe(201);
    const createArg = (prisma.feedAnalysis.create as any).mock.calls[0][0];
    expect(createArg.data.dogId).toBe("dog1"); // 클라 입력 아닌 검증된 dog.id
    expect(createArg.data.imageUrl).toBe("https://blob/label.jpg");
    expect(createArg.data.model).toBe("test-model");
  });
  it("AI 실패하면 502 + blob 롤백", async () => {
    (getUserId as any).mockResolvedValue("u1");
    (prisma.dog.findFirst as any).mockResolvedValue({
      id: "dog1",
      name: "보리",
      birthdate: null,
      weight: null,
      diseases: [],
    });
    (put as any).mockResolvedValue({ url: "https://blob/label.jpg" });
    (analyzeFeedLabel as any).mockRejectedValue(new Error("ai down"));
    const { del } = await import("@vercel/blob");
    const res = await POST(postReq(imageForm()), { params });
    expect(res.status).toBe(502);
    expect(del).toHaveBeenCalledWith("https://blob/label.jpg");
    expect(prisma.feedAnalysis.create).not.toHaveBeenCalled();
  });
});
