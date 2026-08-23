import { describe, expect, it } from "vitest";
import { pitchReportLagSec, scoreLagSec } from "./latency";

describe("pitchReportLagSec", () => {
  it("reports ~68 ms for the analyser and median window every room opens", () => {
    // 4096/48000/2 = 42.7 ms of analyser centroid, plus 1.5 frames of median.
    expect(pitchReportLagSec(48000, 4096)).toBeCloseTo(0.0677, 3);
  });

  it("grows when the sample rate falls, because the same frame spans more time", () => {
    expect(pitchReportLagSec(44100, 4096)).toBeGreaterThan(
      pitchReportLagSec(48000, 4096),
    );
  });

  it("shrinks by half the analyser window when the frame halves", () => {
    const at4096 = pitchReportLagSec(48000, 4096);
    const at2048 = pitchReportLagSec(48000, 2048);
    // The median term is unchanged; only the analyser half-window halves,
    // which at 48 kHz is 4096/48000/4 ≈ 21 ms.
    expect(at4096 - at2048).toBeCloseTo(4096 / 48000 / 4, 4);
  });

  it("returns 0 rather than Infinity or NaN before the context has real numbers", () => {
    expect(pitchReportLagSec(0, 4096)).toBe(0);
    expect(pitchReportLagSec(48000, 0)).toBe(0);
  });
});

describe("scoreLagSec", () => {
  it("adds the two lags — a guide heard late and a voice read late compound", () => {
    expect(scoreLagSec(0.068, 0.2)).toBeCloseTo(0.268, 6);
  });

  it("clamps a nonsense reading at zero instead of rewinding past the start", () => {
    expect(scoreLagSec(-1, 0.2)).toBeCloseTo(0.2, 6);
    expect(scoreLagSec(0.068, -5)).toBeCloseTo(0.068, 6);
  });
});
