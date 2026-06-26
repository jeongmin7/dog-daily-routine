# AI 사료 성분표 분석 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 사용자가 사료 성분표 사진을 올리면 Claude 비전이 읽고 평가해 강아지별 분석 이력으로 저장하는 기능을 만든다.

**Architecture:** Blob에 사진 업로드 → `lib/feed-analysis.ts`의 순수 함수가 AI SDK v7 `generateObject`(Gateway→Claude 비전 + Zod 스키마)로 구조화 결과를 받음 → `FeedAnalysis` 행으로 저장. API는 기존 photos 라우트의 소유 스코프 패턴을 따르고, 클라는 react-query 훅으로만 접근한다. 강아지의 등록 지병(`DogDisease`)·나이·체중을 프롬프트에 주입해 맞춤 평가를 낸다.

**Tech Stack:** Next.js 16 (App Router) · Prisma 6 + Neon · `ai`@^7 (Vercel AI SDK, Gateway 라우팅) · `zod`@^4 · `@vercel/blob` · TanStack Query 5 · vitest

## Global Constraints

- 모든 API 엔드포인트는 세션/Bearer 통합 인증 `getUserId(req)`로 스코프(`where { userId }`). 남의 강아지/분석 접근 차단.
- API는 JSON만 응답, 정확한 status code, 에러는 `{ error: "..." }`. 검증은 프론트 1차 + 백 2차.
- 클라는 서버 상태에 `lib/queries.ts`의 react-query 훅으로만 접근(직접 axios/useEffect fetch 금지). 쓰기 후 관련 `qk` 키 invalidate.
- Next 16 동적 라우트 시그니처: `{ params }: { params: Promise<{ id: string }> }` + `await params`.
- 클라 HTTP는 axios. 업로드 상한 4MB(서버리스 body 한계), `image/*`만.
- AI 모델 문자열은 `MODEL` 상수 한 곳. Gateway 경유라 provider 패키지 불필요. 정확한 Claude Gateway 슬러그는 Task 3에서 확정.
- 키: 로컬 `AI_GATEWAY_API_KEY`(`.env`), 프로덕션은 Vercel OIDC 자동. 환경변수 추가 후 dev 서버 재시작.
- 커밋 메시지 번호는 일반 숫자, **Co-Authored-By 트레일러 금지**.
- 브랜치 `feat/ai-feed-analysis`(이미 생성됨, spec 커밋 7c06bab 위에서 작업).
- 마이그레이션은 직접(non-pooled) `DATABASE_URL`로. Prisma CLI는 `.env`를 읽음.

---

## File Structure

- `prisma/schema.prisma` (modify) — `FeedAnalysis` 모델 + `Dog.feedAnalyses` 관계.
- `lib/feed-analysis.ts` (create) — AI 레이어. `analyzeFeedLabel()` 순수 함수 + Zod 스키마 + 프롬프트 빌더.
- `lib/dog-context.ts` (create) — 강아지 나이/지병 컨텍스트 조립 헬퍼(라우트·테스트가 공유). 작게 격리.
- `lib/types.ts` (modify) — `FeedAnalysis` TS 타입.
- `app/api/dogs/[id]/feed-analyses/route.ts` (create) — GET(이력)·POST(분석).
- `app/api/dogs/[id]/feed-analyses/[analysisId]/route.ts` (create) — DELETE.
- `lib/queries.ts` (modify) — `qk.feedAnalyses` + 훅 3종.
- `components/dog-feed-analysis.tsx` (create) — 업로드 + 이력 UI.
- `app/(app)/dogs/[id]/page.tsx` (modify) — 섹션 연결.
- `tests/feed-analyses.test.ts` (create) — 라우트 회귀 테스트.
- `.env.example` (modify) — `AI_GATEWAY_API_KEY`.
- `package.json` (modify) — `ai`, `zod` deps.

---

### Task 1: 의존성 추가 + Prisma 모델 + 마이그레이션

**Files:**
- Modify: `package.json` (deps)
- Modify: `prisma/schema.prisma`
- Modify: `.env.example`

**Interfaces:**
- Produces: Prisma `FeedAnalysis` 모델 (`id, dogId, imageUrl, rating, summary, nutrients(Json), cautions(Json), benefits(Json), model, createdAt`), `prisma.feedAnalysis` 클라이언트 접근자.

- [ ] **Step 1: 의존성 설치**

```bash
npm install ai@^7 zod@^4
```

확인: `npm ls ai zod` 가 설치된 버전을 출력(에러 없이).

- [ ] **Step 2: `.env.example`에 키 추가**

`.env.example` 끝에 추가:

```
# Vercel AI Gateway (로컬 개발용; 프로덕션은 Vercel OIDC 자동)
AI_GATEWAY_API_KEY=""
```

- [ ] **Step 3: Prisma 스키마에 모델 추가**

`prisma/schema.prisma`의 `Dog` 모델 관계 목록에 한 줄 추가:

```prisma
  measurements MeasurementSession[]
  feedAnalyses FeedAnalysis[]
```

파일 하단(다른 모델들과 같은 위치)에 모델 추가:

