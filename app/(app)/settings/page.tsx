import { auth } from "@/lib/auth";
import { SettingsClient } from "@/components/settings-client";

// 서버 컴포넌트: 계정 정보는 세션이 진실의 원천 → 여기서 꺼내 클라에 내려준다.
export default async function SettingsPage() {
  const session = await auth();

  return (
    <SettingsClient
      name={session?.user?.name ?? null}
      email={session?.user?.email ?? null}
    />
  );
}
