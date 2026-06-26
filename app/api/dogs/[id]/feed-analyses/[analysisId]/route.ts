import { getUserId } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { del } from "@vercel/blob";
import { NextResponse } from "next/server";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string; analysisId: string }> },
) {
  const { id, analysisId } = await params;
  const userId = await getUserId(_req);
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
    const analysis = await prisma.feedAnalysis.findFirst({
      where: { id: analysisId, dogId: dog.id },
    });
    if (!analysis) {
      return NextResponse.json(
        { error: "해당 분석을 찾을 수 없습니다." },
        { status: 404 },
      );
    }
    try {
      await del(analysis.imageUrl);
    } catch {}
    await prisma.feedAnalysis.delete({ where: { id: analysis.id } });
    return NextResponse.json({ message: "삭제되었습니다." }, { status: 200 });
  } catch {
    return NextResponse.json(
      { error: "분석을 삭제하는 중 오류가 발생했습니다." },
      { status: 500 },
    );
  }
}
