/* API 라우트 공통 가드 — 인증·소유 확인·body 파싱·에러 응답을 한곳에 모은다.

   라우트는 표준 Next 시그니처를 유지한 채 early return으로 쓴다:

     const ctx = await requireDog(req, id);
     if (ctx.error) return ctx.error;
     // 이후 ctx.dog / ctx.userId 사용 (타입이 좁혀진다)

   고차함수로 핸들러를 감싸지 않는 이유: 라우트가 Next의 표준 시그니처를 그대로
   유지해야 읽는 사람이 한 단계 덜 헤맨다. */

import { NextResponse } from "next/server";
import type { Dog } from "@prisma/client";
import type { ZodType } from "zod";
import { auth } from "@/lib/auth";
import { getUserId } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

/* 가드 결과. error가 있으면 그대로 반환하고, 없으면 T가 채워져 있다.
   error를 optional never로 둬야 `if (ctx.error) return ctx.error` 뒤에서 T로 좁혀진다. */
type Guard<T> = { error: NextResponse } | (T & { error?: undefined });

export function unauthorized() {
  return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
}

export function notFound(message: string) {
  return NextResponse.json({ error: message }, { status: 404 });
}

export function badRequest(message: string) {
  return NextResponse.json({ error: message }, { status: 400 });
}

/* 원인은 서버 로그에만 남긴다. 응답에 실으면 내부 구조가 노출된다.
   catch를 `catch {}`로 두면 원인이 통째로 사라져 장애 때 추적이 불가능하다. */
export function serverError(e: unknown, message: string) {
  console.error(message, e);
  return NextResponse.json({ error: message }, { status: 500 });
}

/* 세션 쿠키 또는 Bearer 토큰.
   Bearer 경로는 DB를 조회하므로 여기서 터질 수 있다. 가드가 직접 500을
   만들어 돌려줘야 라우트가 try 밖에서 가드를 호출해도 JSON 응답이 보장된다. */
export async function requireUser(
  req: Request,
): Promise<Guard<{ userId: string }>> {
  let userId: string | null;
  try {
    userId = await getUserId(req);
  } catch (e) {
    return { error: serverError(e, "인증 처리 중 오류가 발생했습니다.") };
  }
  if (!userId) return { error: unauthorized() };
  return { userId };
}

/* 세션 전용 — Bearer를 받지 않는다.
   토큰으로 토큰을 발급/삭제할 수 있으면 탈취된 토큰이 스스로를 갱신하는
   권한 상승이 된다. 토큰 관리와 탈퇴는 이 가드를 쓴다. */
export async function requireSessionUser(): Promise<Guard<{ userId: string }>> {
  let userId: string | undefined;
  try {
    userId = (await auth())?.user?.id;
  } catch (e) {
    return { error: serverError(e, "인증 처리 중 오류가 발생했습니다.") };
  }
  if (!userId) return { error: unauthorized() };
  return { userId };
}

/* 인증 + 강아지 소유 확인.
   남의 강아지는 403이 아니라 404다 — 존재 여부 자체를 알려주지 않는다. */
export async function requireDog(
  req: Request,
  id: string,
): Promise<Guard<{ userId: string; dog: Dog }>> {
  const user = await requireUser(req);
  if (user.error) return { error: user.error };
  let dog: Dog | null;
  try {
    dog = await prisma.dog.findFirst({ where: { id, userId: user.userId } });
  } catch (e) {
    return { error: serverError(e, "강아지 정보를 불러오는 중 오류가 발생했습니다.") };
  }
  if (!dog) return { error: notFound("해당 강아지를 찾을 수 없습니다.") };
  return { userId: user.userId, dog };
}

/* JSON body 파싱 + 스키마 검증.
   zod가 스키마에 없는 키를 잘라내므로 이것이 mass assignment 방어선이다
   — 파싱 결과를 그대로 Prisma에 넘겨도 화이트리스트가 유지된다. */
export async function parseBody<T>(
  req: Request,
  schema: ZodType<T>,
): Promise<Guard<{ data: T }>> {
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return { error: badRequest("잘못된 요청 형식입니다.") };
  }
  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    return { error: badRequest(parsed.error.issues[0]?.message ?? "잘못된 요청입니다.") };
  }
  return { data: parsed.data };
}
