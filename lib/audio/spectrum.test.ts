import { describe, expect, it } from "vitest";
import {
  MAX_HZ,
  MIN_HZ,
  RING_HI_HZ,
  RING_LO_HZ,
  bandPower,
  bandRatio,
  binToHz,
  harmonics,
  heatColor,
  hzToBin,
  intensity,
  logPos,
  posToHz,
  ringRatio,
} from "./spectrum";

const SR = 48000;
const FFT = 4096;

/** A silent spectrum: the analyser's floor, not zeroes. */
function silence(): Float32Array {
  return new Float32Array(FFT / 2).fill(-Infinity);
}

/** A spectrum with `db` at every bin whose centre lands in [lo, hi), floor elsewhere. */
function tone(lo: number, hi: number, db = -20): Float32Array {
  const a = new Float32Array(FFT / 2).fill(-200);
  const first = Math.ceil(hzToBin(lo, SR, FFT));
  const last = Math.ceil(hzToBin(hi, SR, FFT)) - 1;
  for (let i = first; i <= last && i < a.length; i++) a[i] = db;
  return a;
}

describe("bin <-> Hz", () => {
  it("round-trips", () => {
    for (const hz of [80, 220, 440, 1000, 3000, 7900]) {
      expect(binToHz(hzToBin(hz, SR, FFT), SR, FFT)).toBeCloseTo(hz, 6);
    }
  });

  it("puts bin 0 at DC and the last bin at Nyquist", () => {
    expect(binToHz(0, SR, FFT)).toBe(0);
    expect(binToHz(FFT / 2, SR, FFT)).toBe(SR / 2);
  });
});

describe("log axis", () => {
  it("pins the boundaries", () => {
    expect(logPos(MIN_HZ)).toBeCloseTo(0, 10);
    expect(logPos(MAX_HZ)).toBeCloseTo(1, 10);
  });

  it("clamps outside the range instead of running off the canvas", () => {
    expect(logPos(10)).toBe(0);
    expect(logPos(20000)).toBe(1);
    expect(logPos(0)).toBe(0);
    expect(logPos(-5)).toBe(0);
  });

  it("puts an octave at a constant width anywhere on the axis", () => {
    const low = logPos(200) - logPos(100);
    const high = logPos(4000) - logPos(2000);
    expect(low).toBeCloseTo(high, 10);
  });

  it("round-trips through posToHz", () => {
    for (const hz of [MIN_HZ, 440, 3000, MAX_HZ]) {
      expect(posToHz(logPos(hz))).toBeCloseTo(hz, 6);
    }
  });
});

describe("bandPower", () => {
  it("is zero across a band with no content", () => {
    expect(bandPower(tone(1000, 1100), SR, FFT, 200, 400)).toBeCloseTo(0, 12);
  });

  it("tiles without double-counting the shared edge bin", () => {
    const spec = tone(MIN_HZ, MAX_HZ);
    const whole = bandPower(spec, SR, FFT, 200, 800);
    const halves =
      bandPower(spec, SR, FFT, 200, 500) + bandPower(spec, SR, FFT, 500, 800);
    expect(halves).toBeCloseTo(whole, 12);
  });

  it("sums power, not decibels: +10 dB is 10x", () => {
    const quiet = bandPower(tone(1000, 1100, -40), SR, FFT, 1000, 1100);
    const loud = bandPower(tone(1000, 1100, -30), SR, FFT, 1000, 1100);
    expect(loud / quiet).toBeCloseTo(10, 6);
  });

  it("survives the -Infinity the analyser reports for silence", () => {
    expect(bandPower(silence(), SR, FFT, MIN_HZ, MAX_HZ)).toBe(0);
  });
});

describe("bandRatio and ringRatio", () => {
  it("is 0 on silence rather than NaN", () => {
    expect(bandRatio(silence(), SR, FFT, RING_LO_HZ, RING_HI_HZ)).toBe(0);
    expect(ringRatio(silence(), SR, FFT)).toBe(0);
  });

  it("is ~1 when all the plotted energy is inside the band", () => {
    const spec = tone(RING_LO_HZ, RING_HI_HZ);
    expect(ringRatio(spec, SR, FFT)).toBeCloseTo(1, 6);
  });

  it("is ~0 when the energy sits outside the band", () => {
    const spec = tone(200, 400);
    expect(ringRatio(spec, SR, FFT)).toBeCloseTo(0, 6);
  });

  it("never exceeds 1", () => {
    const spec = tone(MIN_HZ, MAX_HZ);
    expect(ringRatio(spec, SR, FFT)).toBeLessThanOrEqual(1);
  });

  it("ignores energy above the plotted ceiling, so sibilance can't dilute it", () => {
    const withHiss = tone(RING_LO_HZ, RING_HI_HZ);
    for (let i = Math.ceil(hzToBin(12000, SR, FFT)); i < withHiss.length; i++) {
      withHiss[i] = -10;
    }
    expect(ringRatio(withHiss, SR, FFT)).toBeCloseTo(1, 6);
  });
});

describe("intensity", () => {
  it("clamps to the floor and ceiling", () => {
    expect(intensity(-200)).toBe(0);
    expect(intensity(0)).toBe(1);
  });

  it("is monotonic between them", () => {
    expect(intensity(-80)).toBeLessThan(intensity(-50));
    expect(intensity(-50)).toBeLessThan(intensity(-30));
  });

  it("treats -Infinity as the floor rather than producing NaN", () => {
    expect(intensity(-Infinity)).toBe(0);
    expect(intensity(NaN)).toBe(0);
  });
});

describe("heatColor", () => {
  it("returns paper at zero and ink at one", () => {
    expect(heatColor(0)).toEqual([255, 250, 242]);
    expect(heatColor(1)).toEqual([32, 32, 29]);
  });

  it("stays in gamut for every input, including out-of-range ones", () => {
    for (const t of [-1, 0, 0.25, 0.55, 0.9, 1, 2]) {
      for (const ch of heatColor(t)) {
        expect(ch).toBeGreaterThanOrEqual(0);
        expect(ch).toBeLessThanOrEqual(255);
        expect(Number.isInteger(ch)).toBe(true);
      }
    }
  });
});

describe("harmonics", () => {
  it("starts at the fundamental and stays under the ceiling", () => {
    const h = harmonics(220, 1000);
    expect(h[0]).toBe(220);
    expect(h).toEqual([220, 440, 660, 880]);
  });

  it("is empty for a missing or nonsensical fundamental", () => {
    expect(harmonics(0)).toEqual([]);
    expect(harmonics(-100)).toEqual([]);
    expect(harmonics(NaN)).toEqual([]);
  });

  it("is bounded for a very low fundamental", () => {
    expect(harmonics(1, MAX_HZ).length).toBeLessThanOrEqual(64);
  });
});
