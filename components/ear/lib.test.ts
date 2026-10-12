import { describe, expect, it } from "vitest";
import {
  INTERVAL_SETS,
  generateMelody,
  hasSavedRange,
  intervalWithArticle,
  singableRegister,
  type Difficulty,
} from "./lib";

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
