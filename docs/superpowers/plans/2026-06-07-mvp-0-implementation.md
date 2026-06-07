# MVP 0 — 기본 일상 트래커 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 회원가입 → 강아지 등록 → 일일 기록 입력/조회까지 가능한 기본 트래커 1주차 구현.

**Architecture:** Next.js 16 App Router 모놀리스 + Prisma + Neon Postgres (dev/test/prod 3-branch). 백엔드는 Route Handlers + Server Actions. 인증은 NextAuth Credentials. UI는 shadcn/ui + Tailwind. **Deploy on Day 1: GitHub + Vercel 자동 배포.**

**Tech Stack:** Next.js 16, TypeScript, Prisma, Neon Postgres, NextAuth v5(Auth.js), shadcn/ui, Tailwind, Vitest, react-hook-form, zod, Recharts, Vercel (배포).

**학습 목표 (백엔드 위주):**
- Route Handlers와 Server Actions의 차이/사용처
- Prisma 스키마 정의·마이그레이션·CRUD 패턴
- 비밀번호 해싱 / 세션 / 보호 라우트
- 도메인 검증(zod) / 권한 체크 / 에러 응답 규약

---

## 사전 약속 (전체에 적용)

1. **AI 사용 원칙:** 코드 생성 요청 ❌ / 막힌 개념 질문 ⭕. 모든 코드는 본인이 타이핑.
2. **TDD:** 가능한 모든 백엔드 로직은 테스트 먼저. UI는 수동 검증 OK.
3. **커밋:** 각 Task 종료마다 커밋. 메시지는 conventional commits (`feat:`, `fix:`, `chore:`, `test:`).
4. **브랜치:** `main`에 직접 작업 (혼자 학습 프로젝트). 단, 큰 단위는 PR-스타일 메시지로 commit body 작성.
5. **막힘 신호:** 30분 막히면 Claude에게 "왜 안 되는지" 질문 (정답 X, 방향만).

---

## 화면 흐름 (MVP 0)

```
┌────────────────────────────────────────────────────────┐
│                                                        │
│  [비로그인] ─→ /login ─→ 로그인 ─→ /                   │
│                  ↓                                     │
│              /signup ─→ 가입 ─→ /login                 │
│                                                        │
│  [로그인]                                              │
│                                                        │
│   /  (대시보드)                                        │
│    ├─ 강아지 카드 (없으면 "강아지 등록하기" 버튼)      │
│    ├─ 오늘 기록 요약                                   │
│    └─ 빠른 기록 버튼 ─→ /dogs/[id]/records/new        │
│                                                        │
│   /dogs/new ─→ 강아지 등록 ─→ /dogs/[id]              │
│                                                        │
│   /dogs/[id] (강아지 상세)                             │
│    ├─ 강아지 정보                                      │
│    ├─ 주간 차트 (식사·산책·체중)                       │
│    ├─ 일일 기록 목록                                   │
│    └─ "새 기록" 버튼                                   │
│                                                        │
│   /dogs/[id]/records/new ─→ 기록 작성 ─→ /dogs/[id]   │
│   /dogs/[id]/records/[recordId] ─→ 보기·수정·삭제     │
│                                                        │
└────────────────────────────────────────────────────────┘
```

---

## 파일 구조 (생성 후 모습)

```
dog-health-tracker/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   └── signup/page.tsx
│   ├── (app)/
│   │   ├── layout.tsx                       # 인증 가드 + 헤더
│   │   ├── page.tsx                         # 대시보드 /
│   │   └── dogs/
│   │       ├── new/page.tsx
│   │       └── [id]/
│   │           ├── page.tsx                 # 강아지 상세
│   │           └── records/
│   │               ├── new/page.tsx
│   │               └── [recordId]/page.tsx
│   ├── api/
│   │   ├── auth/[...nextauth]/route.ts
│   │   ├── signup/route.ts
│   │   ├── dogs/route.ts                    # POST 강아지 생성, GET 목록
│   │   └── dogs/[id]/
│   │       ├── route.ts                     # GET/PATCH/DELETE 강아지
│   │       └── records/
│   │           ├── route.ts                 # POST 기록 / GET 목록
│   │           └── [recordId]/route.ts      # GET/PATCH/DELETE 기록
│   ├── layout.tsx                           # 루트 레이아웃
│   └── globals.css                          # Tailwind + 컬러 토큰
├── lib/
│   ├── auth.ts                              # NextAuth 설정
│   ├── prisma.ts                            # Prisma 클라이언트 싱글톤
│   ├── password.ts                          # bcrypt 래퍼
│   ├── validators/
│   │   ├── auth.ts
│   │   ├── dog.ts
│   │   └── record.ts
│   └── services/
│       ├── dog.service.ts
│       └── record.service.ts
├── components/
│   ├── ui/                                  # shadcn/ui (자동 생성)
│   ├── auth/
│   │   ├── login-form.tsx
│   │   └── signup-form.tsx
│   ├── dog/
│   │   ├── dog-card.tsx
│   │   └── dog-form.tsx
│   ├── record/
│   │   ├── record-form.tsx
│   │   ├── record-list.tsx
│   │   └── record-card.tsx
│   └── dashboard/
│       ├── empty-state.tsx
│       └── weekly-chart.tsx
├── middleware.ts                            # 인증 보호 라우트
├── prisma/
│   ├── schema.prisma
│   └── migrations/
├── tests/
│   ├── services/
│   │   ├── dog.service.test.ts
│   │   └── record.service.test.ts
│   ├── validators/
│   │   ├── auth.test.ts
│   │   ├── dog.test.ts
│   │   └── record.test.ts
│   ├── api/
│   │   ├── signup.test.ts
│   │   ├── dogs.test.ts
│   │   └── records.test.ts
│   └── setup.ts
├── .env.local                                # 시크릿 (gitignore)
├── .env.example                              # 템플릿
├── vitest.config.ts
├── package.json
└── README.md
```

설계 원칙: 비즈니스 로직은 `lib/services/*`에 격리(테스트 쉽게), API 라우트는 입력 검증 + 서비스 호출 + 응답 변환만 담당. UI는 데이터 가져오기 + 표시 + 폼.

---

## Phase 1: 프로젝트 셋업 (Day 1, 2-3시간)

---

### Task 1: Next.js 프로젝트 초기화

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.ts`, `app/layout.tsx`, `app/page.tsx`, `app/globals.css`

- [ ] **Step 1: Next.js 프로젝트 생성**

```bash
cd /Users/jeongmin/Desktop/backend/dog-health-tracker
npx create-next-app@latest . --typescript --tailwind --app --src-dir=false --import-alias="@/*" --no-eslint --turbopack --use-npm
```

질문 답:
- TypeScript? Yes
- Tailwind? Yes
- App Router? Yes
- import alias? `@/*`

기존 docs/ 디렉토리는 건들지 않음 (Next.js는 app/만 보니까 OK).

- [ ] **Step 2: 실행 확인**

```bash
npm run dev
```
브라우저 `http://localhost:3000`에서 기본 페이지 떠야 함. Ctrl+C로 종료.

- [ ] **Step 3: .gitignore에 .env.local 추가 확인**

`.gitignore` 파일에 `.env*.local` 라인 존재 확인.

- [ ] **Step 4: git 초기화 + 첫 커밋**

```bash
git init
git add .
git commit -m "chore: initialize Next.js project"
```

---

### Task 1.5: Hello World Vercel 배포 (Deploy on Day 1)

> **포트폴리오용 핵심 원칙:** 첫날부터 prod URL 확보. 매 push마다 자동 배포되어 매 MVP마다 가시적 산출물 생김.

**Files:** (코드 변경 없음, GitHub + Vercel 설정만)

- [ ] **Step 1: GitHub repo 생성**

GitHub에 새 repo 생성 (이름: `dog-health-tracker`, **public 권장** — 포트폴리오용).

```bash
git remote add origin https://github.com/<your-username>/dog-health-tracker.git
git branch -M main
git push -u origin main
```

- [ ] **Step 2: Vercel 프로젝트 연결**

1. https://vercel.com 접속 → GitHub 로그인
2. "Add New Project" → 방금 push한 repo 선택
3. Framework Preset: Next.js (자동 감지)
4. Root Directory: `.` (기본값)
5. Build/Output 설정: 모두 기본값
6. Environment Variables: 지금은 추가하지 않음 (Task 3에서 DATABASE_URL, Task 9에서 AUTH_SECRET 추가 예정)
7. "Deploy" 클릭

약 1-2분 대기 후 배포 완료. URL 확인 (예: `dog-health-tracker-xxx.vercel.app`).

- [ ] **Step 3: 배포된 URL에 접속해서 확인**

브라우저에서 Vercel이 준 URL 열어서 Next.js 기본 페이지 보이면 성공.

- [ ] **Step 4: README에 배포 URL 추가**

`README.md` 작성:

```markdown
# 🐕 DogHealth Tracker

[![Live Demo](https://img.shields.io/badge/live-demo-success)](https://your-url.vercel.app)

지병이 있는 강아지 보호자를 위한 헬스 트래커. 모든 강아지 보호자 사용 가능.

**Live:** https://your-url.vercel.app

(나머지 README는 Task 25에서 작성)
```

- [ ] **Step 5: 커밋 + push (자동 재배포 확인)**

```bash
git add README.md
git commit -m "docs: add live demo URL"
git push
```

push 후 1-2분 뒤 Vercel 대시보드에서 새 배포가 자동 생성된 것 확인. 이후 모든 `git push`는 자동 배포 트리거.

> **체크포인트:** 이후 각 Task 끝에 `git push`만 하면 prod 자동 업데이트. 이게 "Deploy on Day 1" 원칙의 진짜 가치.

---

### Task 2: shadcn/ui 초기화 + 컬러 팔레트 적용

**Files:**
- Modify: `app/globals.css` (CSS variables)
- Create: `components.json` (shadcn 자동 생성)

- [ ] **Step 1: shadcn 초기화**

```bash
npx shadcn@latest init
```
질문 답:
- Style: New York
- Base color: Slate (이후 globals.css에서 덮어쓸 거임)
- CSS variables? Yes

- [ ] **Step 2: globals.css 컬러 토큰 덮어쓰기**

`app/globals.css`의 `:root`와 `.dark` 블록을 다음으로 교체:

```css
@import "tailwindcss";

@layer base {
  :root {
    --background: 0 0% 100%;            /* #FFFFFF */
    --foreground: 215 32% 17%;          /* #1F2A3A */
    --card: 0 0% 100%;
    --card-foreground: 215 32% 17%;
    --popover: 0 0% 100%;
    --popover-foreground: 215 32% 17%;
    --primary: 211 41% 49%;             /* #4B7BAD */
    --primary-foreground: 0 0% 100%;
    --secondary: 210 38% 95%;           /* #EEF3F8 */
    --secondary-foreground: 215 32% 17%;
    --muted: 210 27% 90%;               /* #DDE5EE */
    --muted-foreground: 215 16% 47%;
    --accent: 5 100% 72%;               /* #FF7A6E */
    --accent-foreground: 0 0% 100%;
    --destructive: 0 73% 58%;           /* #E04848 */
    --destructive-foreground: 0 0% 100%;
    --warning: 38 88% 59%;              /* #F2A93B */
    --warning-foreground: 215 32% 17%;
    --success: 149 41% 49%;             /* #4CAF7C */
    --success-foreground: 0 0% 100%;
    --border: 210 27% 90%;
    --input: 210 27% 90%;
    --ring: 211 41% 49%;
    --radius: 0.5rem;
  }

  .dark {
    --background: 215 32% 10%;
    --foreground: 210 38% 95%;
    --card: 215 32% 14%;
    --card-foreground: 210 38% 95%;
    --popover: 215 32% 14%;
    --popover-foreground: 210 38% 95%;
    --primary: 211 50% 60%;
    --primary-foreground: 215 32% 10%;
    --secondary: 215 27% 20%;
    --secondary-foreground: 210 38% 95%;
    --muted: 215 27% 20%;
    --muted-foreground: 215 16% 65%;
    --accent: 5 90% 65%;
    --accent-foreground: 215 32% 10%;
    --destructive: 0 60% 50%;
    --destructive-foreground: 210 38% 95%;
    --warning: 38 80% 55%;
    --warning-foreground: 215 32% 10%;
    --success: 149 45% 45%;
    --success-foreground: 210 38% 95%;
    --border: 215 27% 25%;
    --input: 215 27% 25%;
    --ring: 211 50% 60%;
  }
}

