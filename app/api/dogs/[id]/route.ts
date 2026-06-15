import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  } else {
    const userId = session.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    try {
      const dog = await prisma.dog.findFirst({ where: { id, userId } });
      if (!dog) {
        return NextResponse.json({ error: "Dog not found" }, { status: 404 });
      }
      return NextResponse.json({ data: dog }, { status: 200 });
    } catch {
      return NextResponse.json(
        { error: "강아지 정보를 불러오는 중 오류가 발생했습니다." },
        { status: 500 },
      );
    }
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  } else {
    const userId = session.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    try {
      const dog = await prisma.dog.findFirst({ where: { id, userId } });
      if (!dog) {
        return NextResponse.json({ error: "Dog not found" }, { status: 404 });
      }
      await prisma.dog.delete({ where: { id } });
      return NextResponse.json(
        { message: "Dog deleted successfully" },
        { status: 200 },
      );
    } catch {
      return NextResponse.json(
        { error: "강아지 정보를 삭제하는 중 오류가 발생했습니다." },
        { status: 500 },
      );
    }
  }
}
