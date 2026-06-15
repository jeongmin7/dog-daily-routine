"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/app/providers";
import { RecordForm } from "@/components/record-form";
import { Btn } from "@/components/ui";

export default function RecordEditPage({ params }: { params: Promise<{ id: string; recordId: string }> }) {
  const { id, recordId } = use(params);
  const router = useRouter();
  const { store, updateRecord, deleteRecord } = useApp();
  const dog = store.dogs.find((d) => d.id === id);
  const record = store.records.find((r) => r.id === recordId);

  if (!dog || !record) {
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
      mode="edit"
      dog={dog}
      record={record}
      onCancel={() => router.push(`/dogs/${id}`)}
      onSave={async (rec) => {
        await updateRecord(recordId, rec);
        router.push(`/dogs/${id}`);
      }}
      onDelete={async () => {
        await deleteRecord(recordId);
        router.push(`/dogs/${id}`);
      }}
    />
  );
}
