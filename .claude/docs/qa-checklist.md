# QA & Security Checklist

🔴 = launch blocker for the phase it applies to. Run via `/qa-gate`, scoped to whichever features
are actually built in the phase being gated.

## UI/UX quality (Phase 1+ — this is rule 1, treat it as seriously as security)

- 🔴 The typing test has zero visible input lag between a keystroke and the caret/highlight update, tested on a throttled CPU (Chrome DevTools 4x slowdown)
- 🔴 No layout shift (CLS) on the test page between idle, mid-test, and results states
- 🔴 Every screen (test, results, history, settings, pricing, auth) is fully usable at 375px width
- 🔴 Every loading state shows the real layout shape with shimmer, never a bare spinner on blank content
- Dark and light mode are both reviewed for every screen shipped this phase, not dark-only
- Live stat numbers (WPM, timer, accuracy) never visibly jitter in width while updating

## Auth & authorization

- 🔴 Wrong password on login shows a generic "invalid email or password" — never reveals whether the account exists
- 🔴 `/api/tests` POST rejects unauthenticated requests with 401
- 🔴 Session cookies are `httpOnly`, `secure` (prod), `sameSite=lax`
- Password reset / credential flows never leak whether an email is registered

## Access control (Phase 2+)

- 🔴 Premium-only features (advanced analytics, practice mode, custom text) are enforced by reading `Subscription.plan` server-side in the route handler — verified by hitting the route directly with a free-tier session and confirming a 403, not just hiding the UI
- 🔴 A canceled/expired subscription loses Premium access on its `currentPeriodEnd`, not immediately on cancellation (user paid for the period)

## Data isolation

- 🔴 `/api/tests` GET only ever returns the requesting user's own tests — verified with two accounts, confirm cross-account access is impossible even with a guessed test id
- 🔴 History retention limit (90 days free tier) is enforced in the query, and downgrading from Premium never deletes rows, only hides them from the free-tier query window

## Payments (Phase 2)

- 🔴 Stripe webhook signature is verified before any event is processed
- 🔴 A replayed webhook event (same `event.id`) is a no-op — verified by sending the same test event twice
- 🔴 Checkout → webhook → Premium access round trip works end-to-end in Stripe test mode
- 🔴 No route accepts `plan`, `status`, or any Stripe id as a client-writable field

## Privacy & data handling

- No secret (Stripe key, DB URL, NextAuth secret) appears in client bundle — grep the built `.next/` output
- `.env` / `.env.local` are git-ignored and never readable by the agent (`.claude/settings.json` deny rule)
- Guest local-storage test data is cleared after a successful import, never left duplicated

## Error handling

- Every API route's `catch` returns a generic message; the real error is `console.error`'d server-side only
- A failed background save (test result, email send) never blocks or breaks the user-facing action it's attached to

## Pre-launch sign-off

Before marking a phase's gate passed, run one adversarial pass end to end: try to save a test
result while logged out (should 401, not silently succeed), try to view another account's history
by guessing/incrementing an id, try to access a Premium route on a free account via direct API call
(not the UI), and — Phase 2 only — replay a captured webhook payload twice and confirm the second
delivery is a no-op. Fix anything that doesn't behave exactly as specified above before shipping.
