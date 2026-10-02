#!/usr/bin/env bash
# Split chronicle/ into a standalone branch with full git history, ready to push to its own repo.
#
# Run from the weatherplan-ai repo ROOT, on the branch with the latest Chronicle work:
#     bash chronicle/scripts/split-chronicle.sh
# Then create an empty repo (e.g. kwangdol-star/chronicle, Public, no README) and:
#     git push https://github.com/kwangdol-star/chronicle.git chronicle-standalone:main
#
# Workflows are already included: chronicle/.github/workflows/ (inert in the monorepo)
# lands at the new repo's root .github/workflows/ and activates immediately.
#
# Post-split checklist (see chronicle/README.md "Standalone 분리"):
#   - register the DATA_GO_KR_KEY secret on the new repo
#   - run the "bunyang" workflow once manually (workflow_dispatch) to confirm green
set -euo pipefail

PREFIX="chronicle"
BRANCH="chronicle-standalone"

git rev-parse --is-inside-work-tree >/dev/null 2>&1 || { echo "error: not inside a git repo." >&2; exit 1; }
if [ ! -d "$PREFIX" ]; then
  echo "error: run this from the weatherplan-ai repo root (no ./$PREFIX directory here)." >&2
  exit 1
fi

echo "Splitting '$PREFIX/' into branch '$BRANCH' (preserving history)..."
git branch -D "$BRANCH" 2>/dev/null || true
git subtree split --prefix="$PREFIX" -b "$BRANCH"

cat <<EOF

✓ Done. Branch '$BRANCH' now has chronicle/ at its root, with full history
  (including .github/workflows/ — cron activates as soon as it lands on main).

Next:
  1) Create an empty repo on GitHub (e.g. kwangdol-star/chronicle, Public, no README).
  2) git push https://github.com/kwangdol-star/chronicle.git $BRANCH:main
  3) New repo Settings -> Secrets and variables -> Actions -> add DATA_GO_KR_KEY.
  4) Actions tab -> "bunyang" -> Run workflow (first capsule), confirm green.
EOF
