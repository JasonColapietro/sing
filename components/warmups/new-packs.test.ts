import { describe, expect, it } from "vitest";
import {
  ALL_EXERCISES,
  EXERCISES,
  PRO_PACKS,
  computeRootLadder,
  patternSpan,
  tooWideForRange,
  type WarmupExercise,
} from "./exercises";
import { PRO_ROUTINES, routineById } from "./routines";

const NEW = ["runs", "low-notes", "long-phrases", "leaps", "clear-words"];
const ROOT = 60;
const shape = (e: WarmupExercise) =>
  JSON.stringify([
    e.buildSteps(ROOT).map((s) => s.map((m) => m - ROOT)),
    e.noteDur ?? null,
    !!e.glide,
    e.ladder ?? "up",
    e.gapSec ?? null,
  ]);
const pack = (id: string) => PRO_PACKS.find((p) => p.id === id)!;
const newExercises = NEW.flatMap((id) => pack(id).exercises);

describe("the 2026-11 Pro packs", () => {
  it("adds five packs after the original three", () => {
    expect(PRO_PACKS.map((p) => p.id)).toEqual(["belt-prep", "head-voice-builder", "mix", ...NEW]);
  });

  it("gives each new pack six to eight exercises with its own id prefix", () => {
    const prefix: Record<string, string> = {
      runs: "runs-",
      "low-notes": "low-",
      "long-phrases": "phrase-",
      leaps: "leap-",
      "clear-words": "words-",
    };
    for (const id of NEW) {
      expect(pack(id).exercises.length, id).toBeGreaterThanOrEqual(6);
      expect(pack(id).exercises.length, id).toBeLessThanOrEqual(8);
      for (const e of pack(id).exercises) expect(e.id.startsWith(prefix[id]), e.id).toBe(true);
      // The pack's own line states its count, as the original three do.
      expect(pack(id).desc, id).toContain(`${pack(id).exercises.length} exercises`);
    }
  });

  it("shares no shape between a new exercise and any other exercise", () => {
    // Padding is a new exercise that is an old one renamed. Three pairs among
    // the exercises that shipped before 2026-11 already share a shape (the
    // octave siren and the mix pack's ng slide, the free descending five and
    // the head-voice hum, gee to the octave and the loo arpeggio), each on a
    // different sound; those are left as they are, and every new exercise is
    // held against all the others.
    const fresh = new Set(newExercises.map((e) => e.id));
    for (const e of newExercises) {
      const twin = ALL_EXERCISES.find((o) => o.id !== e.id && shape(o) === shape(e));
      expect(twin?.id, `${e.id} duplicates ${twin?.id}`).toBeUndefined();
    }
    expect(fresh.size).toBe(newExercises.length);
  });

  it("gives every exercise a title no other exercise logs under", () => {
    // Sessions carry the title, not the id, so two exercises with one title
    // would share stars and a best score.
    const titles = ALL_EXERCISES.map((e) => e.title);
    expect(new Set(titles).size).toBe(titles.length);
  });

  it("keeps every new exercise Pro and every new pack a Pro routine", () => {
    for (const id of NEW) {
      expect(routineById(id)?.pro, id).toBe(true);
      expect(PRO_ROUTINES.some((r) => r.id === id)).toBe(true);
      for (const e of pack(id).exercises) expect(EXERCISES.some((f) => f.id === e.id)).toBe(false);
    }
  });

  it("claims nothing the app cannot hear", () => {
    const banned =
      /\b(strain|safe|safely|healthy|register detected|we hear|the app hears|measures your (tone|volume|loudness|diction|words))\b/i;
    for (const id of NEW) {
      expect(banned.test(`${pack(id).name} ${pack(id).desc}`), id).toBe(false);
      for (const e of pack(id).exercises) expect(banned.test(`${e.title} ${e.desc} ${e.tip}`), e.id).toBe(false);
    }
    // The words pack scores pitch only, and every one of its rows says so.
    for (const e of pack("clear-words").exercises) {
      expect(e.desc, e.id).toMatch(/The app scores the pitch; the words are yours to judge\.$/);
    }
  });

  it("keeps the low drills off the top of the range", () => {
    for (const e of pack("low-notes").exercises) expect(e.rangeCap?.to ?? 1, e.id).toBeLessThanOrEqual(0.6);
  });

  it("teaches no fry, growl or rasp, and no pushing for volume", () => {
    const taught = /\b(fry|growl|rasp|grit|distortion|louder|as loud as|push harder|more air)\b/i;
    for (const e of newExercises) expect(taught.test(`${e.title} ${e.desc}`), e.id).toBe(false);
  });

  it("fits every new exercise to a narrow measured range, inside it", () => {
    // An octave of measured range: C3 to C4.
    const narrow = { lowMidi: 48, highMidi: 60 };
    for (const e of newExercises) {
      const ladder = computeRootLadder(e, narrow.lowMidi, narrow.highMidi);
      expect(ladder.length, e.id).toBeGreaterThanOrEqual(1);
      // Nothing in these packs is wider than a tenth, so the routine runner
      // never skips a step (tooWideForRange is for the twelfth runs).
      expect(patternSpan(e), e.id).toBeLessThanOrEqual(16);
      expect(tooWideForRange(e, narrow), e.id).toBe(false);
      // A pattern no wider than the range stays wholly inside it.
      if (patternSpan(e) <= narrow.highMidi - narrow.lowMidi) {
        for (const root of ladder) {
          const notes = e.buildSteps(root).flat();
          expect(Math.max(...notes), `${e.id} from ${root}`).toBeLessThanOrEqual(narrow.highMidi);
          expect(Math.min(...notes), `${e.id} from ${root}`).toBeGreaterThanOrEqual(narrow.lowMidi);
        }
      }
    }
  });

  it("fits every new exercise to a two-octave range with the usual headroom", () => {
    const wide = { lowMidi: 45, highMidi: 69 };
    for (const e of newExercises) {
      const ladder = computeRootLadder(e, wide.lowMidi, wide.highMidi);
      expect(ladder.length, e.id).toBeGreaterThanOrEqual(1);
      for (const root of ladder) {
        const notes = e.buildSteps(root).flat();
        expect(Math.max(...notes), `${e.id} from ${root}`).toBeLessThanOrEqual(wide.highMidi);
        expect(Math.min(...notes), `${e.id} from ${root}`).toBeGreaterThanOrEqual(wide.lowMidi);
      }
    }
  });
});
