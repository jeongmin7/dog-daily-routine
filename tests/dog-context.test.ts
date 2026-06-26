import { describe, it, expect } from "vitest";
import { ageFromBirthdate, buildDogContext } from "@/lib/dog-context";

describe("ageFromBirthdate", () => {
  it("생일이 지났으면 만나이", () => {
    expect(ageFromBirthdate("2021-01-01", new Date("2026-06-26"))).toBe(5);
  });
  it("올해 생일 전이면 한 살 적게", () => {
    expect(ageFromBirthdate("2021-12-31", new Date("2026-06-26"))).toBe(4);
  });
  it("null이면 null", () => {
    expect(ageFromBirthdate(null, new Date("2026-06-26"))).toBeNull();
  });
});

describe("buildDogContext", () => {
  it("나이·지병을 조립한다", () => {
    const ctx = buildDogContext(
      { name: "보리", birthdate: "2021-01-01", weight: 5.2 },
      ["신장병"],
    );
    expect(ctx.name).toBe("보리");
    expect(ctx.weight).toBe(5.2);
    expect(ctx.diseases).toEqual(["신장병"]);
    expect(ctx.ageText).toMatch(/살/);
  });
  it("birthdate 없으면 ageText 생략", () => {
    const ctx = buildDogContext(
      { name: "초코", birthdate: null, weight: null },
      [],
    );
    expect(ctx.ageText).toBeUndefined();
    expect(ctx.weight).toBeNull();
    expect(ctx.diseases).toEqual([]);
  });
});
