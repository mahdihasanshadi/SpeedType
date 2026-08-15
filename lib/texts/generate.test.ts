import { describe, it, expect } from "vitest";
import { estimateWordCountForDuration, generatePassage, generateWordPassage } from "./generate";
import { COMMON_WORDS } from "./words";

describe("generateWordPassage", () => {
  it("produces exactly the requested number of words with no options", () => {
    const passage = generateWordPassage(25);
    expect(passage.split(" ")).toHaveLength(25);
  });

  it("every word comes from the common word pool when numbers are off", () => {
    const passage = generateWordPassage(50);
    for (const word of passage.split(" ")) {
      expect(COMMON_WORDS).toContain(word);
    }
  });

  it("with numbers on, at least one token across many runs is a numeric string", () => {
    // 10% chance per word — 200 words makes a false negative astronomically unlikely.
    const passage = generateWordPassage(200, { numbers: true });
    const hasNumber = passage.split(" ").some((token) => /^\d+$/.test(token));
    expect(hasNumber).toBe(true);
  });

  it("with punctuation on, the passage starts capitalized and ends with a period", () => {
    const passage = generateWordPassage(30, { punctuation: true });
    expect(passage[0]).toBe(passage[0].toUpperCase());
    expect(passage.endsWith(".")).toBe(true);
  });

  it("without punctuation, the passage is lowercase with no punctuation marks", () => {
    const passage = generateWordPassage(20);
    expect(/[.,]/.test(passage)).toBe(false);
  });
});

describe("estimateWordCountForDuration", () => {
  it("gives enough words that even a very fast typist wouldn't run out", () => {
    // 150 WPM ceiling for a 60s test = 150 words, plus a buffer.
    expect(estimateWordCountForDuration(60)).toBeGreaterThanOrEqual(150);
  });

  it("scales down for shorter durations", () => {
    expect(estimateWordCountForDuration(15)).toBeLessThan(estimateWordCountForDuration(60));
  });
});

describe("generatePassage", () => {
  it("words mode returns exactly `target` words", () => {
    const passage = generatePassage("words", 40);
    expect(passage.split(" ")).toHaveLength(40);
  });

  it("time mode returns more words than a typist could type in the target duration", () => {
    const passage = generatePassage("time", 30);
    expect(passage.split(" ").length).toBeGreaterThan(30);
  });
});
