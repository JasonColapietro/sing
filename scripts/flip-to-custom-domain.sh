#!/usr/bin/env bash
# Point the app at sing.suedeai.ai once the GoDaddy A record is live.
#
# Prerequisite (needs Jason's 2FA, so it can't be scripted): in GoDaddy DNS for
# suedeai.ai, add  A  sing  76.76.21.21  and complete the identity check.
#
# Verify first:  dig +short sing.suedeai.ai
# Then run:      bash scripts/flip-to-custom-domain.sh
set -euo pipefail

SCOPE=suede-ai-64d39175
DOMAIN=sing.suedeai.ai

if ! dig +short "$DOMAIN" | grep -q 76.76.21.21; then
  echo "✗ $DOMAIN does not resolve to Vercel yet — add the A record first." >&2
  exit 1
fi

# Canonicals, sitemap URLs, JSON-LD and OG all read SITE_URL from this.
printf 'https://%s' "$DOMAIN" | vercel env add NEXT_PUBLIC_SITE_URL production --scope "$SCOPE" --force
vercel --prod --scope "$SCOPE" --yes

echo
echo "Now confirm:"
echo "  curl -s https://$DOMAIN/singers/adele | grep -o 'rel=\"canonical\"[^>]*'"
echo "  curl -s https://$DOMAIN/sitemap.xml | head -3"
echo
echo "Search Console already has https://$DOMAIN/sitemap.xml submitted under"
echo "the sc-domain:suedeai.ai property; it will flip from 'Couldn't fetch' to"
echo "'Success' on its next crawl. Force it sooner by re-submitting there."
