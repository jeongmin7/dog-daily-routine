"use client";

/* 앱 전역 프로바이더.
   - 서버 상태: TanStack Query (lib/queries.ts의 훅들이 사용).
   - 클라 상태: zustand(lib/store.ts) — 서버 세션 유저를 한 번 시드한다.
   인증 가드/세션은 서버 레이아웃 auth() + NextAuth가 담당(여기선 표시용 유저만). */

import { useEffect, useState } from "react";
import {
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
import { useUserStore, type SessionUser } from "@/lib/store";

export function AppProvider({
  children,
  initialUser,
}: {
  children: React.ReactNode;
  initialUser: SessionUser | null;
}) {
  // QueryClient는 컴포넌트 생애 동안 단일 인스턴스로 유지.
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // 포커스마다 재요청하지 않음(과한 네트워크 방지). 1분간 fresh.
            refetchOnWindowFocus: false,
            staleTime: 60 * 1000,
          },
        },
      }),
  );

  // 서버 세션 유저를 zustand에 시드.
  // - 첫 렌더 시 동기 시드(하드 로드에서 인사말 깜빡임 방지).
  // - 로그인/로그아웃으로 세션이 바뀌면(router.refresh로 initialUser 갱신)
  //   effect가 다시 동기화(AppProvider는 재마운트되지 않으므로 effect 필요).
  useState(() => {
    if (initialUser) useUserStore.setState({ user: initialUser });
  });
  useEffect(() => {
    useUserStore.getState().setUser(initialUser);
  }, [initialUser?.email, initialUser?.name]);

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
