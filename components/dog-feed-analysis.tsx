"use client";

/* 사료 분석 — 성분표 사진 업로드 + AI 분석 결과 히스토리. 강아지 상세에 삽입.

   스타일 규칙(CLAUDE.md): 색은 반드시 디자인 토큰(text-primary / bg-destructive/10 …)으로.
   하드코딩한 hex는 다크모드 오버라이드를 따라가지 못한다. 컴포넌트 클래스
   (.caption/.body/.row) 위에 유틸리티를 얹어 덮어쓸 수 있다 — globals.css가
   @layer components 안에 있기 때문이다. */

import { useRef, useState } from "react";
import {
  useFeedAnalyses,
  useCreateFeedAnalysis,
  useDeleteFeedAnalysis,
} from "@/lib/queries";
import { Btn } from "./ui";

const MAX_BYTES = 4 * 1024 * 1024;

// 아이콘 버튼(삭제/확인/취소) 공통 — 배경·테두리 없는 12px 텍스트 버튼.
const iconBtn = "shrink-0 cursor-pointer border-0 bg-transparent text-xs disabled:opacity-50";

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
    // accept="image/*"가 1차로 거르지만 드래그앤드롭·OS의 "모든 파일"을 통과할 수 있다.
    if (!f.type.startsWith("image/")) {
      alert("이미지 파일만 올릴 수 있어요.");
      return;
    }
    if (f.size > MAX_BYTES) {
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
        <div className="row gap-2 flex-wrap">
          <input ref={fileRef} type="file" accept="image/*" hidden onChange={pick} />
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
              className="caption cursor-pointer border-0 bg-transparent text-accent"
            >
              취소
            </button>
          )}
        </div>
        {create.isPending && (
          <div className="caption mt-2 text-primary">
            AI가 성분표를 읽고 있어요. 몇 초 걸릴 수 있어요…
          </div>
        )}
      </div>

      {/* 분석 히스토리 */}
      {loading ? (
        <div className="caption">불러오는 중…</div>
      ) : analyses.length === 0 ? (
        <div className="card">
          <div className="caption py-2.5 text-center">
            아직 분석한 사료가 없어요. 성분표 사진을 올려보세요.
          </div>
        </div>
      ) : (
        <div className="stack gap-4">
          {analyses.map((a) => (
            <div key={a.id} className="card">
              {/* 썸네일 + 요약 헤더 */}
              <div className="row gap-3 mb-2 items-start">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={a.imageUrl}
                  alt="성분표"
                  className="h-18 w-18 shrink-0 rounded-[10px] object-cover"
                />
                <div className="min-w-0 flex-1">
                  <div className="row gap-2 mb-1">
                    <span className="shrink-0 rounded-full bg-primary px-2 py-0.5 text-xs font-semibold text-primary-fg">
                      {a.rating}/5
                    </span>
                  </div>
                  {/* 13px + 본문색 조합에 맞는 컴포넌트 클래스가 없다(.caption은 muted색) → 임의값 유지 */}
                  <div className="text-[13px]">{a.summary}</div>
                </div>

                {/* 삭제 — 2단계 확인 */}
                {confirmId === a.id ? (
                  <div className="row gap-1 shrink-0">
                    <button
                      onClick={() => {
                        remove.mutate(a.id);
                        setConfirmId(null);
                      }}
                      disabled={remove.isPending}
                      className={`${iconBtn} font-semibold text-accent`}
                    >
                      확인
                    </button>
                    <button onClick={() => setConfirmId(null)} className={`${iconBtn} text-muted-fg`}>
                      취소
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setConfirmId(a.id)}
                    disabled={remove.isPending}
                    className={`${iconBtn} text-muted-fg`}
                  >
                    삭제
                  </button>
                )}
              </div>

              {/* 주의 성분 */}
              {a.cautions.length > 0 && (
                <div className="mb-2">
                  <div className="caption mb-1 font-semibold text-destructive">⚠ 주의 성분</div>
                  <div className="stack gap-1">
                    {a.cautions.map((c, i) => (
                      <div
                        key={i}
                        className="rounded-lg border border-destructive/30 bg-destructive/10 px-2.5 py-1 text-xs text-destructive"
                      >
                        <strong>{c.ingredient}</strong> — {c.reason}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 이점 */}
              {a.benefits.length > 0 && (
                <div className="mb-2">
                  <div className="caption mb-1 font-semibold text-success">✓ 좋은 점</div>
                  <div className="flex flex-wrap gap-1.5">
                    {a.benefits.map((b, i) => (
                      <span
                        key={i}
                        className="rounded-full border border-success/30 bg-success/10 px-2.5 py-0.5 text-xs text-success"
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
                  <div className="caption mb-1 font-semibold">영양 성분</div>
                  <table className="w-full border-collapse text-xs">
                    <tbody>
                      {a.nutrients.map((n, i) => (
                        <tr key={i} className="border-b border-border">
                          <td className="w-1/2 py-[3px] font-semibold text-muted-fg">{n.label}</td>
                          <td className="py-[3px]">{n.value}</td>
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
