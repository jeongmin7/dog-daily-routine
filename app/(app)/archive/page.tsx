"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useArchivedDogs, useDeleteDog, useSetDogArchived } from "@/lib/queries";
import type { Dog } from "@/lib/types";
import { Btn } from "@/components/ui";
import { BackBar } from "@/components/back-bar";
import { DogAvatar } from "@/components/brand";
import { ageString } from "@/lib/format";

export default function ArchivePage() {
  const router = useRouter();
  const { data: dogs = [], isPending } = useArchivedDogs();

  return (
    <div className="fade-in stack gap-6">
      <div>
        <BackBar onBack={() => router.push("/settings")} />
        <div className="h2">보관함</div>
        <div className="caption" style={{ marginTop: 6 }}>
          보관한 강아지예요. 복원하면 다시 목록에 나타나요.
        </div>
      </div>

      {isPending ? (
        <div className="caption">불러오는 중…</div>
      ) : dogs.length === 0 ? (
        <div className="empty-box">
          <div className="empty-emoji">📦</div>
          <div className="title-lg">보관한 강아지가 없어요</div>
          <div className="caption" style={{ maxWidth: 240 }}>
            강아지 상세 화면에서 보관하면 여기로 들어와요.
          </div>
        </div>
      ) : (
        <div className="stack gap-3">
          {dogs.map((dog) => (
            <ArchivedDogCard key={dog.id} dog={dog} />
          ))}
        </div>
      )}
    </div>
  );
}

function ArchivedDogCard({ dog }: { dog: Dog }) {
  const restore = useSetDogArchived();
  const remove = useDeleteDog();
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const busy = restore.isPending || remove.isPending;

  const meta = [dog.breed, ageString(dog.birthdate)].filter(Boolean).join(" · ");

  async function handleRestore() {
    setError(null);
    try {
      await restore.mutateAsync({ id: dog.id, archived: false });
    } catch {
      setError("복원에 실패했어요. 잠시 후 다시 시도해주세요.");
    }
  }

  async function handleDelete() {
    setError(null);
    try {
      await remove.mutateAsync(dog.id);
      // 성공 시 목록 쿼리 무효화로 카드가 사라짐.
    } catch {
      setError("삭제에 실패했어요. 잠시 후 다시 시도해주세요.");
    }
  }

  return (
    <div className="card">
      <div className="row gap-3" style={{ marginBottom: 12 }}>
        <DogAvatar size={48} />
        <div className="grow">
          <div className="title-md">{dog.name}</div>
          <div className="caption">{meta || "기본 정보 없음"}</div>
        </div>
      </div>

      {error && (
        <div className="alert alert-error mb-4" role="alert">
          {error}
        </div>
      )}

      {!confirming ? (
        <div className="row gap-2">
          <Btn block loading={restore.isPending} loadingText="복원 중…" disabled={busy} onClick={handleRestore}>
            복원
          </Btn>
          <Btn variant="destructive" block disabled={busy} onClick={() => setConfirming(true)}>
            영구 삭제
          </Btn>
        </div>
      ) : (
        <div className="stack gap-3">
          <div className="body" style={{ fontWeight: 600 }}>
            정말 {dog.name}을(를) 영구 삭제할까요? 모든 기록이 함께 삭제되고 되돌릴 수 없어요.
          </div>
          <div className="row gap-2">
            <Btn variant="outline" block disabled={busy} onClick={() => setConfirming(false)}>
              취소
            </Btn>
            <Btn variant="destructive" block loading={remove.isPending} loadingText="삭제 중…" onClick={handleDelete}>
              삭제 확정
            </Btn>
          </div>
        </div>
      )}
    </div>
  );
}
