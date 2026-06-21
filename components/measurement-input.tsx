"use client";

/* 비-카운터 측정 도구(인라인) — 차이 입력(diff)·점수 슬라이더(slider)·수치 입력(number).
   탭 카운터(counter)는 별도 오버레이(tap-counter.tsx). 저장 값은 모두 number. */

import { useState } from "react";
import type { DiseaseMetric } from "@/lib/types";
import { Btn, Field, TextInput } from "./ui";

export function MeasurementInput({
  metric,
  onSave,
  onCancel,
  saving,
}: {
  metric: DiseaseMetric;
  onSave: (value: number) => void;
  onCancel: () => void;
  saving: boolean;
}) {
  if (metric.inputType === "diff") return <DiffInput metric={metric} onSave={onSave} onCancel={onCancel} saving={saving} />;
  if (metric.inputType === "slider") return <SliderInput metric={metric} onSave={onSave} onCancel={onCancel} saving={saving} />;
  return <NumberInput metric={metric} onSave={onSave} onCancel={onCancel} saving={saving} />;
}

type ToolProps = {
  metric: DiseaseMetric;
  onSave: (value: number) => void;
  onCancel: () => void;
  saving: boolean;
};

function Actions({ onCancel, onSave, saving, disabled }: { onCancel: () => void; onSave: () => void; saving: boolean; disabled?: boolean }) {
  return (
    <div className="row gap-2" style={{ marginTop: 12 }}>
      <Btn variant="outline" block disabled={saving} onClick={onCancel}>취소</Btn>
      <Btn block loading={saving} loadingText="저장 중…" disabled={disabled} onClick={onSave}>저장</Btn>
    </div>
  );
}

// 차이 입력: 시작값 - 종료값. 음수량(채운 ml - 남은 ml = 마신 ml).
function DiffInput({ metric, onSave, onCancel, saving }: ToolProps) {
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const s = Number(start);
  const e = Number(end);
  const valid = start !== "" && end !== "" && !Number.isNaN(s) && !Number.isNaN(e);
  const diff = valid ? s - e : null;

  return (
    <div className="card" style={{ marginTop: 8 }}>
      <div className="caption mb-4">시작값에서 종료값을 빼서 {metric.label}을(를) 계산해요.</div>
      <Field label={`시작값 (${metric.unit})`} htmlFor="m-start">
        <TextInput id="m-start" className="num" type="number" inputMode="decimal" value={start} onChange={(e) => setStart(e.target.value)} placeholder="예: 500" />
      </Field>
      <Field label={`종료값 (${metric.unit})`} htmlFor="m-end">
        <TextInput id="m-end" className="num" type="number" inputMode="decimal" value={end} onChange={(e) => setEnd(e.target.value)} placeholder="예: 320" />
      </Field>
      {diff != null && (
        <div className="caption">
          = <span className="num" style={{ fontWeight: 700 }}>{diff}</span> {metric.unit}
        </div>
      )}
      <Actions onCancel={onCancel} saving={saving} disabled={!valid} onSave={() => valid && onSave(diff!)} />
    </div>
  );
}

// 점수 슬라이더 1~5.
function SliderInput({ metric, onSave, onCancel, saving }: ToolProps) {
  const [score, setScore] = useState(3);
  return (
    <div className="card" style={{ marginTop: 8 }}>
      <div className="row between mb-4">
        <span className="caption">{metric.label} 점수</span>
        <span className="num" style={{ fontWeight: 700, fontSize: 20 }}>{score}</span>
      </div>
      <input
        type="range"
        min={1}
        max={5}
        step={1}
        value={score}
        onChange={(e) => setScore(Number(e.target.value))}
        style={{ width: "100%" }}
      />
      <div className="row between caption" style={{ marginTop: 4 }}>
        <span>1 (낮음)</span>
        <span>5 (높음)</span>
      </div>
      <Actions onCancel={onCancel} saving={saving} onSave={() => onSave(score)} />
    </div>
  );
}

// 수치 직접 입력.
function NumberInput({ metric, onSave, onCancel, saving }: ToolProps) {
  const [val, setVal] = useState("");
  const n = Number(val);
  const valid = val !== "" && !Number.isNaN(n);
  return (
    <div className="card" style={{ marginTop: 8 }}>
      <Field label={`${metric.label} (${metric.unit})`} htmlFor="m-num">
        <TextInput id="m-num" className="num" type="number" inputMode="decimal" value={val} onChange={(e) => setVal(e.target.value)} placeholder={`예: ${metric.alertMin ?? 100}`} />
      </Field>
      <Actions onCancel={onCancel} saving={saving} disabled={!valid} onSave={() => valid && onSave(n)} />
    </div>
  );
}
