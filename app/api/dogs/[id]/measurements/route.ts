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
    const metricKey = new URL(req.url).searchParams.get("metricKey");
    const measurements = await prisma.measurementSession.findMany({
      where: { dogId: dog.id, ...(metricKey ? { metricKey } : {}) },
      orderBy: { measuredAt: "asc" },
    });
    return NextResponse.json({ data: measurements }, { status: 200 });
  } catch {
    return NextResponse.json(
      { error: "측정 기록을 불러오는 중 오류가 발생했습니다." },
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
    const metricKey = typeof body?.metricKey === "string" ? body.metricKey : "";
    const value = body?.value;
    if (!metricKey) {
      return NextResponse.json({ error: "metricKey가 필요합니다." }, { status: 400 });
    }
    if (typeof value !== "number" || Number.isNaN(value)) {
      return NextResponse.json(
        { error: "value는 숫자여야 합니다." },
        { status: 400 },
      );
    }
    const saved = await prisma.measurementSession.create({
      data: { dogId: dog.id, metricKey, value },
    });
    return NextResponse.json({ data: saved }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "측정을 저장하는 중 오류가 발생했습니다." },
      { status: 500 },
    );
  }
}
