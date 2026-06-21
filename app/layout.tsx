import type { Metadata } from "next";
import "./globals.css";
import { AppProvider } from "./providers";
import { auth } from "@/lib/auth";

export const metadata: Metadata = {
  title: "하루 — 우리 아이의 하루",
  description: "강아지 보호자를 위한 일일 건강 트래커",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();
  return (
    <html lang="ko">
      <head>
        {/* 하루 시안 폰트: Pretendard(한글) + Inter(영문) */}
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable.min.css"
        />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        {/* 하루 시안 폰트는 CDN으로 전역 로드(next/font 미사용은 의도). */}
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        {/* 모바일 우선: 데스크톱에서 회색 페이지 위 중앙 정렬 흰 앱 컬럼 */}
        <div className="app-column">
          <AppProvider initialUser={session?.user ?? null}>
            {children}
          </AppProvider>
        </div>
      </body>
    </html>
  );
}
