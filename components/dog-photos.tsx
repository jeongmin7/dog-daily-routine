"use client";

/* 강아지 사진 일지 — 썸네일 그리드 + 업로드(미리보기+캡션) + 삭제. 강아지 상세에 삽입. */

import { useRef, useState } from "react";
import { useDeletePhoto, usePhotos, useUploadPhoto } from "@/lib/queries";
import { Btn, TextInput } from "./ui";

export function DogPhotos({ dogId }: { dogId: string }) {
  const { data: photos = [], isPending } = usePhotos(dogId);
  const upload = useUploadPhoto(dogId);
  const remove = useDeletePhoto(dogId);

  const fileRef = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState<File | null>(null); // 선택했지만 아직 업로드 전
  const [caption, setCaption] = useState("");
  const [error, setError] = useState<string | null>(null);

  const previewUrl = pending ? URL.createObjectURL(pending) : null;

  function pick(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    e.target.value = ""; // 같은 파일 다시 고를 수 있게 초기화
    if (!f) return;
    setError(null);
    if (!f.type.startsWith("image/")) {
      setError("이미지 파일만 올릴 수 있어요.");
      return;
    }
    if (f.size > 4 * 1024 * 1024) {
      setError("이미지는 4MB 이하만 가능해요.");
      return;
    }
    setPending(f);
  }

  function cancel() {
    setPending(null);
    setCaption("");
  }

  async function submit() {
    if (!pending) return;
    setError(null);
    const form = new FormData();
    form.append("file", pending);
    if (caption.trim()) form.append("caption", caption.trim());
    try {
      await upload.mutateAsync(form);
      cancel();
    } catch {
      setError("업로드에 실패했어요. 잠시 후 다시 시도해주세요.");
    }
  }

  return (
    <div>
      <div className="row between mb-4">
        <div className="title-lg">사진 일지</div>
        {!pending && (
          <Btn size="sm" variant="outline" onClick={() => fileRef.current?.click()}>
            + 사진 추가
          </Btn>
        )}
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        hidden
        onChange={pick}
      />

      {error && (
        <div className="alert alert-error mb-4" role="alert">
          {error}
        </div>
      )}

      {/* 업로드 준비(미리보기 + 캡션) */}
      {pending && previewUrl && (
        <div className="card mb-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={previewUrl}
            alt="미리보기"
            style={{ width: "100%", borderRadius: 12, marginBottom: 12, maxHeight: 280, objectFit: "cover" }}
          />
          <TextInput
            placeholder="캡션 (선택)"
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
          />
          <div className="row gap-2" style={{ marginTop: 12 }}>
            <Btn variant="outline" block disabled={upload.isPending} onClick={cancel}>
              취소
            </Btn>
            <Btn block loading={upload.isPending} loadingText="업로드 중…" onClick={submit}>
              업로드
            </Btn>
          </div>
        </div>
      )}

      {/* 갤러리 */}
      {isPending ? (
        <div className="caption">불러오는 중…</div>
      ) : photos.length === 0 ? (
        !pending && (
          <div className="card">
            <div className="caption" style={{ textAlign: "center", padding: "10px 0" }}>
              아직 사진이 없어요. 우리 아이의 순간을 남겨보세요 📷
            </div>
          </div>
        )
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, 1fr)",
            gap: 10,
          }}
        >
          {photos.map((p) => (
            <div key={p.id} style={{ position: "relative" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={p.url}
                alt={p.caption ?? "강아지 사진"}
                style={{ width: "100%", aspectRatio: "1 / 1", objectFit: "cover", borderRadius: 12, display: "block" }}
              />
              {p.caption && (
                <div className="caption" style={{ marginTop: 4 }}>
                  {p.caption}
                </div>
              )}
              <button
                aria-label="사진 삭제"
                onClick={() => remove.mutate(p.id)}
                disabled={remove.isPending}
                style={{
                  position: "absolute",
                  top: 6,
                  right: 6,
                  width: 28,
                  height: 28,
                  borderRadius: "50%",
                  border: "none",
                  background: "rgba(0,0,0,0.55)",
                  color: "#fff",
                  cursor: "pointer",
                  lineHeight: 1,
                }}
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
