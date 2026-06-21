"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import {
  useDeleteRecord,
  useDog,
  useRecords,
  useUpdateRecord,
} from "@/lib/queries";
import { RecordForm } from "@/components/record-form";
import { Btn } from "@/components/ui";

export default function RecordEditPage({ params }: { params: Promise<{ id: string; recordId: string }> }) {
  const { id, recordId } = use(params);
  const router = useRouter();
  const { data: dog, isPending: dogPending } = useDog(id);
  const { data: records = [], isPending: recordsPending } = useRecords(id);
  const updateRecord = useUpdateRecord(id);
  const deleteRecord = useDeleteRecord(id);
  const record = records.find((r) => r.id === recordId);

  if (dogPending || recordsPending) {
    return (
      <div className="full-center" style={{ minHeight: 300 }}>
        <div className="caption">불러오는 중…</div>
      </div>
    );
  }

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
        await updateRecord.mutateAsync({ recordId, rec });
        router.push(`/dogs/${id}`);
      }}
      onDelete={async () => {
        await deleteRecord.mutateAsync(recordId);
        router.push(`/dogs/${id}`);
      }}
    />
  );
}
