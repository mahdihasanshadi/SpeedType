import { describe, it, expect } from "vitest";
import { calculateStreak } from "./streak";

const DAY_MS = 24 * 60 * 60 * 1000;
const NOW = new Date("2026-08-16T12:00:00.000Z");
function daysAgo(n: number): Date {
  return new Date(NOW.getTime() - n * DAY_MS);
}

describe("calculateStreak", () => {
  it("returns 0 with no tests", () => {
    expect(calculateStreak([], NOW)).toBe(0);
  });

  it("counts today alone as a streak of 1", () => {
    expect(calculateStreak([daysAgo(0)], NOW)).toBe(1);
  });

  it("counts consecutive days ending today", () => {
    expect(calculateStreak([daysAgo(0), daysAgo(1), daysAgo(2)], NOW)).toBe(3);
  });

  it("still counts the streak as current if today has no test yet but yesterday does", () => {
    expect(calculateStreak([daysAgo(1), daysAgo(2)], NOW)).toBe(2);
  });

  it("breaks the streak if both today and yesterday are missing", () => {
    expect(calculateStreak([daysAgo(2), daysAgo(3)], NOW)).toBe(0);
  });

  it("stops counting at the first gap", () => {
    // today, yesterday, then a gap at day 2, then day 3 — streak should stop at 2
    expect(calculateStreak([daysAgo(0), daysAgo(1), daysAgo(3)], NOW)).toBe(2);
  });

  it("multiple tests on the same day count once", () => {
    expect(calculateStreak([daysAgo(0), daysAgo(0), daysAgo(0)], NOW)).toBe(1);
  });
});
