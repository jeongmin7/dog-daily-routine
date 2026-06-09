"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/app/providers";
import { Btn } from "@/components/ui";
import { BackBar } from "@/components/back-bar";
import { DogAvatar } from "@/components/brand";
import { RecordCard } from "@/components/record-card";
import { WeeklyStats } from "@/components/stat-chart";
import { ageString, hasVal, recordsForDog } from "@/lib/format";

export default function DogDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { store } = useApp();
  const dog = store.dogs.find((d) => d.id === id);

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

  const records = recordsForDog(store.records, id);
  const age = ageString(dog.birthdate);

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
        {records.length === 0 ? (
          <div className="card">
            <div className="caption" style={{ textAlign: "center", padding: "10px 0" }}>
              기록이 쌓이면 추이를 보여드릴게요.
            </div>
          </div>
        ) : (
          <WeeklyStats records={records} />
        )}
      </div>

      <div>
        <div className="title-lg mb-4">최근 기록</div>
        {records.length === 0 ? (
          <div className="caption">아직 기록이 없어요. 첫 기록을 작성해보세요!</div>
        ) : (
          <div className="stack gap-3">
            {records.map((r) => (
              <RecordCard key={r.id} record={r} onClick={() => router.push(`/dogs/${id}/records/${r.id}`)} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
