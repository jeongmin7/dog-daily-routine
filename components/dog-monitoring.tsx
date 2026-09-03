"use client";

/* 건강 모니터링 (MVP 2 슬라이스) — 지병 등록/해제 + 지표별 측정(탭 카운터)·추이·임계값 경고.

   스타일 규칙(CLAUDE.md): 색·간격은 디자인 토큰/유틸리티로. 하드코딩 값은 다크모드
   오버라이드를 따라가지 못한다. 컴포넌트 클래스(.row/.body/.caption) 위에 유틸리티를
   얹어 덮어쓸 수 있다 — globals.css가 @layer components 안에 있기 때문이다. */

import { useState } from "react";
import {
  useAddMeasurement,
  useDiseaseCatalog,
  useDogDiseases,
  useMeasurements,
  useRegisterDisease,
  useUnregisterDisease,
} from "@/lib/queries";
import type { DiseaseMetric } from "@/lib/types";
import { Btn } from "./ui";
import { TapCounter } from "./tap-counter";
import { MeasurementInput } from "./measurement-input";

// 임계값 벗어남 판정.
function isAlerting(metric: DiseaseMetric, value: number): boolean {
  if (metric.alertMin != null && value < metric.alertMin) return true;
  if (metric.alertMax != null && value > metric.alertMax) return true;
  return false;
}

function Sparkline({ values }: { values: number[] }) {
  if (values.length < 2) return null;
  const w = 120;
  const h = 32;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const pts = values
    .map((v, i) => {
      const x = (i / (values.length - 1)) * w;
      const y = h - ((v - min) / span) * h;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
  return (
    <svg width={w} height={h} className="block">
      <polyline points={pts} fill="none" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function DogMonitoring({ dogId }: { dogId: string }) {
  const { data: registered = [], isPending } = useDogDiseases(dogId);
  const { data: catalog = [] } = useDiseaseCatalog();
  const register = useRegisterDisease(dogId);
  const unregister = useUnregisterDisease(dogId);
  const [picking, setPicking] = useState(false);

  const registeredKeys = new Set(registered.map((r) => r.diseaseKey));
  const available = catalog.filter((d) => !registeredKeys.has(d.key));

  return (
    <div>
      <div className="row between mb-4">
        <div className="title-lg">건강 모니터링</div>
        {!picking && available.length > 0 && (
          <Btn size="sm" variant="outline" onClick={() => setPicking(true)}>
            + 지병 등록
          </Btn>
        )}
      </div>

      {picking && (
        <div className="card mb-4">
          <div className="caption mb-4">등록할 지병을 선택하세요</div>
          <div className="row gap-2 flex-wrap">
            {available.map((d) => (
              <Btn
                key={d.key}
                size="sm"
                variant="outline"
                disabled={register.isPending}
                onClick={async () => {
                  await register.mutateAsync(d.key);
                  setPicking(false);
                }}
              >
                {d.name}
              </Btn>
            ))}
          </div>
          <Btn size="sm" variant="ghost" className="mt-3" onClick={() => setPicking(false)}>
            취소
          </Btn>
        </div>
      )}

      {isPending ? (
        <div className="caption">불러오는 중…</div>
      ) : registered.length === 0 ? (
        !picking && (
          <div className="card">
            <div className="caption py-2.5 text-center">
              등록된 지병이 없어요. 지병을 등록하면 맞춤 모니터링 지표가 생겨요 🩺
            </div>
          </div>
        )
      ) : (
        <div className="stack gap-3">
          {registered.map((r) => (
            <div className="card" key={r.id}>
              <div className="row between mb-3">
                <span className="title-md">{r.disease.name}</span>
                <button
                  onClick={() => unregister.mutate(r.diseaseKey)}
                  disabled={unregister.isPending}
                  className="caption cursor-pointer border-0 bg-transparent"
                >
                  해제
                </button>
              </div>
              <div className="stack gap-4">
                {r.disease.metrics.map((m) => (
                  <MetricRow key={m.key} dogId={dogId} metric={m} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function MetricRow({ dogId, metric }: { dogId: string; metric: DiseaseMetric }) {
  const { data: measurements = [] } = useMeasurements(dogId, metric.key);
  const add = useAddMeasurement(dogId);
  const [measuring, setMeasuring] = useState(false);

  const values = measurements.map((m) => m.value);
  const latest = values.length ? values[values.length - 1] : null;
  const alerting = latest != null && isAlerting(metric, latest);

  async function save(value: number) {
    try {
      await add.mutateAsync({ metricKey: metric.key, value });
      setMeasuring(false);
    } catch {
      /* 측정 창 유지 — 사용자가 재시도 */
    }
  }

  return (
    <div>
      <div className="row between items-end">
        <div>
          <div className="body font-semibold">
            {metric.label}{" "}
            <span className="caption font-normal">({metric.unit})</span>
          </div>
          {latest != null ? (
            <div className={`caption mt-0.5 ${alerting ? "text-destructive" : ""}`}>
              최근 <span className="num font-bold">{latest}</span> {metric.unit}
              {alerting ? " · ⚠️ 정상 범위를 벗어났어요" : ""}
            </div>
          ) : (
            <div className="caption mt-0.5">아직 측정 기록이 없어요</div>
          )}
        </div>
        {!measuring && (
          <Btn size="sm" onClick={() => setMeasuring(true)}>측정</Btn>
        )}
      </div>

      {values.length >= 2 && (
        <div className="mt-2">
          <Sparkline values={values} />
        </div>
      )}

      {/* counter는 풀스크린 오버레이, 나머지는 인라인 입력 */}
      {measuring && metric.inputType === "counter" && (
        <TapCounter
          metric={metric}
          saving={add.isPending}
          onSave={save}
          onClose={() => setMeasuring(false)}
        />
      )}
      {measuring && metric.inputType !== "counter" && (
        <MeasurementInput
          metric={metric}
          saving={add.isPending}
          onSave={save}
          onCancel={() => setMeasuring(false)}
        />
      )}
    </div>
  );
}
