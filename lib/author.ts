/**
 * The named human behind the site.
 *
 * The Voice Atlas is a paid book and the range pages give voice-health
 * guidance, so an unattributed expert voice is the weakest possible E-E-A-T
 * posture. The Book node previously credited an Organization called
 * "Suede Sing" — the product name, not a publisher and not a person. The
 * publisher stays Suede AI; the author is a Person.
 *
 * Only claims that resolve to a live page are asserted here: both sameAs
 * targets returned 200 on 2026-08-09.
 *
 * 2026-10-09: sameAs now carries the estate's canonical 15-entry list for
 * Jason Colapietro, the same set suedeai.ai declares on
 * https://suedeai.ai/founder#person, so this node and that one agree. It
 * leads with the founder page itself. Both Goodreads author records are
 * listed because Goodreads holds two for him (68469794 carries Stake Your
 * Claim, 67433886 carries Suede Labs: The Human Authenticity Layer), and
 * declaring both ties them to one person.
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
    "https://suedeai.ai/founder",
    "https://jasoncolapietro.com/",
    "https://johnnysuede.com/",
    "https://suedeai.org/jason-colapietro/",
    "https://agents.suedeai.ai/founder",
    "https://github.com/JasonColapietro",
    "https://www.linkedin.com/in/jasoncolapietro",
    "https://x.com/johnnysuede",
    "https://www.youtube.com/@johnnysuede",
    "https://apps.apple.com/us/developer/jason-colapietro/id1895958699",
    "https://jasoncolapietro.substack.com/",
    "https://www.crunchbase.com/person/jason-colapietro-d83e",
    "https://www.wikidata.org/wiki/Q140235755",
    "https://www.goodreads.com/author/show/68469794.jason_colapietro",
    "https://www.goodreads.com/author/show/67433886.jason_johnny_suede_colapietro",
  ],
  worksFor: { "@id": "https://suedeai.ai/#organization" },
} as const;