```prisma
model FeedAnalysis {
  id        String   @id @default(cuid())
  dogId     String
  dog       Dog      @relation(fields: [dogId], references: [id], onDelete: Cascade)
  imageUrl  String
  rating    Int
  summary   String
  nutrients Json
  cautions  Json
  benefits  Json
  model     String
  createdAt DateTime @default(now())
}
```

- [ ] **Step 4: 마이그레이션 생성·적용**

Run: `npx prisma migrate dev --name add_feed_analysis`
Expected: `Your database is now in sync with your schema` + `prisma/migrations/<timestamp>_add_feed_analysis/` 생성. (DATABASE_URL은 직접 연결.)

- [ ] **Step 5: 타입 체크**

Run: `npx tsc --noEmit`
Expected: 에러 없음(기존 코드는 새 모델을 아직 안 씀).

- [ ] **Step 6: 커밋**

```bash
git add package.json package-lock.json prisma/schema.prisma prisma/migrations .env.example
git commit -m "feat: FeedAnalysis 모델 + ai/zod 의존성 (1)"
```

---

### Task 2: 강아지 컨텍스트 헬퍼 `lib/dog-context.ts`

**Files:**
- Create: `lib/dog-context.ts`
- Create/Modify: `tests/dog-context.test.ts`

**Interfaces:**
- Produces:
  - `type DogContext = { name: string; ageText?: string; weight: number | null; diseases: string[] }`
  - `buildDogContext(dog: { name: string; birthdate: string | null; weight: number | null }, diseaseNames: string[]): DogContext` — `birthdate`(ISO `YYYY-MM-DD` 또는 null)로 `ageText`(예: `"3살"`) 계산, null이면 `ageText` 생략.
  - `ageFromBirthdate(birthdate: string | null, today: Date): number | null` — 만 나이(년). null/빈값이면 null.

- [ ] **Step 1: 실패하는 테스트 작성**

`tests/dog-context.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { ageFromBirthdate, buildDogContext } from "@/lib/dog-context";

describe("ageFromBirthdate", () => {
  it("생일이 지났으면 만나이", () => {
    expect(ageFromBirthdate("2021-01-01", new Date("2026-06-26"))).toBe(5);
  });
  it("올해 생일 전이면 한 살 적게", () => {
    expect(ageFromBirthdate("2021-12-31", new Date("2026-06-26"))).toBe(4);
  });
  it("null이면 null", () => {
    expect(ageFromBirthdate(null, new Date("2026-06-26"))).toBeNull();
  });
});

describe("buildDogContext", () => {
  it("나이·지병을 조립한다", () => {
    const ctx = buildDogContext(
      { name: "보리", birthdate: "2021-01-01", weight: 5.2 },
      ["신장병"],
    );
    expect(ctx.name).toBe("보리");
    expect(ctx.weight).toBe(5.2);
    expect(ctx.diseases).toEqual(["신장병"]);
    expect(ctx.ageText).toMatch(/살/);
  });
  it("birthdate 없으면 ageText 생략", () => {
    const ctx = buildDogContext(
      { name: "초코", birthdate: null, weight: null },
      [],
    );
    expect(ctx.ageText).toBeUndefined();
    expect(ctx.weight).toBeNull();
    expect(ctx.diseases).toEqual([]);
  });
});
```

- [ ] **Step 2: 실패 확인**

Run: `npx vitest run tests/dog-context.test.ts`
Expected: FAIL — "Cannot find module '@/lib/dog-context'".

- [ ] **Step 3: 구현**

`lib/dog-context.ts`:

```ts
export type DogContext = {
  name: string;
  ageText?: string;
  weight: number | null;
  diseases: string[];
};

// 만 나이(년). birthdate는 ISO "YYYY-MM-DD" 또는 null.
export function ageFromBirthdate(
  birthdate: string | null,
  today: Date,
): number | null {
  if (!birthdate) return null;
  const b = new Date(birthdate);
  if (Number.isNaN(b.getTime())) return null;
  let age = today.getFullYear() - b.getFullYear();
  const beforeBirthday =
    today.getMonth() < b.getMonth() ||
    (today.getMonth() === b.getMonth() && today.getDate() < b.getDate());
  if (beforeBirthday) age -= 1;
  return age < 0 ? 0 : age;
}

export function buildDogContext(
  dog: { name: string; birthdate: string | null; weight: number | null },
  diseaseNames: string[],
): DogContext {
  const age = ageFromBirthdate(dog.birthdate, new Date());
  return {
    name: dog.name,
    ...(age !== null ? { ageText: `${age}살` } : {}),
    weight: dog.weight,
    diseases: diseaseNames,
  };
}
```

- [ ] **Step 4: 통과 확인**

Run: `npx vitest run tests/dog-context.test.ts`
Expected: PASS (5 tests).

- [ ] **Step 5: 커밋**

```bash
git add lib/dog-context.ts tests/dog-context.test.ts
git commit -m "feat: 강아지 컨텍스트(나이·지병) 헬퍼 (2)"
```

---

### Task 3: AI 레이어 `lib/feed-analysis.ts`

**Files:**
- Create: `lib/feed-analysis.ts`

