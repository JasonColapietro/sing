/**
 * Binds `lib/singer-hub-copy.ts` to the genre and voice-type hubs.
 *
 * The 2026-10-03 sweep found 36 hub pairs that a search engine could not tell
 * apart, because every hub was one template with a word swapped. These checks
 * run on the rendered HTML and the real metadata, so a hub that loses its own
 * intro, or two hubs that drift back to the same title or description, fail
 * here rather than in the next sweep.
 */
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import GenrePage, { generateMetadata as genreMetadata } from "@/app/singers/genre/[genre]/page";
import VoiceTypePage, {
  generateMetadata as voiceMetadata,
} from "@/app/singers/voice-type/[type]/page";
import { GENRE_HUB_COPY, VOICE_TYPE_HUB_COPY, type HubCopy } from "@/lib/singer-hub-copy";
import { HUB_GENRES, VOICE_KINDS, genreSlug, voiceTypeSlug } from "@/lib/singers";

const GENRE_SLUGS = HUB_GENRES.map(genreSlug);
const VOICE_SLUGS = VOICE_KINDS.map(voiceTypeSlug);

/** The sweep's worst pairs, kept as named regressions on top of the all-pairs check. */
const SWEEP_PAIRS: Array<[string, string]> = [
  ["/singers/genre/j-pop", "/singers/genre/k-pop"],
  ["/singers/genre/k-pop", "/singers/genre/pop"],
  ["/singers/genre/j-pop", "/singers/genre/pop"],
  ["/singers/genre/hard-rock", "/singers/genre/rock"],
  ["/singers/genre/randb", "/singers/genre/soul"],
  ["/singers/genre/pop", "/singers/genre/synth-pop"],
  ["/singers/voice-type/bass", "/singers/voice-type/bass-baritone"],
  ["/singers/voice-type/baritone", "/singers/voice-type/bass-baritone"],
  ["/singers/voice-type/mezzo-soprano", "/singers/voice-type/soprano"],
];

function text(html: string): string {
  return html
    .replace(/<(?:script|style)\b[\s\S]*?<\/(?:script|style)>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&#x27;|&apos;|&rsquo;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ");
}

/** Hub titles are `{ absolute }` objects so they own the full 60 characters. */
function metaTitle(title: unknown): string {
  return title && typeof title === "object" && "absolute" in title
    ? String((title as { absolute: unknown }).absolute)
    : String(title);
}

async function hubs() {
  const out = new Map<string, { title: string; description: string; html: string }>();
  for (const genre of GENRE_SLUGS) {
    const meta = await genreMetadata({ params: Promise.resolve({ genre }) });
    out.set(`/singers/genre/${genre}`, {
      title: metaTitle(meta.title),
      description: String(meta.description),
      html: renderToStaticMarkup(await GenrePage({ params: Promise.resolve({ genre }) })),
    });
  }
  for (const type of VOICE_SLUGS) {
    const meta = await voiceMetadata({ params: Promise.resolve({ type }) });
    out.set(`/singers/voice-type/${type}`, {
      title: metaTitle(meta.title),
      description: String(meta.description),
      html: renderToStaticMarkup(await VoiceTypePage({ params: Promise.resolve({ type }) })),
    });
  }
  return out;
}

const ALL_COPY: Array<[string, HubCopy]> = [
  ...Object.entries(GENRE_HUB_COPY),
  ...Object.entries(VOICE_TYPE_HUB_COPY).map(([v, c]) => [voiceTypeSlug(v as never), c] as [string, HubCopy]),
];

describe("hub copy coverage", () => {
  it("has an entry for every generated hub and none for a hub that does not exist", () => {
    expect(Object.keys(GENRE_HUB_COPY).sort()).toEqual([...GENRE_SLUGS].sort());
    expect(Object.keys(VOICE_TYPE_HUB_COPY).sort()).toEqual([...VOICE_KINDS].sort());
  });

  it("points every contrast at a real sibling hub of the same kind", () => {
    for (const [slug, copy] of Object.entries(GENRE_HUB_COPY)) {
      expect(GENRE_SLUGS, slug).toContain(copy.neighbour);
      expect(copy.neighbour, slug).not.toBe(slug);
      expect(copy.contrast, slug).toContain("{link}");
    }
    for (const [voice, copy] of Object.entries(VOICE_TYPE_HUB_COPY)) {
      expect(VOICE_SLUGS, voice).toContain(copy.neighbour);
      expect(copy.neighbour, voice).not.toBe(voiceTypeSlug(voice as never));
      expect(copy.contrast, voice).toContain("{link}");
    }
  });

  it("gives no two hubs the same intro, contrast, title tag or summary", () => {
    for (const field of ["intro", "contrast", "titleTag", "summary"] as const) {
      const seen = new Map<string, string>();
      for (const [slug, copy] of ALL_COPY) {
        const value = copy[field].toLowerCase();
        expect(seen.get(value), `${slug} repeats ${field} of ${seen.get(value)}`).toBeUndefined();
        seen.set(value, slug);
      }
    }
  });

  it("keeps an intro plus contrast to two to four sentences, with no em dashes", () => {
    for (const [slug, copy] of ALL_COPY) {
      const sentences = `${copy.intro} ${copy.contrast}`.split(/(?<=[.!?])\s+(?=[A-Z{])/);
      expect(sentences.length, slug).toBeGreaterThanOrEqual(2);
      expect(sentences.length, slug).toBeLessThanOrEqual(4);
      for (const value of Object.values(copy)) expect(value, slug).not.toContain("—");
    }
  });
});

describe("rendered hubs", () => {
  it(
    "print their own intro and link the neighbour, with distinct titles and descriptions",
    async () => {
      const pages = await hubs();

      for (const [slug, copy] of Object.entries(GENRE_HUB_COPY)) {
        const page = pages.get(`/singers/genre/${slug}`)!;
        expect(text(page.html), slug).toContain(copy.intro);
        expect(page.html, slug).toContain(`href="/singers/genre/${copy.neighbour}"`);
        expect(page.title, slug).toContain(copy.titleTag);
        expect(page.description, slug).toContain(copy.summary);
      }
      for (const [voice, copy] of Object.entries(VOICE_TYPE_HUB_COPY)) {
        const page = pages.get(`/singers/voice-type/${voiceTypeSlug(voice as never)}`)!;
        // Tokens are filled from REFERENCE_BANDS, so compare the fixed prefix.
        expect(text(page.html), voice).toContain(copy.intro.split("{")[0].trim());
        expect(text(page.html), voice).not.toMatch(/\{(low|high|pLow|pHigh|link)\}/);
        expect(page.html, voice).toContain(`href="/singers/voice-type/${copy.neighbour}"`);
        expect(page.title, voice).toContain(copy.titleTag);
        expect(page.description, voice).toContain(copy.summary);
      }

      const titles = new Map<string, string>();
      const descriptions = new Map<string, string>();
      for (const [href, page] of pages) {
        expect(titles.get(page.title), `${href} shares a title`).toBeUndefined();
        expect(descriptions.get(page.description), `${href} shares a description`).toBeUndefined();
        titles.set(page.title, href);
        descriptions.set(page.description, href);
      }

      for (const [a, b] of SWEEP_PAIRS) {
        expect(pages.get(a)!.title, `${a} vs ${b}`).not.toBe(pages.get(b)!.title);
        expect(pages.get(a)!.description, `${a} vs ${b}`).not.toBe(pages.get(b)!.description);
      }
    },
    60_000,
  );
});
