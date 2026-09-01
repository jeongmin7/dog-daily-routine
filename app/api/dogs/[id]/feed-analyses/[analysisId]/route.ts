import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { del } from "@vercel/blob";
import { notFound, requireDog, serverError } from "@/lib/api-guard";

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string; analysisId: string }> },
) {
  const { id, analysisId } = await params;
  const ctx = await requireDog(req, id);
  if (ctx.error) return ctx.error;
  try {
    const analysis = await prisma.feedAnalysis.findFirst({
      where: { id: analysisId, dogId: ctx.dog.id },
    });
    if (!analysis) return notFound("해당 분석을 찾을 수 없습니다.");
    // blob 삭제 실패가 DB 정리를 막지 않게 한다(고아 blob은 감수).
    try {
      await del(analysis.imageUrl);
    } catch {
      /* ignore */
    }
    await prisma.feedAnalysis.delete({ where: { id: analysis.id } });
    return NextResponse.json({ message: "삭제되었습니다." }, { status: 200 });
  } catch (e) {
    return serverError(e, "분석을 삭제하는 중 오류가 발생했습니다.");
  }
}