**Interfaces:**
- Consumes: `DogContext` from `lib/dog-context.ts`; `generateObject` from `ai`; `z` from `zod`.
- Produces:
  - `type FeedAnalysisResult = { rating: number; summary: string; nutrients: { label: string; value: string }[]; cautions: { ingredient: string; reason: string }[]; benefits: string[] }`
  - `const MODEL: string`
  - `analyzeFeedLabel(input: { imageUrl: string; dog: DogContext }): Promise<{ result: FeedAnalysisResult; model: string }>`

> 이 Task는 외부 AI를 호출하는 순수 함수라 단위 테스트를 붙이지 않는다(라우트 테스트에서 `vi.mock`으로 대체). 대신 타입체크 + Task 8의 로컬 런타임 검증으로 확인.

- [ ] **Step 1: Gateway 모델 슬러그 확정**

Vercel AI Gateway 모델 카탈로그(공식 문서/대시보드)에서 **비전 지원 최신 Claude Sonnet** 슬러그를 확인한다(예: `anthropic/claude-sonnet-4.x` 형태). 추측 금지 — 확인한 정확한 문자열을 `MODEL`에 넣는다.

- [ ] **Step 2: 구현**

`lib/feed-analysis.ts`:

```ts
import { generateObject } from "ai";
import { z } from "zod";
import type { DogContext } from "@/lib/dog-context";

// Gateway 경유 모델 문자열(provider/model). Step 1에서 확인한 슬러그로 교체.
export const MODEL = "anthropic/claude-sonnet-4.5";

const schema = z.object({
  rating: z.number().int().min(1).max(5),
  summary: z.string(),
  nutrients: z.array(z.object({ label: z.string(), value: z.string() })),
  cautions: z.array(z.object({ ingredient: z.string(), reason: z.string() })),
  benefits: z.array(z.string()),
});

export type FeedAnalysisResult = z.infer<typeof schema>;

function buildPrompt(dog: DogContext): string {
  const lines = [
    `강아지 "${dog.name}"의 보호자가 사료 봉지의 성분표 사진을 올렸습니다.`,
    `사진의 보장성분·원료명을 읽고, 이 강아지에게 적합한지 한국어로 평가하세요.`,
    `강아지 정보: 이름 ${dog.name}` +
      (dog.ageText ? `, 나이 ${dog.ageText}` : "") +
      (dog.weight != null ? `, 체중 ${dog.weight}kg` : ""),
    dog.diseases.length
      ? `등록된 지병: ${dog.diseases.join(", ")}. 이 지병 관점에서 주의해야 할 성분을 cautions에 반드시 짚어주세요.`
      : `등록된 지병 없음.`,
    `규칙:`,
    `- rating은 이 강아지 기준 종합 점수 1~5(5가 가장 좋음).`,
    `- nutrients엔 성분표에서 읽은 핵심 영양(예: 조단백, 조지방)을 label/value로.`,
    `- cautions엔 이 강아지에게 주의할 성분과 그 이유. 없으면 빈 배열.`,
    `- benefits엔 좋은 특징. 없으면 빈 배열.`,
    `- 성분표가 사진에서 읽히지 않으면 rating을 1~2로 낮추고 summary에 그 사실을 적으세요.`,
  ];
  return lines.join("\n");
}

export async function analyzeFeedLabel(input: {
  imageUrl: string;
  dog: DogContext;
}): Promise<{ result: FeedAnalysisResult; model: string }> {
  const { object } = await generateObject({
    model: MODEL,
    schema,
    messages: [
      {
        role: "user",
        content: [
          { type: "text", text: buildPrompt(input.dog) },
          { type: "file", mediaType: "image", data: new URL(input.imageUrl) },
        ],
      },
    ],
  });
  return { result: object, model: MODEL };
}
```

- [ ] **Step 3: 타입 체크**

Run: `npx tsc --noEmit`
Expected: 에러 없음.

- [ ] **Step 4: 커밋**

```bash
git add lib/feed-analysis.ts
git commit -m "feat: AI 사료 분석 레이어(generateObject+zod 비전) (3)"
```

---

### Task 4: 분석 API — GET/POST `feed-analyses/route.ts`

**Files:**
- Create: `app/api/dogs/[id]/feed-analyses/route.ts`
- Create: `tests/feed-analyses.test.ts`

**Interfaces:**
- Consumes: `getUserId` (`@/lib/api-auth`), `prisma` (`@/lib/prisma`), `put`/`del` (`@vercel/blob`), `analyzeFeedLabel`+`MODEL` (`@/lib/feed-analysis`), `buildDogContext` (`@/lib/dog-context`).
- Produces: `GET`/`POST` 핸들러. POST 성공 응답 `{ data: FeedAnalysis }` 201.

> 테스트 패턴은 기존 `tests/*.test.ts`를 따른다: 라우트 핸들러 직접 import + `vi.mock`으로 `@/lib/api-auth`, `@/lib/prisma`, `@vercel/blob`, `@/lib/feed-analysis` 모킹. 기존 `tests/helpers.ts`가 있으면 재사용. POST 본문은 `Request`에 `FormData`를 실어 만든다.

- [ ] **Step 1: 실패하는 테스트 작성**

