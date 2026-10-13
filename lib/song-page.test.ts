/**
 * Song page claims, per form.
 *
 * Most entries transcribe a song's opening phrase, and the two longer
 * arrangements (`arrangementOf`) sing selected lines. Neither is the song's
 * lyrics or its key, so no title, heading, snippet or structured data on
 * those pages may sell them as such.
 */
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import SongPage, { generateMetadata } from "@/app/songs/[slug]/page";
import { ALL_SONGS, SONGS, songBySlug } from "@/components/songs/data";
import {
  computeDifficulty,
  DIFFICULTY_EASY_MAX,
  DIFFICULTY_MEDIUM_MAX,
  songNoteRange,
} from "@/components/songs/lib";
import { relatedSongs, songLyricText } from "@/components/songs/song-page";

const arrangements = ALL_SONGS.filter((s) => s.arrangementOf);

async function render(slug: string): Promise<string> {
  return renderToStaticMarkup(await SongPage({ params: Promise.resolve({ slug }) }));
}

function jsonLd(html: string): { "@graph": Record<string, unknown>[] } {
  const m = /<script type="application\/ld\+json">([\s\S]*?)<\/script>/.exec(html);
  if (!m) throw new Error("no JSON-LD");
  return JSON.parse(m[1]);
}

describe("longer arrangements are partial transcriptions", () => {
  it("exist, so the checks below run", () => {
    expect(arrangements.length).toBeGreaterThan(0);
  });

  it.each(arrangements.map((s) => s.slug))("%s: no lyrics or vocal-range claim", async (slug) => {
    const meta = await generateMetadata({ params: Promise.resolve({ slug }) });
    const title = (meta.title as { absolute: string }).absolute;
    expect(title.startsWith("Sing ")).toBe(true);
    expect(title.length).toBeLessThanOrEqual(60);
    expect(title).not.toMatch(/lyrics|vocal range/i);
    expect(String(meta.description)).not.toMatch(/lyrics|vocal range/i);
    expect(String(meta.description).length).toBeLessThanOrEqual(155);

    const html = await render(slug);
    const h1 = /<h1\b[^>]*>([\s\S]*?)<\/h1>/.exec(html)![1];
    expect(h1).toContain("the lines, their key and note range");
    expect(h1).not.toMatch(/lyrics|vocal range/i);

    const composition = jsonLd(html)["@graph"].find((n) => n["@type"] === "MusicComposition")!;
    expect(composition).not.toHaveProperty("lyrics");
    expect(composition).not.toHaveProperty("musicalKey");
    const names = (composition.additionalProperty as { name: string }[]).map((p) => p.name);
    expect(names).toContain("Transcription tonic");
    expect(names).toContain("Lowest note (these lines)");
    expect(names).toContain("Highest note (these lines)");
    expect(names.join(" ")).not.toContain("opening phrase");
  });
});

describe("the tag sentence", () => {
  it("names a tag that describes what the melody asks of a voice, never a genre word", async () => {
    // "christmas" leads Silent Night's tags; its demand tag is "narrow range".
    const html = await render("silent-night");
    expect(html).not.toContain("&ldquo;christmas&rdquo;");
    expect(html).not.toContain("“christmas”");
    expect(html).toMatch(/[“"]narrow range[”"]\s*is what it asks of a voice/);
  });

  it("never names a meter or a scale as what a melody asks of a voice", async () => {
    // Down in the Valley leads with "waltz"; its demand tag is "long tones".
    const valley = await render("down-in-the-valley");
    expect(valley).toMatch(/[“"]long tones[”"]\s*is what it asks of a voice/);
    expect(valley).not.toMatch(/[“"]waltz[”"]\s*is what it asks/);
    // Scarborough Fair's only non-genre tags are "modal" and "dorian", and its
    // transcribed phrase does not even reach the Dorian sixth.
    const scarborough = await render("scarborough-fair");
    expect(scarborough).not.toContain("is what it asks of a voice");
    expect(scarborough).not.toContain("what it drills");
  });

  it("is left out when no tag names a vocal demand", async () => {
    const plain = ALL_SONGS.find((s) =>
      s.tags.every((t) => !["stepwise", "narrow range", "wide range", "leap", "octave leap", "long tones", "legato", "repeated note", "dotted rhythm"].includes(t)),
    );
    expect(plain).toBeDefined();
    const html = await render(plain!.slug);
    expect(html).not.toContain("is what it asks of a voice");
    expect(html).toContain("Genre, era and tags");
  });
});

