/**
 * Singer pages with the highest exact-query impression demand in Search Console.
 *
 * Source: sing.suedeai.ai Search performance, July 29–September 17, 2026.
 * September 18–24 update: Olivia Rodrigo added after 115 exact vocal-range
 * query impressions, zero clicks, and average position 8.1. Preserve the earlier
 * cohort rather than reorder the entire catalog from one short-window surge.
 * September 27 refresh (28 days ending September 25): Michael Jackson added
 * after 115 exact vocal-range query impressions; the latest week had 48
 * impressions and one click. Existing priority pages retain their order.
 * Keep this list small and evidence-led: it exists to give the pages already
 * earning meaningful `[name] vocal range` impressions a prominent path from
 * the collection hub, not to pretend this is global search-volume data.
 */
export const VOCAL_RANGE_PRIORITY_SLUGS = [
  "bruno-mars",
  "taylor-swift",
  "olivia-rodrigo",
  "jeff-buckley",
  "peter-steele",
  "jungkook",
  "conan-gray",
  "luciano-pavarotti",
  "billie-eilish",
  "celine-dion",
  "chino-moreno",
  "tom-jones",
  "paul-mccartney",
  "sebastian-bach",
  "stevie-wonder",
  "jennifer-hudson",
  "jimin",
  "michael-jackson",
] as const;
