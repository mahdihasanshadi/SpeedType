"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { ModeControls } from "@/components/typing-engine/ModeControls";
import {
  DEFAULT_LOCAL_SETTINGS,
  getLocalSettings,
  saveLocalSettings,
  type LocalSettings,
} from "@/lib/local-settings";

function toApiPayload(settings: LocalSettings) {
  return {
    mode: settings.mode,
    duration: settings.mode === "time" ? settings.duration : settings.wordCount,
    punctuation: settings.punctuation,
    numbers: settings.numbers,
  };
}

export default function SettingsPage() {
  const { status } = useSession();
  const [settings, setSettings] = useState<LocalSettings>(DEFAULT_LOCAL_SETTINGS);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    // Local storage first (instant, works offline/guest). For a logged-in user the DB is the
    // cross-device source of truth and overrides it once the fetch resolves.
    setSettings(getLocalSettings());
    setLoaded(true);

    if (status === "authenticated") {
      fetch("/api/settings")
        .then((res) => (res.ok ? res.json() : null))
        .then((data: { mode?: string; duration?: number; punctuation?: boolean; numbers?: boolean } | null) => {
          if (!data || typeof data.mode !== "string" || typeof data.duration !== "number") return;
          const next: LocalSettings = {
            mode: data.mode as LocalSettings["mode"],
            duration: data.mode === "time" ? data.duration : DEFAULT_LOCAL_SETTINGS.duration,
            wordCount: data.mode === "words" ? data.duration : DEFAULT_LOCAL_SETTINGS.wordCount,
            punctuation: Boolean(data.punctuation),
            numbers: Boolean(data.numbers),
          };
          setSettings(next);
          saveLocalSettings(next);
        })
        .catch(() => {});
    }
  }, [status]);

  function handleChange(patch: Partial<LocalSettings>) {
    const next = { ...settings, ...patch };
    setSettings(next);
    saveLocalSettings(next);

    if (status === "authenticated") {
      fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(toApiPayload(next)),
      }).catch(() => {});
    }
  }

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-16">
      <h1 className="mb-2 text-h1">Settings</h1>
      <p className="mb-8 text-small text-muted-foreground">
        Changes save immediately — no need to press anything else.
      </p>
      {loaded ? (
        <ModeControls
          faded={false}
          mode={settings.mode}
          duration={settings.duration}
          wordCount={settings.wordCount}
          punctuation={settings.punctuation}
          numbers={settings.numbers}
          onChange={handleChange}
        />
      ) : (
        // Real layout shape, not a blank gap — matches qa-checklist.md's shimmer rule and
        // avoids the one-paint layout shift a conditional render would otherwise cause.
        <div className="mb-8 h-8 w-full animate-pulse rounded-md bg-muted" aria-hidden />
      )}
    </main>
  );
}
