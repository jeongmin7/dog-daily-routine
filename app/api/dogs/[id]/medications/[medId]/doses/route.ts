import { getUserId } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { kstToday } from "@/lib/kst";
import { NextResponse } from "next/server";

// 3단계 소유 확인(세션 → 강아지 → 약) 후 약을 반환. 실패 시 NextResponse(에러).
async function ownedMed(req: Request, id: string, medId: string) {
  const userId = await getUserId(req);
  if (!userId) {
    return { error: NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 }) };
  }
  const dog = await prisma.dog.findFirst({ where: { id, userId } });
  if (!dog) {
    return { error: NextResponse.json({ error: "해당 강아지를 찾을 수 없습니다." }, { status: 404 }) };
  }
  const med = await prisma.medication.findFirst({
    where: { id: medId, dogId: dog.id },
  });
  if (!med) {
    return { error: NextResponse.json({ error: "해당 약을 찾을 수 없습니다." }, { status: 404 }) };
  }
  return { med };
}

async function readTime(req: Request): Promise<string | null> {
  try {
    const body = await req.json();
    return typeof body?.time === "string" ? body.time : null;
  } catch {
    return null;
  }
}

// 오늘(KST) 슬롯 복용 처리 + 잔량 1 감소.
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string; medId: string }> },
) {
  const { id, medId } = await params;
  const { med, error } = await ownedMed(req, id, medId);
  if (error) return error;
  const time = await readTime(req);
  if (!time) {
    return NextResponse.json({ error: "time이 필요합니다." }, { status: 400 });
  }
  try {
    const date = kstToday();
    await prisma.medicationDose.upsert({
      where: { medicationId_date_time: { medicationId: medId, date, time } },
      create: { medicationId: medId, date, time },
      update: {},
    });
    if (med!.remainingCount != null && med!.remainingCount > 0) {
      await prisma.medication.update({
        where: { id: medId },
        data: { remainingCount: med!.remainingCount - 1 },
      });
    }
    return NextResponse.json({ message: "복용 처리되었습니다." }, { status: 200 });
  } catch {
    return NextResponse.json(
      { error: "복용 처리 중 오류가 발생했습니다." },
      { status: 500 },
    );
  }
}

// 오늘(KST) 슬롯 복용 취소 + (실제 취소됐을 때만) 잔량 1 증가.
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string; medId: string }> },
) {
  const { id, medId } = await params;
  const { med, error } = await ownedMed(req, id, medId);
  if (error) return error;
  const time = await readTime(req);
  if (!time) {
    return NextResponse.json({ error: "time이 필요합니다." }, { status: 400 });
  }
  try {
    const date = kstToday();
    const deleted = await prisma.medicationDose.deleteMany({
      where: { medicationId: medId, date, time },
    });
    if (deleted.count > 0 && med!.remainingCount != null) {
      await prisma.medication.update({
        where: { id: medId },
        data: { remainingCount: med!.remainingCount + 1 },
      });
    }
    return NextResponse.json({ message: "복용이 취소되었습니다." }, { status: 200 });
  } catch {
    return NextResponse.json(
      { error: "복용 취소 중 오류가 발생했습니다." },
      { status: 500 },
    );
  }
}
