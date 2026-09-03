/* react-query 훅 대역. 컴포넌트는 lib/queries의 훅만 보므로 그 모양만 흉내내면 된다.
   실제 네트워크/쿼리키/invalidate는 API 회귀 테스트(*.test.ts)가 덮는다. */
import { vi } from "vitest";

// useQuery 반환 대역. 컴포넌트가 읽는 건 data/isPending뿐이라 캐스팅으로 나머지를 생략한다.
export function query<T>(data: T, over: Record<string, unknown> = {}) {
  return { data, isPending: false, isError: false, error: null, ...over } as never;
}

// useMutation 반환 대역. 호출마다 새 vi.fn()이라 테스트끼리 안 섞인다.
// as never를 여기서 붙이지 않는다 — 테스트가 mutate/mutateAsync를 단언해야 하므로
// 캐스팅은 mockReturnValue에 넣는 쪽에서 한다.
export function mutation(over: Record<string, unknown> = {}) {
  return {
    mutate: vi.fn(),
    mutateAsync: vi.fn().mockResolvedValue(undefined),
    isPending: false,
    isError: false,
    reset: vi.fn(),
    ...over,
  };
}

// mutateAsync가 거부하는 대역 (실패 경로용).
export function failingMutation(err = new Error("boom")) {
  return mutation({ mutateAsync: vi.fn().mockRejectedValue(err) });
}
