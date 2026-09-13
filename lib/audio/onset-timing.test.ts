import { describe, expect, it } from "vitest";
import { type F0Frame } from "./f0-trace";
import { pitchReportLagSec, scoreLagSec } from "./latency";
import {
  ONSET_RESOLUTION_MS,
  type OnsetLags,
  detectOnsets,
  onsetTimingErrors,
  signedOnsetErrorMs,
} from "./onset-timing";

const FPS = 60;

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

/**
 * A trace of notes, each sounding for `noteSec` from its start time and silent
 * afterwards. Times are in the analysis timeline, so a caller that wants to
 * model the lag adds it here.
 */
function sungNotes(
  notes: Array<{ startSec: number; f0: number }>,
  { noteSec = 0.4, totalSec = 0 } = {},
): F0Frame[] {
  const last = notes.reduce(
    (end, note) => Math.max(end, note.startSec + noteSec),
    0,
  );
  return buildTrace(Math.max(totalSec, last + 0.2), (t) => {
    for (const note of notes) {
      if (t >= note.startSec && t < note.startSec + noteSec) return note.f0;
    }
    return null;
  });
}

/** The lags a room at 48 kHz with wired output actually reports. */
const WIRED: OnsetLags = {
  pitchLag: pitchReportLagSec(48000, 4096),
  outputLag: 0.005,
};

/** Bluetooth, where the correction is larger than the gap between beats. */
const BLUETOOTH: OnsetLags = {
  pitchLag: pitchReportLagSec(48000, 4096),
  outputLag: 0.22,
};

/**
 * An onset can only be placed on a frame, so a measured error agrees with the
 * one built into the signal to within the resolution the module publishes
 * rather than exactly. Asserting tighter than `ONSET_RESOLUTION_MS` would be
 * asserting something the measurement does not claim.
 */
function expectErrorNear(actual: number | null, expected: number): void {
  expect(actual).not.toBeNull();
  expect(Math.abs((actual as number) - expected)).toBeLessThanOrEqual(
    ONSET_RESOLUTION_MS,
  );
}

describe("detectOnsets", () => {
  it("finds the voice arriving after silence", () => {
    const onsets = detectOnsets(
      sungNotes([
        { startSec: 0.5, f0: 220 },
        { startSec: 1.5, f0: 220 },
      ]),
    );
    expect(onsets).toHaveLength(2);
    expect(onsets[0].tSec).toBeCloseTo(0.5, 2);
    expect(onsets[1].tSec).toBeCloseTo(1.5, 2);
    expect(onsets.every((onset) => onset.kind === "voiced-entry")).toBe(true);
  });

  it("finds a new note inside a legato phrase, where the voice never stops", () => {
    // A4 to C5 at one second, continuously voiced throughout. A detector that
    // only watched for silence would report one onset for a two-note phrase.
    const legato = buildTrace(2, (t) => (t < 1 ? 440 : 523.25));
    const onsets = detectOnsets(legato);
    expect(onsets).toHaveLength(2);
    expect(onsets[0].kind).toBe("voiced-entry");
    expect(onsets[1].kind).toBe("pitch-step");
    expect(onsets[1].tSec).toBeCloseTo(1, 1);
  });

  it("does not report an onset for a held note's vibrato", () => {
    const vibrato = buildTrace(
      3,
      (t) => 440 * Math.pow(2, (50 * Math.sin(2 * Math.PI * 6 * t)) / 1200),
    );
    expect(detectOnsets(vibrato)).toHaveLength(1);
  });

  it("does not report an onset on every frame of a slide", () => {
    // An octave in one second crosses twelve semitones. The refractory period
    // is what keeps that from reading as a frame-by-frame stutter of attacks.
    const slide = buildTrace(1, (t) => 220 * Math.pow(2, t));
    const onsets = detectOnsets(slide);
    expect(onsets.length).toBeLessThanOrEqual(11);
    expect(onsets[0].kind).toBe("voiced-entry");
  });

  it("does not invent an onset from a single dropped frame mid-note", () => {
    const frames = buildTrace(2, () => 220);
    frames[60].f0 = null;
    expect(detectOnsets(frames)).toHaveLength(1);
  });

  it("returns nothing for a silent take", () => {
    expect(detectOnsets(buildTrace(2, () => null))).toEqual([]);
    expect(detectOnsets([])).toEqual([]);
  });
});

