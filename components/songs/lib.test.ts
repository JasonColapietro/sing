import { describe, expect, it } from "vitest";
import { SONGS, PRO_SONGS } from "./data";
import {
  AUTO_TEMPO_DOWN_SCORE,
  AUTO_TEMPO_UP_SCORE,
  INITIAL_MULTIPLIER,
  MULTIPLIER_RUNGS,
  MULTIPLIER_STREAK,
  TEMPO_MAX,
  TEMPO_MIN,
  TEMPO_STEP,
  autoTempoStep,
  countSongsFitting,
  multiplierStep,
  pointsFor,
  rangeFit,
  snapTempo,
} from "./lib";
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

describe("snapTempo", () => {
  it("clamps to the bounds", () => {
    expect(snapTempo(0.1)).toBe(TEMPO_MIN);
    expect(snapTempo(3)).toBe(TEMPO_MAX);
  });

  it("rounds onto the step grid", () => {
    expect(snapTempo(0.83)).toBe(0.85);
    expect(snapTempo(0.82)).toBe(0.8);
    expect(snapTempo(1)).toBe(1);
  });

  it("leaves no floating-point dust behind", () => {
    for (let r = TEMPO_MIN; r <= TEMPO_MAX + 1e-9; r += TEMPO_STEP) {
      const snapped = snapTempo(r);
      expect(snapped).toBe(Number(snapped.toFixed(2)));
    }
  });
});

describe("autoTempoStep", () => {
  it("climbs one step at or above the up score", () => {
    expect(autoTempoStep(0.8, AUTO_TEMPO_UP_SCORE)).toBe(0.85);
    expect(autoTempoStep(0.8, 100)).toBe(0.85);
  });

  it("drops one step at or below the down score", () => {
    expect(autoTempoStep(0.8, AUTO_TEMPO_DOWN_SCORE)).toBe(0.75);
    expect(autoTempoStep(0.8, 0)).toBe(0.75);
  });

  it("holds between the thresholds", () => {
    expect(autoTempoStep(0.8, 70)).toBe(0.8);
  });

  it("never walks past the bounds", () => {
    expect(autoTempoStep(TEMPO_MAX, 100)).toBe(TEMPO_MAX);
    expect(autoTempoStep(TEMPO_MIN, 0)).toBe(TEMPO_MIN);
  });
});

describe("multiplierStep", () => {
  const top = MULTIPLIER_RUNGS[MULTIPLIER_RUNGS.length - 1];

  it("climbs a rung every MULTIPLIER_STREAK strong notes", () => {
    let state = INITIAL_MULTIPLIER;
    for (let i = 0; i < MULTIPLIER_STREAK - 1; i++) {
      state = multiplierStep(state, "perfect");
      expect(state.multiplier).toBe(3);
    }
    state = multiplierStep(state, "great");
    expect(state.multiplier).toBe(3.5);
    expect(state.streak).toBe(MULTIPLIER_STREAK);
  });

  it("stops at the top rung", () => {
    let state = INITIAL_MULTIPLIER;
    for (let i = 0; i < MULTIPLIER_STREAK * 10; i++) {
      state = multiplierStep(state, "perfect");
    }
    expect(state.multiplier).toBe(top);
  });

  it("keeps the rung but resets the streak on a good", () => {
    const state = multiplierStep({ multiplier: 4, streak: 3 }, "good");
    expect(state).toEqual({ multiplier: 4, streak: 0 });
  });

  it("drops a rung and resets on a miss, never below the first rung", () => {
    expect(multiplierStep({ multiplier: 4, streak: 3 }, "miss")).toEqual({
      multiplier: 3.5,
      streak: 0,
    });
    expect(multiplierStep(INITIAL_MULTIPLIER, "miss")).toEqual({
      multiplier: MULTIPLIER_RUNGS[0],
      streak: 0,
    });
  });
});

describe("pointsFor", () => {
  it("is the rounded product of the base value and the multiplier", () => {
    expect(pointsFor("perfect", 3)).toBe(300);
    expect(pointsFor("great", 3.5)).toBe(245);
    expect(pointsFor("good", 4.5)).toBe(180);
    expect(pointsFor("miss", 5)).toBe(0);
  });
});
