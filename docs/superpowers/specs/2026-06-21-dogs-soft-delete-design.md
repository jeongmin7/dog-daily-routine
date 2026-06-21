# soft delete (추억 보관) 설계

> 2026-06-21 · 브랜치 `feat/dogs-soft-delete`

## 목적
강아지를 영구 삭제하기 전에 "보관"할 수 있게 한다. 실수 방지 + 반려견 앱 정서("추억 보관")에 맞는 UX. 보관이 기본, 영구삭제는 보관함에서만.

## 결정 사항
- **대상**: 강아지만 (기록은 강아지에 종속 → 강아지 보관 시 함께 숨겨짐).
- **보관 = 기본 동작**: 상세 "위험 구역"의 삭제를 **보관하기**로 교체. 영구삭제는 보관함에서만.
- **보관함**: 설정에서 들어가는 전용 `/archive` 화면.

## 데이터 모델
`Dog`에 `archivedAt DateTime?` 추가. `null` = 활성, 값 있음 = 보관됨.
마이그레이션 `add_dog_archived_at` (Neon **non-pooled** 연결로).

## API (모두 세션 `userId` 스코프)
- `GET /api/dogs` → `where: { userId, archivedAt: null }` (활성만).
- `GET /api/dogs?archived=true` → `where: { userId, archivedAt: { not: null } }` (보관함 목록).
- `PATCH /api/dogs/[id]` **신규** → body `{ archived: boolean }`. `true` → `archivedAt = now`, `false` → `null`. 소유확인(`findFirst where {id,userId}`) 후. body 검증: `archived`가 boolean 아니면 400.
- `DELETE /api/dogs/[id]` → 변경 없음(하드 삭제 + cascade). 이제 보관함에서만 호출.

## react-query (`lib/queries.ts`)
- `useDogs()` — 활성만(엔드포인트가 필터).
- `useArchivedDogs()` 신규 — `qk.dogsArchived` 키.
- `useArchiveDog()` / `useRestoreDog()` 신규(PATCH) — 성공 시 `qk.dogs` + `qk.dogsArchived` invalidate.
- `useDeleteDog()` 유지 — 영구삭제 시 `qk.dogsArchived`도 invalidate.

## UI
- **상세 `/dogs/[id]`**: "강아지 삭제하기" → "보관하기"(2단계 확인 재사용, 문구 보관 정서). 성공 → `/`.
- **`/archive` 신규**: 보관된 강아지 카드 목록. 각 카드 **복원** + **영구 삭제**(2단계). 빈 상태 안내. 헤더 BackBar.
- **설정**: "보관함" 링크 추가(`/archive`로).

## 테스트
- 기존 `GET /api/dogs` 테스트 업데이트: `where`에 `archivedAt: null` 포함.
- 신규: `?archived=true` 필터 단언 / `PATCH archived:true`→archivedAt 세팅 / `PATCH archived:false`→null / 소유 아니면 404 / `archived` 비boolean 400.

## 비목표 (YAGNI)
- 기록 단위 soft delete 안 함.
- 자동 만료/영구삭제 배치 안 함.
- 보관함 정렬/검색 안 함(단순 목록).
