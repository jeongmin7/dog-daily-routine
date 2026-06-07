"use client";

/* 56px 공통 헤더 — 좌: 브랜드 락업(대시보드로), 우: 로그아웃. */

import { useRouter } from "next/navigation";
import { useApp } from "@/app/providers";
import { BrandLogo } from "./brand";
import { Btn } from "./ui";

export function Header() {
  const router = useRouter();
  const { logout } = useApp();

  function handleLogout() {
    logout();
    router.replace("/login");
  }

  return (
    <header className="app-header">
      <div onClick={() => router.push("/")} style={{ cursor: "pointer" }}>
        <BrandLogo size="sm" />
      </div>
      <Btn variant="ghost" size="sm" onClick={handleLogout}>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
          <LogoutIcon />
          <span className="caption" style={{ color: "inherit" }}>
            로그아웃
          </span>
        </span>
      </Btn>
    </header>
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
