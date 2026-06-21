/* 통합 인증 — API 라우트는 이 헬퍼로 userId를 얻는다.
   1) Authorization: Bearer <token> 가 있으면 토큰 인증(개인 API 토큰).
   2) 없으면 NextAuth 세션 쿠키로 폴백.
   둘 다 없으면 null → 라우트가 401을 반환한다. */

import { createHash, randomBytes } from "node:crypto";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const PREFIX = "haru_";

// 평문 토큰 생성(표시는 1회만). prefix는 식별용일 뿐 해시는 prefix 포함 전체 문자열로.
export function generateToken(): string {
  return PREFIX + randomBytes(32).toString("base64url");
}

// 저장·검증에 동일하게 쓰는 해시(sha256 hex). 토큰은 고엔트로피라 sha256로 충분.
export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

function bearerToken(req: Request): string | null {
  const header = req.headers.get("authorization");
  if (!header?.startsWith("Bearer ")) return null;
  const token = header.slice("Bearer ".length).trim();
  return token || null;
}

export async function getUserId(req: Request): Promise<string | null> {
  const token = bearerToken(req);
  if (token) {
    const record = await prisma.apiToken.findUnique({
      where: { tokenHash: hashToken(token) },
    });
    if (!record) return null;
    // 마지막 사용 시각 갱신(실패해도 인증은 통과시킨다).
    try {
      await prisma.apiToken.update({
        where: { id: record.id },
        data: { lastUsedAt: new Date() },
      });
    } catch {
      /* ignore */
    }
    return record.userId;
  }

  const session = await auth();
  return session?.user?.id ?? null;
}
