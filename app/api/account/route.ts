import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSessionUser, serverError } from "@/lib/api-guard";

// 탈퇴 — 세션 전용. 대상 id는 클라 입력이 아니라 세션에서만 가져온다.
export async function DELETE() {
  const ctx = await requireSessionUser();
  if (ctx.error) return ctx.error;
  try {
    // 강아지·기록 등은 onDelete: Cascade로 연쇄 삭제된다.
    await prisma.user.delete({ where: { id: ctx.userId } });
    return NextResponse.json({ message: "Account deleted" }, { status: 200 });
  } catch (e) {
    return serverError(e, "탈퇴 처리 중 오류가 발생했습니다.");
  }
}
