"use client";

/* 탭 카운터 측정 도구 — 첫 탭에 타이머 시작, durationSec 후 자동 종료, count×multiplier = 값.
   호흡수(60초 ×1)·심박수(15초 ×4) 측정용. 풀스크린 오버레이.

   스타일 규칙(CLAUDE.md): 색·간격은 디자인 토큰/유틸리티로.
   주의: globals.css의 컴포넌트 클래스(.row/.caption/.full-center)는 @layer 밖이라
   Tailwind 유틸리티를 항상 이긴다. 색·정렬을 바꿔야 하는 자리에선 그 클래스를
   쓰지 않는다. */

import { useEffect, useRef, useState } from "react";
import type { DiseaseMetric } from "@/lib/types";
import { Btn } from "./ui";

type Phase = "idle" | "running" | "done";

export function TapCounter({
  metric,
  onSave,
  onClose,
  saving,
}: {
  metric: DiseaseMetric;
  onSave: (value: number) => void;
  onClose: () => void;
  saving: boolean;
}) {
  const duration = metric.durationSec ?? 60;
  const multiplier = metric.multiplier ?? 1;
  const [count, setCount] = useState(0);
  const [left, setLeft] = useState(duration);
  const [phase, setPhase] = useState<Phase>("idle");
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, []);

  function tap() {
    if (phase === "done") return;
    if (phase === "idle") {
      setPhase("running");
      setCount(1);
      timer.current = setInterval(() => {
        setLeft((l) => {
          if (l <= 1) {
            if (timer.current) clearInterval(timer.current);
            setPhase("done");
            return 0;
          }
          return l - 1;
        });
      }, 1000);
    } else {
      setCount((c) => c + 1);
    }
  }

  function reset() {
    if (timer.current) clearInterval(timer.current);
    setCount(0);
    setLeft(duration);
    setPhase("idle");
  }

  const value = count * multiplier;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background p-6">
      <div className="row between mb-2">
        <div className="title-md">{metric.label}</div>
        <button onClick={onClose} className="caption cursor-pointer border-0 bg-transparent">
          닫기
        </button>
      </div>
      <div className="caption mb-4">
        {phase === "idle" && `버튼을 ${metric.label === "분당 심박수" ? "심장 박동" : "호흡"} 한 번마다 탭하세요. 첫 탭에 ${duration}초 타이머가 시작돼요.`}
        {phase === "running" && `남은 시간 ${left}초`}
        {phase === "done" && `완료! ${count}회 × ${multiplier} = ${value} ${metric.unit}`}
      </div>

      {phase !== "done" ? (
        <button
          onClick={tap}
          aria-label="탭"
          className={`flex flex-1 cursor-pointer select-none flex-col items-center justify-center gap-2 rounded-[20px] border-0 font-extrabold ${
            phase === "running" ? "bg-primary text-primary-fg" : "bg-primary/10 text-primary"
          }`}
        >
          <span className="num text-[72px] leading-none">{count}</span>
          <span className="text-base">{phase === "idle" ? "탭하여 시작" : "탭"}</span>
        </button>
      ) : (
        <div className="full-center flex-1">
          <div className="num text-[64px] font-extrabold">{value}</div>
          <div className="caption mb-5">{metric.unit}</div>
          <div className="row gap-2 w-full max-w-[320px]">
            <Btn variant="outline" block disabled={saving} onClick={reset}>
              다시
            </Btn>
            <Btn block loading={saving} loadingText="저장 중…" onClick={() => onSave(value)}>
              저장
            </Btn>
          </div>
        </div>
      )}
    </div>
  );
}
