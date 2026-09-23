import { describe, expect, it } from "vitest";
import { SONGS } from "./data";
import {
  barBeatLabel,
  describeLoopRange,
  isWholeSongRange,
  loopBoundaries,
  loopRangeFromHandles,
  nearestBoundaryIndex,
  songTotalBeats,
} from "./lib";
import type { Song } from "./types";

const song: Song = {
  ...SONGS[0],
  beatsPerBar: 4,
  sections: [{ kind: "verse", label: "Verse 1", startBeat: 2, endBeat: 6 }],
  notes: [
    { midi: 60, startBeat: 0, durBeats: 1, lyric: "a" },
    { midi: 62, startBeat: 1, durBeats: 1, lyric: "b" },
    { midi: 64, startBeat: 2, durBeats: 2, lyric: "c" },
    { midi: 65, startBeat: 4, durBeats: 2, lyric: "d" },
    { midi: 67, startBeat: 6, durBeats: 4, lyric: "e" },
  ],
};

describe("loop ranges", () => {
  it("offers a handle at every note start plus the song's end", () => {
    expect(loopBoundaries(song)).toEqual([0, 1, 2, 4, 6, 10]);
  });

  it("never lets a handle sit mid-note, where a note would be dropped or clamped", () => {
    for (const s of SONGS) {
      const bounds = loopBoundaries(s);
      const starts = new Set(s.notes.map((n) => n.startBeat));
      for (const b of bounds.slice(0, -1)) expect(starts.has(b)).toBe(true);
      expect(bounds.at(-1)).toBe(songTotalBeats(s));
    }
  });

  it("snaps a beat to the closest boundary", () => {
    const bounds = loopBoundaries(song);
    expect(nearestBoundaryIndex(bounds, 2.9)).toBe(2); // 2 is closer than 4
    expect(nearestBoundaryIndex(bounds, 3)).toBe(2); // tie goes to the earlier
    expect(nearestBoundaryIndex(bounds, 99)).toBe(5);
  });

  it("keeps the loop at least one note long, pushing the handle that is not being dragged", () => {
    const bounds = loopBoundaries(song);
    expect(loopRangeFromHandles(bounds, 3, 3, "start")).toMatchObject({ startIndex: 2, endIndex: 3 });
    expect(loopRangeFromHandles(bounds, 3, 3, "end")).toMatchObject({ startIndex: 3, endIndex: 4 });
    expect(loopRangeFromHandles(bounds, 4, 1, "end")).toMatchObject({ startIndex: 4, endIndex: 5 });
    expect(loopRangeFromHandles(bounds, 1, 4, "start").range).toEqual({ startBeat: 1, endBeat: 6 });
  });

  it("clamps handles to the song", () => {
    const bounds = loopBoundaries(song);
    expect(loopRangeFromHandles(bounds, -3, 99, "start").range).toEqual({ startBeat: 0, endBeat: 10 });
  });

  it("treats a loop over the whole song as not drilling, so mastery still counts", () => {
    expect(isWholeSongRange(null, song)).toBe(true);
    expect(isWholeSongRange({ startBeat: 0, endBeat: 10 }, song)).toBe(true);
    expect(isWholeSongRange({ startBeat: 0, endBeat: 6 }, song)).toBe(false);
  });

  it("names a loop by its section when it is one, and by bars otherwise", () => {
    expect(describeLoopRange(song, { startBeat: 2, endBeat: 6 })).toBe("Verse 1");
    expect(describeLoopRange(song, { startBeat: 0, endBeat: 4 })).toBe("Bar 1");
    expect(describeLoopRange(song, { startBeat: 1, endBeat: 10 })).toBe("Bars 1–3");
  });

  it("reads a handle position as bar and beat", () => {
    expect(barBeatLabel(0, 4)).toBe("Bar 1, beat 1");
    expect(barBeatLabel(6, 4)).toBe("Bar 2, beat 3");
    expect(barBeatLabel(6.5, 3)).toBe("Bar 3, beat 1");
  });
});
