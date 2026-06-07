/* 브랜드 마크: 박스 없는 발바닥 라인 심볼 + "하루" 워드마크 락업.
   (파란 사각형 배지 ❌ — 시안 최종 확정) */

export function BrandSymbol({ px = 26 }: { px?: number }) {
  return (
    <svg
      width={px}
      height={px}
      viewBox="0 0 24 24"
      fill="none"
      stroke="var(--primary)"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <ellipse cx="6.6" cy="9.6" rx="1.7" ry="2.3" transform="rotate(-12 6.6 9.6)" />
      <ellipse cx="9.9" cy="7.1" rx="1.7" ry="2.4" />
      <ellipse cx="14.1" cy="7.1" rx="1.7" ry="2.4" />
      <ellipse cx="17.4" cy="9.6" rx="1.7" ry="2.3" transform="rotate(12 17.4 9.6)" />
      <path d="M12 11.5c2.5 0 4.6 1.8 4.6 4.1 0 1.8-1.5 2.8-3.2 2.3-.5-.15-1-.27-1.4-.27s-.9.12-1.4.27c-1.7.5-3.2-.5-3.2-2.3 0-2.3 2.1-4.1 4.6-4.1Z" />
    </svg>
  );
}

export function BrandLogo({ brand = "하루", size = "lg" }: { brand?: string; size?: "sm" | "md" | "lg" }) {
  const px = size === "sm" ? 21 : size === "md" ? 25 : 29;
  const fs = size === "sm" ? 17 : size === "md" ? 22 : 26;
  return (
    <span className="brand-logo">
      <BrandSymbol px={px} />
      <span className="wm" style={{ fontSize: fs }}>
        {brand}
      </span>
    </span>
  );
}

/* 강아지 아바타 — 메인 컬러 톤을 따라가는 원형 발바닥 (이모지 ❌) */
export function DogAvatar({ size = 52 }: { size?: number }) {
  return (
    <div className="dog-avatar" style={{ width: size, height: size }}>
      <BrandSymbol px={Math.round(size * 0.5)} />
    </div>
  );
}
