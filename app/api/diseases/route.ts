import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser, serverError } from "@/lib/api-guard";

// 지병/지표 마스터 카탈로그. 유저 스코프는 아니지만 인증은 요구.
export async function GET(req: Request) {
  const ctx = await requireUser(req);
  if (ctx.error) return ctx.error;
  try {
    const diseases = await prisma.disease.findMany({
      include: { metrics: { orderBy: { sortOrder: "asc" } } },
      orderBy: { key: "asc" },
    });
    return NextResponse.json({ data: diseases }, { status: 200 });
  } catch (e) {
    return serverError(e, "지병 목록을 불러오는 중 오류가 발생했습니다.");
  }
}
