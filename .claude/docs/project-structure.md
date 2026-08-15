# Project Structure

**Single app, not a monorepo.** One Next.js (App Router, currently v16) project with API routes for
the backend — no separate server, no packages/ split. Revisit only if a genuinely separate
deployable (e.g. a future native mobile app's API needs) shows up.

## Directory tree

```
speedtype/
├── app/
│   ├── layout.tsx                  # root layout, theme provider, fonts
│   ├── page.tsx                    # the test page — this IS the landing page
│   ├── globals.css                 # design token CSS variables + Tailwind base
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   └── signup/page.tsx
│   ├── history/page.tsx            # test history + speed curve
│   ├── settings/page.tsx           # mode/duration/punctuation/theme prefs
│   ├── practice/page.tsx           # Phase 2 — weak-key drills (Premium)
│   ├── pricing/page.tsx            # Phase 2 — plan comparison + upgrade CTA
│   └── api/
│       ├── auth/[...nextauth]/route.ts
│       ├── tests/route.ts          # POST save a completed test, GET list (paginated)
│       ├── tests/import/route.ts   # guest → account localStorage migration
│       ├── settings/route.ts       # sync typing preferences for logged-in users
│       └── stripe/
│           ├── checkout/route.ts
│           ├── portal/route.ts
│           └── webhook/route.ts
├── components/
│   ├── typing-engine/              # Passage, Caret, StatBar, useTypingEngine()
│   ├── charts/                     # SpeedCurveChart (Recharts, retention to design tokens)
│   ├── layout/                     # Nav, ThemeToggle
│   └── ui/                         # shadcn components, retheme-on-arrival (ui-stack.md)
├── lib/
│   ├── prisma.ts                   # Prisma client singleton
│   ├── auth.ts                     # Auth.js config (Credentials + Google providers)
│   ├── stripe.ts
│   ├── resend.ts
│   ├── posthog.ts
│   ├── wpm.ts                      # THE single implementation of the ux-flows.md formulas
│   └── texts/                      # word pools + quote pool for passage generation
├── store/
│   └── typing-store.ts             # Zustand — real-time engine state
├── prisma/
│   ├── schema.prisma
│   └── migrations/
├── e2e/
│   └── *.spec.ts                   # Playwright — the core typing flow gets e2e coverage
├── public/
└── .env.example
```

Unit tests live **co-located** next to the code they test (`wpm.ts` + `wpm.test.ts` in the same
folder) — see `testing.md`.

## Dev commands

| Command | Does |
|---|---|
| `pnpm dev` | Start dev server at `localhost:3000` |
| `pnpm build` | Production build |
| `pnpm typecheck` | `tsc --noEmit` |
| `pnpm test` | Vitest (unit/component, co-located) |
| `pnpm test:e2e` | Playwright (core flows) |
| `pnpm db:push` | Push Prisma schema to the dev database |
| `pnpm db:migrate` | Create + run a named migration |
