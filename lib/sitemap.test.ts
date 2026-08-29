/**
 * Sitemap indexability guard.
 *
 * Search Console reported /atlas/notes-octaves-and-the-keyboard as a sitemap
 * URL excluded by a noindex tag after the chapter changed from gated to free.
 * The report's crawl predates that transition, but a real future mismatch must
 * still fail locally: a chapter route whose generated metadata says noindex
 * cannot be published in the sitemap.
 */
import type { Metadata } from "next";
import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import sitemap from "@/app/sitemap";
import { generateMetadata as atlasMetadata } from "@/app/atlas/[slug]/page";
import { generateMetadata as bookMetadata } from "@/app/book/[slug]/page";
import { ATLAS_CONTENTS } from "@/lib/atlas-data";
import { BOOK_CONTENTS } from "@/lib/book-data";
import { SITE_URL } from "@/lib/site";

function saysNoindex(robots: Metadata["robots"]): boolean {
  if (!robots) return false;
  if (typeof robots === "string") {
    return /\b(?:noindex|none)\b/i.test(robots);
  }

  const googleBot = robots.googleBot;
  return (
    robots.index === false ||
    (typeof googleBot === "string"
      ? /\b(?:noindex|none)\b/i.test(googleBot)
      : googleBot?.index === false)
  );
}

describe("sitemap indexability", () => {
  it("never publishes an Atlas or book chapter whose route metadata says noindex", async () => {
    const published = new Set(sitemap().map(({ url }) => url));
    const chapters = await Promise.all([
      ...ATLAS_CONTENTS.map(async (chapter) => ({
        kind: "atlas" as const,
        url: `${SITE_URL}/atlas/${chapter.slug}`,
        metadata: await atlasMetadata({
          params: Promise.resolve({ slug: chapter.slug }),
        }),
      })),
      ...BOOK_CONTENTS.map(async (chapter) => ({
        kind: "book" as const,
        url: `${SITE_URL}/book/${chapter.slug}`,
        metadata: await bookMetadata({
          params: Promise.resolve({ slug: chapter.slug }),
        }),
      })),
    ]);

    const noindexed = chapters.filter(({ metadata }) =>
      saysNoindex(metadata.robots),
    );

    // Keep the assertion non-vacuous: this product deliberately noindexes
    // gated shells in both route families, so both branches must be exercised.
    expect(noindexed.some(({ kind }) => kind === "atlas")).toBe(true);
    expect(noindexed.some(({ kind }) => kind === "book")).toBe(true);

    const leaked = noindexed
      .filter(({ url }) => published.has(url))
      .map(({ url }) => url);
    expect(
      leaked,
      `sitemap publishes noindexed chapter routes: ${leaked.join(", ")}`,
    ).toEqual([]);
  });

  it("keeps the alerted Atlas chapter public after its gated-to-free transition", async () => {
    // Lock the resolved state of the exact Search Console example: this route
    // is public content now, so all three source layers must agree.
    const alertSlug = "notes-octaves-and-the-keyboard";
    const alertUrl = `${SITE_URL}/atlas/${alertSlug}`;
    const metadata = await atlasMetadata({
      params: Promise.resolve({ slug: alertSlug }),
    });
    expect(ATLAS_CONTENTS.find(({ slug }) => slug === alertSlug)?.free).toBe(
      true,
    );
    expect(sitemap().some(({ url }) => url === alertUrl)).toBe(true);
    expect(saysNoindex(metadata.robots)).toBe(false);
  });
});
