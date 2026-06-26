# MVP 3 — AI 사료 성분표 분석 설계

> 작성일 2026-06-26 · 브랜치 `feat/ai-feed-analysis` · 상태: 설계 승인됨

## 1. 목표 / 한 줄 요약

사용자가 **사료 봉지의 성분표(보장성분·원료명) 사진**을 올리면, AI(Claude 비전)가 읽어서
**종합 평점 · 한 줄 총평 · 핵심 영양 · 주의 성분 · 장점**을 구조화해서 돌려주고, 강아지별 **분석 이력**으로 저장한다.

이 강아지에 등록된 **지병(`DogDisease`)·나이·체중**을 프롬프트에 주입해 *맞춤형* 평가를 낸다.
(예: "보리는 신장병이 등록돼 있어요 — 이 사료는 인 함량이 높아 주의하세요.")
→ MVP 2에서 만든 지병 기능을 **재사용**한다(새 데이터 모델 불필요).

포트폴리오 관점: "최신 Vercel AI SDK + AI Gateway로 Claude 비전 + 구조화 출력을 관용적으로 썼다"를 보여주는 핵심 데모.

## 2. 범위 (YAGNI)

**포함**
- 성분표 사진 1장 업로드 → 분석 → 저장 → 이력 표시 → 삭제.
- 강아지 컨텍스트(지병·나이·체중) 기반 맞춤 평가.
- 구조화 결과 5필드(평점·요약·핵심영양·주의성분·장점).

**제외 (이번 슬라이스 아님)**
- 여러 장 동시 분석 / 사료 제품 DB / 가격 비교.
- 분석 결과 재계산·수정(분석은 불변 스냅샷, 필요하면 새로 분석).
- 모델 선택 UI(기본 Claude 고정, 교체는 코드 상수 변경으로).
- 스트리밍 표시(요청-응답 1회로 충분).

## 3. 데이터 모델

마이그레이션 `add_feed_analysis`. 결과는 **불변 스냅샷** — 분석 당시의 입력·출력·모델을 그대로 보존(재현성).

```prisma
model FeedAnalysis {
  id        String   @id @default(cuid())
  dogId     String
  dog       Dog      @relation(fields: [dogId], references: [id], onDelete: Cascade)
  imageUrl  String              // Blob URL (분석한 성분표 사진)
  rating    Int                 // 종합 평점 1~5
  summary   String              // 한 줄 총평
  nutrients Json                // [{ label: string, value: string }]  라벨에서 읽은 핵심 영양
  cautions  Json                // [{ ingredient: string, reason: string }]  이 강아지에 주의 성분
  benefits  Json                // string[]  장점/좋은 특징
  model     String              // 사용한 모델 문자열(예: "anthropic/claude-..."), 재현성
  createdAt DateTime @default(now())
}
```

`Dog` 모델에 관계 추가: `feedAnalyses FeedAnalysis[]`.

> Json 컬럼을 쓰는 이유: 배열형 결과(주의성분·영양·장점)는 갯수가 가변이고 쿼리로 필터링할 일이 없다.
> 정규화 테이블 3개를 더 만드는 건 과설계 → Json 한 컬럼씩으로 단순화. 타입 안전성은 API/클라 레이어의
> Zod·TS 타입으로 보장한다.

## 4. AI 레이어 — `lib/feed-analysis.ts`

순수 함수 1개로 격리(API 라우트는 이걸 호출만 → 테스트에서 `vi.mock` 가능).

### 의존성 (npm 레지스트리 확인 완료 2026-06-26)
- `ai` `^7.0.2` (Vercel AI SDK) — **Gateway는 `provider/model` 문자열로 자동 라우팅**, 별도 provider 패키지 불필요.
- `zod` `^4.4.3` — 구조화 출력 스키마.
- (provider 패키지 `@ai-sdk/anthropic`는 **불필요** — 문자열 모델 + Gateway면 충분.)

