import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(req: Request) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  } else {
    const userId = session.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    try {
      const dogs = await prisma.dog.findMany({ where: { userId: userId } });
      return NextResponse.json({ data: dogs }, { status: 200 });
    } catch {
      return NextResponse.json(
        { error: "강아지 정보를 불러오는 중 오류가 발생했습니다." },
        { status: 500 },
      );
    }
  }
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  } else {
    const userId = session.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    try {
      const { name, breed, birthdate, weight } = await req.json();
      if (!name) {
        return NextResponse.json(
          { error: "이름을 입력해주세요." },
          { status: 400 },
        );
      }
      const newDog = await prisma.dog.create({
        data: { name, breed, birthdate, weight, userId },
      });
      return NextResponse.json({ data: newDog }, { status: 201 });
    } catch {
      return NextResponse.json(
        { error: "강아지 정보를 저장하는 중 오류가 발생했습니다." },
        { status: 500 },
      );
    }
  }
}
