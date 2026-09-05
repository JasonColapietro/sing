import { describe, expect, it } from "vitest";
import { SONGS, PRO_SONGS } from "./data";
import {
  AUTO_TEMPO_DOWN_SCORE,
  AUTO_TEMPO_UP_SCORE,
  BAND_ORDER,
  BAND_UNLOCK_MASTERED,
  INITIAL_MULTIPLIER,
  MASTERY_SCORE,
  MULTIPLIER_RUNGS,
  MULTIPLIER_STREAK,
  TEMPO_MAX,
  TEMPO_MIN,
  TEMPO_STEP,
  autoTempoStep,
  bandForSong,
  bandOpen,
  breathMarks,
  countSongsFitting,
  isMastered,
  multiplierStep,
  pointsFor,
  rangeFit,
  snapTempo,
} from "./lib";
import type { Song, SongNote } from "./types";

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

/** A stepwise melody, so its difficulty score is its range span alone. */
function stepwise(id: string, semis: number): Song {
  const midis = [60];
  for (let m = 61; m <= 60 + semis; m++) midis.push(m);
  return song(id, midis);
}

/**
 * Notes at the given start beats, one beat long unless `durs` says otherwise.
 * Pitch and lyric never matter to a breath mark.
 */
function timed(starts: number[], durs?: number[]): SongNote[] {
  return starts.map((startBeat, i) => ({
    midi: 60,
    startBeat,
    durBeats: durs?.[i] ?? 1,
    lyric: "la",
  }));
}

describe("isMastered", () => {
  it("does not award mastery for a section drill or a run that switched passes", () => {
    expect(isMastered("solo", "performance", 100, false)).toBe(false);
    expect(isMastered("solo", "performance", Infinity)).toBe(false);
    expect(isMastered("solo", "performance", 101)).toBe(false);
  });
  it("masters a solo pass sung in performance at or above the bar", () => {
    expect(isMastered("solo", "performance", MASTERY_SCORE)).toBe(true);
    expect(isMastered("solo", "performance", 100)).toBe(true);
  });

  it("refuses a solo pass that fell short", () => {
    expect(isMastered("solo", "performance", MASTERY_SCORE - 1)).toBe(false);
  });

  it("refuses any pass that left the guide singing", () => {
    expect(isMastered("guided", "performance", 100)).toBe(false);
    expect(isMastered("listen", "performance", 100)).toBe(false);
  });

  it("refuses a rehearsal, however clean", () => {
    expect(isMastered("solo", "rehearsal", 100)).toBe(false);
  });

  it("refuses a run that was never scored", () => {
    expect(isMastered("solo", "performance", undefined)).toBe(false);
  });
});

describe("bandForSong", () => {
  it("cuts the five bands out of the difficulty score", () => {
    expect(bandForSong(stepwise("a", 0))).toBe("first");
    expect(bandForSong(stepwise("b", 6))).toBe("first");
    expect(bandForSong(stepwise("c", 7))).toBe("easy");
    expect(bandForSong(stepwise("d", 9))).toBe("easy");
    expect(bandForSong(stepwise("e", 10))).toBe("steady");
    expect(bandForSong(stepwise("f", 13))).toBe("steady");
    expect(bandForSong(stepwise("g", 14))).toBe("hard");
    expect(bandForSong(stepwise("h", 17))).toBe("hard");
    expect(bandForSong(stepwise("i", 18))).toBe("peak");
  });

  it("rates a leapy melody above a stepwise one of the same span", () => {
    expect(bandForSong(stepwise("even", 12))).toBe("steady");
    expect(bandForSong(song("leapy", [60, 72, 60, 72]))).toBe("peak");
  });

  it("lands every song in the book in a band", () => {
    for (const s of [...SONGS, ...PRO_SONGS]) {
      expect(BAND_ORDER).toContain(bandForSong(s));
    }
  });
});

describe("bandOpen", () => {
  it("lets both catalogues progress through every populated band", () => {
    for (const catalogue of [SONGS, [...SONGS, ...PRO_SONGS]]) {
      const mastered = new Set<string>();
      for (const band of BAND_ORDER) {
        const members = catalogue.filter((s) => bandForSong(s) === band);
        if (members.length) expect(bandOpen(band, mastered, catalogue), band).toBe(true);
        for (const song of members) mastered.add(song.id);
      }
    }
  });
  const songs = [
    stepwise("first-1", 0),
    stepwise("first-2", 2),
    stepwise("first-3", 4),
    stepwise("easy-1", 7),
    stepwise("easy-2", 8),
    stepwise("steady-1", 11),
    stepwise("steady-2", 12),
  ];

  it("opens the first band to everyone", () => {
    expect(bandOpen("first", new Set<string>(), songs)).toBe(true);
  });

  it("keeps a later band shut until enough of the band below is mastered", () => {
    expect(bandOpen("easy", new Set<string>(), songs)).toBe(false);
    expect(bandOpen("easy", new Set(["first-1"]), songs)).toBe(false);
    expect(bandOpen("easy", new Set(["first-1", "first-2"]), songs)).toBe(true);
  });

  it("counts only the band directly below", () => {
    const twoEasy = new Set(["easy-1", "easy-2"]);
    expect(bandOpen("steady", twoEasy, songs)).toBe(true);
    expect(bandOpen("hard", twoEasy, songs)).toBe(false);
  });

  it("counts over the list it was handed, not the whole book", () => {
    expect(bandOpen("easy", new Set(["first-1", "first-2"]), [])).toBe(false);
  });

  it("takes BAND_UNLOCK_MASTERED at its word", () => {
    const ids = new Set(songs.slice(0, BAND_UNLOCK_MASTERED).map((s) => s.id));
    expect(bandOpen("easy", ids, songs)).toBe(true);
  });
});

describe("breathMarks", () => {
  it("marks a note the melody reaches after a full beat of rest", () => {
    expect(breathMarks(timed([0, 1, 3]))).toEqual([2]);
  });

  it("takes a rest of exactly one beat", () => {
    expect(breathMarks(timed([0, 3], [2, 1]))).toEqual([1]);
  });

  it("ignores a gap shorter than a beat", () => {
    expect(breathMarks(timed([0, 1.5, 2.5], [1, 1, 0.5]))).toEqual([]);
  });

  it("never marks the first note, however late the melody starts", () => {
    expect(breathMarks(timed([4, 5]))).toEqual([]);
  });

  it("measures from the furthest note sung, not the note before", () => {
    // The short note is nested under the long one, so nothing rests behind it.
    expect(breathMarks(timed([0, 1, 4], [4, 1, 1]))).toEqual([]);
  });

  it("is empty for an empty melody", () => {
    expect(breathMarks([])).toEqual([]);
  });

  it("marks the first note of a new line when the note before it was held", () => {
    // The songbook tiles without rests, so the phrase turnover is the breath.
    const notes = timed([0, 1, 2, 4], [1, 1, 2, 1]).map((n, i) => ({ ...n, line: i === 3 ? 1 : 0 }));
    expect(breathMarks(notes)).toEqual([3]);
  });

  it("does not mark a line change after a short note", () => {
    const notes = timed([0, 1, 2, 3], [1, 1, 1, 1]).map((n, i) => ({ ...n, line: i === 3 ? 1 : 0 }));
    expect(breathMarks(notes)).toEqual([]);
  });
});
