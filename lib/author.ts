/**
 * The named human behind the site.
 *
 * The Voice Atlas is a paid book and the range pages give voice-health
 * guidance, so an unattributed expert voice is the weakest possible E-E-A-T
 * posture. The Book node previously credited an Organization called
 * "Suede Sing" — the product name, not a publisher and not a person. The
 * publisher stays Suede Labs AI; the author is a Person.
 *
 * Only claims that resolve to a live page are asserted here: both sameAs
 * targets returned 200 on 2026-08-09.
 */
import { SITE_URL } from "@/lib/site";

export const AUTHOR_ID = `${SITE_URL}/#author`;

export const AUTHOR_NAME = "Jason Colapietro";
export const AUTHOR_ALIAS = "Johnny Suede";

export const AUTHOR_NODE = {
  "@type": "Person",
  "@id": AUTHOR_ID,
  name: AUTHOR_NAME,
  alternateName: AUTHOR_ALIAS,
  url: "https://jasoncolapietro.com",
  sameAs: [
    "https://jasoncolapietro.com",
    "https://github.com/JasonColapietro",
  ],
  worksFor: { "@id": "https://suedeai.ai/#organization" },
} as const;
