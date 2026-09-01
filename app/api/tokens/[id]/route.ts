/* 토큰 revoke(삭제) — 세션 전용 + 소유 확인. */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { notFound, requireSessionUser, serverError } from "@/lib/api-guard";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const ctx = await requireSessionUser();
  if (ctx.error) return ctx.error;
  try {
    const token = await prisma.apiToken.findFirst({
      where: { id, userId: ctx.userId },
    });
    if (!token) return notFound("토큰을 찾을 수 없습니다.");
    await prisma.apiToken.delete({ where: { id: token.id } });
    return NextResponse.json({ message: "토큰이 삭제되었습니다." }, { status: 200 });
  } catch (e) {
    return serverError(e, "토큰을 삭제하는 중 오류가 발생했습니다.");
  }
}
