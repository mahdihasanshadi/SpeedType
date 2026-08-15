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

### Profile / dashboard
- [x] `GET /api/tests/summary` rejects unauthenticated requests with 401
- [x] Returns `null` (not 0/NaN) for personal-best/averages when the user has zero tests, and `totalTests`/`currentStreak` as 0
- [x] Personal best, average WPM, and total count computed correctly from real rows (verified via `_max`/`_avg`/`_count` aggregation)
- [x] `calculateStreak`: 0 with no tests; counts today alone as 1; still counts as current if today has no test yet but yesterday does; breaks if both today and yesterday are missing; stops at the first gap; same-day duplicates count once
- [x] Dashboard shows an em dash for null personal-best/averages rather than crashing or showing "null"
- [x] Dashboard stays on its loading skeleton instead of crashing if the summary fetch fails or returns an error shape (a real latent bug caught by testing — the component originally assumed every response was well-formed)
- [x] Verified live end to end: a new personal best (259 wpm) correctly overtakes an older, lower test (78 wpm); avg wpm computed correctly as their mean

### Guest → account migration
- [x] Signing up with N guest tests in local storage imports exactly N tests and shows that count
      in the toast (verified live: 3 guest tests → sign up → "Imported 3 tests from this device."
      → local storage cleared → all 3 present via `GET /api/tests`)
- [x] `POST /api/tests/import` rejects unauthenticated requests with 401, an empty array or more
      than 20 tests with 400, and an unparseable `createdAt` with 400
- [x] Imported tests preserve their original `createdAt` (when actually taken as a guest), not the import time
- [x] Fires uniformly on any authenticated session (signup, login, or OAuth), not duplicated per page
- [x] Does nothing when there are no guest tests to migrate, or while still unauthenticated
- [x] Local storage is left untouched if the import request fails, so nothing is silently lost

### Settings panel
- [x] Changing a setting saves immediately, no Save button (verified live and in tests)
- [x] Guest: setting persists to local storage across a full reload (verified live)
- [x] Logged-in: setting also syncs to `UserSettings` via `POST /api/settings`, and survives on a
      simulated second device — local storage cleared, page reloaded, correct values loaded from
      the DB instead (verified live: `mode=words, duration=100, numbers=true` round-tripped exactly)
- [x] `GET /api/settings` returns sensible defaults when no row exists yet, not null/error
- [x] `POST /api/settings` accepts a partial update (e.g. `{theme}` alone) without clobbering the
      other fields — the ThemeToggle uses exactly this to sync theme for a logged-in user without
      needing to know the rest of the settings shape
- [x] Both auth and unauth requests to `GET`/`POST /api/settings` are rejected/allowed correctly (401 gate)
- [x] The Test UI page loads whatever settings were last saved for the device on mount, and its
      own inline mode controls persist changes the same way as the dedicated Settings page
- [x] ThemeToggle syncs to the server only when authenticated, never for a guest

### Responsive & accessibility pass
- [x] Home, login, signup, settings, and history all expose a real `<h1>` (verified via live DOM
      inspection) — home's is `sr-only` since the visible title lives in the typing UI itself
- [x] Settings page shows a real loading skeleton (not a blank gap) before mode controls hydrate
- [x] No horizontal overflow (`scrollWidth === clientWidth`) and no clipped/off-screen interactive
      elements at 375px on home, login, signup, settings, and history (guest view, populated with
      8 seeded rows) — verified live via bounding-rect sweep, not just visual inspection
- [x] History rows stay single-line and don't overlap at 375px even with a full date/config/wpm/accuracy row
- [x] Tab-order correctly moves focus through interactive elements (verified live: input → mode
      control buttons)
- [x] All icon-only buttons (theme toggle) carry an `aria-label`; every other button has visible
      text as its accessible name — verified via a repo-wide sweep of `<Button` usages
- [x] `e2e/typing-flow.spec.ts` (new Playwright coverage this feature — the "vitest + playwright"
      testing stack had e2e configured but no specs written yet):
  - A full test typed entirely via `page.keyboard` (no mouse) completes and shows 100% accuracy,
    at both desktop and 375px width
  - Real keyboard `Enter` and `Space` correctly toggle `aria-pressed` on `ModeControls` pill
    buttons — this **disproves** an earlier false alarm from manual browser-automation testing
    (the automation tool's synthetic key events shipped with empty `key`/`code` strings, which
    Blink's native button-activation code silently ignores; real keyboard input has no such gap)
  - Idle → running → results produces effectively zero cumulative layout shift (`< 0.01`, 10x
    stricter than web-vitals' own "good" 0.1 threshold)
- [x] Fixed two real (if minor — CLS score 0.0058) layout-shift sources found via the above test:
  `app/page.tsx`'s `<main>` used `justify-center` for vertical centering, which re-centers (and
  visibly shifts) the whole block once Results grows the content height — changed to a fixed
  `pt-24` top offset instead. Separately, the "Press Esc to restart" hint sat *after* `Results` in
  `TypingTest.tsx`'s JSX, so it got pushed down when Results rendered — reordered so the hint comes
  first and Results only ever appends below it.

### Site header — nav + profile menu
_Ad-hoc UI addition, not in the original Phase 1 feature list — added because the app had zero
persistent navigation (only a floating ThemeToggle button), so a logged-in user had no visible
indication they were signed in and no way to reach Settings/History except by typing the URL._
- [x] Unauthenticated: header shows Log in / Sign up controls, no account menu
- [x] Loading (session resolving): shows a skeleton, not a flash of the guest or authenticated state
- [x] Authenticated: shows an avatar button with initials derived from the user's name (first+last
      initial), falling back to the first two characters of their email when they have no name
      (credentials signup's name field is optional)
- [x] The account dropdown shows the user's name/email, and History / Settings / Sign out — Sign
      out calls `signOut({ callbackUrl: "/" })`
- [x] History remains reachable at 375px for guests via a compact icon-only link — the text nav is
      desktop-only and guests have no dropdown to put it in
- [x] No horizontal overflow at 375px with the header in either auth state
- Real bugs caught before shipping (found via live browser testing, not just unit tests):
  `DropdownMenuLabel` crashed the whole page with an uncaught `MenuGroupContext is missing` error
  when used outside a `DropdownMenuGroup` — Base UI requires it, unlike some other dropdown-menu
  implementations. Also had `nativeButton={false}` backwards on the avatar trigger — it renders a
  `<Button>` (a real `<button>`), so it needed `nativeButton={true}` (the default), not `false`;
  `false` is only correct where the `render` target is a non-button element like `<Link>`.

## Phase 2

_TBD at build time — pre-seed once Phase 1 ships and Phase 2 features are about to start._
