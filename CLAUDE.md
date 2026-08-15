# SpeedType — CLAUDE.md

> **This file is the always-loaded brief.** Keep it short and stable. Detail lives in
> `.claude/docs/*` and is read on demand — see the pointer index at the bottom. When a doc
> and this file disagree, the doc wins.

## What this is

SpeedType is a typing speed test site: type a passage against the clock, see your WPM/accuracy
live, and build a history of every test so your speed curve over time is always visible. Free
users get the full core test loop forever; Premium subscribers get deeper analytics, weak-key
practice drills, and custom text sources.

**Core promise:** The test itself feels instant and alive — zero input lag, zero layout jank —
and your progress is never a mystery. Every test you take makes your speed curve more honest.

## Non-negotiable rules

1. **UI/UX is the top product priority, above feature velocity.** This product lives or dies on
   how the typing test *feels*. No layout shift, no janky animation, the caret and character
   highlighting update at input speed with zero perceptible lag. Every state (loading, empty,
   error) gets a real, designed treatment — never a bare unstyled fallback. See `design-system.md`,
   `ui-stack.md`, `ux-flows.md`.
2. **WPM / accuracy / consistency must be calculated exactly per the formulas in `ux-flows.md`,
   with no silent deviation.** This is the entire product — a wrong number destroys trust.
3. **A saved test result is immutable.** Once a `TypingTest` row is written, its stats are never
   recalculated or silently rewritten by a later migration or bugfix — the speed curve must stay
   trustworthy history, not a moving target.
4. **Stripe webhook handling is idempotent.** Every handler checks a processed-event log before
   acting. Never double-charge, never silently fail to grant or revoke Premium access.
5. **The free tier is genuinely useful, not crippled bait.** Free = the full core test engine,
   unlimited tests, capped history retention. Premium adds depth (analytics, drills, custom text),
   it never gates the core loop.
6. **TypeScript strict mode everywhere.** No `any`, no `@ts-ignore` — fix the type, don't silence it.
7. **Mobile-first.** Every screen, including the typing test itself, is fully usable at 375px,
   with a layout that accounts for the on-screen keyboard covering half the viewport.
8. **No secrets in code.** All keys via environment variables, never logged, never in client bundles.

## Build discipline

- **Build strictly in phase order. Never jump ahead** to a later phase's features.
- **Test + commit after every feature.**
- **Update `PROGRESS.md`** whenever a feature ships — it's the source of truth for what's built.

**How we build:** one feature = one branch off `main`, via **`/ship-feature`**:
plan → you approve → branch `feature/pN-<name>` → implement → local **`/code-review`**
(advisory) → verify (`tsc` + `vitest` + drive the flow in browser) → **show you the tested,
working result and wait for your explicit confirmation** → squash-merge into `main` → tick
`PROGRESS.md` → delete branch.

**Git rule:** the agent works only on `feature/*` / `fix/*` branches off `main`. It never
squash-merges a feature into `main` until you've explicitly confirmed the tested result — the
confirmation gate comes *after* testing, not just at the plan stage. Never force-push, ever.

## Tech stack (summary)

Next.js (App Router, currently v16) + TypeScript (strict) · Tailwind CSS v4 + shadcn/ui (Radix primitives) ·
Framer Motion for animation · Zustand for the typing-engine's real-time client state · Prisma +
Neon Postgres · Auth.js (NextAuth v5) with email/password + Google OAuth · Stripe subscriptions ·
Resend transactional email · PostHog analytics · Recharts for the speed-curve chart · Vercel
hosting · pnpm. Full env vars, accounts, decisions → `.claude/docs/infrastructure.md`.

## Phases (22 core features across 2 phases)

1. **Core typing engine, accounts & speed curve** (13) — ← current focus
2. **Subscriptions, premium analytics & growth** (9)

**Future scope (NOT scheduled — build only on confirmation):** leaderboards & multiplayer races,
public profile pages, team/classroom accounts, a native mobile app, achievement badges. See
`.claude/docs/future-scope.md` and `PROGRESS.md`.

Full per-feature build prompts → `build-order-complete.md`. Live status → `PROGRESS.md`.

---

## Doc index — read on demand

| When you're working on… | Read |
|---|---|
| Repo layout, where files go | `.claude/docs/project-structure.md` |
| Anything touching the database | `.claude/docs/database-schema.md` |
| Any API/server route | `.claude/docs/api-conventions.md` |
| Any UI — fonts, tokens (the styling authority) | `.claude/docs/design-system.md` |
| Which component library, how components get themed | `.claude/docs/ui-stack.md` |
| The typing-test flow, WPM formulas, results/history screens | `.claude/docs/ux-flows.md` |
| Dropping in a reference screenshot for a screen | `.claude/docs/ui-references.md` |
| Env vars, accounts, hosting, plans & limits | `.claude/docs/infrastructure.md` |
| Branches, per-feature git flow, promotion | `.claude/docs/git-workflow.md` |
| Testing approach | `.claude/docs/testing.md` |
| A feature's test cases | `.claude/docs/test-cases.md` |
| A QA / phase gate | `.claude/docs/qa-checklist.md` |
| Welcome/receipt/reminder emails | `.claude/docs/email-templates.md` |
| Deferred features or unactivated infra | `.claude/docs/future-scope.md` |
| What's built / what's next | `PROGRESS.md` |
| The exact per-feature build steps | `build-order-complete.md` |
