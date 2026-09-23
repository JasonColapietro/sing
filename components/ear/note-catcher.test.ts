import { describe, expect, it } from "vitest";
import { SONGS, isProSong } from "@/components/songs/data";
import { TOLERANCE_CENTS, bandForSong } from "@/components/songs/lib";
import { ROUNDS, singableRegister, type Difficulty } from "./lib";
import {
  CATCHER_LEVELS,
  CHASE_DIFFICULTY,
  GRACE_MS,
  chaseSongs,
  INITIAL_CATCHER,
  LEAD_IN_MS,
  arrivalTimes,
  catcherDone,
  centreShift,
  describeOffset,
  markerMidi,
  onLine,
  randomTargets,
  songRegister,
  songTargets,
  tickCatcher,
  type CatcherState,
  type CatcherTarget,
} from "./note-catcher";

const DIFFS: Difficulty[] = ["easy", "medium", "hard"];
const FRAME = 1000 / 60;

/** Run the clock for `ms` at 60fps with a fixed sung pitch (or silence). */
function run(
  state: CatcherState,
  ms: number,
  midi: number | null,
  targets: CatcherTarget[],
  diff: Difficulty = "medium",
): CatcherState {
  let s = state;
  for (let t = 0; t < ms; t += FRAME) {
    s = tickCatcher(s, FRAME, midi, targets, CATCHER_LEVELS[diff]);
  }
  return s;
}

/** A seeded stand-in for randInt, so the generator's edges can be walked. */
function seeded(seed: number) {
  let x = seed;
  return (lo: number, hi: number) => {
    x = (x * 1103515245 + 12345) % 2147483648;
    return lo + (x % (hi - lo + 1));
  };
}

describe("levels", () => {
  it("uses the ear games' tolerance: the songbook's 50 cents, 35 on hard", () => {
    expect(CATCHER_LEVELS.easy.tolerance).toBe(TOLERANCE_CENTS);
    expect(CATCHER_LEVELS.medium.tolerance).toBe(TOLERANCE_CENTS);
    expect(CATCHER_LEVELS.hard.tolerance).toBe(35);
  });

  it("gets strictly harder up the ladder", () => {
    const [e, m, h] = DIFFS.map((d) => CATCHER_LEVELS[d]);
    expect(e.windowMs).toBeGreaterThan(m.windowMs);
    expect(m.windowMs).toBeGreaterThan(h.windowMs);
    expect(e.dwellMs).toBeLessThan(m.dwellMs);
    expect(m.dwellMs).toBeLessThan(h.dwellMs);
    expect(e.octaveAgnostic).toBe(true);
    expect(m.octaveAgnostic || h.octaveAgnostic).toBe(false);
  });

  it("leaves every window long enough to find the note and still hold it", () => {
    for (const d of DIFFS) {
      const l = CATCHER_LEVELS[d];
      expect(l.windowMs, d).toBeGreaterThanOrEqual(l.dwellMs * 2.5);
    }
  });
});

