# 약 관리 설계 — MVP 1b-i (알림 제외)

> 2026-06-21 · 브랜치 `feat/medications`

## 목적
강아지별 약 등록 + 복용 시간 스케줄 + 오늘 복용 체크 + 잔량/누락 추적. MVP 1b의 데이터·UI 기반.
정시 알림(cron + 이메일/카톡/텔레그램)은 **1b-ii로 분리, 여기선 제외**(외부 서비스·cron 의존).

## 데이터 모델 (설계 문서 스케치 기반, cron 전이라 lean)
```prisma
model Medication {
  id String @id @default(cuid())
  dogId String
  dog Dog @relation(fields: [dogId], references: [id], onDelete: Cascade)
  name String
  dosage String?        // "5mg", "1정" (선택)
  times String[]        // ["08:00","20:00"] 일일 스케줄
  remainingCount Int?   // 잔량(선택)
  createdAt DateTime @default(now())
  doses MedicationDose[]
}
model MedicationDose {
  id String @id @default(cuid())
  medicationId String
  medication Medication @relation(fields: [medicationId], references: [id], onDelete: Cascade)
  date String           // YYYY-MM-DD (한국 기준)
  time String           // HH:MM (어느 슬롯을 복용했는지)
  takenAt DateTime @default(now())
  @@unique([medicationId, date, time]) // 슬롯당 하루 한 번
}
```
Dog에 `medications Medication[]`. 마이그레이션 `add_medication`.
> 설계 문서의 `scheduledAt/notified`는 cron(1b-ii) 도입 때 추가. 지금은 date+time 슬롯 + takenAt로 충분.

## API (세션·Bearer 통합 `getUserId`, 강아지 소유확인)
- `GET /api/dogs/[id]/medications` → 약 목록 + **오늘(KST) 복용한 슬롯**(doses where date=today) 포함.
- `POST /api/dogs/[id]/medications` → `{ name(필수), dosage?, times(필수, HH:MM 배열 비어있지 않음), remainingCount? }`. 검증 400.
- `DELETE /api/dogs/[id]/medications/[medId]` → 소유확인(강아지→약) 후 삭제(doses cascade).
- `POST /api/dogs/[id]/medications/[medId]/doses` → `{ time }` → 오늘 슬롯 복용 처리(upsert), `remainingCount` 있으면 1 감소(0 미만 방지).
- `DELETE /api/dogs/[id]/medications/[medId]/doses` → `{ time }` → 오늘 슬롯 복용 취소, `remainingCount` 있으면 1 증가.
- "오늘 KST" 계산은 stats 라우트와 동일(UTC+9 → YYYY-MM-DD).

## react-query (`lib/queries.ts`)
- `qk.medications(dogId)`. `useMedications` / `useAddMedication` / `useDeleteMedication` / `useMarkDose` / `useUnmarkDose`. 변경 시 `qk.medications` invalidate.

## UI — 강아지 상세 `/dogs/[id]` "약" 섹션
- 약 카드: 이름·용량, 복용 시간 슬롯을 **체크 칩**으로(오늘 복용=체크, 탭하면 토글). 지난 시각인데 미체크면 "놓침" 표시. 잔량 낮으면(≤7) 경고.
- 약 추가 폼(이름·용량·시간들 입력) + 약 삭제.
- 빈 상태 안내.

## 테스트
- POST: 소유 아니면 404 / name·times 없으면 400 / 성공 create.
- doses POST: 복용 처리 시 remainingCount 감소 단언 / 소유 404.
- doses DELETE: 취소 시 증가.
- DELETE med: 남의 약 404.
- GET: 소유 스코프 + 오늘 doses 필터.

## 비목표 (YAGNI)
- 알림/cron 없음(1b-ii).
- 약 수정(PATCH) 없음 — 삭제 후 재등록.
- 복용 이력 캘린더/통계 없음(오늘 슬롯만).
