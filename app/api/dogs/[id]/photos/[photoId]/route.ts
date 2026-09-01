import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { del } from "@vercel/blob";
import { notFound, requireDog, serverError } from "@/lib/api-guard";

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string; photoId: string }> },
) {
  const { id, photoId } = await params;
  const ctx = await requireDog(req, id);
  if (ctx.error) return ctx.error;
  try {
    const photo = await prisma.photo.findFirst({
      where: { id: photoId, dogId: ctx.dog.id },
    });
    if (!photo) return notFound("해당 사진을 찾을 수 없습니다.");
    await del(photo.url);
    await prisma.photo.delete({ where: { id: photo.id } });
    return NextResponse.json({ message: "사진이 삭제되었습니다." }, { status: 200 });
  } catch (e) {
    return serverError(e, "사진을 삭제하는 중 오류가 발생했습니다.");
  }
}
