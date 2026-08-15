# Testing

## Tooling

| Layer | Tool | Command |
|---|---|---|
| Unit / component | Vitest + React Testing Library | `pnpm test` |
| End-to-end | Playwright | `pnpm test:e2e` |
| Type check | `tsc --noEmit` | `pnpm typecheck` |

## The rhythm

Tests are authored **per feature, at build time** — never pre-written in bulk. What exists in the
test suite should always equal what's actually built; a fat suite of tests for unbuilt features is
worse than no suite.

**The loop, every feature:**
1. During plan approval (`/ship-feature` step 1), agree the feature's concrete test cases and
   record them under that feature's heading in `test-cases.md`.
2. Write the co-located test file(s) implementing exactly those cases — one `it(...)` per case,
   names matching.
3. Run `pnpm typecheck && pnpm test` — must be green.
4. **Drive the actual feature by hand in the browser** for anything UI/UX or security/payment
   critical. Green tests prove the logic; they don't prove the caret doesn't stutter or that a
   checkout redirect actually lands on Stripe's page. Given `CLAUDE.md` rule 1, this manual pass is
   not optional for any user-facing screen.
5. Tick each case `[x]` in `test-cases.md` as its test goes green.

## Co-location convention

`lib/wpm.ts` → `lib/wpm.test.ts`, `components/typing-engine/Passage.tsx` →
`components/typing-engine/Passage.test.tsx`. Never a parallel `__tests__/` tree that drifts from
the source it covers.

## e2e coverage

Playwright covers the flows where timing and real browser input matter and a unit test can't
catch a regression: taking a full test end-to-end (type a known string, assert the exact WPM/
accuracy result), the guest → signup migration, and the Stripe checkout → webhook → premium-access
round trip (using Stripe's test mode).

## What does NOT get re-tested per feature

Cross-cutting rules — auth-required routes rejecting unauthenticated requests, no-secret-leak in
error responses, generic error messages — are covered once in the Phase QA gate
(`qa-checklist.md`), not re-verified in every feature's own test file.
