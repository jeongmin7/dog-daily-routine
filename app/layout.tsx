import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "DogHealth Tracker",
  description: "강아지 건강 상태에 따라 진화하는 적응형 헬스 트래커",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ko"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      {/* 데스크탑: 중앙 정렬된 회색 배경 / 모바일: 앱이 화면을 꽉 채움 */}
      <body className="min-h-dvh bg-zinc-100 dark:bg-zinc-950">
        {/* 모바일 폭(max-w-md ≈ 448px) 앱 컨테이너 */}
        <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col bg-white shadow-sm dark:bg-black">
          {children}
        </div>
      </body>
    </html>
  );
}
