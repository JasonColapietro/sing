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
