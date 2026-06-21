/* 클라 전역 UI 상태 (zustand).
   서버 상태(dogs·records·stats)는 react-query가 담당하고,
   여기엔 서버 세션에서 시드한 "표시용 유저"만 둔다 (대시보드 인사말 등). */

import { create } from "zustand";

export type SessionUser = {
  name?: string | null;
  email?: string | null;
};

type UserState = {
  user: SessionUser | null;
  setUser: (user: SessionUser | null) => void;
};

export const useUserStore = create<UserState>((set) => ({
  user: null,
  setUser: (user) => set({ user }),
}));
