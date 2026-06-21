/* 데모 데이터 시드 — `npx prisma db seed` 또는 `npm run db:seed`.
   재실행해도 안전(idempotent): 데모 유저를 upsert하고, 그 유저의 강아지를
   전부 지운 뒤(기록은 cascade) 다시 만든다. */

import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../lib/password";

const prisma = new PrismaClient();

const DEMO_EMAIL = "demo@haru.test";
const DEMO_PASSWORD = "demo1234";

function isoDaysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

async function main() {
  const password = await hashPassword(DEMO_PASSWORD);
  const user = await prisma.user.upsert({
    where: { email: DEMO_EMAIL },
    update: { name: "데모" },
    create: { email: DEMO_EMAIL, name: "데모", password },
  });

  // 재실행 시 중복 방지 — 데모 유저의 강아지 전부 삭제(기록은 onDelete: Cascade).
  await prisma.dog.deleteMany({ where: { userId: user.id } });

  const dog = await prisma.dog.create({
    data: {
      userId: user.id,
      name: "보리",
      breed: "포메라니안",
      birthdate: "2022-03-15",
      weight: 4.6,
    },
  });

  // 일주일치 "채워진" 데모 기록 (idx 0 = 6일 전, idx 6 = 오늘).
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

  const records = Array.from({ length: 7 }, (_, idx) => ({
    dogId: dog.id,
    date: isoDaysAgo(6 - idx),
    meal: meal[idx],
    walkMin: walkMin[idx],
    walkKm: walkKm[idx],
    poop: poop[idx],
    weight: weight[idx],
    memo: memos[idx] || null,
  }));
  await prisma.dogRecord.createMany({ data: records });

  console.log(
    `Seeded: ${DEMO_EMAIL} (비밀번호: ${DEMO_PASSWORD}) + 강아지 "보리" + 기록 7개`,
  );
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
