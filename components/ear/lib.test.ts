import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  INTERVAL_SETS,
  NO_HOLD,
  advanceHold,
  generateMelody,
  hasSavedRange,
  intervalWithArticle,
  pitchMatchTolerance,
  singableRegister,
  type Difficulty,
  type HoldState,
} from "./lib";
import { GRACE_MS } from "./note-catcher";

const MAJOR = [0, 2, 4, 5, 7, 9, 11];

/** True when every note sits in at least one major key. */
function fitsAMajorKey(notes: number[]): boolean {
  for (let tonic = 0; tonic < 12; tonic++) {
    if (notes.every((n) => MAJOR.includes((((n - tonic) % 12) + 12) % 12))) return true;
  }
  return false;
}

const LENGTH: Record<Difficulty, number> = { easy: 3, medium: 4, hard: 5 };

describe("generateMelody", () => {
  const registers = [
    singableRegister({}), // the no-range fallback, C3–C4
    singableRegister({ lowMidi: 45, highMidi: 64 }),
    singableRegister({ lowMidi: 57, highMidi: 79 }),
    singableRegister({ lowMidi: 60, highMidi: 65 }), // the narrowest savable span
    singableRegister({ lowMidi: 60, highMidi: 66 }),
    singableRegister({ lowMidi: 57, highMidi: 57 }), // a legacy no-span save
  ];

  for (const difficulty of ["easy", "medium", "hard"] as const) {
    it(`keeps ${difficulty} melodies in one key, in the register, with no repeated note`, () => {
      for (const register of registers) {
        for (let i = 0; i < 500; i++) {
          const notes = generateMelody(difficulty, register);
          expect(notes).toHaveLength(LENGTH[difficulty]);
          expect(notes.every(Number.isInteger)).toBe(true);
          expect(Math.min(...notes)).toBeGreaterThanOrEqual(register.lo);
          expect(Math.max(...notes)).toBeLessThanOrEqual(register.hi);
          expect(fitsAMajorKey(notes), notes.join(" ")).toBe(true);
          for (let j = 1; j < notes.length; j++) {
            expect(notes[j]).not.toBe(notes[j - 1]);
          }
        }
      }
    });
  }

  it("moves by scale step on easy and medium: never more than a whole tone", () => {
    for (const difficulty of ["easy", "medium"] as const) {
      for (let i = 0; i < 500; i++) {
        const notes = generateMelody(difficulty, singableRegister({}));
        for (let j = 1; j < notes.length; j++) {
          expect(Math.abs(notes[j] - notes[j - 1])).toBeLessThanOrEqual(2);
        }
      }
    }
  });
});

describe("singableRegister", () => {
  it("keeps the ±5 band around the middle of a wide range", () => {
    expect(singableRegister({ lowMidi: 45, highMidi: 64 })).toEqual({ lo: 50, hi: 60 });
    expect(singableRegister({ lowMidi: 57, highMidi: 79 })).toEqual({ lo: 63, hi: 73 });
  });

  it("stays inside a narrow measured range, which medium and hard score exactly", () => {
    expect(singableRegister({ lowMidi: 60, highMidi: 65 })).toEqual({ lo: 60, hi: 65 });
    expect(singableRegister({ lowMidi: 60, highMidi: 68 })).toEqual({ lo: 60, hi: 68 });
    for (let span = 5; span <= 30; span++) {
      const r = singableRegister({ lowMidi: 55, highMidi: 55 + span });
      expect(r.lo, `span ${span}`).toBeGreaterThanOrEqual(55);
      expect(r.hi, `span ${span}`).toBeLessThanOrEqual(55 + span);
      expect(r.hi - r.lo, `span ${span}`).toBeGreaterThanOrEqual(5);
    }
  });

  it("keeps a legacy save under five semitones playable rather than shrinking to it", () => {
    expect(singableRegister({ lowMidi: 57, highMidi: 57 })).toEqual({ lo: 52, hi: 62 });
    expect(singableRegister({ lowMidi: 60, highMidi: 63 })).toEqual({ lo: 57, hi: 67 });
  });

  it("falls back to C3–C4 with no range saved", () => {
    expect(singableRegister({})).toEqual({ lo: 48, hi: 60 });
  });
});

describe("intervalWithArticle", () => {
  it("says 'an octave' and keeps 'a' everywhere else, unison included", () => {
    expect(intervalWithArticle(12)).toBe("an octave");
    expect(intervalWithArticle(0)).toBe("a unison");
    expect(intervalWithArticle(7)).toBe("a perfect fifth");
    for (const semi of INTERVAL_SETS.hard.filter((s) => s !== 12)) {
      expect(intervalWithArticle(semi).startsWith("a ")).toBe(true);
    }
  });
});

