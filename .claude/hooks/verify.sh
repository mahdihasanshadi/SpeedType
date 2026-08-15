#!/usr/bin/env bash
# Post-turn verification gate for SpeedType.
# Runs after Claude finishes a turn. No-op until the project is scaffolded.
# Exit 0 = OK to stop. Exit 2 = block: checks are red; Claude must fix.

set -uo pipefail
cd "$CLAUDE_PROJECT_DIR" 2>/dev/null || cd "$(dirname "$0")/../.." || exit 0

# Nothing to check until the app exists.
[ -f package.json ] || exit 0

# Type check must be clean.
if ! pnpm typecheck; then
  echo "Type check failed — fix before finishing." >&2
  exit 2
fi

# Tests must pass (green even with zero tests is fine early on).
if ! pnpm test; then
  echo "Tests are failing — fix before finishing." >&2
  exit 2
fi

exit 0
