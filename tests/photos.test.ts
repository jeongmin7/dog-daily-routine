import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/api-auth", () => ({ getUserId: vi.fn() }));
vi.mock("@vercel/blob", () => ({ put: vi.fn(), del: vi.fn() }));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    dog: { findFirst: vi.fn() },
    photo: { findMany: vi.fn(), create: vi.fn(), findFirst: vi.fn(), delete: vi.fn() },
  },
}));

import { getUserId } from "@/lib/api-auth";
import { del, put } from "@vercel/blob";
import { prisma } from "@/lib/prisma";
import { GET, POST } from "@/app/api/dogs/[id]/photos/route";
import { DELETE } from "@/app/api/dogs/[id]/photos/[photoId]/route";
import { ctx } from "./helpers";

function uploadReq(file?: File, caption?: string): Request {
  const form = new FormData();
  if (file) form.append("file", file);
  if (caption) form.append("caption", caption);
  return new Request("http://test.local", { method: "POST", body: form });
}

const imageFile = () =>
  new File([new Uint8Array([1, 2, 3])], "bori.jpg", { type: "image/jpeg" });

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(getUserId).mockResolvedValue("user-1");
});

describe("GET /api/dogs/[id]/photos", () => {
  it("강아지가 내 소유가 아니면 404", async () => {
    vi.mocked(prisma.dog.findFirst).mockResolvedValue(null as never);
    const res = await GET(new Request("http://test.local"), ctx({ id: "d-others" }));
    expect(res.status).toBe(404);
    expect(prisma.photo.findMany).not.toHaveBeenCalled();
  });
});

describe("POST /api/dogs/[id]/photos", () => {
  it("강아지가 내 소유가 아니면 404 (업로드 안 함)", async () => {
    vi.mocked(prisma.dog.findFirst).mockResolvedValue(null as never);
    const res = await POST(uploadReq(imageFile()), ctx({ id: "d-others" }));
    expect(res.status).toBe(404);
    expect(put).not.toHaveBeenCalled();
  });

  it("파일이 없으면 400", async () => {
    vi.mocked(prisma.dog.findFirst).mockResolvedValue({ id: "d1" } as never);
    const res = await POST(uploadReq(), ctx({ id: "d1" }));
    expect(res.status).toBe(400);
    expect(put).not.toHaveBeenCalled();
  });

  it("이미지가 아니면 400", async () => {
    vi.mocked(prisma.dog.findFirst).mockResolvedValue({ id: "d1" } as never);
    const txt = new File(["hello"], "a.txt", { type: "text/plain" });
    const res = await POST(uploadReq(txt), ctx({ id: "d1" }));
    expect(res.status).toBe(400);
    expect(put).not.toHaveBeenCalled();
  });

  it("성공 시 Blob에 올리고 Photo를 만든다", async () => {
    vi.mocked(prisma.dog.findFirst).mockResolvedValue({ id: "d1" } as never);
    vi.mocked(put).mockResolvedValue({ url: "https://blob/bori.jpg" } as never);
    vi.mocked(prisma.photo.create).mockResolvedValue({ id: "p1" } as never);

    const res = await POST(uploadReq(imageFile(), "산책 중"), ctx({ id: "d1" }));

    expect(res.status).toBe(201);
    expect(put).toHaveBeenCalledTimes(1);
    const createArg = vi.mocked(prisma.photo.create).mock.calls[0][0];
    expect(createArg.data.dogId).toBe("d1");
    expect(createArg.data.url).toBe("https://blob/bori.jpg");
    expect(createArg.data.caption).toBe("산책 중");
  });
});

describe("DELETE /api/dogs/[id]/photos/[photoId]", () => {
  it("남의 사진이면 404이고 Blob 삭제 안 함", async () => {
    vi.mocked(prisma.dog.findFirst).mockResolvedValue({ id: "d1" } as never);
    vi.mocked(prisma.photo.findFirst).mockResolvedValue(null as never);
    const res = await DELETE(
      new Request("http://test.local", { method: "DELETE" }),
      ctx({ id: "d1", photoId: "p-others" }),
    );
    expect(res.status).toBe(404);
    expect(del).not.toHaveBeenCalled();
    expect(prisma.photo.delete).not.toHaveBeenCalled();
  });

  it("내 사진은 Blob+행 삭제 후 200", async () => {
    vi.mocked(prisma.dog.findFirst).mockResolvedValue({ id: "d1" } as never);
    vi.mocked(prisma.photo.findFirst).mockResolvedValue({
      id: "p1",
      url: "https://blob/bori.jpg",
    } as never);
    vi.mocked(del).mockResolvedValue(undefined as never);
    vi.mocked(prisma.photo.delete).mockResolvedValue({ id: "p1" } as never);

    const res = await DELETE(
      new Request("http://test.local", { method: "DELETE" }),
      ctx({ id: "d1", photoId: "p1" }),
    );
    expect(res.status).toBe(200);
    expect(del).toHaveBeenCalledWith("https://blob/bori.jpg");
    expect(prisma.photo.delete).toHaveBeenCalledWith({ where: { id: "p1" } });
  });
});