@layer base {
  * { @apply border-border; }
  body { @apply bg-background text-foreground; }
}
```

- [ ] **Step 3: Tailwind config에 warning/success 컬러 매핑**

`tailwind.config.ts`에 다음 추가 (`extend.colors`):

```ts
warning: {
  DEFAULT: "hsl(var(--warning))",
  foreground: "hsl(var(--warning-foreground))",
},
success: {
  DEFAULT: "hsl(var(--success))",
  foreground: "hsl(var(--success-foreground))",
},
```

- [ ] **Step 4: 기본 컴포넌트 설치**

```bash
npx shadcn@latest add button input label card form dialog dropdown-menu avatar badge toast skeleton textarea select calendar popover
```

- [ ] **Step 5: 한글 폰트 추가 (Pretendard)**

`app/layout.tsx`에서 `next/font/local`로 Pretendard 사용하거나, 간단히 globals.css에 CDN 추가:

```css
@import url("https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable.min.css");

body {
  font-family: "Pretendard Variable", -apple-system, BlinkMacSystemFont, sans-serif;
}
```

- [ ] **Step 6: 실행 확인 + 커밋**

```bash
npm run dev
```
페이지 열어서 컬러가 #4B7BAD primary 톤인지 확인. Ctrl+C 후:

```bash
git add .
git commit -m "feat: setup shadcn/ui with Soft Blue + Coral palette"
```

---

### Task 3: Prisma + PostgreSQL (Neon) 셋업

> **왜 Neon?** Vercel 배포 즉시 가능 (serverless 호환), 무료 티어 (0.5GB), Branch 기능으로 dev/test/prod 격리 가능, Prisma 공식 지원.

**Files:**
- Create: `prisma/schema.prisma`, `lib/prisma.ts`, `.env.local`, `.env.example`

- [ ] **Step 1: Neon 가입 + 프로젝트 생성**

1. https://neon.tech 접속 → GitHub로 로그인
2. "Create Project" 클릭
   - Project name: `dog-health-tracker`
   - Postgres version: 16 (최신)
   - Region: `aws-ap-northeast-1` (도쿄, 한국에서 가장 가까움)
3. 생성 후 "Connection String" 복사 (예: `postgresql://user:password@ep-xxx.aws-ap-northeast-1.aws.neon.tech/neondb?sslmode=require`)

- [ ] **Step 2: Neon Branch 생성 (dev / test 분리)**

Neon 대시보드 → Branches 탭:
1. `main` branch는 기본 (= prod용으로 사용)
2. "Create Branch" → 이름 `dev` (로컬 개발용) 생성 → connection string 복사
3. "Create Branch" → 이름 `test` (테스트용) 생성 → connection string 복사

→ 총 3개 DB URL 확보:
- `main` (prod, Vercel용)
- `dev` (로컬 개발용 = .env.local)
- `test` (테스트 실행용)

- [ ] **Step 3: Prisma 설치**

```bash
npm install prisma @prisma/client
npm install -D prisma
npx prisma init --datasource-provider postgresql
```

- [ ] **Step 4: schema.prisma 작성 (MVP 0 모델만)**

`prisma/schema.prisma`:

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id        String   @id @default(cuid())
  email     String   @unique
  password  String
  name      String?
  dogs      Dog[]
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model Dog {
  id        String        @id @default(cuid())
  userId    String
  user      User          @relation(fields: [userId], references: [id], onDelete: Cascade)
  name      String
  breed     String?
  birthDate DateTime?
  weight    Float?        // kg
  records   DailyRecord[]
  createdAt DateTime      @default(now())
  updatedAt DateTime      @updatedAt
  @@index([userId])
}

model DailyRecord {
  id           String   @id @default(cuid())
  dogId        String
  dog          Dog      @relation(fields: [dogId], references: [id], onDelete: Cascade)
  recordedAt   DateTime @default(now())
  mealAmount   Float?   // g, 식사량
  walkMinutes  Int?     // 산책 시간(분)
  walkDistance Float?   // km
  poopCount    Int?     // 배변 횟수
  weight       Float?   // 그날 측정한 체중 (옵션)
  notes        String?
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
  @@index([dogId, recordedAt])
}
```

- [ ] **Step 5: .env.local 설정 (dev branch URL)**

`.env.local` 작성 (Step 2에서 복사한 `dev` branch URL 사용):

```
DATABASE_URL="postgresql://user:password@ep-xxx.aws-ap-northeast-1.aws.neon.tech/neondb?sslmode=require"
AUTH_SECRET="run-openssl-rand-base64-32-and-paste-here"
AUTH_URL="http://localhost:3000"
```

`AUTH_SECRET` 생성:
```bash
openssl rand -base64 32
```
출력값을 `.env.local`에 붙여넣기.

`.env.example`도 같은 키만 (값은 placeholder) 작성하고 commit.

- [ ] **Step 6: Vercel에 prod 환경변수 등록 (main branch URL)**

Vercel 대시보드 → 프로젝트 → Settings → Environment Variables:
- `DATABASE_URL` = Neon **main** branch URL (Step 2에서 복사)
- `AUTH_SECRET` = `openssl rand -base64 32` (로컬과 다른 새 값 권장)
- `AUTH_URL` = Vercel이 준 prod URL (예: `https://dog-health-tracker-xxx.vercel.app`)

3개 모두 "Production" + "Preview" + "Development" 다 체크.

- [ ] **Step 7: 마이그레이션 실행 (dev branch)**

```bash
npx prisma migrate dev --name init
```

Neon dev branch에 테이블 생성됨. Neon 대시보드 → Tables 탭에서 `User`, `Dog`, `DailyRecord` 확인 가능.

- [ ] **Step 8: Prisma 클라이언트 싱글톤 만들기**

`lib/prisma.ts`:

```ts
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
```

> **왜 싱글톤?** Next.js 개발 모드는 HMR로 모듈을 자주 재로드해서 새 PrismaClient가 계속 생성되면 connection leak이 남. globalThis에 캐싱해서 방지.

- [ ] **Step 9: 검증 + 커밋 + push**

```bash
npx prisma studio
```
브라우저 열리면 User/Dog/DailyRecord 테이블 보임 (Neon dev branch). 종료 후:

```bash
git add prisma/ lib/prisma.ts .env.example
git commit -m "feat: setup Prisma with Neon Postgres and base schema (User, Dog, DailyRecord)"
git push
```

push 후 Vercel 자동 재배포. **Vercel은 빌드 시 자동으로 `prisma generate` 실행** + main branch DB에 연결 시도. 만약 `migrate deploy`가 안 돼있으면 빌드 후 첫 DB 호출 시 에러가 날 수 있는데, Task 9 (NextAuth)에서 prod 마이그레이션 step을 추가할 거니까 지금은 무시 OK.

---

### Task 4: Vitest 테스트 환경 셋업

**Files:**
- Create: `vitest.config.ts`, `tests/setup.ts`
- Modify: `package.json` (scripts)

- [ ] **Step 1: Vitest 설치**

```bash
npm install -D vitest @vitest/ui @testing-library/react @testing-library/jest-dom jsdom
```

- [ ] **Step 2: vitest.config.ts 작성**

```ts
import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    setupFiles: ["./tests/setup.ts"],
    include: ["tests/**/*.test.ts", "tests/**/*.test.tsx"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
});
```

- [ ] **Step 3: tests/setup.ts 작성**

```ts
import { afterEach, beforeAll } from "vitest";
import { prisma } from "@/lib/prisma";

beforeAll(async () => {
  // 테스트용 DB는 별도 파일 권장. MVP 0 단계는 단순 단위 테스트 위주라 동일 DB 사용 후 정리.
});

afterEach(async () => {
  // 테스트 격리: 각 테스트 후 데이터 클리어
  await prisma.dailyRecord.deleteMany();
  await prisma.dog.deleteMany();
  await prisma.user.deleteMany();
});
```

> **주의:** dev DB에서 테스트를 돌리면 데이터 날아감. Task 5에서 테스트용 별도 DB로 분리.

- [ ] **Step 4: package.json scripts 추가**

```json
"scripts": {
  "dev": "next dev --turbopack",
  "build": "next build",
  "start": "next start",
  "test": "vitest run",
  "test:watch": "vitest",
  "test:ui": "vitest --ui",
  "db:migrate": "prisma migrate dev",
  "db:studio": "prisma studio",
  "db:reset": "prisma migrate reset --force"
}
```

- [ ] **Step 5: 샘플 테스트로 동작 확인**

`tests/setup.test.ts` 임시 작성:

```ts
import { describe, it, expect } from "vitest";

describe("setup", () => {
  it("vitest is working", () => {
    expect(1 + 1).toBe(2);
  });
});
```

```bash
npm test
```
PASS 확인 후 파일 삭제.

- [ ] **Step 6: 커밋**

```bash
git add vitest.config.ts tests/ package.json package-lock.json
git commit -m "chore: setup Vitest test environment"
```

---

### Task 5: 테스트용 DB 분리 (Neon test branch 사용)

**Files:**
- Modify: `tests/setup.ts`, `package.json`
- Create: `.env.test`

- [ ] **Step 1: 테스트용 환경변수 파일 생성**

`.env.test` 작성 (Task 3 Step 2에서 만든 **test** branch URL 사용):

```
DATABASE_URL="postgresql://user:password@ep-yyy-test.aws-ap-northeast-1.aws.neon.tech/neondb?sslmode=require"
```

`.gitignore`에 `.env.test` 라인 있는지 확인 (`.env*.local`만 있으면 `.env.test`도 추가).

- [ ] **Step 2: dotenv-cli 설치 + package.json 스크립트**

```bash
npm install -D dotenv-cli
```

`package.json` scripts 수정:

```json
"test": "dotenv -e .env.test -- vitest run",
"test:watch": "dotenv -e .env.test -- vitest",
"test:ui": "dotenv -e .env.test -- vitest --ui",
"db:test:migrate": "dotenv -e .env.test -- prisma migrate deploy"
```

- [ ] **Step 3: test branch에 schema 적용**

```bash
npm run db:test:migrate
```

Neon test branch에 테이블 생성 확인 (Neon 대시보드 → Branch: test 선택 → Tables).

- [ ] **Step 4: 테스트 cleanup 설정**

`tests/setup.ts` 수정:

```ts
import { afterEach } from "vitest";
import { prisma } from "@/lib/prisma";

afterEach(async () => {
  // 테스트 격리: 각 테스트 후 데이터 클리어 (FK 순서 주의)
  await prisma.dailyRecord.deleteMany();
  await prisma.dog.deleteMany();
  await prisma.user.deleteMany();
});
```

> **왜 dropAll이 아니라 deleteMany?** Postgres에서 truncate cascade도 가능하지만, Prisma는 raw query 없이 안 됨. deleteMany가 가장 간단 + 안전.

- [ ] **Step 5: 동작 확인**

```bash
npm test
```
연결 + 클린업 PASS (테스트가 없으면 No tests found OK).

- [ ] **Step 6: 커밋 + push**

```bash
git add tests/setup.ts package.json package-lock.json .gitignore
git commit -m "chore: separate test database using Neon test branch"
git push
```

---

### Phase 1 완료 체크포인트 ✅

