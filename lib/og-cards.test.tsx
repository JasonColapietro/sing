import { renderToStaticMarkup } from "react-dom/server";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("next/og", () => ({
  ImageResponse: class {
    constructor(public element: ReactNode) {}
  },
}));

import SingerImage, {
  alt as singerAlt,
  contentType as singerContentType,
  generateImageMetadata as singerImageMetadata,
  size as singerSize,
} from "@/app/singers/[slug]/opengraph-image";
import SongImage, {
  generateImageMetadata as songImageMetadata,
} from "@/app/songs/[slug]/opengraph-image";
import { songBySlug } from "@/components/songs/data";
import {
  singerCardText,
  singerCardVersion,
  songCardText,
  songCardVersion,
} from "@/lib/og-cards";
import { singerBySlug } from "@/lib/singers";

async function drawn(card: Promise<unknown>): Promise<string> {
  const result = (await card) as { element: ReactNode };
  return renderToStaticMarkup(<>{result.element}</>);
}

/**
 * Round 8 corrected Alex Warren's range and three songbook eras, and the new
 * cards shipped at the same URLs as the old ones, because Next's ?hash follows
 * the card's source file and not its data. Share scrapers cache by URL.
 */
describe("per-page share cards are versioned by what they draw", () => {
  it("puts the singer card's version into its URL path", () => {
    const s = singerBySlug("alex-warren")!;
    const [meta, ...rest] = singerImageMetadata({ params: { slug: s.slug } });
    expect(rest).toHaveLength(0);
    expect(meta).toEqual({
      id: singerCardVersion(s),
      alt: singerAlt,
      size: singerSize,
      contentType: singerContentType,
    });
    expect(meta.id).toMatch(/^[0-9a-z]+$/);
  });

  it("answers the build's slug-less question with no cards rather than an item with no id", () => {
    // next build calls generateImageMetadata with the [slug] segment's params
    // from layouts only, and there is none: an item without an id fails the
    // build ("id property is required for every item returned from
    // generateImageMetadata").
    for (const metadata of [singerImageMetadata, songImageMetadata]) {
      expect(metadata({ params: {} })).toEqual([]);
      expect(metadata({})).toEqual([]);
      expect(metadata({ params: { slug: "no-such-page" } })).toEqual([]);
    }
  });

  it("moves the singer card's version when its range or review label moves, and only then", () => {
    const s = singerBySlug("alex-warren")!;
    expect(singerCardVersion({ ...s })).toBe(singerCardVersion(s));
    // The pre-round-8 figures, A2–F#4, must not share the corrected card's URL.
    expect(singerCardVersion({ ...s, lowMidi: 45, highMidi: 66 })).not.toBe(singerCardVersion(s));
    expect(singerCardVersion({ ...s, highMidi: s.highMidi + 1 })).not.toBe(singerCardVersion(s));
    expect(singerCardVersion({ ...s, slug: "adele" })).not.toBe(singerCardVersion(s));
  });

  it("draws exactly the singer text its version is built from", async () => {
    const s = singerBySlug("alex-warren")!;
    const html = await drawn(SingerImage({ params: Promise.resolve({ slug: s.slug }) }));
    const text = singerCardText(s);
    expect(text.notes).toBe("G2 — A4");
    for (const line of [text.name, text.notes, text.span, text.status]) {
      expect(html).toContain(line);
    }
  });

  it("puts the song card's version into its URL path", () => {
    const song = songBySlug("scarborough-fair")!;
    const [meta, ...rest] = songImageMetadata({ params: { slug: song.slug } });
    expect(rest).toHaveLength(0);
    expect(meta.id).toBe(songCardVersion(song));
    expect(meta.id).toMatch(/^[0-9a-z]+$/);
  });

  it("moves the song card's version when its facts or melody move", () => {
    const song = songBySlug("scarborough-fair")!;
    expect(songCardVersion({ ...song })).toBe(songCardVersion(song));
    // Round 8 changed this card's era from "1600s".
    expect(songCardVersion({ ...song, era: "1600s" })).not.toBe(songCardVersion(song));
    const notes = song.notes.map((n, i) => (i === 0 ? { ...n, midi: n.midi + 1 } : n));
    expect(songCardVersion({ ...song, notes })).not.toBe(songCardVersion(song));
  });

  it("draws exactly the song text its version is built from", async () => {
    const song = songBySlug("scarborough-fair")!;
    const html = await drawn(SongImage({ params: Promise.resolve({ slug: song.slug }) }));
    const text = songCardText(song);
    expect(text.facts).toContain(song.era);
    for (const line of [text.kicker, text.title, text.facts, text.notes, text.footer]) {
      expect(html).toContain(line);
    }
  });
});
