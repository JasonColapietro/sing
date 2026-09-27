import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
import SingerPage, {
  generateMetadata,
} from "@/app/singers/[slug]/page";
import { SINGERS, rangeLabel, spanOctaves } from "@/lib/singers";
import { midiToLabel } from "@/lib/audio/notes";
import { isSingerReviewed } from "@/lib/singer-evidence";
import { SITE_URL } from "@/lib/site";

const ARTIST_INTENT_CASES = [
  {
    slug: "celine-dion",
    name: "Celine Dion",
    opening: "Our catalog reports Celine Dion at A#2 to C6 (3.2 octaves). Individual endpoint review is pending. Compare your range free.",
    title: "Celine Dion Vocal Range & Voice Type | Compare Yours",
    heading: "Celine Dion Vocal Range: Reported A#2–C6",
  },
  {
    slug: "peter-steele",
    name: "Peter Steele",
    opening: "Our catalog reports Peter Steele at F1 to G5 (4.2 octaves). Individual endpoint review is pending. Compare your range free.",
    title: "Peter Steele Vocal Range & Voice Type | Compare Yours",
    heading: "Peter Steele Vocal Range: Reported F1–G5",
  },
  {
    slug: "michael-jackson",
    name: "Michael Jackson",
    opening: "Our catalog reports Michael Jackson at D#2 to F6 (4.2 octaves). Individual endpoint review is pending. Compare your range free.",
    title: "Michael Jackson Vocal Range & Voice Type | Compare Yours",
    heading: "Michael Jackson Vocal Range: Reported D#2–F6",
  },
  {
    slug: "bruno-mars",
    name: "Bruno Mars",
    opening: "Our catalog reports Bruno Mars at G2 to D6 (3.6 octaves). Individual endpoint review is pending. Compare your range free.",
    title: "Bruno Mars Vocal Range: Reported G2–D6 | Compare Yours",
    heading: "Bruno Mars Vocal Range: Reported G2–D6",
  },
  {
    slug: "taylor-swift",
    name: "Taylor Swift",
    opening: "Our catalog reports Taylor Swift at A2 to A#5 (3.1 octaves). Individual endpoint review is pending. Compare your range free.",
    title: "Taylor Swift Vocal Range: Reported A2–A#5 | Compare Yours",
    heading: "Taylor Swift Vocal Range: Reported A2–A#5",
  },
  {
    slug: "jeff-buckley",
    name: "Jeff Buckley",
    opening: "Our catalog reports Jeff Buckley at E2 to D6 (3.8 octaves). Individual endpoint review is pending. Compare your range free.",
    title: "Jeff Buckley Vocal Range: Reported E2–D6 | Compare Yours",
    heading: "Jeff Buckley Vocal Range: Reported E2–D6",
  },
  {
    slug: "billie-eilish",
    name: "Billie Eilish",
    opening: "Our catalog reports Billie Eilish at A2 to B5 (3.2 octaves). Individual endpoint review is pending. Compare your range free.",
    title: "Billie Eilish Vocal Range: Reported A2–B5 | Compare Yours",
    heading: "Billie Eilish Vocal Range: Reported A2–B5",
  },
  {
    slug: "olivia-rodrigo",
    name: "Olivia Rodrigo",
    opening: "Olivia Rodrigo's voice type is disputed in the reviewed sources; this review does not establish a definitive classical classification. The displayed range of B2 to A#5 is a reported reference span, not an independently verified physiological limit.",
    title: "Olivia Rodrigo Vocal Range & Voice Type | Test Yours",
    heading: "Olivia Rodrigo Voice Type and Vocal Range",
  },
  {
    slug: "reba-mcentire",
    name: "Reba McEntire",
    opening: "Reba McEntire's reviewed sources describe a peak-career span of about three octaves but do not establish a definitive classical voice type. The displayed range of E3 to F5 is a reported reference span, not an independently verified physiological limit.",
    title: "Reba McEntire Voice Type: Classifications Vary | Reported Vocal Range E3–F5",
    heading: "Reba McEntire Voice Type and Vocal Range",
  },
  {
    slug: "alex-warren",
    name: "Alex Warren",
    opening: "Published evidence supports written compasses for specific Alex Warren songs, not a definitive baritone classification or full-career endpoints. The displayed range of A2 to F#4 is a reported reference span, not an independently verified physiological limit.",
    title: "Alex Warren Voice Type: Evidence Does Not Establish a Definitive Type | Reported Vocal Range A2–F#4",
    heading: "Alex Warren Voice Type and Vocal Range",
  },
  {
    slug: "sam-smith",
    name: "Sam Smith",
    opening: "Sam Smith's long-time coach describes baritone-to-tenor territory; the reviewed sources do not establish a definitive countertenor classification. The displayed range of G2 to C6 is a reported reference span, not an independently verified physiological limit.",
    title: "Sam Smith Voice Type: Baritone-to-Tenor Territory | Reported Vocal Range G2–C6",
    heading: "Sam Smith Voice Type and Vocal Range",
  },
  {
    slug: "arijit-singh",
    name: "Arijit Singh",
    opening: "A public artist biography describes Arijit Singh as a rich baritone; the reviewed sources dispute a definitive tenor label. The displayed range of C3 to C5 is a reported reference span, not an independently verified physiological limit.",
    title: "Arijit Singh Vocal Range: Reported C3–C5 — Compare Yours",
    heading: "Arijit Singh Vocal Range: Reported C3–C5",
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
const PRIORITY_PENDING_SLUGS: ReadonlySet<string> = new Set([
  "bruno-mars", "taylor-swift", "jeff-buckley", "billie-eilish",
  "celine-dion", "peter-steele", "michael-jackson",
]);
const COMPARISON_SNIPPETS: Readonly<Record<string, string>> = {
  "celine-dion": "Explore Celine Dion's reported vocal range and catalog voice type. Take the free range test to compare yours. Individual endpoint review is pending.",
  "peter-steele": "Explore Peter Steele's reported vocal range and catalog voice type. Take the free range test to compare yours. Individual endpoint review is pending.",
  "michael-jackson": "Explore Michael Jackson's reported vocal range and catalog voice type. Take the free range test to compare yours. Individual endpoint review is pending.",
};
const OLIVIA_SNIPPET = "Explore Olivia Rodrigo's reported vocal range, disputed voice-type labels, and song-level sources. Take the free range test to compare your notes.";
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
    async ({ slug, opening, title }) => {
      const metadata = await generateMetadata({
        params: Promise.resolve({ slug }),
      });

      expect(metadata.title).toEqual({ absolute: title });
      if (PRIORITY_PENDING_SLUGS.has(slug)) expect(title.length).toBeLessThanOrEqual(60);
      expect(metadata.description).toBe(COMPARISON_SNIPPETS[slug] ?? (slug === "olivia-rodrigo" ? OLIVIA_SNIPPET : opening));
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
      const semis = singer.highMidi - singer.lowMidi;
      const metadata = await generateMetadata({
        params: Promise.resolve({ slug: singer.slug }),
      });
      const answerTitle = `${singer.name} Vocal Range: ${rangeLabel(singer)}`;
      const challengeTitle = `${answerTitle} — Can You Sing It?`;
      const defaultTitle = VOICE_TYPE_QUERY_SLUGS.has(singer.slug)
        ? `${singer.name} Voice Type: ${singer.voiceType} | Vocal Range ${rangeLabel(singer)}`
        : challengeTitle.length <= 60
          ? challengeTitle
          : `${answerTitle} | Test Yours`;
      const defaultOpening = VOICE_TYPE_QUERY_SLUGS.has(singer.slug)
        ? `${singer.name} is commonly classified as a ${singer.voiceType.toLowerCase()}. The cited vocal range is ${midiToLabel(singer.lowMidi)} to ${midiToLabel(singer.highMidi)}.`
        : `${singer.name}'s cited vocal range is ${midiToLabel(singer.lowMidi)} to ${midiToLabel(singer.highMidi)} (${spanOctaves(semis)} octaves).`;
      const defaultDescription = `${defaultOpening} See every note${
        VOICE_TYPE_QUERY_SLUGS.has(singer.slug) ? "" : ", learn the voice type"
      }, and take the free two-minute test to compare yours.`;
      const correction = SPECIAL_TITLE_CASES[singer.slug];
      const title = correction?.title ?? defaultTitle;
      const opening = correction?.opening ?? defaultOpening;

      if (!correction) {
        expect(title.length, `${singer.slug} title length`).toBeLessThanOrEqual(60);
        expect(
          defaultDescription.length,
          `${singer.slug} description length`,
        ).toBeLessThanOrEqual(175);
      }

      expect(metadata.title).toEqual({ absolute: title });
      expect(metadata.description).toBe(
        COMPARISON_SNIPPETS[singer.slug] ?? (singer.slug === "olivia-rodrigo" ? OLIVIA_SNIPPET : correction ? opening : defaultDescription),
      );
      expect(metadata.openGraph?.title).toBe(title);
      expect(metadata.openGraph?.description).toBe(metadata.description);
      expect(metadata.openGraph?.url).toBe(
        `${SITE_URL}/singers/${singer.slug}`,
      );
    }
  });

  it("keeps Olivia's snippet concise and its disputed status explicit", async () => {
    const metadata = await generateMetadata({ params: Promise.resolve({ slug: "olivia-rodrigo" }) });
    expect((metadata.title as { absolute: string }).absolute.length).toBeLessThanOrEqual(60);
    expect(metadata.description!.length).toBeLessThanOrEqual(160);
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
        const semis = singer.highMidi - singer.lowMidi;
        const page = await SingerPage({
          params: Promise.resolve({ slug: singer.slug }),
        });
        const html = renderToStaticMarkup(page).replaceAll("&#x27;", "'");
        const heading = VOICE_TYPE_QUERY_SLUGS.has(singer.slug)
          ? `${singer.name} Voice Type and Vocal Range`
          : PRIORITY_PENDING_SLUGS.has(singer.slug) || isSingerReviewed(singer.slug)
            ? `${singer.name} Vocal Range: Reported ${rangeLabel(singer)}`
            : `${singer.name} Vocal Range: ${rangeLabel(singer)}`;
        const defaultOpening = VOICE_TYPE_QUERY_SLUGS.has(singer.slug)
          ? `${singer.name} is commonly classified as a ${singer.voiceType.toLowerCase()}. The cited vocal range is ${midiToLabel(singer.lowMidi)} to ${midiToLabel(singer.highMidi)}.`
          : `${singer.name}'s cited vocal range is ${midiToLabel(singer.lowMidi)} to ${midiToLabel(singer.highMidi)} (${spanOctaves(semis)} octaves).`;
        const opening = SPECIAL_TITLE_CASES[singer.slug]?.opening ?? defaultOpening;

        expect(html).toContain(
          `<h1 class="text-4xl sm:text-5xl">${heading}</h1>`,
        );
        expect(html).toContain(opening);
        expect(html).toContain(`href="/range?compare=${singer.slug}"`);
        expect(html).toContain(COMPARISON_SNIPPETS[singer.slug] ? "Compare my range — free test" : "Test my range");
      }
    },
    30_000,
  );

  it.each(ARTIST_INTENT_CASES.filter(({ slug }) => PRIORITY_PENDING_SLUGS.has(slug)))(
    "$slug keeps unreviewed endpoints out of individual extrema claims",
    async ({ slug, name }) => {
      const page = await SingerPage({ params: Promise.resolve({ slug }) });
      const html = renderToStaticMarkup(page).replaceAll("&#x27;", "'");

      expect(html).toContain("Individual endpoint review is pending; these are not verified physiological limits.");
      expect(html).toContain(`No reviewed source here establishes the upper endpoint as ${name}’s highest note.`);
      expect(html).toContain(`No reviewed source here establishes the lower endpoint as ${name}’s lowest note.`);
      expect(html).toContain(`What voice type is ${name}?`);
      expect(html).not.toContain("Full voice to");
    },
  );

  it.each(Object.keys(COMPARISON_SNIPPETS))("%s keeps the CTR pilot honest and directly actionable", async (slug) => {
    const metadata = await generateMetadata({ params: Promise.resolve({ slug }) });
    expect((metadata.title as { absolute: string }).absolute.length).toBeLessThanOrEqual(60);
    expect(metadata.description!.length).toBeLessThanOrEqual(160);
    expect(metadata.description).toContain("catalog voice type");
    expect(metadata.description).toContain("Individual endpoint review is pending");
    expect(metadata.alternates?.canonical).toBe(`${SITE_URL}/singers/${slug}`);
    const html = renderToStaticMarkup(await SingerPage({ params: Promise.resolve({ slug }) }));
    expect(html).toMatch(new RegExp(`<a[^>]+href="/range\\?compare=${slug}"[^>]*>Compare my range — free test →</a>`));
    expect(html).toContain("Catalog label");
    expect(html).not.toContain("Can You Sing It?");
    expect(html).not.toContain("Full voice to");
  });

  it("cites Jeff Buckley's official FAQ without using it as proof of the catalog endpoints", async () => {
    const page = await SingerPage({ params: Promise.resolve({ slug: "jeff-buckley" }) });
    const html = renderToStaticMarkup(page);

    expect(html).toContain('href="https://jeffbuckley.com/faq-2/"');
    expect(html).toContain("It does not verify this catalog&#x27;s exact E2 and D6 endpoints.");
  });

  it("does not infer full-voice coverage from Billie's missing register marker", async () => {
    const page = await SingerPage({ params: Promise.resolve({ slug: "billie-eilish" }) });
    const html = renderToStaticMarkup(page);

    expect(html).toContain("The catalog has not verified recordings or scores for both endpoints.");
    expect(html).not.toContain("worked largely in full voice");
  });
});
