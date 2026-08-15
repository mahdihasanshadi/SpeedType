import { describe, it, expect, beforeEach } from "vitest";
import { saveGuestTest, getGuestTests, clearGuestTests, type GuestTest } from "./guest-tests";

function makeTest(overrides: Partial<GuestTest> = {}): Omit<GuestTest, "createdAt"> {
  return {
    mode: "time",
    target: 30,
    netWpm: 60,
    rawWpm: 65,
    accuracy: 95,
    consistency: 90,
    charStats: { correct: 100, incorrect: 5, extra: 0, missed: 0 },
    punctuation: false,
    numbers: false,
    ...overrides,
  };
}

describe("guest-tests", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("saves a test and returns it newest-first", () => {
    saveGuestTest(makeTest({ netWpm: 50 }));
    const tests = saveGuestTest(makeTest({ netWpm: 60 }));
    expect(tests[0].netWpm).toBe(60);
    expect(tests[1].netWpm).toBe(50);
  });

  it("persists across calls to getGuestTests", () => {
    saveGuestTest(makeTest());
    expect(getGuestTests()).toHaveLength(1);
  });

  it("caps at 20 entries, evicting the oldest", () => {
    for (let i = 0; i < 21; i++) {
      saveGuestTest(makeTest({ netWpm: i }));
    }
    const tests = getGuestTests();
    expect(tests).toHaveLength(20);
    // Most recent (netWpm 20) first; oldest (netWpm 0) evicted.
    expect(tests[0].netWpm).toBe(20);
    expect(tests.some((t) => t.netWpm === 0)).toBe(false);
  });

  it("clearGuestTests empties the list", () => {
    saveGuestTest(makeTest());
    clearGuestTests();
    expect(getGuestTests()).toHaveLength(0);
  });
});
