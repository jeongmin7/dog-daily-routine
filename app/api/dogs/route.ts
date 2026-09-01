import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseBody, requireUser, serverError } from "@/lib/api-guard";
import { dogCreate } from "@/lib/schemas";

export async function GET(req: Request) {
  const ctx = await requireUser(req);
  if (ctx.error) return ctx.error;
  try {
    // ?archived=true 면 보관함(보관된 강아지), 기본은 활성(archivedAt: null)만.
    const archived = new URL(req.url).searchParams.get("archived") === "true";
    const dogs = await prisma.dog.findMany({
      where: { userId: ctx.userId, archivedAt: archived ? { not: null } : null },
    });
    return NextResponse.json({ data: dogs }, { status: 200 });
  } catch (e) {
    return serverError(e, "강아지 정보를 불러오는 중 오류가 발생했습니다.");
  }
}

export async function POST(req: Request) {
  const ctx = await requireUser(req);
  if (ctx.error) return ctx.error;
  const body = await parseBody(req, dogCreate);
  if (body.error) return body.error;
  try {
    // userId는 body가 아니라 검증된 세션 값으로 주입한다.
    const newDog = await prisma.dog.create({
      data: { ...body.data, userId: ctx.userId },
    });
    return NextResponse.json({ data: newDog }, { status: 201 });
  } catch (e) {
    return serverError(e, "강아지 정보를 저장하는 중 오류가 발생했습니다.");
  }
}
