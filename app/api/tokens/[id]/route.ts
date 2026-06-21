/* 토큰 revoke(삭제) — 세션 전용 + 소유 확인. */

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const userId = (await auth())?.user?.id;
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const token = await prisma.apiToken.findFirst({ where: { id, userId } });
  if (!token) {
    return NextResponse.json({ error: "토큰을 찾을 수 없습니다." }, { status: 404 });
  }
  await prisma.apiToken.delete({ where: { id } });
  return NextResponse.json({ message: "토큰이 삭제되었습니다." }, { status: 200 });
}
