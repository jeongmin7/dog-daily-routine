"use client";

/* 56px 공통 헤더 — 좌: 브랜드 락업(대시보드로), 우: 로그아웃. */

import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { BrandLogo } from "./brand";
import { Btn } from "./ui";

export function Header() {
  const router = useRouter();

  function handleLogout() {
    // NextAuth 세션 종료 후 로그인 화면으로
    signOut({ callbackUrl: "/login" });
  }

  return (
    <header className="app-header">
      <div onClick={() => router.push("/")} style={{ cursor: "pointer" }}>
        <BrandLogo size="sm" />
      </div>
      <div style={{ display: "inline-flex", alignItems: "center", gap: 2 }}>
        <Btn variant="ghost" size="sm" onClick={() => router.push("/settings")} aria-label="설정">
          <SettingsIcon />
        </Btn>
        <Btn variant="ghost" size="sm" onClick={handleLogout}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
            <LogoutIcon />
            <span className="caption" style={{ color: "inherit" }}>
              로그아웃
            </span>
          </span>
        </Btn>
      </div>
    </header>
  );
}

function SettingsIcon() {
  return (
    <svg
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}

function LogoutIcon() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <path d="M16 17l5-5-5-5" />
      <path d="M21 12H9" />
    </svg>
  );
}
