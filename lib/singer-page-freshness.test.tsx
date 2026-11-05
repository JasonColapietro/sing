import { createHash } from "node:crypto";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import SingerPage, { generateMetadata } from "@/app/singers/[slug]/page";
import {
  getSingerEvidence,
  getSingerPageLastModified,
  hasDocumentedSourceReview,
} from "@/lib/singer-evidence";
import { SINGERS } from "@/lib/singers";

/**
 * What a reviewed singer page says: its title and snippet, its visible words
 * and the source URLs its evidence cards and JSON-LD cite. Markup, class names
 * and the JSON-LD dates are left out, so a styling change does not trip it and
 * the date it guards is not part of what it hashes.
 */
async function pageFingerprint(slug: string): Promise<string> {
  const params = Promise.resolve({ slug });
  const meta = await generateMetadata({ params: Promise.resolve({ slug }) });
  const html = renderToStaticMarkup(await SingerPage({ params }));
  const words = html
    .replace(/<script[\s\S]*?<\/script>/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  const sources = getSingerEvidence(slug).sources.map((source) => source.url);
  return createHash("sha256")
    .update(JSON.stringify([meta.title, meta.description, words, sources]))
    .digest("hex")
    .slice(0, 16);
}

/**
 * Each reviewed page pinned to what it said on its lastmod day. When this
 * fails, date the change (SINGER_DATA_REVISED or SINGER_PAGE_REVISED) and
 * re-pin the fingerprint and date together.
 */
const PINNED: Record<string, { fingerprint: string; lastModified: string }> = {
  // 2026-11-04: pages with catalog endpoint songs get a "Hear the highest and lowest notes" card,
  // the song named in the highest/lowest-note FAQ answers, and the song hook in the search snippet.
  // 2026-11-04: Olivia Rodrigo's card shows the most cited songs for her top and bottom notes.
  // 2026-11-04: every page closes on a "Train for this sound" card naming one program or routine.
  // 2026-11-04: most cited high/low songs for 303 more singers; the rest get a signature-song card.
  // 2026-11-03: the closing card's heading asks how much of the singer's reported range the reader's
  // range covers, instead of repeating the button ("Test my range against ...") below it.
  // 2026-11-03: the nearest-reported-floors row skips voices already shown as similar-voice cards
  // and walks outward to the next nearest, and its caption says so.
  // 2026-11-02: shared-floor and shared-ceiling chips list the closest voices (not the first names
  // alphabetically) and skip ones already linked as similar-voice cards or keyboard neighbors.
  // 2026-10-30: vocal range on the piano, comparison with the voice type and the textbook bands,
  // shared semitones on the similar-voice cards, keyboard neighbors, songs that fit, similar-range FAQ.
  // 2026-10-29: similar-voice heading says what picks the cards, other artists' recordings credited;
  // round 18: similar voices picked by nearest endpoints, the span histogram captioned;
  // round 20: similar voices ranked by range distance first, the label only breaking ties;
  // round 21: the similar-range FAQ states that rule, the songs card names the range pages and counts what it lists, and the closing line names what the comparison chart draws.
  "olivia-rodrigo": { fingerprint: "222172d5b3327148", lastModified: "2026-11-04" },
  "reba-mcentire": { fingerprint: "a9812c55d5295db9", lastModified: "2026-11-04" },
  "alex-warren": { fingerprint: "78ccf89b3ae85e98", lastModified: "2026-11-04" },
  "sam-smith": { fingerprint: "413bdc2cd03ffc4d", lastModified: "2026-11-04" },
  "arijit-singh": { fingerprint: "a64c96c0a7db42e7", lastModified: "2026-11-04" },
  adele: { fingerprint: "e567f4c267396fec", lastModified: "2026-11-04" },
};

describe("reviewed singer page freshness", () => {
  it("pins every reviewed singer page", () => {
    const reviewed = SINGERS.filter((singer) => hasDocumentedSourceReview(singer.slug)).map((s) => s.slug);
    expect(Object.keys(PINNED).sort()).toEqual([...reviewed].sort());
  });

  for (const [slug, pinned] of Object.entries(PINNED)) {
    it(`moves ${slug}'s lastmod when its content changes`, async () => {
      expect(
        await pageFingerprint(slug),
        `/singers/${slug} changed: date the change in SINGER_DATA_REVISED or SINGER_PAGE_REVISED, then re-pin`,
      ).toBe(pinned.fingerprint);
      expect(getSingerPageLastModified(slug)).toBe(pinned.lastModified);
    });
  }
});
