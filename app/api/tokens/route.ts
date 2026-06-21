/* 개인 API 토큰 관리 — 세션 전용(토큰으로 토큰을 관리할 수 없게 auth() 직접 사용). */

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateToken, hashToken } from "@/lib/api-auth";
import { NextResponse } from "next/server";

export async function GET() {
  const userId = (await auth())?.user?.id;
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  // 해시·평문은 절대 반환하지 않는다.
  const tokens = await prisma.apiToken.findMany({
    where: { userId },
    select: { id: true, name: true, createdAt: true, lastUsedAt: true },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ data: tokens }, { status: 200 });
}

export async function POST(req: Request) {
  const userId = (await auth())?.user?.id;
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "잘못된 요청 형식입니다." }, { status: 400 });
  }
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  if (!name) {
    return NextResponse.json({ error: "토큰 이름은 필수입니다." }, { status: 400 });
  }

  // 평문 토큰은 응답으로 1회만 노출하고, DB엔 해시만 저장한다.
  const token = generateToken();
  const created = await prisma.apiToken.create({
    data: { userId, name, tokenHash: hashToken(token) },
    select: { id: true, name: true, createdAt: true },
  });
  return NextResponse.json({ data: { ...created, token } }, { status: 201 });
}
