import type { TestMode } from "@/store/typing-store";

const STORAGE_KEY = "speedtype:settings";

export type LocalSettings = {
  mode: TestMode;
  duration: number;
  wordCount: number;
  punctuation: boolean;
  numbers: boolean;
};

export const DEFAULT_LOCAL_SETTINGS: LocalSettings = {
  mode: "time",
  duration: 30,
  wordCount: 25,
  punctuation: false,
  numbers: false,
};

/** Per-device settings cache — always the fast, always-available source. For a logged-in user
 * the DB (via /api/settings) is the cross-device source of truth and takes precedence on load;
 * this is what a guest gets, and what any user gets before the API round-trip resolves. */
export function getLocalSettings(): LocalSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_LOCAL_SETTINGS;
    return { ...DEFAULT_LOCAL_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_LOCAL_SETTINGS;
  }
}

export function saveLocalSettings(settings: LocalSettings): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}
