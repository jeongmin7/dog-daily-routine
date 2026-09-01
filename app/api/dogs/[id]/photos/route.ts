import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { put } from "@vercel/blob";
import { badRequest, requireDog, serverError } from "@/lib/api-guard";

// 서버리스 함수 body 한계를 감안한 업로드 상한.
const MAX_BYTES = 4 * 1024 * 1024;

/* multipart라 zod 스키마를 쓰지 않는다 — 파일 검증은 File 인스턴스 대상이라
   선언적으로 표현할 게 없다. 실패 시 badRequest, 통과 시 {file, caption}. */
async function readUpload(req: Request) {
  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return { error: badRequest("잘못된 요청 형식입니다.") };
  }
  const file = form.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { error: badRequest("이미지 파일이 필요합니다.") };
  }
  if (!file.type.startsWith("image/")) {
    return { error: badRequest("이미지 파일만 업로드할 수 있습니다.") };
  }
  if (file.size > MAX_BYTES) {
    return { error: badRequest("이미지는 4MB 이하만 업로드할 수 있습니다.") };
  }
  const captionRaw = form.get("caption");
  const caption =
    typeof captionRaw === "string" && captionRaw.trim() ? captionRaw.trim() : null;
  return { file, caption };
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const ctx = await requireDog(req, id);
  if (ctx.error) return ctx.error;
  try {
    const photos = await prisma.photo.findMany({
      where: { dogId: ctx.dog.id },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ data: photos }, { status: 200 });
  } catch (e) {
    return serverError(e, "사진을 불러오는 중 오류가 발생했습니다.");
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const ctx = await requireDog(req, id);
  if (ctx.error) return ctx.error;
  const upload = await readUpload(req);
  if (upload.error) return upload.error;
  try {
    const blob = await put(`dogs/${ctx.dog.id}/${upload.file.name}`, upload.file, {
      access: "public",
      addRandomSuffix: true,
    });
    const photo = await prisma.photo.create({
      data: { dogId: ctx.dog.id, url: blob.url, caption: upload.caption },
    });
    return NextResponse.json({ data: photo }, { status: 201 });
  } catch (e) {
    return serverError(e, "사진을 업로드하는 중 오류가 발생했습니다.");
  }
}
