import { defineConfig } from "vitest/config";
import { resolve } from "node:path";

// API 라우트 핸들러 회귀 테스트용 설정.
// - node 환경(라우트는 서버 코드, NextResponse.json은 web Response 반환).
// - "@/..." 별칭을 tsconfig와 동일하게 루트로 매핑.
export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
  },
  resolve: {
    alias: { "@": resolve(__dirname, ".") },
  },
});
