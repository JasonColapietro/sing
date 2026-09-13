import { describe, expect, it } from "vitest";
import {
  H1H2_MIN_HARMONIC_SEPARATION_BINS,
  H1H2_MIN_PEAK_LEVEL_DB,
  H1H2_MIN_PEAK_PROMINENCE_DB,
  M1_M2_BOUNDARY_DB,
  M1_M2_DEADBAND_DB,
  M1_M2_FRAMES_TO_LATCH,
  classifyM1M2Boundary,
  latchM1M2Side,
  measureH1H2,
  type M1M2Result,
} from "./register-mechanism";

const SR = 48000;
const FFT = 4096;
const FLOOR_DB = -200;

/**
 * A synthetic analyser frame: a floor everywhere, with a narrow peak placed at
 * each given harmonic frequency and level.
 *
 * The peak is two bins wide either side of centre with a steep skirt, which is
 * enough to be found by a search window and to stand above its shoulders,
 * without pretending to be a real window transform of a real glottal source.
 */
function spectrum(
  peaks: Array<{ hz: number; db: number }>,
  { fftSize = FFT, sampleRate = SR, floorDb = FLOOR_DB } = {},
): Float32Array {
  const a = new Float32Array(fftSize / 2).fill(floorDb);
  for (const { hz, db } of peaks) {
    const centre = Math.round((hz * fftSize) / sampleRate);
    for (let offset = -2; offset <= 2; offset++) {
      const bin = centre + offset;
      if (bin < 0 || bin >= a.length) continue;
      const level = db - Math.abs(offset) * 12;
      if (level > a[bin]) a[bin] = level;
    }
  }
  return a;
}

/** Broadband noise at a flat level, deterministic so the test cannot flake. */
function noisy(level: number, { fftSize = FFT, seed = 7 } = {}): Float32Array {
  let s = seed;
  const rand = () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
  const a = new Float32Array(fftSize / 2);
  for (let i = 0; i < a.length; i++) a[i] = level + rand() * 2 - 1;
  return a;
}

