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

**다음**
- 회원정보 표시 (대시보드 인사말 mock "하루맘" → 세션의 진짜 user로).
- 탈퇴하기 (DELETE + `onDelete: Cascade` 활용).
- dogs/records를 mock → 실제 Prisma API로 교체.

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
