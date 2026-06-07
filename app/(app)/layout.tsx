"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/app/providers";
import { Header } from "@/components/header";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { authed, authReady } = useApp();
  const router = useRouter();

  useEffect(() => {
    if (authReady && !authed) router.replace("/login");
  }, [authReady, authed, router]);

  // 인증 확인 전 / 미인증이면 화면 비움 (리다이렉트 대기)
  if (!authReady || !authed) return null;

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100dvh" }}>
      <Header />
      <main className="container py-8" style={{ flex: 1 }}>
        {children}
      </main>
    </div>
  );
}
