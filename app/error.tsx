"use client";

// 에러 경계는 Client Component여야 함. 이 Next.js 버전은 reset 대신 unstable_retry 사용.
import { useEffect } from "react";

export default function ErrorPage({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="container full-center" style={{ minHeight: 360 }}>
      <div style={{ fontSize: 40, marginBottom: 8 }}>⚠️</div>
      <div className="h2 mb-2">문제가 발생했어요</div>
      <div className="caption mb-6" style={{ textAlign: "center", maxWidth: 280 }}>
        {error.message || "잠시 후 다시 시도해주세요."}
      </div>
      <button className="btn btn-primary" onClick={() => unstable_retry()}>
        다시 시도
      </button>
    </div>
  );
}
