import type { CharStats } from "@/lib/wpm";
import type { TestMode } from "@/store/typing-store";

const STORAGE_KEY = "speedtype:guest-tests";
const MAX_GUEST_TESTS = 20;

export type GuestTest = {
  mode: TestMode;
  target: number;
  netWpm: number;
  rawWpm: number;
  accuracy: number;
  consistency: number;
  charStats: CharStats;
  punctuation: boolean;
  numbers: boolean;
  createdAt: string;
};

export function getGuestTests(): GuestTest[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/** Newest first, capped at MAX_GUEST_TESTS — oldest evicted. Returns the updated list. */
export function saveGuestTest(test: Omit<GuestTest, "createdAt">): GuestTest[] {
  const withTimestamp: GuestTest = { ...test, createdAt: new Date().toISOString() };
  const next = [withTimestamp, ...getGuestTests()].slice(0, MAX_GUEST_TESTS);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  return next;
}

export function clearGuestTests(): void {
  localStorage.removeItem(STORAGE_KEY);
}
