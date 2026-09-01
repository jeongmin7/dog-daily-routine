import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseBody, requireDog, serverError } from "@/lib/api-guard";
import { recordCreate } from "@/lib/schemas";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const ctx = await requireDog(req, id);
  if (ctx.error) return ctx.error;
  try {
    const records = await prisma.dogRecord.findMany({
      where: { dogId: ctx.dog.id },
    });
    return NextResponse.json({ data: records }, { status: 200 });
  } catch (e) {
    return serverError(e, "기록을 불러오는 중 오류가 발생했습니다.");
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const ctx = await requireDog(req, id);
  if (ctx.error) return ctx.error;
  const body = await parseBody(req, recordCreate);
  if (body.error) return body.error;
  try {
    // dogId는 body가 아니라 소유 확인을 통과한 dog.id를 쓴다.
    const newRecord = await prisma.dogRecord.create({
      data: { ...body.data, dogId: ctx.dog.id },
    });
    return NextResponse.json({ data: newRecord }, { status: 201 });
  } catch (e) {
    return serverError(e, "기록을 저장하는 중 오류가 발생했습니다.");
  }
}
