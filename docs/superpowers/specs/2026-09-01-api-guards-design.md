# API 라우트 가드·검증 일원화 설계

2026-09-01 · 브랜치 `refactor/api-guards`

## 목적

라우트 21개 중 16개가 같은 서두를 **문자 그대로 복사**하고 있었다. 인증 → 401,
소유 확인 → 404, `try/catch` → 500, body 파싱 → 400. 소유 확인만 23곳에 흩어져 있었다.

기능 추가가 아니라 **이미 있는 중복을 걷어내는** 작업이다. 동작은 유지하되
일관성 구멍(아래)을 같이 메운다.

## 발견된 결함

리팩터 전 코드에서 실제로 확인한 것들.

| 결함 | 위치 | 영향 |
|---|---|---|
| `catch {}` 가 에러 객체를 안 받음 | 17개 라우트 전부 | 장애 원인이 통째로 소실. 서버 로그에 아무것도 안 남는다 |
| `try/catch` 자체가 없음 | `signup`, `diseases`, `tokens/[id]` | 예외 시 body 없는 500. AGENTS.md의 "에러도 JSON" 규칙 위반 |
| 소유 확인이 `try` 밖 | `stats` | 그 조회가 실패하면 JSON 없는 500 |
| 401/404 메시지 불일치 | 전역 | `"Unauthorized"` vs `"인증이 필요합니다."`, `"Dog not found"` vs `"해당 강아지를 찾을 수 없습니다."` |
| 검증 순서 불일치 | `dogs/[id]` PATCH | 이 라우트만 body 검증이 소유 확인보다 먼저였다 |

`catch {}` 는 이번 작업 당일 실제로 대가를 치렀다. 로컬 `.env` 부재로 signup이
500을 뱉었는데, **signup에 catch가 없어서** Prisma 스택이 그대로 올라와 원인
(`Environment variable not found: DATABASE_URL`)을 즉시 특정할 수 있었다.
catch가 있었다면 "회원가입 처리 중 오류"만 보고 헤맸을 것이다.

## 결정 사항

### 1. 고차함수 래퍼가 아니라 명시적 헬퍼 + early return

```ts
const ctx = await requireDog(req, id);
if (ctx.error) return ctx.error;
// 여기서부터 ctx.dog / ctx.userId 사용 (타입이 좁혀진다)
```

`withDog(handler)` 형태로 감싸는 안도 검토했으나 채택하지 않았다. 라우트가 Next의
표준 시그니처(`(req, { params })`)를 그대로 유지해야 읽는 사람이 한 단계 덜 헤맨다.
줄 수는 래퍼가 더 짧지만, 간접성의 대가가 이득보다 크다고 판단했다.

이 형태는 새로 들이민 것이 아니다. `medications/[medId]/doses/route.ts` 에 이미
`ownedMed()` 라는 **로컬 헬퍼가 같은 모양으로 존재했다** — 3단계 확인 후
`{med}` 또는 `{error}` 를 반환. 코드가 스스로 도달한 형태가 한 파일에 갇혀 있던 것을
꺼내 공용화했다.

타입은 판별 유니온으로 좁힌다:

```ts
type Guard<T> = { error: NextResponse } | (T & { error?: undefined });
```

`error?: undefined` 를 붙여야 `if (ctx.error)` 뒤에서 `T` 로 좁혀진다.

### 2. 가드는 스스로 500을 만든다

라우트가 `try` **밖**에서 가드를 호출하므로, 가드 내부의 DB 조회가 터지면 JSON
없는 500이 나간다(리팩터 전 `stats`의 결함과 같은 형태). `requireUser`·
`requireDog`·`requireSessionUser` 가 각자 `try/catch` 를 갖고 `serverError()` 를
돌려준다.

### 3. 세션 전용 가드를 이름으로 분리

`requireSessionUser()` 는 Bearer를 받지 않는다. 토큰으로 토큰을 발급·삭제할 수
있으면 탈취된 토큰이 스스로를 갱신하는 **권한 상승**이 된다. 이름에 `Session`이
박혀 있어 호출부에서 의도가 읽힌다. 대상: `tokens`, `tokens/[id]`, `account`.

