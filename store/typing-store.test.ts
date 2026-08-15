import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { useTypingStore } from "./typing-store";

function typeString(str: string) {
  for (const char of str) useTypingStore.getState().typeChar(char);
}

describe("typing-store", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(0);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("does not start the timer until the first keydown", () => {
    useTypingStore.getState().loadPassage("hello", "words", 1);
    expect(useTypingStore.getState().startedAt).toBeNull();
    expect(useTypingStore.getState().status).toBe("idle");

    useTypingStore.getState().typeChar("h");
    expect(useTypingStore.getState().startedAt).toBe(0);
    expect(useTypingStore.getState().status).toBe("running");
  });

  it("marks each character correct or incorrect as typed", () => {
    useTypingStore.getState().loadPassage("cat", "words", 1);
    useTypingStore.getState().typeChar("c");
    useTypingStore.getState().typeChar("x"); // wrong, expected 'a'

    const { charStates } = useTypingStore.getState();
    expect(charStates).toEqual(["correct", "incorrect", "pending"]);
  });

  it("backspace resets the previous character to pending and moves the cursor back", () => {
    useTypingStore.getState().loadPassage("cat", "words", 1);
    useTypingStore.getState().typeChar("c");
    useTypingStore.getState().typeChar("x");
    useTypingStore.getState().backspace();

    const state = useTypingStore.getState();
    expect(state.currentIndex).toBe(1);
    expect(state.charStates).toEqual(["correct", "pending", "pending"]);
  });

  it("words mode finishes the instant the last character is typed", () => {
    useTypingStore.getState().loadPassage("cat", "words", 1);
    typeString("cat");

    const state = useTypingStore.getState();
    expect(state.status).toBe("finished");
    expect(state.result).not.toBeNull();
  });

  it("time mode does not finish just because the passage ran out — only tick() ends it", () => {
    useTypingStore.getState().loadPassage("hi", "time", 30);
    typeString("hi");
    expect(useTypingStore.getState().status).toBe("running");
  });

  it("time mode finishes exactly when tick() observes the target duration elapsed", () => {
    useTypingStore.getState().loadPassage("hello world this is a test passage", "time", 10);
    useTypingStore.getState().typeChar("h"); // starts the timer at t=0

    vi.setSystemTime(9_000);
    useTypingStore.getState().tick();
    expect(useTypingStore.getState().status).toBe("running");

    vi.setSystemTime(10_000);
    useTypingStore.getState().tick();
    expect(useTypingStore.getState().status).toBe("finished");
  });

  it("computes final stats matching lib/wpm for a fully deterministic sequence", () => {
    // Passage "aaaaa" (5 chars). Type all 5 correctly over exactly 30 seconds (0 -> 30000ms).
    useTypingStore.getState().loadPassage("aaaaa", "words", 1);

    vi.setSystemTime(0);
    useTypingStore.getState().typeChar("a"); // starts timer at t=0
    vi.setSystemTime(30_000);
    typeString("aaaa"); // remaining 4 chars, all correct -> triggers finish() at exactly 30s

    const { result } = useTypingStore.getState();
    expect(result).not.toBeNull();
    // 5 correct keystrokes / 5 total, over 30s = (5/5) / 0.5min = 2 WPM net and raw.
    expect(result!.netWpm).toBe(2);
    expect(result!.rawWpm).toBe(2);
    expect(result!.accuracy).toBe(100);
    expect(result!.charStats).toEqual({ correct: 5, incorrect: 0, extra: 0, missed: 0 });
  });
});
