"use client";

import { useRouter } from "next/navigation";
import { useApp } from "@/app/providers";
import { Btn } from "@/components/ui";
import { DogAvatar } from "@/components/brand";
import { RecordMetrics } from "@/components/record-card";
import { ageString, fmtDateKo, relativeDay, todayISO } from "@/lib/format";

export default function DashboardPage() {
  const router = useRouter();
  const { store } = useApp();
  const { dogs, records, user } = store;
  const recent = records.slice().sort((a, b) => (a.date < b.date ? 1 : -1)).slice(0, 4);
  const dogName = (id: string) => dogs.find((d) => d.id === id)?.name || "";

  if (dogs.length === 0) {
    return (
      <div className="fade-in">
        <div className="h1 mb-6">안녕하세요, {user.name || "보호자"}님</div>
        <div className="empty-box">
          <div className="empty-emoji">🐕</div>
          <div className="title-lg">아직 등록된 강아지가 없어요</div>
          <div className="caption" style={{ maxWidth: 240 }}>
            강아지를 등록하고 오늘의 식사·산책·체중을 기록해보세요.
          </div>
          <Btn block style={{ marginTop: 10, maxWidth: 260 }} onClick={() => router.push("/dogs/new")}>
            강아지 등록하기
          </Btn>
        </div>
      </div>
    );
  }

  return (
    <div className="fade-in">
      <div className="row between mb-6">
        <div className="h1">안녕하세요, {user.name || "보호자"}님</div>
        <Btn variant="outline" size="sm" onClick={() => router.push("/dogs/new")}>
          + 강아지 추가
        </Btn>
      </div>

      <div className="stack gap-3 mb-8">
        {dogs.map((dog) => {
          const loggedToday = records.some((r) => r.dogId === dog.id && r.date === todayISO());
          return (
            <div className="card dog-card" key={dog.id} onClick={() => router.push(`/dogs/${dog.id}`)}>
              <div className="row gap-3">
                <DogAvatar size={52} />
                <div className="grow">
                  <div className="title-md">{dog.name}</div>
                  <div className="caption">
                    {[dog.breed, ageString(dog.birthdate)].filter(Boolean).join(" · ") || "기본 정보 없음"}
                  </div>
                </div>
                <svg width="8" height="14" viewBox="0 0 8 14" style={{ flexShrink: 0 }}>
                  <path d="M1 1l6 6-6 6" stroke="var(--muted-fg)" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <div className="dog-card-foot row between">
                {loggedToday ? (
                  <span className="status done">
                    <span className="dot" />
                    오늘 기록 완료
                  </span>
                ) : (
                  <span className="status todo">
                    <span className="dot" />
                    아직 오늘 기록 전
                  </span>
                )}
                <Btn
                  size="sm"
                  variant={loggedToday ? "outline" : "primary"}
                  onClick={(e) => {
                    e.stopPropagation();
                    router.push(`/dogs/${dog.id}/records/new`);
                  }}
                >
                  {loggedToday ? "기록 추가" : "오늘 기록"}
                </Btn>
              </div>
            </div>
          );
        })}
      </div>

      <div className="title-lg mb-4">
        최근 기록{" "}
        <span className="muted" style={{ fontWeight: 400, fontSize: 14 }}>
          (전체)
        </span>
      </div>
      {recent.length === 0 ? (
        <div className="caption">아직 기록이 없어요. 첫 기록을 작성해보세요!</div>
      ) : (
        <div className="stack gap-3">
          {recent.map((r) => (
            <div className="record-card" key={r.id} onClick={() => router.push(`/dogs/${r.dogId}/records/${r.id}`)}>
              <div className="row between" style={{ marginBottom: 8 }}>
                <span className="caption" style={{ fontWeight: 500 }}>
                  {dogName(r.dogId)} · {fmtDateKo(r.date)}
                  {relativeDay(r.date) && (
                    <span className="text-primary" style={{ marginLeft: 6, fontWeight: 600 }}>
                      {relativeDay(r.date)}
                    </span>
                  )}
                </span>
              </div>
              <RecordMetrics record={r} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