describe("target generation", () => {
  it("spaces arrivals so no two windows overlap", () => {
    for (const d of DIFFS) {
      const l = CATCHER_LEVELS[d];
      const times = arrivalTimes(ROUNDS, l);
      expect(times[0]).toBe(LEAD_IN_MS);
      for (let i = 1; i < times.length; i++) {
        expect(times[i] - times[i - 1]).toBeGreaterThan(l.windowMs);
      }
    }
  });

  it("makes ROUNDS random targets inside the comfortable register, never repeating", () => {
    const range = { lowMidi: 45, highMidi: 69 };
    const { lo, hi } = singableRegister(range);
    for (const d of DIFFS) {
      for (let seed = 1; seed < 40; seed++) {
        const ts = randomTargets(d, range, seeded(seed));
        expect(ts).toHaveLength(ROUNDS);
        for (let i = 0; i < ts.length; i++) {
          expect(ts[i].midi).toBeGreaterThanOrEqual(lo);
          expect(ts[i].midi).toBeLessThanOrEqual(hi);
          if (i > 0) {
            const step = Math.abs(ts[i].midi - ts[i - 1].midi);
            expect(step, `${d} seed ${seed}`).toBeGreaterThan(0);
            expect(step).toBeLessThanOrEqual(CATCHER_LEVELS[d].maxStep);
          }
        }
      }
    }
  });

  it("falls back to C3–C4 with no saved range", () => {
    const ts = randomTargets("medium", {}, seeded(7));
    for (const t of ts) {
      expect(t.midi).toBeGreaterThanOrEqual(48);
      expect(t.midi).toBeLessThanOrEqual(60);
    }
  });

  it("insets the song register from the saved range, and falls back without one", () => {
    expect(songRegister({ lowMidi: 50, highMidi: 70 })).toEqual({ lo: 52, hi: 68 });
    expect(songRegister({ lowMidi: 55, highMidi: 62 })).toEqual({ lo: 55, hi: 62 });
    expect(songRegister({})).toEqual({ lo: 48, hi: 64 });
  });

  it("centres a melody in the register", () => {
    expect(centreShift([60, 67], { lo: 48, hi: 55 })).toBe(-12);
    expect(centreShift([60, 64], { lo: 60, hi: 64 })).toBe(0);
    expect(centreShift([], { lo: 60, hi: 64 })).toBe(0);
  });

  it("takes a song's opening in order, contour intact, looping a short phrase", () => {
    const twinkle = SONGS.find((s) => s.id === "twinkle")!;
    const ts = songTargets(twinkle, { lo: 50, hi: 59 }, "easy");
    expect(ts).toHaveLength(ROUNDS);
    const shift = ts[0].midi - twinkle.notes[0].midi;
    ts.forEach((t, i) => {
      expect(t.midi - twinkle.notes[i].midi).toBe(shift);
      expect(t.lyric).toBe(twinkle.notes[i].lyric);
    });

    const short = SONGS.find((s) => s.notes.length < ROUNDS)!;
    const looped = songTargets(short, { lo: 50, hi: 62 }, "easy");
    expect(looped).toHaveLength(ROUNDS);
    expect(looped[short.notes.length].lyric).toBe(short.notes[0].lyric);
  });

  it("puts every free song's opening inside a typical range once transposed", () => {
    const register = songRegister({ lowMidi: 48, highMidi: 67 });
    for (const song of SONGS) {
      for (const t of songTargets(song, register, "easy")) {
        expect(t.midi, song.id).toBeGreaterThanOrEqual(register.lo - 3);
        expect(t.midi, song.id).toBeLessThanOrEqual(register.hi + 3);
      }
    }
  });
});

describe("chaseSongs", () => {
  it("offers only free short phrases from the first two bands, easiest first", () => {
    const songs = chaseSongs();
    expect(songs.length).toBeGreaterThanOrEqual(4);
    const bands = songs.map((s) => bandForSong(s));
    for (const s of songs) {
      expect(isProSong(s.id), s.id).toBe(false);
      expect(s.form, s.id).toBe("phrase");
    }
    expect(bands.every((b) => b === "first" || b === "easy")).toBe(true);
    expect(bands.lastIndexOf("first")).toBeLessThan(Math.max(0, bands.indexOf("easy")));
  });

  it("chases at easy", () => {
    expect(CHASE_DIFFICULTY).toBe("easy");
  });
});

