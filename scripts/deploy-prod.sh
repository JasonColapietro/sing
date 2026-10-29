#!/usr/bin/env bash
# Rebuild and deploy production by hand. Vercel's git integration already
# deploys main on push, so reach for this only to force a rebuild, e.g. after
# changing a NEXT_PUBLIC_* env var, which is baked in at build time and so does
# NOT take effect until a rebuild. It builds once, locally, with the production
# env (`vercel pull` + `vercel build`) and uploads that output, so the deployed
# tree is this checkout: run it from a clean origin/main.
#
#   bash scripts/deploy-prod.sh
set -euo pipefail

SCOPE=suede-ai-64d39175

npm run lint
npx tsc --noEmit
npm test
vercel pull --yes --environment=production --scope "$SCOPE"
vercel build --prod --scope "$SCOPE"
vercel deploy --prebuilt --prod --scope "$SCOPE" --yes
