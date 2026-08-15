---
description: Run the QA & security checklist for a phase before marking it complete.
---

# /qa-gate — phase completion gate

Run the QA & Security Checklist (`.claude/docs/qa-checklist.md`) for the phase given in the
arguments (default: the current phase from `PROGRESS.md`).

For each applicable checklist item:
- If it's covered by an automated test, run it and report pass/fail.
- If it needs a manual check, give the user exact steps to run.
- **🔴 items are launch blockers** — the phase cannot be marked complete if any 🔴 fails.

Focus only on items relevant to features actually built in this phase (check `PROGRESS.md`).
Produce a short report: passed / failed / needs-manual, most important first. List every failure
with the file and a one-line fix suggestion. Do not mark the phase complete in `PROGRESS.md` until
every applicable 🔴 passes — surface anything outstanding to the user.
