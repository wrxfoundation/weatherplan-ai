#!/usr/bin/env bash
# Split chronicle/ into a standalone branch with full git history, ready to push to its own repo.
#
# Run from the weatherplan-ai repo ROOT, on the branch with the latest Chronicle work:
#     bash chronicle/scripts/split-chronicle.sh
# Then create an empty repo and:
#     git push https://github.com/<owner>/chronicle.git chronicle-standalone:main
#
# Post-split checklist (see chronicle/README.md "Standalone 분리"):
#   - move .github/workflows/bunyang.yml (and chronicle-test.yml) into the new repo's
#     .github/workflows/, drop `working-directory: chronicle` and chronicle/ path prefixes
#   - register the DATA_GO_KR_KEY secret on the new repo
#   - run the workflow once manually (workflow_dispatch) to confirm green
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

✓ Done. Branch '$BRANCH' now has chronicle/ at its root, with full history.

Next:
  1) Create an empty repo on GitHub (no README).
  2) git push https://github.com/<owner>/chronicle.git $BRANCH:main
  3) Follow the post-split checklist in chronicle/README.md, then 'npm ci && npm test'
     in the new repo to confirm green.
EOF