describe("measureH1H2", () => {
  it("reads the difference between the two harmonic peaks it was given", () => {
    const freqDb = spectrum([
      { hz: 220, db: -20 },
      { hz: 440, db: -32 },
    ]);
    const r = measureH1H2({ freqDb, sampleRate: SR, fftSize: FFT, f0Hz: 220 });
    expect(r.confident).toBe(true);
    if (!r.confident) return;
    expect(r.h1Db).toBeCloseTo(-20, 6);
    expect(r.h2Db).toBeCloseTo(-32, 6);
    expect(r.h1MinusH2Db).toBeCloseTo(12, 6);
  });

  it("is invariant to a change in overall gain, because it is a dB difference", () => {
    const quiet = spectrum([
      { hz: 196, db: -55 },
      { hz: 392, db: -50 },
    ]);
    const loud = spectrum([
      { hz: 196, db: -25 },
      { hz: 392, db: -20 },
    ]);
    const a = measureH1H2({ freqDb: quiet, sampleRate: SR, fftSize: FFT, f0Hz: 196 });
    const b = measureH1H2({ freqDb: loud, sampleRate: SR, fftSize: FFT, f0Hz: 196 });
    expect(a.confident && b.confident).toBe(true);
    if (!a.confident || !b.confident) return;
    expect(a.h1MinusH2Db).toBeCloseTo(b.h1MinusH2Db, 6);
  });

  it("abstains on an unvoiced frame rather than reading its noise", () => {
    const freqDb = noisy(-40);
    const r = measureH1H2({
      freqDb,
      sampleRate: SR,
      fftSize: FFT,
      f0Hz: 220,
      voiced: false,
    });
    expect(r).toEqual({ confident: false, reason: "unvoiced" });
  });

  it("abstains when no usable f0 was supplied", () => {
    const freqDb = spectrum([
      { hz: 220, db: -20 },
      { hz: 440, db: -32 },
    ]);
    for (const f0Hz of [0, -220, NaN, Infinity]) {
      expect(measureH1H2({ freqDb, sampleRate: SR, fftSize: FFT, f0Hz })).toEqual({
        confident: false,
        reason: "no-f0",
      });
    }
  });

  it("abstains when f0 is too low for the window to separate H1 from H2", () => {
    // A 512-point window at 48 kHz has 93.75 Hz bins, so a 100 Hz voice puts H1
    // and H2 barely one bin apart and their amplitudes are not separable.
    const smallFft = 512;
    const freqDb = spectrum(
      [
        { hz: 100, db: -20 },
        { hz: 200, db: -30 },
      ],
      { fftSize: smallFft },
    );
    const r = measureH1H2({ freqDb, sampleRate: SR, fftSize: smallFft, f0Hz: 100 });
    expect(r).toEqual({ confident: false, reason: "f0-below-window-resolution" });
  });

  it("treats the resolution limit as exactly the exported bin count", () => {
    const binHz = SR / FFT;
    const justBelow = H1H2_MIN_HARMONIC_SEPARATION_BINS * binHz - 0.01;
    const r = measureH1H2({
      freqDb: spectrum([{ hz: justBelow, db: -20 }]),
      sampleRate: SR,
      fftSize: FFT,
      f0Hz: justBelow,
    });
    expect(r).toEqual({ confident: false, reason: "f0-below-window-resolution" });
  });

  it("abstains when the second harmonic would sit above Nyquist", () => {
    const f0Hz = SR / 4 + 100;
    const r = measureH1H2({
      freqDb: spectrum([{ hz: f0Hz, db: -20 }]),
      sampleRate: SR,
      fftSize: FFT,
      f0Hz,
    });
    expect(r).toEqual({ confident: false, reason: "second-harmonic-above-nyquist" });
  });

  it("abstains when the second harmonic is masked by noise", () => {
    // H1 is a clean peak; where H2 should be there is only broadband noise at
    // the same level as its surroundings, so nothing there is a harmonic.
    const freqDb = noisy(-45);
    const centre = Math.round((220 * FFT) / SR);
    for (let offset = -2; offset <= 2; offset++) {
      freqDb[centre + offset] = -20 - Math.abs(offset) * 12;
    }
    const r = measureH1H2({ freqDb, sampleRate: SR, fftSize: FFT, f0Hz: 220 });
    expect(r).toEqual({ confident: false, reason: "harmonic-not-resolved" });
  });

  it("abstains when a harmonic fails to stand above its own shoulders", () => {
    // Exactly one decibel short of the exported prominence floor, to pin the
    // abstention to that constant rather than to an arbitrary quiet peak.
    const shy = H1H2_MIN_PEAK_PROMINENCE_DB - 1;
    const freqDb = spectrum(
      [
        { hz: 220, db: -40 + shy },
        { hz: 440, db: -20 },
      ],
      { floorDb: -40 },
    );
    const r = measureH1H2({ freqDb, sampleRate: SR, fftSize: FFT, f0Hz: 220 });
    expect(r).toEqual({ confident: false, reason: "harmonic-not-resolved" });
  });

  it("abstains when a prominent peak is still below the absolute level floor", () => {
    // This peak stands well clear of its shoulders, so the prominence test
    // passes, but at 30 dB under the exported floor it is the analyser's own
    // noise and not a harmonic. Without the floor the module would happily
    // report an H1−H2 read off two pieces of silence.
    // The levels are written out rather than derived from the constant, so that
    // lowering the constant breaks this test instead of moving the signal down
    // with it.
    expect(H1H2_MIN_PEAK_LEVEL_DB).toBeGreaterThan(-120);
    const freqDb = spectrum(
      [
        { hz: 220, db: -120 },
        { hz: 440, db: -128 },
      ],
      { floorDb: -170 },
    );
    const r = measureH1H2({ freqDb, sampleRate: SR, fftSize: FFT, f0Hz: 220 });
    expect(r).toEqual({ confident: false, reason: "harmonic-not-resolved" });
  });

  it("abstains on silence, where there is no peak above the analyser floor", () => {
    const freqDb = new Float32Array(FFT / 2).fill(-Infinity);
    const r = measureH1H2({ freqDb, sampleRate: SR, fftSize: FFT, f0Hz: 220 });
    expect(r).toEqual({ confident: false, reason: "harmonic-not-resolved" });
  });
});

