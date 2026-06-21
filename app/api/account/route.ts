import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function DELETE() {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  } else {
    const userId = session.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    try {
      await prisma.user.delete({ where: { id: userId } });
      return NextResponse.json({ message: "Account deleted" }, { status: 200 });
    } catch {
      return NextResponse.json(
        { error: "탈퇴 처리 중 오류가 발생했습니다." },
        { status: 500 },
      );
    }
  }
}