describe("what a tag claims about the melody", () => {
  /**
   * The page counts "leaps of a major third or more" beside the demand tag.
   * A "stepwise" tag on a melody that leaps (Frère Jacques' falling thirds,
   * London Bridge's falling fourth) contradicted its own count.
   */
  it("never tags a melody stepwise when it moves a major third or more between notes", () => {
    const stepwise = ALL_SONGS.filter((s) => s.tags.includes("stepwise"));
    expect(stepwise.length).toBeGreaterThan(0);
    for (const song of stepwise) {
      for (let i = 1; i < song.notes.length; i++) {
        const jump = Math.abs(song.notes[i].midi - song.notes[i - 1].midi);
        expect(jump, `${song.slug}, note ${i}`).toBeLessThan(4);
      }
    }
  });

  it("dates the melody the page transcribes, not older words or an older relative", () => {
    // The page says genre and era "say where the melody comes from".
    // London Bridge's modern tune was first printed in 1879; Down in the
    // Valley has no source before the 1920s; Scarborough Fair's tune was
    // collected in 1947.
    expect(songBySlug("london-bridge-is-falling-down")!.era).toBe("1800s");
    expect(songBySlug("down-in-the-valley")!.era).toBe("Traditional");
    expect(songBySlug("scarborough-fair")!.era).toBe("Traditional");
  });

  it("does not date Scarborough Fair's own text to the 17th century", () => {
    // Its verses and refrain are known from 19th-century versions; only the
    // Scottish ballad it descends from, The Elfin Knight, reaches the 1600s.
    // The origin line prints in the page subtitle and its JSON-LD description.
    const song = songBySlug("scarborough-fair")!;
    expect(song.origin).toContain("descended from the 17th-century Scottish ballad");
    expect(song.origin).toContain("this tune collected in 1947");
    expect(`${song.origin} ${song.publicDomain}`).not.toMatch(/English ballad, (documented from the )?17th century/);
  });
});

describe("structured data genre", () => {
  it.each(ALL_SONGS.map((s) => s.slug))("%s: files only the genre as genre, never a demand or shape tag", async (slug) => {
    const song = songBySlug(slug)!;
    const composition = jsonLd(await render(slug))["@graph"].find((n) => n["@type"] === "MusicComposition")!;
    expect(composition.genre).toBe(song.genre);
  });
});

describe("a phrase that is not the song's opening", () => {
  /**
   * Home on the Range opens on its verse ("Oh, give me a home…", as its own
   * longer arrangement shows); the phrase entry holds the chorus hook. Round
   * 1's "opening phrase" template made every search-facing claim on that page
   * false, so the page names the excerpt it actually holds.
   */
  it("names the chorus hook, never the opening phrase, on every claim", async () => {
    const slug = "home-on-the-range";
    expect(songBySlug(slug)!.excerpt).toBe("chorus hook");

    const meta = await generateMetadata({ params: Promise.resolve({ slug }) });
    const title = (meta.title as { absolute: string }).absolute;
    expect(title).toBe("Sing Home on the Range: Chorus Hook, Key & Range");
    expect(String(meta.description)).toMatch(/^Sing the chorus hook of Home on the Range/);
    // Keywords come from lib/keywords.ts (songKeywords), checked there.
    expect(JSON.stringify({ ...meta, keywords: undefined })).not.toMatch(/opening phrase/i);

    const html = await render(slug);
    expect(html).not.toMatch(/opening phrase/i);
    const h1 = /<h1\b[^>]*>([\s\S]*?)<\/h1>/.exec(html)![1];
    expect(h1).toContain("the chorus hook, its key and note range");
    expect(html).toContain("The songbook transcribes the chorus hook rather than the");
    const composition = jsonLd(html)["@graph"].find((n) => n["@type"] === "MusicComposition")!;
    const names = (composition.additionalProperty as { name: string }[]).map((p) => p.name);
    expect(names).toContain("Lowest note (chorus hook)");
    expect(names).toContain("Highest note (chorus hook)");

    // The longer version links back to it by what it is.
    const full = await render("home-on-the-range-full");
    expect(full).toContain("chorus hook</span>");
    expect(full).not.toMatch(/opening phrase/i);
  });

  it("still calls every other phrase entry its opening phrase", async () => {
    const meta = await generateMetadata({ params: Promise.resolve({ slug: "silent-night" }) });
    expect((meta.title as { absolute: string }).absolute).toMatch(/Opening Phrase/);
  });
});