다음을 모두 확인:
- [ ] `npm run dev` → 로컬 페이지 정상
- [ ] Vercel prod URL → 같은 페이지 정상
- [ ] `npm test` → PASS (No tests found OK)
- [ ] `npx prisma studio` → User/Dog/DailyRecord 테이블 보임
- [ ] Neon 대시보드 → main/dev/test 3개 branch 모두 동일 schema
- [ ] git history 5개 commit (init, shadcn, prisma, vitest, test-db)

문제 있으면 다음 Phase 진입 전에 해결.

---

## Phase 2: 인증 (Day 2, 3-4시간)

---

### Task 6: 비밀번호 해싱 유틸 (TDD)

**Files:**
- Create: `lib/password.ts`, `tests/lib/password.test.ts`

- [ ] **Step 1: bcryptjs 설치**

```bash
npm install bcryptjs
npm install -D @types/bcryptjs
```

- [ ] **Step 2: 실패 테스트 작성**

`tests/lib/password.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { hashPassword, verifyPassword } from "@/lib/password";

describe("password", () => {
  it("hashes a password to non-plain string", async () => {
    const hash = await hashPassword("mypassword");
    expect(hash).not.toBe("mypassword");
    expect(hash.length).toBeGreaterThan(20);
  });

  it("verifies correct password", async () => {
    const hash = await hashPassword("mypassword");
    expect(await verifyPassword("mypassword", hash)).toBe(true);
  });

  it("rejects wrong password", async () => {
    const hash = await hashPassword("mypassword");
    expect(await verifyPassword("wrongpassword", hash)).toBe(false);
  });
});
```

- [ ] **Step 3: 테스트 실행 (FAIL 확인)**

```bash
npm test password
```
Expected: FAIL with "Cannot find module '@/lib/password'"

- [ ] **Step 4: 구현**

`lib/password.ts`:

```ts
import bcrypt from "bcryptjs";

const ROUNDS = 10;

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, ROUNDS);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}
```

- [ ] **Step 5: 테스트 PASS 확인**

```bash
npm test password
```
Expected: PASS (3 tests)

- [ ] **Step 6: 커밋**

```bash
git add lib/password.ts tests/lib/password.test.ts package.json package-lock.json
git commit -m "feat: add password hashing utility with bcrypt"
```

---

### Task 7: 인증 입력 검증 (zod) (TDD)

**Files:**
- Create: `lib/validators/auth.ts`, `tests/validators/auth.test.ts`

- [ ] **Step 1: zod 설치**

```bash
npm install zod
```

- [ ] **Step 2: 실패 테스트 작성**

`tests/validators/auth.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { signupSchema, loginSchema } from "@/lib/validators/auth";

describe("signupSchema", () => {
  it("accepts valid input", () => {
    const result = signupSchema.safeParse({
      email: "user@example.com",
      password: "password123",
      name: "철수",
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid email", () => {
    const result = signupSchema.safeParse({
      email: "not-an-email",
      password: "password123",
      name: "철수",
    });
    expect(result.success).toBe(false);
  });

  it("rejects short password", () => {
    const result = signupSchema.safeParse({
      email: "user@example.com",
      password: "short",
      name: "철수",
    });
    expect(result.success).toBe(false);
  });

  it("name is optional", () => {
    const result = signupSchema.safeParse({
      email: "user@example.com",
      password: "password123",
    });
    expect(result.success).toBe(true);
  });
});

describe("loginSchema", () => {
  it("accepts email + password", () => {
    expect(loginSchema.safeParse({
      email: "user@example.com",
      password: "password123",
    }).success).toBe(true);
  });
});
```

- [ ] **Step 3: 테스트 FAIL 확인**

```bash
npm test validators/auth
```

- [ ] **Step 4: 구현**

`lib/validators/auth.ts`:

```ts
import { z } from "zod";

export const signupSchema = z.object({
  email: z.string().email("올바른 이메일 형식이 아닙니다"),
  password: z.string().min(8, "비밀번호는 최소 8자 이상이어야 합니다"),
  name: z.string().min(1).max(50).optional(),
});

export const loginSchema = z.object({
  email: z.string().email("올바른 이메일 형식이 아닙니다"),
  password: z.string().min(1, "비밀번호를 입력해주세요"),
});

export type SignupInput = z.infer<typeof signupSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
```

- [ ] **Step 5: 테스트 PASS 확인**

```bash
npm test validators/auth
```
Expected: PASS (5 tests)

- [ ] **Step 6: 커밋**

```bash
git add lib/validators/auth.ts tests/validators/auth.test.ts package.json package-lock.json
git commit -m "feat: add auth input validators with zod"
```

---

### Task 8: 회원가입 API (TDD)

**Files:**
- Create: `app/api/signup/route.ts`, `tests/api/signup.test.ts`

- [ ] **Step 1: 실패 테스트 작성**

`tests/api/signup.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { POST } from "@/app/api/signup/route";
import { prisma } from "@/lib/prisma";

function makeRequest(body: unknown): Request {
  return new Request("http://localhost/api/signup", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/signup", () => {
  it("creates a new user with hashed password", async () => {
    const res = await POST(makeRequest({
      email: "newuser@example.com",
      password: "password123",
      name: "철수",
    }));
    expect(res.status).toBe(201);
    const user = await prisma.user.findUnique({ where: { email: "newuser@example.com" } });
    expect(user).not.toBeNull();
    expect(user?.password).not.toBe("password123"); // 해싱됐는지
  });

  it("rejects duplicate email", async () => {
    await prisma.user.create({ data: { email: "dup@example.com", password: "x" } });
    const res = await POST(makeRequest({
      email: "dup@example.com",
      password: "password123",
    }));
    expect(res.status).toBe(409);
    const json = await res.json();
    expect(json.error).toBeDefined();
  });

  it("rejects invalid input", async () => {
    const res = await POST(makeRequest({ email: "bad", password: "x" }));
    expect(res.status).toBe(400);
  });
});
```

- [ ] **Step 2: 테스트 FAIL 확인**

```bash
npm test api/signup
```

- [ ] **Step 3: 구현**

`app/api/signup/route.ts`:

```ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/password";
import { signupSchema } from "@/lib/validators/auth";

export async function POST(req: Request) {
  const json = await req.json().catch(() => null);
  const parsed = signupSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { email, password, name } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: "이미 가입된 이메일입니다" }, { status: 409 });
  }

  const hashed = await hashPassword(password);
  const user = await prisma.user.create({
    data: { email, password: hashed, name },
    select: { id: true, email: true, name: true, createdAt: true },
  });

  return NextResponse.json({ user }, { status: 201 });
}
```

- [ ] **Step 4: 테스트 PASS 확인**

```bash
npm test api/signup
```
Expected: PASS (3 tests)

- [ ] **Step 5: 커밋**

```bash
git add app/api/signup/route.ts tests/api/signup.test.ts
git commit -m "feat: add signup API endpoint with validation"
```

---

### Task 9: NextAuth (Auth.js v5) 셋업

**Files:**
- Create: `lib/auth.ts`, `app/api/auth/[...nextauth]/route.ts`, `types/next-auth.d.ts`

- [ ] **Step 1: 패키지 설치**

```bash
npm install next-auth@beta
```

- [ ] **Step 2: lib/auth.ts 작성**

```ts
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/password";
import { loginSchema } from "@/lib/validators/auth";

export const { auth, handlers, signIn, signOut } = NextAuth({
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;
        const { email, password } = parsed.data;

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) return null;

        const ok = await verifyPassword(password, user.password);
        if (!ok) return null;

        return { id: user.id, email: user.email, name: user.name ?? undefined };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) token.id = user.id;
      return token;
    },
    async session({ session, token }) {
      if (token.id && session.user) {
        (session.user as { id: string }).id = token.id as string;
      }
      return session;
    },
  },
});
```

- [ ] **Step 3: 라우트 핸들러 작성**

`app/api/auth/[...nextauth]/route.ts`:

```ts
export { GET, POST } from "@/lib/auth";
```

(NextAuth v5는 handlers를 export하면 됨. 정확히는:)

```ts
import { handlers } from "@/lib/auth";
export const { GET, POST } = handlers;
```

- [ ] **Step 4: 타입 확장**

`types/next-auth.d.ts`:

```ts
import "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email?: string | null;
      name?: string | null;
      image?: string | null;
    };
  }
  interface User {
    id: string;
  }
}
```

`tsconfig.json`의 `include`에 `"types/**/*.d.ts"` 추가.

- [ ] **Step 5: 동작 확인**

```bash
npm run dev
```
브라우저에서 `http://localhost:3000/api/auth/providers` 열면 credentials provider JSON 응답 확인.

- [ ] **Step 6: 커밋**

```bash
git add lib/auth.ts app/api/auth types/next-auth.d.ts tsconfig.json package.json package-lock.json
git commit -m "feat: setup NextAuth (Auth.js v5) with credentials provider"
```

---

### Task 10: 회원가입 UI

**Files:**
- Create: `app/(auth)/signup/page.tsx`, `components/auth/signup-form.tsx`

- [ ] **Step 1: 페이지 셸 작성**

`app/(auth)/signup/page.tsx`:

```tsx
import { SignupForm } from "@/components/auth/signup-form";

export default function SignupPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-secondary">
      <div className="w-full max-w-sm bg-card border rounded-lg p-6 shadow-sm">
        <h1 className="text-2xl font-semibold mb-1">DogHealth 회원가입</h1>
        <p className="text-sm text-muted-foreground mb-6">이메일로 가입하세요</p>
        <SignupForm />
      </div>
    </div>
  );
}
```

- [ ] **Step 2: 폼 컴포넌트 작성**

react-hook-form 설치:

```bash
npm install react-hook-form @hookform/resolvers
```

`components/auth/signup-form.tsx`:

```tsx
"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { signupSchema, type SignupInput } from "@/lib/validators/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function SignupForm() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignupInput>({
    resolver: zodResolver(signupSchema),
  });

  async function onSubmit(values: SignupInput) {
    setServerError(null);
    const res = await fetch("/api/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      setServerError(json.error ?? "가입에 실패했습니다");
      return;
    }
    router.push("/login?signup=success");
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <Label htmlFor="email">이메일</Label>
        <Input id="email" type="email" {...register("email")} />
        {errors.email && <p className="text-sm text-destructive mt-1">{errors.email.message}</p>}
      </div>
      <div>
        <Label htmlFor="password">비밀번호 (8자 이상)</Label>
        <Input id="password" type="password" {...register("password")} />
        {errors.password && <p className="text-sm text-destructive mt-1">{errors.password.message}</p>}
      </div>
      <div>
        <Label htmlFor="name">이름 (선택)</Label>
        <Input id="name" {...register("name")} />
      </div>
      {serverError && <p className="text-sm text-destructive">{serverError}</p>}
      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? "가입 중..." : "가입하기"}
      </Button>
      <p className="text-center text-sm text-muted-foreground">
        이미 계정이 있나요? <a href="/login" className="text-primary underline">로그인</a>
      </p>
    </form>
  );
}
```

- [ ] **Step 3: 수동 동작 확인**

```bash
npm run dev
```
- `http://localhost:3000/signup` 접속
- 빈 폼 제출 → validation 에러 표시 확인
- 정상 입력 후 가입 → `/login?signup=success`로 이동 확인
- Prisma Studio (`npm run db:studio`)로 User 레코드 생성 확인

- [ ] **Step 4: 커밋**

```bash
git add app/\(auth\)/signup components/auth package.json package-lock.json
git commit -m "feat: add signup page and form"
```

---

### Task 11: 로그인 UI + 세션

**Files:**
- Create: `app/(auth)/login/page.tsx`, `components/auth/login-form.tsx`

- [ ] **Step 1: 페이지 작성**

`app/(auth)/login/page.tsx`:

