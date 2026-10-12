import { describe, expect, it } from "vitest";
import { midiToFreq } from "@/lib/audio/notes";
import { EXERCISES, buildSegments, type Segment } from "./exercises";
import { targetMidiAt } from "./lib";
import {
  MEASURED_ONSET_LAG_SEC,
  MODELLED_ONSET_LAG_SEC,
  UNMODELLED_INPUT_LAG_SEC,
} from "@/lib/audio/latency";
import {
  GLIDE_TIME_SLACK,
  ONSET_GRACE_MAX_SHARE,
  ONSET_GRACE_SEC,
  createRepScorer,
  foldToOctaveOf,
  onsetGraceFor,
  referenceMidiAt,
} from "./scoring";

const fiveNote = EXERCISES.find((e) => e.id === "five-note-scale")!;
const siren = EXERCISES.find((e) => e.id === "ng-siren-fifth")!;

/**
 * Feed every segment exactly its own duration of frames, pitched by `detune`
 * semitones off the target (0 = perfectly on pitch). Midpoint sampling keeps
 * every frame strictly inside its segment, so the accumulated hit time sums
 * to the pattern's full target duration and a perfect take can reach 100.
 */
function feedThroughout(
  scorer: ReturnType<typeof createRepScorer>,
  segs: Segment[],
  detuneSemis: number,
  until = Infinity,
) {
  const steps = 40;
  for (const seg of segs) {
    const dt = seg.dur / steps;
    for (let k = 0; k < steps; k++) {
      const t = seg.t0 + (k + 0.5) * dt;
      if (t > until) return;
      const target = targetMidiAt(segs, t)!;
      scorer.feed(t, midiToFreq(target + detuneSemis), dt);
    }
  }
}

describe("createRepScorer", () => {
  it("scores a perfectly on-pitch take 100", () => {
    const { segs } = buildSegments(fiveNote, 52, 1);
    const scorer = createRepScorer(segs);
    feedThroughout(scorer, segs, 0);
    expect(scorer.result(52)!.score).toBe(100);
  });

  it("scores 60 cents sharp as 0 but still a result — wrong is not absent", () => {
    const { segs } = buildSegments(fiveNote, 52, 1);
    const scorer = createRepScorer(segs);
    feedThroughout(scorer, segs, 0.6);
    const result = scorer.result(52);
    expect(result).not.toBeNull();
    expect(result!.score).toBe(0);
    expect(result!.avgCentsErr).toBeGreaterThanOrEqual(59);
  });

  it("scores 40 cents sharp as 100, pinning the ±50 window", () => {
    const { segs } = buildSegments(fiveNote, 52, 1);
    const scorer = createRepScorer(segs);
    feedThroughout(scorer, segs, 0.4);
    expect(scorer.result(52)!.score).toBe(100);
  });

  it("returns null for a rep of pure silence — nobody sang", () => {
    const { segs, totalSec } = buildSegments(fiveNote, 52, 1);
    const scorer = createRepScorer(segs);
    for (let t = 0; t < totalSec; t += 0.05) scorer.feed(t, null, 0.05);
    expect(scorer.voicedFrames).toBe(0);
    expect(scorer.result(52)).toBeNull();
  });

  it("gives half a pattern roughly half the score", () => {
    const { segs, totalSec } = buildSegments(fiveNote, 52, 1);
    const scorer = createRepScorer(segs);
    feedThroughout(scorer, segs, 0, totalSec / 2);
    const { score } = scorer.result(52)!;
    expect(score).toBeGreaterThanOrEqual(40);
    expect(score).toBeLessThanOrEqual(60);
  });

  it("credits each endpoint of a glide with half the segment", () => {
    const { segs } = buildSegments(siren, 52, 1);
    const scorer = createRepScorer(segs);
    feedThroughout(scorer, segs, 0);
    const possibleByMidi = new Map<number, number>();
    for (const note of scorer.result(52)!.notes!) {
      possibleByMidi.set(
        note.midi,
        (possibleByMidi.get(note.midi) ?? 0) + note.possibleSec,
      );
    }
    // Two glide segments (up then down), each crediting both endpoints with
    // half its possible time (its duration less its onset grace): 52 and 59
    // each collect one half from each segment.
    const halves = segs.reduce((a, s) => a + (s.dur - onsetGraceFor(s.dur)) / 2, 0);
    expect(possibleByMidi.get(52)).toBeCloseTo(halves, 6);
    expect(possibleByMidi.get(59)).toBeCloseTo(halves, 6);
  });

  it("ignores frames past the last segment, which is what makes grace time safe", () => {
    const { segs, totalSec } = buildSegments(fiveNote, 52, 1);
    const scorer = createRepScorer(segs);
    feedThroughout(scorer, segs, 0);
    const framesBefore = scorer.voicedFrames;
    const hitBefore = scorer.hitSec().reduce((a, b) => a + b, 0);
    scorer.feed(totalSec + 1, midiToFreq(60), 0.05);
    expect(scorer.voicedFrames).toBe(framesBefore);
    expect(scorer.hitSec().reduce((a, b) => a + b, 0)).toBe(hitBefore);
  });
});

