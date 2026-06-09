"use client";

/* 일일 기록 입력 폼 (한 화면 변형 — 신규/수정 공용). 모든 필드 선택. */

import { useState } from "react";
import type { Dog, DogRecord, RecordInput } from "@/lib/types";
import { todayISO } from "@/lib/format";
import { Btn, Field, TextInput, TextArea } from "./ui";
import { BackBar } from "./back-bar";

type FormState = {
  date: string;
  meal: string;
  walkMin: string;
  walkKm: string;
  poop: string;
  weight: string;
  memo: string;
};

function initial(record?: DogRecord): FormState {
  return {
    date: record?.date || todayISO(),
    meal: record?.meal?.toString() ?? "",
    walkMin: record?.walkMin?.toString() ?? "",
    walkKm: record?.walkKm?.toString() ?? "",
    poop: record?.poop?.toString() ?? "",
    weight: record?.weight?.toString() ?? "",
    memo: record?.memo ?? "",
  };
}

function build(v: FormState): RecordInput {
  const num = (x: string) => (x === "" ? undefined : Number(x));
  return {
    date: v.date,
    meal: num(v.meal),
    walkMin: num(v.walkMin),
    walkKm: num(v.walkKm),
    poop: num(v.poop),
    weight: num(v.weight),
    memo: v.memo.trim() || undefined,
  };
}

export function RecordForm({
  mode,
  dog,
  record,
  onSave,
  onDelete,
  onCancel,
}: {
  mode: "new" | "edit";
  dog: Dog;
  record?: DogRecord;
  onSave: (rec: RecordInput) => void;
  onDelete?: () => void;
  onCancel: () => void;
}) {
  const [v, setV] = useState<FormState>(() => initial(record));
  const [busy, setBusy] = useState(false);
  const isEdit = mode === "edit";
  const set = (k: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setV((s) => ({ ...s, [k]: e.target.value }));

  function doSave() {
    setBusy(true);
    setTimeout(() => onSave(build(v)), 600);
  }

  function doDelete() {
    if (!onDelete) return;
    if (!window.confirm("이 기록을 삭제할까요?")) return;
    onDelete();
  }

  const title = isEdit ? "기록 수정" : "오늘 기록";
  const sub = isEdit ? `${dog.name}의 기록을 수정하세요` : "기록할 항목만 입력하세요 (모두 선택)";

  return (
    <div className="fade-in" style={{ maxWidth: 440, margin: "0 auto" }}>
      <BackBar onBack={onCancel} label="취소" />
      <div className="h2">{title}</div>
      <div className="caption mb-6" style={{ marginTop: 6 }}>
        {sub}
      </div>

      <Field label="날짜" htmlFor="rf-date">
        <TextInput id="rf-date" type="date" max={todayISO()} value={v.date} onChange={set("date")} />
      </Field>
      <Field label="🍽 식사량 (g)" optional htmlFor="rf-meal">
        <TextInput id="rf-meal" className="num" type="number" min="0" inputMode="numeric" placeholder="예: 120" value={v.meal} onChange={set("meal")} />
      </Field>
      <div className="grid-2">
        <Field label="🚶 산책 (분)" optional htmlFor="rf-wm">
          <TextInput id="rf-wm" className="num" type="number" min="0" inputMode="numeric" placeholder="30" value={v.walkMin} onChange={set("walkMin")} />
        </Field>
        <Field label="📏 거리 (km)" optional htmlFor="rf-wk">
          <TextInput id="rf-wk" className="num" type="number" min="0" step="0.1" inputMode="decimal" placeholder="1.5" value={v.walkKm} onChange={set("walkKm")} />
        </Field>
      </div>
      <div className="grid-2">
        <Field label="💩 배변 (회)" optional htmlFor="rf-poop">
          <TextInput id="rf-poop" className="num" type="number" min="0" inputMode="numeric" placeholder="2" value={v.poop} onChange={set("poop")} />
        </Field>
        <Field label="⚖ 체중 (kg)" optional htmlFor="rf-w">
          <TextInput id="rf-w" className="num" type="number" min="0" step="0.1" inputMode="decimal" placeholder="4.6" value={v.weight} onChange={set("weight")} />
        </Field>
      </div>
      <Field label="메모" optional htmlFor="rf-memo">
        <TextArea id="rf-memo" rows={3} placeholder="컨디션, 특이사항 등" value={v.memo} onChange={set("memo")} />
      </Field>

      <Btn block loading={busy} loadingText="저장 중…" onClick={doSave}>
        저장
      </Btn>
      {isEdit && (
        <div className="row" style={{ justifyContent: "flex-end", marginTop: 14 }}>
          <Btn variant="destructive" size="sm" onClick={doDelete} disabled={busy}>
            삭제
          </Btn>
        </div>
      )}
    </div>
  );
}