```tsx
import { Suspense } from "react";
import { LoginForm } from "@/components/auth/login-form";

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-secondary">
      <div className="w-full max-w-sm bg-card border rounded-lg p-6 shadow-sm">
        <h1 className="text-2xl font-semibold mb-1">DogHealth 로그인</h1>
        <p className="text-sm text-muted-foreground mb-6">계속하려면 로그인하세요</p>
        <Suspense>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: 폼 컴포넌트 작성**

`components/auth/login-form.tsx`:

```tsx
"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { loginSchema, type LoginInput } from "@/lib/validators/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const justSignedUp = params.get("signup") === "success";
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) });

  async function onSubmit(values: LoginInput) {
    setServerError(null);
    const res = await signIn("credentials", { ...values, redirect: false });
    if (res?.error) {
      setServerError("이메일 또는 비밀번호가 올바르지 않습니다");
      return;
    }
    router.push("/");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {justSignedUp && (
        <p className="text-sm bg-success/10 text-success-foreground border border-success/30 rounded p-2">
          ✓ 가입이 완료되었습니다. 로그인하세요.
        </p>
      )}
      <div>
        <Label htmlFor="email">이메일</Label>
        <Input id="email" type="email" {...register("email")} />
        {errors.email && <p className="text-sm text-destructive mt-1">{errors.email.message}</p>}
      </div>
      <div>
        <Label htmlFor="password">비밀번호</Label>
        <Input id="password" type="password" {...register("password")} />
        {errors.password && <p className="text-sm text-destructive mt-1">{errors.password.message}</p>}
      </div>
      {serverError && <p className="text-sm text-destructive">{serverError}</p>}
      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? "로그인 중..." : "로그인"}
      </Button>
      <p className="text-center text-sm text-muted-foreground">
        계정이 없나요? <a href="/signup" className="text-primary underline">가입하기</a>
      </p>
    </form>
  );
}
```

- [ ] **Step 3: SessionProvider 설정**

`components/auth/session-provider.tsx`:

```tsx
"use client";
import { SessionProvider } from "next-auth/react";
export { SessionProvider as AuthSessionProvider };
```

`app/layout.tsx` 수정:

```tsx
import "./globals.css";
import { AuthSessionProvider } from "@/components/auth/session-provider";

export const metadata = { title: "DogHealth Tracker", description: "강아지 헬스 트래커" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>
        <AuthSessionProvider>{children}</AuthSessionProvider>
      </body>
    </html>
  );
}
```

- [ ] **Step 4: 동작 확인**

`npm run dev` 후 가입 → 로그인 → `/` 이동 확인.

- [ ] **Step 5: 커밋**

```bash
git add app/\(auth\)/login components/auth app/layout.tsx
git commit -m "feat: add login page with NextAuth session"
```

---

### Task 12: 보호 라우트 미들웨어

**Files:**
- Create: `middleware.ts`

- [ ] **Step 1: middleware 작성**

`middleware.ts`:

```ts
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

const PUBLIC_PATHS = ["/login", "/signup", "/api/signup", "/api/auth"];

export default auth((req) => {
  const isPublic = PUBLIC_PATHS.some((p) => req.nextUrl.pathname.startsWith(p));
  const isLoggedIn = !!req.auth;

  if (!isPublic && !isLoggedIn) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (isLoggedIn && (req.nextUrl.pathname === "/login" || req.nextUrl.pathname === "/signup")) {
    const url = req.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
```

- [ ] **Step 2: 수동 검증**

- 로그아웃 상태로 `/` 접속 → `/login` 리다이렉트 확인
- 로그인 상태로 `/login` 접속 → `/` 리다이렉트 확인

- [ ] **Step 3: 커밋 + push**

```bash
git add middleware.ts
git commit -m "feat: protect routes with auth middleware"
git push
```

---

### Phase 2 완료 체크포인트 ✅ — prod 배포 검증

- [ ] **Vercel prod에서 prod DB(main branch) 마이그레이션 1회 실행**

로컬에서:
```bash
DATABASE_URL="<Neon main branch URL>" npx prisma migrate deploy
```
또는 Neon SQL editor에서 dev branch의 schema를 main으로 복제.

> 💡 자동화 옵션: `package.json`에 `"postinstall": "prisma generate"`만 두고, 마이그레이션은 수동 (안전). MVP 4에서 CI 파이프라인으로 자동화 학습.

- [ ] **Vercel prod URL에서 실제 동작 확인**
  - `/signup` → 가입
  - `/login` → 로그인
  - `/` → 보호 라우트 정상 동작
  - Neon main branch에 User 레코드 생성됐는지 확인

prod에서 동작해야 다음 Phase 진입.

---

## Phase 3: 강아지 등록 (Day 3, 3시간)

---

### Task 13: 강아지 검증 + 서비스 (TDD)

**Files:**
- Create: `lib/validators/dog.ts`, `lib/services/dog.service.ts`, `tests/validators/dog.test.ts`, `tests/services/dog.service.test.ts`

- [ ] **Step 1: validators 실패 테스트**

`tests/validators/dog.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { dogCreateSchema } from "@/lib/validators/dog";

describe("dogCreateSchema", () => {
  it("accepts minimal valid input", () => {
    expect(dogCreateSchema.safeParse({ name: "초코" }).success).toBe(true);
  });

  it("accepts full input", () => {
    expect(dogCreateSchema.safeParse({
      name: "초코",
      breed: "포메라니안",
      birthDate: "2020-05-10",
      weight: 4.5,
    }).success).toBe(true);
  });

  it("rejects empty name", () => {
    expect(dogCreateSchema.safeParse({ name: "" }).success).toBe(false);
  });

  it("rejects negative weight", () => {
    expect(dogCreateSchema.safeParse({ name: "초코", weight: -1 }).success).toBe(false);
  });

  it("rejects future birthDate", () => {
    const future = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
    expect(dogCreateSchema.safeParse({ name: "초코", birthDate: future }).success).toBe(false);
  });
});
```

- [ ] **Step 2: 테스트 FAIL 확인**

```bash
npm test validators/dog
```

- [ ] **Step 3: validators 구현**

`lib/validators/dog.ts`:

```ts
import { z } from "zod";

export const dogCreateSchema = z.object({
  name: z.string().min(1, "이름은 필수입니다").max(30),
  breed: z.string().max(50).optional(),
  birthDate: z
    .string()
    .refine((s) => !s || new Date(s) <= new Date(), "생년월일은 미래일 수 없습니다")
    .optional(),
  weight: z.number().positive("체중은 양수여야 합니다").max(200).optional(),
});

export const dogUpdateSchema = dogCreateSchema.partial();

export type DogCreateInput = z.infer<typeof dogCreateSchema>;
export type DogUpdateInput = z.infer<typeof dogUpdateSchema>;
```

- [ ] **Step 4: PASS 확인**

```bash
npm test validators/dog
```

- [ ] **Step 5: service 실패 테스트**

`tests/services/dog.service.test.ts`:

```ts
import { describe, it, expect, beforeEach } from "vitest";
import { prisma } from "@/lib/prisma";
import { createDog, listDogsByUser, getDogByIdForUser, deleteDog } from "@/lib/services/dog.service";

describe("dog.service", () => {
  let userId: string;
  beforeEach(async () => {
    const u = await prisma.user.create({ data: { email: "t@t.com", password: "x" } });
    userId = u.id;
  });

  it("creates a dog for user", async () => {
    const dog = await createDog(userId, { name: "초코", weight: 4.5 });
    expect(dog.name).toBe("초코");
    expect(dog.userId).toBe(userId);
  });

  it("lists only user's dogs", async () => {
    const other = await prisma.user.create({ data: { email: "o@o.com", password: "x" } });
    await createDog(userId, { name: "초코" });
    await createDog(other.id, { name: "딴개" });
    const list = await listDogsByUser(userId);
    expect(list).toHaveLength(1);
    expect(list[0].name).toBe("초코");
  });

  it("getDogByIdForUser returns null for other user's dog", async () => {
    const other = await prisma.user.create({ data: { email: "o@o.com", password: "x" } });
    const dog = await createDog(other.id, { name: "딴개" });
    const result = await getDogByIdForUser(dog.id, userId);
    expect(result).toBeNull();
  });

  it("deleteDog rejects other user's dog", async () => {
    const other = await prisma.user.create({ data: { email: "o@o.com", password: "x" } });
    const dog = await createDog(other.id, { name: "딴개" });
    await expect(deleteDog(dog.id, userId)).rejects.toThrow();
  });
});
```

- [ ] **Step 6: 테스트 FAIL 확인**

```bash
npm test services/dog
```

- [ ] **Step 7: service 구현**

`lib/services/dog.service.ts`:

```ts
import { prisma } from "@/lib/prisma";
import type { DogCreateInput, DogUpdateInput } from "@/lib/validators/dog";

export async function createDog(userId: string, input: DogCreateInput) {
  return prisma.dog.create({
    data: {
      userId,
      name: input.name,
      breed: input.breed,
      weight: input.weight,
      birthDate: input.birthDate ? new Date(input.birthDate) : null,
    },
  });
}

export async function listDogsByUser(userId: string) {
  return prisma.dog.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
}

export async function getDogByIdForUser(dogId: string, userId: string) {
  return prisma.dog.findFirst({ where: { id: dogId, userId } });
}

export async function updateDog(dogId: string, userId: string, input: DogUpdateInput) {
  const owned = await getDogByIdForUser(dogId, userId);
  if (!owned) throw new Error("FORBIDDEN");
  return prisma.dog.update({
    where: { id: dogId },
    data: {
      ...input,
      birthDate: input.birthDate ? new Date(input.birthDate) : undefined,
    },
  });
}

export async function deleteDog(dogId: string, userId: string) {
  const owned = await getDogByIdForUser(dogId, userId);
  if (!owned) throw new Error("FORBIDDEN");
  return prisma.dog.delete({ where: { id: dogId } });
}
```

> **왜 service 레이어?** API 라우트가 비즈니스 로직 직접 들고 있으면 (1) 테스트 어렵고 (2) 같은 로직 다른 곳(예: Server Action)에서 못 씀. 서비스로 분리하면 둘 다 해결.

- [ ] **Step 8: PASS 확인**

```bash
npm test services/dog
```

- [ ] **Step 9: 커밋**

```bash
git add lib/validators/dog.ts lib/services/dog.service.ts tests/validators/dog.test.ts tests/services/dog.service.test.ts
git commit -m "feat: add dog validators and service with ownership checks"
```

---

### Task 14: 강아지 API 라우트 (TDD)

**Files:**
- Create: `app/api/dogs/route.ts`, `app/api/dogs/[id]/route.ts`, `lib/api/auth-helper.ts`, `tests/api/dogs.test.ts`

- [ ] **Step 1: 인증 헬퍼**

`lib/api/auth-helper.ts`:

```ts
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function requireUserId(): Promise<{ userId: string } | NextResponse> {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return { userId: session.user.id };
}
```

- [ ] **Step 2: 테스트 (auth mock 활용)**

`tests/api/dogs.test.ts`:

```ts
import { describe, it, expect, beforeEach, vi } from "vitest";
import { prisma } from "@/lib/prisma";

vi.mock("@/lib/auth", () => ({
  auth: vi.fn(),
}));

import { auth } from "@/lib/auth";
import { POST, GET } from "@/app/api/dogs/route";

function req(method: string, body?: unknown) {
  return new Request("http://localhost/api/dogs", {
    method,
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
}

describe("/api/dogs", () => {
  let userId: string;
  beforeEach(async () => {
    const u = await prisma.user.create({ data: { email: "t@t.com", password: "x" } });
    userId = u.id;
    vi.mocked(auth).mockResolvedValue({ user: { id: userId } } as any);
  });

  it("POST creates a dog", async () => {
    const res = await POST(req("POST", { name: "초코", weight: 4.5 }));
    expect(res.status).toBe(201);
  });

  it("POST 401 when unauthorized", async () => {
    vi.mocked(auth).mockResolvedValue(null as any);
    const res = await POST(req("POST", { name: "초코" }));
    expect(res.status).toBe(401);
  });

  it("POST 400 on invalid input", async () => {
    const res = await POST(req("POST", { name: "" }));
    expect(res.status).toBe(400);
  });

  it("GET returns user's dogs", async () => {
    await prisma.dog.create({ data: { userId, name: "초코" } });
    const res = await GET();
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.dogs).toHaveLength(1);
  });
});
```

- [ ] **Step 3: FAIL 확인 후 구현**

`app/api/dogs/route.ts`:

```ts
import { NextResponse } from "next/server";
import { requireUserId } from "@/lib/api/auth-helper";
import { dogCreateSchema } from "@/lib/validators/dog";
import { createDog, listDogsByUser } from "@/lib/services/dog.service";

export async function GET() {
  const guard = await requireUserId();
  if (guard instanceof NextResponse) return guard;
  const dogs = await listDogsByUser(guard.userId);
  return NextResponse.json({ dogs });
}

export async function POST(req: Request) {
  const guard = await requireUserId();
  if (guard instanceof NextResponse) return guard;

  const json = await req.json().catch(() => null);
  const parsed = dogCreateSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }
  const dog = await createDog(guard.userId, parsed.data);
  return NextResponse.json({ dog }, { status: 201 });
}
```

- [ ] **Step 4: 개별 강아지 라우트**

`app/api/dogs/[id]/route.ts`:

```ts
import { NextResponse } from "next/server";
import { requireUserId } from "@/lib/api/auth-helper";
import { dogUpdateSchema } from "@/lib/validators/dog";
import { getDogByIdForUser, updateDog, deleteDog } from "@/lib/services/dog.service";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireUserId();
  if (guard instanceof NextResponse) return guard;
  const { id } = await params;
  const dog = await getDogByIdForUser(id, guard.userId);
  if (!dog) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ dog });
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireUserId();
  if (guard instanceof NextResponse) return guard;
  const { id } = await params;
  const json = await req.json().catch(() => null);
  const parsed = dogUpdateSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed", details: parsed.error.flatten() }, { status: 400 });
  }
  try {
    const dog = await updateDog(id, guard.userId, parsed.data);
    return NextResponse.json({ dog });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireUserId();
  if (guard instanceof NextResponse) return guard;
  const { id } = await params;
  try {
    await deleteDog(id, guard.userId);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
```

- [ ] **Step 5: 테스트 PASS 확인**

```bash
npm test api/dogs
```

- [ ] **Step 6: 커밋**

```bash
git add app/api/dogs lib/api tests/api/dogs.test.ts
git commit -m "feat: add dog API routes with ownership enforcement"
```

---

### Task 15: 강아지 등록 폼 UI

**Files:**
- Create: `app/(app)/dogs/new/page.tsx`, `components/dog/dog-form.tsx`

- [ ] **Step 1: 페이지**

`app/(app)/dogs/new/page.tsx`:

```tsx
import { DogForm } from "@/components/dog/dog-form";

export default function NewDogPage() {
  return (
    <div className="container max-w-md mx-auto py-8">
      <h1 className="text-2xl font-semibold mb-1">강아지 등록</h1>
      <p className="text-sm text-muted-foreground mb-6">기본 정보를 입력해주세요</p>
      <DogForm />
    </div>
  );
}
```

- [ ] **Step 2: 폼**

`components/dog/dog-form.tsx`:

```tsx
"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { dogCreateSchema, type DogCreateInput } from "@/lib/validators/dog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function DogForm() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<DogCreateInput>({
    resolver: zodResolver(dogCreateSchema),
  });

  async function onSubmit(values: DogCreateInput) {
    setServerError(null);
    const payload = { ...values, weight: values.weight ? Number(values.weight) : undefined };
    const res = await fetch("/api/dogs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      setServerError(json.error ?? "등록에 실패했습니다");
      return;
    }
    const { dog } = await res.json();
    router.push(`/dogs/${dog.id}`);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <Label htmlFor="name">이름</Label>
        <Input id="name" {...register("name")} placeholder="초코" />
        {errors.name && <p className="text-sm text-destructive mt-1">{errors.name.message}</p>}
      </div>
      <div>
        <Label htmlFor="breed">견종 (선택)</Label>
        <Input id="breed" {...register("breed")} placeholder="포메라니안" />
      </div>
      <div>
        <Label htmlFor="birthDate">생년월일 (선택)</Label>
        <Input id="birthDate" type="date" {...register("birthDate")} />
        {errors.birthDate && <p className="text-sm text-destructive mt-1">{errors.birthDate.message}</p>}
      </div>
      <div>
        <Label htmlFor="weight">체중 kg (선택)</Label>
        <Input id="weight" type="number" step="0.1" {...register("weight", { valueAsNumber: true })} />
        {errors.weight && <p className="text-sm text-destructive mt-1">{errors.weight.message}</p>}
      </div>
      {serverError && <p className="text-sm text-destructive">{serverError}</p>}
      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? "등록 중..." : "등록하기"}
      </Button>
    </form>
  );
}
```

- [ ] **Step 3: (app) 레이아웃 만들기**

`app/(app)/layout.tsx`:

```tsx
import Link from "next/link";
import { auth, signOut } from "@/lib/auth";
import { Button } from "@/components/ui/button";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b">
        <div className="container mx-auto h-14 flex items-center justify-between px-4">
          <Link href="/" className="font-semibold text-primary">🐕 DogHealth</Link>
          <form action={async () => { "use server"; await signOut({ redirectTo: "/login" }); }}>
            <Button variant="ghost" size="sm">로그아웃 ({session?.user?.email})</Button>
          </form>
        </div>
      </header>
      <main className="flex-1">{children}</main>
    </div>
  );
}
```

- [ ] **Step 4: 수동 검증**

`/dogs/new` 접속 → 폼 작성 → 제출 → `/dogs/[id]` 로 이동.

- [ ] **Step 5: 커밋**

```bash
git add app/\(app\) components/dog
git commit -m "feat: add dog registration page and layout"
```

---

### Task 16: 강아지 상세 페이지 (기본)

**Files:**
- Create: `app/(app)/dogs/[id]/page.tsx`, `components/dog/dog-card.tsx`

- [ ] **Step 1: dog-card 컴포넌트**

`components/dog/dog-card.tsx`:

```tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Dog } from "@prisma/client";

