/**
 * Popular-song catalog guards.
 *
 * The catalog is hand-authored facts, so the failure modes are data typos
 * (an impossible range, a dead artist slug) and crawl-path regressions (a
 * page that falls out of the sitemap or loses its server-rendered links).
 * Same posture as the singer library's guards: assert on rendered HTML and
 * on generated metadata, not on intentions.
 */
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import sitemap from "@/app/sitemap";
import CanYouSingHub from "@/app/can-you-sing/page";
import {
  generateMetadata as songMetadata,
  default as CanYouSingSongPage,
} from "@/app/can-you-sing/[slug]/page";
import SingerPage from "@/app/singers/[slug]/page";
import {
  POP_SONGS,
  noteMidi,
  popDifficulty,
  popFit,
  popNoteLabel,
  popRangeLabel,
} from "@/lib/pop-songs";
import { SINGERS } from "@/lib/singers-data";
import { SITE_URL } from "@/lib/site";

describe("catalog data sanity", () => {
  it("covers the current Search Console song-range gaps with published-key evidence", () => {
    expect(POP_SONGS).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          slug: "drop-dead",
          title: "drop dead",
          artist: "Olivia Rodrigo",
          key: "Ab major",
          lowMidi: noteMidi("Ab3"),
          highMidi: noteMidi("F5"),
          sourceUrl: "https://www.musicnotes.com/sheetmusic/olivia-rodrigo/drop-dead/MN0309204",
        }),
        expect.objectContaining({
          slug: "unchained-melody",
          title: "Unchained Melody",
          artist: "The Righteous Brothers",
          key: "Bb major",
          // Musicnotes writes the male lead in treble clef, an octave above
          // the sounding C3–A4.
          lowMidi: noteMidi("C3"),
          highMidi: noteMidi("A4"),
          sourceUrl: "https://www.musicnotes.com/sheetmusic/the-righteous-brothers/unchained-melody/MN0133818",
        }),
      ]),
    );
  });

  it("has unique slugs", () => {
    const slugs = POP_SONGS.map((s) => s.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("keeps every range inside human territory with low below high", () => {
    for (const s of POP_SONGS) {
      expect(s.lowMidi, s.slug).toBeGreaterThanOrEqual(28); // E1
      expect(s.highMidi, s.slug).toBeLessThanOrEqual(96); // C7
      expect(s.lowMidi, s.slug).toBeLessThan(s.highMidi);
    }
  });

  it("resolves every credited artist slug in the singer library", () => {
    const known = new Set(SINGERS.map((s) => s.slug));
    for (const s of POP_SONGS) {
      expect(s.artistSlugs.length, s.slug).toBeGreaterThan(0);
      for (const a of s.artistSlugs) expect(known.has(a), `${s.slug} → ${a}`).toBe(true);
    }
  });

  it("carries a source note and an editorial blurb on every song", () => {
    for (const s of POP_SONGS) {
      expect(s.sourceNote.length, s.slug).toBeGreaterThan(0);
      expect(s.blurb.length, s.slug).toBeGreaterThan(40);
    }
  });

  it("stores the sounding range its own source note cites", () => {
    // "written E4–A5, sounding E3–A4": the page states the sounding pair.
    const note = "([A-G][#b]?\\d)";
    const sounding = new RegExp(`sounding ${note}–${note}`);
    for (const s of POP_SONGS) {
      const m = sounding.exec(s.sourceNote);
      if (!m) continue;
      expect([s.lowMidi, s.highMidi], s.slug).toEqual([noteMidi(m[1]), noteMidi(m[2])]);
    }
  });

  it("never states a semitone count in a blurb that disagrees with the span", () => {
    const units = ["one", "two", "three", "four", "five", "six", "seven", "eight", "nine"];
    const words: Record<string, number> = {
      ten: 10, eleven: 11, twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15,
      sixteen: 16, seventeen: 17, eighteen: 18, nineteen: 19, twenty: 20, thirty: 30,
    };
    units.forEach((u, i) => {
      words[u] = i + 1;
      words[`twenty-${u}`] = 21 + i;
    });
    // Longest first, so "twenty-one" is read before "twenty".
    const alternatives = Object.keys(words).sort((a, b) => b.length - a.length);
    const count = new RegExp(`\\b(\\d+|${alternatives.join("|")})[- ]semitones?\\b`, "gi");
    let checked = 0;
    for (const s of POP_SONGS) {
      for (const m of s.blurb.matchAll(count)) {
        const said = m[1].toLowerCase();
        const n = /^\d+$/.test(said) ? Number(said) : words[said];
        expect(n, `${s.slug}: "${m[0]}"`).toBe(s.highMidi - s.lowMidi);
        checked++;
      }
    }
    // Espresso and Stick Season state their spans in words.
    expect(checked).toBeGreaterThanOrEqual(2);
  });
});

describe("note spelling", () => {
  it("spells flat-key songs with flats, as their source notes do", () => {
    const label = (slug: string) => popRangeLabel(POP_SONGS.find((s) => s.slug === slug)!);
    expect(label("drop-dead")).toBe("Ab3–F5");
    expect(label("someone-you-loved")).toBe("Eb3–Bb4");
    expect(label("rolling-in-the-deep")).toBe("Bb3–D5");
  });

  it("keeps sharps in sharp and natural keys", () => {
    const label = (slug: string) => popRangeLabel(POP_SONGS.find((s) => s.slug === slug)!);
    expect(label("die-with-a-smile")).toBe("G#3–E5");
    expect(label("good-luck-babe")).toBe("A3–F#5");
    expect(popNoteLabel({ key: "F# minor" }, noteMidi("F#3"))).toBe("F#3");
    // A minor's raised leading tone is a G#, never an Ab.
    expect(popNoteLabel({ key: "A minor" }, noteMidi("G#3"))).toBe("G#3");
  });

  it("treats the flat minor keys as flat keys", () => {
    for (const key of ["D minor", "G minor", "C minor", "F minor", "Bb minor", "Eb minor"]) {
      expect(popNoteLabel({ key }, noteMidi("Eb4")), key).toBe("Eb4");
    }
    for (const key of ["A minor", "E minor", "B minor", "F# minor", "C# minor"]) {
      expect(popNoteLabel({ key }, noteMidi("Eb4")), key).toBe("D#4");
    }
  });
});

describe("note parsing and fit", () => {
  it("parses scientific pitch", () => {
    expect(noteMidi("C4")).toBe(60);
    expect(noteMidi("A4")).toBe(69);
    expect(noteMidi("F#5")).toBe(78);
    expect(noteMidi("Bb2")).toBe(46);
  });

  it("judges fit against a saved range", () => {
    const song = POP_SONGS[0] ?? {
      ...({} as (typeof POP_SONGS)[number]),
      lowMidi: 57,
      highMidi: 76,
    };
    expect(popFit(song, {}).verdict).toBe("unknown");
    expect(
      popFit(song, { lowMidi: song.lowMidi - 2, highMidi: song.highMidi + 2 })
        .verdict,
    ).toBe("fits");
    const high = popFit(song, {
      lowMidi: song.lowMidi - 5,
      highMidi: song.highMidi - 3,
    });
    expect(high.verdict).toBe("high");
    expect(high.offsetSemis).toBe(3);
  });
});

describe("crawl path", () => {
  const urls = new Set(sitemap().map((e) => e.url));

  it("publishes the hub and every song page in the sitemap", () => {
    expect(urls.has(`${SITE_URL}/can-you-sing`)).toBe(true);
    for (const s of POP_SONGS) {
      expect(urls.has(`${SITE_URL}/can-you-sing/${s.slug}`), s.slug).toBe(true);
    }
  });

  it("never marks a catalog page noindex", async () => {
    for (const s of POP_SONGS) {
      const meta = await songMetadata({ params: Promise.resolve({ slug: s.slug }) });
      const robots = meta.robots;
      const noindex =
        robots !== undefined &&
        robots !== null &&
        (typeof robots === "string"
          ? /\bnoindex\b/i.test(robots)
          : robots.index === false);
      expect(noindex, s.slug).toBe(false);
    }
  });

  it("hub server-renders a real anchor to every song page", () => {
    const html = renderToStaticMarkup(CanYouSingHub());
    for (const s of POP_SONGS) {
      expect(html.includes(`href="/can-you-sing/${s.slug}"`), s.slug).toBe(true);
    }
  });

  it("song pages server-render anchors to their singers, and back", async () => {
    for (const s of POP_SONGS.slice(0, 6)) {
      const html = renderToStaticMarkup(
        await CanYouSingSongPage({ params: Promise.resolve({ slug: s.slug }) }),
      );
      for (const a of s.artistSlugs) {
        expect(html.includes(`href="/singers/${a}"`), `${s.slug} → ${a}`).toBe(true);
      }
      const singerHtml = renderToStaticMarkup(
        await SingerPage({ params: Promise.resolve({ slug: s.artistSlugs[0] }) }),
      );
      expect(
        singerHtml.includes(`href="/can-you-sing/${s.slug}"`),
        `${s.artistSlugs[0]} → ${s.slug}`,
      ).toBe(true);
    }
  });

  it.each(["drop-dead", "unchained-melody"])(
    "%s renders its supporting arrangement as a real source link",
    async (slug) => {
      const song = POP_SONGS.find((candidate) => candidate.slug === slug)!;
      const html = renderToStaticMarkup(
        await CanYouSingSongPage({ params: Promise.resolve({ slug }) }),
      );
      expect(html).toContain(`href="${song.sourceUrl}"`);
    },
  );

  it("difficulty stays deterministic over the catalog", () => {
    for (const s of POP_SONGS) {
      expect(["Easy", "Medium", "Hard"]).toContain(popDifficulty(s));
    }
  });

  it("rates a top above F5 as Hard, as the rule's comment says", () => {
    const base = POP_SONGS[0];
    // Narrow span, so altitude alone decides.
    expect(popDifficulty({ ...base, lowMidi: noteMidi("C5"), highMidi: noteMidi("F5") })).toBe("Medium");
    expect(popDifficulty({ ...base, lowMidi: noteMidi("C5"), highMidi: noteMidi("F#5") })).toBe("Hard");
    const babe = POP_SONGS.find((s) => s.slug === "good-luck-babe");
    if (babe) expect(popDifficulty(babe)).toBe("Hard");
  });
});
