import { defineConfig } from "vitest/config";
import { resolve } from "node:path";

// 두 종류의 테스트를 한 프로세스에서 환경만 갈라서 돌린다.
// - .test.ts  = API 라우트 핸들러 (node: NextResponse.json이 web Response를 반환)
// - .test.tsx = 컴포넌트 (jsdom: DOM 필요)
// Vitest 4에서 environmentMatchGlobs가 제거돼 projects로 분리한다.
// projects는 루트의 resolve를 상속하지 않으므로 alias를 각각 넘긴다.
const alias = { "@": resolve(__dirname, ".") };

export default defineConfig({
  test: {
    projects: [
      {
        resolve: { alias },
        test: {
          name: "api",
          environment: "node",
          include: ["tests/**/*.test.ts"],
        },
      },
      {
        resolve: { alias },
        test: {
          name: "components",
          environment: "jsdom",
          include: ["tests/**/*.test.tsx"],
          setupFiles: ["./tests/setup-dom.ts"],
        },
      },
    ],
  },
});