describe("the one boundary", () => {
  /** An H1−H2 reading of exactly `db`, skipping the spectrum. */
  function reading(db: number) {
    return { confident: true as const, h1Db: db, h2Db: 0, h1MinusH2Db: db };
  }

  it("puts a dominant fundamental on the heavier side", () => {
    const r = classifyM1M2Boundary(reading(M1_M2_BOUNDARY_DB - M1_M2_DEADBAND_DB - 4));
    expect(r).toEqual({
      confident: true,
      side: "heavierSide",
      h1MinusH2Db: M1_M2_BOUNDARY_DB - M1_M2_DEADBAND_DB - 4,
    });
  });

  it("puts a strongly dominant fundamental on the lighter side", () => {
    const db = M1_M2_BOUNDARY_DB + M1_M2_DEADBAND_DB + 6;
    const r = classifyM1M2Boundary(reading(db));
    expect(r).toEqual({ confident: true, side: "lighterSide", h1MinusH2Db: db });
  });

  it("abstains on the boundary itself instead of flipping on float noise", () => {
    const eps = Number.EPSILON * 64;
    for (const db of [
      M1_M2_BOUNDARY_DB,
      M1_M2_BOUNDARY_DB - eps,
      M1_M2_BOUNDARY_DB + eps,
      M1_M2_BOUNDARY_DB - M1_M2_DEADBAND_DB + eps,
      M1_M2_BOUNDARY_DB + M1_M2_DEADBAND_DB - eps,
    ]) {
      expect(classifyM1M2Boundary(reading(db))).toEqual({
        confident: false,
        reason: "within-boundary-deadband",
      });
    }
  });

  it("decides at the deadband edges, so the indeterminate band is closed", () => {
    expect(classifyM1M2Boundary(reading(M1_M2_BOUNDARY_DB - M1_M2_DEADBAND_DB))).toMatchObject({
      confident: true,
      side: "heavierSide",
    });
    expect(classifyM1M2Boundary(reading(M1_M2_BOUNDARY_DB + M1_M2_DEADBAND_DB))).toMatchObject({
      confident: true,
      side: "lighterSide",
    });
  });

  it("passes an abstention straight through rather than inventing a side", () => {
    expect(classifyM1M2Boundary({ confident: false, reason: "unvoiced" })).toEqual({
      confident: false,
      reason: "unvoiced",
    });
  });

  it("classifies a synthesised falsetto-like and modal-like spectrum apart", () => {
    // The only thing differing between these two frames is the level of H2
    // relative to H1, which is the whole of what the measurement reads.
    const modal = measureH1H2({
      freqDb: spectrum([
        { hz: 330, db: -22 },
        { hz: 660, db: -22 },
      ]),
      sampleRate: SR,
      fftSize: FFT,
      f0Hz: 330,
    });
    const light = measureH1H2({
      freqDb: spectrum([
        { hz: 330, db: -22 },
        { hz: 660, db: -48 },
      ]),
      sampleRate: SR,
      fftSize: FFT,
      f0Hz: 330,
    });
    expect(classifyM1M2Boundary(modal)).toMatchObject({ side: "heavierSide" });
    expect(classifyM1M2Boundary(light)).toMatchObject({ side: "lighterSide" });
  });
});

describe("latching", () => {
  const heavy: M1M2Result = { confident: true, side: "heavierSide", h1MinusH2Db: 0 };
  const light: M1M2Result = { confident: true, side: "lighterSide", h1MinusH2Db: 14 };
  const unsure: M1M2Result = { confident: false, reason: "within-boundary-deadband" };

  it("needs a full run of agreeing frames", () => {
    expect(latchM1M2Side([])).toBeNull();
    expect(latchM1M2Side(Array(M1_M2_FRAMES_TO_LATCH - 1).fill(heavy))).toBeNull();
    expect(latchM1M2Side(Array(M1_M2_FRAMES_TO_LATCH).fill(heavy))).toBe("heavierSide");
  });

  it("reads only the trailing run, so a switch is followed not averaged", () => {
    const frames = [
      ...Array<M1M2Result>(4).fill(heavy),
      ...Array<M1M2Result>(M1_M2_FRAMES_TO_LATCH).fill(light),
    ];
    expect(latchM1M2Side(frames)).toBe("lighterSide");
  });

  it("drops to null mid-switch rather than holding the previous side", () => {
    const frames = [...Array<M1M2Result>(5).fill(heavy), unsure];
    expect(latchM1M2Side(frames)).toBeNull();
  });

  it("drops to null when the trailing run disagrees with itself", () => {
    const frames = [heavy, heavy, light, heavy, light];
    expect(latchM1M2Side(frames)).toBeNull();
  });
});

/**
 * What these tests do not establish. Every spectrum above is synthetic: narrow
 * peaks on a flat floor, with H1 and H2 placed by hand at chosen levels. They
 * establish that the arithmetic, the resolution guards, the masking guard and
 * the deadband behave as written, and nothing whatsoever about real voices,
 * real microphones or real rooms. In particular the 6 dB boundary is unvalidated
 * against any recording, no singer was measured to choose it, and the tests
 * assert against the exported constant rather than against any ground truth, so
 * they would pass unchanged if the boundary were wrong.
 */
