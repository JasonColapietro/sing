import { describe, expect, it } from "vitest";
import { SONGS, PRO_SONGS } from "./data";
import { countSongsFitting, rangeFit } from "./lib";
import type { Song } from "./types";

/** A song is only ever weighed here by its notes, so the rest is scaffolding. */
function song(id: string, midis: number[]): Song {
  return {
    id,
    slug: id,
    title: id,
    origin: "test",
    publicDomain: "test",
    bpm: 100,
    beatsPerBar: 4,
    defaultKeyRootMidi: midis[0],
    form: "phrase",
    defaultLoops: 4,
    genre: "Folk",
    era: "Traditional",
    language: "English",
    tags: [],
    notes: midis.map((midi, i) => ({
      midi,
      startBeat: i,
      durBeats: 1,
      lyric: "la",
    })),
  };
}

describe("countSongsFitting", () => {
  const range = { lowMidi: 55, highMidi: 72 };

  it("counts only songs whose written notes sit inside the range", () => {
    const songs = [
      song("inside", [60, 64, 67]),
      song("too-high", [60, 64, 74]),
      song("too-low", [50, 55, 60]),
      song("edges", [55, 72]),
    ];
    expect(countSongsFitting(songs, range)).toBe(2);
  });

  it("counts a song wider than the voice as a miss, since no key fixes it", () => {
    const wider = song("wide", [50, 80]);
    expect(rangeFit(wider, range).verdict).toBe("wide");
    expect(countSongsFitting([wider], range)).toBe(0);
  });

  it("is zero with no saved range, matching rangeFit's unknown verdict", () => {
    expect(countSongsFitting(SONGS, {})).toBe(0);
  });

  it("is zero for an empty list", () => {
    expect(countSongsFitting([], range)).toBe(0);
  });

  it("never exceeds the list it was handed", () => {
    const free = countSongsFitting(SONGS, range);
    expect(free).toBeGreaterThan(0);
    expect(free).toBeLessThanOrEqual(SONGS.length);
    // The whole point of taking a list: the free count must not silently
    // include the Pro book.
    expect(free).toBeLessThanOrEqual(
      countSongsFitting([...SONGS, ...PRO_SONGS], range),
    );
  });
});
