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
  ONSET_GRACE_MAX_SHARE,
  ONSET_GRACE_SEC,
  createRepScorer,
  onsetGraceFor,
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
