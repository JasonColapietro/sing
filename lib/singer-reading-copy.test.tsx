/**
 * Round 16 reading-page guards: the claims the singer pages make about their
 * own evidence, and the house copy rules (no em dashes, American spelling) on
 * the free, indexable reading pages.
 *
 *  - The hub caveat must not say every profile is confirmed: four profiles are
 *    labelled disputed and two cite scores.
 *  - The methodology page must not say every reviewed record carries sources
 *    and a confidence level: only the source-reviewed six do.
 *  - The similar-voice cards are picked by voice type and range center, not
 *    by who reaches the page singer's notes, and the heading says so.
 *  - A song credited to another artist's recording says whose it is.
 *  - The mini range bars draw one tone: no unexplained full-voice split, and
 *    none of the ceilings reviewed profiles withhold on their own pages.
 */
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import SingerPage from "@/app/singers/[slug]/page";
import SingersPage from "@/app/singers/page";
import CanYouSingSongPage from "@/app/can-you-sing/[slug]/page";
import MethodologyPage from "@/app/singers/methodology/page";
import RecordsPage from "@/app/singers/records/page";
import VocalRangePage from "@/app/atlas/vocal-range-by-voice-type/page";
import { FamousVoices } from "@/components/landing/famous-voices";
import { ATLAS } from "@/lib/atlas-data";
import { BOOK } from "@/lib/book-data";
import { GENRE_HUB_COPY, HUB_FIGURES_NOTE, VOICE_TYPE_HUB_COPY } from "@/lib/singer-hub-copy";

const BRITISH =
  /\b(colour\w*|favour\w*|labelled|labelling|centre[ds]?|programmes?|practis(e|ed|es|ing)|analys(e|ed|ing)|recognis(e|ed|able|ing)|neighbour\w*|judgement)\b/gi;

const britishHits = (text: string): string[] => [...text.matchAll(BRITISH)].map((m) => m[0]);

const decode = (html: string) =>
  html
    .replace(/&#x27;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, "&");

/** Rendered text with code-free markup: tags stripped. */
const visible = (html: string) => decode(html).replace(/<[^>]+>/g, " ");

async function singerHtml(slug: string): Promise<string> {
  return decode(renderToStaticMarkup(await SingerPage({ params: Promise.resolve({ slug }) })));
}

describe("singer evidence claims", () => {
  it("does not claim every profile's figures are confirmed", () => {
    expect(HUB_FIGURES_NOTE).not.toMatch(/\bevery\b/i);
    expect(HUB_FIGURES_NOTE).not.toContain("confirmed");
    expect(HUB_FIGURES_NOTE).toContain("disputed");
  });

  it("says the hub caveat once on /singers/records", () => {
    const text = visible(renderToStaticMarkup(<RecordsPage />));
    expect(text).not.toContain("Open an artist profile for its source status and scope");
    expect(text).toContain("Open a profile for what its sources support.");
  });

  it("scopes sources and confidence levels to source-reviewed records", () => {
    const text = visible(renderToStaticMarkup(<MethodologyPage />)).replace(/\s+/g, " ");
    expect(text).toContain("Source-reviewed records name a human dataset editor");
    expect(text).toContain("Records marked Review confirmed");
    expect(text).toContain("do not verify either endpoint");
    expect(text).toContain("those sources do not verify the endpoints either");
    // Every label singerReviewLabel can print is defined, pending included.
    expect(text).toContain("Individual review pending");
    expect(text).not.toMatch(/(^|[.] )Reviewed records name/);
  });

  it("titles the similar-voice cards by what picks them", async () => {
    const html = await singerHtml("leonard-cohen");
    expect(html).not.toContain("Who else reaches these notes");
    expect(html).toContain("Voices with a similar catalog range");
  });

  it("credits another artist's recording on a singer page", async () => {
    const cohen = visible(await singerHtml("leonard-cohen")).replace(/\s+/g, " ");
    expect(cohen).toContain("Hallelujah (Jeff Buckley recording) vocal range: C3–F4 in C major");
    const adele = visible(await singerHtml("adele")).replace(/\s+/g, " ");
    expect(adele).not.toContain("(Adele recording)");
    expect(adele).toMatch(/[A-Za-z'] vocal range: /);
  });

  it("draws the mini range bars in one tone", async () => {
    for (const html of [
      renderToStaticMarkup(<FamousVoices />),
      renderToStaticMarkup(<SingersPage />),
      await singerHtml("whitney-houston"),
    ]) {
      expect(html).not.toContain("bg-cool/70");
    }
  });
});

describe("house copy on the free reading pages", () => {
  it("keeps em dashes and British spelling off the voice-type reference, FAQ JSON-LD included", () => {
    const html = decode(renderToStaticMarkup(<VocalRangePage />));
    expect(html).not.toContain("—");
    expect(britishHits(visible(html))).toEqual([]);
  });

  it("keeps British spelling out of the hub copy", () => {
    // `neighbour` is a field name, not copy; "Musical Theatre" is the genre's name.
    const prose = [...Object.values(GENRE_HUB_COPY), ...Object.values(VOICE_TYPE_HUB_COPY)].flatMap(
      (copy) => Object.entries(copy).filter(([key]) => key !== "neighbour").map(([, value]) => value),
    );
    const all = [HUB_FIGURES_NOTE, ...prose].join(" ");
    expect(britishHits(all)).toEqual([]);
  });

  it("keeps em dashes and British spelling out of the free atlas chapters", () => {
    const free = ATLAS.filter((c) => c.free);
    expect(free.length).toBeGreaterThan(0);
    for (const c of free) {
      expect(c.body, c.slug).not.toContain("—");
      expect(britishHits(c.body), c.slug).toEqual([]);
    }
  });

  it("keeps em dashes out of the free book chapters and British spelling out of the whole book", () => {
    const free = BOOK.filter((c) => c.free);
    expect(free.length).toBe(3);
    for (const c of free) expect(c.body, c.slug).not.toContain("—");
    for (const c of BOOK) expect(britishHits(`${c.title} ${c.summary} ${c.body}`), c.slug).toEqual([]);
  });
});

describe("owner-confirmed records with earlier sources", () => {
  it("scope those sources on the singer page, as a pending record does", async () => {
    for (const slug of ["taylor-swift", "jeff-buckley", "damiano-david"]) {
      const text = visible(await singerHtml(slug)).replace(/\s+/g, " ");
      expect(text, slug).toContain("Review confirmed");
      expect(text, slug).toContain("They do not verify the catalog's range endpoints.");
    }
  });

  it("print a /can-you-sing voice type as a catalog label, not a bare fact", async () => {
    const text = visible(
      decode(renderToStaticMarkup(await CanYouSingSongPage({ params: Promise.resolve({ slug: "hallelujah" }) }))),
    ).replace(/\s+/g, " ");
    expect(text).toContain("(catalog label: Tenor)");
    expect(text).not.toContain("(Tenor)");
  });
});
