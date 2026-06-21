import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/auth", () => ({ auth: vi.fn() }));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    apiToken: { findUnique: vi.fn(), update: vi.fn() },
  },
}));

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateToken, getUserId, hashToken } from "@/lib/api-auth";
import { SESSION } from "./helpers";

function bearerReq(token: string): Request {
  return new Request("http://test.local", {
    headers: { authorization: `Bearer ${token}` },
  });
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("hashToken / generateToken", () => {
  it("hashToken은 결정적(같은 입력 → 같은 sha256 hex)", () => {
    expect(hashToken("abc")).toBe(hashToken("abc"));
    expect(hashToken("abc")).toMatch(/^[0-9a-f]{64}$/);
    expect(hashToken("abc")).not.toBe(hashToken("abd"));
  });

  it("generateToken은 haru_ 프리픽스 + 매번 다른 값", () => {
    const a = generateToken();
    const b = generateToken();
    expect(a.startsWith("haru_")).toBe(true);
    expect(a).not.toBe(b);
  });
});

describe("getUserId", () => {
  it("유효한 Bearer 토큰 → 해당 토큰의 userId (해시로 조회)", async () => {
    vi.mocked(prisma.apiToken.findUnique).mockResolvedValue({
      id: "t1",
      userId: "owner-1",
    } as never);
    vi.mocked(prisma.apiToken.update).mockResolvedValue({} as never);

    const userId = await getUserId(bearerReq("haru_secret"));

    expect(userId).toBe("owner-1");
    expect(prisma.apiToken.findUnique).toHaveBeenCalledWith({
      where: { tokenHash: hashToken("haru_secret") },
    });
    // 세션 폴백을 타지 않았어야 함
    expect(auth).not.toHaveBeenCalled();
  });

  it("없는 Bearer 토큰 → null (세션 폴백 안 함)", async () => {
    vi.mocked(prisma.apiToken.findUnique).mockResolvedValue(null as never);
    const userId = await getUserId(bearerReq("haru_wrong"));
    expect(userId).toBeNull();
    expect(auth).not.toHaveBeenCalled();
  });

  it("Bearer 헤더 없으면 세션으로 폴백", async () => {
    vi.mocked(auth).mockResolvedValue(SESSION as never);
    const userId = await getUserId(new Request("http://test.local"));
    expect(userId).toBe("user-1");
    expect(prisma.apiToken.findUnique).not.toHaveBeenCalled();
  });

  it("Bearer도 세션도 없으면 null", async () => {
    vi.mocked(auth).mockResolvedValue(null as never);
    const userId = await getUserId(new Request("http://test.local"));
    expect(userId).toBeNull();
  });
});
