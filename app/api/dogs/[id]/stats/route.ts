import { getUserId } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const userId = await getUserId(request);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  } else {
    const dog = await prisma.dog.findFirst({ where: { id, userId } });
    if (!dog) {
      return NextResponse.json({ error: "Dog not found" }, { status: 404 });
    }
    try {
      // 한국 기준 "오늘"에서 6일 빼 7일치 범위의 시작 경계를 만든다.
      // UTC 서버에서 +9시간 → 한국 시각, 거기서 6일 전 → YYYY-MM-DD 로 자른다.
      const KST_OFFSET = 9 * 60 * 60 * 1000;
      const kstNow = new Date(Date.now() + KST_OFFSET);
      const from = new Date(kstNow.getTime() - 6 * 24 * 60 * 60 * 1000)
        .toISOString()
        .slice(0, 10);

      const to = kstNow.toISOString().slice(0, 10);

      const stats = await prisma.dogRecord.findMany({
        where: {
          dogId: dog.id,
          date: { gte: from },
        },
        orderBy: { date: "asc" },
      });

      // --- 집계 헬퍼 ---
      // 합/평균은 null(미기록) 날을 "빼고" 계산한다. 분모는 7이 아니라 "기록한 날 수".
      const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);
      const avg = (xs: number[]) =>
        xs.length ? Math.round((sum(xs) / xs.length) * 10) / 10 : null;
      // 차트 선용 점들 — null은 그대로 둔다(차트가 알아서 거름).
      const series = (key: "meal" | "walkMin" | "weight") =>
        stats.map((r) => ({ date: r.date, value: r[key] }));

      // null/undefined 제외한 숫자 배열 (`!= null` 이 둘 다 거름)
      const mealVals = stats.map((r) => r.meal).filter((v): v is number => v != null);
      const walkVals = stats.map((r) => r.walkMin).filter((v): v is number => v != null);
      // 체중: 저량(stock) → 평균/합계 X. 범위 내 첫·마지막 값으로 최신값과 증감만.
      const weightVals = stats.map((r) => r.weight).filter((v): v is number => v != null);
      const weightLatest = weightVals.length ? weightVals[weightVals.length - 1] : null;
      const weightChange = weightVals.length
        ? Math.round((weightVals[weightVals.length - 1] - weightVals[0]) * 10) / 10
        : null;

      return NextResponse.json(
        {
          data: {
            range: { from, to },
            meal: { series: series("meal"), avg: avg(mealVals) },
            walk: {
              series: series("walkMin"),
              sum: walkVals.length ? sum(walkVals) : null,
              avg: avg(walkVals),
            },
            weight: {
              series: series("weight"),
              latest: weightLatest,
              change: weightChange,
            },
          },
        },
        { status: 200 },
      );
    } catch {
      return NextResponse.json(
        { error: "강아지 통계를 불러오는 중 오류가 발생했습니다." },
        { status: 500 },
      );
    }
  }
}
