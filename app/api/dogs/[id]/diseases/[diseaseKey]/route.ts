import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireDog, serverError } from "@/lib/api-guard";

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string; diseaseKey: string }> },
) {
  const { id, diseaseKey } = await params;
  const ctx = await requireDog(req, id);
  if (ctx.error) return ctx.error;
  try {
    await prisma.dogDisease.deleteMany({
      where: { dogId: ctx.dog.id, diseaseKey },
    });
    return NextResponse.json({ message: "지병이 해제되었습니다." }, { status: 200 });
  } catch (e) {
    return serverError(e, "지병을 해제하는 중 오류가 발생했습니다.");
  }
}
