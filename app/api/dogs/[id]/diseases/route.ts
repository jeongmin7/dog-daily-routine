import { getUserId } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
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
    const registered = await prisma.dogDisease.findMany({
      where: { dogId: dog.id },
      include: { disease: { include: { metrics: { orderBy: { sortOrder: "asc" } } } } },
      orderBy: { createdAt: "asc" },
    });
    return NextResponse.json({ data: registered }, { status: 200 });
  } catch {
    return NextResponse.json(
      { error: "지병 정보를 불러오는 중 오류가 발생했습니다." },
      { status: 500 },
    );
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
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
    let body;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { error: "잘못된 요청 형식입니다." },
        { status: 400 },
      );
    }
    const diseaseKey = typeof body?.diseaseKey === "string" ? body.diseaseKey : "";
    const disease = diseaseKey
      ? await prisma.disease.findUnique({ where: { key: diseaseKey } })
      : null;
    if (!disease) {
      return NextResponse.json(
        { error: "유효한 지병이 아닙니다." },
        { status: 400 },
      );
    }
    // 중복 등록 방지(unique) — 이미 있으면 그대로 둠.
    const registered = await prisma.dogDisease.upsert({
      where: { dogId_diseaseKey: { dogId: dog.id, diseaseKey } },
      update: {},
      create: { dogId: dog.id, diseaseKey },
      include: { disease: { include: { metrics: { orderBy: { sortOrder: "asc" } } } } },
    });
    return NextResponse.json({ data: registered }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "지병을 등록하는 중 오류가 발생했습니다." },
      { status: 500 },
    );
  }
}
