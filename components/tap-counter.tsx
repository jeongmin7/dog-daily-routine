"use client";

/* 탭 카운터 측정 도구 — 첫 탭에 타이머 시작, durationSec 후 자동 종료, count×multiplier = 값.
   호흡수(60초 ×1)·심박수(15초 ×4) 측정용. 풀스크린 오버레이. */

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
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 50,
        background: "var(--bg, #fff)",
        display: "flex",
        flexDirection: "column",
        padding: 24,
      }}
    >
      <div className="row between" style={{ marginBottom: 8 }}>
        <div className="title-md">{metric.label}</div>
        <button
          onClick={onClose}
          className="caption"
          style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted-fg)" }}
        >
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
          style={{
            flex: 1,
            border: "none",
            borderRadius: 20,
            background: phase === "running" ? "var(--primary)" : "var(--primary-weak, #e6f2fb)",
            color: phase === "running" ? "#fff" : "var(--primary)",
            cursor: "pointer",
            fontWeight: 800,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            WebkitTapHighlightColor: "transparent",
            userSelect: "none",
          }}
        >
          <span style={{ fontSize: 72, lineHeight: 1 }} className="num">{count}</span>
          <span style={{ fontSize: 16 }}>{phase === "idle" ? "탭하여 시작" : "탭"}</span>
        </button>
      ) : (
        <div className="full-center" style={{ flex: 1 }}>
          <div className="num" style={{ fontSize: 64, fontWeight: 800 }}>{value}</div>
          <div className="caption" style={{ marginBottom: 20 }}>{metric.unit}</div>
          <div className="row gap-2" style={{ width: "100%", maxWidth: 320 }}>
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
