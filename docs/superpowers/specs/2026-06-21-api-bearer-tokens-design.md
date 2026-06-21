# Bearer 토큰 인증 (개인 API 토큰) 설계

> 2026-06-21 · 브랜치 `feat/api-bearer-tokens`

## 목적
AGENTS.md 규칙("인증 API는 Bearer 토큰") 충족. 사용자가 **개인 API 토큰**을 발급받아 외부 스크립트/CLI에서 자기 데이터(`/api/dogs/*`)에 접근. 기존 세션 쿠키 인증과 **공존**.

## 결정 사항
- 기존 `/api/dogs/*` 라우트가 **세션 쿠키 OR Bearer 토큰** 둘 다 수용 (통합 auth 헬퍼). 라우트 경로 변경 없음.
- 토큰 저장: 새 `ApiToken` 모델, **sha256 해시**만 저장. 평문은 **생성 시 1회만** 노출.

## 데이터 모델
```prisma
model ApiToken {
  id String @id @default(cuid())
  userId String
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  name String
  tokenHash String @unique
  createdAt DateTime @default(now())
  lastUsedAt DateTime?
}
```
User에 `apiTokens ApiToken[]` 추가. 마이그레이션 `add_api_token`.

## 통합 인증 헬퍼 — `lib/api-auth.ts`
`getUserId(req): Promise<string | null>`
1. `Authorization: Bearer <token>` 있으면 → `sha256(token)` → `ApiToken.findUnique({ tokenHash })` → 있으면 `lastUsedAt` 갱신(await 안 해도 됨) 후 `userId` 반환.
2. 없으면 → `auth()` 세션 → `session.user.id`.
3. 둘 다 없으면 `null`.
- 토큰 생성: `crypto.randomBytes(32).toString("base64url")`, 표시는 `haru_<token>` 프리픽스. 해시는 prefix 제외 원문 기준 일관되게(생성·검증 동일 함수 `hashToken`).

## API
- **`/api/dogs/*` 전부**: `const session = await auth()` 블록 → `const userId = await getUserId(req)` + `if (!userId) 401`로 교체. (dogs, dogs/[id], records, records/[recordId], stats)
- **토큰 관리(세션 전용 — 토큰으로 토큰 관리 불가)**:
  - `POST /api/tokens` → `{ name }`(필수, 400) → 생성, `{ data: { id, name, token } }` (token=평문 1회).
  - `GET /api/tokens` → 목록(id, name, createdAt, lastUsedAt). **해시·평문 절대 미반환.**
  - `DELETE /api/tokens/[id]` → 소유확인 후 revoke(삭제), 200.

## react-query (`lib/queries.ts`)
- `qk.tokens`. `useApiTokens` / `useCreateApiToken`(성공 시 평문 반환) / `useRevokeApiToken`. 성공 시 `qk.tokens` invalidate.

## UI — 설정에 "API 토큰" 섹션 (`components/api-tokens-client.tsx`)
- 목록(이름·생성일·마지막 사용) + 각 항목 revoke(2단계 아님, 작은 삭제).
- "토큰 발급": 이름 입력 → 생성 → **평문 토큰 1회 노출**(복사 가능 박스 + "다시 볼 수 없어요" 경고).
- 설정 페이지(`/settings`)에 섹션 추가(보관함 링크 아래).

## 테스트
- `getUserId`: Bearer 유효→userId / 무효 토큰→null / 헤더 없으면 세션 폴백 / 세션도 없으면 null.
- tokens API: POST 평문 반환 + 해시 저장 단언 / 이름 없으면 400 / GET은 해시 미포함 / DELETE 소유 아니면 404.
- 기존 route 테스트: `@/lib/auth` 모킹 → **`@/lib/api-auth`의 `getUserId` 모킹**으로 전환(인증 해석이 헬퍼로 이동).

## 비목표 (YAGNI)
- 스코프/권한 세분화 없음(토큰=계정 전체 권한).
- 토큰 만료(TTL) 없음.
- 레이트리밋 없음.
