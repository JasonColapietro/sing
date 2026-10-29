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
  // 2026-10-29: similar-voice heading says what picks the cards, other artists' recordings credited;
  // round 18: similar voices picked by nearest endpoints, the span histogram captioned.
  "olivia-rodrigo": { fingerprint: "7b0645bb394c5c57", lastModified: "2026-10-29" },
  "reba-mcentire": { fingerprint: "d5ad69b2039cb632", lastModified: "2026-10-29" },
  "alex-warren": { fingerprint: "bc4c4b6e13561464", lastModified: "2026-10-29" },
  "sam-smith": { fingerprint: "ac70ea3d2e38f943", lastModified: "2026-10-29" },
  "arijit-singh": { fingerprint: "4e476574916aa70a", lastModified: "2026-10-29" },
  adele: { fingerprint: "7b7d020d7f9c25d5", lastModified: "2026-10-29" },
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
