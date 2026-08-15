---
description: Build the next feature on its own branch — plan → approve → branch → implement → self-review → verify → confirm → squash-merge to main.
---

# /ship-feature — interactive, one feature at a time

Ship exactly **one** feature from the current phase, on its own branch off `main`, with the user
approving the plan before any code is written and **explicitly confirming the tested result before
it gets merged**. Never build more than one feature per run. Never jump ahead of the current
phase. Full git rules → `.claude/docs/git-workflow.md`.

If the user named a feature in the arguments, build that one. Otherwise read `PROGRESS.md` and
pick the **next unchecked feature in the lowest incomplete phase**.

## Steps — follow in order, do not skip

1. **Plan (gate).** Enter plan mode. Read the relevant docs for this feature (doc index in
   `CLAUDE.md`), including any cases the user pre-seeded in `.claude/docs/test-cases.md`. Present a
   short plan: what you'll build, which files, which schema/columns if relevant, and **this
   feature's own concrete test cases** — specific to *this* feature's behavior, not a generic
   template. **Stop and wait for the user's approval** of the plan *and* the test-case list. On
   approval, record the agreed cases under this feature's heading in `test-cases.md`. No code
   until approved.

2. **Branch.** `git checkout main && git pull`, then `git checkout -b feature/pN-<short-name>`
   (N = phase number). All work for this feature happens on this branch.

3. **Schema first (if needed).** If the feature needs new tables/columns, write the migration →
   have the user run it → write a test that proves it works → confirm green before building on it.

4. **Implement.** Build only this feature. Follow the non-negotiable rules in `CLAUDE.md` and the
   relevant doc conventions — in particular `design-system.md`/`ui-stack.md`/`ux-flows.md` for
   anything UI-facing, since UI/UX is the top product priority.

5. **Self-review (local, free, advisory).** Run **`/code-review`** on the diff. Apply the real
   findings; note false positives. This does **not** gate — it's a junior-reviewer pass.

6. **Verify / QA.** Write **this feature's own co-located test file(s)** implementing **exactly
   the cases recorded under this feature in `test-cases.md`** (`it(...)` name ↔ case). Tick each
   case `[x]` there as its test goes green; append any case you add. Run `pnpm typecheck` +
   `pnpm test` — must be green. Then **run the app and drive the actual flow** — show the user it
   working, not just green tests. For anything UI-facing or security/payment-sensitive, exercise
   the real path by hand.

7. **Confirmation gate — hard stop.** Summarize what was built, show the diff, report the test
   results, and describe exactly how you drove the feature by hand. **Wait for the user's explicit
   confirmation before doing anything in step 8.** Green tests are necessary but never sufficient —
   do not merge on your own judgment that it's "probably fine."

8. **Self-merge into `main`.** Only after step 7's confirmation: `git checkout main`, then
   `git merge --squash feature/pN-<name> && git commit` (one clean commit for the feature), then
   `git push origin main`.

9. **Record.** Tick this feature in `PROGRESS.md` and commit.

10. **Clean up.** `git branch -d feature/pN-<name>`. Wait for "next" (or the next `/ship-feature`)
    before starting another feature.

## Guardrails
- One feature = one branch = one confirmed squash-merge into `main` = branch deleted.
- **Never merge before the user has confirmed the tested result in step 7.** A plan approval at
  step 1 is not a merge approval.
- **Never force-push**, ever.
- Never build any explicitly-undecided or future-scope feature without confirmation.
- If you hit a missing secret, an ambiguous product decision, or a repeated test failure you can't
  resolve, **stop and ask** — don't guess.
