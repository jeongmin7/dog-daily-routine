"use client";

/* 앱 전역 상태: mock 스토어 + 인증.
   ⚠️ 임시 — 백엔드 연결 시 이 컨텍스트의 액션들을 실제 API/세션으로 교체. */

type SessionUser = {
  name?: string | null;
  email?: string | null;
};

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import type { Dog, DogRecord, RecordInput, Store } from "@/lib/types";
import { buildSeed, loadStore, saveStore, uid } from "@/lib/mock-store";

type AppContextValue = {
  store: Store;
  authed: boolean;
  authReady: boolean;
  login: (email: string) => void;
  logout: () => void;
  addDog: (dog: Omit<Dog, "id">) => Dog;
  addRecord: (dogId: string, rec: RecordInput) => void;
  updateRecord: (id: string, rec: RecordInput) => void;
  deleteRecord: (id: string) => void;
  resetData: () => void;
};

const AppContext = createContext<AppContextValue | null>(null);

const AUTH_KEY = "haru.auth";

function withSessionUser(s: Store, u: SessionUser | null): Store {
  if (!u) return s;
  return {
    ...s,
    user: {
      ...s.user,
      name: u.name ?? s.user.name,
      email: u.email ?? s.user.email,
    },
  };
}
export function AppProvider({
  children,
  initialUser,
}: {
  children: React.ReactNode;
  initialUser: SessionUser | null;
}) {
  const [store, setStore] = useState<Store>(() => withSessionUser(buildSeed(), initialUser));
  const [hydrated, setHydrated] = useState(false);
  const [authed, setAuthed] = useState(false);
  const [authReady, setAuthReady] = useState(false);

  // 마운트 시 localStorage에서 로드 (SSR 불일치 방지)
  useEffect(() => {
    setStore(withSessionUser(loadStore(), initialUser));
    setHydrated(true);
    try {
      setAuthed(sessionStorage.getItem(AUTH_KEY) === "1");
    } catch {
      /* ignore */
    }
    setAuthReady(true);
  }, []);

  // 변경 시 영속화
  useEffect(() => {
    if (hydrated) saveStore(store);
  }, [store, hydrated]);

  const login = useCallback((email: string) => {
    setStore((s) => ({ ...s, user: { ...s.user, email } }));
    try {
      sessionStorage.setItem(AUTH_KEY, "1");
    } catch {
      /* ignore */
    }
    setAuthed(true);
  }, []);

  const logout = useCallback(() => {
    try {
      sessionStorage.removeItem(AUTH_KEY);
    } catch {
      /* ignore */
    }
    setAuthed(false);
  }, []);

  const addDog = useCallback((dog: Omit<Dog, "id">) => {
    const created: Dog = { id: uid(), ...dog };
    setStore((s) => ({ ...s, dogs: [...s.dogs, created] }));
    return created;
  }, []);

  const addRecord = useCallback((dogId: string, rec: RecordInput) => {
    setStore((s) => ({
      ...s,
      records: [...s.records, { id: uid(), dogId, ...rec } as DogRecord],
    }));
  }, []);

  const updateRecord = useCallback((id: string, rec: RecordInput) => {
    setStore((s) => ({
      ...s,
      records: s.records.map((r) =>
        r.id === id ? { ...r, ...rec, id, dogId: r.dogId } : r,
      ),
    }));
  }, []);

  const deleteRecord = useCallback((id: string) => {
    setStore((s) => ({ ...s, records: s.records.filter((r) => r.id !== id) }));
  }, []);

  const resetData = useCallback(() => {
    setStore(buildSeed());
  }, []);

  return (
    <AppContext.Provider
      value={{
        store,
        authed,
        authReady,
        login,
        logout,
        addDog,
        addRecord,
        updateRecord,
        deleteRecord,
        resetData,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within <AppProvider>");
  return ctx;
}
