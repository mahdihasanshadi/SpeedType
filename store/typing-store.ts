import { create } from "zustand";
import {
  calculateAccuracy,
  calculateCharStats,
  calculateConsistency,
  calculateNetWpm,
  calculateRawWpm,
  type CharStats,
  type Keystroke,
} from "@/lib/wpm";

export type TestMode = "time" | "words";
export type CharState = "pending" | "correct" | "incorrect";
export type EngineStatus = "idle" | "running" | "finished";

export type TestResult = {
  mode: TestMode;
  target: number;
  netWpm: number;
  rawWpm: number;
  accuracy: number;
  consistency: number;
  charStats: CharStats;
};

type TypingState = {
  passage: string;
  mode: TestMode;
  target: number;
  charStates: CharState[];
  currentIndex: number;
  keystrokes: Keystroke[];
  startedAt: number | null;
  status: EngineStatus;
  rawWpmSamples: number[];
  result: TestResult | null;

  /** Loads a fresh passage and resets all engine state — call before a test starts. */
  loadPassage: (passage: string, mode: TestMode, target: number) => void;
  /** A single non-backspace keypress. First call starts the timer (ux-flows.md). */
  typeChar: (char: string) => void;
  backspace: () => void;
  /** Call once per second while status is "running" — samples raw WPM and checks time-mode expiry. */
  tick: () => void;
  finish: () => void;
};

export const useTypingStore = create<TypingState>((set, get) => ({
  passage: "",
  mode: "time",
  target: 30,
  charStates: [],
  currentIndex: 0,
  keystrokes: [],
  startedAt: null,
  status: "idle",
  rawWpmSamples: [],
  result: null,

  loadPassage: (passage, mode, target) =>
    set({
      passage,
      mode,
      target,
      charStates: Array(passage.length).fill("pending"),
      currentIndex: 0,
      keystrokes: [],
      startedAt: null,
      status: "idle",
      rawWpmSamples: [],
      result: null,
    }),

  typeChar: (char) => {
    const state = get();
    if (state.status === "finished") return;
    if (state.currentIndex >= state.passage.length) return;

    const now = Date.now();
    const startedAt = state.startedAt ?? now;
    const expected = state.passage[state.currentIndex];
    const correct = char === expected;

    const charStates = state.charStates.slice();
    charStates[state.currentIndex] = correct ? "correct" : "incorrect";

    const keystrokes = [...state.keystrokes, { char, correct, timestamp: now }];
    const nextIndex = state.currentIndex + 1;

    set({
      status: "running",
      startedAt,
      charStates,
      keystrokes,
      currentIndex: nextIndex,
    });

    // Words mode ends the instant the passage is fully typed. Time mode only ends via tick().
    if (state.mode === "words" && nextIndex >= state.passage.length) {
      get().finish();
    }
  },

  backspace: () => {
    const state = get();
    if (state.status !== "running" || state.currentIndex === 0) return;

    const charStates = state.charStates.slice();
    charStates[state.currentIndex - 1] = "pending";
    set({ charStates, currentIndex: state.currentIndex - 1 });
  },

  tick: () => {
    const state = get();
    if (state.status !== "running" || state.startedAt === null) return;

    const elapsedMs = Date.now() - state.startedAt;
    const rawWpm = calculateRawWpm(state.keystrokes.length, elapsedMs);
    set({ rawWpmSamples: [...state.rawWpmSamples, rawWpm] });

    if (state.mode === "time" && elapsedMs >= state.target * 1000) {
      get().finish();
    }
  },

  finish: () => {
    const state = get();
    if (state.status === "finished") return;
    if (state.startedAt === null) {
      // Timer never started (test ended with zero keystrokes) — nothing to score.
      set({ status: "finished", result: null });
      return;
    }

    const elapsedMs = Date.now() - state.startedAt;
    const totalKeystrokes = state.keystrokes.length;
    const correctKeystrokes = state.keystrokes.filter((k) => k.correct).length;

    const result: TestResult = {
      mode: state.mode,
      target: state.target,
      netWpm: calculateNetWpm(correctKeystrokes, elapsedMs),
      rawWpm: calculateRawWpm(totalKeystrokes, elapsedMs),
      accuracy: calculateAccuracy(correctKeystrokes, totalKeystrokes),
      consistency: calculateConsistency(state.rawWpmSamples),
      charStats: calculateCharStats(state.keystrokes, state.currentIndex, state.passage.length),
    };

    set({ status: "finished", result });
  },
}));
