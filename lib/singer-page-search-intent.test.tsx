import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
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
    opening: "Olivia Rodrigo is commonly classified as a mezzo-soprano. The cited vocal range is B2 to A#5",
    title: "Olivia Rodrigo Voice Type: Mezzo-soprano | Vocal Range B2–A#5",
    heading: "Olivia Rodrigo Voice Type and Vocal Range",
  },
  {
    slug: "reba-mcentire",
    name: "Reba McEntire",
    opening: "Reba McEntire is commonly classified as a mezzo-soprano. The cited vocal range is E3 to F5",
    title: "Reba McEntire Voice Type: Mezzo-soprano | Vocal Range E3–F5",
    heading: "Reba McEntire Voice Type and Vocal Range",
  },
  {
    slug: "alex-warren",
    name: "Alex Warren",
    opening: "Alex Warren is commonly classified as a baritone. The cited vocal range is A2 to F#4",
    title: "Alex Warren Voice Type: Baritone | Vocal Range A2–F#4",
    heading: "Alex Warren Voice Type and Vocal Range",
  },
  {
    slug: "sam-smith",
    name: "Sam Smith",
    opening: "Sam Smith is commonly classified as a countertenor. The cited vocal range is G2 to C6",
    title: "Sam Smith Voice Type: Countertenor | Vocal Range G2–C6",
    heading: "Sam Smith Voice Type and Vocal Range",
  },
  {
    slug: "arijit-singh",
    name: "Arijit Singh",
    opening: "Arijit Singh's cited vocal range is C3 to C5 (2.0 octaves). Arijit Singh is commonly classified as a tenor.",
    title: "Arijit Singh Vocal Range: C3–C5 | Voice Type: Tenor",
    heading: "Arijit Singh Vocal Range and Voice Type",
  },
] as const;

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
      const title = VOICE_TYPE_QUERY_SLUGS.has(singer.slug)
        ? `${singer.name} Voice Type: ${singer.voiceType} | Vocal Range ${rangeLabel(singer)}`
        : `${singer.name} Vocal Range: ${rangeLabel(singer)} | Voice Type: ${singer.voiceType}`;
      const opening = VOICE_TYPE_QUERY_SLUGS.has(singer.slug)
        ? `${singer.name} is commonly classified as a ${singer.voiceType.toLowerCase()}. The cited vocal range is ${midiToLabel(singer.lowMidi)} to ${midiToLabel(singer.highMidi)} (${spanOctaves(semis)} octaves).`
        : `${singer.name}'s cited vocal range is ${midiToLabel(singer.lowMidi)} to ${midiToLabel(singer.highMidi)} (${spanOctaves(semis)} octaves). ${singer.name} is commonly classified as a ${singer.voiceType.toLowerCase()}.`;

      expect(metadata.title).toEqual({ absolute: title });
      expect(metadata.description).toBe(
        `${opening} See the notes and compare your range free.`,
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
        const opening = VOICE_TYPE_QUERY_SLUGS.has(singer.slug)
          ? `${singer.name} is commonly classified as a ${singer.voiceType.toLowerCase()}. The cited vocal range is ${midiToLabel(singer.lowMidi)} to ${midiToLabel(singer.highMidi)} (${spanOctaves(semis)} octaves).`
          : `${singer.name}'s cited vocal range is ${midiToLabel(singer.lowMidi)} to ${midiToLabel(singer.highMidi)} (${spanOctaves(semis)} octaves). ${singer.name} is commonly classified as a ${singer.voiceType.toLowerCase()}.`;

        expect(html).toContain(
          `<h1 class="text-4xl sm:text-5xl">${heading}</h1>`,
        );
        expect(html).toContain(opening);
      }
    },
  );
});
