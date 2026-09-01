import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseBody, requireDog, serverError } from "@/lib/api-guard";
import { measurementCreate } from "@/lib/schemas";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const ctx = await requireDog(req, id);
  if (ctx.error) return ctx.error;
  try {
    const metricKey = new URL(req.url).searchParams.get("metricKey");
    const measurements = await prisma.measurementSession.findMany({
      where: { dogId: ctx.dog.id, ...(metricKey ? { metricKey } : {}) },
      orderBy: { measuredAt: "asc" },
    });
    return NextResponse.json({ data: measurements }, { status: 200 });
  } catch (e) {
    return serverError(e, "측정 기록을 불러오는 중 오류가 발생했습니다.");
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const ctx = await requireDog(req, id);
  if (ctx.error) return ctx.error;
  const body = await parseBody(req, measurementCreate);
  if (body.error) return body.error;
  try {
    const saved = await prisma.measurementSession.create({
      data: { ...body.data, dogId: ctx.dog.id },
    });
    return NextResponse.json({ data: saved }, { status: 201 });
  } catch (e) {
    return serverError(e, "측정을 저장하는 중 오류가 발생했습니다.");
  }
}
