/* 라우트 핸들러 테스트용 공용 유틸. (모킹은 hoisting 때문에 각 테스트 파일에서 직접 vi.mock) */

// JSON 바디를 가진 Request. body에 문자열을 주면 그대로(잘못된 JSON 테스트용).
export function jsonReq(body: unknown, method = "POST"): Request {
  return new Request("http://test.local", {
    method,
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

// 동적 라우트 두 번째 인자: { params: Promise<...> }
export function ctx<T extends object>(p: T): { params: Promise<T> } {
  return { params: Promise.resolve(p) };
}

// 로그인된 세션 기본값.
export const SESSION = { user: { id: "user-1", email: "a@b.c", name: "테스터" } };