### 4. 검증은 zod로 통일 (`lib/schemas.ts`)

zod는 이미 의존성에 있었다(`lib/feed-analysis.ts` 가 LLM 구조화 출력에 사용).
라우트 body 검증까지 같은 도구로 모은다.

**zod object가 스키마에 없는 키를 잘라내는 것이 mass assignment 방어선이 된다.**
손으로 짠 화이트리스트(구조 분해)에서 스키마로 방어가 이전되므로, 파싱 결과를
`...parsed.data` 로 Prisma에 그대로 넘겨도 안전하다. zod 4.4.3에서 실측 확인:

```
{name:"보리", userId:"남의것"}  →  {name:"보리"}
```

필수 필드는 `z.string({ error: "..." })` 처럼 **타입 단계 메시지**를 붙였다.
`.min(1, msg)` 만 두면 키가 아예 없을 때 영어 기본 메시지가 나간다.

multipart를 받는 `photos`·`feed-analyses` 는 zod를 쓰지 않는다. `File` 인스턴스
검증(타입·크기)은 선언적으로 표현할 게 없어 명령형이 더 짧다.

### 5. 에러는 `serverError(e, msg)` 한 줄로

```ts
} catch (e) {
  return serverError(e, "약 정보를 불러오는 중 오류가 발생했습니다.");
}
```

`console.error` 로 원인을 서버 로그에 남기고, 응답에는 담지 않는다(내부 구조 노출
방지). `catch` 블록 자체는 라우트에 남긴다 — 제어 흐름이 눈에 보이고 도메인별
메시지가 유지된다.

## 동작 변경 (의도된 것)

- **`PATCH /api/dogs/[id]`** — 소유 확인이 body 검증보다 **먼저**가 됐다.
  남의 강아지에 잘못된 body를 보내면 400이 아니라 404다. 다른 라우트와 순서를
  맞췄고, 권한 없는 요청에 검증 작업을 해주지 않는 쪽이 안전하다.
- **401/404 메시지가 한글로 통일**됐다(`"Unauthorized"` → `"인증이 필요합니다."`).
  클라이언트는 status code로 분기하므로 영향 없다.
- **`feed-analyses` POST가 지병을 별도 조회**한다. 기존에는 `dog.include` 로 함께
  가져왔으나, `requireDog` 이 평범한 `Dog` 를 돌려주므로 `dogDisease.findMany` 를
  따로 호출한다. 쿼리 1회 추가지만 뒤이어 LLM을 호출하는 엔드포인트라 무시할 수준이다.

## 검증

- 기존 테스트 85개 유지 + `tests/api-guard.test.ts` 13개 추가 = **98개 통과**
- **뮤테이션 테스트**: `requireDog` 에서 소유 스코프(`userId`)를 제거하면 테스트 4개가
  실패 → 안전망이 실제로 회귀를 잡는다
- 기존 mass-assignment 테스트가 zod 전환 후에도 그대로 통과 → 방어선이 정확히 이전됨
- `tsc --noEmit` · `lint` · `build` 통과
- **런타임 실측**(로컬 dev + Bearer 토큰): 인증 없는 8개 경로가 전부 JSON 401,
  소유 위반이 전부 404, 주입 시도(`userId`/`dogId`/`id`)가 전부 무력화, 검증 메시지 확인

## 비목표 (YAGNI)

- **서비스 레이어를 만들지 않았다.** 라우트가 얇아진 지금 한 겹 더 두면 파일만 늘고
  테스트를 전부 다시 써야 한다. MVP 4(NestJS 분리)를 실제로 착수할 때 판단한다.
- **`withDog` 같은 고차함수 래퍼를 쓰지 않았다.** 위 1번 참고.
- **프론트엔드는 손대지 않았다.** `lib/queries.ts` 의 훅 30개는 같은 *모양*이지만
  각각 다른 엔드포인트·쿼리키를 다뤄 중복이 아니다. 게다가 컴포넌트 테스트가 0개라
  안전망 없이 리팩터하게 된다. 별도 브랜치에서 **테스트를 먼저 깔고** 진행한다.
