"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/app/providers";
import { Btn, Field, TextInput } from "@/components/ui";
import { BackBar } from "@/components/back-bar";
import { todayISO } from "@/lib/format";

export default function DogNewPage() {
  const router = useRouter();
  const { addDog } = useApp();
  const [name, setName] = useState("");
  const [breed, setBreed] = useState("");
  const [birth, setBirth] = useState("");
  const [weight, setWeight] = useState("");
  const [err, setErr] = useState<{ name?: string; birth?: string; weight?: string }>({});
  const [busy, setBusy] = useState(false);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const next: typeof err = {};
    if (!name.trim()) next.name = "이름은 필수입니다";
    if (birth && birth > todayISO()) next.birth = "생년월일은 미래일 수 없습니다";
    if (weight !== "" && Number(weight) < 0) next.weight = "체중은 양수여야 합니다";
    setErr(next);
    if (Object.keys(next).length) return;
    setBusy(true);
    setTimeout(() => {
      const dog = addDog({
        name: name.trim(),
        breed: breed.trim() || undefined,
        birthdate: birth || undefined,
        weight: weight !== "" ? Number(weight) : undefined,
      });
      router.push(`/dogs/${dog.id}`);
    }, 600);
  }

  return (
    <div className="fade-in" style={{ maxWidth: 440, margin: "0 auto" }}>
      <BackBar onBack={() => router.push("/")} />
      <div className="h2">강아지 등록</div>
      <div className="caption mb-6" style={{ marginTop: 6 }}>
        기본 정보를 입력해주세요
      </div>
      <form onSubmit={submit} noValidate>
        <Field label="이름" error={err.name} htmlFor="dn-name">
          <TextInput id="dn-name" placeholder="예: 보리" value={name} invalid={!!err.name} onChange={(e) => setName(e.target.value)} />
        </Field>
        <Field label="견종" optional htmlFor="dn-breed">
          <TextInput id="dn-breed" placeholder="예: 포메라니안" value={breed} onChange={(e) => setBreed(e.target.value)} />
        </Field>
        <Field label="생년월일" optional error={err.birth} htmlFor="dn-birth">
          <TextInput id="dn-birth" type="date" max={todayISO()} value={birth} invalid={!!err.birth} onChange={(e) => setBirth(e.target.value)} />
        </Field>
        <Field label="체중 (kg)" optional error={err.weight} htmlFor="dn-weight">
          <TextInput id="dn-weight" className="num" type="number" step="0.1" min="0" inputMode="decimal" placeholder="예: 4.6" value={weight} invalid={!!err.weight} onChange={(e) => setWeight(e.target.value)} />
        </Field>
        <Btn type="submit" block loading={busy} loadingText="등록 중…">
          등록하기
        </Btn>
      </form>
    </div>
  );
}
