import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { put, del } from "@vercel/blob";
import { analyzeFeedLabel } from "@/lib/feed-analysis";
import { buildDogContext } from "@/lib/dog-context";
import { badRequest, requireDog, serverError } from "@/lib/api-guard";

export const maxDuration = 60; // AI 호출 여유

const MAX_BYTES = 4 * 1024 * 1024;

// multipart라 zod를 쓰지 않는다 — 파일 검증은 File 인스턴스 대상이다.
async function readLabelImage(req: Request) {
  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return { error: badRequest("잘못된 요청 형식입니다.") };
  }
  const file = form.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { error: badRequest("이미지 파일이 필요합니다.") };
  }
  if (!file.type.startsWith("image/")) {
    return { error: badRequest("이미지 파일만 업로드할 수 있습니다.") };
  }
  if (file.size > MAX_BYTES) {
    return { error: badRequest("이미지는 4MB 이하만 업로드할 수 있습니다.") };
  }
  return { file };
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const ctx = await requireDog(req, id);
  if (ctx.error) return ctx.error;
  try {
    const analyses = await prisma.feedAnalysis.findMany({
      where: { dogId: ctx.dog.id },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ data: analyses }, { status: 200 });
  } catch (e) {
    return serverError(e, "분석 이력을 불러오는 중 오류가 발생했습니다.");
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const ctx = await requireDog(req, id);
  if (ctx.error) return ctx.error;
  const upload = await readLabelImage(req);
  if (upload.error) return upload.error;

  let blobUrl: string;
  try {
    // 지병은 AI 프롬프트의 컨텍스트로 들어간다(예: 신장병이면 인 함량 경고).
    const registered = await prisma.dogDisease.findMany({
      where: { dogId: ctx.dog.id },
      include: { disease: true },
    });
    const blob = await put(
      `feed-labels/${ctx.dog.id}/${upload.file.name}`,
      upload.file,
      { access: "public", addRandomSuffix: true },
    );
    blobUrl = blob.url;

    try {
      const dogContext = buildDogContext(
        {
          name: ctx.dog.name,
          birthdate: ctx.dog.birthdate,
          weight: ctx.dog.weight,
        },
        registered.map((d) => d.disease.name),
      );
      const { result, model } = await analyzeFeedLabel({
        imageUrl: blobUrl,
        dog: dogContext,
      });
      const analysis = await prisma.feedAnalysis.create({
        data: {
          dogId: ctx.dog.id,
          imageUrl: blobUrl,
          rating: result.rating,
          summary: result.summary,
          nutrients: result.nutrients,
          cautions: result.cautions,
          benefits: result.benefits,
          model,
        },
      });
      return NextResponse.json({ data: analysis }, { status: 201 });
    } catch (e) {
      // 분석이 실패하면 방금 올린 이미지를 되돌린다(고아 blob 방지).
      console.error("사료 라벨 분석 실패", e);
      try {
        await del(blobUrl);
      } catch {
        /* 롤백 실패는 무시 */
      }
      return NextResponse.json(
        { error: "AI 분석에 실패했습니다. 잠시 후 다시 시도해주세요." },
        { status: 502 },
      );
    }
  } catch (e) {
    return serverError(e, "사료 분석을 준비하는 중 오류가 발생했습니다.");
  }
}
