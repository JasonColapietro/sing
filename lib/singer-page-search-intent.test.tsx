import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import SingerPage, {
  generateMetadata,
} from "@/app/singers/[slug]/page";
import { SINGERS, describeSpan, rangeLabel, spanOctaves } from "@/lib/singers";
import { midiToLabel } from "@/lib/audio/notes";
import { SITE_URL } from "@/lib/site";

const ARTIST_INTENT_CASES = [
  {
    slug: "olivia-rodrigo",
    name: "Olivia Rodrigo",
    opening: "Olivia Rodrigo is commonly classified as a mezzo-soprano. Its cited vocal range is B2 to A#5",
    title: "Olivia Rodrigo Voice Type: Mezzo-soprano | Vocal Range B2–A#5",
    heading: "Olivia Rodrigo Voice Type and Vocal Range",
  },
  {
    slug: "reba-mcentire",
    name: "Reba McEntire",
    opening: "Reba McEntire is commonly classified as a mezzo-soprano. Its cited vocal range is E3 to F5",
    title: "Reba McEntire Voice Type: Mezzo-soprano | Vocal Range E3–F5",
    heading: "Reba McEntire Voice Type and Vocal Range",
  },
  {
    slug: "alex-warren",
    name: "Alex Warren",
    opening: "Alex Warren is commonly classified as a baritone. Its cited vocal range is A2 to F#4",
    title: "Alex Warren Voice Type: Baritone | Vocal Range A2–F#4",
    heading: "Alex Warren Voice Type and Vocal Range",
  },
  {
    slug: "sam-smith",
    name: "Sam Smith",
    opening: "Sam Smith is commonly classified as a countertenor. Its cited vocal range is G2 to C6",
    title: "Sam Smith Voice Type: Countertenor | Vocal Range G2–C6",
    heading: "Sam Smith Voice Type and Vocal Range",
  },
  {
    slug: "arijit-singh",
    name: "Arijit Singh",
    opening: "Arijit Singh's cited vocal range is C3 to C5 (2.0 octaves). The voice is commonly classified as tenor.",
    title: "Arijit Singh Vocal Range: C3–C5 | Voice Type: Tenor",
    heading: "Arijit Singh Vocal Range and Voice Type",
  },
] as const;

const TARGET_SLUGS: ReadonlySet<string> = new Set(
  ARTIST_INTENT_CASES.map(({ slug }) => slug),
);

describe("singer pages answer the voice-type searches that surface them", () => {
  it.each(ARTIST_INTENT_CASES)(
    "$slug aligns search metadata to observed page-level query intent",
    async ({ slug, opening, title }) => {
      const metadata = await generateMetadata({
        params: Promise.resolve({ slug }),
      });

      expect(metadata.title).toEqual({ absolute: title });
      expect(metadata.description).toMatch(new RegExp(`^${opening.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`));
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

  it("leaves all singers without page-filtered evidence on the established metadata template", async () => {
    for (const singer of SINGERS.filter(({ slug }) => !TARGET_SLUGS.has(slug))) {
      const semis = singer.highMidi - singer.lowMidi;
      const metadata = await generateMetadata({
        params: Promise.resolve({ slug: singer.slug }),
      });

      expect(metadata.title).toBe(
        `${singer.name} Vocal Range & Highest Note: ${rangeLabel(singer)} (${spanOctaves(semis)} Octaves)`,
      );
      expect(metadata.description).toBe(
        `${singer.name}'s vocal range is commonly cited as ${midiToLabel(singer.lowMidi)} to ${midiToLabel(singer.highMidi)} — ${describeSpan(semis)}, a ${singer.voiceType.toLowerCase()}. Highest note ${midiToLabel(singer.highMidi)}, lowest ${midiToLabel(singer.lowMidi)}. Hear it, see it on a keyboard, and test your own range free.`,
      );
      expect(metadata.openGraph).not.toHaveProperty("url");
    }
  });

  it("leaves the established hero intact for singers outside the target set", async () => {
    const singer = SINGERS.find(({ slug }) => slug === "adele");
    expect(singer).toBeDefined();
    const page = await SingerPage({
      params: Promise.resolve({ slug: singer!.slug }),
    });
    const html = renderToStaticMarkup(page);

    expect(html).toContain(`<h1 class="text-4xl sm:text-5xl">${singer!.name}</h1>`);
    expect(html).toContain(
      `${singer!.voiceType} · ${singer!.genres.join(" · ")} · ${singer!.country} · prominent since ${singer!.activeFrom}`,
    );
  });
});