function ageFromBirth(birth: Date | null): string {
  if (!birth) return "-";
  const months = (Date.now() - new Date(birth).getTime()) / (1000 * 60 * 60 * 24 * 30);
  const years = Math.floor(months / 12);
  const remMonths = Math.floor(months % 12);
  return years > 0 ? `${years}년 ${remMonths}개월` : `${remMonths}개월`;
}

export function DogCard({ dog }: { dog: Dog }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{dog.name}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-1 text-sm">
        <div>견종: {dog.breed ?? "-"}</div>
        <div>나이: {ageFromBirth(dog.birthDate)}</div>
        <div>체중: {dog.weight ? `${dog.weight}kg` : "-"}</div>
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 2: 페이지**

`app/(app)/dogs/[id]/page.tsx`:

```tsx
import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { getDogByIdForUser } from "@/lib/services/dog.service";
import { DogCard } from "@/components/dog/dog-card";
import { Button } from "@/components/ui/button";

export default async function DogDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) notFound();
  const dog = await getDogByIdForUser(id, session.user.id);
  if (!dog) notFound();

  return (
    <div className="container max-w-2xl mx-auto py-8 space-y-6">
      <DogCard dog={dog} />
      <div className="flex gap-2">
        <Button asChild>
          <Link href={`/dogs/${dog.id}/records/new`}>오늘 기록 작성</Link>
        </Button>
      </div>
      <section>
        <h2 className="text-lg font-semibold mb-3">최근 기록</h2>
        <p className="text-sm text-muted-foreground">— Task 19에서 채워짐</p>
      </section>
    </div>
  );
}
```

- [ ] **Step 3: 검증 + 커밋**

직접 접속해서 카드 표시 확인.

```bash
git add app/\(app\)/dogs/\[id\]/page.tsx components/dog/dog-card.tsx
git commit -m "feat: add dog detail page with basic info"
git push
```

---

### Phase 3 완료 체크포인트 ✅

- [ ] Vercel prod URL에서 강아지 등록 흐름 동작
- [ ] Neon main branch의 Dog 테이블에 레코드 생성 확인
- [ ] 다른 사용자 강아지 URL 접속 시 404 (권한 분리 검증)

---

## Phase 4: 일일 기록 (Day 4-5, 5시간)

---

### Task 17: 일일 기록 검증 + 서비스 (TDD)

**Files:**
- Create: `lib/validators/record.ts`, `lib/services/record.service.ts`, `tests/validators/record.test.ts`, `tests/services/record.service.test.ts`

- [ ] **Step 1: 실패 테스트**

`tests/validators/record.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { recordCreateSchema } from "@/lib/validators/record";

describe("recordCreateSchema", () => {
  it("accepts all-optional input (empty record)", () => {
    expect(recordCreateSchema.safeParse({ recordedAt: "2026-06-07" }).success).toBe(true);
  });

  it("accepts full input", () => {
    expect(recordCreateSchema.safeParse({
      recordedAt: "2026-06-07",
      mealAmount: 150,
      walkMinutes: 30,
      walkDistance: 1.5,
      poopCount: 2,
      weight: 4.6,
      notes: "산책 후 활발",
    }).success).toBe(true);
  });

  it("rejects negative values", () => {
    expect(recordCreateSchema.safeParse({
      recordedAt: "2026-06-07",
      mealAmount: -1,
    }).success).toBe(false);
  });

  it("rejects too long notes", () => {
    expect(recordCreateSchema.safeParse({
      recordedAt: "2026-06-07",
      notes: "a".repeat(1001),
    }).success).toBe(false);
  });
});
```

- [ ] **Step 2: 구현**

`lib/validators/record.ts`:

```ts
import { z } from "zod";

export const recordCreateSchema = z.object({
  recordedAt: z.string(),
  mealAmount: z.number().nonnegative().max(5000).optional(),
  walkMinutes: z.number().int().nonnegative().max(1440).optional(),
  walkDistance: z.number().nonnegative().max(100).optional(),
  poopCount: z.number().int().nonnegative().max(20).optional(),
  weight: z.number().positive().max(200).optional(),
  notes: z.string().max(1000).optional(),
});

export const recordUpdateSchema = recordCreateSchema.partial();

export type RecordCreateInput = z.infer<typeof recordCreateSchema>;
export type RecordUpdateInput = z.infer<typeof recordUpdateSchema>;
```

- [ ] **Step 3: PASS 확인**

```bash
npm test validators/record
```

- [ ] **Step 4: service 테스트**

`tests/services/record.service.test.ts`:

```ts
import { describe, it, expect, beforeEach } from "vitest";
import { prisma } from "@/lib/prisma";
import {
  createRecord,
  listRecordsByDog,
  getRecordByIdForUser,
  updateRecord,
  deleteRecord,
} from "@/lib/services/record.service";

describe("record.service", () => {
  let userId: string;
  let dogId: string;
  beforeEach(async () => {
    const u = await prisma.user.create({ data: { email: "t@t.com", password: "x" } });
    userId = u.id;
    const d = await prisma.dog.create({ data: { userId, name: "초코" } });
    dogId = d.id;
  });

  it("creates a record", async () => {
    const r = await createRecord(dogId, userId, { recordedAt: "2026-06-07", mealAmount: 100 });
    expect(r.mealAmount).toBe(100);
  });

  it("rejects creating for other user's dog", async () => {
    const other = await prisma.user.create({ data: { email: "o@o.com", password: "x" } });
    await expect(createRecord(dogId, other.id, { recordedAt: "2026-06-07" })).rejects.toThrow();
  });

  it("lists records ordered by recordedAt desc", async () => {
    await createRecord(dogId, userId, { recordedAt: "2026-06-05" });
    await createRecord(dogId, userId, { recordedAt: "2026-06-07" });
    await createRecord(dogId, userId, { recordedAt: "2026-06-06" });
    const list = await listRecordsByDog(dogId, userId);
    expect(list.map((r) => r.recordedAt.toISOString().slice(0, 10))).toEqual([
      "2026-06-07", "2026-06-06", "2026-06-05",
    ]);
  });

  it("getRecordByIdForUser returns null for other user's record", async () => {
    const r = await createRecord(dogId, userId, { recordedAt: "2026-06-07" });
    const other = await prisma.user.create({ data: { email: "o@o.com", password: "x" } });
    expect(await getRecordByIdForUser(r.id, other.id)).toBeNull();
  });
});
```

- [ ] **Step 5: service 구현**

`lib/services/record.service.ts`:

```ts
import { prisma } from "@/lib/prisma";
import { getDogByIdForUser } from "@/lib/services/dog.service";
import type { RecordCreateInput, RecordUpdateInput } from "@/lib/validators/record";

export async function createRecord(dogId: string, userId: string, input: RecordCreateInput) {
  const dog = await getDogByIdForUser(dogId, userId);
  if (!dog) throw new Error("FORBIDDEN");
  return prisma.dailyRecord.create({
    data: {
      dogId,
      recordedAt: new Date(input.recordedAt),
      mealAmount: input.mealAmount,
      walkMinutes: input.walkMinutes,
      walkDistance: input.walkDistance,
      poopCount: input.poopCount,
      weight: input.weight,
      notes: input.notes,
    },
  });
}

export async function listRecordsByDog(dogId: string, userId: string, limit = 50) {
  const dog = await getDogByIdForUser(dogId, userId);
  if (!dog) throw new Error("FORBIDDEN");
  return prisma.dailyRecord.findMany({
    where: { dogId },
    orderBy: { recordedAt: "desc" },
    take: limit,
  });
}

export async function getRecordByIdForUser(recordId: string, userId: string) {
  return prisma.dailyRecord.findFirst({
    where: { id: recordId, dog: { userId } },
  });
}

export async function updateRecord(recordId: string, userId: string, input: RecordUpdateInput) {
  const existing = await getRecordByIdForUser(recordId, userId);
  if (!existing) throw new Error("FORBIDDEN");
  return prisma.dailyRecord.update({
    where: { id: recordId },
    data: {
      ...input,
      recordedAt: input.recordedAt ? new Date(input.recordedAt) : undefined,
    },
  });
}

export async function deleteRecord(recordId: string, userId: string) {
  const existing = await getRecordByIdForUser(recordId, userId);
  if (!existing) throw new Error("FORBIDDEN");
  return prisma.dailyRecord.delete({ where: { id: recordId } });
}
```

- [ ] **Step 6: PASS 확인 + 커밋**

```bash
npm test services/record
git add lib/validators/record.ts lib/services/record.service.ts tests/validators/record.test.ts tests/services/record.service.test.ts
git commit -m "feat: add record validators and service"
```

---

### Task 18: 일일 기록 API

**Files:**
- Create: `app/api/dogs/[id]/records/route.ts`, `app/api/dogs/[id]/records/[recordId]/route.ts`, `tests/api/records.test.ts`

- [ ] **Step 1: 테스트**

`tests/api/records.test.ts`:

```ts
import { describe, it, expect, beforeEach, vi } from "vitest";
import { prisma } from "@/lib/prisma";

vi.mock("@/lib/auth", () => ({ auth: vi.fn() }));
import { auth } from "@/lib/auth";
import { POST as createRoute, GET as listRoute } from "@/app/api/dogs/[id]/records/route";

function req(method: string, body?: unknown) {
  return new Request("http://localhost/x", {
    method,
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
}

describe("/api/dogs/[id]/records", () => {
  let userId: string;
  let dogId: string;
  beforeEach(async () => {
    const u = await prisma.user.create({ data: { email: "t@t.com", password: "x" } });
    userId = u.id;
    const d = await prisma.dog.create({ data: { userId, name: "초코" } });
    dogId = d.id;
    vi.mocked(auth).mockResolvedValue({ user: { id: userId } } as any);
  });

  it("POST creates a record", async () => {
    const res = await createRoute(req("POST", { recordedAt: "2026-06-07", mealAmount: 100 }), {
      params: Promise.resolve({ id: dogId }),
    });
    expect(res.status).toBe(201);
  });

  it("POST 403 for other user's dog", async () => {
    const other = await prisma.user.create({ data: { email: "o@o.com", password: "x" } });
    const otherDog = await prisma.dog.create({ data: { userId: other.id, name: "X" } });
    const res = await createRoute(req("POST", { recordedAt: "2026-06-07" }), {
      params: Promise.resolve({ id: otherDog.id }),
    });
    expect(res.status).toBe(403);
  });

  it("GET lists records", async () => {
    await prisma.dailyRecord.create({ data: { dogId, recordedAt: new Date() } });
    const res = await listRoute(req("GET"), { params: Promise.resolve({ id: dogId }) });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.records).toHaveLength(1);
  });
});
```

- [ ] **Step 2: 구현**

`app/api/dogs/[id]/records/route.ts`:

```ts
import { NextResponse } from "next/server";
import { requireUserId } from "@/lib/api/auth-helper";
import { recordCreateSchema } from "@/lib/validators/record";
import { createRecord, listRecordsByDog } from "@/lib/services/record.service";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireUserId();
  if (guard instanceof NextResponse) return guard;
  const { id: dogId } = await params;
  const json = await req.json().catch(() => null);
  const parsed = recordCreateSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed", details: parsed.error.flatten() }, { status: 400 });
  }
  try {
    const record = await createRecord(dogId, guard.userId, parsed.data);
    return NextResponse.json({ record }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireUserId();
  if (guard instanceof NextResponse) return guard;
  const { id: dogId } = await params;
  try {
    const records = await listRecordsByDog(dogId, guard.userId);
    return NextResponse.json({ records });
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
}
```

`app/api/dogs/[id]/records/[recordId]/route.ts`:

```ts
import { NextResponse } from "next/server";
import { requireUserId } from "@/lib/api/auth-helper";
import { recordUpdateSchema } from "@/lib/validators/record";
import { getRecordByIdForUser, updateRecord, deleteRecord } from "@/lib/services/record.service";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string; recordId: string }> }) {
  const guard = await requireUserId();
  if (guard instanceof NextResponse) return guard;
  const { recordId } = await params;
  const record = await getRecordByIdForUser(recordId, guard.userId);
  if (!record) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ record });
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string; recordId: string }> }) {
  const guard = await requireUserId();
  if (guard instanceof NextResponse) return guard;
  const { recordId } = await params;
  const json = await req.json().catch(() => null);
  const parsed = recordUpdateSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed", details: parsed.error.flatten() }, { status: 400 });
  }
  try {
    const record = await updateRecord(recordId, guard.userId, parsed.data);
    return NextResponse.json({ record });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string; recordId: string }> }) {
  const guard = await requireUserId();
  if (guard instanceof NextResponse) return guard;
  const { recordId } = await params;
  try {
    await deleteRecord(recordId, guard.userId);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
```

- [ ] **Step 3: 테스트 PASS 확인**

```bash
npm test api/records
```

- [ ] **Step 4: 커밋**

```bash
git add app/api/dogs/\[id\]/records tests/api/records.test.ts
git commit -m "feat: add record API routes with dog ownership check"
```

---

### Task 19: 일일 기록 입력 폼 UI

**Files:**
- Create: `app/(app)/dogs/[id]/records/new/page.tsx`, `components/record/record-form.tsx`

- [ ] **Step 1: 페이지**

`app/(app)/dogs/[id]/records/new/page.tsx`:

```tsx
import { RecordForm } from "@/components/record/record-form";

export default async function NewRecordPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <div className="container max-w-md mx-auto py-8">
      <h1 className="text-2xl font-semibold mb-1">오늘 기록</h1>
      <p className="text-sm text-muted-foreground mb-6">기록할 항목만 입력하세요 (모두 선택)</p>
      <RecordForm dogId={id} />
    </div>
  );
}
```

- [ ] **Step 2: 폼**

`components/record/record-form.tsx`:

```tsx
"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { recordCreateSchema, type RecordCreateInput } from "@/lib/validators/record";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

function todayYmd() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function RecordForm({ dogId, defaultValues }: { dogId: string; defaultValues?: Partial<RecordCreateInput> }) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register, handleSubmit, formState: { errors, isSubmitting },
  } = useForm<RecordCreateInput>({
    resolver: zodResolver(recordCreateSchema),
    defaultValues: { recordedAt: todayYmd(), ...defaultValues },
  });

  async function onSubmit(values: RecordCreateInput) {
    setServerError(null);
    const res = await fetch(`/api/dogs/${dogId}/records`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      setServerError(json.error ?? "저장 실패");
      return;
    }
    router.push(`/dogs/${dogId}`);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <Label htmlFor="recordedAt">날짜</Label>
        <Input id="recordedAt" type="date" {...register("recordedAt")} />
      </div>
      <div>
        <Label htmlFor="mealAmount">식사량 (g)</Label>
        <Input id="mealAmount" type="number" step="1" {...register("mealAmount", { setValueAs: (v) => v === "" ? undefined : Number(v) })} />
        {errors.mealAmount && <p className="text-sm text-destructive">{errors.mealAmount.message}</p>}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="walkMinutes">산책 분</Label>
          <Input id="walkMinutes" type="number" {...register("walkMinutes", { setValueAs: (v) => v === "" ? undefined : Number(v) })} />
        </div>
        <div>
          <Label htmlFor="walkDistance">산책 km</Label>
          <Input id="walkDistance" type="number" step="0.1" {...register("walkDistance", { setValueAs: (v) => v === "" ? undefined : Number(v) })} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="poopCount">배변 횟수</Label>
          <Input id="poopCount" type="number" {...register("poopCount", { setValueAs: (v) => v === "" ? undefined : Number(v) })} />
        </div>
        <div>
          <Label htmlFor="weight">체중 kg</Label>
          <Input id="weight" type="number" step="0.1" {...register("weight", { setValueAs: (v) => v === "" ? undefined : Number(v) })} />
        </div>
      </div>
      <div>
        <Label htmlFor="notes">메모</Label>
        <Textarea id="notes" rows={3} {...register("notes")} placeholder="컨디션, 특이사항 등" />
      </div>
      {serverError && <p className="text-sm text-destructive">{serverError}</p>}
      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? "저장 중..." : "저장"}
      </Button>
    </form>
  );
}
```

- [ ] **Step 3: 수동 검증 + 커밋**

`/dogs/[id]/records/new` → 입력 → 저장 → `/dogs/[id]` 리다이렉트.

```bash
git add app/\(app\)/dogs/\[id\]/records/new components/record/record-form.tsx
git commit -m "feat: add record creation form"
```

---

### Task 20: 일일 기록 목록 + 강아지 상세에 노출

**Files:**
- Create: `components/record/record-list.tsx`, `components/record/record-card.tsx`
- Modify: `app/(app)/dogs/[id]/page.tsx`

- [ ] **Step 1: record-card**

`components/record/record-card.tsx`:

```tsx
import Link from "next/link";
import type { DailyRecord } from "@prisma/client";
import { Card, CardContent } from "@/components/ui/card";

function formatDate(d: Date): string {
  return new Date(d).toLocaleDateString("ko-KR", { month: "long", day: "numeric", weekday: "short" });
}

export function RecordCard({ dogId, record }: { dogId: string; record: DailyRecord }) {
  return (
    <Link href={`/dogs/${dogId}/records/${record.id}`}>
      <Card className="hover:shadow-md transition">
        <CardContent className="p-4">
          <div className="text-sm text-muted-foreground mb-2">{formatDate(record.recordedAt)}</div>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
            {record.mealAmount != null && <span>🍽 {record.mealAmount}g</span>}
            {record.walkMinutes != null && <span>🚶 {record.walkMinutes}분</span>}
            {record.walkDistance != null && <span>📏 {record.walkDistance}km</span>}
            {record.poopCount != null && <span>💩 {record.poopCount}회</span>}
            {record.weight != null && <span>⚖ {record.weight}kg</span>}
          </div>
          {record.notes && <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{record.notes}</p>}
        </CardContent>
      </Card>
    </Link>
  );
}
```

- [ ] **Step 2: record-list**

`components/record/record-list.tsx`:

```tsx
import type { DailyRecord } from "@prisma/client";
import { RecordCard } from "./record-card";

export function RecordList({ dogId, records }: { dogId: string; records: DailyRecord[] }) {
  if (records.length === 0) {
    return <p className="text-sm text-muted-foreground py-4">아직 기록이 없어요. 첫 기록을 작성해보세요!</p>;
  }
  return (
    <div className="space-y-2">
      {records.map((r) => <RecordCard key={r.id} dogId={dogId} record={r} />)}
    </div>
  );
}
```

- [ ] **Step 3: 상세 페이지 업데이트**

`app/(app)/dogs/[id]/page.tsx` (이전 코드의 "최근 기록" 섹션 교체):

```tsx
import { listRecordsByDog } from "@/lib/services/record.service";
import { RecordList } from "@/components/record/record-list";

// ... 이전 import 유지

export default async function DogDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) notFound();
  const dog = await getDogByIdForUser(id, session.user.id);
  if (!dog) notFound();
  const records = await listRecordsByDog(id, session.user.id, 20);

  return (
    <div className="container max-w-2xl mx-auto py-8 space-y-6">
      <DogCard dog={dog} />
      <div className="flex gap-2">
        <Button asChild>
          <Link href={`/dogs/${dog.id}/records/new`}>오늘 기록 작성</Link>
        </Button>
      </div>
      <section>
        <h2 className="text-lg font-semibold mb-3">최근 기록</h2>
        <RecordList dogId={dog.id} records={records} />
      </section>
    </div>
  );
}
```

- [ ] **Step 4: 수동 검증 + 커밋**

```bash
git add components/record app/\(app\)/dogs/\[id\]/page.tsx
git commit -m "feat: show record list on dog detail page"
```

---

### Task 21: 일일 기록 상세/수정/삭제 페이지

**Files:**
- Create: `app/(app)/dogs/[id]/records/[recordId]/page.tsx`, `components/record/record-edit-form.tsx`, `components/record/delete-record-button.tsx`

- [ ] **Step 1: edit form (record-form 재활용)**

`components/record/record-edit-form.tsx`:

```tsx
"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import type { DailyRecord } from "@prisma/client";
import { recordUpdateSchema, type RecordUpdateInput } from "@/lib/validators/record";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function RecordEditForm({ dogId, record }: { dogId: string; record: DailyRecord }) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register, handleSubmit, formState: { errors, isSubmitting },
  } = useForm<RecordUpdateInput>({
    resolver: zodResolver(recordUpdateSchema),
    defaultValues: {
      recordedAt: record.recordedAt.toISOString().slice(0, 10),
      mealAmount: record.mealAmount ?? undefined,
      walkMinutes: record.walkMinutes ?? undefined,
      walkDistance: record.walkDistance ?? undefined,
      poopCount: record.poopCount ?? undefined,
      weight: record.weight ?? undefined,
      notes: record.notes ?? undefined,
    },
  });

  async function onSubmit(values: RecordUpdateInput) {
    setServerError(null);
    const res = await fetch(`/api/dogs/${dogId}/records/${record.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    if (!res.ok) { setServerError("저장 실패"); return; }
    router.push(`/dogs/${dogId}`);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* record-form과 동일한 필드 — 코드 중복은 차후 RecordFormFields 추출로 리팩토링 가능 */}
      <Label htmlFor="recordedAt">날짜</Label>
      <Input id="recordedAt" type="date" {...register("recordedAt")} />
      <Label htmlFor="mealAmount">식사량 (g)</Label>
      <Input id="mealAmount" type="number" {...register("mealAmount", { setValueAs: (v) => v === "" ? undefined : Number(v) })} />
      <Label htmlFor="walkMinutes">산책 분</Label>
      <Input id="walkMinutes" type="number" {...register("walkMinutes", { setValueAs: (v) => v === "" ? undefined : Number(v) })} />
      <Label htmlFor="walkDistance">산책 km</Label>
      <Input id="walkDistance" type="number" step="0.1" {...register("walkDistance", { setValueAs: (v) => v === "" ? undefined : Number(v) })} />
      <Label htmlFor="poopCount">배변 횟수</Label>
      <Input id="poopCount" type="number" {...register("poopCount", { setValueAs: (v) => v === "" ? undefined : Number(v) })} />
      <Label htmlFor="weight">체중 kg</Label>
      <Input id="weight" type="number" step="0.1" {...register("weight", { setValueAs: (v) => v === "" ? undefined : Number(v) })} />
      <Label htmlFor="notes">메모</Label>
      <Textarea id="notes" rows={3} {...register("notes")} />
      {serverError && <p className="text-sm text-destructive">{serverError}</p>}
      <Button type="submit" className="w-full" disabled={isSubmitting}>{isSubmitting ? "저장 중..." : "저장"}</Button>
    </form>
  );
}
```

- [ ] **Step 2: 삭제 버튼**

`components/record/delete-record-button.tsx`:

```tsx
"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export function DeleteRecordButton({ dogId, recordId }: { dogId: string; recordId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function onDelete() {
    if (!confirm("이 기록을 삭제할까요?")) return;
    setLoading(true);
    const res = await fetch(`/api/dogs/${dogId}/records/${recordId}`, { method: "DELETE" });
    if (res.ok) {
      router.push(`/dogs/${dogId}`);
      router.refresh();
    } else {
      alert("삭제 실패");
      setLoading(false);
    }
  }

  return (
    <Button variant="destructive" onClick={onDelete} disabled={loading}>
      {loading ? "삭제 중..." : "삭제"}
    </Button>
  );
}
```

- [ ] **Step 3: 페이지**

`app/(app)/dogs/[id]/records/[recordId]/page.tsx`:

```tsx
import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { getRecordByIdForUser } from "@/lib/services/record.service";
import { RecordEditForm } from "@/components/record/record-edit-form";
import { DeleteRecordButton } from "@/components/record/delete-record-button";

