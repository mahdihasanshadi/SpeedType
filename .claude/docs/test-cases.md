# Test Cases

Source of truth for what each feature's tests actually cover — cases here mirror `it(...)` names
in the co-located test files. Pre-seed a case list here before a feature is built if you already
know the shape (Phase 1's core engine has enough detail to pre-seed a few); leave everything else
`_TBD at build time._` and fill in during that feature's `/ship-feature` plan-approval step.

`[ ]` not written · `[x]` test is green

## Phase 1

### Typing test engine core
- [ ] Net WPM matches the formula in `ux-flows.md` for a known keystroke sequence (hand-computed fixture)
- [ ] Raw WPM includes mistyped characters, Net WPM excludes them
- [ ] Accuracy = correct keystrokes / total keystrokes, rounded to 1 decimal
- [ ] Consistency formula produces 100 for perfectly even per-second WPM samples, and drops for bursty input
- [ ] Timer does not start until the first keydown
- [ ] Test ends exactly at the configured duration (time mode) or word count (words mode)

### Test UI (caret, highlighting)
- [ ] Each character renders one of `pending` / `correct` / `incorrect` — no fourth state leaks
- [ ] Caret position updates on every keystroke with no dropped frames on a fast/pasted input burst
- _Further cases: TBD at build time._

### Results screen
- [ ] Displays Net WPM, Raw WPM, Accuracy, Consistency, and character breakdown for a completed test
- [ ] Guest test writes to local storage, capped at 20 entries (oldest evicted)
- [ ] Logged-in test POSTs to `/api/tests` without blocking the results render

### Auth
- _TBD at build time._

### History / speed curve
- _TBD at build time._

### Guest → account migration
- [ ] Signing up with N guest tests in local storage imports exactly N tests and shows that count in the toast
- _Further cases: TBD at build time._

## Phase 2

_TBD at build time — pre-seed once Phase 1 ships and Phase 2 features are about to start._
