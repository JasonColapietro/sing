import { describe, expect, it } from "vitest";
import { EXERCISES, PRO_PACKS, computeRootLadder, ladderWalk } from "./exercises";

// five-note-scale's highest interval is the fifth (7 semitones).
const fiveNote = EXERCISES.find((e) => e.id === "five-note-scale")!;

describe("computeRootLadder", () => {
  it("defaults to the classic C3–G3 ladder without a saved range", () => {
    expect(computeRootLadder(fiveNote)).toEqual([48, 49, 50, 51, 52, 53, 54, 55]);
  });

  it("covers every semitone of the range-derived band, however wide", () => {
    // start = 48 + 4 = 52, top = 72 - 5 - 7 = 60 → nine consecutive roots.
    const roots = computeRootLadder(fiveNote, 48, 72);
    expect(roots[0]).toBe(52);
    expect(roots[roots.length - 1]).toBe(60);
    expect(roots).toEqual(
      Array.from({ length: 9 }, (_, i) => 52 + i),
    );
  });

  it("collapses a too-narrow range to a single root instead of a plateau", () => {
    // start = 52, top = max(52, 55 - 5 - 7) = 52 — one root, no repeats.
    expect(computeRootLadder(fiveNote, 48, 55)).toEqual([52]);
  });

  it("never starts below MIDI 30", () => {
    const roots = computeRootLadder(fiveNote, 20, 60);
    expect(roots[0]).toBe(30);
  });
});

describe("ladderWalk", () => {
  const ladder = [48, 49, 50, 51];

  it("walks up, turns at the top, walks down, and turns at the bottom", () => {
    const roots = Array.from({ length: 12 }, (_, rep) => ladderWalk(ladder, rep).root);
    expect(roots).toEqual([48, 49, 50, 51, 50, 49, 48, 49, 50, 51, 50, 49]);
  });

  it("sings the top and bottom notes once per turn, never twice in a row", () => {
    const period = 2 * ladder.length - 2;
    const cycle = Array.from({ length: period }, (_, rep) => ladderWalk(ladder, rep).root);
    expect(cycle.filter((r) => r === 51)).toHaveLength(1);
    expect(cycle.filter((r) => r === 48)).toHaveLength(1);
  });

  it("flips ascending at the top note and back at the bottom", () => {
    const dirs = Array.from({ length: 8 }, (_, rep) => ladderWalk(ladder, rep).ascending);
    // Reps 0-2 head up; the top note (rep 3) and the descent head down;
    // the bottom note (rep 6) heads up again.
    expect(dirs).toEqual([true, true, true, false, false, false, true, true]);
  });

  it("repeats exactly every 2n-2 reps, even far out", () => {
    const period = 2 * ladder.length - 2;
    for (let rep = 0; rep < period; rep++) {
      expect(ladderWalk(ladder, rep + 100 * period)).toEqual(ladderWalk(ladder, rep));
    }
  });

  it("holds steady on a single-root ladder", () => {
    for (let rep = 0; rep < 5; rep++) {
      expect(ladderWalk([52], rep)).toEqual({ root: 52, index: 0, ascending: true });
    }
  });
});

describe("pack descriptions stay true to the packs", () => {
  // The library used to restate this copy in a second hand-kept array, and the
  // two drifted. The teaser now renders straight from PRO_PACKS, so the only
  // claims left to check are the ones baked into the description text itself.

  it("counts the exercises it actually ships", () => {
    for (const pack of PRO_PACKS) {
      const claimed = pack.desc.match(/(\d+)\s+exercises/);
      expect(claimed, `${pack.name} states an exercise count`).not.toBeNull();
      expect(Number(claimed![1]), `${pack.name} count matches its array`).toBe(
        pack.exercises.length,
      );
    }
  });

  it("promises no fixed duration, since ladder length is the singer's range", () => {
    // "A gentle 6-minute wake-up" survived here after computeRootLadder stopped
    // capping reps, and ran ~22 min for a three-octave singer.
    for (const pack of PRO_PACKS) {
      expect(pack.desc, `${pack.name} claims no minute figure`).not.toMatch(
        /\d+\s*-?\s*(min|minute)/i,
      );
    }
  });

  it("gives every pack a unique id, which the teaser now keys on", () => {
    const ids = PRO_PACKS.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
