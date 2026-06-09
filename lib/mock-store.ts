/* ⚠️ 임시 mock 데이터 계층 (localStorage).
   MVP 0 백엔드(Prisma + Neon + NextAuth)가 준비되면 이 파일을 걷어내고
   providers.tsx의 호출부를 실제 API/Server Action으로 교체한다.
   UI는 이 모듈 인터페이스에만 의존하므로 교체 시 화면 코드는 안 건드려도 된다. */

import type { Store } from "./types";
import { isoDaysAgo } from "./format";

const STORE_KEY = "haru.v1";

export const uid = () => Math.random().toString(36).slice(2, 9);

// 시드: 강아지 1마리 + 일주일치 기록 ("채워진" 데모 경험용)
export function buildSeed(): Store {
  const dogId = "seed-dog";
  const meal = [128, 122, 130, 119, 134, 126, 131];
  const walkMin = [35, 28, 40, 22, 45, 30, 38];
  const walkKm = [1.8, 1.4, 2.1, 1.1, 2.4, 1.6, 2.0];
  const weight = [4.7, 4.68, 4.66, 4.65, 4.63, 4.62, 4.6];
  const poop = [2, 1, 2, 2, 3, 1, 2];
  const memos = [
    "컨디션 아주 좋음. 산책 내내 신나했어요 🐾",
    "사료 조금 남김. 평소보다 식욕 적음.",
    "",
    "비 와서 산책 짧게. 실내 놀이로 대체.",
    "",
    "변 상태 양호. 물 잘 마심.",
    "",
  ];
  const records = [];
  for (let i = 6; i >= 0; i--) {
    const idx = 6 - i;
    records.push({
      id: "seed-r" + idx,
      dogId,
      date: isoDaysAgo(i),
      meal: meal[idx],
      walkMin: walkMin[idx],
      walkKm: walkKm[idx],
      poop: poop[idx],
      weight: weight[idx],
      memo: memos[idx] || undefined,
    });
  }
  return {
    user: { email: "haru.mom@haru.app", name: "하루맘" },
    dogs: [{ id: dogId, name: "보리", breed: "포메라니안", birthdate: "2022-03-14", weight: 4.6 }],
    records,
  };
}

export function loadStore(): Store {
  if (typeof window === "undefined") return buildSeed();
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (raw) return JSON.parse(raw) as Store;
  } catch {
    /* ignore */
  }
  const seed = buildSeed();
  saveStore(seed);
  return seed;
}

export function saveStore(store: Store): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(store));
  } catch {
    /* ignore */
  }
}