describe("catching", () => {
  const targets: CatcherTarget[] = [
    { midi: 60, arriveMs: 1000 },
    { midi: 64, arriveMs: 4000 },
  ];

  it("catches a target held in tune for the dwell", () => {
    let s = run(INITIAL_CATCHER, 1000, null, targets); // lead-in, silent
    expect(s.results).toEqual([]);
    s = run(s, CATCHER_LEVELS.medium.dwellMs + 40, 60.2, targets);
    expect(s.results).toEqual([true]);
    expect(s.index).toBe(1);
  });

  it("does not credit singing the note before it reaches the line", () => {
    let s = run(INITIAL_CATCHER, 990, 60, targets);
    expect(s.heldMs).toBe(0);
    s = run(s, 200, 60, targets);
    expect(s.results).toEqual([]); // 190ms on the line is short of the 500ms dwell
  });

  it("misses a target when its window closes", () => {
    const s = run(INITIAL_CATCHER, 1000 + CATCHER_LEVELS.medium.windowMs + 20, null, targets);
    expect(s.results).toEqual([false]);
    expect(s.index).toBe(1);
  });

  it("rejects pitch outside tolerance, and tightens on hard", () => {
    let s = run(INITIAL_CATCHER, 1000, null, targets);
    s = run(s, 1500, 60.6, targets); // 60 cents sharp
    expect(s.results).toEqual([]);

    let h = run(INITIAL_CATCHER, 1000, null, targets, "hard");
    h = run(h, 1000, 60.4, targets, "hard"); // 40 cents: fine on medium, not on hard
    expect(h.results).toEqual([]);
  });

  it("counts any octave on easy only", () => {
    let e = run(INITIAL_CATCHER, 1000, null, targets, "easy");
    e = run(e, 600, 48, targets, "easy");
    expect(e.results).toEqual([true]);

    let m = run(INITIAL_CATCHER, 1000, null, targets);
    m = run(m, 1500, 48, targets);
    expect(m.results).toEqual([]);
  });

  it("survives a lapse inside the grace, and restarts the hold after a longer one", () => {
    const dwell = CATCHER_LEVELS.medium.dwellMs;
    let s = run(INITIAL_CATCHER, 1000, null, targets);
    s = run(s, dwell - 100, 60, targets);
    s = run(s, GRACE_MS - 40, null, targets);
    s = run(s, 120, 60, targets);
    expect(s.results).toEqual([true]);

    let t = run(INITIAL_CATCHER, 1000, null, targets);
    t = run(t, dwell - 100, 60, targets);
    t = run(t, GRACE_MS + 60, null, targets);
    expect(t.heldMs).toBe(0);
    t = run(t, 120, 60, targets);
    expect(t.results).toEqual([]);
  });

  it("does not let sliding through the note add up to a catch", () => {
    let s = run(INITIAL_CATCHER, 1000, null, targets);
    // Brush the target for 150ms at a time, 300ms away between each.
    for (let i = 0; i < 4; i++) {
      s = run(s, 150, 60, targets);
      s = run(s, 300, 63, targets);
    }
    expect(s.results).toEqual([]);
  });

  it("resolves every target and reports done, however the singer does", () => {
    let s = run(INITIAL_CATCHER, 1000, null, targets);
    s = run(s, 600, 60, targets); // catch the first
    s = run(s, 6000, null, targets); // sit out the second
    expect(s.results).toEqual([true, false]);
    expect(catcherDone(s, targets)).toBe(true);
    // Further ticks only move the clock.
    const after = tickCatcher(s, FRAME, 64, targets, CATCHER_LEVELS.medium);
    expect(after.results).toEqual(s.results);
  });

  it("never mutates the state it was given", () => {
    const before = { ...INITIAL_CATCHER, results: [] as boolean[] };
    tickCatcher(before, 2000, 60, targets, CATCHER_LEVELS.medium);
    expect(before).toEqual({ ...INITIAL_CATCHER, results: [] });
  });

  it("knows when a target is on the line", () => {
    const l = CATCHER_LEVELS.medium;
    expect(onLine(targets[0], 999, l)).toBe(false);
    expect(onLine(targets[0], 1000, l)).toBe(true);
    expect(onLine(targets[0], 1000 + l.windowMs, l)).toBe(false);
  });
});

describe("display", () => {
  it("folds the marker to the target's octave only when any octave counts", () => {
    expect(markerMidi(48.3, 60, true)).toBeCloseTo(60.3);
    expect(markerMidi(71, 60, true)).toBeCloseTo(59);
    expect(markerMidi(48.3, 60, false)).toBe(48.3);
  });

  it("describes the distance in words", () => {
    expect(describeOffset(12, 50)).toBe("on the note");
    expect(describeOffset(-80, 50)).toBe("80 cents flat");
    expect(describeOffset(310, 50)).toBe("3 semitones sharp");
  });
});
