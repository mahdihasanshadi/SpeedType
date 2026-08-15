# Infrastructure

Decisions recorded here so they aren't re-guessed each session.

## Decisions

| Concern | Decision | Reason |
|---|---|---|
| Postgres host | Neon | Serverless Postgres, branch-per-PR for preview deploys, generous free tier, pairs cleanly with Vercel |
| Auth | Auth.js v5 (NextAuth), Prisma adapter, Credentials (email/password) + Google OAuth | Full control over the auth UI — a hosted auth widget is much harder to retheme to `design-system.md`, and UI is rule 1 |
| Testing | Vitest + React Testing Library (unit/component) · Playwright (e2e) | Fast unit loop day-to-day; the typing flow is timing-sensitive and gets real-browser e2e coverage, not just unit tests |
| Rate limiting | **Deferred** — not built in Phase 1/2 | No confirmed need yet; revisit in `future-scope.md` if abuse (bot test-spam, credential stuffing) actually shows up rather than pre-building for a hypothetical |
| Postgres connection pool | `pg.Pool` in `lib/prisma.ts` set with `keepAlive: true` and `idleTimeoutMillis: 10_000` | Neon's own pooler silently drops idle connections; without recycling ours first, the app-level pool hands out a dead client and every query fails with "Connection terminated unexpectedly" after any real idle gap (reproduced during dev — a long-running `next dev` process that sat idle for several minutes). Also always attach a `pool.on('error', ...)` listener — an unhandled idle-client error can crash the process. |
| Hosting | Vercel | Native Next.js support, preview deploys per branch/PR |

## Environment variables by phase

**Needed to start (Phase 1):**
```
DATABASE_URL=
NEXTAUTH_SECRET=
NEXTAUTH_URL=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
```

**Added mid-Phase-1 (analytics):**
```
NEXT_PUBLIC_POSTHOG_KEY=
NEXT_PUBLIC_POSTHOG_HOST=
```

**Added in Phase 2 (billing + email):**
```
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PRICE_ID_PREMIUM=
RESEND_API_KEY=
```

## Third-party accounts by phase

| Phase | Service | For |
|---|---|---|
| 1 | GitHub | Repo hosting |
| 1 | Vercel | Hosting |
| 1 | Neon | Database |
| 1 | Google Cloud Console | Google OAuth client |
| 1 | PostHog | Product analytics |
| 2 | Stripe | Subscriptions/billing |
| 2 | Resend | Transactional email |

## Local machine prerequisites

- Node.js 20+
- pnpm (`corepack enable` then `corepack prepare pnpm@latest --activate`)
- Git
- Claude Code CLI

## Deployment

Single deployable: the Next.js app (UI + API routes together) on Vercel.

- `main` → Vercel Production environment, production domain. Every push to `main` (i.e. every
  confirmed, squash-merged feature — see `git-workflow.md`) deploys automatically.
- `feature/*` → normal Vercel preview deployments per push, each with its own Neon database
  branch so schema changes never touch shared/production data. Useful for reviewing a feature in a
  real deployed environment before confirming the merge.

## Plans & limits

| | Free | Premium |
|---|---|---|
| Core typing test (all modes) | ✅ unlimited | ✅ unlimited |
| History retention | Last 90 days | Unlimited |
| Speed curve chart | ✅ | ✅ + longer range filters |
| Advanced analytics (accuracy trend, weak-key heatmap, consistency-over-time) | ❌ | ✅ |
| Practice / weak-key drill mode | ❌ | ✅ |
| Custom text sources | ❌ | ✅ |
| Price | $0 | Suggested $4.99/mo or $39.99/yr — set in the Stripe dashboard, not hardcoded; the app only reads `Subscription.plan`, never a hardcoded price |
