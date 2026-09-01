import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { kstToday } from "@/lib/kst";
import { notFound, parseBody, requireDog, serverError } from "@/lib/api-guard";
import { doseToggle } from "@/lib/schemas";

// 오늘(KST) 슬롯 복용 처리 + 잔량 1 감소.
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string; medId: string }> },
) {
  const { id, medId } = await params;
  const ctx = await requireDog(req, id);
  if (ctx.error) return ctx.error;
  const body = await parseBody(req, doseToggle);
  if (body.error) return body.error;
  try {
    const med = await prisma.medication.findFirst({
      where: { id: medId, dogId: ctx.dog.id },
    });
    if (!med) return notFound("해당 약을 찾을 수 없습니다.");
    const date = kstToday();
    await prisma.medicationDose.upsert({
      where: {
        medicationId_date_time: { medicationId: med.id, date, time: body.data.time },
      },
      create: { medicationId: med.id, date, time: body.data.time },
      update: {},
    });
    if (med.remainingCount != null && med.remainingCount > 0) {
      await prisma.medication.update({
        where: { id: med.id },
        data: { remainingCount: med.remainingCount - 1 },
      });
    }
    return NextResponse.json({ message: "복용 처리되었습니다." }, { status: 200 });
  } catch (e) {
    return serverError(e, "복용 처리 중 오류가 발생했습니다.");
  }
}

// 오늘(KST) 슬롯 복용 취소 + (실제 취소됐을 때만) 잔량 1 증가.
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string; medId: string }> },
) {
  const { id, medId } = await params;
  const ctx = await requireDog(req, id);
  if (ctx.error) return ctx.error;
  const body = await parseBody(req, doseToggle);
  if (body.error) return body.error;
  try {
    const med = await prisma.medication.findFirst({
      where: { id: medId, dogId: ctx.dog.id },
    });
    if (!med) return notFound("해당 약을 찾을 수 없습니다.");
    const deleted = await prisma.medicationDose.deleteMany({
      where: { medicationId: med.id, date: kstToday(), time: body.data.time },
    });
    if (deleted.count > 0 && med.remainingCount != null) {
      await prisma.medication.update({
        where: { id: med.id },
        data: { remainingCount: med.remainingCount + 1 },
      });
    }
    return NextResponse.json({ message: "복용이 취소되었습니다." }, { status: 200 });
  } catch (e) {
    return serverError(e, "복용 취소 중 오류가 발생했습니다.");
  }
}
