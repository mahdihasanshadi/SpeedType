# Test Cases

Source of truth for what each feature's tests actually cover — cases here mirror `it(...)` names
in the co-located test files. Pre-seed a case list here before a feature is built if you already
know the shape (Phase 1's core engine has enough detail to pre-seed a few); leave everything else
`_TBD at build time._` and fill in during that feature's `/ship-feature` plan-approval step.

`[ ]` not written · `[x]` test is green

## Phase 1

### Design system — theme toggle
- [x] Toggling switches the `dark` class on `<html>` and persists the choice to `localStorage`
- [x] No saved choice on first visit follows system `prefers-color-scheme` (verified live — light system preference rendered light, not the dark default)
- [x] The choice survives a full page reload (verified live)

### Typing test engine core
- [x] Net WPM matches the formula in `ux-flows.md` for a known keystroke sequence (hand-computed fixture)
- [x] Raw WPM includes mistyped characters, Net WPM excludes them
- [x] Accuracy = correct keystrokes / total keystrokes, rounded to 1 decimal
- [x] Consistency formula produces 100 for perfectly even per-second WPM samples, and drops for bursty input
- [x] Timer does not start until the first keydown
- [x] Test ends exactly at the configured duration (time mode) or word count (words mode)
- [x] Backspace resets the previous character to pending and moves the cursor back
- [x] `missed` char-stat is position-based (final cursor index), not keystroke-count-based, so a corrected mistake doesn't inflate it
- [x] Word passage generator produces exactly the requested word count; time-mode passages always have more words than a 150 WPM typist could exhaust
- [x] Punctuation option capitalizes sentence starts and ends with a period; numbers option occasionally substitutes a digit token

### Test UI (caret, highlighting)
- [x] Each character renders one of `pending` / `correct` / `incorrect` — no fourth state leaks
- [x] Caret position updates on every keystroke (verified live: `translate()` tracks the exact
      character-width offset; no dropped frames across every keydown dispatched during manual testing)
- [x] Backspace reverts the previous character to `pending`
- [x] Escape restarts with a fresh, all-pending passage at any point, mid-test or idle
- [x] Live stat readout is invisible (opacity 0) while idle, visible once running
- [x] Clicking a mode/duration/word-count/punctuation/numbers control regenerates the passage
- [x] Completing a words-mode passage shows the finished-state results (WPM, accuracy, "Next test")
- [x] No horizontal overflow and typing still registers correctly at 375px (verified live)
- Known simplification: keystroke capture is `keydown`-based (matches how every major
  browser-based typing test works); mobile IME/predictive-keyboard edge cases beyond basic Latin
  character entry are not specifically hardened — revisit only if real usage surfaces an issue.

### Results screen
- [x] Displays Net WPM (headline), Raw WPM, Accuracy, Consistency, and the full correct/incorrect/
      extra/missed character breakdown, matching `lib/wpm.ts`'s output exactly (verified live:
      50-char passage with one deliberate mistake produced 49 correct / 1 incorrect / 0 extra / 0 missed)
- [x] "Next test" restarts with the same mode/settings and a fresh, all-pending passage
- [x] Guest test writes to local storage, capped at 20 entries (oldest evicted, newest first)
- [x] Logged-in test POSTs to `/api/tests` and saves the real database row (verified live end to
      end: signup → complete a test → 201 response → row confirmed via the API's own test)
- [x] `POST /api/tests` rejects unauthenticated requests with 401, invalid payloads with 400
- [x] Guest sees the "Sign up to keep this" banner; logged-in users don't
- [x] A failed save silently retries once, then surfaces a toast only if the retry also fails
      (verified live via a stale-session edge case that hit this exact path — see infrastructure.md)

### Auth
- [x] Signup creates a User with a bcrypt `passwordHash`, never the plaintext password
- [x] Signup rejects a duplicate email with 409
- [x] Signup rejects an invalid email / too-short password with 400
- [x] Login with the correct password establishes a session (verified live in browser)
- [x] Login with the wrong password shows a generic "Invalid email or password" (verified live — never reveals whether the account exists, per qa-checklist.md)
- [x] Google OAuth button redirects to the real Google consent screen with the correct client (verified live)
- [x] An unauthenticated visitor can load the app without any forced signup wall (guest mode)

### History / speed curve
- [x] `GET /api/tests` rejects unauthenticated requests with 401
- [x] Returns tests newest-first, paginated (`pageSize` 20), with `hasMore` reflecting whether a next page exists
- [x] Excludes rows older than the 90-day free-tier retention window
- [x] Guest history reads from local storage (no API call), shows an empty state and the sign-up nudge
- [x] Logged-in history fetches from the API; Previous disabled on page 1, Next disabled when `hasMore` is false
- [x] Verified live end to end: 3 real saved tests rendered newest-first with correct date/mode/WPM/accuracy
- [x] Rolling 10-test average shrinks gracefully for fewer than 10 points instead of returning null
- [x] Mode and range filters re-fetch with the correct query params (verified live: filtering to a mode with zero matching tests shows the empty state)
- [x] Chart colors resolve to the exact design tokens, not library defaults (verified live: accent line `rgb(139,124,246)` = `#8B7CF6`, rolling-average line `rgb(155,161,170)` = `#9BA1AA`, both exact dark-mode token matches)
- [x] `range` narrower than the 90-day retention window further excludes rows within that window; `pageSize` is capped at 200 server-side

### Guest → account migration
- [ ] Signing up with N guest tests in local storage imports exactly N tests and shows that count in the toast
- _Further cases: TBD at build time._

## Phase 2

_TBD at build time — pre-seed once Phase 1 ships and Phase 2 features are about to start._
