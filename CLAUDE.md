@AGENTS.md

# 하루 (DogHealth Tracker) — 프로젝트 컨텍스트

> **어느 컴퓨터/세션에서든** 작업을 똑같이 이어가기 위한 안내서.
> 새 세션이면 이 문서부터 읽고, `docs/superpowers/specs`(설계)와 `docs/superpowers/plans`(MVP 0 플랜)를 참고.

## 1. 무슨 프로젝트인가
- **하루** = 강아지 보호자를 위한 일일 건강 트래커 (식사·산책·배변·체중 기록 + 주간 통계).
- **목적: 백엔드 학습 프로젝트.** 프론트엔드 2년차 → Next.js 풀스택 이직 준비.
- 디자인은 Claude Design "하루" 핸드오프 기준. 스카이블루 `#2E92D6` + 코랄 `#FF7A6E`, 발바닥 로고, Pretendard+Inter.

## 2. ⭐ 작업 방식 (가장 중요 — 이대로 협업할 것)
- **백엔드 코드는 사용자가 직접 타이핑한다.** AI는 **코드를 대신 생성하지 않고** 개념·설계 방향·디버깅 힌트만 준다 (학습이 목적).
  - 예외: 순수 보일러플레이트(`lib/prisma.ts` 싱글톤 등)나 설정/플러밍은 AI가 만들어도 됨.
- **UI/디자인 레이어는 AI가 구현한다** ("하루" 시안 기준).
- **개념 먼저, 한 번에 한 단계씩, 천천히.** 한 메시지에 개념 하나. 큰 덩어리로 쏟아내지 말 것.
- **버전/설정은 추측 금지.** 라이브러리 버전·셋업은 최신 공식 문서나 npm 레지스트리로 **확인 후** 안내 (학습 데이터가 오래됐을 수 있음).
- 사용자는 **git·프론트엔드(React/TS)는 잘 안다.** 새로 배우는 건 **백엔드 개념**뿐.

## 3. 기술 스택
- Next.js 16 (App Router, Turbopack) · TypeScript · Tailwind CSS 4
- **Prisma 6** + **Neon Postgres**
- **NextAuth v5 (Auth.js, `next-auth@beta`)** — Credentials provider + JWT 세션
- bcryptjs(비번 해시) · axios(클라 HTTP)
- 배포 예정: Vercel

## 4. 현재 진행 상태 (작업하며 갱신할 것)
**완료**
- UI 8개 화면(하루 시안). 단 dogs/records 데이터는 아직 일부 **mock**(localStorage) — `app/providers.tsx`, `lib/mock-store.ts`.
- Prisma 스키마 3모델 `User ─< Dog ─< DogRecord`(관계 + `onDelete: Cascade`), Neon에 마이그레이션 완료.
- **회원가입**: `POST /api/signup` → bcrypt 해시 + `prisma.user.create` → DB 저장 (동작 확인).
- **로그인**: NextAuth Credentials(`lib/auth.ts`) + `verifyPassword`. 폼 `signIn` 연결, 가드는 `app/(app)/layout.tsx`의 서버 `auth()`, 헤더 `signOut`.
- **회원정보 표시**: 루트 `layout.tsx`에서 `auth()` → `AppProvider initialUser` → `providers.tsx`의 `withSessionUser`로 store.user에 주입. 대시보드 인사말이 실제 이름으로 표시.
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

**다음 — dogs DELETE (= 1단계 마무리)**
> ⭐ 관통 원칙: **모든 엔드포인트는 세션 `user.id`로 스코프** (`where: { userId }`). 남의 강아지/기록 접근 차단. 탈퇴·dogs API에서 쓴 패턴 그대로.
> 격리: `app/providers.tsx`의 mock 액션 내부만 axios로 교체 → UI 코드(`useApp()`)는 유지.
- ✅ ① `GET /api/dogs` · ✅ ② `POST /api/dogs` · ✅ ③ `GET /api/dogs/[id]` · ✅ ④ 기록 `GET`+`POST`(+UI) · ✅ ⑤ 기록 `PATCH`+`DELETE`(+UI)
- ⑥ `DELETE /api/dogs/[id]` ← **여기서 시작.** cascade — 강아지 삭제 시 기록 연쇄 삭제(`onDelete: Cascade`). 소유 확인 후 `dog.delete`. UI는 `providers.tsx`에 강아지 삭제 액션 연결.
- 첫 마디 트리거: "dogs DELETE ⑥ 시작"

## 5. 아키텍처 / 규칙
- **데이터**: `lib/prisma.ts`(싱글톤) → Neon. UI의 mock 의존부는 `app/providers.tsx`만 바꾸면 실제 API로 교체되게 격리.
- **인증**: NextAuth v5 Credentials, **JWT 세션**(DB 어댑터 없음). 가드는 미들웨어 대신 **서버 레이아웃에서 `auth()`** (Prisma가 edge 비호환이라).
- **API 규칙**: AGENTS.md 참고 (json만 · 정확한 status code · 에러 `{error}` · 검증 프론트1차+백2차 · 인증 API는 Bearer→API 분리 단계에서).
- **모델 요약**: `User`(id, email@unique, password=해시, name?, createdAt) / `Dog`(+userId FK, name, breed?, birthdate?, weight?) / `DogRecord`(+dogId FK, date, meal?, walkMin?, walkKm?, poop?, weight?, memo?).

## 6. 새 컴퓨터에서 셋업
1. `npm install`
2. **`.env` 생성** (gitignore됨, 절대 커밋 X) — 2개 필요:
   ```
   DATABASE_URL="postgresql://...neon.tech/neondb?sslmode=require"   # ⚠️ 직접(non-pooled) 연결!
   AUTH_SECRET="..."                                                  # openssl rand -base64 32
   ```
3. `npx prisma generate` (필요시 `npx prisma migrate dev`)
4. `npm run dev` → http://localhost:3000

## 7. ⚠️ 이미 겪은 함정 (반복 금지)
- **Prisma 마이그레이션은 풀링(`-pooler`) 연결에서 깨진다.** `DATABASE_URL`은 **직접(non-pooled)** 주소 사용. `prepared statement already exists` 에러가 그 증상.
- **Prisma CLI는 `.env`를 읽지 `.env.local`을 안 읽는다.** 시크릿은 `.env`에.
- **환경변수(AUTH_SECRET 등) 추가/변경 시 dev 서버 재시작** 필요 (시작 때만 로딩).
- **NextAuth는 `@beta`(v5)** 가 App Router용. `latest`(v4)는 Pages Router용이라 안 맞음.
- 클라 컴포넌트에선 `signIn`/`signOut`을 **`next-auth/react`** 에서 import (서버용 `lib/auth`의 것 아님).

## 8. 어디에 뭐가 있나
- `docs/superpowers/specs/*` — 설계 / `docs/superpowers/plans/*` — MVP 0 단계별 플랜 / `docs/design-briefs/*` — 디자인 명세
- `lib/` — prisma · auth · password · format · types · mock-store
- `app/api/` — signup · auth / `app/(auth)/` — login·signup / `app/(app)/` — 대시보드 등