`tests/feed-analyses.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/api-auth", () => ({ getUserId: vi.fn() }));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    dog: { findFirst: vi.fn() },
    feedAnalysis: { findMany: vi.fn(), create: vi.fn() },
  },
}));
vi.mock("@vercel/blob", () => ({ put: vi.fn(), del: vi.fn() }));
vi.mock("@/lib/feed-analysis", () => ({
  MODEL: "test-model",
  analyzeFeedLabel: vi.fn(),
}));

import { GET, POST } from "@/app/api/dogs/[id]/feed-analyses/route";
import { getUserId } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { put } from "@vercel/blob";
import { analyzeFeedLabel } from "@/lib/feed-analysis";

const params = Promise.resolve({ id: "dog1" });

function postReq(form: FormData) {
  return new Request("http://t/api/dogs/dog1/feed-analyses", {
    method: "POST",
    body: form,
  });
}
function imageForm() {
  const f = new FormData();
  f.set("file", new File(["x"], "label.jpg", { type: "image/jpeg" }));
  return f;
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("GET feed-analyses", () => {
  it("인증 없으면 401", async () => {
    (getUserId as any).mockResolvedValue(null);
    const res = await GET(new Request("http://t"), { params });
    expect(res.status).toBe(401);
  });
  it("남의 강아지면 404", async () => {
    (getUserId as any).mockResolvedValue("u1");
    (prisma.dog.findFirst as any).mockResolvedValue(null);
    const res = await GET(new Request("http://t"), { params });
    expect(res.status).toBe(404);
    expect((prisma.dog.findFirst as any).mock.calls[0][0].where).toEqual({
      id: "dog1",
      userId: "u1",
    });
  });
  it("이력 목록 200", async () => {
    (getUserId as any).mockResolvedValue("u1");
    (prisma.dog.findFirst as any).mockResolvedValue({ id: "dog1" });
    (prisma.feedAnalysis.findMany as any).mockResolvedValue([{ id: "a1" }]);
    const res = await GET(new Request("http://t"), { params });
    expect(res.status).toBe(200);
    expect((await res.json()).data).toHaveLength(1);
  });
});

describe("POST feed-analyses", () => {
  it("인증 없으면 401", async () => {
    (getUserId as any).mockResolvedValue(null);
    const res = await POST(postReq(imageForm()), { params });
    expect(res.status).toBe(401);
  });
  it("파일 없으면 400", async () => {
    (getUserId as any).mockResolvedValue("u1");
    (prisma.dog.findFirst as any).mockResolvedValue({ id: "dog1" });
    const res = await POST(postReq(new FormData()), { params });
    expect(res.status).toBe(400);
  });
  it("이미지 아니면 400", async () => {
    (getUserId as any).mockResolvedValue("u1");
    (prisma.dog.findFirst as any).mockResolvedValue({ id: "dog1" });
    const f = new FormData();
    f.set("file", new File(["x"], "a.txt", { type: "text/plain" }));
    const res = await POST(postReq(f), { params });
    expect(res.status).toBe(400);
  });
  it("정상: dog.id로 저장하고 201", async () => {
    (getUserId as any).mockResolvedValue("u1");
    (prisma.dog.findFirst as any).mockResolvedValue({
      id: "dog1",
      name: "보리",
      birthdate: null,
      weight: null,
      diseases: [{ disease: { name: "신장병" } }],
    });
    (put as any).mockResolvedValue({ url: "https://blob/label.jpg" });
    (analyzeFeedLabel as any).mockResolvedValue({
      result: {
        rating: 4,
        summary: "좋음",
        nutrients: [],
        cautions: [],
        benefits: [],
      },
      model: "test-model",
    });
    (prisma.feedAnalysis.create as any).mockResolvedValue({ id: "a1" });
    const res = await POST(postReq(imageForm()), { params });
    expect(res.status).toBe(201);
    const createArg = (prisma.feedAnalysis.create as any).mock.calls[0][0];
    expect(createArg.data.dogId).toBe("dog1"); // 클라 입력 아닌 검증된 dog.id
    expect(createArg.data.imageUrl).toBe("https://blob/label.jpg");
    expect(createArg.data.model).toBe("test-model");
  });
  it("AI 실패하면 502 + blob 롤백", async () => {
    (getUserId as any).mockResolvedValue("u1");
    (prisma.dog.findFirst as any).mockResolvedValue({
      id: "dog1",
      name: "보리",
      birthdate: null,
      weight: null,
      diseases: [],
    });
    (put as any).mockResolvedValue({ url: "https://blob/label.jpg" });
    (analyzeFeedLabel as any).mockRejectedValue(new Error("ai down"));
    const { del } = await import("@vercel/blob");
    const res = await POST(postReq(imageForm()), { params });
    expect(res.status).toBe(502);
    expect(del).toHaveBeenCalledWith("https://blob/label.jpg");
    expect(prisma.feedAnalysis.create).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: 실패 확인**

Run: `npx vitest run tests/feed-analyses.test.ts`
Expected: FAIL — 라우트 모듈 없음.

- [ ] **Step 3: 구현**

`app/api/dogs/[id]/feed-analyses/route.ts`:

```ts
import { getUserId } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { put, del } from "@vercel/blob";
import { NextResponse } from "next/server";
import { analyzeFeedLabel } from "@/lib/feed-analysis";
import { buildDogContext } from "@/lib/dog-context";