describe("hasSavedRange", () => {
  it("needs both ends of a range test result", () => {
    expect(hasSavedRange({})).toBe(false);
    expect(hasSavedRange({ lowMidi: 48 })).toBe(false);
    expect(hasSavedRange({ lowMidi: 48, highMidi: 67 })).toBe(true);
  });
});

describe("advanceHold: a pitch-match hold is one steady stretch", () => {
  // pitch-match-game.tsx's numbers: a 1.5 s hold inside an 8 s window.
  const HOLD_MS = 1500;
  const WINDOW_MS = 8000;
  const FRAME = 1000 / 60;

  /** Runs the game's tick at 60 fps; the ms at which the round is matched, or null. */
  function matchedAt(inBand: (tMs: number) => boolean): number | null {
    let hold: HoldState = NO_HOLD;
    for (let t = FRAME; t <= WINDOW_MS; t += FRAME) {
      hold = advanceHold(hold, FRAME, inBand(t), GRACE_MS);
      if (hold.held >= HOLD_MS) return t;
    }
    return null;
  }

  /** In band while `cents(t)` is inside the level's tolerance. */
  const within = (tol: number, cents: (tMs: number) => number) => (t: number) => Math.abs(cents(t)) <= tol;

  it("never credits 300 ms in and 300 ms out, however long it goes on", () => {
    expect(matchedAt((t) => Math.floor(t / 300) % 2 === 0)).toBeNull();
  });

  it("credits 1.5 s held without a break", () => {
    const at = matchedAt(() => true);
    expect(at).not.toBeNull();
    expect(at!).toBeLessThan(HOLD_MS + 2 * FRAME);
  });

  it("forgives a dropout shorter than the grace mid-hold, and restarts after a longer one", () => {
    // 1 s in, then a gap, then the note again.
    const withGap = (gap: number) => (t: number) => t <= 1000 || t > 1000 + gap;
    // 100 ms out: the second stretch tops the first up to 1.5 s.
    expect(matchedAt(withGap(100))!).toBeLessThan(1000 + 100 + 500 + 2 * FRAME);
    // 200 ms out: the hold starts again, so it needs a full 1.5 s more.
    expect(matchedAt(withGap(200))!).toBeGreaterThan(1000 + 200 + HOLD_MS - FRAME);
  });

  it("does not mutate the state it is given", () => {
    const s: HoldState = { held: 400, lapse: 0 };
    advanceHold(s, 200, false, GRACE_MS);
    advanceHold(s, 16, true, GRACE_MS);
    expect(s).toEqual({ held: 400, lapse: 0 });
  });

  it("does not credit a voice wobbling ±70 cents around the note once a second", () => {
    const wobble = (t: number) => 70 * Math.sin((2 * Math.PI * t) / 1000);
    for (const d of ["easy", "medium", "hard"] as const) {
      expect(matchedAt(within(pitchMatchTolerance(d), wobble)), d).toBeNull();
    }
  });

  it("does not credit a slow ±200-cent hunt that never settles", () => {
    const hunt = (t: number) => 200 * Math.sin((2 * Math.PI * t) / 2500);
    expect(matchedAt(within(pitchMatchTolerance("easy"), hunt))).toBeNull();
  });

  it("still credits a held note sung with vibrato, whose swings past the band are brief", () => {
    // ±60 cents at 5.5 Hz: each swing out of a 50- or 35-cent band lasts well
    // under the grace, so the note counts as held.
    const vibrato = (t: number) => 60 * Math.sin((2 * Math.PI * 5.5 * t) / 1000);
    for (const d of ["easy", "hard"] as const) {
      expect(matchedAt(within(pitchMatchTolerance(d), vibrato)), d).not.toBeNull();
    }
  });

  it("is the rule pitch match's sing loop scores with, Note catcher's grace and all", () => {
    const src = readFileSync(new URL("./pitch-match-game.tsx", import.meta.url), "utf8");
    expect(src).toContain("hold = advanceHold(hold, dt, cents !== null && Math.abs(cents) <= tolerance, GRACE_MS);");
    expect(src).toContain("if (hold.held >= HOLD_MS) {");
    // No second, cumulative tally beside it.
    expect(src).not.toMatch(/held \+= dt/);
  });

  it("still credits a singer who scoops into the note and then holds it", () => {
    // 800 ms sliding up from 300 cents flat, then on the note.
    const scoop = (t: number) => (t < 800 ? -300 * (1 - t / 800) : 0);
    const at = matchedAt(within(pitchMatchTolerance("medium"), scoop));
    expect(at).not.toBeNull();
    expect(at!).toBeLessThan(800 + HOLD_MS);
  });
});
