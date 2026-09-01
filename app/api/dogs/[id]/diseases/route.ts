import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { badRequest, parseBody, requireDog, serverError } from "@/lib/api-guard";
import { diseaseRegister } from "@/lib/schemas";

const withMetrics = {
  disease: { include: { metrics: { orderBy: { sortOrder: "asc" as const } } } },
};

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const ctx = await requireDog(req, id);
  if (ctx.error) return ctx.error;
  try {
    const registered = await prisma.dogDisease.findMany({
      where: { dogId: ctx.dog.id },
      include: withMetrics,
      orderBy: { createdAt: "asc" },
    });
    return NextResponse.json({ data: registered }, { status: 200 });
  } catch (e) {
    return serverError(e, "지병 정보를 불러오는 중 오류가 발생했습니다.");
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const ctx = await requireDog(req, id);
  if (ctx.error) return ctx.error;
  const body = await parseBody(req, diseaseRegister);
  if (body.error) return body.error;
  try {
    // 카탈로그에 없는 key는 등록을 거부한다(마스터 데이터 무결성).
    const { diseaseKey } = body.data;
    const disease = await prisma.disease.findUnique({ where: { key: diseaseKey } });
    if (!disease) return badRequest("유효한 지병이 아닙니다.");
    // 중복 등록 방지(unique) — 이미 있으면 그대로 둠.
    const registered = await prisma.dogDisease.upsert({
      where: { dogId_diseaseKey: { dogId: ctx.dog.id, diseaseKey } },
      update: {},
      create: { dogId: ctx.dog.id, diseaseKey },
      include: withMetrics,
    });
    return NextResponse.json({ data: registered }, { status: 201 });
  } catch (e) {
    return serverError(e, "지병을 등록하는 중 오류가 발생했습니다.");
  }
}
