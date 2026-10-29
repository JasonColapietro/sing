#!/usr/bin/env bash
# Rebuild and deploy production by hand. Vercel's git integration already
# deploys main on push, so reach for this only to force a rebuild, e.g. after
# changing a NEXT_PUBLIC_* env var, which is baked in at build time and so does
# NOT take effect until a rebuild. It builds once, locally, with the production
# env (`vercel pull` + `vercel build`) and uploads that output, so the deployed
# tree is this checkout. It refuses anything but a clean tree at origin/main:
# on 2026-07-30 a deploy from a worktree four commits behind main silently
# dropped /api/sync from production.
#
#   bash scripts/deploy-prod.sh
set -euo pipefail

SCOPE=suede-ai-64d39175

if [ -n "$(git status --porcelain)" ]; then
  echo "Refusing to deploy: the working tree is not clean." >&2
  git status --short >&2
  exit 1
fi
git fetch --quiet origin main
if [ "$(git rev-parse HEAD)" != "$(git rev-parse origin/main)" ]; then
  echo "Refusing to deploy: HEAD $(git rev-parse --short HEAD) is not origin/main $(git rev-parse --short origin/main)." >&2
  exit 1
fi

npm run lint
npx tsc --noEmit
npm test
vercel pull --yes --environment=production --scope "$SCOPE"
vercel build --prod --scope "$SCOPE"
vercel deploy --prebuilt --prod --scope "$SCOPE" --yes
