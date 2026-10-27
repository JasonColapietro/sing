import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
import SingerPage, {
  generateMetadata,
} from "@/app/singers/[slug]/page";
import { SINGERS, rangeLabel, spanOctaves } from "@/lib/singers";
import { midiToLabel } from "@/lib/audio/notes";
import { isSingerReviewed, voiceTypeEvidenceCopy } from "@/lib/singer-evidence";
import { SITE_URL } from "@/lib/site";

const ARTIST_INTENT_CASES = [
  {
    slug: "celine-dion",
    name: "Celine Dion",
    opening: "Celine Dion’s reported vocal range is A#2 to C6, about 3.2 octaves (38 semitones). That is a reported reference span, not an independently verified physiological limit. The catalog lists Celine Dion as a soprano; this is a reported reference classification.",
    title: "Celine Dion Vocal Range & Voice Type | Compare Yours",
    heading: "Celine Dion Vocal Range: Reported A#2–C6",
  },
  {
    slug: "peter-steele",
    name: "Peter Steele",
    opening: "Peter Steele’s reported vocal range is F1 to G5, about 4.2 octaves (50 semitones). That is a reported reference span, not an independently verified physiological limit. A MetalSucks memorial describes Peter Steele's singing voice as baritone; it does not establish a definitive bass-baritone classification or range endpoints.",
    title: "Peter Steele Vocal Range & Voice Type | Compare Yours",
    heading: "Peter Steele Vocal Range: Reported F1–G5",
  },
  {
    slug: "michael-jackson",
    name: "Michael Jackson",
    opening: "Michael Jackson’s reported vocal range is D#2 to F6, about 4.2 octaves (50 semitones). That is a reported reference span, not an independently verified physiological limit. The catalog lists Michael Jackson as a tenor; this is a reported reference classification.",
    title: "Michael Jackson Vocal Range & Voice Type | Compare Yours",
    heading: "Michael Jackson Vocal Range: Reported D#2–F6",
  },
  {
    slug: "bruno-mars",
    name: "Bruno Mars",
    opening: "Bruno Mars’s reported vocal range is G2 to D6, about 3.6 octaves (43 semitones). That is a reported reference span, not an independently verified physiological limit. The catalog lists Bruno Mars as a tenor; this is a reported reference classification.",
    title: "Bruno Mars Vocal Range: Reported G2–D6, Tenor | Suede Sing",
    heading: "Bruno Mars Vocal Range: Reported G2–D6",
  },
  {
    slug: "taylor-swift",
    name: "Taylor Swift",
    opening: "Taylor Swift’s reported vocal range is A2 to A#5, about 3.1 octaves (37 semitones). That is a reported reference span, not an independently verified physiological limit. The catalog lists Taylor Swift as a mezzo-soprano; this is a reported reference classification.",
    title: "Taylor Swift Vocal Range: Reported A2–A#5, Mezzo-soprano",
    heading: "Taylor Swift Vocal Range: Reported A2–A#5",
  },
  {
    slug: "jeff-buckley",
    name: "Jeff Buckley",
    opening: "Jeff Buckley’s reported vocal range is E2 to D6, about 3.8 octaves (46 semitones). That is a reported reference span, not an independently verified physiological limit. Jeff Buckley's official FAQ describes him as a tenor with a four-octave range; it does not verify this catalog's exact E2–D6 endpoints.",
    title: "Jeff Buckley Vocal Range: Reported E2–D6, Tenor | Suede Sing",
    heading: "Jeff Buckley Vocal Range: Reported E2–D6",
  },
  {
    slug: "billie-eilish",
    name: "Billie Eilish",
    opening: "Billie Eilish’s reported vocal range is A2 to B5, about 3.2 octaves (38 semitones). That is a reported reference span, not an independently verified physiological limit. The catalog lists Billie Eilish as a mezzo-soprano; this is a reported reference classification.",
    title: "Billie Eilish Vocal Range: Reported A2–B5, Mezzo-soprano",
    heading: "Billie Eilish Vocal Range: Reported A2–B5",
  },
  {
    slug: "olivia-rodrigo",
    name: "Olivia Rodrigo",
    opening: "Olivia Rodrigo’s reported vocal range is B2 to A#5, about 2.9 octaves (35 semitones). That is a reported reference span, not an independently verified physiological limit. Olivia Rodrigo's voice type is disputed in the reviewed sources; this review does not establish a definitive classical classification.",
    title: "Olivia Rodrigo Vocal Range & Voice Type | Test Yours",
    heading: "Olivia Rodrigo Voice Type and Vocal Range",
  },
  {
    slug: "reba-mcentire",
    name: "Reba McEntire",
    opening: "Reba McEntire’s reported vocal range is E3 to F5, about 2.1 octaves (25 semitones). That is a reported reference span, not an independently verified physiological limit. Reba McEntire's own lesson describes a peak-career span of about three octaves, wider than this catalog's listed span, but gives no endpoints; the reviewed sources do not establish a definitive classical voice type.",
    title: "Reba McEntire Vocal Range & Voice Type: Classifications Vary",
    heading: "Reba McEntire Voice Type and Vocal Range",
  },
  {
    slug: "alex-warren",
    name: "Alex Warren",
    opening: "Alex Warren’s reported vocal range is G2 to A4, about 2.2 octaves (26 semitones). That is a reported reference span, not an independently verified physiological limit. Published evidence supports written compasses for specific Alex Warren songs, not a definitive baritone classification or full-career endpoints.",
    title: "Alex Warren Vocal Range & Voice Type: No Definitive Type",
    heading: "Alex Warren Voice Type and Vocal Range",
  },
  {
    slug: "sam-smith",
    name: "Sam Smith",
    opening: "Sam Smith’s reported vocal range is G2 to C6, about 3.4 octaves (41 semitones). That is a reported reference span, not an independently verified physiological limit. Sam Smith's long-time coach describes baritone-to-tenor territory; the reviewed sources do not establish a definitive countertenor classification.",
    title: "Sam Smith Vocal Range & Voice Type: Baritone-to-Tenor",
    heading: "Sam Smith Voice Type and Vocal Range",
  },
  {
    slug: "arijit-singh",
    name: "Arijit Singh",
    opening: "Arijit Singh’s reported vocal range is C3 to C5, about 2.0 octaves (24 semitones). That is a reported reference span, not an independently verified physiological limit. A public artist biography describes Arijit Singh as a rich baritone; the reviewed sources dispute a definitive tenor label.",
    title: "Arijit Singh Vocal Range: Reported C3–C5 · Compare Yours",
    heading: "Arijit Singh Vocal Range: Reported C3–C5",
  },
  {
    slug: "adele",
    name: "Adele",
    opening: "Adele’s reported vocal range is C3 to A#5, about 2.8 octaves (34 semitones). That is a reported reference span, not an independently verified physiological limit. Reviewed expert analysis describes Adele as a mezzo-soprano, with chest mix to E5.",
    title: "Adele Vocal Range: Reported C3–A#5, Mezzo-soprano",
    heading: "Adele Vocal Range: Reported C3–A#5",
  },
] as const;

