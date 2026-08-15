"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { generatePassage } from "@/lib/texts/generate";
import { saveGuestTest } from "@/lib/guest-tests";
import {
  DEFAULT_LOCAL_SETTINGS,
  getLocalSettings,
  saveLocalSettings,
  type LocalSettings,
} from "@/lib/local-settings";
import { useTypingStore, type TestResult } from "@/store/typing-store";
import { Passage } from "./Passage";
import { StatBar } from "./StatBar";
import { ModeControls } from "./ModeControls";
import { Results } from "./Results";

type Settings = LocalSettings;

function toSettingsApiPayload(settings: Settings) {
  return {
    mode: settings.mode,
    duration: settings.mode === "time" ? settings.duration : settings.wordCount,
    punctuation: settings.punctuation,
    numbers: settings.numbers,
  };
}

async function postTest(payload: object): Promise<boolean> {
  try {
    const res = await fetch("/api/tests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return res.ok;
  } catch {
    return false;
  }
}

/** Optimistic save for a logged-in user — never blocks the results render. Retries once
 * silently; only surfaces a toast (with a manual retry action) if the retry also fails. */
async function saveLoggedInResult(payload: object) {
  if (await postTest(payload)) return;
  if (await postTest(payload)) return;
  toast.error("Couldn't save this result", {
    action: { label: "Retry", onClick: () => saveLoggedInResult(payload) },
  });
}

export function TypingTest() {
  const [settings, setSettings] = useState<Settings>(DEFAULT_LOCAL_SETTINGS);
  const inputRef = useRef<HTMLInputElement>(null);
  const [, forceTick] = useState(0);
  const savedResultRef = useRef<TestResult | null>(null);
  const { status: sessionStatus } = useSession();

  const passage = useTypingStore((s) => s.passage);
  const charStates = useTypingStore((s) => s.charStates);
  const currentIndex = useTypingStore((s) => s.currentIndex);
  const status = useTypingStore((s) => s.status);
  const startedAt = useTypingStore((s) => s.startedAt);
  const keystrokeCount = useTypingStore((s) => s.keystrokes.length);
  const mode = useTypingStore((s) => s.mode);
  const target = useTypingStore((s) => s.target);
  const result = useTypingStore((s) => s.result);

  const restart = useCallback(
    (next: Settings = settings) => {
      const target = next.mode === "time" ? next.duration : next.wordCount;
      const generated = generatePassage(next.mode, target, {
        punctuation: next.punctuation,
        numbers: next.numbers,
      });
      useTypingStore.getState().loadPassage(generated, next.mode, target);
      inputRef.current?.focus();
    },
    [settings],
  );

  // Load the very first passage on mount, using whatever settings were last saved for this
  // device — a guest's or logged-in user's choices from the Settings page carry over here.
  useEffect(() => {
    const local = getLocalSettings();
    setSettings(local);
    restart(local);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // For a logged-in user, the DB is the cross-device source of truth — reconcile once the
  // session resolves. Only matters if another device changed settings since this one last synced.
  useEffect(() => {
    if (sessionStatus !== "authenticated") return;
    fetch("/api/settings")
      .then((res) => (res.ok ? res.json() : null))
      .then(
        (data: { mode?: string; duration?: number; punctuation?: boolean; numbers?: boolean } | null) => {
          if (!data || typeof data.mode !== "string" || typeof data.duration !== "number") return;
          const next: Settings = {
            mode: data.mode as Settings["mode"],
            duration: data.mode === "time" ? data.duration : DEFAULT_LOCAL_SETTINGS.duration,
            wordCount: data.mode === "words" ? data.duration : DEFAULT_LOCAL_SETTINGS.wordCount,
            punctuation: Boolean(data.punctuation),
            numbers: Boolean(data.numbers),
          };
          setSettings(next);
          saveLocalSettings(next);
          if (useTypingStore.getState().status === "idle") restart(next);
        },
      )
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionStatus]);

  // Once-per-second store tick (consistency sampling + time-mode expiry) plus a faster local
  // re-render tick so the live WPM/timer readout updates smoothly, not just once a second.
  useEffect(() => {
    if (status !== "running") return;
    const storeTick = setInterval(() => useTypingStore.getState().tick(), 1000);
    const displayTick = setInterval(() => forceTick((t) => t + 1), 200);
    return () => {
      clearInterval(storeTick);
      clearInterval(displayTick);
    };
  }, [status]);

  // Save the instant a test finishes — optimistic for logged-in users (never blocks the
  // results render), local storage for guests. Guarded by ref so a re-render doesn't re-save.
  // sessionStatus can still be "loading" the moment a test finishes (the session fetch is async
  // and unrelated to how fast someone types) — wait for it to resolve one way or the other
  // before marking this result as saved, otherwise a fast finish can race a slow session fetch
  // and the result never gets saved at all.
  useEffect(() => {
    if (status !== "finished" || !result || savedResultRef.current === result) return;
    if (sessionStatus === "loading") return;
    savedResultRef.current = result;

    const payload = {
      ...result,
      punctuation: settings.punctuation,
      numbers: settings.numbers,
    };

    if (sessionStatus === "authenticated") {
      void saveLoggedInResult(payload);
    } else {
      saveGuestTest(payload);
    }
  }, [status, result, sessionStatus, settings.punctuation, settings.numbers]);

  function handleSettingsChange(patch: Partial<Settings>) {
    const next = { ...settings, ...patch };
    setSettings(next);
    restart(next);
    saveLocalSettings(next);

    if (sessionStatus === "authenticated") {
      fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(toSettingsApiPayload(next)),
      }).catch(() => {});
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Escape") {
      e.preventDefault();
      restart();
      return;
    }
    if (e.ctrlKey || e.metaKey || e.altKey) return;

    if (e.key === "Backspace") {
      e.preventDefault();
      useTypingStore.getState().backspace();
      return;
    }
    if (e.key.length === 1) {
      e.preventDefault();
      useTypingStore.getState().typeChar(e.key);
    }
  }

  return (
    <div
      className="mx-auto w-full max-w-3xl px-4 py-16"
      onClick={() => inputRef.current?.focus()}
    >
      <input
        ref={inputRef}
        type="text"
        autoFocus
        autoComplete="off"
        autoCapitalize="off"
        autoCorrect="off"
        spellCheck={false}
        aria-label="Typing test input"
        className="absolute h-px w-px opacity-0"
        onKeyDown={handleKeyDown}
        onPaste={(e) => e.preventDefault()}
        onChange={() => {}}
        value=""
      />

      <ModeControls
        faded={status === "running"}
        mode={settings.mode}
        duration={settings.duration}
        wordCount={settings.wordCount}
        punctuation={settings.punctuation}
        numbers={settings.numbers}
        onChange={handleSettingsChange}
      />

      <StatBar
        status={status}
        startedAt={startedAt}
        keystrokeCount={keystrokeCount}
        mode={mode}
        target={target}
        passage={passage}
        currentIndex={currentIndex}
      />

      {passage && (
        <Passage passage={passage} charStates={charStates} currentIndex={currentIndex} />
      )}

      <p className="mt-8 text-small text-muted-foreground">
        Press <kbd className="rounded border border-border px-1">Esc</kbd> to restart at any time.
      </p>

      {status === "finished" && result && (
        <Results
          result={result}
          onNextTest={() => restart()}
          isGuest={sessionStatus === "unauthenticated"}
        />
      )}
    </div>
  );
}
