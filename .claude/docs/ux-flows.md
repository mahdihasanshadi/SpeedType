# UX Flows — the core loop

This is the product. Everything else (auth, billing, settings) exists to support this loop being
as good as it can be. Read `design-system.md` and `ui-stack.md` alongside this file when building
any screen below.

## The formulas (exact — never deviate, see `CLAUDE.md` rule 2)

- **Words** := `charactersTyped / 5` (standard word-length convention, not actual space-separated words)
- **Raw WPM** := `(allCharactersTyped / 5) / minutesElapsed` — includes mistakes
- **Net WPM** (the headline number, labeled "WPM" everywhere) := `(correctCharacters / 5) / minutesElapsed`
- **Accuracy** := `(correctKeystrokes / totalKeystrokes) * 100`, rounded to 1 decimal
- **Consistency** := sample raw WPM once per second during the test → `100 - (stddev(samples) / mean(samples) * 100)`, clamped to `[0, 100]`. Low consistency = bursty typing even if the average is high.
- **Timer starts on the first keydown**, not on page load or test-screen mount. Idle time staring
  at the passage before typing never counts against the user.

## Flow 1 — Take a test (the core loop)

1. **Landing / test page** (same page — the test *is* the landing page, no separate marketing
   splash blocking it). Default mode: 30s timed, no punctuation, no numbers. Passage is
   server-selected and pre-rendered — no loading spinner before a test can start.
2. User starts typing into a hidden, always-focused input. **First keydown starts the timer.**
   Caret slides to the next character position (Framer Motion, ~80ms). Each character flips to
   `correct` / `incorrect` state instantly — no debounce, no batching.
3. A minimal stat readout (WPM so far, time/words remaining) fades in in a corner **only after the
   first keystroke** — before that, the passage is the only thing on screen, per the "passage is
   the centerpiece" rule.
4. Test ends when the timer hits 0 (timed mode) or the last character is typed (word-count mode).
   Screen transitions to Results over 200–300ms (spring, not a hard cut).
5. **Esc or a visible "Restart" control resets the same settings at any time** — must never require
   a full page reload.

## Flow 2 — Results

Shown immediately, no loading state — all stats are computed client-side from the keystroke log,
nothing waits on a network round-trip:

- **Net WPM** — the headline, rendered at `text-stat` size.
- Raw WPM, Accuracy %, Consistency %, and a compact correct/incorrect/extra/missed character count.
- Primary action: **"Next test"** (same settings, new passage). Secondary: change mode.
- **Save is optimistic and invisible.** Logged-in: the result POSTs in the background the instant
  the test ends; the results screen never blocks on that request or shows a "saving…" spinner. If
  the save fails, retry silently once, then surface a small non-blocking "Couldn't save this
  result" toast with a manual retry — never lose the result silently.
- **Guest (not logged in):** result is appended to a capped local-storage list (last 20 tests) plus
  a low-key banner: *"Sign up to keep this — and every test — in your speed curve forever."*

## Flow 3 — History & speed curve

- **History**: reverse-chronological list of saved tests (date, mode, WPM, accuracy). Free tier
  retains the **last 90 days**; Premium retains **everything** (see `infrastructure.md` for the
  exact limits table). Pagination, not infinite scroll with no end state.
- **Speed curve**: a Recharts line chart, WPM per test as points, with a rolling 10-test average as
  a second smoothed line so noise doesn't obscure the trend. Filters: mode (time/words), range
  (7d / 30d / 90d / all — "all" only meaningfully differs from 90d for Premium).
- Loading state while chart data fetches: the chart's own axes/gridlines render immediately as a
  shimmering skeleton in the real chart shape (never a blank box or bare spinner), with the label
  *"Loading your speed curve…"* only if the fetch exceeds ~400ms.

## Flow 4 — Guest → account migration

On signup or login, if local-storage guest tests exist: POST them for import, merge into the new
account, clear local storage, then show a toast with the **exact count**: *"Imported 12 tests from
this device."* Never say "some tests" or omit the number — the whole product's premise is honest
numbers.

## Settings panel

Mode (time / words), duration or word-count, punctuation toggle, numbers toggle, custom text
(Premium, Phase 2). **Every setting saves immediately on change (optimistic, no Save button)** — to
a cookie/local-storage for guests, synced to the DB in the background for logged-in users so
preferences follow them across devices. No setting ever requires an explicit "Save" action; this is
a preferences panel, not a form.
