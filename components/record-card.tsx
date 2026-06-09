/* 기록 카드 — 이모지 인라인 메트릭 (시안 최종 확정 변형). */

import type { DogRecord } from "@/lib/types";
import { METRICS, METRIC_ORDER, fmtDateKo, relativeDay, hasVal, type MetricKey } from "@/lib/format";

export function RecordMetrics({ record }: { record: DogRecord }) {
  const items = METRIC_ORDER.filter((k) => hasVal(record[k]));
  if (items.length === 0) return <div className="caption">기록 항목 없음</div>;
  return (
    <div className="metric-inline">
      {items.map((k: MetricKey) => {
        const m = METRICS[k];
        return (
          <span className="metric-emoji" key={k}>
            <span className="em">{m.emoji}</span>
            <span className="val num">{record[k]}</span>
            <span className="muted" style={{ fontSize: 13 }}>
              {m.unit}
            </span>
          </span>
        );
      })}
    </div>
  );
}

export function RecordCard({ record, onClick }: { record: DogRecord; onClick?: () => void }) {
  const rel = relativeDay(record.date);
  return (
    <div className="record-card fade-in" onClick={onClick}>
      <div className="row between" style={{ marginBottom: 9 }}>
        <span className="caption" style={{ fontWeight: 500 }}>
          {fmtDateKo(record.date)}
          {rel && (
            <span className="text-primary" style={{ marginLeft: 7, fontWeight: 600 }}>
              {rel}
            </span>
          )}
        </span>
        <svg width="7" height="12" viewBox="0 0 8 14" style={{ flexShrink: 0 }}>
          <path d="M1 1l6 6-6 6" stroke="var(--muted-fg)" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      <RecordMetrics record={record} />
      {record.memo && <div className="memo-clamp">{record.memo}</div>}
    </div>
  );
}
