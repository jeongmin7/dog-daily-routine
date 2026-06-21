import { getUserId } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { put } from "@vercel/blob";
import { NextResponse } from "next/server";

// 서버리스 함수 body 한계를 감안한 업로드 상한.
const MAX_BYTES = 4 * 1024 * 1024;

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const userId = await getUserId(req);
  if (!userId) {
    return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
  }
  try {
    const dog = await prisma.dog.findFirst({ where: { id, userId } });
    if (!dog) {
      return NextResponse.json(
        { error: "해당 강아지를 찾을 수 없습니다." },
        { status: 404 },
      );
    }
    const photos = await prisma.photo.findMany({
      where: { dogId: dog.id },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ data: photos }, { status: 200 });
  } catch {
    return NextResponse.json(
      { error: "사진을 불러오는 중 오류가 발생했습니다." },
      { status: 500 },
    );
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const userId = await getUserId(req);
  if (!userId) {
    return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
  }
  try {
    const dog = await prisma.dog.findFirst({ where: { id, userId } });
    if (!dog) {
      return NextResponse.json(
        { error: "해당 강아지를 찾을 수 없습니다." },
        { status: 404 },
      );
    }

    let form: FormData;
    try {
      form = await req.formData();
    } catch {
      return NextResponse.json(
        { error: "잘못된 요청 형식입니다." },
        { status: 400 },
      );
    }
    const file = form.get("file");
    if (!(file instanceof File) || file.size === 0) {
      return NextResponse.json(
        { error: "이미지 파일이 필요합니다." },
        { status: 400 },
      );
    }
    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        { error: "이미지 파일만 업로드할 수 있습니다." },
        { status: 400 },
      );
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json(
        { error: "이미지는 4MB 이하만 업로드할 수 있습니다." },
        { status: 400 },
      );
    }
    const captionRaw = form.get("caption");
    const caption =
      typeof captionRaw === "string" && captionRaw.trim()
        ? captionRaw.trim()
        : null;

    const blob = await put(`dogs/${dog.id}/${file.name}`, file, {
      access: "public",
      addRandomSuffix: true,
    });
    const photo = await prisma.photo.create({
      data: { dogId: dog.id, url: blob.url, caption },
    });
    return NextResponse.json({ data: photo }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "사진을 업로드하는 중 오류가 발생했습니다." },
      { status: 500 },
    );
  }
}
