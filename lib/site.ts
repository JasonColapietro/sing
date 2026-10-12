/**
 * Canonical site origin for absolute URLs (sitemap, canonical tags, JSON-LD,
 * OG images). Override with NEXT_PUBLIC_SITE_URL when a custom domain lands —
 * nothing else needs to change.
 */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://sing.suedeai.ai"
).replace(/\/+$/, "");

/** What a link into the voice test at /range asks it to open. */
export interface RangeTestLink {
  /**
   * "range" (the default) opens the guided range test; "pitch" opens the
   * live pitch meter, which is what bare /range shows.
   */
  mode?: "range" | "pitch";
  /** A singer slug: the test opens against that singer's range. */
  compare?: string;
  /** A /can-you-sing song slug the result sends the singer back to. */
  check?: string;
}

/**
 * A link into the voice test at /range that lands on its start control.
 *
 * Bare /range opens at the top of the page, and on a 375px phone the start
 * button then sits under the bottom tab bar. #start is the mode tablist in
 * components/range/voice-test.tsx, directly above the start button, so the
 * tap that said "test my range" arrives one step from the mic prompt.
 * lib/range-links.test.ts fails on any link into /range without it.
 *
 * A comparison opens the range test without ?mode=range (voiceTestMode), so
 * singer links keep the short `?compare=` form they have always had.
 * Structured data and llms.txt name the page, not the scroll position: strip
 * the fragment there.
 */
export function rangeTestHref({ mode = "range", compare, check }: RangeTestLink = {}): string {
  const query: string[] = [];
  if (compare ? mode === "pitch" : mode === "range") query.push(`mode=${mode}`);
  if (check) query.push(`check=${encodeURIComponent(check)}`);
  if (compare) query.push(`compare=${encodeURIComponent(compare)}`);
  return `/range${query.length ? `?${query.join("&")}` : ""}#start`;
}
