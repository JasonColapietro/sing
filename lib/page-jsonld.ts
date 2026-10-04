/**
 * Minimal structured data for pages that had none.
 *
 * The 2026-10-03 content sweep listed ten indexable pages with no JSON-LD at
 * all: the six free book and atlas chapters, /changelog, /programs, /progress
 * and /singers/methodology. Each now declares what it is, under a name that is
 * its visible <title> or H1, joined to the site and publisher the rest of the
 * estate already uses. Nothing here states anything the page does not show.
 */
import { AUTHOR_NODE } from "@/lib/author";
import { ORG_ID, ORG_PUBLISHER_NODE } from "@/lib/organization";
import { SITE_URL } from "@/lib/site";

export function webPageJsonLd(page: { path: string; name: string; description: string }) {
  const url = `${SITE_URL}${page.path}`;
  return {
    "@context": "https://schema.org",
    "@graph": [
      ORG_PUBLISHER_NODE,
      {
        "@type": "WebPage",
        "@id": `${url}#webpage`,
        url,
        name: page.name,
        description: page.description,
        isPartOf: { "@id": `${SITE_URL}/#website` },
        publisher: { "@id": ORG_ID },
        inLanguage: "en",
      },
    ],
  };
}

/** A chapter page of one of the two books, tied to the Book node its index page emits. */
export function chapterJsonLd(chapter: {
  section: "atlas" | "book";
  bookTitle: string;
  slug: string;
  title: string;
  summary: string;
  order: number;
  free: boolean;
}) {
  const url = `${SITE_URL}/${chapter.section}/${chapter.slug}`;
  return {
    "@context": "https://schema.org",
    "@type": "Chapter",
    "@id": `${url}#chapter`,
    url,
    name: chapter.title,
    ...(chapter.summary ? { description: chapter.summary } : {}),
    position: chapter.order,
    inLanguage: "en",
    isAccessibleForFree: chapter.free,
    author: AUTHOR_NODE,
    publisher: ORG_PUBLISHER_NODE,
    isPartOf: {
      "@type": "Book",
      name: chapter.bookTitle,
      url: `${SITE_URL}/${chapter.section}`,
    },
  };
}
