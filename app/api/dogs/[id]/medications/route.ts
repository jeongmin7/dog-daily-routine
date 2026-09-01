import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { kstToday } from "@/lib/kst";
import { parseBody, requireDog, serverError } from "@/lib/api-guard";
import { medicationCreate } from "@/lib/schemas";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const ctx = await requireDog(req, id);
  if (ctx.error) return ctx.error;
  try {
    // 각 약에 오늘(KST) 복용한 슬롯만 포함 → UI가 체크 상태를 안다.
    const medications = await prisma.medication.findMany({
      where: { dogId: ctx.dog.id },
      orderBy: { createdAt: "asc" },
      include: { doses: { where: { date: kstToday() } } },
    });
    return NextResponse.json({ data: medications }, { status: 200 });
  } catch (e) {
    return serverError(e, "약 정보를 불러오는 중 오류가 발생했습니다.");
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const ctx = await requireDog(req, id);
  if (ctx.error) return ctx.error;
  const body = await parseBody(req, medicationCreate);
  if (body.error) return body.error;
  try {
    const med = await prisma.medication.create({
      data: { ...body.data, dogId: ctx.dog.id },
    });
    return NextResponse.json({ data: med }, { status: 201 });
  } catch (e) {
    return serverError(e, "약을 저장하는 중 오류가 발생했습니다.");
  }
}