export const maxDuration = 60; // AI 호출 여유

const MAX_BYTES = 4 * 1024 * 1024;

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const userId = await getUserId(req);
  if (!userId) {
    return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
  }
  try {
    const dog = await prisma.dog.findFirst({ where: { id, userId } });
    if (!dog) {
      return NextResponse.json(
        { error: "해당 강아지를 찾을 수 없습니다." },
        { status: 404 },
      );
    }
    const analyses = await prisma.feedAnalysis.findMany({
      where: { dogId: dog.id },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ data: analyses }, { status: 200 });
  } catch {
    return NextResponse.json(
      { error: "분석 이력을 불러오는 중 오류가 발생했습니다." },
      { status: 500 },
    );
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const userId = await getUserId(req);
  if (!userId) {
    return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
  }

  const dog = await prisma.dog.findFirst({
    where: { id, userId },
    include: { diseases: { include: { disease: true } } },
  });
  if (!dog) {
    return NextResponse.json(
      { error: "해당 강아지를 찾을 수 없습니다." },
      { status: 404 },
    );
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json(
      { error: "잘못된 요청 형식입니다." },
      { status: 400 },
    );
  }
  const file = form.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json(
      { error: "이미지 파일이 필요합니다." },
      { status: 400 },
    );
  }
  if (!file.type.startsWith("image/")) {
    return NextResponse.json(
      { error: "이미지 파일만 업로드할 수 있습니다." },
      { status: 400 },
    );
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { error: "이미지는 4MB 이하만 업로드할 수 있습니다." },
      { status: 400 },
    );
  }

  const blob = await put(`feed-labels/${dog.id}/${file.name}`, file, {
    access: "public",
    addRandomSuffix: true,
  });

  try {
    const dogContext = buildDogContext(
      { name: dog.name, birthdate: dog.birthdate, weight: dog.weight },
      dog.diseases.map((d) => d.disease.name),
    );
    const { result, model } = await analyzeFeedLabel({
      imageUrl: blob.url,
      dog: dogContext,
    });
    const analysis = await prisma.feedAnalysis.create({
      data: {
        dogId: dog.id,
        imageUrl: blob.url,
        rating: result.rating,
        summary: result.summary,
        nutrients: result.nutrients,
        cautions: result.cautions,
        benefits: result.benefits,
        model,
      },
    });
    return NextResponse.json({ data: analysis }, { status: 201 });
  } catch {
    await del(blob.url).catch(() => {});
    return NextResponse.json(
      { error: "AI 분석에 실패했습니다. 잠시 후 다시 시도해주세요." },
      { status: 502 },
    );
  }
}
```

- [ ] **Step 4: 통과 확인**

Run: `npx vitest run tests/feed-analyses.test.ts`
Expected: PASS (GET 3 + POST 5 = 8 tests).

- [ ] **Step 5: 커밋**

```bash
git add app/api/dogs/\[id\]/feed-analyses/route.ts tests/feed-analyses.test.ts
git commit -m "feat: 사료 분석 API GET/POST (4)"
```

---

### Task 5: 삭제 API — DELETE `[analysisId]/route.ts`

**Files:**
- Create: `app/api/dogs/[id]/feed-analyses/[analysisId]/route.ts`
- Modify: `tests/feed-analyses.test.ts` (DELETE describe 추가)

**Interfaces:**
- Consumes: `getUserId`, `prisma.feedAnalysis.findFirst/delete`, `del` (`@vercel/blob`).
- Produces: `DELETE(_req, { params: Promise<{ id, analysisId }> })`.

- [ ] **Step 1: 실패하는 테스트 추가**

`tests/feed-analyses.test.ts`의 prisma 모킹에 `feedAnalysis.findFirst`/`delete`를 추가하고(없으면), 파일 끝에 describe 추가:

```ts
import { DELETE } from "@/app/api/dogs/[id]/feed-analyses/[analysisId]/route";

const delParams = Promise.resolve({ id: "dog1", analysisId: "a1" });