/**
 * A take sung exactly as written but measured `lagSec` late, the way the timing
 * audit's aligned synthetic voice read: the pitch reported at pattern time t is
 * whatever the singer meant to sing at t - lagSec, silence included.
 * `sung(i, target)` is the midi the singer actually sings for segment i.
 */
function feedLagged(
  scorer: ReturnType<typeof createRepScorer>,
  segs: Segment[],
  lagSec: number,
  sung: (i: number, target: number) => number = (_, target) => target,
) {
  const dt = 1 / 60;
  const last = segs[segs.length - 1];
  const end = last.t0 + last.dur + 0.35;
  for (let t = 0; t < end; t += dt) {
    const meant = t - lagSec;
    const i = segs.findIndex((s) => meant >= s.t0 && meant <= s.t0 + s.dur);
    const target = i >= 0 ? targetMidiAt(segs, meant) : null;
    scorer.feed(t, target === null ? null : midiToFreq(sung(i, target)), dt);
  }
}

const byId = (id: string) => EXERCISES.find((e) => e.id === id)!;
const FAST = ["agility-run", "n-hum-scale", "gug-staccato"] as const;

describe("onset grace", () => {
  it("is sized from the input lag the score-lag model does not carry", () => {
    expect(ONSET_GRACE_SEC).toBe(UNMODELLED_INPUT_LAG_SEC);
    expect(ONSET_GRACE_SEC).toBeCloseTo(MEASURED_ONSET_LAG_SEC - MODELLED_ONSET_LAG_SEC, 9);
    expect(ONSET_GRACE_SEC).toBe(0.105);
  });

  it("covers the residual on a fast note but never more than half of one", () => {
    expect(onsetGraceFor(0.25)).toBe(ONSET_GRACE_SEC);
    // The runs at 1.25x: 0.2 s notes, so the grace stops at half.
    expect(onsetGraceFor(0.2)).toBeCloseTo(0.2 * ONSET_GRACE_MAX_SHARE, 9);
    expect(onsetGraceFor(3.5)).toBe(ONSET_GRACE_SEC);
    expect(onsetGraceFor(0)).toBe(0);
    expect(onsetGraceFor(0.25, 0)).toBe(0);
  });

  it("scores a fast run sung ~100 ms late as sung, where it used to lose two fifths of every note", () => {
    for (const id of FAST) {
      for (const tempo of [0.75, 1, 1.25]) {
        const { segs } = buildSegments(byId(id), 52, tempo);
        const now = createRepScorer(segs);
        const before = createRepScorer(segs, { onsetGraceSec: 0 });
        feedLagged(now, segs, 0.1);
        feedLagged(before, segs, 0.1);
        const label = `${id} at ${tempo}x`;
        if (tempo >= 1) expect(before.result(52)!.score, label).toBeLessThanOrEqual(70);
        expect(now.result(52)!.score - before.result(52)!.score, label).toBeGreaterThanOrEqual(20);
        expect(now.result(52)!.score, label).toBeGreaterThanOrEqual(90);
      }
    }
  });

  it("still fails a genuinely wrong note, and a run sung a semitone off", () => {
    for (const id of FAST) {
      const { segs } = buildSegments(byId(id), 52, 1);
      // The top note sung a whole tone high, the rest on pitch, all 100 ms late.
      const top = segs.reduce((best, s, i) => (s.startMidi > segs[best].startMidi ? i : best), 0);
      const scorer = createRepScorer(segs);
      feedLagged(scorer, segs, 0.1, (i, target) => (i === top ? target + 2 : target));
      const result = scorer.result(52)!;
      // Discrete notes: one NoteScore per segment, in order.
      expect(result.notes, id).toHaveLength(segs.length);
      expect(result.notes![top].hitSec, id).toBe(0);
      expect(result.notes![top].centsFrames, id).toBeGreaterThan(0);
      // Every other note was right, and scores as right.
      result.notes!.forEach((n, i) => {
        if (i !== top) expect(n.hitSec / n.possibleSec, `${id} note ${i}`).toBeGreaterThanOrEqual(0.9);
      });
      expect(result.score, id).toBeLessThan(100);

      // A semitone flat throughout. Not quite 0: where the scale steps down a
      // semitone, the previous note sung flat lands on the next target for an
      // instant, which is in tune and credited with or without the grace.
      const flat = createRepScorer(segs);
      feedLagged(flat, segs, 0.1, (_, target) => target - 1);
      expect(flat.result(52)!.score, id).toBeLessThanOrEqual(5);
      expect(flat.result(52)!.avgCentsErr, id).toBeGreaterThanOrEqual(95);
    }
  });

  it("leaves long notes essentially as they were", () => {
    for (const id of ["sustained-hold", "swell-and-fade"]) {
      const { segs } = buildSegments(byId(id), 52, 1);
      const now = createRepScorer(segs);
      const before = createRepScorer(segs, { onsetGraceSec: 0 });
      feedLagged(now, segs, 0.1);
      feedLagged(before, segs, 0.1);
      expect(Math.abs(now.result(52)!.score - before.result(52)!.score), id).toBeLessThanOrEqual(3);
    }
    // A 3.5 s hold loses 3% of its possible time to the grace.
    const { segs } = buildSegments(byId("sustained-hold"), 52, 1);
    const scorer = createRepScorer(segs);
    feedThroughout(scorer, segs, 0);
    const [note] = scorer.result(52)!.notes!;
    expect(note.possibleSec / segs[0].dur).toBeGreaterThanOrEqual(0.97);
    expect(scorer.result(52)!.score).toBe(100);
  });

  it("does not credit in-tune time inside the grace, so a half-sung fast note cannot score full", () => {
    // In tune for the first half of each note, three semitones off after:
    // before this rule the grace's in-tune frames topped every note up to 100.
    for (const [id, tempo] of [["agility-run", 1.25], ["agility-run", 1], ["gug-staccato", 1]] as const) {
      const { segs } = buildSegments(byId(id), 52, tempo);
      const scorer = createRepScorer(segs);
      const dt = 1 / 120;
      for (const seg of segs) {
        for (let t = seg.t0 + dt / 2; t < seg.t0 + seg.dur; t += dt) {
          const target = targetMidiAt(segs, t)!;
          const half = t - seg.t0 < seg.dur / 2;
          scorer.feed(t, midiToFreq(target + (half ? 0 : 3)), dt);
        }
      }
      expect(scorer.result(52)!.score, `${id} at ${tempo}x`).toBeLessThanOrEqual(60);
    }
  });

  it("drops an off-target frame inside the grace without counting it as sung", () => {
    const { segs } = buildSegments(fiveNote, 52, 1);
    const scorer = createRepScorer(segs);
    // The previous note still arriving: two semitones off, inside the grace.
    scorer.feed(segs[1].t0 + 0.02, midiToFreq(segs[0].startMidi), 1 / 60);
    expect(scorer.voicedFrames).toBe(0);
    // The same frame past the grace is a wrong note, and counts.
    scorer.feed(segs[1].t0 + ONSET_GRACE_SEC + 0.02, midiToFreq(segs[0].startMidi), 1 / 60);
    expect(scorer.voicedFrames).toBe(1);
  });

  it("fills the note lane to the whole note when its possible time is held", () => {
    const { segs } = buildSegments(byId("agility-run"), 52, 1);
    const scorer = createRepScorer(segs);
    feedLagged(scorer, segs, 0.1);
    scorer.hitSec().forEach((sec, i) => {
      expect(sec, `note ${i}`).toBeGreaterThanOrEqual(segs[i].dur * 0.9);
      expect(sec, `note ${i}`).toBeLessThanOrEqual(segs[i].dur + 1e-9);
    });
  });
});

