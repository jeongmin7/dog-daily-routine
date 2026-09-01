import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { notFound, requireDog, serverError } from "@/lib/api-guard";

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string; medId: string }> },
) {
  const { id, medId } = await params;
  const ctx = await requireDog(req, id);
  if (ctx.error) return ctx.error;
  try {
    const med = await prisma.medication.findFirst({
      where: { id: medId, dogId: ctx.dog.id },
    });
    if (!med) return notFound("해당 약을 찾을 수 없습니다.");
    await prisma.medication.delete({ where: { id: med.id } });
    return NextResponse.json({ message: "약이 삭제되었습니다." }, { status: 200 });
  } catch (e) {
    return serverError(e, "약을 삭제하는 중 오류가 발생했습니다.");
  }
}
