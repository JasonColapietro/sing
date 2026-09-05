/**
 * The publisher entity, and the profiles that prove it is one thing.
 *
 * `sameAs` is the assertion that binds these pages to an identity search and
 * answer engines already hold. Without it the Organization node here is a bare
 * name — "Suede Labs AI" — that a consumer has no way to reconcile with the
 * Suede Labs AI it knows from anywhere else, so every surface the studio
 * publishes accrues authority to a separate, unresolvable stub.
 *
 * These URLs are not chosen here. suedeai.ai is the authoritative home of
 * `https://suedeai.ai/#organization` and declares this exact list on its own
 * Organization node; this file mirrors it so that the node sing.suedeai.ai
 * emits under that `@id` agrees with the node the origin emits, rather than
 * contradicting it. Nothing is invented and nothing is aspirational: every
 * entry was fetched on 2026-08-26 and resolves (Crunchbase and LinkedIn answer
 * 403/999 to a bare client, which is their bot policy, not a dead page).
 *
 * If a profile is retired, remove it here *and* on suedeai.ai. A sameAs
 * pointing at a 404 is a worse claim than no sameAs at all.
 */
export const ORG_ID = "https://suedeai.ai/#organization";

export const ORG_SAME_AS = [
  "https://suedeai.org/",
  "https://x.com/AISUEDE",
  "https://github.com/Suede-AI",
  "https://www.youtube.com/@aisuede",
  "https://www.instagram.com/suedeai/",
  // The Suede Sing product account. Verified live 2026-08-27 — the handle is
  // suedesingapp, not suedesing: Facebook's /suedesing vanity already belongs
  // to an unrelated page, so both platforms took the -app form to stay
  // matched. No Facebook Page entry yet; /suedesingapp still serves "content
  // isn't available", and a sameAs that does not resolve is worse than none.
  "https://www.instagram.com/suedesingapp/",
  "https://www.facebook.com/people/Suede-Labs-AI/61584534847516",
  "https://t.me/SUEDEAI",
  "https://linktr.ee/suedelabsai",
  "https://www.crunchbase.com/organization/suede-labs-ai",
  "https://www.linkedin.com/company/suede-labs",
  "https://www.wikidata.org/wiki/Q141169484",
] as const;

/**
 * The one spelling of the publisher's name.
 *
 * Three pages used to write this object out by hand and two of them said
 * "Suede Labs" while a third said "Suede Labs AI", under the identical `@id`.
 * A parser that resolves the entity from one page in isolation, which is the
 * ordinary case, then holds a different name for the same node depending on
 * which page it landed on. "Suede Labs AI" is what suedeai.ai's own canonical
 * node carries, so that is the value here and the shorter form is kept as an
 * alternateName rather than as a competing name.
 */
export const ORG_NAME = "Suede Labs AI";
export const ORG_URL = "https://suedeai.ai";
export const ORG_LOGO = "https://suedeai.ai/suede-ai-logo-transparent.png";

/** The full node, for the pages that stand as the site's own entity surface. */
export const ORG_NODE = {
  "@type": "Organization",
  "@id": ORG_ID,
  name: ORG_NAME,
  alternateName: ["Suede Labs", "Suede AI"],
  url: ORG_URL,
  logo: ORG_LOGO,
  founder: { "@id": "https://suedeai.ai/founder#person" },
  sameAs: [...ORG_SAME_AS],
} as const;

/**
 * The publisher node for templated pages.
 *
 * Every content template pointed `publisher` at the `@id` above without ever
 * defining that node in the same document, so a crawler reading one page on
 * its own resolved the pointer to nothing at all: no name, no logo, no
 * publisher. This carries the identifying properties and stops short of
 * restating the whole profile list, which stays on the canonical node so a
 * thin copy emitted from ~670 sitemap URLs cannot outweigh the full one.
 */
export const ORG_PUBLISHER_NODE = {
  "@type": "Organization",
  "@id": ORG_ID,
  name: ORG_NAME,
  url: ORG_URL,
  logo: ORG_LOGO,
} as const;
