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

/* 약 관리 — GET /api/dogs/[id]/medications 응답(data). doses는 오늘(KST) 복용 슬롯. */
export type MedicationDose = {
  id: string;
  medicationId: string;
  date: string;
  time: string;
  takenAt: string;
};
export type Medication = {
  id: string;
  dogId: string;
  name: string;
  dosage: string | null;
  times: string[]; // HH:MM
  remainingCount: number | null;
  createdAt: string;
  doses: MedicationDose[];
};
export type MedicationInput = {
  name: string;
  dosage?: string;
  times: string[];
  remainingCount?: number;
};

/* 지병 모니터링 (MVP 2) — 메타데이터 기반. */
export type MetricInputType = "counter" | "diff" | "slider" | "number";
export type DiseaseMetric = {
  key: string;
  diseaseKey: string;
  label: string;
  unit: string;
  inputType: MetricInputType;
  durationSec: number | null;
  multiplier: number | null;
  alertMin: number | null;
  alertMax: number | null;
  sortOrder: number;
};
export type Disease = { key: string; name: string; metrics: DiseaseMetric[] };
export type DogDisease = {
  id: string;
  dogId: string;
  diseaseKey: string;
  createdAt: string;
  disease: Disease;
};
export type Measurement = {
  id: string;
  dogId: string;
  metricKey: string;
  value: number;
  measuredAt: string; // ISO
};

/* 사진 일지 — GET /api/dogs/[id]/photos 응답(data). */
export type Photo = {
  id: string;
  dogId: string;
  url: string;
  caption: string | null;
  createdAt: string; // ISO
};

/* 사료 분석 (MVP 3) — GET /api/dogs/[id]/feed-analyses 응답(data). */
export type FeedAnalysisNutrient = { label: string; value: string };
export type FeedAnalysisCaution = { ingredient: string; reason: string };

export type FeedAnalysis = {
  id: string;
  dogId: string;
  imageUrl: string;
  rating: number;
  summary: string;
  nutrients: FeedAnalysisNutrient[];
  cautions: FeedAnalysisCaution[];
  benefits: string[];
  model: string;
  createdAt: string; // ISO
};

/* 개인 API 토큰 — GET /api/tokens 응답(data). 해시·평문은 절대 미포함.
   생성(POST) 응답만 평문 token을 1회 포함(ApiTokenCreated). */
export type ApiToken = {
  id: string;
  name: string;
  createdAt: string; // ISO
  lastUsedAt: string | null;
};
export type ApiTokenCreated = { id: string; name: string; createdAt: string; token: string };

/* 주간 통계 — GET /api/dogs/[id]/stats 응답(data)의 모양.
   집계는 서버에서. 차트는 series만 그리고 요약값(avg/sum/latest/change)은 헤더에 표시. */
export type StatPoint = { date: string; value: number | null };

export type DogStats = {
  range: { from: string; to: string }; // ISO yyyy-mm-dd, 한국 기준 7일
  meal: { series: StatPoint[]; avg: number | null }; // 유량 → 하루 평균
  walk: { series: StatPoint[]; sum: number | null; avg: number | null }; // 유량 → 총합
  weight: { series: StatPoint[]; latest: number | null; change: number | null }; // 저량 → 최신값+증감
};
