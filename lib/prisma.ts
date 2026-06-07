import { PrismaClient } from "@prisma/client";

// 앱 전체가 공유하는 단 하나의 Prisma Client (DB로 가는 "정문").
// dev에서 HMR로 모듈이 리로드돼도 클라이언트가 새로 생기지 않도록 globalThis에 캐싱한다.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
