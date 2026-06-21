/* 도메인 타입 — UI와 데이터 계층이 공유.
   백엔드(Prisma) 연결 시 Prisma 생성 타입으로 대체하거나 매핑한다. */

export type Dog = {
  id: string;
  name: string;
  breed?: string;
  birthdate?: string; // ISO yyyy-mm-dd
  weight?: number; // kg
};

export type DogRecord = {
  id: string;
  dogId: string;
  date: string; // ISO yyyy-mm-dd
  meal?: number; // g
  walkMin?: number; // 분
  walkKm?: number; // km
  poop?: number; // 회
  weight?: number; // kg
  memo?: string;
};

export type RecordInput = Omit<DogRecord, "id" | "dogId">;
export type DogInput = Omit<Dog, "id">;

/* 주간 통계 — GET /api/dogs/[id]/stats 응답(data)의 모양.
   집계는 서버에서. 차트는 series만 그리고 요약값(avg/sum/latest/change)은 헤더에 표시. */
export type StatPoint = { date: string; value: number | null };

export type DogStats = {
  range: { from: string; to: string }; // ISO yyyy-mm-dd, 한국 기준 7일
  meal: { series: StatPoint[]; avg: number | null }; // 유량 → 하루 평균
  walk: { series: StatPoint[]; sum: number | null; avg: number | null }; // 유량 → 총합
  weight: { series: StatPoint[]; latest: number | null; change: number | null }; // 저량 → 최신값+증감
};
