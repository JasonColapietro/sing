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
import { generateMetadata as singerMetadata } from "@/app/singers/[slug]/page";
import { generateMetadata as bookMetadata } from "@/app/book/[slug]/page";
import { metadata as programsMetadata } from "@/app/programs/page";
import { ATLAS_CONTENTS } from "@/lib/atlas-data";
import { BOOK_CONTENTS } from "@/lib/book-data";
import { RELEASE_DATE as CHANGELOG_RELEASE_DATE } from "@/app/changelog/page";
import {
  getSingerEvidence,
  getSingerPageLastModified,
  hasDocumentedSourceReview,
} from "@/lib/singer-evidence";
import {
  HUB_GENRES,
  SINGERS,
  VOICE_KINDS,
  genreSlug,
  singersByGenre,
  singersByVoiceType,
  voiceTypeSlug,
  type Singer,
} from "@/lib/singers";
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
  it("publishes the generated Grunge singer hub", () => {
    expect(sitemap()).toContainEqual(
      expect.objectContaining({
        url: `${SITE_URL}/singers/genre/grunge`,
        changeFrequency: "monthly",
        priority: 0.7,
      }),
    );
  });

  it("publishes the programs page with its canonical URL", () => {
    expect(sitemap()).toContainEqual(
      expect.objectContaining({ url: `${SITE_URL}/programs` }),
    );
    expect(programsMetadata.alternates?.canonical).toBe(`${SITE_URL}/programs`);
    expect(programsMetadata.openGraph?.url).toBe(`${SITE_URL}/programs`);
  });

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

describe("public singer page indexing", () => {
  it("keeps every public singer indexable and listed regardless of evidence review status", async () => {
    const published = new Set(sitemap().map(({ url }) => url));
    let confirmed = 0;
    let reviewed = 0;
    for (const singer of SINGERS) {
      const url = `${SITE_URL}/singers/${singer.slug}`;
      const metadata = await singerMetadata({
        params: Promise.resolve({ slug: singer.slug }),
      });
      if (hasDocumentedSourceReview(singer.slug)) {
        reviewed += 1;
      } else if (getSingerEvidence(singer.slug).reviewConfirmation) {
        confirmed += 1;
      }
      expect(saysNoindex(metadata.robots), url).toBe(false);
      expect(published.has(url), url).toBe(true);
    }
    // Both branches must be exercised or the guard is vacuous.
    expect(confirmed).toBeGreaterThan(0);
    expect(reviewed).toBeGreaterThan(0);
  });

  it("keeps the public /singers hub listed", () => {
    expect(sitemap().some(({ url }) => url === `${SITE_URL}/singers`)).toBe(true);
  });
});

describe("sitemap lastmod", () => {
  const latest = (singers: readonly Singer[]) =>
    singers.map((s) => getSingerPageLastModified(s.slug)).sort().at(-1);
  const entry = (path: string) => sitemap().find(({ url }) => url === `${SITE_URL}${path}`);

  it("dates each singer hub by the latest page date among the singers it lists", () => {
    const catalog = latest(SINGERS);
    expect(catalog).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(entry("/singers")?.lastModified).toBe(catalog);
    // The records ranking is computed against the whole catalog.
    expect(entry("/singers/records")?.lastModified).toBe(catalog);
    expect(VOICE_KINDS.length).toBeGreaterThan(0);
    for (const v of VOICE_KINDS) {
      const path = `/singers/voice-type/${voiceTypeSlug(v)}`;
      expect(entry(path)?.lastModified, path).toBe(latest(singersByVoiceType(v)));
    }
    expect(HUB_GENRES.length).toBeGreaterThan(0);
    for (const g of HUB_GENRES) {
      const path = `/singers/genre/${genreSlug(g)}`;
      expect(entry(path)?.lastModified, path).toBe(latest(singersByGenre(g)));
    }
  });

  it("dates /changelog by its release date", () => {
    expect(CHANGELOG_RELEASE_DATE).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(entry("/changelog")?.lastModified).toBe(CHANGELOG_RELEASE_DATE);
  });

  it("leaves lastmod off pages with no recorded content date, rather than inventing one", () => {
    for (const path of ["", "/studio", "/pro", "/singers/methodology", "/songs", "/can-you-sing"]) {
      expect(entry(path), path).toBeDefined();
      expect(entry(path)?.lastModified, path).toBeUndefined();
    }
    const undated = sitemap().filter(
      ({ url }) => url.startsWith(`${SITE_URL}/songs/`) || url.startsWith(`${SITE_URL}/can-you-sing/`),
    );
    expect(undated.length).toBeGreaterThan(0);
    for (const { url, lastModified } of undated) expect(lastModified, url).toBeUndefined();
  });

  it("never dates an entry by the build: every lastmod is a fixed YYYY-MM-DD", () => {
    const dated = sitemap().filter(({ lastModified }) => lastModified !== undefined);
    expect(dated.length).toBeGreaterThan(SINGERS.length);
    for (const { url, lastModified } of dated) {
      expect(typeof lastModified, url).toBe("string");
      expect(lastModified, url).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });
});