export default async function RecordDetailPage({ params }: { params: Promise<{ id: string; recordId: string }> }) {
  const { id, recordId } = await params;
  const session = await auth();
  if (!session?.user?.id) notFound();
  const record = await getRecordByIdForUser(recordId, session.user.id);
  if (!record) notFound();

  return (
    <div className="container max-w-md mx-auto py-8">
      <h1 className="text-2xl font-semibold mb-6">기록 수정</h1>
      <RecordEditForm dogId={id} record={record} />
      <div className="mt-6 flex justify-end">
        <DeleteRecordButton dogId={id} recordId={recordId} />
      </div>
    </div>
  );
}
```

- [ ] **Step 4: 검증 + 커밋**

```bash
git add app/\(app\)/dogs/\[id\]/records/\[recordId\] components/record/record-edit-form.tsx components/record/delete-record-button.tsx
git commit -m "feat: add record edit and delete page"
git push
```

---

### Phase 4 완료 체크포인트 ✅

- [ ] Vercel prod에서 일일 기록 입력/수정/삭제 모두 동작
- [ ] Neon main branch의 DailyRecord 테이블 확인
- [ ] 다른 사용자 record URL 접속 시 404

---

## Phase 5: 대시보드 + 통계 (Day 6, 3시간)

---

### Task 22: 대시보드 페이지

**Files:**
- Create: `app/(app)/page.tsx`, `components/dashboard/empty-state.tsx`

- [ ] **Step 1: empty-state**

`components/dashboard/empty-state.tsx`:

```tsx
import Link from "next/link";
import { Button } from "@/components/ui/button";