### 인증/키
- **프로덕션(Vercel)**: OIDC 토큰 자동 — 환경변수 불필요.
- **로컬**: `AI_GATEWAY_API_KEY` 하나. `.env.example`에 추가, CLAUDE.md "환경변수 추가 시 dev 재시작" 반영.

### 모델
- 기본 상수 `MODEL = "anthropic/claude-..."` (비전 지원 최신 Sonnet 계열).
  ⚠️ **정확한 Gateway 모델 슬러그는 구현 시점에 Gateway 모델 카탈로그로 확정**(슬러그 네이밍이 자주 바뀜).
- 교체/폴백은 이 상수만 바꾸면 됨(GPT/Gemini로도 `openai/...`·`google/...`).

### 시그니처
```ts
export type FeedAnalysisResult = {
  rating: number;                                   // 1~5
  summary: string;
  nutrients: { label: string; value: string }[];
  cautions: { ingredient: string; reason: string }[];
  benefits: string[];
};

export async function analyzeFeedLabel(input: {
  imageUrl: string;                                 // Blob 공개 URL
  dog: { name: string; ageText?: string; weight?: number | null };
  diseases: string[];                               // 등록된 지병 한글명 ["신장병", ...]
}): Promise<{ result: FeedAnalysisResult; model: string }>;
```

### 구현 골자
```ts
import { generateObject } from "ai";
import { z } from "zod";

const schema = z.object({
  rating: z.number().int().min(1).max(5),
  summary: z.string(),
  nutrients: z.array(z.object({ label: z.string(), value: z.string() })),
  cautions: z.array(z.object({ ingredient: z.string(), reason: z.string() })),
  benefits: z.array(z.string()),
});

const { object } = await generateObject({
  model: MODEL,
  schema,
  messages: [{
    role: "user",
    content: [
      { type: "text", text: buildPrompt(dog, diseases) },   // 한국어, 지병/나이/체중 주입
      { type: "file", mediaType: "image", data: new URL(imageUrl) },
    ],
  }],
});
return { result: object, model: MODEL };
```

- 프롬프트(한국어)는 "성분표를 읽고 이 강아지 기준으로 평가하라. 지병이 있으면 그 지병 관점에서
  주의 성분을 짚어라. 성분표가 안 보이면 rating을 낮게 주고 summary에 그 사실을 적어라" 류의 가드를 포함.
- 실패(모델 오류·이미지 판독 불가)는 throw → 라우트가 502로 변환.

## 5. API

기존 photos 라우트 패턴(소유 스코프 `getUserId` → `findFirst where {id,userId}` → 작업)을 그대로 따른다.

### `app/api/dogs/[id]/feed-analyses/route.ts`
- **GET** — 이력 목록. 소유확인 후 `findMany where {dogId}` `orderBy createdAt desc`. `{ data: [...] }` 200.
- **POST** — 분석 생성.
  1. `getUserId(req)` → 없으면 401.
  2. `dog = findFirst where {id, userId}` (+ `diseases: { include: { disease } }` 같이 로드) → 없으면 404.
  3. `formData()` 파싱 실패 시 400. `file instanceof File` && `image/*` && `≤ 4MB` 검증(아니면 400). (photos 상수 재사용.)
  4. `put(...)` Blob 업로드(공개 URL).
  5. 강아지 컨텍스트 조립(나이 = `birthdate`로 계산, 지병 = 한글명 배열).
  6. `analyzeFeedLabel(...)` 호출 → 실패 시 **502**(`{ error: "AI 분석에 실패했습니다." }`). *(업로드된 Blob은 이 경우 정리 — `del`로 롤백.)*
  7. `prisma.feedAnalysis.create(...)` → `{ data: analysis }` **201**.

### `app/api/dogs/[id]/feed-analyses/[analysisId]/route.ts`
- **DELETE** — 3단계 소유확인(`user.id` → dog `findFirst {id,userId}` → analysis `findFirst {id, dogId}`), 둘 중 하나라도 없으면 404. Blob `del(imageUrl)` 후 `delete`. 200 + message. 첫 인자 `_req`(미사용).