describe("glide scoring", () => {
  const SIRENS = ["ng-siren-fifth", "octave-siren", "high-siren-tenth"] as const;
  const smoothstep = (x: number) => x * x * (3 - 2 * x);

  /**
   * A siren sung with exact endpoints along `shape` (0..1 → 0..1 of the
   * slide), reported `lagSec` late, silent between the two glides.
   */
  function feedGlide(
    scorer: ReturnType<typeof createRepScorer>,
    segs: Segment[],
    shape: (x: number) => number,
    lagSec = 0,
  ) {
    const dt = 1 / 60;
    const last = segs[segs.length - 1];
    for (let t = 0; t < last.t0 + last.dur + 0.35; t += dt) {
      const meant = t - lagSec;
      const seg = segs.find((s) => meant >= s.t0 && meant <= s.t0 + s.dur);
      if (!seg) {
        scorer.feed(t, null, dt);
        continue;
      }
      const x = Math.min(1, Math.max(0, (meant - seg.t0) / seg.dur));
      const midi = seg.startMidi + (seg.endMidi - seg.startMidi) * shape(x);
      scorer.feed(t, midiToFreq(midi), dt);
    }
  }

  it("scores a natural, eased siren with exact endpoints as sung", () => {
    // Scored against the bare ramp this read 24 on the octave siren and 17 on
    // the tenth: the drill was rewarding a straight line, not a smooth slide.
    for (const id of SIRENS) {
      for (const tempo of [0.75, 1, 1.25]) {
        const { segs } = buildSegments(byId(id), 52, tempo);
        const scorer = createRepScorer(segs);
        feedGlide(scorer, segs, smoothstep);
        expect(scorer.result(52)!.score, `${id} at ${tempo}x`).toBeGreaterThanOrEqual(90);
      }
    }
  });

  it("scores a straight slide sung ~100 ms late as sung", () => {
    for (const id of SIRENS) {
      const { segs } = buildSegments(byId(id), 52, 1);
      const scorer = createRepScorer(segs);
      feedGlide(scorer, segs, (x) => x, UNMODELLED_INPUT_LAG_SEC);
      expect(scorer.result(52)!.score, id).toBeGreaterThanOrEqual(90);
    }
  });

  it("still scores a slide that never leaves the start pitch low", () => {
    for (const id of ["octave-siren", "high-siren-tenth"]) {
      const { segs } = buildSegments(byId(id), 52, 1);
      const scorer = createRepScorer(segs);
      feedGlide(scorer, segs, () => 0);
      expect(scorer.result(52)!.score, id).toBeLessThan(30);
    }
  });

  it("still scores a step in place of a slide low", () => {
    for (const id of ["octave-siren", "high-siren-tenth"]) {
      const { segs } = buildSegments(byId(id), 52, 1);
      const scorer = createRepScorer(segs);
      feedGlide(scorer, segs, (x) => (x < 0.5 ? 0 : 1));
      expect(scorer.result(52)!.score, id).toBeLessThan(50);
    }
  });

  it("publishes a slack that is a small share of the glide", () => {
    expect(GLIDE_TIME_SLACK).toBeGreaterThan(0);
    expect(GLIDE_TIME_SLACK).toBeLessThanOrEqual(0.15);
  });

  it("gives the live readout the reference the scorer uses", () => {
    // Plain notes measure against the note; gaps have nothing to measure.
    const plain = buildSegments(fiveNote, 52, 1).segs;
    expect(referenceMidiAt(plain, plain[1].t0 + 0.2, 60)).toBe(plain[1].startMidi);
    expect(referenceMidiAt(plain, plain[1].t0 - 0.01, 60)).toBeNull();

    // A glide measures against the stretch of ramp around the frame: a pitch
    // inside that stretch reads 0 cents off, one outside it reads its distance
    // to the near end, and the stretch is held at the glide's endpoints.
    const { segs } = buildSegments(byId("octave-siren"), 52, 1);
    const up = segs[0];
    const mid = up.t0 + up.dur / 2; // the bare ramp reads 58 here
    const w = GLIDE_TIME_SLACK * up.dur;
    const span = up.endMidi - up.startMidi;
    const lo = 58 - (span * (w + ONSET_GRACE_SEC)) / up.dur;
    const hi = 58 + (span * w) / up.dur;
    expect(referenceMidiAt(segs, mid, 57.2)).toBeCloseTo(57.2, 9);
    expect(referenceMidiAt(segs, mid, 50)).toBeCloseTo(lo, 9);
    expect(referenceMidiAt(segs, mid, 70)).toBeCloseTo(hi, 9);
    expect(referenceMidiAt(segs, up.t0, 49)).toBe(52);

    // And the scorer credits a frame exactly when the readout would call it
    // within tolerance (both sides of the window, in and out).
    const verdicts = [55.5, 56, 57.2, 59.6, 61].map((sung) => {
      const scorer = createRepScorer(segs);
      scorer.feed(mid, midiToFreq(sung), 0.1);
      const inTune = Math.abs(sung - referenceMidiAt(segs, mid, sung)!) * 100 <= 50;
      expect(scorer.hitSec()[0] > 0, `sung ${sung}`).toBe(inTune);
      return inTune;
    });
    expect(verdicts).toEqual([false, true, true, true, false]);
  });
});

