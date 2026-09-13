import { describe, expect, it } from "vitest";
import {
  NOMINAL_FRAME_SEC,
  centsBetween,
  frameIntervalSec,
  isVoiced,
  traceFromMidiPoints,
} from "./f0-trace";

describe("isVoiced", () => {
  it("accepts a pitch and rejects everything that is not one", () => {
    expect(isVoiced({ t: 0, f0: 220 })).toBe(true);
    expect(isVoiced({ t: 0, f0: null })).toBe(false);
    expect(isVoiced({ t: 0, f0: 0 })).toBe(false);
    expect(isVoiced({ t: 0, f0: -220 })).toBe(false);
    expect(isVoiced({ t: 0, f0: Number.NaN })).toBe(false);
    expect(isVoiced({ t: 0, f0: Number.POSITIVE_INFINITY })).toBe(false);
  });
});

describe("frameIntervalSec", () => {
  it("reads the interval of an even trace", () => {
    const frames = Array.from({ length: 30 }, (_, i) => ({
      t: i / 60,
      f0: 220,
    }));
    expect(frameIntervalSec(frames)).toBeCloseTo(1 / 60, 9);
  });

  it("ignores one long gap instead of spreading it over every frame", () => {
    // A dropped animation frame or a GC pause. The mean would read 1/30 of a
    // second as the frame period of a 60 fps trace.
    const frames = Array.from({ length: 30 }, (_, i) => ({
      t: i / 60 + (i > 15 ? 0.5 : 0),
      f0: 220,
    }));
    expect(frameIntervalSec(frames)).toBeCloseTo(1 / 60, 9);
  });

  it("falls back to the nominal rate when there is nothing to measure", () => {
    expect(frameIntervalSec([])).toBe(NOMINAL_FRAME_SEC);
    expect(frameIntervalSec([{ t: 0, f0: 220 }])).toBe(NOMINAL_FRAME_SEC);
  });
});

describe("centsBetween", () => {
  it("is 1200 for an octave and 100 for a semitone, signed", () => {
    expect(centsBetween(880, 440)).toBeCloseTo(1200, 6);
    expect(centsBetween(220, 440)).toBeCloseTo(-1200, 6);
    expect(centsBetween(440 * Math.pow(2, 1 / 12), 440)).toBeCloseTo(100, 6);
  });

  it("returns 0 rather than NaN for a frequency that is not one", () => {
    expect(centsBetween(0, 440)).toBe(0);
    expect(centsBetween(440, 0)).toBe(0);
  });
});

describe("traceFromMidiPoints", () => {
  it("converts the offline take trace without re-estimating anything", () => {
    const trace = traceFromMidiPoints([
      { t: 0, midi: 69 },
      { t: 1 / 60, midi: null },
      { t: 2 / 60, midi: 81 },
    ]);
    expect(trace[0].f0).toBeCloseTo(440, 6);
    expect(trace[1].f0).toBeNull();
    expect(trace[2].f0).toBeCloseTo(880, 6);
  });
});
