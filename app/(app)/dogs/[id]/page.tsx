"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { useDog, useDogStats, useRecords, useSetDogArchived } from "@/lib/queries";
import { Btn } from "@/components/ui";
import { BackBar } from "@/components/back-bar";
import { DogAvatar } from "@/components/brand";
import { RecordCard } from "@/components/record-card";
import { WeeklyStats } from "@/components/stat-chart";
import { DogPhotos } from "@/components/dog-photos";
import { DogMedications } from "@/components/dog-medications";
import { ageString, hasVal } from "@/lib/format";

export default function DogDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { data: dog, isPending: dogPending } = useDog(id);
  const { data: records = [] } = useRecords(id);
  // 주간 통계는 클라 계산 대신 서버 집계(GET /api/dogs/[id]/stats)에서 받는다.
  const { data: stats } = useDogStats(id);
  const archiveDog = useSetDogArchived();
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const busy = archiveDog.isPending;

  // 로딩 중에는 "찾을 수 없어요"를 깜빡 띄우지 않도록 대기.
  if (dogPending) {
    return (
      <div className="full-center" style={{ minHeight: 300 }}>
        <div className="caption">불러오는 중…</div>
      </div>
    );
  }

  if (!dog) {
    return (
      <div className="full-center" style={{ minHeight: 300 }}>
        <div className="title-lg mb-2">찾을 수 없어요</div>
        <Btn variant="outline" size="sm" onClick={() => router.push("/")}>
          대시보드로
        </Btn>
      </div>
    );
  }

  const sortedRecords = records.slice().sort((a, b) => (a.date < b.date ? 1 : -1));
  const age = ageString(dog.birthdate);

  async function handleArchive() {
    setError(null);
    try {
      await archiveDog.mutateAsync({ id: dog!.id, archived: true });
      router.push("/");
    } catch {
      setError("보관에 실패했어요. 잠시 후 다시 시도해주세요.");
    }
  }

  return (
    <div className="fade-in stack gap-6">
      <div>
        <BackBar onBack={() => router.push("/")} />
        {/* 강아지 카드 */}
        <div className="card card-pad-lg">
          <div className="row gap-3" style={{ marginBottom: 16 }}>
            <DogAvatar size={56} />
            <div>
              <span className="h2">{dog.name}</span>
            </div>
          </div>
          <dl className="dog-card-meta">
            {dog.breed && (
              <>
                <dt>견종</dt>
                <dd>{dog.breed}</dd>
              </>
            )}
            {age && (
              <>
                <dt>나이</dt>
                <dd>{age}</dd>
              </>
            )}
            {hasVal(dog.weight) && (
              <>
                <dt>체중</dt>
                <dd className="num">{dog.weight}kg</dd>
              </>
            )}
            {!dog.breed && !age && !hasVal(dog.weight) && (
              <dd className="muted" style={{ gridColumn: "1 / -1" }}>
                추가 정보가 없어요
              </dd>
            )}
          </dl>
        </div>
      </div>

      <Btn style={{ alignSelf: "flex-start" }} onClick={() => router.push(`/dogs/${id}/records/new`)}>
        오늘 기록 작성
      </Btn>

      <div>
        <div className="title-lg mb-4">주간 통계</div>
        {sortedRecords.length === 0 ? (
          <div className="card">
            <div className="caption" style={{ textAlign: "center", padding: "10px 0" }}>
              기록이 쌓이면 추이를 보여드릴게요.
            </div>
          </div>
        ) : stats ? (
          <WeeklyStats stats={stats} />
        ) : (
          <div className="card">
            <div className="caption" style={{ textAlign: "center", padding: "10px 0" }}>
              통계를 불러오는 중…
            </div>
          </div>
        )}
      </div>

      <DogMedications dogId={id} />

      <DogPhotos dogId={id} />

      <div>
        <div className="title-lg mb-4">최근 기록</div>
        {sortedRecords.length === 0 ? (
          <div className="caption">아직 기록이 없어요. 첫 기록을 작성해보세요!</div>
        ) : (
          <div className="stack gap-3">
            {sortedRecords.map((r) => (
              <RecordCard key={r.id} record={r} onClick={() => router.push(`/dogs/${id}/records/${r.id}`)} />
            ))}
          </div>
        )}
      </div>

      {/* 강아지 보관 — 목록에서 숨기고 보관함으로. 영구 삭제는 보관함에서. */}
      <div className="card">
        <div className="title-md mb-1">강아지 보관</div>
        <div className="caption mb-4">
          {dog.name}을(를) 보관하면 목록에서 숨겨지고 기록은 그대로 보관함에 남아요. 언제든 복원할 수 있고, 영구 삭제는 보관함에서 할 수 있어요.
        </div>

        {error && (
          <div className="alert alert-error mb-4" role="alert">
            {error}
          </div>
        )}

        {!confirming ? (
          <Btn variant="outline" block onClick={() => setConfirming(true)}>
            보관하기
          </Btn>
        ) : (
          <div className="stack gap-3">
            <div className="body" style={{ fontWeight: 600 }}>
              {dog.name}을(를) 보관할까요?
            </div>
            <div className="row gap-2">
              <Btn variant="outline" block disabled={busy} onClick={() => setConfirming(false)}>
                취소
              </Btn>
              <Btn block loading={busy} loadingText="보관 중…" onClick={handleArchive}>
                보관 확정
              </Btn>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