export function EmptyDogState() {
  return (
    <div className="text-center py-16 border-2 border-dashed rounded-lg">
      <p className="text-2xl mb-2">🐕</p>
      <h2 className="text-lg font-semibold mb-2">아직 등록된 강아지가 없어요</h2>
      <p className="text-sm text-muted-foreground mb-4">첫 강아지를 등록하고 매일 기록을 시작하세요</p>
      <Button asChild>
        <Link href="/dogs/new">강아지 등록하기</Link>
      </Button>
    </div>
  );
}
```

- [ ] **Step 2: 대시보드**

`app/(app)/page.tsx`:

```tsx
import Link from "next/link";
import { auth } from "@/lib/auth";
import { listDogsByUser } from "@/lib/services/dog.service";
import { listRecordsByDog } from "@/lib/services/record.service";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyDogState } from "@/components/dashboard/empty-state";

export default async function Dashboard() {
  const session = await auth();
  if (!session?.user?.id) return null;
  const dogs = await listDogsByUser(session.user.id);

  if (dogs.length === 0) {
    return (
      <div className="container max-w-2xl mx-auto py-8">
        <EmptyDogState />
      </div>
    );
  }

  // 첫 강아지의 오늘 기록 표시 (MVP 0은 1마리 가정이지만 multi-dog UI 미리 지원)
  const dog = dogs[0];
  const records = await listRecordsByDog(dog.id, session.user.id, 5);

  return (
    <div className="container max-w-2xl mx-auto py-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">안녕하세요 🐕</h1>
        <Button asChild variant="outline" size="sm">
          <Link href="/dogs/new">강아지 추가</Link>
        </Button>
      </div>

      {dogs.map((d) => (
        <Card key={d.id}>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>{d.name}</CardTitle>
            <Button asChild size="sm">
              <Link href={`/dogs/${d.id}/records/new`}>오늘 기록</Link>
            </Button>
          </CardHeader>
          <CardContent>
            <Button asChild variant="link" className="px-0">
              <Link href={`/dogs/${d.id}`}>상세 보기 →</Link>
            </Button>
          </CardContent>
        </Card>
      ))}

      <section>
        <h2 className="text-lg font-semibold mb-3">최근 기록 (전체)</h2>
        {records.length === 0 ? (
          <p className="text-sm text-muted-foreground">아직 기록이 없어요</p>
        ) : (
          <div className="space-y-2">
            {records.map((r) => (
              <Link key={r.id} href={`/dogs/${dog.id}/records/${r.id}`} className="block border rounded p-3 text-sm hover:bg-secondary">
                {new Date(r.recordedAt).toLocaleDateString("ko-KR")} — {r.mealAmount ? `🍽${r.mealAmount}g` : ""} {r.walkMinutes ? `🚶${r.walkMinutes}분` : ""}
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
```

- [ ] **Step 3: 검증 + 커밋**

```bash
git add app/\(app\)/page.tsx components/dashboard
git commit -m "feat: add dashboard with dog list and recent records"
```

---

### Task 23: 주간 차트 (Recharts)

**Files:**
- Create: `components/dashboard/weekly-chart.tsx`, `lib/services/stats.service.ts`

- [ ] **Step 1: Recharts 설치**

```bash
npm install recharts
```

- [ ] **Step 2: stats service**

`lib/services/stats.service.ts`:

```ts
import { prisma } from "@/lib/prisma";
import { getDogByIdForUser } from "./dog.service";

export type WeeklyPoint = {
  date: string; // "YYYY-MM-DD"
  mealAmount: number | null;
  walkMinutes: number | null;
  weight: number | null;
};

export async function weeklyStats(dogId: string, userId: string): Promise<WeeklyPoint[]> {
  const dog = await getDogByIdForUser(dogId, userId);
  if (!dog) throw new Error("FORBIDDEN");

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const start = new Date(today);
  start.setDate(start.getDate() - 6);

  const records = await prisma.dailyRecord.findMany({
    where: { dogId, recordedAt: { gte: start } },
    orderBy: { recordedAt: "asc" },
  });

  // 날짜별로 마지막 기록만 사용 (하루 여러 개 있을 수 있음 → 합산이 더 맞을 수도 있지만 MVP 0은 단순화)
  const map = new Map<string, WeeklyPoint>();
  for (let i = 0; i < 7; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    const key = d.toISOString().slice(0, 10);
    map.set(key, { date: key, mealAmount: null, walkMinutes: null, weight: null });
  }
  for (const r of records) {
    const key = r.recordedAt.toISOString().slice(0, 10);
    const point = map.get(key);
    if (point) {
      point.mealAmount = (point.mealAmount ?? 0) + (r.mealAmount ?? 0);
      point.walkMinutes = (point.walkMinutes ?? 0) + (r.walkMinutes ?? 0);
      point.weight = r.weight ?? point.weight; // 마지막 측정값
    }
  }
  return Array.from(map.values());
}
```

- [ ] **Step 3: chart 컴포넌트**

`components/dashboard/weekly-chart.tsx`:

```tsx
"use client";

import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import type { WeeklyPoint } from "@/lib/services/stats.service";

export function WeeklyChart({ data, dataKey, label, color }: {
  data: WeeklyPoint[];
  dataKey: keyof WeeklyPoint;
  label: string;
  color: string;
}) {
  const formatted = data.map((d) => ({
    ...d,
    label: new Date(d.date).toLocaleDateString("ko-KR", { month: "numeric", day: "numeric" }),
  }));

  return (
    <div className="border rounded-lg p-4">
      <h3 className="text-sm font-medium mb-3">{label}</h3>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={formatted}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="label" fontSize={12} />
          <YAxis fontSize={12} />
          <Tooltip />
          <Line type="monotone" dataKey={dataKey} stroke={color} strokeWidth={2} dot={{ r: 4 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
```

- [ ] **Step 4: 강아지 상세에 차트 추가**

`app/(app)/dogs/[id]/page.tsx` 수정 (RecordList 위에):

```tsx
import { weeklyStats } from "@/lib/services/stats.service";
import { WeeklyChart } from "@/components/dashboard/weekly-chart";

// 페이지 내부 데이터 fetch 추가
const stats = await weeklyStats(id, session.user.id);

// JSX에 추가
<section>
  <h2 className="text-lg font-semibold mb-3">주간 통계</h2>
  <div className="grid gap-3">
    <WeeklyChart data={stats} dataKey="mealAmount" label="식사량 (g)" color="#4B7BAD" />
    <WeeklyChart data={stats} dataKey="walkMinutes" label="산책 시간 (분)" color="#FF7A6E" />
    <WeeklyChart data={stats} dataKey="weight" label="체중 (kg)" color="#4CAF7C" />
  </div>
</section>
```

- [ ] **Step 5: 검증 + 커밋**

```bash
git add components/dashboard/weekly-chart.tsx lib/services/stats.service.ts app/\(app\)/dogs/\[id\]/page.tsx package.json package-lock.json
git commit -m "feat: add weekly stats charts to dog detail"
git push
```

---

### Phase 5 완료 체크포인트 ✅

- [ ] Vercel prod에서 대시보드 + 차트 정상 렌더링
- [ ] 모바일 viewport에서 차트 깨짐 없음

---

## Phase 6: 마무리 (Day 7, 2시간)

---

### Task 24: 빈 상태/로딩/에러 처리

**Files:**
- Create: `app/(app)/loading.tsx`, `app/(app)/error.tsx`, `app/(app)/not-found.tsx`

- [ ] **Step 1: 공통 loading.tsx**

```tsx
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="container max-w-2xl mx-auto py-8 space-y-4">
      <Skeleton className="h-8 w-1/3" />
      <Skeleton className="h-32 w-full" />
      <Skeleton className="h-32 w-full" />
    </div>
  );
}
```

- [ ] **Step 2: error.tsx**

```tsx
"use client";
import { Button } from "@/components/ui/button";

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="container max-w-md mx-auto py-16 text-center">
      <h2 className="text-xl font-semibold mb-2">문제가 발생했어요</h2>
      <p className="text-sm text-muted-foreground mb-4">{error.message}</p>
      <Button onClick={reset}>다시 시도</Button>
    </div>
  );
}
```

- [ ] **Step 3: not-found.tsx**

```tsx
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="container max-w-md mx-auto py-16 text-center">
      <h2 className="text-xl font-semibold mb-2">찾을 수 없는 페이지입니다</h2>
      <Button asChild><Link href="/">대시보드로</Link></Button>
    </div>
  );
}
```

- [ ] **Step 4: 커밋**

```bash
git add app/\(app\)/loading.tsx app/\(app\)/error.tsx app/\(app\)/not-found.tsx
git commit -m "feat: add loading, error, and not-found UI"
```

---

### Task 25: README + .env.example

**Files:**
- Create: `README.md`, `.env.example`

- [ ] **Step 1: README.md 작성**

```markdown
# 🐕 DogHealth Tracker

지병이 있는 강아지 보호자를 위한 헬스 트래커 (모든 강아지 보호자 사용 가능).

## MVP 0 (현재) 기능
- 회원가입 / 로그인 (NextAuth credentials)
- 강아지 등록
- 일일 기록 입력/수정/삭제 (식사, 산책, 배변, 체중, 메모)
- 주간 통계 차트

## Stack
- Next.js 16 (App Router) + TypeScript
- Prisma + SQLite (dev) → PostgreSQL (prod 예정)
- NextAuth v5 (Auth.js)
- shadcn/ui + Tailwind
- Vitest

## Quick Start
```bash
cp .env.example .env.local
# AUTH_SECRET 생성: openssl rand -base64 32
npm install
npm run db:migrate
npm run dev
# http://localhost:3000
```

## Test
```bash
npm test
```

## 로드맵
- [x] MVP 0: 기본 트래커
- [ ] MVP 1: 사진/약 알림
- [ ] MVP 2: 지병별 동적 모니터링 + 측정 도구
- [ ] MVP 3: AI 간식 분석
- [ ] MVP 4: NestJS 분리 + Docker + 배포

자세한 spec: `docs/superpowers/specs/2026-06-07-doghealth-tracker-design.md`
```

- [ ] **Step 2: .env.example**

```
DATABASE_URL="file:./dev.db"
AUTH_SECRET="generate-with-openssl-rand-base64-32"
AUTH_URL="http://localhost:3000"
```

- [ ] **Step 3: 커밋**

```bash
git add README.md .env.example
git commit -m "docs: add README and env example"
```

---

### Task 26: 시드 스크립트 (데모용)

**Files:**
- Create: `prisma/seed.ts`
- Modify: `package.json`

- [ ] **Step 1: seed 작성**

`prisma/seed.ts`:

```ts
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const password = await bcrypt.hash("password123", 10);
  const user = await prisma.user.upsert({
    where: { email: "demo@dog.com" },
    update: {},
    create: { email: "demo@dog.com", password, name: "데모" },
  });

  const dog = await prisma.dog.upsert({
    where: { id: "demo-dog-id" },
    update: {},
    create: {
      id: "demo-dog-id",
      userId: user.id,
      name: "초코",
      breed: "포메라니안",
      birthDate: new Date("2020-05-10"),
      weight: 4.5,
    },
  });

  // 최근 7일 기록
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  for (let i = 0; i < 7; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    await prisma.dailyRecord.create({
      data: {
        dogId: dog.id,
        recordedAt: d,
        mealAmount: 100 + Math.floor(Math.random() * 30),
        walkMinutes: 20 + Math.floor(Math.random() * 20),
        walkDistance: 1 + Math.random(),
        poopCount: 1 + Math.floor(Math.random() * 2),
        weight: 4.5 + (Math.random() - 0.5) * 0.2,
      },
    });
  }

  console.log("✅ Seed complete: demo@dog.com / password123");
}

main().finally(() => prisma.$disconnect());
```

- [ ] **Step 2: package.json**

```json
"prisma": {
  "seed": "tsx prisma/seed.ts"
}
```

```bash
npm install -D tsx
```

- [ ] **Step 3: 실행**

```bash
npm run db:reset
npx prisma db seed
```

`demo@dog.com / password123`으로 로그인 → 초코의 7일 기록 확인.

- [ ] **Step 4: 커밋**

```bash
git add prisma/seed.ts package.json package-lock.json
git commit -m "feat: add demo seed script"
```

---

### Task 27: 종합 수동 테스트 + 회고

**Files:**
- Create: `docs/learning/MVP-0-RETRO.md`

- [ ] **Step 1: 로컬 체크리스트**

다음을 로컬(`npm run dev`)에서 모두 확인:

- [ ] `/signup` — 빈 폼/잘못된 이메일/짧은 비밀번호 검증 표시
- [ ] `/signup` — 정상 가입 → `/login?signup=success`로 이동
- [ ] `/login` — 잘못된 자격증명 → 에러 표시
- [ ] `/login` — 정상 로그인 → `/`로 이동
- [ ] `/` — 강아지 없을 때 빈 상태 표시
- [ ] `/dogs/new` — 강아지 등록 → 상세 페이지로 이동
- [ ] `/dogs/[id]` — 강아지 정보 + 차트 + 기록 목록 표시
- [ ] `/dogs/[id]/records/new` — 기록 입력 → 저장 → 상세로 리다이렉트
- [ ] `/dogs/[id]/records/[recordId]` — 수정/삭제 동작
- [ ] 로그아웃 → `/login`으로 이동
- [ ] 다른 사용자로 가입 후 첫 사용자의 강아지 URL 직접 접속 → 404
- [ ] 모바일 뷰포트(devtools)에서 레이아웃 깨짐 없음
- [ ] `npm test` — 모든 테스트 통과

- [ ] **Step 1.5: Prod 체크리스트 (Vercel)**

위 12개 항목을 **prod URL에서도 모두 동일하게** 확인. prod에서 안 되면 그게 진짜 버그. (보통 환경변수, 마이그레이션 누락, CORS 이슈 등)

prod 마이그레이션이 안 돼있으면:
```bash
DATABASE_URL="<Neon main branch URL>" npx prisma migrate deploy
```

- [ ] **Step 1.6: (옵션) 커스텀 도메인 연결**

Vercel → 프로젝트 → Settings → Domains에서 본인 도메인 연결 가능 (없으면 vercel.app subdomain 그대로 OK).

- [ ] **Step 2: 회고 작성**

`docs/learning/MVP-0-RETRO.md`:

```markdown
# MVP 0 회고

## 배운 것 (백엔드)
- (자유 기록)

## 막혔던 곳
- (자유 기록)

## 면접에서 어필 가능한 포인트
- (자유 기록)

## MVP 1 시작 전 정리할 코드
- (자유 기록)
```

- [ ] **Step 3: 마지막 커밋**

```bash
git add docs/learning/MVP-0-RETRO.md
git commit -m "docs: add MVP 0 retrospective template"
```

---

## 완료 기준

✅ MVP 0이 끝나면:
1. 회원가입 → 강아지 등록 → 매일 기록 → 주간 차트 확인까지 풀 흐름 동작
2. `npm test` 모두 통과
3. README 보고 다른 사람이 셋업 가능
4. 회고 문서 작성

다음 단계: **MVP 1 plan 작성 + 디자인 도구로 사진/약 알림 UI 디자인**

---

## Self-Review

✅ 모든 task에 파일 경로/코드/명령어/예상 결과 포함  
✅ TDD 흐름 일관됨 (validators/services/API)  
✅ UI는 수동 검증으로 처리 (UI 자동 테스트는 MVP 1 이후 고려)  
✅ MVP 0 spec의 모든 범위 커버 (인증/강아지/일일 기록/통계)  
✅ 커밋 메시지 conventional commits 규약 일관됨