> ⚠️ AI 호출은 시간이 걸릴 수 있음 → POST 라우트에 `export const maxDuration = 60`(Vercel 함수 타임아웃 여유). 구현 시 확인.

## 6. 클라이언트

### `lib/types.ts`
`FeedAnalysis` 타입 추가(`nutrients`/`cautions`/`benefits`를 위 구조로 타이핑).

### `lib/queries.ts`
- `qk` 팩토리에 `feedAnalyses(dogId)` 키 추가.
- `useFeedAnalyses(dogId)` — `GET`.
- `useCreateFeedAnalysis(dogId)` — `axios.post`(multipart FormData), 성공 시 `qk.feedAnalyses(dogId)` invalidate.
- `useDeleteFeedAnalysis(dogId)` — `axios.delete`, 성공 시 동일 invalidate.
- (규칙: 클라는 react-query 훅으로만 접근, 직접 fetch 금지.)

### `components/dog-feed-analysis.tsx`
- 강아지 상세에 "사료 분석" 섹션.
- **업로드 영역**: 파일 선택 → "분석하기" → 분석 중 로딩 스피너(AI 호출 수 초 소요 안내).
- **이력 카드 리스트**: 각 카드에 성분표 썸네일 · 평점(별/배지) · 요약 · 주의성분 배지(빨강) · 장점(초록) · 삭제 버튼.
- 빈 상태: "아직 분석한 사료가 없어요" 안내.
- 디자인은 "하루" 시안 톤(스카이블루/코랄) 유지, 기존 `dog-photos.tsx`/`dog-medications.tsx`와 일관.

## 7. 테스트 — `tests/feed-analyses.test.ts`

기존 vitest 전략(라우트 핸들러 직접 import + `@/lib/api-auth`·`@/lib/prisma` `vi.mock`)을 따른다.
**AI 호출은 `@/lib/feed-analysis`를 `vi.mock`** 해서 외부 호출/비용 없이 라우트 로직만 검증.

커버리지:
- **인증**: 세션/Bearer 없으면 401.
- **소유 스코프**: 남의 강아지 id → 404(`findFirst where {id,userId}` 호출 단언). DELETE는 남의 analysis id → 404.
- **검증**: 파일 없음/이미지 아님/4MB 초과 → 각 400.
- **정상 흐름**: 검증된 dog.id로 Blob put 호출 → `analyzeFeedLabel` 호출 → `feedAnalysis.create`에 **dogId가 세션 검증된 dog.id**로 들어가는지(클라 입력 신뢰 X) 단언 → 201.
- **AI 실패**: `analyzeFeedLabel`가 throw하면 502 + Blob `del` 롤백 호출 단언.

기존 67개 + 신규(목표 ~6개) = 합산. PR 전 `npm test`.

## 8. 관통 원칙 (유지)
- 모든 엔드포인트는 세션 `user.id`로 스코프(`getUserId`, `where {userId}`). 남의 강아지/분석 접근 차단.
- 서버 상태는 react-query 훅으로만, 쓰기 후 `qk` invalidate.
- 버전·모델 슬러그는 추측 금지 — 구현 시 공식 문서/Gateway 카탈로그로 확정.
- 커밋 번호는 일반 숫자, Co-Authored-By 트레일러 금지.

## 9. 작업 순서(요약)
1. deps 추가(`ai`, `zod`) + `.env.example`에 `AI_GATEWAY_API_KEY`.
2. 스키마 `FeedAnalysis` + 마이그레이션 `add_feed_analysis`.
3. `lib/feed-analysis.ts`(AI 레이어).
4. API 라우트(POST/GET, DELETE).
5. types + queries 훅.
6. `dog-feed-analysis.tsx` + 강아지 상세 섹션 연결.
7. 테스트.
8. 로컬 런타임 검증(실제 성분표 사진으로 분석 왕복 + 콘솔 0) → PR `feat/ai-feed-analysis → develop`.
