import { getUserId } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { put, del } from "@vercel/blob";
import { NextResponse } from "next/server";
import { analyzeFeedLabel } from "@/lib/feed-analysis";
import { buildDogContext } from "@/lib/dog-context";

export const maxDuration = 60; // AI 호출 여유

const MAX_BYTES = 4 * 1024 * 1024;

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const userId = await getUserId(req);
  if (!userId) {
    return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
  }
  try {
    const dog = await prisma.dog.findFirst({ where: { id, userId } });
    if (!dog) {
      return NextResponse.json(
        { error: "해당 강아지를 찾을 수 없습니다." },
        { status: 404 },
      );
    }
    const analyses = await prisma.feedAnalysis.findMany({
      where: { dogId: dog.id },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ data: analyses }, { status: 200 });
  } catch {
    return NextResponse.json(
      { error: "분석 이력을 불러오는 중 오류가 발생했습니다." },
      { status: 500 },
    );
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const userId = await getUserId(req);
  if (!userId) {
    return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
  }

  const dog = await prisma.dog.findFirst({
    where: { id, userId },
    include: { diseases: { include: { disease: true } } },
  });
  if (!dog) {
    return NextResponse.json(
      { error: "해당 강아지를 찾을 수 없습니다." },
      { status: 404 },
    );
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json(
      { error: "잘못된 요청 형식입니다." },
      { status: 400 },
    );
  }
  const file = form.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json(
      { error: "이미지 파일이 필요합니다." },
      { status: 400 },
    );
  }
  if (!file.type.startsWith("image/")) {
    return NextResponse.json(
      { error: "이미지 파일만 업로드할 수 있습니다." },
      { status: 400 },
    );
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { error: "이미지는 4MB 이하만 업로드할 수 있습니다." },
      { status: 400 },
    );
  }

  const blob = await put(`feed-labels/${dog.id}/${file.name}`, file, {
    access: "public",
    addRandomSuffix: true,
  });

  try {
    const dogContext = buildDogContext(
      { name: dog.name, birthdate: dog.birthdate, weight: dog.weight },
      dog.diseases.map((d: { disease: { name: string } }) => d.disease.name),
    );
    const { result, model } = await analyzeFeedLabel({
      imageUrl: blob.url,
      dog: dogContext,
    });
    const analysis = await prisma.feedAnalysis.create({
      data: {
        dogId: dog.id,
        imageUrl: blob.url,
        rating: result.rating,
        summary: result.summary,
        nutrients: result.nutrients,
        cautions: result.cautions,
        benefits: result.benefits,
        model,
      },
    });
    return NextResponse.json({ data: analysis }, { status: 201 });
  } catch {
    try { await del(blob.url); } catch { /* 롤백 실패는 무시 */ }
    return NextResponse.json(
      { error: "AI 분석에 실패했습니다. 잠시 후 다시 시도해주세요." },
      { status: 502 },
    );
  }
}
