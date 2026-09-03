import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

/**
 * The AI-crawler allowlist.
 *
 * A wildcard `Allow: /` already lets every one of these bots in, so none of
 * this changes what is reachable. It is named for two reasons. First, an
 * explicit group is a durable statement of intent: the next person to tighten
 * this file has to decide about each of these crawlers deliberately rather
 * than sweep them up in a wildcard edit. Second, this list is the answer to
 * "is Suede Sing opted out?" for anyone auditing the domain — the brand's
 * whole reference layer (636 singer profiles, the Atlas, the glossary) exists
 * to be quoted by answer engines, and silence reads as ambiguity.
 *
 * CAREFUL — the per-bot groups must repeat `disallow`. Under RFC 9309 a
 * crawler obeys the single most specific group matching its token and ignores
 * every other group, wildcard included. So a `GPTBot` group carrying only
 * `Allow: /` does not inherit the wildcard's `Disallow: /api/` — it *grants*
 * GPTBot the API routes that every other crawler is kept out of. Naming a bot
 * to be welcoming would quietly hand it more than the anonymous crawlers get.
 * Deriving each group from one shared rule is what keeps that impossible.
 */

/**
 * Crawlers named individually. Each is a real, currently-published token.
 *
 * Two of these are the ones publishers most often block, and both are allowed
 * here on purpose (decision recorded 2026-08-26):
 *
 * - `CCBot` is Common Crawl. Its corpus is a major route by which a model
 *   learns a small brand exists at all, which is the entire goal here.
 * - `Bytespider` is ByteDance's. It returns close to no referral traffic, but
 *   these pages are statically prerendered and CDN-served, so its appetite
 *   costs effectively nothing, and blocking it would buy nothing either.
 *
 * Revisit both if this site ever serves something it would rather not have
 * copied wholesale — the gated Atlas chapters are already noindexed, and a
 * paid body of text is the case that would change the answer.
 */
const AI_CRAWLERS = [
  // OpenAI: training, search index, and user-initiated fetch.
  "GPTBot",
  "OAI-SearchBot",
  "ChatGPT-User",
  // Anthropic: training, index, and user-initiated fetch.
  "ClaudeBot",
  "Claude-User",
  "anthropic-ai",
  // Perplexity: index and user-initiated fetch.
  "PerplexityBot",
  "Perplexity-User",
  // Google's AI-training opt-out token, distinct from Googlebot.
  "Google-Extended",
  // Apple Intelligence's opt-out token, distinct from Applebot.
  "Applebot-Extended",
  // Common Crawl, and ByteDance. See the note above.
  "CCBot",
  "Bytespider",
];

/** The one rule every group is built from, so no group can drift from it. */
const ACCESS = { allow: "/", disallow: "/api/" };

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", ...ACCESS },
      ...AI_CRAWLERS.map((userAgent) => ({ userAgent, ...ACCESS })),
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
