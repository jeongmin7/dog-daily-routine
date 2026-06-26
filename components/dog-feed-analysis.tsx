"use client";

/* 사료 분석 — 성분표 사진 업로드 + AI 분석 결과 히스토리. 강아지 상세에 삽입. */

import { useRef, useState } from "react";
import {
  useFeedAnalyses,
  useCreateFeedAnalysis,
  useDeleteFeedAnalysis,
} from "@/lib/queries";
import { Btn } from "./ui";

export default function DogFeedAnalysis({ dogId }: { dogId: string }) {
  const { data: analyses = [], isPending: loading } = useFeedAnalyses(dogId);
  const create = useCreateFeedAnalysis(dogId);
  const remove = useDeleteFeedAnalysis(dogId);

  const fileRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  function pick(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null;
    e.target.value = "";
    if (!f) return;
    if (!f.type.startsWith("image/")) {
      alert("이미지 파일만 올릴 수 있어요.");
      return;
    }
    if (f.size > 4 * 1024 * 1024) {
      alert("이미지는 4MB 이하만 가능해요.");
      return;
    }
    setFile(f);
  }

  async function onAnalyze() {
    if (!file) return;
    try {
      await create.mutateAsync(file);
      setFile(null);
    } catch {
      alert("AI 분석에 실패했습니다. 잠시 후 다시 시도해주세요.");
    }
  }

  return (
    <div>
      <div className="row between mb-4">
        <div className="title-lg">사료 분석</div>
      </div>

      {/* 파일 선택 + 분석 버튼 */}
      <div className="card mb-4">
        <div className="row gap-2" style={{ flexWrap: "wrap", alignItems: "center" }}>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            hidden
            onChange={pick}
          />
          <Btn
            size="sm"
            variant="outline"
            onClick={() => fileRef.current?.click()}
            disabled={create.isPending}
          >
            {file ? file.name : "성분표 사진 선택"}
          </Btn>
          <Btn
            size="sm"
            onClick={onAnalyze}
            disabled={!file || create.isPending}
            loading={create.isPending}
            loadingText="분석 중…"
          >
            분석하기
          </Btn>
          {file && !create.isPending && (
            <button
              onClick={() => setFile(null)}
              className="caption"
              style={{ color: "#FF7A6E", background: "none", border: "none", cursor: "pointer" }}
            >
              취소
            </button>
          )}
        </div>
        {create.isPending && (
          <div className="caption" style={{ marginTop: 8, color: "#2E92D6" }}>
            AI가 성분표를 읽고 있어요. 몇 초 걸릴 수 있어요…
          </div>
        )}
      </div>

      {/* 분석 히스토리 */}
      {loading ? (
        <div className="caption">불러오는 중…</div>
      ) : analyses.length === 0 ? (
        <div className="card">
          <div className="caption" style={{ textAlign: "center", padding: "10px 0" }}>
            아직 분석한 사료가 없어요. 성분표 사진을 올려보세요.
          </div>
        </div>
      ) : (
        <div className="stack gap-4">
          {analyses.map((a) => (
            <div key={a.id} className="card" style={{ padding: 16 }}>
              {/* 썸네일 + 요약 헤더 */}
              <div className="row gap-3" style={{ alignItems: "flex-start", marginBottom: 8 }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={a.imageUrl}
                  alt="성분표"
                  style={{
                    width: 72,
                    height: 72,
                    objectFit: "cover",
                    borderRadius: 10,
                    flexShrink: 0,
                  }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="row gap-2" style={{ marginBottom: 4 }}>
                    <span
                      style={{
                        background: "#2E92D6",
                        color: "#fff",
                        borderRadius: 999,
                        padding: "2px 8px",
                        fontSize: 12,
                        fontWeight: 600,
                        flexShrink: 0,
                      }}
                    >
                      {a.rating}/5
                    </span>
                  </div>
                  <div className="body" style={{ fontSize: 13 }}>
                    {a.summary}
                  </div>
                </div>

                {/* 삭제 버튼 */}
                {confirmId === a.id ? (
                  <div className="row gap-1" style={{ flexShrink: 0 }}>
                    <button
                      onClick={() => {
                        remove.mutate(a.id);
                        setConfirmId(null);
                      }}
                      disabled={remove.isPending}
                      style={{
                        fontSize: 12,
                        color: "#FF7A6E",
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        fontWeight: 600,
                      }}
                    >
                      확인
                    </button>
                    <button
                      onClick={() => setConfirmId(null)}
                      style={{
                        fontSize: 12,
                        color: "#888",
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                      }}
                    >
                      취소
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setConfirmId(a.id)}
                    disabled={remove.isPending}
                    style={{
                      fontSize: 12,
                      color: "#aaa",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      flexShrink: 0,
                    }}
                  >
                    삭제
                  </button>
                )}
              </div>

              {/* 주의 성분 */}
              {a.cautions.length > 0 && (
                <div style={{ marginBottom: 8 }}>
                  <div className="caption" style={{ marginBottom: 4, fontWeight: 600, color: "#b91c1c" }}>
                    ⚠ 주의 성분
                  </div>
                  <div className="stack gap-1">
                    {a.cautions.map((c, i) => (
                      <div
                        key={i}
                        style={{
                          background: "#fef2f2",
                          border: "1px solid #fecaca",
                          borderRadius: 8,
                          padding: "4px 10px",
                          fontSize: 12,
                          color: "#b91c1c",
                        }}
                      >
                        <strong>{c.ingredient}</strong> — {c.reason}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 이점 */}
              {a.benefits.length > 0 && (
                <div style={{ marginBottom: 8 }}>
                  <div className="caption" style={{ marginBottom: 4, fontWeight: 600, color: "#15803d" }}>
                    ✓ 좋은 점
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {a.benefits.map((b, i) => (
                      <span
                        key={i}
                        style={{
                          background: "#f0fdf4",
                          border: "1px solid #bbf7d0",
                          borderRadius: 999,
                          padding: "2px 10px",
                          fontSize: 12,
                          color: "#15803d",
                        }}
                      >
                        {b}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* 영양 성분 표 */}
              {a.nutrients.length > 0 && (
                <div>
                  <div className="caption" style={{ marginBottom: 4, fontWeight: 600 }}>
                    영양 성분
                  </div>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                    <tbody>
                      {a.nutrients.map((n, i) => (
                        <tr key={i} style={{ borderBottom: "1px solid #f0f0f0" }}>
                          <td style={{ padding: "3px 0", fontWeight: 600, color: "#555", width: "50%" }}>
                            {n.label}
                          </td>
                          <td style={{ padding: "3px 0", color: "#333" }}>{n.value}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
