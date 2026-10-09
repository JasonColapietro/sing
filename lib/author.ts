/**
 * The named human behind the site.
 *
 * The Voice Atlas is a paid book and the range pages give voice-health
 * guidance, so an unattributed expert voice is the weakest possible E-E-A-T
 * posture. The Book node previously credited an Organization called
 * "Suede Sing" — the product name, not a publisher and not a person. The
 * publisher stays Suede AI; the author is a Person.
 *
 * Only the reference is asserted here; the identity is defined once, on
 * https://suedeai.ai/founder.
 *
 * Satellite sites reference the founder by @id and never mint a copy, so every
 * property (jobTitle, knowsAbout, sameAs) is maintained in one place.
 */
export const AUTHOR_ID = "https://suedeai.ai/founder#person";

export const AUTHOR_NAME = "Jason Colapietro";
export const AUTHOR_ALIAS = "Johnny Suede";

export const AUTHOR_NODE = { "@id": AUTHOR_ID } as const;
