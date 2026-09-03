"use client";

/* 약 관리 — 약 목록(복용 시간 칩 토글·잔량·놓침) + 약 추가/삭제. 강아지 상세에 삽입.

   스타일 규칙(CLAUDE.md): 색·간격은 디자인 토큰/유틸리티로.
   주의: globals.css의 .caption은 @layer 밖이라 color를 강제한다. 잔량 경고처럼
   색이 조건부로 바뀌는 자리에선 .caption을 쓰지 않고 유틸리티로 조립한다. */

import { useState } from "react";
import {
  useAddMedication,
  useDeleteMedication,
  useMedications,
  useToggleDose,
} from "@/lib/queries";
import type { Medication } from "@/lib/types";
import { Btn, Field, TextInput } from "./ui";

const LOW_STOCK = 7;

// 현재 시각 HH:MM (로컬 ≈ 한국). 슬롯이 지났는지 판단용.
function nowHHMM(): string {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

export function DogMedications({ dogId }: { dogId: string }) {
  const { data: meds = [], isPending } = useMedications(dogId);
  const [adding, setAdding] = useState(false);

  return (
    <div>
      <div className="row between mb-4">
        <div className="title-lg">약</div>
        {!adding && (
          <Btn size="sm" variant="outline" onClick={() => setAdding(true)}>
            + 약 추가
          </Btn>
        )}
      </div>

      {adding && <AddMedicationForm dogId={dogId} onDone={() => setAdding(false)} />}

      {isPending ? (
        <div className="caption">불러오는 중…</div>
      ) : meds.length === 0 ? (
        !adding && (
          <div className="card">
            <div className="caption py-2.5 text-center">
              등록한 약이 없어요. 복용 중인 약을 추가해보세요 💊
            </div>
          </div>
        )
      ) : (
        <div className="stack gap-3">
          {meds.map((m) => (
            <MedicationCard key={m.id} dogId={dogId} med={m} />
          ))}
        </div>
      )}
    </div>
  );
}

function MedicationCard({ dogId, med }: { dogId: string; med: Medication }) {
  const toggle = useToggleDose(dogId);
  const remove = useDeleteMedication(dogId);
  const takenTimes = new Set(med.doses.map((d) => d.time));
  const now = nowHHMM();
  const lowStock = med.remainingCount != null && med.remainingCount <= LOW_STOCK;

  return (
    <div className="card">
      <div className="row between mb-2.5">
        <div>
          <span className="title-md">{med.name}</span>
          {med.dosage && (
            <span className="caption ml-2">
              {med.dosage}
            </span>
          )}
        </div>
        <button
          aria-label="약 삭제"
          onClick={() => remove.mutate(med.id)}
          disabled={remove.isPending}
          className="caption cursor-pointer border-0 bg-transparent"
        >
          삭제
        </button>
      </div>

      <div className="row gap-2 flex-wrap">
        {med.times.map((t) => {
          const taken = takenTimes.has(t);
          const missed = !taken && t < now;
          return (
            <button
              key={t}
              onClick={() => toggle.mutate({ medId: med.id, time: t, taken: !taken })}
              disabled={toggle.isPending}
              className={`num cursor-pointer rounded-full px-3 py-1.5 text-sm font-semibold ${
                taken
                  ? "border-0 bg-primary text-primary-fg"
                  : missed
                    ? "border border-destructive bg-transparent text-destructive"
                    : "border border-border bg-transparent text-foreground"
              }`}
            >
              {taken ? "✓ " : missed ? "! " : ""}
              {t}
            </button>
          );
        })}
      </div>

      {med.remainingCount != null && (
        <div className={`mt-2.5 text-[13px] ${lowStock ? "text-destructive" : "text-muted-fg"}`}>
          잔량 {med.remainingCount}회분{lowStock ? " · 곧 떨어져요, 처방 받으세요" : ""}
        </div>
      )}
    </div>
  );
}

function AddMedicationForm({ dogId, onDone }: { dogId: string; onDone: () => void }) {
  const add = useAddMedication(dogId);
  const [name, setName] = useState("");
  const [dosage, setDosage] = useState("");
  const [timesRaw, setTimesRaw] = useState("");
  const [remaining, setRemaining] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!name.trim()) {
      setError("약 이름을 입력해주세요.");
      return;
    }
    const times = timesRaw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    if (times.length === 0 || !times.every((t) => /^\d{2}:\d{2}$/.test(t))) {
      setError("복용 시간을 HH:MM 형식으로 입력해주세요. 예: 08:00, 20:00");
      return;
    }
    try {
      await add.mutateAsync({
        name: name.trim(),
        dosage: dosage.trim() || undefined,
        times,
        remainingCount: remaining !== "" ? Number(remaining) : undefined,
      });
      onDone();
    } catch {
      setError("약 저장에 실패했어요. 잠시 후 다시 시도해주세요.");
    }
  }

  return (
    <form onSubmit={submit} className="card mb-4">
      {error && (
        <div className="alert alert-error mb-4" role="alert">
          {error}
        </div>
      )}
      <Field label="약 이름" htmlFor="med-name">
        <TextInput id="med-name" placeholder="예: 심장약" value={name} onChange={(e) => setName(e.target.value)} />
      </Field>
      <Field label="용량" optional htmlFor="med-dosage">
        <TextInput id="med-dosage" placeholder="예: 5mg, 1정" value={dosage} onChange={(e) => setDosage(e.target.value)} />
      </Field>
      <Field label="복용 시간 (HH:MM, 쉼표로 구분)" htmlFor="med-times">
        <TextInput id="med-times" placeholder="예: 08:00, 20:00" value={timesRaw} onChange={(e) => setTimesRaw(e.target.value)} />
      </Field>
      <Field label="잔량 (회분)" optional htmlFor="med-remaining">
        <TextInput id="med-remaining" className="num" type="number" min="0" inputMode="numeric" placeholder="예: 30" value={remaining} onChange={(e) => setRemaining(e.target.value)} />
      </Field>
      <div className="row gap-2">
        <Btn type="button" variant="outline" block disabled={add.isPending} onClick={onDone}>
          취소
        </Btn>
        <Btn type="submit" block loading={add.isPending} loadingText="저장 중…">
          저장
        </Btn>
      </div>
    </form>
  );
}
