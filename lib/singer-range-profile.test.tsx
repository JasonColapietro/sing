/**
 * Search Console (Aug 18) listed 284 of the ~421 singer profiles of the time as
 * "Discovered, currently not indexed": found, then judged not worth crawling.
 * The pages shared one template whose words were mostly caveats with the name
 * and notes swapped in. This file guards the fix: every profile answers "what
 * is <singer>'s vocal range?" with a range explainer computed from its own
 * catalog numbers, an FAQ whose markup matches what is on screen, at least
 * three inbound links from other profiles, and a self-canonical, indexable,
 * sitemap-listed URL.
 */
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import SingerPage, { generateMetadata } from "@/app/singers/[slug]/page";
import sitemap from "@/app/sitemap";
import { INDEXABLE_ROBOTS } from "@/lib/robots-meta";
import { getSingerPageLastModified } from "@/lib/singer-evidence";
import {
  bandCoverage,
  keyboardFacts,
  keyboardNeighbors,
  keyboardParagraphs,
  linkedSingerSlugs,
  songsInRange,
  voiceTypeParagraphs,
} from "@/lib/singer-range-profile";
import { SINGERS, singerBySlug } from "@/lib/singers";
import { SITE_URL } from "@/lib/site";

const decode = (html: string) =>
  html.replace(/&#x27;/g, "'").replace(/&quot;/g, '"').replace(/&amp;/g, "&");

/** Visible words: scripts dropped, tags stripped. */
const visibleText = (html: string) =>
  decode(html.replace(/<script[\s\S]*?<\/script>/g, " ").replace(/<[^>]+>/g, " "))
    .replace(/\s+/g, " ")
    .trim();

/** Every profile page renders at least this many visible words (before: 576 to 965 on the built site). */
const MIN_WORDS = 850;

const aaliyah = singerBySlug("aaliyah")!;

describe("range explainer arithmetic", () => {
  it("places Aaliyah's C#3–A5 on an 88-key piano", () => {
    expect(keyboardFacts(aaliyah)).toEqual({
      keys: 33,
      whiteKeys: 19,
      blackKeys: 14,
      pianoKeys: { low: 29, high: 61 },
      octaves: [3, 4, 5],
      centerMidi: 65,
      frequencyRatio: expect.closeTo(6.35, 2),
    });
    const text = keyboardParagraphs(aaliyah).join(" ");
    expect(text).toContain("from key 29 (C#3) to key 61 (A5)");
    expect(text).toContain("C#3, sits 11 semitones below middle C (C4). The highest, A5, sits 21 semitones, about 1.8 octaves, above middle C, so the span crosses middle C.");
    expect(text).toContain("C#3 is about 138.6 Hz and A5 is about 880.0 Hz");
    expect(text).toContain("the note halfway through it is F4");
  });

  it("lists only the textbook bands the span really contains as fully covered", () => {
    const { full, partial } = bandCoverage(aaliyah);
    expect(full).toEqual(["Contralto", "Countertenor", "Mezzo-soprano"]);
    expect(partial.find((p) => p.type === "Soprano")).toEqual({ type: "Soprano", semitones: 21 });
    const text = voiceTypeParagraphs(aaliyah, true).join(" ");
    expect(text).toContain("fully covers the contralto (F3–F5), countertenor (G3–G5) and mezzo-soprano (A3–A5) bands");
    expect(text).toContain("soprano (C4–C6, 21 of 24 semitones)");
    expect(text).toMatch(/^Across the \d+ sopranos in this catalog/);
  });

  it("leaves the catalog-label comparison out where a reviewed correction disputes the label", () => {
    const sam = singerBySlug("sam-smith")!;
    const text = voiceTypeParagraphs(sam, false).join(" ");
    expect(text).not.toMatch(/Across the \d+/);
    expect(text).toContain("textbook voice-type bands");
  });

  it("keeps songs that fit inside the span as written, and never the singer's own", () => {
    for (const s of SINGERS) {
      for (const song of songsInRange(s)) {
        expect(song.artistSlugs).not.toContain(s.slug);
        expect(song.lowMidi).toBeGreaterThanOrEqual(s.lowMidi);
        expect(song.highMidi).toBeLessThanOrEqual(s.highMidi);
      }
    }
  });
});

describe("every singer is linked from at least three other singer pages", () => {
  it("counts inbound profile links across the catalog", () => {
    const inbound = new Map(SINGERS.map((s) => [s.slug, new Set<string>()]));
    for (const s of SINGERS) {
      for (const slug of linkedSingerSlugs(s)) if (slug !== s.slug) inbound.get(slug)!.add(s.slug);
    }
    const starved = [...inbound].filter(([, from]) => from.size < 3).map(([slug, from]) => `${slug}:${from.size}`);
    expect(starved).toEqual([]);
  });

  it("keyboard neighbors never include the singer and always hold six", () => {
    for (const s of SINGERS) {
      const n = keyboardNeighbors(s);
      expect(n).toHaveLength(6);
      expect(n.map((o) => o.slug)).not.toContain(s.slug);
    }
  });

  it("mirrors the links the page actually renders", async () => {
    for (const slug of ["aaliyah", SINGERS[0].slug, SINGERS.at(-1)!.slug, "sam-smith"]) {
      const html = renderToStaticMarkup(await SingerPage({ params: Promise.resolve({ slug }) }));
      const rendered = new Set(
        [...html.matchAll(/href="\/singers\/([a-z0-9-]+)"/g)].map((m) => m[1]),
      );
      for (const linked of linkedSingerSlugs(singerBySlug(slug)!)) {
        expect(rendered.has(linked), `${slug} -> ${linked}`).toBe(true);
      }
    }
  });
});

const BATCH = 32;
/** Page text with the singer's name masked, by slug: no two profiles may read the same. */
const seenPages = new Map<string, string>();
const BATCHES = Array.from({ length: Math.ceil(SINGERS.length / BATCH) }, (_, i) => [
  SINGERS.slice(i * BATCH, (i + 1) * BATCH),
] as const);

describe("every singer page is a thick, indexable answer page", () => {
  it.each(BATCHES)(
    "render batch %#",
    async (singers) => {
      const map = sitemap();
      for (const s of singers) {
        const url = `${SITE_URL}/singers/${s.slug}`;
        const meta = await generateMetadata({ params: Promise.resolve({ slug: s.slug }) });
        expect(meta.alternates?.canonical, s.slug).toBe(url);
        expect(meta.robots, s.slug).toEqual(INDEXABLE_ROBOTS);
        const entries = map.filter((e) => e.url === url);
        expect(entries, s.slug).toHaveLength(1);
        expect(entries[0].lastModified, s.slug).toBe(getSingerPageLastModified(s.slug));

        const html = renderToStaticMarkup(await SingerPage({ params: Promise.resolve({ slug: s.slug }) }));
        const text = visibleText(html);

        // The answer: the H1 names the singer and the vocal range.
        const h1 = decode(/<h1[^>]*>([\s\S]*?)<\/h1>/.exec(html)![1]);
        expect(h1, s.slug).toContain(s.name);
        expect(h1, s.slug).toContain("Vocal Range");

        // The explainer sections, each with the singer's own computed figures.
        expect(html, s.slug).toContain('id="piano"');
        expect(html, s.slug).toContain('id="voice-type-comparison"');
        expect(html, s.slug).toContain('id="practice"');
        for (const line of [...keyboardParagraphs(s)]) expect(text, s.slug).toContain(line);

        expect(text.split(" ").length, `${s.slug} word count`).toBeGreaterThanOrEqual(MIN_WORDS);
        const masked = text.replaceAll(s.name, "NAME");
        expect(seenPages.get(masked), `${s.slug} reads the same as another profile`).toBeUndefined();
        seenPages.set(masked, s.slug);

        // JSON-LD parses; FAQPage questions are the visible questions; the page is about the singer.
        const ld = JSON.parse(
          /<script type="application\/ld\+json">([\s\S]*?)<\/script>/.exec(html)![1],
        ) as { "@graph": Array<Record<string, unknown>> };
        const graph = ld["@graph"];
        const page = graph.find((n) => n["@type"] === "WebPage")!;
        const person = graph.find((n) => n["@type"] === "Person")!;
        expect(page.about, s.slug).toEqual({ "@id": person["@id"] });
        expect(page.url, s.slug).toBe(url);
        expect((page.breadcrumb as { "@type": string })["@type"]).toBe("BreadcrumbList");
        const faq = graph.find((n) => n["@type"] === "FAQPage") as {
          mainEntity: Array<{ name: string; acceptedAnswer: { text: string } }>;
        };
        const questions = faq.mainEntity.map((q) => q.name);
        expect(questions, s.slug).toContain(`What is ${s.name}’s highest note?`);
        expect(questions, s.slug).toContain(`How many octaves can ${s.name} sing?`);
        expect(questions, s.slug).toContain(`What voice type is ${s.name}?`);
        expect(questions, s.slug).toContain(`Who has a similar vocal range to ${s.name}?`);
        for (const q of faq.mainEntity) {
          expect(text, `${s.slug}: ${q.name}`).toContain(q.name);
          expect(text, `${s.slug}: ${q.name}`).toContain(q.acceptedAnswer.text);
        }
      }
    },
    60_000,
  );

});
