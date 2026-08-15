// THE single implementation of the formulas in .claude/docs/ux-flows.md. Every stat shown to a
// user, saved to a TypingTest row, or computed for analytics must go through these functions —
// never re-derive WPM/accuracy/consistency inline elsewhere (CLAUDE.md rule 2).

export type Keystroke = {
  char: string;
  correct: boolean;
  timestamp: number;
};

export type CharStats = {
  correct: number;
  incorrect: number;
  extra: number;
  missed: number;
};

/** Raw WPM includes mistakes: every keystroke counts, correct or not. */
export function calculateRawWpm(totalKeystrokes: number, elapsedMs: number): number {
  if (elapsedMs <= 0) return 0;
  const minutes = elapsedMs / 60_000;
  return totalKeystrokes / 5 / minutes;
}

/** Net WPM — the headline "WPM" — excludes mistakes. */
export function calculateNetWpm(correctKeystrokes: number, elapsedMs: number): number {
  if (elapsedMs <= 0) return 0;
  const minutes = elapsedMs / 60_000;
  return correctKeystrokes / 5 / minutes;
}

/** Rounded to 1 decimal, per ux-flows.md. */
export function calculateAccuracy(correctKeystrokes: number, totalKeystrokes: number): number {
  if (totalKeystrokes <= 0) return 0;
  return Math.round((correctKeystrokes / totalKeystrokes) * 1000) / 10;
}

/**
 * 100 - (stddev / mean * 100) over once-per-second raw WPM samples, clamped to [0, 100].
 * Fewer than 2 samples (a very short test) can't show bursts either way — treat as perfectly
 * consistent rather than dividing by a near-meaningless sample set.
 */
export function calculateConsistency(rawWpmSamples: number[]): number {
  if (rawWpmSamples.length < 2) return 100;

  const mean = rawWpmSamples.reduce((sum, x) => sum + x, 0) / rawWpmSamples.length;
  if (mean === 0) return 100;

  const variance =
    rawWpmSamples.reduce((sum, x) => sum + (x - mean) ** 2, 0) / rawWpmSamples.length;
  const stddev = Math.sqrt(variance);
  const consistency = 100 - (stddev / mean) * 100;

  return Math.max(0, Math.min(100, Math.round(consistency * 10) / 10));
}

/**
 * `correct`/`incorrect` count every keystroke *attempt* (a mistake that's later backspaced and
 * retyped still counts against accuracy — standard typing-test convention). `missed` is
 * position-based — passage characters never reached when the timer cut the test off early — so
 * it needs the final cursor position separately from the keystroke log, since backspace-and-retry
 * can make `keystrokes.length` larger than the passage itself.
 * `extra` is always 0 in this MVP — typing past the passage boundary isn't supported yet.
 */
export function calculateCharStats(
  keystrokes: Keystroke[],
  finalIndex: number,
  passageLength: number,
): CharStats {
  const correct = keystrokes.filter((k) => k.correct).length;
  const incorrect = keystrokes.length - correct;
  const missed = Math.max(0, passageLength - finalIndex);
  return { correct, incorrect, extra: 0, missed };
}
