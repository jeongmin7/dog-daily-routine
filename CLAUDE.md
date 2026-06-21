@AGENTS.md

# 하루 (DogHealth Tracker) — 프로젝트 컨텍스트

> **어느 컴퓨터/세션에서든** 작업을 똑같이 이어가기 위한 안내서.
> 새 세션이면 이 문서부터 읽고, `docs/superpowers/specs`(설계)와 `docs/superpowers/plans`(MVP 0 플랜)를 참고.

## 1. 무슨 프로젝트인가
- **하루** = 강아지 보호자를 위한 일일 건강 트래커 (식사·산책·배변·체중 기록 + 주간 통계).
- **목적: 포트폴리오/사이드 프로젝트.** (원래 백엔드 학습용으로 시작 → 2026-06-21 방향 전환. 학습용은 더 단순한 걸로 따로, 이 레포는 "Claude를 얼마나 잘 썼는지" 보여주는 완성형 사이드 프로젝트로.) 프론트엔드 2년차 → Next.js 풀스택 이직 준비.
- 디자인은 Claude Design "하루" 핸드오프 기준. 스카이블루 `#2E92D6` + 코랄 `#FF7A6E`, 발바닥 로고, Pretendard+Inter.

## 2. ⭐ 작업 방식 (가장 중요 — 이대로 협업할 것)
- **이제 AI가 코드를 전부 작성한다** (백엔드 포함). 학습 제약(사용자 직접 타이핑) 해제 — 포트폴리오 완성이 목표. 2026-06-21 전환.
- **UI/디자인 레이어는 "하루" 시안 기준**으로 구현.
- **기능별 브랜치 필수**: `feat/* → develop → main`(PR). 잊지 말 것. 커밋 메시지 번호는 일반 숫자, **Co-Authored-By 트레일러 금지** (메모리 참고).
- **버전/설정은 추측 금지.** 라이브러리 버전·셋업은 최신 공식 문서나 npm 레지스트리로 **확인 후** 안내 (학습 데이터가 오래됐을 수 있음).
- 사용자는 **git·프론트엔드(React/TS)는 잘 안다.**

## 3. 기술 스택
- Next.js 16 (App Router, Turbopack) · TypeScript · Tailwind CSS 4
- **Prisma 6** + **Neon Postgres**
- **NextAuth v5 (Auth.js, `next-auth@beta`)** — Credentials provider + JWT 세션
- **TanStack Query 5 (서버 상태) + Zustand 5 (클라 UI 상태)** — 2026-06-21 도입
- bcryptjs(비번 해시) · axios(클라 HTTP)
- 배포 예정: Vercel

