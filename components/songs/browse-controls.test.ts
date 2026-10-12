/**
 * "Fits my range" judges the key a song opens in. With a saved range every
 * song opens fitted to it, so judging the written key hid songs that would
 * open comfortably inside the range and disagreed with the cards' badges.
 */
import { describe, expect, it } from "vitest";
import { SONGS } from "./data";
import { applyBrowse, DEFAULT_BROWSE, type BrowseContext } from "./browse-controls";
import { rangeFit, songTranspose } from "./lib";

const ctx = (range: BrowseContext["range"]): BrowseContext => ({
  range,
  favorites: [],
  sessions: [],
  recents: [],
});

describe("Fits my range filter", () => {
  // A low voice: most of this book is written at treble pitch, above it.
  const low = { lowMidi: 40, highMidi: 60 };

  it("keeps songs written above the range that open fitted inside it", () => {
    const shown = applyBrowse(SONGS, { ...DEFAULT_BROWSE, fitsRange: true }, ctx(low));
    const writtenFits = SONGS.filter((s) => rangeFit(s, low).verdict === "fits");
    expect(shown.length).toBeGreaterThan(writtenFits.length);
  });

  it("agrees with the card badge for every song", () => {
    const shown = new Set(
      applyBrowse(SONGS, { ...DEFAULT_BROWSE, fitsRange: true }, ctx(low)).map((s) => s.id),
    );
    for (const song of SONGS) {
      const badgeFits = rangeFit(song, low, songTranspose(song, low, null)).verdict === "fits";
      expect(shown.has(song.id), song.slug).toBe(badgeFits);
    }
  });

  it("still drops a melody wider than the range, which no key change fixes", () => {
    const narrow = { lowMidi: 60, highMidi: 64 };
    const shown = applyBrowse(SONGS, { ...DEFAULT_BROWSE, fitsRange: true }, ctx(narrow));
    for (const song of shown) expect(rangeFit(song, narrow, songTranspose(song, narrow, null)).verdict).toBe("fits");
    expect(shown.length).toBeLessThan(SONGS.length);
  });
});
