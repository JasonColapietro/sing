import { describe, expect, it } from "vitest";
import { type F0Frame } from "./f0-trace";
import {
  VIBRATO_MAX_RATE_HZ,
  VIBRATO_MIN_EXTENT_CENTS,
  VIBRATO_ONSET_SKIP_SEC,
  analyzeVibrato,
} from "./vibrato";

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

/** A held note whose pitch swings `halfExtentCents` either side of centre. */
function vibratoNote({
  durationSec = 3,
  centreHz = 440,
  rateHz = 5.5,
  halfExtentCents = 50,
  driftCentsPerSec = 0,
}: {
  durationSec?: number;
  centreHz?: number;
  rateHz?: number;
  halfExtentCents?: number;
  driftCentsPerSec?: number;
} = {}): F0Frame[] {
  return buildTrace(durationSec, (t) => {
    const cents =
      halfExtentCents * Math.sin(2 * Math.PI * rateHz * t) +
      driftCentsPerSec * t;
    return centreHz * Math.pow(2, cents / 1200);
  });
}

describe("analyzeVibrato", () => {
  it("recovers the rate and the peak-to-peak extent of a known modulation", () => {
    const result = analyzeVibrato(
      vibratoNote({ rateHz: 5.5, halfExtentCents: 50 }),
    );
    expect(result.present).toBe(true);
    expect(result.rateHz).toBeCloseTo(5.5, 0);
    expect(result.rateHz as number).toBeGreaterThan(5.3);
    expect(result.rateHz as number).toBeLessThan(5.7);
    // Extent is the full swing: 50 cents either side is 100 peak to peak.
    expect(result.extentCents as number).toBeGreaterThan(90);
    expect(result.extentCents as number).toBeLessThan(110);
  });

  it("reports rate and extent independently", () => {
    // Same rate, half the width: only extent may move.
    const wide = analyzeVibrato(vibratoNote({ rateHz: 6, halfExtentCents: 50 }));
    const narrow = analyzeVibrato(
      vibratoNote({ rateHz: 6, halfExtentCents: 25 }),
    );
    expect(wide.rateHz as number).toBeCloseTo(narrow.rateHz as number, 1);
    expect((wide.extentCents as number) / (narrow.extentCents as number)).toBeCloseTo(
      2,
      0,
    );

    // Same width, faster: only rate may move.
    const slow = analyzeVibrato(vibratoNote({ rateHz: 4.5, halfExtentCents: 40 }));
    const fast = analyzeVibrato(vibratoNote({ rateHz: 7.5, halfExtentCents: 40 }));
    expect(slow.rateHz as number).toBeLessThan(5);
    expect(fast.rateHz as number).toBeGreaterThan(7);
    expect(slow.extentCents as number).toBeCloseTo(fast.extentCents as number, -1);
  });

  it("reads the same extent an octave up, because cents are an interval", () => {
    const low = analyzeVibrato(vibratoNote({ centreHz: 220 }));
    const high = analyzeVibrato(vibratoNote({ centreHz: 440 }));
    expect(low.extentCents as number).toBeCloseTo(high.extentCents as number, 0);
    expect(low.rateHz as number).toBeCloseTo(high.rateHz as number, 1);
  });

  it("reports no vibrato on a straight sustained tone", () => {
    const result = analyzeVibrato(buildTrace(3, () => 440));
    expect(result.present).toBe(false);
    expect(result.reason).toBe("too-narrow");
  });

  it("reports no vibrato on a straight tone carrying the detector's own jitter", () => {
    // Deterministic few-cent noise, which is what a real held note looks like.
    let seed = 7;
    const rand = () => {
      seed = (seed * 1664525 + 1013904223) % 4294967296;
      return (seed / 4294967296) * 2 - 1;
    };
    const result = analyzeVibrato(
      buildTrace(3, () => 440 * Math.pow(2, (rand() * 4) / 1200)),
    );
    expect(result.present).toBe(false);
  });

  it("does not read a slide as vibrato", () => {
    // A whole tone of drift across three seconds and no modulation at all.
    const result = analyzeVibrato(
      buildTrace(3, (t) => 440 * Math.pow(2, (t * 200) / 1200)),
    );
    expect(result.present).toBe(false);
  });

  it("keeps its rate and extent when the note also drifts", () => {
    // The drift is removed, the modulation survives it.
    const result = analyzeVibrato(
      vibratoNote({ rateHz: 6, halfExtentCents: 50, driftCentsPerSec: 60 }),
    );
    expect(result.present).toBe(true);
    expect(result.rateHz as number).toBeGreaterThan(5.7);
    expect(result.rateHz as number).toBeLessThan(6.3);
    expect(result.extentCents as number).toBeGreaterThan(88);
    expect(result.extentCents as number).toBeLessThan(112);
  });

  it("does not read a wobble at the start of a note as vibrato", () => {
    // A scooped entry: 150 cents of overshoot that decays inside the onset
    // window, then a straight tone. Counting the entry would report vibrato.
    const result = analyzeVibrato(
      buildTrace(3, (t) => {
        const scoop =
          t < VIBRATO_ONSET_SKIP_SEC
            ? -150 * (1 - t / VIBRATO_ONSET_SKIP_SEC)
            : 0;
        return 440 * Math.pow(2, scoop / 1200);
      }),
    );
    expect(result.present).toBe(false);
    expect(result.onsetSettleCents as number).toBeGreaterThan(100);
  });

  it("reports the onset excursion as its own number, outside the extent", () => {
    const result = analyzeVibrato(
      buildTrace(3, (t) => {
        const scoop =
          t < VIBRATO_ONSET_SKIP_SEC
            ? -200 * (1 - t / VIBRATO_ONSET_SKIP_SEC)
            : 0;
        const wobble = t >= VIBRATO_ONSET_SKIP_SEC ? 50 * Math.sin(2 * Math.PI * 6 * t) : 0;
        return 440 * Math.pow(2, (scoop + wobble) / 1200);
      }),
    );
    expect(result.present).toBe(true);
    expect(result.onsetSettleCents as number).toBeGreaterThan(150);
    // The 200-cent entry is nowhere in the extent, which is the modulation's.
    expect(result.extentCents as number).toBeLessThan(120);
    expect(result.onsetSkippedSec).toBeCloseTo(VIBRATO_ONSET_SKIP_SEC, 1);
    expect(result.startSec as number).toBeGreaterThanOrEqual(
      VIBRATO_ONSET_SKIP_SEC,
    );
  });

  it("rejects a modulation too slow to be vibrato", () => {
    const result = analyzeVibrato(
      vibratoNote({ rateHz: 1.5, halfExtentCents: 60, durationSec: 4 }),
    );
    expect(result.present).toBe(false);
  });

  it("rejects a modulation narrower than the reporting floor", () => {
    const result = analyzeVibrato(
      vibratoNote({ rateHz: 6, halfExtentCents: VIBRATO_MIN_EXTENT_CENTS / 4 }),
    );
    expect(result.present).toBe(false);
    expect(result.reason).toBe("too-narrow");
  });

  it("refuses to answer from a note too short to contain several cycles", () => {
    const result = analyzeVibrato(vibratoNote({ durationSec: 0.8 }));
    expect(result.present).toBe(false);
    expect(result.reason).toBe("too-short");
  });

  it("measures the longest held note rather than concatenating phrases", () => {
    // Two seconds of straight tone, a breath, then three seconds of vibrato.
    // Joining them would put a discontinuity in the middle of the contour.
    const frames = [
      ...buildTrace(2, () => 330),
      ...buildTrace(0.4, () => null).map((f) => ({ ...f, t: f.t + 2 })),
      ...vibratoNote({ durationSec: 3, rateHz: 6 }).map((f) => ({
        ...f,
        t: f.t + 2.4,
      })),
    ];
    const result = analyzeVibrato(frames);
    expect(result.present).toBe(true);
    expect(result.startSec as number).toBeGreaterThan(2.4);
    expect(result.rateHz as number).toBeCloseTo(6, 0);
  });

  it("refuses a trace too coarse to carry the top of the band", () => {
    // The offline take pass hops 2048 samples, about 23 frames a second at
    // 48 kHz. A 9 Hz modulation is two and a half frames a cycle there, so a
    // rate found in such a trace would be an artefact of the band it was given.
    const coarse = analyzeVibrato(
      vibratoNote({ durationSec: 3, rateHz: 5, halfExtentCents: 50 }).filter(
        (_, i) => i % 3 === 0,
      ),
    );
    expect(coarse.present).toBe(false);
    expect(coarse.reason).toBe("frame-rate-too-low");
    expect(coarse.maxReportableRateHz).toBeLessThan(VIBRATO_MAX_RATE_HZ);
  });

  it("names the ceiling its frame rate supports when it does answer", () => {
    const result = analyzeVibrato(vibratoNote({ rateHz: 6 }));
    expect(result.present).toBe(true);
    expect(result.maxReportableRateHz).toBeGreaterThanOrEqual(
      VIBRATO_MAX_RATE_HZ,
    );
  });

  it("answers for a take with nothing voiced in it instead of throwing", () => {
    const result = analyzeVibrato(buildTrace(3, () => null));
    expect(result.present).toBe(false);
    expect(result.reason).toBe("no-voiced-run");
    expect(result.rateHz).toBeNull();
    expect(result.extentCents).toBeNull();
    expect(analyzeVibrato([]).present).toBe(false);
  });
});
