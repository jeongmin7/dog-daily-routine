"use client";

export function BackBar({ onBack, label = "뒤로" }: { onBack: () => void; label?: string }) {
  return (
    <button
      className="btn btn-ghost btn-sm"
      onClick={onBack}
      style={{ marginLeft: -8, marginBottom: 12, paddingLeft: 8, color: "var(--muted-fg)" }}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M15 18l-6-6 6-6" />
      </svg>
      {label}
    </button>
  );
}
