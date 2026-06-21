"use client";

/* 설정 화면 — 계정 정보 표시 + 회원 탈퇴(파괴적 동작이라 2단계 확인). */

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { Btn } from "./ui";
import { BackBar } from "./back-bar";
import { ApiTokensClient } from "./api-tokens-client";

export function SettingsClient({ name, email }: { name: string | null; email: string | null }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/account", { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error ?? "탈퇴 처리에 실패했어요.");
      }
      // 계정은 지워졌지만 JWT 세션이 브라우저에 남아있으니 반드시 로그아웃.
      await signOut({ callbackUrl: "/login" });
    } catch (e) {
      setError(e instanceof Error ? e.message : "알 수 없는 오류가 발생했어요.");
      setBusy(false);
    }
  }

  return (
    <div className="fade-in" style={{ maxWidth: 440, margin: "0 auto" }}>
      <BackBar onBack={() => router.push("/")} />
      <div className="h2">설정</div>
      <div className="caption mb-6" style={{ marginTop: 6 }}>
        계정 정보를 확인하고 관리할 수 있어요
      </div>

      {/* 계정 정보 */}
      <div className="card mb-6">
        <div className="title-md mb-4">계정 정보</div>
        <div className="stack gap-3">
          <div className="row between">
            <span className="caption">이름</span>
            <span className="body">{name || "—"}</span>
          </div>
          <div className="row between">
            <span className="caption">이메일</span>
            <span className="body">{email || "—"}</span>
          </div>
        </div>
      </div>

      {/* 보관함 진입 */}
      <div className="card mb-6 dog-card" onClick={() => router.push("/archive")}>
        <div className="row between">
          <div>
            <div className="title-md">보관함</div>
            <div className="caption" style={{ marginTop: 2 }}>
              보관한 강아지를 보고 복원할 수 있어요
            </div>
          </div>
          <svg width="8" height="14" viewBox="0 0 8 14" style={{ flexShrink: 0 }}>
            <path d="M1 1l6 6-6 6" stroke="var(--muted-fg)" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </div>

      {/* 개인 API 토큰 */}
      <ApiTokensClient />

      {/* 위험 구역 — 회원 탈퇴 */}
      <div className="card">
        <div className="title-md mb-1 text-destructive">회원 탈퇴</div>
        <div className="caption mb-4">
          탈퇴하면 계정과 등록한 모든 강아지·기록이 영구 삭제돼요. 이 동작은 되돌릴 수 없어요.
        </div>

        {error && (
          <div className="alert alert-error mb-4" role="alert">
            {error}
          </div>
        )}

        {!confirming ? (
          <Btn variant="destructive" block onClick={() => setConfirming(true)}>
            회원 탈퇴하기
          </Btn>
        ) : (
          <div className="stack gap-3">
            <div className="body" style={{ fontWeight: 600 }}>
              정말 탈퇴하시겠어요?
            </div>
            <div className="row gap-2">
              <Btn variant="outline" block disabled={busy} onClick={() => setConfirming(false)}>
                취소
              </Btn>
              <Btn variant="destructive" block loading={busy} loadingText="탈퇴 중…" onClick={handleDelete}>
                탈퇴 확정
              </Btn>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
