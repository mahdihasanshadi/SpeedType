const DAY_MS = 24 * 60 * 60 * 1000;

function dayKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/**
 * Consecutive days (ending today) with at least one test. A test today isn't required for the
 * streak to still be "current" — only a full missed day (no test yesterday either) breaks it,
 * same convention as most streak-tracking apps.
 */
export function calculateStreak(testDates: Date[], now: Date = new Date()): number {
  const days = new Set(testDates.map(dayKey));

  let cursor = new Date(now);
  if (!days.has(dayKey(cursor))) {
    cursor = new Date(cursor.getTime() - DAY_MS);
    if (!days.has(dayKey(cursor))) return 0;
  }

  let streak = 0;
  while (days.has(dayKey(cursor))) {
    streak++;
    cursor = new Date(cursor.getTime() - DAY_MS);
  }
  return streak;
}
