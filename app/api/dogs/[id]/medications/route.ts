import { getUserId } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { kstToday } from "@/lib/kst";
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
    // 각 약에 오늘(KST) 복용한 슬롯만 포함 → UI가 체크 상태를 안다.
    const medications = await prisma.medication.findMany({
      where: { dogId: dog.id },
      orderBy: { createdAt: "asc" },
      include: { doses: { where: { date: kstToday() } } },
    });
    return NextResponse.json({ data: medications }, { status: 200 });
  } catch {
    return NextResponse.json(
      { error: "약 정보를 불러오는 중 오류가 발생했습니다." },
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
    const { name, dosage, times, remainingCount } = body ?? {};
    if (typeof name !== "string" || !name.trim()) {
      return NextResponse.json({ error: "약 이름은 필수입니다." }, { status: 400 });
    }
    if (
      !Array.isArray(times) ||
      times.length === 0 ||
      !times.every((t) => typeof t === "string" && /^\d{2}:\d{2}$/.test(t))
    ) {
      return NextResponse.json(
        { error: "복용 시간(HH:MM)을 한 개 이상 입력해주세요." },
        { status: 400 },
      );
    }
    const med = await prisma.medication.create({
      data: {
        dogId: dog.id,
        name: name.trim(),
        dosage: typeof dosage === "string" && dosage.trim() ? dosage.trim() : null,
        times,
        remainingCount:
          typeof remainingCount === "number" && remainingCount >= 0
            ? remainingCount
            : null,
      },
    });
    return NextResponse.json({ data: med }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "약을 저장하는 중 오류가 발생했습니다." },
      { status: 500 },
    );
  }
}
