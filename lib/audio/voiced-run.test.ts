import { describe, expect, it } from "vitest";
import { type F0Frame } from "./f0-trace";
import {
  MIN_VOICED_RUN_SEC,
  VOICED_BRIDGE_MAX_SEC,
  longestVoicedRunSec,
  summarizeVoicedRuns,
  voicedRuns,
} from "./voiced-run";

const FPS = 60;

/** A trace at the rate both capture paths run at, from a function of time. */
function buildTrace(
  durationSec: number,
  f0At: (t: number) => number | null,
  fps = FPS,
): F0Frame[] {
  const frames: F0Frame[] = [];
  const count = Math.round(durationSec * fps);
  for (let i = 0; i < count; i++) {
    const t = i / fps;
    frames.push({ t, f0: f0At(t) });
  }
  return frames;
}

/** Voiced everywhere except inside the given half-open windows of silence. */
function withSilences(
  durationSec: number,
  silences: Array<[number, number]>,
  f0 = 220,
): F0Frame[] {
  return buildTrace(durationSec, (t) =>
    silences.some(([from, to]) => t >= from && t < to) ? null : f0,
  );
}

describe("voicedRuns", () => {
  it("reports one run the length of a continuously voiced take", () => {
    const runs = voicedRuns(buildTrace(4, () => 220));
    expect(runs).toHaveLength(1);
    expect(runs[0].durationSec).toBeCloseTo(4, 2);
    expect(runs[0].startSec).toBeCloseTo(0, 6);
    expect(runs[0].bridgedGaps).toBe(0);
  });

  it("splits on a breath long enough to be one", () => {
    const runs = voicedRuns(withSilences(5, [[2, 2.4]]));
    expect(runs).toHaveLength(2);
    expect(runs[0].durationSec).toBeCloseTo(2, 2);
    expect(runs[1].durationSec).toBeCloseTo(2.6, 2);
  });

  it("spans a single dropped frame rather than reporting two runs", () => {
    // One frame of a four second note lost to a clarity dip. The singer did not
    // stop, and a detector artefact must not halve the number.
    const runs = voicedRuns(withSilences(4, [[2, 2 + 1 / FPS]]));
    expect(runs).toHaveLength(1);
    expect(runs[0].durationSec).toBeCloseTo(4, 2);
    expect(runs[0].bridgedGaps).toBe(1);
  });

  it("counts a bridged gap inside the run's duration, not as voiced time", () => {
    const summary = summarizeVoicedRuns(withSilences(4, [[2, 2 + 2 / FPS]]));
    expect(summary.runs).toHaveLength(1);
    expect(summary.longestSec).toBeCloseTo(4, 2);
    // Two frames of the four seconds were unvoiced, so voiced time is shorter
    // than the run that contains them.
    expect(summary.voicedSec).toBeCloseTo(4 - 2 / FPS, 2);
  });

  it("treats a gap past the bridging allowance as the voice having stopped", () => {
    const justUnder = voicedRuns(
      withSilences(4, [[2, 2 + VOICED_BRIDGE_MAX_SEC - 1 / FPS]]),
    );
    const justOver = voicedRuns(
      withSilences(4, [[2, 2 + VOICED_BRIDGE_MAX_SEC + 2 / FPS]]),
    );
    expect(justUnder).toHaveLength(1);
    expect(justOver).toHaveLength(2);
  });

  it("ignores a couple of stray voiced frames in a silent take", () => {
    const frames = withSilences(3, [[0, 3]]);
    frames[30].f0 = 220;
    frames[31].f0 = 220;
    expect(voicedRuns(frames)).toHaveLength(0);
    expect(2 / FPS).toBeLessThan(MIN_VOICED_RUN_SEC);
  });

  it("is indifferent to what pitch was sung, unlike a pitch-hit streak", () => {
    // Four seconds that wander two octaves. Every frame is voiced, so the run
    // is four seconds; a combo counter scored against a target would have reset
    // repeatedly over the same audio.
    const wandering = buildTrace(4, (t) => 110 * Math.pow(2, (t % 1) * 2));
    expect(longestVoicedRunSec(wandering)).toBeCloseTo(4, 2);
  });

  it("returns null for a take with nothing voiced in it", () => {
    expect(longestVoicedRunSec(buildTrace(3, () => null))).toBeNull();
    expect(longestVoicedRunSec([])).toBeNull();
  });

  it("discards nonsense pitches instead of counting them as voicing", () => {
    const frames: F0Frame[] = [
      { t: 0, f0: 0 },
      { t: 1 / FPS, f0: -220 },
      { t: 2 / FPS, f0: Number.NaN },
      { t: 3 / FPS, f0: Number.POSITIVE_INFINITY },
    ];
    expect(longestVoicedRunSec(frames)).toBeNull();
  });

  it("measures in seconds, so a slower trace of the same audio agrees", () => {
    const fast = longestVoicedRunSec(withSilences(4, [[2.5, 3]]));
    const slow = longestVoicedRunSec(
      buildTrace(4, (t) => (t >= 2.5 && t < 3 ? null : 220), 30),
    );
    expect(fast).toBeCloseTo(2.5, 1);
    expect(slow).toBeCloseTo(2.5, 1);
  });

  it("names the longest run rather than the first", () => {
    const summary = summarizeVoicedRuns(
      withSilences(6, [
        [1, 1.5],
        [4, 4.5],
      ]),
    );
    expect(summary.runs).toHaveLength(3);
    expect(summary.longest?.startSec).toBeCloseTo(1.5, 1);
    expect(summary.longestSec).toBeCloseTo(2.5, 1);
  });
});

describe("what the longest voiced run does not establish", () => {
  it("scores a crack in the middle of a siren as one unbroken run", () => {
    // A register break that stays voiced: the pitch lurches a fourth and comes
    // back, the folds having changed mechanism. Nothing here sees that, and the
    // run is the full length of the siren. This is the reason the number must
    // not be presented as the absence of a crack.
    const cracked = buildTrace(3, (t) => {
      const base = 220 * Math.pow(2, t / 3);
      return t > 1.5 && t < 1.6 ? base * 1.33 : base;
    });
    const summary = summarizeVoicedRuns(cracked);
    expect(summary.runs).toHaveLength(1);
    expect(summary.longestSec).toBeCloseTo(3, 2);
  });

  it("scores a clean siren with one quiet catch of breath as two runs", () => {
    const clean = buildTrace(3, (t) =>
      t >= 1.5 && t < 1.7 ? null : 220 * Math.pow(2, t / 3),
    );
    expect(voicedRuns(clean)).toHaveLength(2);
  });
});
