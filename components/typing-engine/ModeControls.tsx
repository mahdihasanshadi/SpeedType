"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { TestMode } from "@/store/typing-store";

const DURATIONS = [15, 30, 60, 120];
const WORD_COUNTS = [10, 25, 50, 100];

function Pill({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <Button
      type="button"
      variant={active ? "secondary" : "ghost"}
      size="sm"
      onClick={onClick}
      aria-pressed={active}
    >
      {children}
    </Button>
  );
}

export function ModeControls({
  faded,
  mode,
  duration,
  wordCount,
  punctuation,
  numbers,
  onChange,
}: {
  faded: boolean;
  mode: TestMode;
  duration: number;
  wordCount: number;
  punctuation: boolean;
  numbers: boolean;
  onChange: (next: {
    mode?: TestMode;
    duration?: number;
    wordCount?: number;
    punctuation?: boolean;
    numbers?: boolean;
  }) => void;
}) {
  return (
    // Plain CSS transition on inline opacity — see ui-stack.md.
    <div
      className="mb-8 flex flex-wrap items-center gap-2"
      style={{ opacity: faded ? 0.35 : 1, transition: "opacity 150ms ease-out" }}
    >
      <Pill active={punctuation} onClick={() => onChange({ punctuation: !punctuation })}>
        @ punctuation
      </Pill>
      <Pill active={numbers} onClick={() => onChange({ numbers: !numbers })}>
        # numbers
      </Pill>

      <span className={cn("mx-1 h-4 w-px bg-border")} />

      <Pill active={mode === "time"} onClick={() => onChange({ mode: "time" })}>
        time
      </Pill>
      <Pill active={mode === "words"} onClick={() => onChange({ mode: "words" })}>
        words
      </Pill>

      <span className="mx-1 h-4 w-px bg-border" />

      {mode === "time"
        ? DURATIONS.map((d) => (
            <Pill key={d} active={duration === d} onClick={() => onChange({ duration: d })}>
              {d}
            </Pill>
          ))
        : WORD_COUNTS.map((w) => (
            <Pill key={w} active={wordCount === w} onClick={() => onChange({ wordCount: w })}>
              {w}
            </Pill>
          ))}
    </div>
  );
}
