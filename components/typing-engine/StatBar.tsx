"use client";

import { calculateRawWpm } from "@/lib/wpm";
import type { EngineStatus, TestMode } from "@/store/typing-store";

function wordsRemaining(passage: string, currentIndex: number): number {
  const remainder = passage.slice(currentIndex).trim();
  if (!remainder) return 0;
  return remainder.split(/\s+/).length;
}

export function StatBar({
  status,
  startedAt,
  keystrokeCount,
  mode,
  target,
  passage,
  currentIndex,
}: {
  status: EngineStatus;
  startedAt: number | null;
  keystrokeCount: number;
  mode: TestMode;
  target: number;
  passage: string;
  currentIndex: number;
}) {
  const elapsedMs = startedAt ? Date.now() - startedAt : 0;
  const liveWpm = Math.round(calculateRawWpm(keystrokeCount, elapsedMs));

  const progress =
    mode === "time"
      ? Math.max(0, Math.ceil(target - elapsedMs / 1000))
      : wordsRemaining(passage, currentIndex);

  return (
    // Plain CSS transition on inline opacity, not Framer Motion — see Passage.tsx's caret /
    // ui-stack.md for why per-keystroke-frequency elements in this feature use CSS directly.
    <div
      className="mb-6 flex items-baseline gap-6 font-mono text-stat text-foreground"
      style={{ opacity: status === "idle" ? 0 : 1, transition: "opacity 150ms ease-out" }}
      aria-live="polite"
    >
      <div>
        <span>{liveWpm}</span>
        <span className="ml-1.5 text-stat-label text-muted-foreground">wpm</span>
      </div>
      <div>
        <span>{progress}</span>
        <span className="ml-1.5 text-stat-label text-muted-foreground">
          {mode === "time" ? "sec" : "words"}
        </span>
      </div>
    </div>
  );
}
