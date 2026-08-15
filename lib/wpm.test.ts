import { describe, it, expect } from "vitest";
import {
  calculateAccuracy,
  calculateCharStats,
  calculateConsistency,
  calculateNetWpm,
  calculateRawWpm,
  type Keystroke,
} from "./wpm";

describe("calculateRawWpm", () => {
  it("50 keystrokes in 30s = (50/5) / 0.5min = 20 WPM", () => {
    expect(calculateRawWpm(50, 30_000)).toBe(20);
  });

  it("returns 0 for zero/negative elapsed time", () => {
    expect(calculateRawWpm(50, 0)).toBe(0);
    expect(calculateRawWpm(50, -1)).toBe(0);
  });
});

describe("calculateNetWpm", () => {
  it("45 correct keystrokes in 30s = (45/5) / 0.5min = 18 WPM — mistakes excluded", () => {
    expect(calculateNetWpm(45, 30_000)).toBe(18);
  });
});

describe("calculateAccuracy", () => {
  it("45 correct / 50 total = 90.0%", () => {
    expect(calculateAccuracy(45, 50)).toBe(90);
  });

  it("rounds to 1 decimal place", () => {
    // 2/3 = 66.666...% -> 66.7
    expect(calculateAccuracy(2, 3)).toBe(66.7);
  });

  it("returns 0 for zero total keystrokes", () => {
    expect(calculateAccuracy(0, 0)).toBe(0);
  });
});

describe("calculateConsistency", () => {
  it("returns 100 for perfectly even samples (zero variance)", () => {
    expect(calculateConsistency([60, 60, 60, 60])).toBe(100);
  });

  it("drops for bursty samples — hand-computed: mean 70, stddev ~22.36 -> 68.1", () => {
    // samples: 40, 60, 80, 100 -> mean 70
    // variance = (30^2 + 10^2 + 10^2 + 30^2) / 4 = 2000/4 = 500 -> stddev = sqrt(500) ≈ 22.3607
    // consistency = 100 - (22.3607 / 70 * 100) ≈ 100 - 31.944 ≈ 68.056 -> rounds to 68.1
    expect(calculateConsistency([40, 60, 80, 100])).toBe(68.1);
  });

  it("treats fewer than 2 samples as perfectly consistent", () => {
    expect(calculateConsistency([])).toBe(100);
    expect(calculateConsistency([42])).toBe(100);
  });

  it("never returns below 0 or above 100", () => {
    const wild = [1000, 1, 1000, 1, 1000, 1];
    const result = calculateConsistency(wild);
    expect(result).toBeGreaterThanOrEqual(0);
    expect(result).toBeLessThanOrEqual(100);
  });
});

describe("calculateCharStats", () => {
  function keystroke(correct: boolean): Keystroke {
    return { char: "x", correct, timestamp: 0 };
  }

  it("counts correct and incorrect keystrokes, including corrected mistakes", () => {
    // 3 correct, then 1 incorrect attempt, backspaced, then retyped correctly (4th correct):
    // keystrokes log has 5 entries: correct, correct, correct, incorrect, correct.
    const keystrokes = [
      keystroke(true),
      keystroke(true),
      keystroke(true),
      keystroke(false),
      keystroke(true),
    ];
    const stats = calculateCharStats(keystrokes, 4, 10);
    expect(stats.correct).toBe(4);
    expect(stats.incorrect).toBe(1);
    expect(stats.extra).toBe(0);
  });

  it("computes missed from the final cursor position, not the keystroke count", () => {
    // 4 keystrokes typed (with one retry) but final position only reached index 3 of a 10-char passage.
    const keystrokes = [keystroke(true), keystroke(false), keystroke(true), keystroke(true)];
    const stats = calculateCharStats(keystrokes, 3, 10);
    expect(stats.missed).toBe(7);
  });

  it("clamps missed at 0 when the full passage was reached", () => {
    const keystrokes = [keystroke(true), keystroke(true)];
    const stats = calculateCharStats(keystrokes, 2, 2);
    expect(stats.missed).toBe(0);
  });
});
