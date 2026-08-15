// Original practice sentences (not attributed quotes — avoids any copyright concern). Held in
// reserve for a future quote-sourced passage mode; word-mode/time-mode generation currently pulls
// from words.ts. See ui-stack.md / project-structure.md.
export const PRACTICE_SENTENCES = [
  "The best way to get faster at typing is to type every single day without worrying about your score.",
  "A steady rhythm will always beat a burst of speed followed by a string of careless mistakes.",
  "Good posture and a relaxed grip on the keyboard make a longer practice session much easier to sustain.",
  "Most typing errors come from rushing the next word before your fingers have finished the last one.",
  "Consistency matters more than raw speed when you are trying to build a habit that actually lasts.",
  "Every keyboard shortcut you learn today saves you a small amount of time for the rest of your life.",
  "Reading ahead of your fingers by a few words is one of the simplest ways to improve accuracy.",
  "A quiet room and a comfortable chair can make more difference to your practice than any app.",
] as const;

export function randomSentence(pool: readonly string[] = PRACTICE_SENTENCES): string {
  return pool[Math.floor(Math.random() * pool.length)];
}
