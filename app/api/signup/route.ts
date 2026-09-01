import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/password";
import { parseBody, serverError } from "@/lib/api-guard";
import { signupCreate } from "@/lib/schemas";

// 유일하게 인증이 필요 없는 라우트.
export async function POST(req: Request) {
  const body = await parseBody(req, signupCreate);
  if (body.error) return body.error;
  const { email, password, name } = body.data;
  try {
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json({ error: "이미 가입된 이메일입니다." }, { status: 409 });
    }
    const user = await prisma.user.create({
      data: { email, name: name ?? null, password: await hashPassword(password) },
      select: { id: true, email: true, name: true, createdAt: true },
    });
    return NextResponse.json({ user }, { status: 201 });
  } catch (e) {
    return serverError(e, "회원가입 처리 중 오류가 발생했습니다.");
  }
}
