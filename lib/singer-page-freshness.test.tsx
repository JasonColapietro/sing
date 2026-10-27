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
 * Each reviewed singer page, pinned to what it said on the day its
 * sitemap lastmod and JSON-LD dateModified name. Round 8 corrected Alex
 * Warren's range, which also moved catalog ranks on three other reviewed
 * pages, and the dates stayed put; rounds 2 and 3 had already fixed the same
 * drift once each.
 *
 * When this fails, the page's content changed. Set the ship date in
 * SINGER_DATA_REVISED (lib/singer-evidence.ts) for each page whose figures
 * moved, or bump SINGER_PAGE_REVISED when the shared template's words changed,
 * then update the fingerprint and the date here together.
 */
const PINNED: Record<string, { fingerprint: string; lastModified: string }> = {
  // 2026-10-27: the opening now leads with "<name>’s reported vocal range is"
  // and the voice card links the Atlas chapter, so SINGER_PAGE_REVISED moved.
  // 2026-10-27: re-pinned for punctuation only (em dashes out of the shared
  // template); no content change, so the lastmod stays.
  "olivia-rodrigo": { fingerprint: "8d13c982ab571843", lastModified: "2026-10-27" },
  "reba-mcentire": { fingerprint: "519b9f407a1249d6", lastModified: "2026-10-27" },
  "alex-warren": { fingerprint: "79cb8bf98f7458b0", lastModified: "2026-10-27" },
  "sam-smith": { fingerprint: "61fe8889d9efb215", lastModified: "2026-10-27" },
  "arijit-singh": { fingerprint: "5d5167bceea438d9", lastModified: "2026-10-27" },
  adele: { fingerprint: "c5436e7219c6c973", lastModified: "2026-10-27" },
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
