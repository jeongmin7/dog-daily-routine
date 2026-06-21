"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import { useAddRecord, useDog } from "@/lib/queries";
import { RecordForm } from "@/components/record-form";
import { Btn } from "@/components/ui";

export default function RecordNewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { data: dog, isPending } = useDog(id);
  const addRecord = useAddRecord(id);

  if (isPending) {
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

  return (
    <RecordForm
      mode="new"
      dog={dog}
      onCancel={() => router.push(`/dogs/${id}`)}
      onSave={async (rec) => {
        await addRecord.mutateAsync(rec);
        router.push(`/dogs/${id}`);
      }}
    />
  );
}