const SPECIAL_TITLE_CASES: Readonly<Record<string, { title: string; opening: string }>> =
  Object.fromEntries(
    ARTIST_INTENT_CASES.map(({ slug, title, opening }) => [slug, { title, opening }]),
  );

const VOICE_TYPE_QUERY_SLUGS: ReadonlySet<string> = new Set([
  "olivia-rodrigo",
  "reba-mcentire",
  "alex-warren",
  "sam-smith",
]);
const ORIGINAL_PRIORITY_SLUGS: ReadonlySet<string> = new Set([
  "bruno-mars", "taylor-swift", "jeff-buckley", "billie-eilish",
  "celine-dion", "peter-steele", "michael-jackson",
]);
const COMPARISON_SNIPPETS: Readonly<Record<string, string>> = {
  "celine-dion": "Explore Celine Dion's reported vocal range and catalog voice type. Take the free range test to compare yours.",
  "peter-steele": "Explore Peter Steele's reported vocal range and catalog voice type. Take the free range test to compare yours.",
  "michael-jackson": "Explore Michael Jackson's reported vocal range and catalog voice type. Take the free range test to compare yours.",
};
const OLIVIA_SNIPPET = "Explore Olivia Rodrigo's reported vocal range, disputed voice-type labels, and song-level sources. Take the free range test to compare your notes.";
const VOICE_TYPE_CORRECTION_SLUGS: ReadonlySet<string> = new Set([
  "olivia-rodrigo", "reba-mcentire", "alex-warren", "sam-smith", "arijit-singh",
]);

