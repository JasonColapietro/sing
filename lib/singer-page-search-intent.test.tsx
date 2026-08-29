import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
import SingerPage, {
  generateMetadata,
} from "@/app/singers/[slug]/page";
import { SINGERS, rangeLabel, spanOctaves } from "@/lib/singers";
import { midiToLabel } from "@/lib/audio/notes";
import { SITE_URL } from "@/lib/site";

const ARTIST_INTENT_CASES = [
  {
    slug: "olivia-rodrigo",
    name: "Olivia Rodrigo",
    opening: "Olivia Rodrigo's voice type is disputed in the reviewed sources; this review does not establish a definitive classical classification. The displayed range of B2 to A#5 is a reported reference span, not an independently verified physiological limit.",
    title: "Olivia Rodrigo Voice Type: Classifications Vary | Reported Vocal Range B2–A#5",
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
    title: "Arijit Singh Vocal Range: Reported C3–C5 | Voice Type: Described as Rich Baritone",
    heading: "Arijit Singh Vocal Range and Voice Type",
  },
] as const;

const REVIEWED_TITLE_CORRECTIONS: Readonly<Record<string, { title: string; opening: string }>> =
  Object.fromEntries(
    ARTIST_INTENT_CASES.map(({ slug, title, opening }) => [slug, { title, opening }]),
  );

const VOICE_TYPE_QUERY_SLUGS: ReadonlySet<string> = new Set([
  "olivia-rodrigo",
  "reba-mcentire",
  "alex-warren",
  "sam-smith",
]);
const SINGER_RENDER_BATCHES = Array.from(
  { length: Math.ceil(SINGERS.length / 64) },
  (_, index) => [SINGERS.slice(index * 64, (index + 1) * 64)] as const,
);

describe("every singer page answers its vocal range and voice type intent", () => {
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

  it("covers every singer with an absolute answer title, description, and Open Graph URL", async () => {
    for (const singer of SINGERS) {
      const semis = singer.highMidi - singer.lowMidi;
      const metadata = await generateMetadata({
        params: Promise.resolve({ slug: singer.slug }),
      });
      const defaultTitle = VOICE_TYPE_QUERY_SLUGS.has(singer.slug)
        ? `${singer.name} Voice Type: ${singer.voiceType} | Vocal Range ${rangeLabel(singer)}`
        : `${singer.name} Vocal Range: ${rangeLabel(singer)} | Voice Type: ${singer.voiceType}`;
      const defaultOpening = VOICE_TYPE_QUERY_SLUGS.has(singer.slug)
        ? `${singer.name} is commonly classified as a ${singer.voiceType.toLowerCase()}. The cited vocal range is ${midiToLabel(singer.lowMidi)} to ${midiToLabel(singer.highMidi)} (${spanOctaves(semis)} octaves).`
        : `${singer.name}'s cited vocal range is ${midiToLabel(singer.lowMidi)} to ${midiToLabel(singer.highMidi)} (${spanOctaves(semis)} octaves). ${singer.name} is commonly classified as a ${singer.voiceType.toLowerCase()}.`;
      const correction = REVIEWED_TITLE_CORRECTIONS[singer.slug];
      const title = correction?.title ?? defaultTitle;
      const opening = correction?.opening ?? defaultOpening;

      expect(metadata.title).toEqual({ absolute: title });
      expect(metadata.description).toBe(
        correction ? opening : `${opening} See the notes and compare your range free.`,
      );
      expect(metadata.openGraph?.title).toBe(title);
      expect(metadata.openGraph?.description).toBe(metadata.description);
      expect(metadata.openGraph?.url).toBe(
        `${SITE_URL}/singers/${singer.slug}`,
      );
    }
  });

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
          : `${singer.name} Vocal Range and Voice Type`;
        const defaultOpening = VOICE_TYPE_QUERY_SLUGS.has(singer.slug)
          ? `${singer.name} is commonly classified as a ${singer.voiceType.toLowerCase()}. The cited vocal range is ${midiToLabel(singer.lowMidi)} to ${midiToLabel(singer.highMidi)} (${spanOctaves(semis)} octaves).`
          : `${singer.name}'s cited vocal range is ${midiToLabel(singer.lowMidi)} to ${midiToLabel(singer.highMidi)} (${spanOctaves(semis)} octaves). ${singer.name} is commonly classified as a ${singer.voiceType.toLowerCase()}.`;
        const opening = REVIEWED_TITLE_CORRECTIONS[singer.slug]?.opening ?? defaultOpening;

        expect(html).toContain(
          `<h1 class="text-4xl sm:text-5xl">${heading}</h1>`,
        );
        expect(html).toContain(opening);
      }
    },
  );
});
