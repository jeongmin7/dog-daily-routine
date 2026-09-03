import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

// globals: false라 RTL 자동 cleanup이 안 걸린다 — 직접 등록.
afterEach(cleanup);
