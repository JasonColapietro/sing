import { describe, expect, it } from "vitest";
import { midiToFreq } from "@/lib/audio/notes";
import { EXERCISES, buildSegments, type Segment } from "./exercises";
import { targetMidiAt } from "./lib";
import { createRepScorer } from "./scoring";

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
    // half its duration: 52 and 59 each collect one half from each segment.
    const halves = segs.reduce((a, s) => a + s.dur / 2, 0);
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
