import { getUserId } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string; medId: string }> },
) {
  const { id, medId } = await params;
  const userId = await getUserId(req);
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
    const med = await prisma.medication.findFirst({
      where: { id: medId, dogId: dog.id },
    });
    if (!med) {
      return NextResponse.json(
        { error: "해당 약을 찾을 수 없습니다." },
        { status: 404 },
      );
    }
    await prisma.medication.delete({ where: { id: medId } });
    return NextResponse.json({ message: "약이 삭제되었습니다." }, { status: 200 });
  } catch {
    return NextResponse.json(
      { error: "약을 삭제하는 중 오류가 발생했습니다." },
      { status: 500 },
    );
  }
}
