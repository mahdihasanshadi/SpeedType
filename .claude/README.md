# SpeedType — `.claude/` context folder

This folder gives Claude Code focused, on-demand context instead of one giant file.

## What lives where

| File | Purpose | When it's read |
|---|---|---|
| `../CLAUDE.md` | Lean brief — overview, rules, build discipline, doc index. **Auto-loaded** every session. | Always |
| `../build-order-complete.md` | The sequenced build prompts. | Picking the next feature |
| `../PROGRESS.md` | Live "what's actually built" log. Update after every feature. | Start of each session |
| `docs/project-structure.md` | Repo layout, directory tree, dev commands. | Adding/moving any file |
| `docs/database-schema.md` | Prisma schema, phase-wise migration plan. | Anything touching the database |
| `docs/api-conventions.md` | Route pattern, the Stripe webhook step order, route map. | Any API route |
| `docs/design-system.md` | Fonts, type scale, spacing, color tokens — the styling authority. | Any UI |
| `docs/ui-stack.md` | Component strategy — shadcn/Framer Motion/Recharts/Zustand conventions. | Any component |
| `docs/ux-flows.md` | The core typing-test flow, exact WPM/accuracy/consistency formulas, results/history/settings behavior. | The test engine or any core screen |
| `docs/ui-references.md` | Seed file for dropped-in reference screenshots. | Before building a screen, if a reference exists |
| `docs/infrastructure.md` | Decisions table, env vars by phase, accounts by phase, hosting, plans & limits. | Setup, deploy, or a new integration |
| `docs/git-workflow.md` | Branch model, naming, per-feature flow, promotion. | Any git operation |
| `docs/testing.md` | Tooling, the per-feature test rhythm, co-location convention. | Writing any test |
| `docs/test-cases.md` | Per-feature test case list — source of truth for `it(...)` names. | Planning or writing a feature's tests |
| `docs/qa-checklist.md` | Sectioned 🔴 launch-blocker checklist. | A phase QA gate |
| `docs/email-templates.md` | Lifecycle email table, transactional vs. lifecycle rules. | Any email send |
| `docs/future-scope.md` | Deferred infrastructure/process items (rate limiting, CI, promotion automation, hotfix flow). | Considering infra not yet built |
| `commands/ship-feature.md` | `/ship-feature` — build one feature, gated flow. | You invoke it |
| `commands/qa-gate.md` | `/qa-gate` — run the QA checklist for a phase. | You invoke it |
| `hooks/verify.sh` | Post-turn checks gate. No-op until scaffolded. | Automatic (Stop hook) |
| `settings.json` | Pre-approved safe commands + the Stop hook wiring. | Automatic |
| `../.mcp.json` | shadcn/ui MCP — pulls real, current component source. | Automatic when building UI |

## Precedence

When a `docs/*.md` file and `CLAUDE.md` disagree, the `docs/` file wins — it's the refined,
corrected version.

## Build discipline

- Build strictly in phase order. Never jump ahead.
- Test + commit after every feature.
- Update `PROGRESS.md` when a feature ships.
- Any explicitly-undecided or future-scope features — never build without confirmation.
