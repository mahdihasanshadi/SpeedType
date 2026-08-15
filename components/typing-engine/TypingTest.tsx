"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { generatePassage } from "@/lib/texts/generate";
import { useTypingStore, type TestMode } from "@/store/typing-store";
import { Passage } from "./Passage";
import { StatBar } from "./StatBar";
import { ModeControls } from "./ModeControls";

type Settings = {
  mode: TestMode;
  duration: number;
  wordCount: number;
  punctuation: boolean;
  numbers: boolean;
};

const DEFAULT_SETTINGS: Settings = {
  mode: "time",
  duration: 30,
  wordCount: 25,
  punctuation: false,
  numbers: false,
};

export function TypingTest() {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const inputRef = useRef<HTMLInputElement>(null);
  const [, forceTick] = useState(0);

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

  // Load the very first passage on mount.
  useEffect(() => {
    restart(DEFAULT_SETTINGS);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  function handleSettingsChange(patch: Partial<Settings>) {
    const next = { ...settings, ...patch };
    setSettings(next);
    restart(next);
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

      {status === "finished" && result && (
        <div className="mt-10 flex animate-in items-center gap-8 fade-in slide-in-from-bottom-2 duration-300 ease-out">
          <div>
            <div className="text-stat font-mono">{Math.round(result.netWpm)}</div>
            <div className="text-stat-label text-muted-foreground">wpm</div>
          </div>
          <div>
            <div className="text-stat font-mono">{result.accuracy}%</div>
            <div className="text-stat-label text-muted-foreground">accuracy</div>
          </div>
          <Button type="button" onClick={() => restart()}>
            Next test
          </Button>
        </div>
      )}

      <p className="mt-8 text-small text-muted-foreground">
        Press <kbd className="rounded border border-border px-1">Esc</kbd> to restart at any time.
      </p>
    </div>
  );
}
