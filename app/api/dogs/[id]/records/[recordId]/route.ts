import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { notFound, parseBody, requireDog, serverError } from "@/lib/api-guard";
import { recordUpdate } from "@/lib/schemas";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string; recordId: string }> },
) {
  const { id, recordId } = await params;
  const ctx = await requireDog(req, id);
  if (ctx.error) return ctx.error;
  const body = await parseBody(req, recordUpdate);
  if (body.error) return body.error;
  try {
    // 내 강아지 id + 남의 기록 id 조합을 막는다.
    const record = await prisma.dogRecord.findFirst({
      where: { id: recordId, dogId: ctx.dog.id },
    });
    if (!record) return notFound("해당 기록을 찾을 수 없습니다.");
    const updatedRecord = await prisma.dogRecord.update({
      where: { id: record.id },
      data: body.data,
    });
    return NextResponse.json({ data: updatedRecord }, { status: 200 });
  } catch (e) {
    return serverError(e, "기록을 수정하는 중 오류가 발생했습니다.");
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string; recordId: string }> },
) {
  const { id, recordId } = await params;
  const ctx = await requireDog(req, id);
  if (ctx.error) return ctx.error;
  try {
    const record = await prisma.dogRecord.findFirst({
      where: { id: recordId, dogId: ctx.dog.id },
    });
    if (!record) return notFound("해당 기록을 찾을 수 없습니다.");
    await prisma.dogRecord.delete({ where: { id: record.id } });
    return NextResponse.json({ message: "기록이 삭제되었습니다." }, { status: 200 });
  } catch (e) {
    return serverError(e, "기록을 삭제하는 중 오류가 발생했습니다.");
  }
}
