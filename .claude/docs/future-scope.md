# Future Scope — infrastructure & process

Deferred *feature* work (leaderboards, teams, mobile app, etc.) lives in `build-order-complete.md`'s
🔮 section. This file is for infrastructure/process items that aren't built yet. Nothing here is
active — each entry states what it is and how to activate it when actually needed.

## Rate limiting

Not built in Phase 1/2 (see `infrastructure.md`'s decisions table — deferred, no confirmed abuse
problem yet). If bot test-spam or login brute-forcing becomes real:
- Add `@upstash/ratelimit` + an Upstash Redis instance (new account needed).
- Apply to `/api/auth/*` (login attempts) and `/api/tests` POST (spam saves) first — those are the
  two routes with real abuse surface.
- Activation: create the Upstash account, add `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN`
  to `infrastructure.md`'s env var list, wrap the two routes above, confirm with a manual burst test.

## CI pipeline

No CI is wired yet — `pnpm typecheck && pnpm test` currently only runs locally via the Stop hook
(`.claude/hooks/verify.sh`) after each Claude Code turn, plus whatever the human confirms by hand
per `git-workflow.md`'s confirmation gate. Before `main` starts taking real production traffic:
- Add a GitHub Actions workflow running `pnpm typecheck`, `pnpm test`, and `pnpm test:e2e` on every
  PR/push into `main`.
- Branch protection on `main` requiring the workflow to pass before merge — this backs up (doesn't
  replace) the human confirmation gate, since CI catches what a rushed manual check might miss.

## Hotfix flow

No dedicated hotfix flow yet — any bug found post-merge uses the normal `fix/*` branch off `main`
flow in `git-workflow.md`, same confirmation gate as a feature. Revisit only if production incident
volume ever justifies a faster-but-riskier bypass of that gate — which, given `main` has no
separate protected tier under it, is a real risk/speed tradeoff worth deciding deliberately, not
defaulting into.

## Activation checklist (when any item above gets picked up)

1. Confirm with the project owner it's actually needed now, not pre-emptively.
2. Create any new account/service required, add credentials to `infrastructure.md`.
3. Build it as its own `feature/` or `chore/` branch through the normal `/ship-feature` flow.
4. Move its entry out of this file into wherever it now lives (a doc, a workflow file).
