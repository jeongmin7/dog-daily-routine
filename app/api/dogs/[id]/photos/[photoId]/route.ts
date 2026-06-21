import { getUserId } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { del } from "@vercel/blob";
import { NextResponse } from "next/server";

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string; photoId: string }> },
) {
  const { id, photoId } = await params;
  const userId = await getUserId(req);
  if (!userId) {
    return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
  }
  try {
    // 3단계 소유 확인: 세션 user → 강아지 → 사진.
    const dog = await prisma.dog.findFirst({ where: { id, userId } });
    if (!dog) {
      return NextResponse.json(
        { error: "해당 강아지를 찾을 수 없습니다." },
        { status: 404 },
      );
    }
    const photo = await prisma.photo.findFirst({
      where: { id: photoId, dogId: dog.id },
    });
    if (!photo) {
      return NextResponse.json(
        { error: "해당 사진을 찾을 수 없습니다." },
        { status: 404 },
      );
    }
    await del(photo.url);
    await prisma.photo.delete({ where: { id: photoId } });
    return NextResponse.json({ message: "사진이 삭제되었습니다." }, { status: 200 });
  } catch {
    return NextResponse.json(
      { error: "사진을 삭제하는 중 오류가 발생했습니다." },
      { status: 500 },
    );
  }
}
