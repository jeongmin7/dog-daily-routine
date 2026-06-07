/* 포맷 헬퍼 + 메트릭 메타데이터 — 화면 전체에서 공유 (record card, chart, form). */

import type { DogRecord } from "./types";

export const todayISO = () => new Date().toISOString().slice(0, 10);

export function isoDaysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

const WK = ["일", "월", "화", "수", "목", "금", "토"];

export function fmtDateKo(iso: string): string {
  if (!iso) return "";
  const d = new Date(iso + "T00:00:00");
  return `${d.getMonth() + 1}월 ${d.getDate()}일 ${WK[d.getDay()]}`;
}

export function fmtMonthDay(iso: string): string {
  const d = new Date(iso + "T00:00:00");
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

export function relativeDay(iso: string): string | null {
  if (iso === todayISO()) return "오늘";
  if (iso === isoDaysAgo(1)) return "어제";
  return null;
}

export function ageString(birthdate?: string): string | null {
  if (!birthdate) return null;
  const b = new Date(birthdate + "T00:00:00");
  const now = new Date();
  let months = (now.getFullYear() - b.getFullYear()) * 12 + (now.getMonth() - b.getMonth());
  if (now.getDate() < b.getDate()) months -= 1;
  if (months < 0) months = 0;
  const y = Math.floor(months / 12);
  const m = months % 12;
  if (y === 0) return `${m}개월`;
  if (m === 0) return `${y}년`;
  return `${y}년 ${m}개월`;
}

export function hasVal(v: unknown): boolean {
  return v !== null && v !== undefined && v !== "" && Number(v) !== 0;
}

export type MetricKey = "meal" | "walkMin" | "walkKm" | "poop" | "weight";

export const METRICS: Record<MetricKey, { key: MetricKey; emoji: string; label: string; unit: string; color: string }> = {
  meal: { key: "meal", emoji: "🍽", label: "식사", unit: "g", color: "var(--primary)" },
  walkMin: { key: "walkMin", emoji: "🚶", label: "산책", unit: "분", color: "var(--accent)" },
  walkKm: { key: "walkKm", emoji: "📏", label: "거리", unit: "km", color: "var(--primary)" },
  poop: { key: "poop", emoji: "💩", label: "배변", unit: "회", color: "var(--warning)" },
  weight: { key: "weight", emoji: "⚖", label: "체중", unit: "kg", color: "var(--success)" },
};

export const METRIC_ORDER: MetricKey[] = ["meal", "walkMin", "walkKm", "poop", "weight"];

export function recordsForDog(records: DogRecord[], dogId: string): DogRecord[] {
  return records
    .filter((r) => r.dogId === dogId)
    .sort((a, b) => (a.date < b.date ? 1 : -1));
}
