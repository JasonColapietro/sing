/**
 * robots.txt allowlist guard.
 *
 * The live sing.suedeai.ai/robots.txt was a bare wildcard while the legacy
 * print.suedeai.ai carried a deliberate per-bot AI allowlist — the intent had
 * been written down on the domain that 308s away and never reached the one
 * that gets crawled for the brand.
 *
 * The assertion that actually matters here is the disallow one. Under RFC 9309
 * a crawler obeys the single most specific group matching its token and
 * ignores every other group, the wildcard included. So naming GPTBot in a
 * group carrying only `Allow: /` does not inherit `Disallow: /api/` — it hands
 * GPTBot the API routes that anonymous crawlers are kept out of. A change that
 * looks like hospitality would quietly widen access. That is the regression
 * this file exists to catch.
 *
 * Proven non-vacuous: dropping `disallow` from ACCESS fails the API test with
 * all 13 groups named; dropping a token from AI_CRAWLERS fails the coverage
 * test naming exactly the missing one.
 */
import { describe, expect, it } from "vitest";

import robots from "@/app/robots";
import { SITE_URL } from "./site";

const result = robots();
const rules = Array.isArray(result.rules) ? result.rules : [result.rules];

/** Every crawler the file speaks to, wildcard included. */
const agents = rules.flatMap((r) =>
  Array.isArray(r.userAgent) ? r.userAgent : [r.userAgent ?? "*"],
);

describe("robots.txt", () => {
  it("keeps a wildcard group, so unnamed crawlers are still welcome", () => {
    expect(agents).toContain("*");
  });

  it("names every AI crawler the brand wants reading it", () => {
    // The six ported from the legacy domain, plus the six that were missing
    // from both. Listed literally rather than imported from the source so a
    // deletion has to be made twice, deliberately.
    const expected = [
      "GPTBot",
      "OAI-SearchBot",
      "ChatGPT-User",
      "ClaudeBot",
      "Claude-User",
      "anthropic-ai",
      "PerplexityBot",
      "Perplexity-User",
      "Google-Extended",
      "Applebot-Extended",
      "CCBot",
      "Bytespider",
    ];
    const missing = expected.filter((a) => !agents.includes(a));
    expect(missing, `robots.txt no longer names: ${missing.join(", ")}`).toEqual(
      [],
    );
  });

  it("repeats Disallow: /api/ in EVERY group, including the named ones", () => {
    // The RFC 9309 trap. A named group without this line is strictly more
    // permissive than the wildcard it overrides.
    const leaky = rules
      .filter((r) => {
        const d = r.disallow;
        const list = Array.isArray(d) ? d : d ? [d] : [];
        return !list.includes("/api/");
      })
      .flatMap((r) =>
        Array.isArray(r.userAgent) ? r.userAgent : [r.userAgent ?? "*"],
      );
    expect(
      leaky,
      `these groups would be granted /api/ that the wildcard denies: ${leaky.join(", ")}`,
    ).toEqual([]);
    // Non-vacuity: the check above passes trivially on an empty rule set.
    expect(rules.length).toBeGreaterThanOrEqual(13);
  });

  it("allows the site root in every group", () => {
    for (const r of rules) {
      const a = Array.isArray(r.allow) ? r.allow : [r.allow];
      expect(a).toContain("/");
    }
  });

  it("points at the sitemap on the canonical origin", () => {
    expect(result.sitemap).toBe(`${SITE_URL}/sitemap.xml`);
  });
});
