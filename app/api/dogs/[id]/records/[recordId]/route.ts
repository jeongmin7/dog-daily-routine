import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: Request,

  { params }: { params: Promise<{ id: string; recordId: string }> },
) {
  const { id, recordId } = await params;
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
    const record = await prisma.dogRecord.findFirst({
      where: { id: recordId, dogId: dog.id },
    });
    if (!record) {
      return NextResponse.json(
        { error: "해당 기록을 찾을 수 없습니다." },
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
    const updatedRecord = await prisma.dogRecord.update({
      where: { id: recordId },
      data: { date, weight, meal, walkMin, walkKm, poop, memo },
    });
    return NextResponse.json({ data: updatedRecord }, { status: 200 });
  } catch {
    return NextResponse.json(
      { error: "기록을 수정하는 중 오류가 발생했습니다." },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string; recordId: string }> },
) {
  const { id, recordId } = await params;
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
    const record = await prisma.dogRecord.findFirst({
      where: { id: recordId, dogId: dog.id },
    });
    if (!record) {
      return NextResponse.json(
        { error: "해당 기록을 찾을 수 없습니다." },
        { status: 404 },
      );
    }
    await prisma.dogRecord.delete({ where: { id: recordId } });
    return NextResponse.json(
      { message: "기록이 삭제되었습니다." },
      { status: 200 },
    );
  } catch {
    return NextResponse.json(
      { error: "기록을 삭제하는 중 오류가 발생했습니다." },
      { status: 500 },
    );
  }
}
