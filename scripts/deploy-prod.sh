#!/usr/bin/env bash
# Deploy production, but only from a tree that is exactly origin/main.
#
#   bash scripts/deploy-prod.sh
#
# Vercel's git integration already deploys main on push, so reach for this only
# when you need to force a rebuild — e.g. after changing a NEXT_PUBLIC_* env var,
# which is baked in at build time and so does NOT take effect until a rebuild.
#
# Why the guard: `vercel --prod` uploads the working directory, not a git ref. On
# 2026-07-30 it was run from a worktree four commits behind main and silently
# dropped the Pro cloud-sync routes from production (/api/sync went 404). The
# checks below make that specific mistake impossible.
set -euo pipefail

SCOPE=suede-ai-64d39175

if [ -n "$(git status --porcelain)" ]; then
  echo "✗ Working tree is dirty. Commit, stash, or clean it first:" >&2
  git status --short >&2
  exit 1
fi

git fetch --quiet origin main
HEAD_SHA=$(git rev-parse HEAD)
MAIN_SHA=$(git rev-parse origin/main)

if [ "$HEAD_SHA" != "$MAIN_SHA" ]; then
  echo "✗ HEAD is not origin/main — refusing to deploy." >&2
  echo "    HEAD        $(git rev-parse --short HEAD)  $(git log -1 --format=%s HEAD)" >&2
  echo "    origin/main $(git rev-parse --short origin/main)  $(git log -1 --format=%s origin/main)" >&2
  echo >&2
  if git merge-base --is-ancestor "$HEAD_SHA" "$MAIN_SHA" 2>/dev/null; then
    echo "  You are behind main. Deploying would roll production back. Run:" >&2
    echo "    git reset --hard origin/main && npm install" >&2
  else
    echo "  You have commits main does not. Merge them via PR first." >&2
  fi
  exit 1
fi

echo "✓ tree clean and at origin/main ($(git rev-parse --short HEAD))"
npm run lint
npx tsc --noEmit
npx next build
vercel --prod --scope "$SCOPE" --yes
