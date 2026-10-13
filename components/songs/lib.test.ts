import { describe, expect, it } from "vitest";
import { tallyFromScores } from "@/lib/analytics";
import { ALL_SONGS, SONGS, PRO_SONGS, songBySlug } from "./data";
import {
  AUTO_TEMPO_DOWN_SCORE,
  AUTO_TEMPO_UP_SCORE,
  BAND_ORDER,
  BAND_UNLOCK_MASTERED,
  INITIAL_MULTIPLIER,
  RETIRED_SONG_TITLES,
  bestScoreForSong,
  isSessionOfSong,
  phraseName,
  songTitlesFor,
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
  countOpenSongsFitting,
  countSongsFitting,
  createPassOctave,
  defaultOctaveAgnostic,
  displayMidi,
  hardestNotes,
  notesInSungOctave,
  scoredOctaveShift,
  sungOctaveShift,
  sungOctaveTag,
  TOLERANCE_CENTS,
  fitTransposeToRange,
  isMastered,
  MASTERY_MIN_TEMPO,
  multiplierStep,
  pointsFor,
  rangeFit,
  snapTempo,
  songTranspose,
  startableRecents,
  startingNote,
  transposedNotes,
  COUNT_IN_BEATS,
  secPerBeat,
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

describe("countOpenSongsFitting: what the range result can promise", () => {
  // B2–A4: most of the free songs fit once opened in this singer's key, but
  // a new singer can start only the first band; the rest show Locked in the
  // library.
  const range = { lowMidi: 47, highMidi: 69 };

  it("counts only the bands a singer has opened, and says how many wait", () => {
    const counted = countOpenSongsFitting(SONGS, new Set(), range);
    const first = SONGS.filter((s) => bandForSong(s) === "first");
    expect(counted.total).toBe(first.length);
    expect(counted.locked).toBe(SONGS.length - first.length);
    expect(counted.fitting).toBeLessThanOrEqual(counted.total);
    expect(counted.fitting).toBe(countSongsFitting(first, range));
  });

  it("grows as mastery opens the next band", () => {
    const firstTwo = SONGS.filter((s) => bandForSong(s) === "first").slice(0, BAND_UNLOCK_MASTERED);
    const before = countOpenSongsFitting(SONGS, new Set(), range);
    const after = countOpenSongsFitting(SONGS, new Set(firstTwo.map((s) => s.id)), range);
    expect(after.total).toBeGreaterThan(before.total);
    expect(after.total + after.locked).toBe(SONGS.length);
  });
});

describe("countSongsFitting", () => {
  const range = { lowMidi: 55, highMidi: 72 };

  it("counts songs that fit once opened in the singer's key", () => {
    const songs = [
      song("inside", [60, 64, 67]),
      song("too-high", [60, 64, 74]),
      song("too-low", [50, 55, 60]),
      song("edges", [55, 72]),
    ];
    // Each opens fitted to the range (songTranspose), as the library badge
    // and the "Fits my range" filter judge it, so all four fit.
    expect(countSongsFitting(songs, range)).toBe(4);
    for (const s of songs) {
      expect(rangeFit(s, range, songTranspose(s, range, null)).verdict).toBe("fits");
    }
  });

  it("agrees with the library badge for low and narrow voices on the first band", () => {
    // Round 7: the written-key count told these voices "Nothing fits" while
    // the songbook marked the same first-band songs "Fits your range".
    const first = SONGS.filter((s) => bandForSong(s) === "first");
    for (const r of [
      { lowMidi: 40, highMidi: 64 }, // E2–E4
      { lowMidi: 45, highMidi: 65 }, // A2–F4
      { lowMidi: 48, highMidi: 65 }, // C3–F4
      { lowMidi: 57, highMidi: 64 }, // A3–E4
    ]) {
      const badges = first.filter((s) => rangeFit(s, r, songTranspose(s, r, null)).verdict === "fits").length;
      expect(countSongsFitting(first, r)).toBe(badges);
      expect(badges).toBeGreaterThan(0);
    }
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

  /**
   * Mastery used to ignore tempo, so a pass at a quarter speed unlocked the next
   * band on the same terms as a clean one at written tempo.
   */
  it("refuses a pass sung below written tempo", () => {
    expect(isMastered("solo", "performance", 100, true, TEMPO_MIN)).toBe(false);
    expect(isMastered("solo", "performance", 100, true, 0.95)).toBe(false);
    expect(isMastered("solo", "performance", 100, true, MASTERY_MIN_TEMPO)).toBe(true);
  });

  it("allows a pass sung faster than written", () => {
    expect(isMastered("solo", "performance", 100, true, TEMPO_MAX)).toBe(true);
  });

  it("treats a missing or broken tempo as written tempo rather than unlocking on NaN", () => {
    expect(isMastered("solo", "performance", 100)).toBe(true);
    expect(isMastered("solo", "performance", 100, true, NaN)).toBe(false);
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

describe("startableRecents: the recently-sung row never offers a locked song", () => {
  const songs = [
    stepwise("first-1", 0),
    stepwise("first-2", 2),
    stepwise("easy-1", 7),
    stepwise("steady-1", 11),
  ];
  const at = "2026-10-01T12:00:00.000Z";

  it("drops a song whose band is shut, as a deep link can leave in recents", () => {
    const recents = [
      { id: "steady-1", at },
      { id: "first-2", at },
    ];
    const row = startableRecents(recents, songs, new Set());
    expect(row.map((r) => r.song.id)).toEqual(["first-2"]);
  });

  it("offers the song once its band opens, keeping recency order", () => {
    const recents = [
      { id: "easy-1", at },
      { id: "first-2", at },
    ];
    const row = startableRecents(recents, songs, new Set(["first-1", "first-2"]));
    expect(row.map((r) => r.song.id)).toEqual(["easy-1", "first-2"]);
  });

  it("skips ids outside the list it was handed and caps the row", () => {
    const recents = [{ id: "gone", at }, ...songs.map((s) => ({ id: s.id, at }))];
    const all = new Set(songs.map((s) => s.id));
    expect(startableRecents(recents, songs, all, 2).map((r) => r.song.id)).toEqual([
      "first-1",
      "first-2",
    ]);
  });

  it("agrees with the real book: every free song in the row is startable", () => {
    const recents = SONGS.map((s) => ({ id: s.id, at }));
    for (const { song: s } of startableRecents(recents, SONGS, new Set(), SONGS.length)) {
      expect(bandOpen(bandForSong(s), new Set(), SONGS), s.id).toBe(true);
    }
    const locked = SONGS.find((s) => bandForSong(s) !== "first");
    expect(locked).toBeDefined();
    expect(startableRecents([{ id: locked!.id, at }], SONGS, new Set())).toEqual([]);
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

describe("songTranspose: the key a song opens in", () => {
  const twinkle = song("twinkle", [60, 60, 67, 67, 69, 69, 67]);
  const other = song("other", [55, 57, 59, 60]);
  const baritone = { lowMidi: 45, highMidi: 64 };

  it("opens in the written key when no range is saved", () => {
    expect(songTranspose(twinkle, {}, null)).toBe(0);
    expect(songTranspose(twinkle, { lowMidi: 45 }, null)).toBe(0);
  });

  it("opens fitted to a saved range, where Fit to my range would put it", () => {
    const fitted = songTranspose(twinkle, baritone, null);
    expect(fitted).toBe(fitTransposeToRange(twinkle, baritone));
    expect(fitted).toBeLessThan(0);
    expect(rangeFit(twinkle, baritone, fitted).verdict).toBe("fits");
  });

  it("lets the singer's pick override the fit, for that song only", () => {
    const picked = { songId: twinkle.id, semis: 2 };
    expect(songTranspose(twinkle, baritone, picked)).toBe(2);
    // The player is not re-mounted between songs: the next song refits.
    expect(songTranspose(other, baritone, picked)).toBe(fitTransposeToRange(other, baritone));
    expect(songTranspose(other, {}, picked)).toBe(0);
  });
});

describe("startingNote: the pitch a run hears before the downbeat", () => {
  const tune = song("tune", [62, 64, 66, 67]);
  const sungAll = [1, 1, 1, 1];

  it("is the first note the run sings, in the key it is sung in", () => {
    const spb = secPerBeat(tune.bpm, 1);
    expect(startingNote(tune.notes, sungAll, spb)?.midi).toBe(62);
    // Fitted or shifted by the singer: the reference moves with the key.
    expect(startingNote(transposedNotes(tune, -5), sungAll, spb)?.midi).toBe(57);
  });

  it("starts a looped span from that span's own first note", () => {
    expect(startingNote(tune.notes, [0, 0, 1, 1], 0.6)?.midi).toBe(66);
    expect(startingNote(tune.notes, [0, 0, 0, 0], 0.6)).toBeNull();
  });

  it("ends well before the downbeat at any tempo, so no scored frame hears it", () => {
    for (const spb of [0.25, 0.4, 0.6, 1, 2.4]) {
      const { dur } = startingNote(tune.notes, sungAll, spb)!;
      // Sounded on the first count-in beat; the downbeat is COUNT_IN_BEATS later.
      expect(COUNT_IN_BEATS * spb - dur).toBeGreaterThanOrEqual(2.5 * spb - 1e-9);
    }
  });
});

describe("defaultOctaveAgnostic", () => {
  it("scores any octave until a saved range places the song in the singer's octave", () => {
    expect(defaultOctaveAgnostic({})).toBe(true);
    expect(defaultOctaveAgnostic({ highMidi: 72 })).toBe(true);
    expect(defaultOctaveAgnostic({ lowMidi: 45, highMidi: 64 })).toBe(false);
  });
});

describe("either octave counts: one octave per pass", () => {
  // Deep River is built around its octave leap: "is" on C4, then "o" on C5.
  const deepRiver = SONGS.find((s) => s.id === "deep-river")!;
  const FPS = 60;
  /**
   * One pass at 60 fps, each note sung `shift(i)` octaves from its written
   * pitch, slightly sharp. Each note's frames' cents, by lyric.
   */
  function sing(shift: (i: number) => number): Map<string, number[]> {
    const passOctave = createPassOctave();
    const spb = secPerBeat(deepRiver.bpm, 1);
    const out = new Map<string, number[]>();
    deepRiver.notes.forEach((n, i) => {
      const frames = Math.round(n.durBeats * spb * FPS);
      const cents: number[] = [];
      for (let f = 0; f < frames; f++) cents.push(passOctave.cents(n.midi + 12 * shift(i) + 0.1, n.midi, 1 / FPS));
      out.set(`${i}:${n.lyric}`, cents);
    });
    return out;
  }
  const inTune = (cents: number[]) => cents.every((c) => Math.abs(c) <= TOLERANCE_CENTS);
  const missed = (cents: number[]) => cents.every((c) => Math.abs(c) > TOLERANCE_CENTS);

  it("scores a whole pass in the written octave, or an octave down or up", () => {
    expect(deepRiver.notes.map((n) => n.midi)).toContain(72);
    for (const octave of [0, -1, 1]) {
      for (const [note, cents] of sing(() => octave)) expect(inTune(cents), `${octave} ${note}`).toBe(true);
    }
  });

  it("does not score the leap's top notes as sung when they drop an octave", () => {
    const o = deepRiver.notes.findIndex((n) => n.lyric === "o");
    const ver = deepRiver.notes.findIndex((n) => n.lyric === "ver");
    expect(deepRiver.notes[o].midi).toBe(72);
    const skipped = sing((i) => (i === o || i === ver ? -1 : 0));
    for (const [note, cents] of skipped) {
      if (note === `${o}:o` || note === `${ver}:ver`) expect(missed(cents), note).toBe(true);
      else expect(inTune(cents), note).toBe(true);
    }
  });

  it("starts each pass undecided, folding to the nearest octave", () => {
    const passOctave = createPassOctave();
    expect(passOctave.shift).toBeNull();
    // An octave down, before any octave leads: folded, so in tune.
    expect(Math.abs(passOctave.cents(48.1, 60, 0.05))).toBeLessThanOrEqual(TOLERANCE_CENTS);
    expect(passOctave.shift).toBeNull();
    passOctave.cents(48.1, 60, 0.05);
    expect(passOctave.shift).toBe(-1);
    // The written octave now has to lead the pass's octave to replace it.
    expect(passOctave.cents(60.1, 60, 0.05)).toBeCloseTo(1210);
    expect(passOctave.shift).toBe(-1);
  });
});

describe("a voice sung an octave from the written melody: drawn and filed where it was sung", () => {
  it("draws the voice in the pass's octave once one leads, folded toward the target before that", () => {
    // Before an octave leads: folded to the octave nearest the target.
    expect(displayMidi(48, 60, true, null)).toBe(60);
    expect(displayMidi(48.3, 60, true, null)).toBeCloseTo(60.3);
    // Once one leads, moved by it, so a top note dropped an octave in a pass sung
    // in the written octave is drawn where it was sung, not folded onto the note.
    expect(displayMidi(50.3, 72, true, -2)).toBeCloseTo(74.3);
    expect(displayMidi(60, 72, true, 0)).toBe(60);
    // Nothing to fold toward: left where it was sung.
    expect(displayMidi(50, null, true, null)).toBe(50);
    // The exact octave is drawn exactly as sung.
    expect(displayMidi(48, 60, false, null)).toBe(48);
    expect(displayMidi(48, 60, false, -1)).toBe(48);
  });

  it("tags a pass drawn from another octave, since the lanes name the written notes", () => {
    expect(sungOctaveTag(null)).toBeNull();
    expect(sungOctaveTag(0)).toBeNull();
    expect(sungOctaveTag(-1)).toBe("Sung an octave down");
    expect(sungOctaveTag(1)).toBe("Sung an octave up");
    expect(sungOctaveTag(-2)).toBe("Sung two octaves down");
    expect(sungOctaveTag(2)).toBe("Sung two octaves up");
  });

  it("names the octave a frame is scored in: 0 in the exact octave, else the pass's, else the nearest", () => {
    expect(scoredOctaveShift(48.1, 60, false, -1)).toBe(0);
    expect(scoredOctaveShift(48.1, 60, true, null)).toBe(-1);
    expect(scoredOctaveShift(72.2, 60, true, null)).toBe(1);
    expect(scoredOctaveShift(60.1, 60, true, -1)).toBe(-1);
  });

  it("files a session in the octave that earned the most in-tune seconds, the written one on a tie", () => {
    expect(sungOctaveShift(new Map())).toBe(0);
    expect(sungOctaveShift(new Map([[-1, 4.2], [0, 1.1]]))).toBe(-1);
    expect(sungOctaveShift(new Map([[1, 2], [0, 2]]))).toBe(0);
    expect(sungOctaveShift(new Map([[0, 0.5], [1, 3], [-1, 2]]))).toBe(1);
    const notes = [{ midi: 67, startBeat: 0, durBeats: 1, lyric: "star" }];
    expect(notesInSungOctave(notes, 0)).toBe(notes);
    expect(notesInSungOctave(notes, -1)).toEqual([{ midi: 55, startBeat: 0, durBeats: 1, lyric: "star" }]);
    expect(notes[0].midi).toBe(67);
  });

  /**
   * One run of Twinkle at 60 fps the way the song player runs it: a fresh
   * createPassOctave each pass, every note sung `octave` octaves from its
   * written pitch and slightly sharp, with what the piano roll draws and what
   * the session files.
   */
  const twinkle = SONGS.find((s) => s.id === "twinkle")!;
  const FPS = 60;
  function run(octave: number, octaveAgnostic: boolean, passes = 2) {
    const spb = secPerBeat(twinkle.bpm, 1);
    const hitSec = twinkle.notes.map(() => 0);
    const possibleSec = twinkle.notes.map((n) => n.durBeats * spb * passes);
    const inTuneByShift = new Map<number, number>();
    const drawn: number[] = [];
    for (let p = 0; p < passes; p++) {
      const passOctave = createPassOctave();
      twinkle.notes.forEach((n, i) => {
        const frames = Math.round(n.durBeats * spb * FPS);
        for (let f = 0; f < frames; f++) {
          const sung = n.midi + 12 * octave + 0.1;
          const cents = octaveAgnostic ? passOctave.cents(sung, n.midi, 1 / FPS) : (sung - n.midi) * 100;
          drawn.push(displayMidi(sung, n.midi, octaveAgnostic, passOctave.shift));
          if (Math.abs(cents) > TOLERANCE_CENTS) continue;
          hitSec[i] += 1 / FPS;
          const shift = scoredOctaveShift(sung, n.midi, octaveAgnostic, passOctave.shift);
          inTuneByShift.set(shift, (inTuneByShift.get(shift) ?? 0) + 1 / FPS);
        }
      });
    }
    const filed = notesInSungOctave(twinkle.notes, sungOctaveShift(inTuneByShift));
    return { hitSec, possibleSec, drawn, filed };
  }

  it("draws every frame of Twinkle sung an octave down inside the roll's lanes", () => {
    // The roll's lanes: the written notes, two semitones either side.
    const written = twinkle.notes.map((n) => n.midi);
    const lo = Math.min(...written) - 2;
    const hi = Math.max(...written) + 2;
    expect(lo).toBeGreaterThan(Math.max(...written) - 12);
    for (const octave of [-1, 1]) {
      const { drawn } = run(octave, true);
      for (const midi of drawn) {
        expect(midi, `${octave}`).toBeGreaterThanOrEqual(lo);
        expect(midi, `${octave}`).toBeLessThanOrEqual(hi);
      }
    }
  });

  it("files the per-note tally and hardest notes of a run sung an octave down an octave below the written notes", () => {
    const { hitSec, possibleSec, filed } = run(-1, true);
    expect(filed.map((n) => n.midi)).toEqual(twinkle.notes.map((n) => n.midi - 12));
    const tally = tallyFromScores(
      filed.map((n, i) => ({ midi: n.midi, hitSec: hitSec[i], possibleSec: possibleSec[i] })),
    );
    const keys = Object.keys(tally).map(Number);
    expect(Math.max(...keys)).toBe(Math.max(...twinkle.notes.map((n) => n.midi)) - 12);
    expect(Math.min(...keys)).toBe(Math.min(...twinkle.notes.map((n) => n.midi)) - 12);
    // A note that came out weak is named in the octave it was sung in.
    const ratios = twinkle.notes.map((_, i) => (i === 2 ? 0.2 : 1));
    const [hardest] = hardestNotes(filed, ratios);
    expect(hardest.midi).toBe(twinkle.notes[2].midi - 12);
  });

  it("files a run in the written octave when it was sung there, or when only the exact octave counts", () => {
    expect(run(0, true).filed).toBe(twinkle.notes);
    // Exact octave, sung an octave down: nothing is credited, and nothing moves.
    const exact = run(-1, false);
    expect(exact.filed).toBe(twinkle.notes);
    expect(exact.hitSec.every((s) => s === 0)).toBe(true);
  });
});

describe("songbook transcriptions", () => {
  // Regression guard for two corrected transcriptions: London Bridge's third
  // "fall-ing down" rises E4–F4–G4, and Danny Boy's opening line.
  it("transcribes the corrected folk melodies", () => {
    const midis = (slug: string) => songBySlug(slug)!.notes.map((n) => n.midi);
    expect(midis("london-bridge-is-falling-down").slice(-3)).toEqual([64, 65, 67]);
    expect(midis("danny-boy")).toEqual([59, 60, 62, 64, 62, 64, 69, 67, 64, 62, 57]);
  });
});

describe("song history across a rename", () => {
  const log = (detail: string, score: number) => ({
    id: `${detail}-${score}`,
    type: "song" as const,
    date: "2026-10-01T12:00:00.000Z",
    day: "2026-10-01",
    durationSec: 60,
    xp: 5,
    detail,
    score,
  });

  it("keeps a best score logged under a song's old title", () => {
    expect(bestScoreForSong([log("Amazing Grace (Verse 1 & 2)", 88)], "Amazing Grace (Opening Lines, Verses 1 & 2)")).toBe(88);
    expect(bestScoreForSong([log("Home on the Range (Verse & Chorus)", 91)], "Home on the Range (Opening Lines)")).toBe(91);
    // Old and new sessions count together; the best of both is the best.
    expect(
      bestScoreForSong(
        [log("Amazing Grace (Opening Lines, Verses 1 & 2)", 70), log("Amazing Grace (Verse 1 & 2)", 88)],
        "Amazing Grace (Opening Lines, Verses 1 & 2)",
      ),
    ).toBe(88);
  });

  it("never hands one song's history to another", () => {
    // The short Amazing Grace is a different arrangement with its own record.
    expect(bestScoreForSong([log("Amazing Grace (Verse 1 & 2)", 88)], "Amazing Grace")).toBeUndefined();
    expect(isSessionOfSong({ type: "warmup", detail: "Amazing Grace (Verse 1 & 2)" }, "Amazing Grace (Opening Lines, Verses 1 & 2)")).toBe(false);
    expect(songTitlesFor("Ode to Joy")).toEqual(["Ode to Joy"]);
  });

  it("maps every retired title to a current song title, and retires no title still in use", () => {
    const live = new Set(ALL_SONGS.map((s) => s.title));
    for (const [current, olds] of Object.entries(RETIRED_SONG_TITLES)) {
      expect(live.has(current), current).toBe(true);
      for (const old of olds) expect(live.has(old), old).toBe(false);
    }
  });
});

describe("phraseName", () => {
  it("names an excerpt by what it is, and anything else as the opening phrase", () => {
    expect(phraseName(songBySlug("home-on-the-range")!)).toBe("chorus hook");
    expect(phraseName(songBySlug("silent-night")!)).toBe("opening phrase");
  });
});
