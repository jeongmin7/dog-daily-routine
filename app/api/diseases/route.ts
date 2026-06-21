import { getUserId } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// 지병/지표 마스터 카탈로그. 유저 스코프는 아니지만 인증은 요구.
export async function GET(req: Request) {
  const userId = await getUserId(req);
  if (!userId) {
    return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
  }
  const diseases = await prisma.disease.findMany({
    include: { metrics: { orderBy: { sortOrder: "asc" } } },
    orderBy: { key: "asc" },
  });
  return NextResponse.json({ data: diseases }, { status: 200 });
}