describe("octave-agnostic scoring", () => {
  it("folds a pitch to the octave nearest the target", () => {
    expect(foldToOctaveOf(64, 52)).toBe(52);
    expect(foldToOctaveOf(40.3, 52)).toBeCloseTo(52.3, 9);
    expect(foldToOctaveOf(57.5, 52)).toBeCloseTo(57.5, 9);
    expect(foldToOctaveOf(58.5, 52)).toBeCloseTo(46.5, 9);
    expect(foldToOctaveOf(52, 52)).toBe(52);
  });

  it("counts a take an octave up or down only when told to", () => {
    for (const octaves of [1, -1, 2]) {
      const { segs } = buildSegments(fiveNote, 52, 1);
      const strict = createRepScorer(segs);
      const either = createRepScorer(segs, { octaveAgnostic: true });
      feedThroughout(strict, segs, 12 * octaves);
      feedThroughout(either, segs, 12 * octaves);
      expect(strict.result(52)!.score, `${octaves} octaves`).toBe(0);
      expect(either.result(52)!.score, `${octaves} octaves`).toBe(100);
      expect(either.result(52)!.avgCentsErr, `${octaves} octaves`).toBe(0);
    }
  });

  it("still fails a wrong note in the other octave", () => {
    const { segs } = buildSegments(fiveNote, 52, 1);
    const scorer = createRepScorer(segs, { octaveAgnostic: true });
    // An octave up and 60 cents sharp: wrong in any octave.
    feedThroughout(scorer, segs, 12.6);
    expect(scorer.result(52)!.score).toBe(0);
    const tritone = createRepScorer(segs, { octaveAgnostic: true });
    feedThroughout(tritone, segs, 6);
    expect(tritone.result(52)!.score).toBe(0);
  });

  it("files the per-note analytics under the octave actually sung", () => {
    const { segs } = buildSegments(fiveNote, 52, 1);
    const up = createRepScorer(segs, { octaveAgnostic: true });
    feedThroughout(up, segs, 12);
    expect(up.result(52)!.notes!.map((n) => n.midi)).toEqual(segs.map((s) => s.startMidi + 12));
    // The rep's root reads in the same octave, so the summary never names
    // the rung an octave away from the notes listed under it.
    expect(up.result(52)!.root).toBe(64);
    const asWritten = createRepScorer(segs, { octaveAgnostic: true });
    feedThroughout(asWritten, segs, 0);
    expect(asWritten.result(52)!.notes!.map((n) => n.midi)).toEqual(segs.map((s) => s.startMidi));
    expect(asWritten.result(52)!.root).toBe(52);
    const down = createRepScorer(segs, { octaveAgnostic: true });
    feedThroughout(down, segs, -12);
    expect(down.result(52)!.root).toBe(40);
    // Exact-octave scoring never moves a note or the root.
    const strict = createRepScorer(segs);
    feedThroughout(strict, segs, 12);
    expect(strict.result(52)!.notes!.map((n) => n.midi)).toEqual(segs.map((s) => s.startMidi));
    expect(strict.result(52)!.root).toBe(52);
  });

  it("counts a siren an octave up when told to", () => {
    const { segs } = buildSegments(byId("octave-siren"), 52, 1);
    const either = createRepScorer(segs, { octaveAgnostic: true });
    feedThroughout(either, segs, 12);
    expect(either.result(52)!.score).toBeGreaterThanOrEqual(98);
  });
});
