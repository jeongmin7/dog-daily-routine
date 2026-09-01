import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseBody, requireDog, serverError } from "@/lib/api-guard";
import { dogArchive } from "@/lib/schemas";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const ctx = await requireDog(req, id);
  if (ctx.error) return ctx.error;
  return NextResponse.json({ data: ctx.dog }, { status: 200 });
}

// 보관(archived:true) / 복원(archived:false) 토글. soft delete.
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const ctx = await requireDog(req, id);
  if (ctx.error) return ctx.error;
  const body = await parseBody(req, dogArchive);
  if (body.error) return body.error;
  try {
    const updated = await prisma.dog.update({
      where: { id: ctx.dog.id },
      data: { archivedAt: body.data.archived ? new Date() : null },
    });
    return NextResponse.json({ data: updated }, { status: 200 });
  } catch (e) {
    return serverError(e, "강아지 정보를 수정하는 중 오류가 발생했습니다.");
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const ctx = await requireDog(req, id);
  if (ctx.error) return ctx.error;
  try {
    // 기록·사진·약 등은 스키마의 onDelete: Cascade로 연쇄 삭제된다.
    await prisma.dog.delete({ where: { id: ctx.dog.id } });
    return NextResponse.json({ message: "Dog deleted successfully" }, { status: 200 });
  } catch (e) {
    return serverError(e, "강아지 정보를 삭제하는 중 오류가 발생했습니다.");
  }
}
