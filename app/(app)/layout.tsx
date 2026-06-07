import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { Header } from "@/components/header";

// 서버 컴포넌트: 매 요청마다 NextAuth 세션을 확인하는 진짜 가드.
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session) redirect("/login");

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100dvh" }}>
      <Header />
      <main className="container py-8" style={{ flex: 1 }}>
        {children}
      </main>
    </div>
  );
}