describe("sing next", () => {
  it("never relists this song's own melody, and lists each melody once", () => {
    for (const song of SONGS) {
      const related = relatedSongs(song, SONGS);
      const melodies = related.map((s) => s.arrangementOf ?? s.id);
      expect(melodies, song.slug).not.toContain(song.arrangementOf ?? song.id);
      expect(new Set(melodies).size, song.slug).toBe(melodies.length);
    }
  });

  it("fills the list from the difficulty its heading names before anything else", () => {
    // The heading reads "Other <difficulty> songs", so an Easy page must not
    // offer a Hard ballad while Easy songs are left over.
    for (const song of SONGS) {
      const label = computeDifficulty(song).label;
      const related = relatedSongs(song, SONGS);
      const sameDifficulty = SONGS.filter(
        (s) => s !== song && (s.arrangementOf ?? s.id) !== (song.arrangementOf ?? song.id) && computeDifficulty(s).label === label,
      );
      const matching = related.filter((s) => computeDifficulty(s).label === label).length;
      expect(matching, song.slug).toBe(Math.min(related.length, sameDifficulty.length));
    }
  });

  it("links every song from at least two other songs' lists", () => {
    // Ties inside a tier used to go to whichever songs sat first in the data
    // file, so Silent Night and Shenandoah were on no other song's list.
    for (const song of SONGS) {
      const inbound = SONGS.filter((o) => o !== song && relatedSongs(o, SONGS).includes(song)).length;
      expect(inbound, song.slug).toBeGreaterThanOrEqual(2);
    }
  });

  it("lists the closest range first among songs the heading groups together", () => {
    const centre = (s: (typeof SONGS)[number]) => {
      const [lo, hi] = songNoteRange(s);
      return (lo + hi) / 2;
    };
    for (const song of SONGS) {
      const label = computeDifficulty(song).label;
      const tier = (s: (typeof SONGS)[number]) =>
        (computeDifficulty(s).label === label ? 0 : 2) + (s.genre === song.genre ? 0 : 1);
      const related = relatedSongs(song, SONGS);
      for (let i = 1; i < related.length; i++) {
        const [a, b] = [related[i - 1], related[i]];
        if (tier(a) !== tier(b)) continue;
        expect(Math.abs(centre(a) - centre(song)), `${song.slug}: ${a.slug} before ${b.slug}`).toBeLessThanOrEqual(
          Math.abs(centre(b) - centre(song)),
        );
      }
    }
  });

  it("lists only what its heading names: the page's difficulty, or its genre when the heading adds it", async () => {
    for (const song of SONGS) {
      const html = await render(song.slug);
      const m = /<h2[^>]*>Other (easy|medium|hard) songs(?: and more ([^<]+))?<\/h2>/.exec(html);
      expect(m, song.slug).not.toBeNull();
      const [, difficulty, genre] = m!;
      expect(difficulty, song.slug).toBe(computeDifficulty(song).label.toLowerCase());
      if (genre !== undefined) expect(genre, song.slug).toBe(song.genre);
      for (const r of relatedSongs(song, SONGS)) {
        const named =
          computeDifficulty(r).label.toLowerCase() === difficulty || (genre !== undefined && r.genre === genre);
        expect(named, `${song.slug} lists ${r.slug}`).toBe(true);
      }
    }
  });
});

describe("song data a page states as fact", () => {
  it("never tags a song rated Hard as narrow range", () => {
    // The tag sentence prints the first demand tag as "what it asks of a
    // voice", and the /songs guide sends beginners to narrow-range melodies.
    for (const song of ALL_SONGS.filter((s) => s.tags.includes("narrow range"))) {
      expect(computeDifficulty(song).label, song.slug).not.toBe("Hard");
    }
  });

  it("never tags a melody stepwise when its leaps raise its own rating", () => {
    // computeDifficulty adds leaps to the span; a melody the page calls
    // stepwise must rate as a stepwise melody of the same span would
    // (components/songs/lib.test.ts "rates a leapy melody above a stepwise one").
    for (const song of ALL_SONGS.filter((s) => s.tags.includes("stepwise"))) {
      const d = computeDifficulty(song);
      const spanOnly =
        d.rangeSemis <= DIFFICULTY_EASY_MAX ? "Easy" : d.rangeSemis <= DIFFICULTY_MEDIUM_MAX ? "Medium" : "Hard";
      expect(d.label, song.slug).toBe(spanOnly);
    }
  });

  it("names Loch Lomond's scale by the notes it transcribes", () => {
    const loch = songBySlug("loch-lomond")!;
    // C, D, E, G and A only: five pitch classes, the major pentatonic.
    expect(new Set(loch.notes.map((n) => n.midi % 12))).toEqual(new Set([0, 2, 4, 7, 9]));
    expect(loch.tags).toContain("pentatonic");
    expect(loch.tags).not.toContain("hexatonic");
  });

  it("prints Newton's second stanza without a comma inside its clause", () => {
    expect(songLyricText(songBySlug("amazing-grace-full")!)).toContain(
      "'Twas grace that taught my heart to fear,",
    );
  });
});

describe("the song key rule, both halves", () => {
  // With a saved range a song opens fitted to it; without one it opens in
  // the written key and is scored in either octave (components/songs/lib.ts
  // defaultOctaveAgnostic). A treble-pitched written range reads as out of
  // reach for a lower voice unless the octave half is said too.
  it("is stated on every song page, by the button and by the written range", async () => {
    const html = await render(SONGS[0].slug);
    expect(html).toContain("fitted to your");
    expect(html).toContain("measured range if you have taken the range test");
    expect(html).toContain("written key and is scored in either octave");
    expect(html).toContain("written pitch and is scored in either octave");
    // Both directions: the lowest written songs (E3–C4) suit a high voice an
    // octave up as much as the treble-pitched ones suit a low voice down.
    expect(html).toContain("a lower voice can sing it an octave down and a higher voice an octave up");
  });

  it("is stated on the homepage's song shelf", async () => {
    const { default: Home } = await import("@/app/page");
    const html = renderToStaticMarkup(createElement(Home));
    expect(html).toContain("songs open fitted to your");
    expect(html).toContain("open in the written key and are scored in either octave");
  });
});
