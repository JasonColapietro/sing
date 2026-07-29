/**
 * Canonical site origin for absolute URLs (sitemap, canonical tags, JSON-LD,
 * OG images). Override with NEXT_PUBLIC_SITE_URL when a custom domain lands —
 * nothing else needs to change.
 */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://sing-red.vercel.app"
).replace(/\/+$/, "");