describe("signedOnsetErrorMs", () => {
  it("reports zero for a singer who was on the beat, once the lags are removed", () => {
    // The singer sang exactly on the beat at 1.0 s. The trace therefore shows
    // the onset one correction later than that.
    const correction = scoreLagSec(WIRED.pitchLag, WIRED.outputLag);
    const error = signedOnsetErrorMs(1 + correction, 1, WIRED);
    expect(error as number).toBeCloseTo(0, 6);
  });

  it("is negative for early and positive for late", () => {
    const correction = scoreLagSec(WIRED.pitchLag, WIRED.outputLag);
    expect(signedOnsetErrorMs(1 + correction - 0.05, 1, WIRED) as number).toBeCloseTo(
      -50,
      6,
    );
    expect(signedOnsetErrorMs(1 + correction + 0.05, 1, WIRED) as number).toBeCloseTo(
      50,
      6,
    );
  });

  it("is the whole correction wrong when the correction is skipped", () => {
    // This is the number the uncorrected detector would have shipped: a singer
    // dead on the beat reported as 290 ms late over Bluetooth, which is most of
    // a beat at any tempo a lesson uses.
    const correction = scoreLagSec(BLUETOOTH.pitchLag, BLUETOOTH.outputLag);
    const uncorrected = (1 + correction - 1) * 1000;
    expect(uncorrected).toBeGreaterThan(280);
    expect(signedOnsetErrorMs(1 + correction, 1, BLUETOOTH) as number).toBeCloseTo(
      0,
      6,
    );
  });

  it("refuses to answer without the lags rather than answering late", () => {
    expect(
      signedOnsetErrorMs(1, 1, { pitchLag: Number.NaN, outputLag: 0 }),
    ).toBeNull();
    expect(
      signedOnsetErrorMs(1, 1, {
        pitchLag: 0.068,
        outputLag: Number.POSITIVE_INFINITY,
      }),
    ).toBeNull();
    expect(signedOnsetErrorMs(Number.NaN, 1, WIRED)).toBeNull();
  });
});

describe("onsetTimingErrors", () => {
  const targets = [1, 2, 3, 4];
  const correction = scoreLagSec(BLUETOOTH.pitchLag, BLUETOOTH.outputLag);

  it("recovers a known offset with the right sign", () => {
    // Every note sung 60 ms early, over Bluetooth, at a tempo whose beat gap is
    // shorter than the correction itself.
    const offsetSec = -0.06;
    const summary = onsetTimingErrors(
      sungNotes(
        targets.map((target) => ({
          startSec: target + offsetSec + correction,
          f0: 330,
        })),
      ),
      targets,
      BLUETOOTH,
    );
    expect(summary.missed).toBe(0);
    expect(summary.extra).toBe(0);
    for (const match of summary.matches) {
      expectErrorNear(match.errorMs, -60);
      expect(match.errorMs as number).toBeLessThan(0);
    }
    expectErrorNear(summary.meanErrorMs, -60);
    expectErrorNear(summary.meanAbsErrorMs, 60);
  });

  it("separates a singer with a bias from one who is merely scattered", () => {
    const offsets = [-0.07, -0.07, -0.07, -0.07];
    const scatter = [-0.07, 0.07, -0.07, 0.07];
    const build = (list: number[]) =>
      onsetTimingErrors(
        sungNotes(
          targets.map((target, i) => ({
            startSec: target + list[i] + correction,
            f0: 330,
          })),
        ),
        targets,
        BLUETOOTH,
      );
    const biased = build(offsets);
    const scattered = build(scatter);
    expectErrorNear(biased.meanErrorMs, -70);
    expectErrorNear(scattered.meanErrorMs, 0);
    // The unsigned figure cannot tell them apart, which is why it is not the
    // number this function reports on its own.
    expectErrorNear(biased.meanAbsErrorMs, scattered.meanAbsErrorMs as number);
  });

  it("attributes each onset to its own beat rather than to the one before", () => {
    // Uncorrected, each onset sits 290 ms past its beat and the nearest target
    // is the next one. Matching on corrected times is what prevents that.
    const summary = onsetTimingErrors(
      sungNotes(
        targets.map((target) => ({ startSec: target + correction, f0: 330 })),
      ),
      targets,
      BLUETOOTH,
    );
    for (const match of summary.matches) {
      expect(match.onset).not.toBeNull();
      expect(match.onset?.tSec as number).toBeCloseTo(
        match.targetSec + correction,
        1,
      );
      expect(Math.abs(match.errorMs as number)).toBeLessThan(
        ONSET_RESOLUTION_MS,
      );
    }
  });

  it("counts a beat nothing was sung near as missed rather than matching it", () => {
    const summary = onsetTimingErrors(
      sungNotes([
        { startSec: 1 + correction, f0: 330 },
        { startSec: 3 + correction, f0: 330 },
      ]),
      targets,
      BLUETOOTH,
    );
    expect(summary.missed).toBe(2);
    expect(summary.matches[1].errorMs).toBeNull();
    expect(summary.matches[3].errorMs).toBeNull();
    expectErrorNear(summary.meanErrorMs, 0);
  });

  it("counts a note sung where no beat was as extra", () => {
    const summary = onsetTimingErrors(
      sungNotes([
        ...targets.map((target) => ({ startSec: target + correction, f0: 330 })),
        { startSec: 2.5 + correction, f0: 330 },
      ]),
      targets,
      BLUETOOTH,
    );
    expect(summary.extra).toBe(1);
    expect(summary.missed).toBe(0);
  });

  it("gives no numbers at all when the correction is unavailable", () => {
    const summary = onsetTimingErrors(
      sungNotes(targets.map((target) => ({ startSec: target, f0: 330 }))),
      targets,
      { pitchLag: Number.NaN, outputLag: Number.NaN },
    );
    expect(summary.meanErrorMs).toBeNull();
    expect(summary.missed).toBe(targets.length);
  });
});