/** The click-first search snippet each singer page should carry. */
function expectedSnippet(singer: (typeof SINGERS)[number]): string {
  if (singer.slug === "olivia-rodrigo") return OLIVIA_SNIPPET;
  if (COMPARISON_SNIPPETS[singer.slug]) return COMPARISON_SNIPPETS[singer.slug];
  const span = `${singer.name}'s reported vocal range is ${midiToLabel(singer.lowMidi)} to ${midiToLabel(singer.highMidi)}, about ${spanOctaves(singer.highMidi - singer.lowMidi)} octaves`;
  if (VOICE_TYPE_CORRECTION_SLUGS.has(singer.slug)) {
    return `${span}. Reviewed sources don't settle the voice type. See why, then test your own range free.`;
  }
  const typed = `${span} (${singer.voiceType.toLowerCase()}).`;
  const full = `${typed} See the highest and lowest notes, then test your own range free.`;
  return full.length <= 155 ? full : `${typed} Test your own range free.`;
}

/** "{Singer} Vocal Range: Reported {span}" plus the longest suffix that fits in 60. */
function expectedDefaultTitle(singer: (typeof SINGERS)[number]): string {
  const answer = `${singer.name} Vocal Range: Reported ${rangeLabel(singer)}`;
  return [
    `${answer}, ${singer.voiceType} | Suede Sing`,
    `${answer}, ${singer.voiceType}`,
    `${answer} | Suede Sing`,
    `${answer} | Compare Yours`,
  ].find((t) => t.length <= 60) ?? answer;
}
const SINGER_RENDER_BATCH_SIZE = 32;
const SINGER_RENDER_BATCHES = Array.from(
  { length: Math.ceil(SINGERS.length / SINGER_RENDER_BATCH_SIZE) },
  (_, index) => [
    SINGERS.slice(
      index * SINGER_RENDER_BATCH_SIZE,
      (index + 1) * SINGER_RENDER_BATCH_SIZE,
    ),
  ] as const,
);

