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
import GenreImage, {
  alt as genreAlt,
  generateImageMetadata as genreImageMetadata,
} from "@/app/singers/genre/[genre]/opengraph-image";
import VoiceTypeImage, {
  generateImageMetadata as voiceTypeImageMetadata,
} from "@/app/singers/voice-type/[type]/opengraph-image";
import RecordsImage, {
  generateImageMetadata as recordsImageMetadata,
} from "@/app/singers/records/opengraph-image";
import { generateImageMetadata as singersIndexImageMetadata } from "@/app/singers/opengraph-image";
import { songBySlug } from "@/components/songs/data";
import { HUB_OG_CARD_REVISION } from "@/components/singers/og-card";
import {
  genreCardProps,
  hubCardVersion,
  recordsCardProps,
  singerCardText,
  singerCardVersion,
  songCardText,
  songCardVersion,
  voiceTypeCardProps,
} from "@/lib/og-cards";
import { midiToLabel } from "@/lib/audio/notes";
import {
  SINGERS,
  recordHolders,
  singerBySlug,
  singersByVoiceType,
} from "@/lib/singers";

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

  it("names the part of the song a phrase card's range belongs to", () => {
    // Round 1 labelled a phrase page's range as the phrase's in its title,
    // heading and JSON-LD; the card still drew "E4 — G4 … 3 semitones" for
    // Silent Night as if that were the song's.
    expect(songCardText(songBySlug("silent-night")!).footer).toMatch(/^opening phrase · /);
    expect(songCardText(songBySlug("home-on-the-range")!).footer).toMatch(/^chorus hook · /);
    // The arrangements' titles already say "(Opening Lines…)".
    const full = songBySlug("amazing-grace-full")!;
    expect(full.form).toBe("full");
    expect(songCardText(full).footer).toMatch(/^\d+ semitones · /);
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

/**
 * The hub cards had the same problem: round 3 took Vitas off the Opera card's
 * top row and round 5 refitted the Singer-Songwriter title, and both new
 * pictures shipped at the URL they had had since September.
 */
describe("hub share cards are versioned by what they draw", () => {
  it("puts the genre and voice-type card's version into its URL path", () => {
    const [genre, ...moreGenre] = genreImageMetadata({ params: { genre: "opera" } });
    expect(moreGenre).toHaveLength(0);
    expect(genre).toMatchObject({ id: hubCardVersion(genreCardProps("Opera")!), alt: genreAlt });
    expect(genre.id).toMatch(/^[0-9a-z]+$/);

    const [voice, ...moreVoice] = voiceTypeImageMetadata({ params: { type: "tenor" } });
    expect(moreVoice).toHaveLength(0);
    expect(voice.id).toBe(hubCardVersion(voiceTypeCardProps("Tenor")!));
  });

  it("answers the build's param-less question, and an unknown hub, with no cards", () => {
    expect(genreImageMetadata({ params: {} })).toEqual([]);
    expect(genreImageMetadata({})).toEqual([]);
    expect(genreImageMetadata({ params: { genre: "no-such-genre" } })).toEqual([]);
    expect(voiceTypeImageMetadata({ params: {} })).toEqual([]);
    expect(voiceTypeImageMetadata({ params: { type: "no-such-type" } })).toEqual([]);
  });

  it("gives the static records and index cards one versioned URL each", () => {
    const [records, ...moreRecords] = recordsImageMetadata();
    expect(moreRecords).toHaveLength(0);
    expect(records.id).toBe(hubCardVersion(recordsCardProps()));
    const [index, ...moreIndex] = singersIndexImageMetadata();
    expect(moreIndex).toHaveLength(0);
    expect(index.id).toMatch(/^[0-9a-z]+$/);
  });

  it("moves a hub card's version when a row's range or the card's layout revision moves", () => {
    const card = genreCardProps("Opera")!;
    expect(hubCardVersion({ ...card })).toBe(hubCardVersion(card));
    const rows = card.rows.map((r, i) => (i === 0 ? { ...r, highMidi: r.highMidi + 1 } : r));
    expect(hubCardVersion({ ...card, rows })).not.toBe(hubCardVersion(card));
    expect(hubCardVersion(card, `${HUB_OG_CARD_REVISION}-next`)).not.toBe(hubCardVersion(card));
    expect(hubCardVersion({ ...card, caption: "Range covered C2–C6" })).not.toBe(hubCardVersion(card));
  });

  it("states each group's true span, never the rounded chart axis", async () => {
    // The axis is rounded out to octave Cs, so the old footer printed "C0 — C6"
    // for bass-baritones, whose cited ranges run B0 to A#5.
    const bassBaritones = singersByVoiceType("Bass-baritone");
    const low = Math.min(...bassBaritones.map((s) => s.lowMidi));
    const high = Math.max(...bassBaritones.map((s) => s.highMidi));
    const card = voiceTypeCardProps("Bass-baritone")!;
    expect(card.caption).toBe(`Range covered ${midiToLabel(low)}–${midiToLabel(high)}`);
    const html = await drawn(
      VoiceTypeImage({ params: Promise.resolve({ type: "bass-baritone" }) }) as Promise<unknown>,
    );
    expect(html).toContain(card.caption);
    expect(html).not.toContain(`${midiToLabel(card.axisLow)} — ${midiToLabel(card.axisHigh)}`);

    const grunge = await drawn(
      GenreImage({ params: Promise.resolve({ genre: "grunge" }) }) as Promise<unknown>,
    );
    expect(grunge).toContain(genreCardProps("Grunge")!.caption);

    const holders = recordHolders(SINGERS);
    const records = recordsCardProps();
    expect(records.caption).toBe(
      `Catalog extremes ${midiToLabel(holders.lowest[0].lowMidi)}–${midiToLabel(holders.highest[0].highMidi)}`,
    );
    expect(await drawn(Promise.resolve(RecordsImage()))).toContain(records.caption);
  });
});
