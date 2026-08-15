# SpeedType — Build Progress

> Single source of truth for **what's actually built**, updated after every feature ships.
> Feature list and build order live in `CLAUDE.md` and `build-order-complete.md`.
> `[ ]` = not started · `[~]` = in progress · `[x]` = done & committed.

Last updated: 2026-08-16

---

## Setup gate (before any code)

- [x] `.claude/` docs in place
- [x] Git repo + GitHub remote (`main` only — no develop/staging tier)
- [x] Initial scaffold (build step 5) — Next.js 16 + TypeScript + Tailwind v4 + shadcn/ui,
      design tokens wired, Vitest + Playwright configured, `pnpm typecheck` + `pnpm test` green
- [ ] Phase 1 accounts created (GitHub ✅, Vercel, Neon, Google Cloud Console, PostHog)

---

## Phase 1 — Core typing engine, accounts & speed curve (6/13)

- [x] Database schema — auth, TypingTest, UserSettings
- [x] Auth — email/password + Google OAuth + guest mode
- [x] Design system implementation
- [x] Typing test engine core (passage gen, keystroke capture, WPM calc)
- [x] Test UI — caret, live highlighting, timer/word-count modes
- [x] Results screen
- [ ] Save test results — logged-in + guest local storage
- [ ] Test history page
- [ ] Speed curve chart
- [ ] Profile / dashboard
- [ ] Guest → account migration
- [ ] Settings panel
- [ ] Responsive & accessibility pass
- [ ] **Phase 1 QA gate passed + deployed** ✅

## Phase 2 — Subscriptions, premium analytics & growth (0/9)

- [ ] Stripe products/prices + checkout flow
- [ ] Stripe webhooks (idempotent) + Subscription table
- [ ] Billing portal
- [ ] Premium gating middleware
- [ ] Advanced analytics — accuracy trend, weak-key heatmap, consistency score
- [ ] Custom text sources
- [ ] Practice mode — weak-key drilling
- [ ] Data retention enforcement — Premium unlimited vs free 90-day
- [ ] Transactional email
- [ ] **Phase 2 QA gate passed + deployed** ✅

## Future scope — NOT scheduled

Build only after the core ships, and only on explicit confirmation.

### Leaderboards & multiplayer races
- [ ] Global/friends leaderboards
- [ ] Real-time multiplayer typing races

### Public profile pages
- [ ] Opt-in shareable public profile

### Team / classroom accounts
- [ ] Team workspace + instructor view

### Native mobile app
- [ ] Mobile app sharing the core typing engine

### Achievement badges
- [ ] Milestone-based badges