## 4. 현재 진행 상태 (작업하며 갱신할 것)
**완료**
- UI 8개 화면(하루 시안). dogs/records/stats는 전부 실제 API(react-query)로 연결됨 (mock/localStorage 제거 완료).
- **react-query + zustand 마이그레이션** (2026-06-21 완료): 기존 Context 단일 store(`app/providers.tsx`) + `lib/mock-store.ts`(localStorage 폴백)를 걷어내고 → 서버 상태는 **TanStack Query**(`lib/queries.ts`: 쿼리키 팩토리 `qk` + `useDogs/useDog/useRecords/useDogStats` + mutation 훅들, mutation 성공 시 `invalidateQueries`), 클라 상태는 **zustand**(`lib/store.ts` `useUserStore` — 서버 세션 유저만 시드). `providers.tsx`는 이제 `QueryClientProvider` + 유저 스토어 시드(+세션 변경 시 effect로 재동기화)만. 죽은 legacy(`authed/login/logout/resetData`, `Store/User` 타입, `recordsForDog`) 정리. 대시보드 "최근 기록(전체)"은 `useQueries`로 강아지별 기록 병렬 수집. 브랜치 `feat/react-query-zustand`(PR #10 → develop).
  - ✅ **런타임 검증 완료** (chrome-devtools MCP로 가입→로그인→강아지 등록→기록 작성→수정→삭제→탈퇴 전 플로우, 콘솔 에러 0). **stats 차트 런타임 검증도 이때 같이 통과**(식사 평균/산책 총합/체중 추이 숫자 확인). 검증 중 **유저 이름 인사말 회귀 1건 발견·수정**: zustand 시드를 `useState` 1회성으로 해서 로그인 후 `router.refresh`로 세션이 채워져도 스토어가 안 바뀌던 버그 → effect 동기화로 수정(커밋 9f1a54f).
- Prisma 스키마 3모델 `User ─< Dog ─< DogRecord`(관계 + `onDelete: Cascade`), Neon에 마이그레이션 완료.
- **회원가입**: `POST /api/signup` → bcrypt 해시 + `prisma.user.create` → DB 저장 (동작 확인).
- **로그인**: NextAuth Credentials(`lib/auth.ts`) + `verifyPassword`. 폼 `signIn` 연결, 가드는 `app/(app)/layout.tsx`의 서버 `auth()`, 헤더 `signOut`.
- **회원정보 표시**: 루트 `layout.tsx`에서 `auth()` → `AppProvider initialUser` → `providers.tsx`가 `useUserStore`(zustand)에 시드. 대시보드 인사말이 `useUserStore`에서 이름을 읽어 표시.
- **탈퇴하기**: `DELETE /api/account` — 세션 user.id로 `prisma.user.delete`(클라 입력 신뢰 X), `onDelete: Cascade`로 강아지·기록 연쇄 삭제. UI는 `app/(app)/settings` + `components/settings-client.tsx`(2단계 확인 → fetch → `signOut`).
- **배포**: Vercel `dog-daily-routine` 프로젝트(중복 2개 정리 완료), production = `main` 브랜치. `turbopack.root` 고정(떠도는 lockfile로 루트 오인 → 패닉 해결). git-flow: `feat/* → develop → main`(PR). 모든 기능 production 반영됨.
- **dogs API (① ② ③) + UI 연결** (2026-06-10 완료, production 반영):
  - `GET /api/dogs` 목록(`where: { userId }`) · `POST /api/dogs` 생성(body 400 검증 + `userId`는 세션 주입) · `GET /api/dogs/[id]` 단건(`findFirst where: { id, userId }` → 못 찾거나 남의 것이면 404).
  - 동적 라우트 시그니처는 Next 16 기준 `{ params }: { params: Promise<{ id }> }` + `await params`.
  - UI 연결: `providers.tsx`가 마운트 시 `GET /api/dogs`로 목록 로드, `addDog`는 `axios.post('/api/dogs')` 비동기로. **클라 HTTP는 axios 컨벤션**(signup과 동일).
- **기록(records) API ④ + UI 연결** (2026-06-11 완료, production 반영):
  - `GET /api/dogs/[id]/records` 목록 · `POST /api/dogs/[id]/records` 생성 — 둘 다 **중첩 소유 확인**(강아지 `findFirst where { id, userId }` 통과 후에만 기록 접근). `dogId`는 body 아닌 검증된 `dog.id`, `date` 필수(400), 잘못된 JSON body(400).
  - UI: `providers.tsx` 마운트 시 강아지별 `GET .../records` 병렬 로드 → `store.records`, `addRecord`는 `axios.post`. `record-form` 저장 핸들러는 await 기반(실패 시 busy 해제+알림).
- **기록(records) API ⑤ PATCH/DELETE + UI 연결** (2026-06-15 완료):
  - `PATCH`·`DELETE /api/dogs/[id]/records/[recordId]` — **3단계 소유 확인**(세션 `user.id` → 강아지 `findFirst where { id, userId }` → 기록 `findFirst where { id: recordId, dogId: dog.id }`). 둘 중 하나라도 못 찾으면 404 → "내 강아지 id + 남의 기록 id" 조합 차단.
  - PATCH: 필드 **화이트리스트**로 부분 수정(`...body` 금지 — mass assignment 차단), 안 보낸 필드는 `undefined`라 Prisma `update`가 안 건드림. `date` 필수 검증 없음(수정이라). 잘못된 JSON은 `req.json()`만 따로 try/catch로 400. DELETE: 소유 확인 후 `delete`, 200+message. `DELETE`는 `req` 미사용 → 첫 인자 `_req`(자리 유지, params는 항상 2번째).
  - UI: `providers.tsx`의 `updateRecord`/`deleteRecord`를 `axios.patch`/`delete`로. dogId는 `store.records`에서 record 찾아 조회(useApp 시그니처 유지=격리), 서버 응답으로 store 갱신, deps에 `store.records`. `page.tsx` 핸들러 await 기반(성공 후 이동), `record-form` 삭제도 저장처럼 busy+실패 alert. 브랜치: `feat/records-patch-delete`(API)·`feat/records-ui-edit-delete`(UI) — **API 먼저 머지 후 UI**(UI가 API 위에서 분기).
- **강아지(dogs) DELETE ⑥ + UI 연결** (2026-06-15 완료):
  - `DELETE /api/dogs/[id]` — 경로 파라미터 id, 세션 `user.id`로 소유 확인(`findFirst` → 못 찾으면 404) 후 `dog.delete`. 기록은 스키마 `onDelete: Cascade`로 연쇄 삭제. (작업 중 `/api/dogs` 컬렉션에 body 기반 DELETE를 잠깐 뒀다가 경로 방식 `[id]/route.ts`로 옮기고 중복 제거.)
  - UI: `providers.tsx`에 `deleteDog(id)` 추가(`axios.delete` 후 store에서 강아지 + 해당 강아지 기록 제거 = cascade와 화면 동기). `dogs/[id]/page.tsx` 하단 "위험 구역" 카드 — settings 탈퇴와 동일한 2단계 확인 패턴. 브랜치 `feat/dogs-delete`(API+UI 한 브랜치, CLI로 develop·main 직접 머지).
  - ⭐ **1단계(기본 CRUD ①~⑥) 완료.**

**⭐ MVP 0 기능 완료 (CRUD ①~⑥ + ⓐ 주간통계 모두 production 반영). 남은 건 선택/후속.**
> ⭐ 관통 원칙(앞으로도 유지): **모든 엔드포인트는 세션 `user.id`로 스코프** (`where: { userId }`). 남의 강아지/기록 접근 차단.
- ✅ 기본 CRUD ①~⑥ 완료(모두 +UI, production): ① `GET /api/dogs` · ② `POST /api/dogs` · ③ `GET /api/dogs/[id]` · ④ 기록 `GET`+`POST` · ⑤ 기록 `PATCH`+`DELETE` · ⑥ `DELETE /api/dogs/[id]`.
- ✅ **ⓐ 주간 통계 백엔드화 완료** (2026-06-16, production): `GET /api/dogs/[id]/stats` — 소유확인 + **한국(UTC+9) 기준 7일 범위**(`date`가 ISO `YYYY-MM-DD` String이라 `gte` **문자열 사전순 비교**가 곧 날짜 비교) + 집계. 지표별 집계 = **유량/저량 구분**: meal `avg`·walk `sum`(+avg)·weight `latest`+`change`. **평균/합계는 null(미기록) 제외, 분모 = 기록한 날 수**(7 아님), 빈 지표는 `null`. UI: `lib/types.ts`에 `DogStats`, `WeeklyStats`가 `store.records` 클라계산 대신 stats API의 `series`/요약값 사용(`dogs/[id]/page.tsx`가 마운트 시 fetch). 브랜치 `feat/dogs-stats-api`(API+UI 한 브랜치, CLI 직접 머지). ✅ **로컬·production 런타임 검증 모두 완료**(2026-06-21, chrome-devtools MCP로 차트 숫자 눈 확인 — 식사 avg/산책 sum/체중 latest 입력값 일치).
- ✅ **ⓑ API 회귀 테스트 한 배치 완료** (2026-06-21, 브랜치 `feat/api-regression-tests`): **vitest**(`vitest.config.ts`, node env, `@` 별칭) 도입. 전략은 위 (A) — **라우트 핸들러를 직접 import + `@/lib/auth`·`@/lib/prisma`를 `vi.mock`**(서비스 레이어 추출 안 함). `tests/` 4파일 **20개**: dogs(GET/POST), dog-id(GET/DELETE), records(GET/POST), record-id(PATCH/DELETE). 커버리지 = **소유 스코프**(`where {id,userId}` 호출 단언, 남의 것 404), **인증**(세션 없으면 401), **검증**(date 필수 400·잘못된 JSON 400·이름 필수 400), **mass-assignment 차단**(POST는 userId/dogId를 세션·검증된 dog.id로 주입, PATCH는 화이트리스트 외 필드 update에 미전달). 뮤테이션 테스트로 회귀 포착 확인(소유확인에서 userId 빼면 빨강). 실행: `npm test`. **추가 기능 PR 전 `npm test` 돌릴 것.**
- ✅ **soft delete(추억 보관) 완료** (2026-06-21, 브랜치 `feat/dogs-soft-delete`, 로컬 런타임 검증 완료): 강아지 한정. `Dog.archivedAt DateTime?` 추가(마이그레이션 `add_dog_archived_at`). `GET /api/dogs`는 활성(`archivedAt: null`)만, `?archived=true`면 보관함. `PATCH /api/dogs/[id]` 신규 = `{archived:boolean}` 보관/복원(소유확인 후, boolean 아니면 400). `DELETE`는 그대로 영구삭제(보관함에서만). react-query에 `useArchivedDogs`/`useSetDogArchived` 추가(`qk.dogs` invalidate가 prefix로 보관함까지 커버). UI: 상세 "위험 구역" 삭제→**보관하기**로 교체, **`/archive`** 보관함 화면(복원+영구삭제 2단계), 설정에 보관함 링크. 테스트 5개 추가(총 25). 설계 spec: `docs/superpowers/specs/2026-06-21-dogs-soft-delete-design.md`.
- ✅ **Bearer 토큰(개인 API 토큰) 완료** (2026-06-21, 브랜치 `feat/api-bearer-tokens`, 로컬 런타임+curl 검증 완료): `ApiToken` 모델(userId, name, tokenHash@unique=sha256, lastUsedAt) + 마이그레이션 `add_api_token`. **통합 인증 `lib/api-auth.ts` `getUserId(req)`**: `Authorization: Bearer` 있으면 sha256 해시로 `apiToken.findUnique` → lastUsedAt 갱신 후 userId, 없으면 `auth()` 세션 폴백, 둘 다 없으면 null. **모든 `/api/dogs/*` 라우트가 `auth()` → `getUserId(req)`로 전환**(세션·Bearer 둘 다 수용). 토큰 관리 API는 **세션 전용**: `POST /api/tokens`(평문 1회 반환, DB엔 해시만) · `GET /api/tokens`(해시 미반환) · `DELETE /api/tokens/[id]`(소유확인). UI: 설정에 "API 토큰" 섹션(`components/api-tokens-client.tsx` — 발급 시 평문 1회 노출+복사, 목록, revoke). queries에 `useApiTokens/useCreateApiToken/useRevokeApiToken`. 테스트: route 테스트 모킹을 `@/lib/auth`→`@/lib/api-auth`(getUserId)로 전환 + getUserId·tokens 신규 → **총 37개**. curl로 Bearer 인증(쿠키 없이 201/200)·잘못된 토큰 401·revoke 후 401 확인. 설계 spec: `docs/superpowers/specs/2026-06-21-api-bearer-tokens-design.md`.
- ✅ **ⓒ seed 스크립트 완료** (2026-06-21, 브랜치 `chore/prisma-seed`): `prisma/seed.ts` — `npx prisma db seed`/`npm run db:seed`. **idempotent**(데모 유저 `demo@haru.test`/`demo1234` upsert → 그 유저 강아지 deleteMany(cascade) → "보리" + 7일치 기록 재생성). `prisma.config.ts`에 `migrations.seed: "tsx prisma/seed.ts"`, `tsx` devDep 추가. ⚠️ 데모 계정은 Neon(공유 DB)에 실제 생성됨 — 포트폴리오 데모 로그인 용도, 불필요하면 탈퇴로 제거.
- 🎉 **MVP 0 + 견고화(테스트·soft delete·Bearer·CI·seed) 완료.**
- 🚧 **MVP 1a 사진 일지 — 코드 완료, Blob 토큰 대기** (2026-06-21, 브랜치 `feat/dog-photos`): `Photo(dogId, url, caption?, createdAt)` 모델 + 마이그레이션 `add_photo`. **Vercel Blob 서버 업로드**(`@vercel/blob` `put`/`del`). API: `GET/POST /api/dogs/[id]/photos`(multipart, 소유확인·이미지검증·4MB 한계) · `DELETE .../photos/[photoId]`(3단계 소유확인 + blob del). UI: 강아지 상세 "사진 일지" 섹션(`components/dog-photos.tsx` — 썸네일 그리드·미리보기·캡션·삭제). queries `usePhotos/useUploadPhoto/useDeletePhoto`. 테스트 +6(총 44, `@vercel/blob` 모킹). build·tsc·lint·UI(빈 상태 렌더)·콘솔0 확인. ⚠️ **실제 업로드 왕복은 미검증** — `BLOB_READ_WRITE_TOKEN` 필요(Vercel 대시보드 Storage→Blob 스토어 생성 후 프로젝트 연결 → production 자동, 로컬은 `.env`에). 설계 spec: `docs/superpowers/specs/2026-06-21-dog-photos-design.md`.
- 로드맵 남은 것: **MVP 1b**(약 복용 알림 — cron+알림채널) · **MVP 2**(지병별 동적 모니터링) · **MVP 3**(AI 사료분석) · **MVP 4**(NestJS+Docker 분리).

## 5. 아키텍처 / 규칙
- **데이터(서버 상태)**: `lib/prisma.ts`(싱글톤) → Neon. 클라는 `lib/queries.ts`의 react-query 훅으로만 접근(직접 axios/`useEffect` fetch 금지). 새 엔드포인트 추가 시 fetcher + 쿼리/뮤테이션 훅을 여기 추가하고, 쓰기 후엔 관련 `qk` 키를 invalidate.
- **클라 UI 상태**: zustand `lib/store.ts`(`useUserStore`). 서버 상태를 여기 복제하지 말 것 — 서버에서 오는 건 전부 react-query.
- **인증**: NextAuth v5 Credentials, **JWT 세션**(DB 어댑터 없음). 가드는 미들웨어 대신 **서버 레이아웃에서 `auth()`** (Prisma가 edge 비호환이라).
- **API 규칙**: AGENTS.md 참고 (json만 · 정확한 status code · 에러 `{error}` · 검증 프론트1차+백2차 · 인증 API는 Bearer→API 분리 단계에서).
- **모델 요약**: `User`(id, email@unique, password=해시, name?, createdAt) / `Dog`(+userId FK, name, breed?, birthdate?, weight?) / `DogRecord`(+dogId FK, date, meal?, walkMin?, walkKm?, poop?, weight?, memo?).

## 6. 새 컴퓨터에서 셋업
1. `npm install`
2. **`.env` 생성** (gitignore됨, 절대 커밋 X) — `cp .env.example .env` 후 값 채우기. 2개 필요:
   ```
   DATABASE_URL="postgresql://...neon.tech/neondb?sslmode=require"   # ⚠️ 직접(non-pooled) 연결!
   AUTH_SECRET="..."                                                  # openssl rand -base64 32
   ```
3. `npx prisma generate` (필요시 `npx prisma migrate dev`)
- 품질 게이트: `npm run lint`(ESLint flat config, eslint 9.x + eslint-config-next) · `npm test`(vitest) · `npx tsc --noEmit`. **PR마다 GitHub Actions(`.github/workflows/ci.yml`)가 tsc+lint+test 자동 실행**(DB 미연결, prisma 모킹).
4. `npm run dev` → http://localhost:3000

## 7. ⚠️ 이미 겪은 함정 (반복 금지)
- **Prisma 마이그레이션은 풀링(`-pooler`) 연결에서 깨진다.** `DATABASE_URL`은 **직접(non-pooled)** 주소 사용. `prepared statement already exists` 에러가 그 증상.
- **Prisma CLI는 `.env`를 읽지 `.env.local`을 안 읽는다.** 시크릿은 `.env`에.
- **환경변수(AUTH_SECRET 등) 추가/변경 시 dev 서버 재시작** 필요 (시작 때만 로딩).
- **NextAuth는 `@beta`(v5)** 가 App Router용. `latest`(v4)는 Pages Router용이라 안 맞음.
- 클라 컴포넌트에선 `signIn`/`signOut`을 **`next-auth/react`** 에서 import (서버용 `lib/auth`의 것 아님).

## 8. 어디에 뭐가 있나
- `docs/superpowers/specs/*` — 설계 / `docs/superpowers/plans/*` — MVP 0 단계별 플랜 / `docs/design-briefs/*` — 디자인 명세
- `lib/` — prisma · auth · api-auth(Bearer+세션 통합 getUserId) · password · format · types · queries(react-query) · store(zustand)
- `app/api/` — signup · auth / `app/(auth)/` — login·signup / `app/(app)/` — 대시보드 등
- `tests/` — vitest API 회귀 테스트(`*.test.ts` + `helpers.ts`), `vitest.config.ts`(루트)