describe("every singer page answers its vocal range and voice type intent", () => {
  it.each(ARTIST_INTENT_CASES)(
    "$slug aligns search metadata to observed page-level query intent",
    async ({ slug, title }) => {
      const metadata = await generateMetadata({
        params: Promise.resolve({ slug }),
      });

      expect(metadata.title).toEqual({ absolute: title });
      if (ORIGINAL_PRIORITY_SLUGS.has(slug) || slug === "olivia-rodrigo") expect(title.length).toBeLessThanOrEqual(60);
      expect(metadata.description).toBe(expectedSnippet(SINGERS.find((x) => x.slug === slug)!));
      expect(metadata.openGraph?.title).toBe(title);
      expect(metadata.openGraph?.description).toBe(metadata.description);
      expect(metadata.openGraph?.url).toBe(`${SITE_URL}/singers/${slug}`);
    },
  );

  it.each(ARTIST_INTENT_CASES)(
    "$slug makes the query answer visible in the server-rendered heading and opening",
    async ({ slug, opening, heading }) => {
      const page = await SingerPage({ params: Promise.resolve({ slug }) });
      const html = renderToStaticMarkup(page);
      const readableHtml = html.replaceAll("&#x27;", "'");

      expect(readableHtml).toContain(
        `<h1 class="text-4xl sm:text-5xl">${heading}</h1>`,
      );
      expect(readableHtml).toContain(opening);
    },
  );

  it("covers every singer with an absolute answer title, description, and Open Graph URL", async () => {
    for (const singer of SINGERS) {
      const metadata = await generateMetadata({
        params: Promise.resolve({ slug: singer.slug }),
      });
      const title = SPECIAL_TITLE_CASES[singer.slug]?.title ?? expectedDefaultTitle(singer);
      const description = expectedSnippet(singer);

      expect(title.length, `${singer.slug} title length`).toBeLessThanOrEqual(60);
      expect(title.startsWith(`${singer.name} Vocal Range`), `${singer.slug} title lead`).toBe(true);
      expect(description.length, `${singer.slug} description length`).toBeLessThanOrEqual(155);
      expect(description, `${singer.slug} description`).not.toMatch(/pending/i);

      expect(metadata.title).toEqual({ absolute: title });
      expect(metadata.description).toBe(description);
      expect(metadata.openGraph?.title).toBe(title);
      expect(metadata.openGraph?.description).toBe(metadata.description);
      expect(metadata.openGraph?.url).toBe(
        `${SITE_URL}/singers/${singer.slug}`,
      );
    }
  });

  it.each([
    [
      "freddie-mercury",
      "Freddie Mercury Vocal Range: Reported F2–F6, Baritone",
      "Freddie Mercury's reported vocal range is F2 to F6, about 4.0 octaves (baritone). See the highest and lowest notes, then test your own range free.",
    ],
    [
      "bruno-mars",
      "Bruno Mars Vocal Range: Reported G2–D6, Tenor | Suede Sing",
      "Bruno Mars's reported vocal range is G2 to D6, about 3.6 octaves (tenor). See the highest and lowest notes, then test your own range free.",
    ],
    [
      "reba-mcentire",
      "Reba McEntire Vocal Range & Voice Type: Classifications Vary",
      "Reba McEntire's reported vocal range is E3 to F5, about 2.1 octaves. Reviewed sources don't settle the voice type. See why, then test your own range free.",
    ],
  ])("%s reads as an answer in search results", async (slug, title, description) => {
    const metadata = await generateMetadata({ params: Promise.resolve({ slug }) });
    expect(metadata.title).toEqual({ absolute: title });
    expect(metadata.description).toBe(description);
  });

  it("keeps Olivia's snippet concise and its disputed status explicit", async () => {
    const metadata = await generateMetadata({ params: Promise.resolve({ slug: "olivia-rodrigo" }) });
    expect((metadata.title as { absolute: string }).absolute.length).toBeLessThanOrEqual(60);
    expect(metadata.description!.length).toBeLessThanOrEqual(155);
    expect(metadata.description).toContain("disputed");
    expect(metadata.description).toContain("free range test");
  });

  /**
   * Each batch server-renders 64 singer pages, and the first one also pays for
   * the module graph and React's server renderer warming up — enough to blow
   * vitest's 5s default while later batches finish comfortably inside it. That
   * made batch 0 alone fail on a suite that is otherwise green, which reads as
   * a regression in the page and is not one. The budget is generous on purpose:
   * it is here to stop a cold start flaking the gate, not to police render speed.
   */
  it.each(SINGER_RENDER_BATCHES)(
    "covers singer render batch %# in the H1 and opening answer",
    async (singers) => {
      for (const singer of singers) {
        const page = await SingerPage({
          params: Promise.resolve({ slug: singer.slug }),
        });
        const html = renderToStaticMarkup(page).replaceAll("&#x27;", "'");
        const heading = VOICE_TYPE_QUERY_SLUGS.has(singer.slug)
          ? `${singer.name} Voice Type and Vocal Range`
          : `${singer.name} Vocal Range: Reported ${rangeLabel(singer)}`;
        const defaultOpening = !isSingerReviewed(singer.slug)
          ? `Our catalog reports ${singer.name} at ${midiToLabel(singer.lowMidi)} to ${midiToLabel(singer.highMidi)} (${spanOctaves(singer.highMidi - singer.lowMidi)} octaves). Individual endpoint review is pending. Compare your range free.`
          : `${singer.name}’s reported vocal range is ${midiToLabel(singer.lowMidi)} to ${midiToLabel(singer.highMidi)}, about ${spanOctaves(singer.highMidi - singer.lowMidi)} octaves (${singer.highMidi - singer.lowMidi} semitones). That is a reported reference span, not an independently verified physiological limit. ${voiceTypeEvidenceCopy(singer)}`;
        const opening = SPECIAL_TITLE_CASES[singer.slug]?.opening ?? defaultOpening;

        expect(html).toContain(
          `<h1 class="text-4xl sm:text-5xl">${heading}</h1>`,
        );
        expect(html).toContain(opening);
        expect(html).toContain(`href="/range?compare=${singer.slug}#start"`);
        expect(html).toContain(COMPARISON_SNIPPETS[singer.slug] ? "Compare my range · free test" : "Test my range");
      }
    },
    30_000,
  );

  it.each(ARTIST_INTENT_CASES.filter(({ slug }) => ORIGINAL_PRIORITY_SLUGS.has(slug)))(
    "$slug keeps reported endpoints separate from verified individual extrema",
    async ({ slug, name }) => {
      const page = await SingerPage({ params: Promise.resolve({ slug }) });
      const html = renderToStaticMarkup(page).replaceAll("&#x27;", "'");

      expect(html).toContain("Review confirmed");
      expect(html).toContain("not an independently verified physiological limit");
      expect(html).not.toContain("review is pending");
      expect(html).toContain("The catalog record does not independently establish the upper endpoint as an individual highest note.");
      expect(html).toContain("The catalog record does not independently establish the lower endpoint as an individual physiological limit.");
      expect(html).toContain(`What voice type is ${name}?`);
      expect(html).not.toContain("Full voice to");
    },
  );

  it.each(Object.keys(COMPARISON_SNIPPETS))("%s keeps the CTR pilot honest and directly actionable", async (slug) => {
    const metadata = await generateMetadata({ params: Promise.resolve({ slug }) });
    expect((metadata.title as { absolute: string }).absolute.length).toBeLessThanOrEqual(60);
    expect(metadata.description!.length).toBeLessThanOrEqual(155);
    expect(metadata.description).toContain("catalog voice type");
    expect(metadata.description).not.toMatch(/pending/i);
    expect(metadata.alternates?.canonical).toBe(`${SITE_URL}/singers/${slug}`);
    const html = renderToStaticMarkup(await SingerPage({ params: Promise.resolve({ slug }) }));
    expect(html).toMatch(new RegExp(`<a[^>]+href="/range\\?compare=${slug}#start"[^>]*>Compare my range · free test →</a>`));
    expect(html).toContain("Catalog label");
    expect(html).not.toContain("Can You Sing It?");
    expect(html).not.toContain("Full voice to");
  });

  it("cites Jeff Buckley's official FAQ without using it as proof of the catalog endpoints", async () => {
    const page = await SingerPage({ params: Promise.resolve({ slug: "jeff-buckley" }) });
    const html = renderToStaticMarkup(page);

    expect(html).toContain('href="https://jeffbuckley.com/faq-2/"');
    expect(html).toContain("it does not verify this catalog&#x27;s exact E2–D6 endpoints.");
  });

  it("does not infer full-voice coverage from Billie's missing register marker", async () => {
    const page = await SingerPage({ params: Promise.resolve({ slug: "billie-eilish" }) });
    const html = renderToStaticMarkup(page);

    expect(html).toContain("The catalog has not verified recordings or scores for both endpoints.");
    expect(html).not.toContain("worked largely in full voice");
  });
});
