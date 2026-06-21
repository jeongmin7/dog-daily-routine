# 지병별 동적 모니터링 설계 — MVP 2 (수직 슬라이스: 탭 카운터까지)

> 2026-06-21 · 브랜치 `feat/disease-monitoring`

## 목적 / 슬라이스 범위
메타데이터 기반 지병 모니터링. 이번 조각은 **성공 기준**까지: 지병 등록 → **탭 카운터로 호흡수/심박수 측정 → 저장 → 추이 차트 + 임계값 경고**.
- 측정 도구는 **탭 카운터(inputType `counter`)만** 구현. 차이입력/슬라이더/수치(diff/slider/number)는 **메타데이터엔 정의하되 UI는 "측정 도구 준비 중"** 표시(다음 조각).

## 데이터 모델
```prisma
// 마스터(시드) — 지병
model Disease {
  key String @id          // "heart"
  name String             // "심장병"
  metrics DiseaseMetric[]
  dogDiseases DogDisease[]
}
// 마스터(시드) — 지표 메타데이터 (메타데이터 기반 설계의 핵심)
model DiseaseMetric {
  key String @id          // "resp_rate"
  diseaseKey String
  disease Disease @relation(fields: [diseaseKey], references: [key], onDelete: Cascade)
  label String            // "분당 호흡수"
  unit String             // "회/분"
  inputType String        // "counter" | "diff" | "slider" | "number"
  durationSec Int?        // counter: 측정 시간(호흡 60, 심박 15)
  multiplier Int?         // counter: 환산 배수(호흡 1, 심박 4)
  alertMin Int?
  alertMax Int?
  sortOrder Int @default(0)
}
// 강아지↔지병 등록
model DogDisease {
  id String @id @default(cuid())
  dogId String
  dog Dog @relation(fields: [dogId], references: [id], onDelete: Cascade)
  diseaseKey String
  disease Disease @relation(fields: [diseaseKey], references: [key], onDelete: Cascade)
  createdAt DateTime @default(now())
  @@unique([dogId, diseaseKey])
}
// 측정 세션 (일반화 — metricKey는 문자열, FK 안 검 = 재사용 가능)
model MeasurementSession {
  id String @id @default(cuid())
  dogId String
  dog Dog @relation(fields: [dogId], references: [id], onDelete: Cascade)
  metricKey String
  value Float
  measuredAt DateTime @default(now())
}
```
Dog에 `diseases DogDisease[]`, `measurements MeasurementSession[]`. 마이그레이션 `add_disease_monitoring`.

## 시드 (마스터 = 모든 환경 필요)
`prisma/seed.ts`에 `seedReference()` 추가(항상 upsert, 데모 데이터와 별개). 공유 Neon DB라 `db:seed` 1회로 prod까지 반영.
- 7종: heart 심장병 / kidney 신장병 / diabetes 당뇨 / joint 관절염 / pancreas 췌장염 / liver 간질환 / senior 노령견.
- 지표(MVP2 해당만): heart→resp_rate(counter 60s ×1, alertMax 40), heart_rate(counter 15s ×4, alertMin 60 alertMax 160); kidney→water_intake(diff ml), appetite(slider); diabetes→blood_glucose(number), water_intake(diff); joint→limp(slider); senior→vitality(slider), cognition(slider). (사진/체크리스트 지표는 MVP3라 제외.)

## API (세션·Bearer `getUserId`, 소유확인)
- `GET /api/diseases` → 마스터 전체(disease+metrics). 인증만(유저 스코프 아님).
- `GET /api/dogs/[id]/diseases` → 등록된 지병(+metrics).
- `POST /api/dogs/[id]/diseases` `{ diseaseKey }` → 등록(존재 검증·중복 upsert).
- `DELETE /api/dogs/[id]/diseases/[diseaseKey]` → 해제.
- `GET /api/dogs/[id]/measurements?metricKey=` → 그 지표 시계열(measuredAt asc).
- `POST /api/dogs/[id]/measurements` `{ metricKey, value }` → 저장(value 숫자 검증). 임계값 판정은 UI(메타데이터 보유).

## react-query / 타입
`qk.diseases`, `qk.dogDiseases(dogId)`, `qk.measurements(dogId, metricKey)`. 훅: `useDiseaseCatalog`, `useDogDiseases`, `useRegisterDisease`, `useUnregisterDisease`, `useMeasurements`, `useAddMeasurement`. 타입: `Disease/DiseaseMetric/DogDisease/Measurement`.

## UI — 강아지 상세 "건강 모니터링" 섹션 (`components/dog-monitoring.tsx`)
- 등록된 지병 없으면: "지병 등록" 버튼 → 카탈로그에서 선택해 등록.
- 등록된 지병별: 이름 + 해제. 각 지표:
  - `counter`: "측정" 버튼 → **탭 카운터 오버레이**(`components/tap-counter.tsx`): 큰 버튼, 첫 탭에 타이머 시작, durationSec 후 자동 종료, count×multiplier → 저장.
  - 그 외: "측정 도구 준비 중".
  - 최근값 + 미니 추이(작은 SVG 라인) + 임계값(alertMin/Max) 벗어나면 경고.

## 테스트
- diseases GET 인증.
- dog diseases: 소유 404 / 없는 diseaseKey 400 / 등록 upsert / 해제.
- measurements: 소유 404 / value 비숫자 400 / 저장 / metricKey 필수.

## 비목표 (이번 조각)
- diff/slider/number 입력 도구(다음 조각). 메타데이터·placeholder만.
- 노령견 7세+ 자동 추천 배너(선택, 생략).
- AI/사진(MVP3).
