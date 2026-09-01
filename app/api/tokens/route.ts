/* 개인 API 토큰 관리 — 세션 전용(토큰으로 토큰을 관리할 수 없게 한다). */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateToken, hashToken } from "@/lib/api-auth";
import { parseBody, requireSessionUser, serverError } from "@/lib/api-guard";
import { tokenCreate } from "@/lib/schemas";

export async function GET() {
  const ctx = await requireSessionUser();
  if (ctx.error) return ctx.error;
  try {
    // 해시·평문은 절대 반환하지 않는다.
    const tokens = await prisma.apiToken.findMany({
      where: { userId: ctx.userId },
      select: { id: true, name: true, createdAt: true, lastUsedAt: true },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ data: tokens }, { status: 200 });
  } catch (e) {
    return serverError(e, "토큰을 불러오는 중 오류가 발생했습니다.");
  }
}

export async function POST(req: Request) {
  const ctx = await requireSessionUser();
  if (ctx.error) return ctx.error;
  const body = await parseBody(req, tokenCreate);
  if (body.error) return body.error;
  try {
    // 평문 토큰은 응답으로 1회만 노출하고, DB엔 해시만 저장한다.
    const token = generateToken();
    const created = await prisma.apiToken.create({
      data: { userId: ctx.userId, name: body.data.name, tokenHash: hashToken(token) },
      select: { id: true, name: true, createdAt: true },
    });
    return NextResponse.json({ data: { ...created, token } }, { status: 201 });
  } catch (e) {
    return serverError(e, "토큰을 발급하는 중 오류가 발생했습니다.");
  }
}