describe("DELETE feed-analysis", () => {
  it("인증 없으면 401", async () => {
    (getUserId as any).mockResolvedValue(null);
    const res = await DELETE(new Request("http://t"), { params: delParams });
    expect(res.status).toBe(401);
  });
  it("남의 강아지면 404", async () => {
    (getUserId as any).mockResolvedValue("u1");
    (prisma.dog.findFirst as any).mockResolvedValue(null);
    const res = await DELETE(new Request("http://t"), { params: delParams });
    expect(res.status).toBe(404);
  });
  it("남의 분석이면 404", async () => {
    (getUserId as any).mockResolvedValue("u1");
    (prisma.dog.findFirst as any).mockResolvedValue({ id: "dog1" });
    (prisma.feedAnalysis.findFirst as any).mockResolvedValue(null);
    const res = await DELETE(new Request("http://t"), { params: delParams });
    expect(res.status).toBe(404);
  });
  it("정상: blob del 후 삭제 200", async () => {
    (getUserId as any).mockResolvedValue("u1");
    (prisma.dog.findFirst as any).mockResolvedValue({ id: "dog1" });
    (prisma.feedAnalysis.findFirst as any).mockResolvedValue({
      id: "a1",
      dogId: "dog1",
      imageUrl: "https://blob/x.jpg",
    });
    (prisma.feedAnalysis.delete as any).mockResolvedValue({});
    const { del } = await import("@vercel/blob");
    const res = await DELETE(new Request("http://t"), { params: delParams });
    expect(res.status).toBe(200);
    expect(del).toHaveBeenCalledWith("https://blob/x.jpg");
    expect((prisma.feedAnalysis.findFirst as any).mock.calls[0][0].where).toEqual(
      { id: "a1", dogId: "dog1" },
    );
  });
});
```

(상단 `vi.mock("@/lib/prisma", ...)`의 `feedAnalysis`에 `findFirst: vi.fn(), delete: vi.fn()` 추가.)

- [ ] **Step 2: 실패 확인**

Run: `npx vitest run tests/feed-analyses.test.ts`
Expected: FAIL — DELETE 라우트 모듈 없음.

- [ ] **Step 3: 구현**

`app/api/dogs/[id]/feed-analyses/[analysisId]/route.ts`:

```ts
import { getUserId } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { del } from "@vercel/blob";
import { NextResponse } from "next/server";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string; analysisId: string }> },
) {
  const { id, analysisId } = await params;
  const userId = await getUserId(_req);
  if (!userId) {
    return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
  }
  try {
    const dog = await prisma.dog.findFirst({ where: { id, userId } });
    if (!dog) {
      return NextResponse.json(
        { error: "해당 강아지를 찾을 수 없습니다." },
        { status: 404 },
      );
    }
    const analysis = await prisma.feedAnalysis.findFirst({
      where: { id: analysisId, dogId: dog.id },
    });
    if (!analysis) {
      return NextResponse.json(
        { error: "해당 분석을 찾을 수 없습니다." },
        { status: 404 },
      );
    }
    await del(analysis.imageUrl).catch(() => {});
    await prisma.feedAnalysis.delete({ where: { id: analysis.id } });
    return NextResponse.json({ message: "삭제되었습니다." }, { status: 200 });
  } catch {
    return NextResponse.json(
      { error: "분석을 삭제하는 중 오류가 발생했습니다." },
      { status: 500 },
    );
  }
}
```

- [ ] **Step 4: 통과 확인**

Run: `npx vitest run tests/feed-analyses.test.ts`
Expected: PASS (이전 8 + DELETE 4 = 12 tests).

- [ ] **Step 5: 전체 테스트**

Run: `npm test`
Expected: 기존 67 + dog-context 5 + feed-analyses 12 = 84 PASS.

- [ ] **Step 6: 커밋**

```bash
git add app/api/dogs/\[id\]/feed-analyses/\[analysisId\]/route.ts tests/feed-analyses.test.ts
git commit -m "feat: 사료 분석 삭제 API (5)"
```

---

### Task 6: 타입 + react-query 훅

**Files:**
- Modify: `lib/types.ts`
- Modify: `lib/queries.ts`

**Interfaces:**
- Produces:
  - `FeedAnalysis` 타입 (`lib/types.ts`).
  - `qk.feedAnalyses(dogId: string)` 쿼리키.
  - `useFeedAnalyses(dogId)`, `useCreateFeedAnalysis(dogId)`, `useDeleteFeedAnalysis(dogId)` 훅.

> 단위 테스트 없음(react-query 훅은 Task 8 런타임 검증으로 확인). 기존 `lib/queries.ts`의 `usePhotos/useUploadPhoto/useDeletePhoto` 패턴을 그대로 모방한다.

- [ ] **Step 1: 타입 추가**

`lib/types.ts`에 추가:

```ts
export type FeedAnalysisNutrient = { label: string; value: string };
export type FeedAnalysisCaution = { ingredient: string; reason: string };

export type FeedAnalysis = {
  id: string;
  dogId: string;
  imageUrl: string;
  rating: number;
  summary: string;
  nutrients: FeedAnalysisNutrient[];
  cautions: FeedAnalysisCaution[];
  benefits: string[];
  model: string;
  createdAt: string;
};
```

- [ ] **Step 2: 쿼리키 + 훅 추가**

`lib/queries.ts`에서 — 먼저 `qk` 팩토리에 추가(기존 사진 키 옆):

```ts
  feedAnalyses: (dogId: string) => [...qk.dog(dogId), "feed-analyses"] as const,
```

(정확한 prefix는 기존 `photos` 키 구조에 맞춘다.) 그리고 훅 추가 — 기존 `usePhotos`/`useUploadPhoto`/`useDeletePhoto`를 복사해 엔드포인트만 `feed-analyses`로:

```ts
import type { FeedAnalysis } from "@/lib/types";

export function useFeedAnalyses(dogId: string) {
  return useQuery({
    queryKey: qk.feedAnalyses(dogId),
    queryFn: async () => {
      const { data } = await axios.get<{ data: FeedAnalysis[] }>(
        `/api/dogs/${dogId}/feed-analyses`,
      );
      return data.data;
    },
  });
}

