import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: Request,

  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
  }
  const userId = session.user?.id;
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
    const records = await prisma.dogRecord.findMany({
      where: { dogId: dog.id },
    });
    return NextResponse.json({ data: records }, { status: 200 });
  } catch {
    return NextResponse.json(
      { error: "기록을 불러오는 중 오류가 발생했습니다." },
      { status: 500 },
    );
  }
}

export async function POST(
  req: Request,

  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
  }
  const userId = session.user?.id;
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
    const { date, weight, meal, walkMin, walkKm, poop, memo } = body;
    if (!date) {
      return NextResponse.json(
        { error: "날짜는 필수 입력 항목입니다." },
        { status: 400 },
      );
    }
    const newRecord = await prisma.dogRecord.create({
      data: { date, weight, meal, walkMin, walkKm, poop, memo, dogId: dog.id },
    });
    return NextResponse.json({ data: newRecord }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "기록을 저장하는 중 오류가 발생했습니다." },
      { status: 500 },
    );
  }
}
