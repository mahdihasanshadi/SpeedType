# Git Workflow

Simplified 2-tier model — no `develop`/`staging` tiers. `main` is both the working history and
what's deployed; the safety gate is the **human confirmation step per feature**, not a separate
protected integration branch.

## Branch model

| Branch | Purpose | Who touches it |
|---|---|---|
| `main` | The only long-lived branch — always deployable, tracked by Vercel Production | Agent squash-merges here, but **only after the human confirms the tested feature** |
| `feature/pN-<name>` | One feature, one branch | Agent creates, works on, deletes after merge |
| `fix/<name>` | A bug found after a feature merged | Agent creates off `main`, same flow as a feature |

## Naming

`feature/p1-typing-engine`, `feature/p2-stripe-checkout`, `fix/caret-drift-mobile`. `N` in
`feature/pN-*` is the phase number the feature belongs to.

## Per-feature flow (matches `/ship-feature`)

1. `git checkout main && git pull`
2. `git checkout -b feature/pN-<name>`
3. Implement, test (`pnpm typecheck && pnpm test`, drive the flow in browser), `/code-review` (advisory).
4. **Stop and show the human the tested, working result.** This is a hard gate — do not merge on
   green tests alone. Wait for explicit confirmation ("looks good", "confirmed", "merge it").
5. `git checkout main && git merge --squash feature/pN-<name> && git commit`
6. `git push origin main`
7. `git branch -d feature/pN-<name>`

One feature = one branch = one confirmed, squash-merged commit on `main`. Never accumulate
multiple features on one branch, and never skip the confirmation gate in step 4 — testing green
is necessary but not sufficient to merge.

## Deployment

No separate promotion step — `main` is what Vercel deploys to Production. Every push to `main`
(i.e. every confirmed, merged feature) goes live. `feature/*` branches still get normal Vercel
preview deployments per push, useful for reviewing a feature before confirming it in step 4 above.

## Local enforcement

- `.claude/settings.json` denies `git push --force` / `-f` outright at the permissions layer —
  history on `main` is never rewritten.
- There's no branch-protection githook, since there's no longer a separate protected branch to
  guard — the confirmation gate in the per-feature flow above is what stands in for it. If this
  project ever moves to a team/production-audience model where a stricter promotion ceremony is
  worth the overhead, revisit this file and reintroduce a `develop`/`staging` tier (see the
  git-workflow pattern this scaffold started from).
