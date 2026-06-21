"use client";

/* 개인 API 토큰 관리 — 발급(평문 1회 노출)·목록·revoke. 설정 화면에 삽입된다. */

import { useState } from "react";
import {
  useApiTokens,
  useCreateApiToken,
  useRevokeApiToken,
} from "@/lib/queries";
import { Btn, Field, TextInput } from "./ui";

function fmtDateTime(iso: string): string {
  return new Date(iso).toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function ApiTokensClient() {
  const { data: tokens = [], isPending } = useApiTokens();
  const create = useCreateApiToken();
  const revoke = useRevokeApiToken();

  const [name, setName] = useState("");
  const [created, setCreated] = useState<string | null>(null); // 평문 토큰(1회 노출)
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setError(null);
    setCopied(false);
    try {
      const res = await create.mutateAsync(name.trim());
      setCreated(res.token);
      setName("");
    } catch {
      setError("토큰 발급에 실패했어요. 잠시 후 다시 시도해주세요.");
    }
  }

  async function copyToken() {
    if (!created) return;
    try {
      await navigator.clipboard.writeText(created);
      setCopied(true);
    } catch {
      /* 클립보드 권한 없으면 무시 — 사용자가 직접 복사 */
    }
  }

  return (
    <div className="card mb-6">
      <div className="title-md mb-1">API 토큰</div>
      <div className="caption mb-4">
        외부 스크립트에서 내 데이터에 접근할 때 쓰는 토큰이에요.{" "}
        <code>Authorization: Bearer &lt;토큰&gt;</code> 헤더로 보내세요.
      </div>

      {/* 방금 발급된 평문 토큰 — 1회만 노출 */}
      {created && (
        <div className="alert mb-4" role="status" style={{ wordBreak: "break-all" }}>
          <div className="caption" style={{ fontWeight: 600, marginBottom: 6 }}>
            발급된 토큰 (지금만 볼 수 있어요 — 안전한 곳에 저장하세요)
          </div>
          <code style={{ display: "block", marginBottom: 8 }}>{created}</code>
          <div className="row gap-2">
            <Btn size="sm" onClick={copyToken}>
              {copied ? "복사됨 ✓" : "복사"}
            </Btn>
            <Btn size="sm" variant="outline" onClick={() => setCreated(null)}>
              닫기
            </Btn>
          </div>
        </div>
      )}

      {error && (
        <div className="alert alert-error mb-4" role="alert">
          {error}
        </div>
      )}

      {/* 발급 폼 */}
      <form onSubmit={handleCreate} className="mb-4">
        <Field label="새 토큰 이름" htmlFor="tok-name">
          <TextInput
            id="tok-name"
            placeholder="예: 내 노트북 스크립트"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </Field>
        <Btn type="submit" block loading={create.isPending} loadingText="발급 중…">
          토큰 발급
        </Btn>
      </form>

      {/* 목록 */}
      {isPending ? (
        <div className="caption">불러오는 중…</div>
      ) : tokens.length === 0 ? (
        <div className="caption">아직 발급한 토큰이 없어요.</div>
      ) : (
        <div className="stack gap-2">
          {tokens.map((t) => (
            <div className="row between" key={t.id} style={{ alignItems: "center" }}>
              <div>
                <div className="body" style={{ fontWeight: 600 }}>
                  {t.name}
                </div>
                <div className="caption">
                  {fmtDateTime(t.createdAt)} 발급 ·{" "}
                  {t.lastUsedAt ? `${fmtDateTime(t.lastUsedAt)} 사용` : "사용 안 함"}
                </div>
              </div>
              <Btn
                size="sm"
                variant="destructive"
                loading={revoke.isPending && revoke.variables === t.id}
                onClick={() => revoke.mutate(t.id)}
              >
                삭제
              </Btn>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