export function useCreateFeedAnalysis(dogId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (file: File) => {
      const form = new FormData();
      form.set("file", file);
      const { data } = await axios.post<{ data: FeedAnalysis }>(
        `/api/dogs/${dogId}/feed-analyses`,
        form,
      );
      return data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.feedAnalyses(dogId) });
    },
  });
}

export function useDeleteFeedAnalysis(dogId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (analysisId: string) => {
      await axios.delete(`/api/dogs/${dogId}/feed-analyses/${analysisId}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.feedAnalyses(dogId) });
    },
  });
}
```

(import 구문은 파일 상단의 기존 `useQuery/useMutation/useQueryClient/axios/qk` import에 맞춰 조정.)

- [ ] **Step 3: 타입 체크**

Run: `npx tsc --noEmit`
Expected: 에러 없음.

- [ ] **Step 4: 커밋**

```bash
git add lib/types.ts lib/queries.ts
git commit -m "feat: 사료 분석 타입 + react-query 훅 (6)"
```

---

### Task 7: UI 컴포넌트 + 강아지 상세 연결

**Files:**
- Create: `components/dog-feed-analysis.tsx`
- Modify: `app/(app)/dogs/[id]/page.tsx`

**Interfaces:**
- Consumes: `useFeedAnalyses`, `useCreateFeedAnalysis`, `useDeleteFeedAnalysis` (`@/lib/queries`); `FeedAnalysis` (`@/lib/types`).
- Produces: `<DogFeedAnalysis dogId={...} />` 기본 export.

> 단위 테스트 없음(Task 8 런타임 검증). 기존 `components/dog-photos.tsx`의 업로드/리스트/삭제 구조와 "하루" 시안 톤(스카이블루 `#2E92D6`/코랄 `#FF7A6E`)을 따른다.

- [ ] **Step 1: 컴포넌트 작성**

`components/dog-feed-analysis.tsx` (client component). 요구 동작:
- `"use client"` 선언.
- 파일 input(`accept="image/*"`) + "분석하기" 버튼. 선택 파일 없으면 버튼 비활성.
- 제출 시 `useCreateFeedAnalysis(dogId).mutate(file)`; `isPending` 동안 "AI가 성분표를 분석하고 있어요…" 로딩 표시(수 초 소요 안내). 실패 시 `alert(error)` 후 복구.
- `useFeedAnalyses(dogId)` 목록을 카드로: 성분표 썸네일(`imageUrl`), 평점 배지(`rating`/5), `summary`, `cautions`(빨강 배지 `ingredient` + `reason`), `benefits`(초록 칩), `nutrients`(label·value 표). 각 카드에 삭제 버튼 → 2단계 확인 후 `useDeleteFeedAnalysis(dogId).mutate(id)`.
- 빈 상태: "아직 분석한 사료가 없어요. 성분표 사진을 올려보세요."

```tsx
"use client";

import { useState } from "react";
import {
  useFeedAnalyses,
  useCreateFeedAnalysis,
  useDeleteFeedAnalysis,
} from "@/lib/queries";

export default function DogFeedAnalysis({ dogId }: { dogId: string }) {
  const { data: analyses = [], isLoading } = useFeedAnalyses(dogId);
  const create = useCreateFeedAnalysis(dogId);
  const remove = useDeleteFeedAnalysis(dogId);
  const [file, setFile] = useState<File | null>(null);

  async function onAnalyze() {
    if (!file) return;
    try {
      await create.mutateAsync(file);
      setFile(null);
    } catch {
      alert("AI 분석에 실패했습니다. 잠시 후 다시 시도해주세요.");
    }
  }

  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold">사료 분석</h2>

      <div className="flex items-center gap-2">
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        />
        <button
          onClick={onAnalyze}
          disabled={!file || create.isPending}
          className="rounded-lg bg-[#2E92D6] px-4 py-2 text-white disabled:opacity-50"
        >
          {create.isPending ? "분석 중…" : "분석하기"}
        </button>
      </div>
      {create.isPending && (
        <p className="text-sm text-gray-500">
          AI가 성분표를 읽고 있어요. 몇 초 걸릴 수 있어요…
        </p>
      )}

      {isLoading ? (
        <p className="text-sm text-gray-500">불러오는 중…</p>
      ) : analyses.length === 0 ? (
        <p className="text-sm text-gray-500">
          아직 분석한 사료가 없어요. 성분표 사진을 올려보세요.
        </p>
      ) : (
        <ul className="space-y-4">
          {analyses.map((a) => (
            <li key={a.id} className="rounded-xl border p-4 space-y-2">
              <div className="flex items-start gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={a.imageUrl}
                  alt="성분표"
                  className="h-20 w-20 rounded-lg object-cover"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-[#2E92D6] px-2 py-0.5 text-xs text-white">
                      {a.rating}/5
                    </span>
                  </div>
                  <p className="mt-1 text-sm">{a.summary}</p>
                </div>
                <button
                  onClick={() => {
                    if (confirm("이 분석을 삭제할까요?")) remove.mutate(a.id);
                  }}
                  className="text-sm text-gray-400 hover:text-[#FF7A6E]"
                >
                  삭제
                </button>
              </div>

              {a.cautions.length > 0 && (
                <ul className="space-y-1">
                  {a.cautions.map((c, i) => (
                    <li
                      key={i}
                      className="rounded-lg bg-red-50 px-2 py-1 text-sm text-red-700"
                    >
                      <strong>{c.ingredient}</strong> — {c.reason}
                    </li>
                  ))}
                </ul>
              )}

              {a.benefits.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {a.benefits.map((b, i) => (
                    <span
                      key={i}
                      className="rounded-full bg-green-50 px-2 py-0.5 text-xs text-green-700"
                    >
                      {b}
                    </span>
                  ))}
                </div>
              )}

              {a.nutrients.length > 0 && (
                <table className="text-xs text-gray-600">
                  <tbody>
                    {a.nutrients.map((n, i) => (
                      <tr key={i}>
                        <td className="pr-3 font-medium">{n.label}</td>
                        <td>{n.value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
```

- [ ] **Step 2: 강아지 상세에 섹션 연결**

`app/(app)/dogs/[id]/page.tsx`에서 기존 사진/약/모니터링 섹션을 렌더하는 곳을 찾아 같은 자리에 추가:

```tsx
import DogFeedAnalysis from "@/components/dog-feed-analysis";
// ...
<DogFeedAnalysis dogId={dog.id} />
```

(정확한 prop 이름·위치는 기존 `DogPhotos`/`DogMedications` 사용처에 맞춘다.)

- [ ] **Step 3: 타입 체크 + 린트**

Run: `npx tsc --noEmit && npm run lint`
Expected: 에러 없음.

- [ ] **Step 4: 커밋**

```bash
git add components/dog-feed-analysis.tsx "app/(app)/dogs/[id]/page.tsx"
git commit -m "feat: 사료 분석 UI + 강아지 상세 연결 (7)"
```

---

### Task 8: 로컬 런타임 검증 + PR

**Files:** 없음(검증·머지).

- [ ] **Step 1: 환경변수 준비**

`.env`에 `AI_GATEWAY_API_KEY` 채움(Vercel AI Gateway 키). dev 서버 재시작.

- [ ] **Step 2: 전체 게이트**

Run: `npx tsc --noEmit && npm run lint && npm test`
Expected: 모두 통과(84 tests).

- [ ] **Step 3: 브라우저 런타임 검증**

`npm run dev` → 로그인 → 강아지(지병 등록된 개체, 없으면 신장병 등록) 상세 → "사료 분석" 섹션.
- 실제 사료 성분표 사진 업로드 → "분석하기".
- 확인: 로딩 표시 → 평점·요약·주의성분·영양 카드 렌더. **콘솔 에러 0**.
- 지병 맞춤 평가가 cautions에 반영되는지 눈으로 확인(예: 신장병 → 인/단백 관련 주의).
- 카드 삭제 → 목록에서 사라짐 + Blob 정리.
- (선택) Network 탭에서 POST `feed-analyses` 201, DELETE 200 확인.

- [ ] **Step 4: PR**

```bash
git push -u origin feat/ai-feed-analysis
gh pr create --base develop --title "feat: AI 사료 성분표 분석 (MVP 3)" --body "성분표 사진 → Claude 비전 분석 → 강아지별 이력 저장. 지병 맞춤 평가. spec/plan 문서 포함."
```

- [ ] **Step 5: CLAUDE.md 진행 상태 갱신**

`CLAUDE.md` "현재 진행 상태"에 MVP 3 완료 항목 추가(모델·API·UI·테스트 수·검증 결과·브랜치·spec 경로). 별도 커밋:

```bash
git add CLAUDE.md
git commit -m "docs: MVP 3 사료 분석 완료 진행상태 갱신 (8)"
```

---

## Self-Review

**Spec coverage:**
- 데이터 모델 §3 → Task 1. ✅
- AI 레이어 §4(generateObject+zod+프롬프트, 모델 상수, 키) → Task 3 (+ 컨텍스트 Task 2). ✅
- API §5(GET/POST/DELETE, 소유 스코프, 502 롤백, maxDuration) → Task 4·5. ✅
- 클라 §6(types, qk, 훅 3종, 컴포넌트, 상세 연결) → Task 6·7. ✅
- 테스트 §7(인증·소유·검증·정상·AI실패 롤백) → Task 4·5 테스트. ✅
- 관통 원칙 §8 → Global Constraints + 각 라우트. ✅

**Placeholder scan:** 코드 스텝은 실제 코드 포함. `qk.feedAnalyses` prefix와 page.tsx 삽입 위치는 "기존 패턴에 맞춘다"로 명시(기존 photos 훅/사용처가 단일 소스라 모방 대상이 분명). 모델 슬러그는 Task 3 Step 1에서 확정(추측 금지 원칙).

**Type consistency:** `FeedAnalysisResult`(Task 3) = `z.infer<typeof schema>`, `FeedAnalysis`(Task 6 types) = 그 결과 + `id/dogId/imageUrl/model/createdAt`. 라우트 create의 `data`(Task 4)가 두 타입 필드와 일치. `DogContext`(Task 2)를 Task 3·4가 동일 시그니처로 소비. 훅 이름 `useFeedAnalyses/useCreateFeedAnalysis/useDeleteFeedAnalysis`가 Task 6·7에서 일관. ✅
