import { describe, it, expect, beforeEach } from "vitest";
import { getLocalSettings, saveLocalSettings, DEFAULT_LOCAL_SETTINGS } from "./local-settings";

describe("local-settings", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("returns defaults when nothing is saved", () => {
    expect(getLocalSettings()).toEqual(DEFAULT_LOCAL_SETTINGS);
  });

  it("round-trips a saved settings object", () => {
    const custom = { mode: "words" as const, duration: 60, wordCount: 50, punctuation: true, numbers: true };
    saveLocalSettings(custom);
    expect(getLocalSettings()).toEqual(custom);
  });

  it("falls back to defaults for corrupt storage instead of throwing", () => {
    localStorage.setItem("speedtype:settings", "{not json");
    expect(getLocalSettings()).toEqual(DEFAULT_LOCAL_SETTINGS);
  });

  it("fills in missing fields from defaults for a partial/old stored shape", () => {
    localStorage.setItem("speedtype:settings", JSON.stringify({ mode: "words" }));
    expect(getLocalSettings()).toEqual({ ...DEFAULT_LOCAL_SETTINGS, mode: "words" });
  });
});
