import { describe, expect, it } from "vitest";
import type { EnvelopeShape } from "./spectral-envelope";
import {
  ENVELOPE_CHANGED_DB,
  ENVELOPE_HELD_DB,
  ENVELOPE_HI_HZ,
  ENVELOPE_LO_HZ,
  MAX_ENVELOPE_F0_HZ,
  MAX_F0_DRIFT_CENTS,
  MIN_ENVELOPE_FRAMES,
  envelopeDistanceDb,
  envelopeProbes,
  harmonicEnvelope,
  measureEnvelopeHold,
} from "./spectral-envelope";
import { hzToBin } from "./spectrum";

const SR = 48000;
const FFT = 4096;

/**
 * A vowel as three resonances: centre frequency, bandwidth, and relative
 * strength. These are textbook first-and-second-formant positions rather than
 * measurements of any singer, which is the whole limitation of this file: it
 * proves the arithmetic behaves on a source-filter model, and establishes
 * nothing whatever about real voices, microphones or rooms.
 */
type Formant = [hz: number, bandwidthHz: number, amp: number];

const AH: Formant[] = [
  [700, 130, 1],
  [1220, 160, 0.5],
  [2600, 200, 0.12],
];
const EE: Formant[] = [
  [300, 90, 1],
  [2300, 180, 0.6],
  [3000, 220, 0.2],
];
const OO: Formant[] = [
  [350, 90, 1],
  [800, 120, 0.4],
  [2600, 220, 0.08],
];

/**
 * One analyser frame of a sung vowel: a harmonic comb at `f0`, each harmonic at
 * the level the formant filter gives it, and the analyser's floor everywhere
 * between the teeth. `jitterDb` is deterministic, because a flaky measurement
 * test is worse than none.
 */
function vowelFrame({
  f0,
  formants,
  gainDb = 0,
  tiltDbPerOctave = 6,
  jitterDb = 0,
  seed = 1,
}: {
  f0: number;
  formants: Formant[];
  gainDb?: number;
  tiltDbPerOctave?: number;
  jitterDb?: number;
  seed?: number;
}): Float32Array {
  let state = seed;
  const random = () => {
    state = (state * 1664525 + 1013904223) % 4294967296;
    return (state / 4294967296) * 2 - 1;
  };
  const spectrum = new Float32Array(FFT / 2).fill(-200);
  for (let n = 1; n * f0 < SR / 2.2; n++) {
    const hz = n * f0;
    let power = 0;
    for (const [centre, bandwidth, amp] of formants) {
      power += amp / (1 + Math.pow((hz - centre) / (bandwidth / 2), 2));
    }
    const db =
      10 * Math.log10(power + 1e-9) -
      tiltDbPerOctave * Math.log2(hz / f0) +
      gainDb -
      20 +
      jitterDb * random();
    const bin = Math.round(hzToBin(hz, SR, FFT));
    if (bin <= 0 || bin >= spectrum.length) continue;
    spectrum[bin] = db;
    // A real analyser leaks a harmonic into its neighbours; the peak search has
    // to survive that rather than depend on a single perfectly centred bin.
    if (bin - 1 > 0) spectrum[bin - 1] = Math.max(spectrum[bin - 1], db - 12);
    if (bin + 1 < spectrum.length) spectrum[bin + 1] = Math.max(spectrum[bin + 1], db - 12);
  }
  return spectrum;
}

/** A window of frames on one held vowel, with a little frame-to-frame noise. */
function heldNote({
  f0,
  formants,
  frames = 20,
  jitterDb = 1.5,
  gainDb = 0,
}: {
  f0: number;
  formants: Formant[];
  frames?: number;
  jitterDb?: number;
  gainDb?: number;
}) {
  return Array.from({ length: frames }, (_, i) => ({
    freqDb: vowelFrame({ f0, formants, jitterDb, gainDb, seed: i + 1 }),
    f0Hz: f0,
  }));
}

function shapeOf(f0: number, formants: Formant[], gainDb = 0) {
  const shape = harmonicEnvelope(vowelFrame({ f0, formants, gainDb }), SR, FFT, f0);
  if (!shape) throw new Error(`expected a readable envelope at ${f0} Hz`);
  return shape;
}

/** Level the shape reports nearest `hz`, for asserting where the peaks landed. */
function levelNear(shape: { probesHz: number[]; levelsDb: number[] }, hz: number): number {
  let best = 0;
  for (let i = 1; i < shape.probesHz.length; i++) {
    if (Math.abs(shape.probesHz[i] - hz) < Math.abs(shape.probesHz[best] - hz)) best = i;
  }
  return shape.levelsDb[best];
}

describe("envelope probes", () => {
  it("spans the envelope range and is evenly spaced in log frequency", () => {
    const probes = envelopeProbes();
    expect(probes[0]).toBeCloseTo(ENVELOPE_LO_HZ, 6);
    expect(probes[probes.length - 1]).toBeCloseTo(ENVELOPE_HI_HZ, 6);
    const first = Math.log(probes[1] / probes[0]);
    const last = Math.log(probes[probes.length - 1] / probes[probes.length - 2]);
    expect(first).toBeCloseTo(last, 10);
  });
});

describe("harmonicEnvelope", () => {
  it("puts its high ground where the vowel's formants are", () => {
    const ah = shapeOf(180, AH);
    expect(levelNear(ah, 700)).toBeGreaterThan(levelNear(ah, 2300));
    const ee = shapeOf(180, EE);
    expect(levelNear(ee, 2300)).toBeGreaterThan(levelNear(ee, 1200));
  });

  it("is a shape and not a level: a gain change moves it not at all", () => {
    // Float32 bins mean the subtraction is exact only to a few decimals.
    expect(envelopeDistanceDb(shapeOf(180, AH), shapeOf(180, AH, 14))).toBeCloseTo(0, 4);
  });

  it("refuses an unvoiced or nonsensical fundamental instead of inventing one", () => {
    const frame = vowelFrame({ f0: 180, formants: AH });
    expect(harmonicEnvelope(frame, SR, FFT, null)).toBeNull();
    expect(harmonicEnvelope(frame, SR, FFT, 0)).toBeNull();
    expect(harmonicEnvelope(frame, SR, FFT, -180)).toBeNull();
    expect(harmonicEnvelope(frame, SR, FFT, NaN)).toBeNull();
  });

  it("refuses a spectrum sitting at the analyser's floor", () => {
    const silence = new Float32Array(FFT / 2).fill(-Infinity);
    expect(harmonicEnvelope(silence, SR, FFT, 180)).toBeNull();
    const floor = new Float32Array(FFT / 2).fill(-120);
    expect(harmonicEnvelope(floor, SR, FFT, 180)).toBeNull();
  });

  it("survives the small f0 error a detector actually makes", () => {
    // The detector's estimate is never exact, so the harmonic levels have to be
    // found by searching near each multiple rather than at one nominal bin.
    const frame = vowelFrame({ f0: 180, formants: AH });
    const exact = harmonicEnvelope(frame, SR, FFT, 180);
    const slightlyOff = harmonicEnvelope(frame, SR, FFT, 180 * 1.004);
    expect(exact).not.toBeNull();
    expect(slightlyOff).not.toBeNull();
    expect(
      envelopeDistanceDb(exact as EnvelopeShape, slightlyOff as EnvelopeShape),
    ).toBeLessThan(ENVELOPE_HELD_DB);
  });

  it("reads up to the documented pitch ceiling and abstains above it", () => {
    expect(harmonicEnvelope(vowelFrame({ f0: 580, formants: AH }), SR, FFT, 580)).not.toBeNull();
    expect(MAX_ENVELOPE_F0_HZ).toBeGreaterThan(580);
    expect(harmonicEnvelope(vowelFrame({ f0: 600, formants: AH }), SR, FFT, 600)).toBeNull();
    expect(MAX_ENVELOPE_F0_HZ).toBeLessThan(600);
  });
});

describe("envelopeDistanceDb", () => {
  it("reads the same vowel at two pitches as nearly the same shape", () => {
    expect(envelopeDistanceDb(shapeOf(180, AH), shapeOf(240, AH))).toBeLessThan(ENVELOPE_HELD_DB);
    expect(envelopeDistanceDb(shapeOf(180, AH), shapeOf(330, AH))).toBeLessThan(ENVELOPE_HELD_DB);
  });

  it("reads two vowels at one pitch as different shapes", () => {
    expect(envelopeDistanceDb(shapeOf(180, AH), shapeOf(180, EE))).toBeGreaterThan(
      ENVELOPE_CHANGED_DB,
    );
    expect(envelopeDistanceDb(shapeOf(180, AH), shapeOf(180, OO))).toBeGreaterThan(
      ENVELOPE_CHANGED_DB,
    );
  });

  it("separates a vowel change from a pitch change by a clear margin", () => {
    const pitchOnly = envelopeDistanceDb(shapeOf(180, AH), shapeOf(240, AH));
    const vowelChange = envelopeDistanceDb(shapeOf(180, AH), shapeOf(180, EE));
    expect(vowelChange).toBeGreaterThan(4 * pitchOnly);
  });
});

describe("measureEnvelopeHold", () => {
  it("reports a small drift for a vowel held through a sustained note", () => {
    const hold = measureEnvelopeHold(heldNote({ f0: 196, formants: AH }), {
      sampleRate: SR,
      fftSize: FFT,
    });
    expect(hold.confident).toBe(true);
    expect(hold.abstained).toBeNull();
    expect(hold.framesUsed).toBe(20);
    expect(hold.medianF0Hz).toBeCloseTo(196, 6);
    expect(hold.driftDb as number).toBeLessThan(ENVELOPE_HELD_DB);
  });

  it("reports a large drift when the vowel changes mid-note", () => {
    const frames = Array.from({ length: 20 }, (_, i) => ({
      freqDb: vowelFrame({ f0: 196, formants: i < 10 ? AH : EE, jitterDb: 1.5, seed: i + 1 }),
      f0Hz: 196,
    }));
    const hold = measureEnvelopeHold(frames, { sampleRate: SR, fftSize: FFT });
    expect(hold.confident).toBe(true);
    expect(hold.driftDb as number).toBeGreaterThan(ENVELOPE_CHANGED_DB);
  });

  it("is unmoved by a singer who gets louder without changing vowel", () => {
    const frames = Array.from({ length: 20 }, (_, i) => ({
      freqDb: vowelFrame({ f0: 196, formants: AH, gainDb: i, seed: i + 1 }),
      f0Hz: 196,
    }));
    const hold = measureEnvelopeHold(frames, { sampleRate: SR, fftSize: FFT });
    expect(hold.confident).toBe(true);
    expect(hold.driftDb as number).toBeCloseTo(0, 4);
  });

  it("leaves a band between held and changed rather than rounding to a verdict", () => {
    expect(ENVELOPE_HELD_DB).toBeLessThan(ENVELOPE_CHANGED_DB);
  });

  it("abstains on a high voice whose harmonics are too sparse to read", () => {
    const hold = measureEnvelopeHold(heldNote({ f0: 880, formants: AH }), {
      sampleRate: SR,
      fftSize: FFT,
    });
    expect(hold.confident).toBe(false);
    expect(hold.abstained).toBe("pitch-too-high");
    expect(hold.driftDb).toBeNull();
    expect(hold.framesUsed).toBe(0);
  });

  it("abstains when a handful of low frames sit under a mostly too-high note", () => {
    const frames = [
      ...heldNote({ f0: 880, formants: AH, frames: 16 }),
      ...heldNote({ f0: 400, formants: AH, frames: 4 }),
    ];
    const hold = measureEnvelopeHold(frames, { sampleRate: SR, fftSize: FFT });
    expect(hold.confident).toBe(false);
    expect(hold.abstained).toBe("pitch-too-high");
  });

  it("abstains on an unvoiced window", () => {
    const frames = Array.from({ length: 20 }, () => ({
      freqDb: new Float32Array(FFT / 2).fill(-Infinity),
      f0Hz: null,
    }));
    const hold = measureEnvelopeHold(frames, { sampleRate: SR, fftSize: FFT });
    expect(hold.confident).toBe(false);
    expect(hold.abstained).toBe("unvoiced");
    expect(hold.driftDb).toBeNull();
  });

  it("abstains on an empty window", () => {
    expect(measureEnvelopeHold([], { sampleRate: SR, fftSize: FFT }).abstained).toBe("unvoiced");
  });

  it("abstains when the pitch did not stay put, rather than blaming the tract", () => {
    const frames = Array.from({ length: 20 }, (_, i) => {
      const f0 = 196 * Math.pow(2, (i * 7) / (19 * 12));
      return { freqDb: vowelFrame({ f0, formants: AH, seed: i + 1 }), f0Hz: f0 };
    });
    const hold = measureEnvelopeHold(frames, { sampleRate: SR, fftSize: FFT });
    expect(hold.confident).toBe(false);
    expect(hold.abstained).toBe("pitch-not-held");
    expect(1200 * Math.log2(Math.pow(2, 7 / 12))).toBeGreaterThan(MAX_F0_DRIFT_CENTS);
  });

  it("tolerates the drift a deliberately held note actually has", () => {
    const frames = Array.from({ length: 20 }, (_, i) => {
      const f0 = 196 * Math.pow(2, (i * 0.3) / (19 * 12));
      return {
        freqDb: vowelFrame({ f0, formants: AH, jitterDb: 1.5, seed: i + 1 }),
        f0Hz: f0,
      };
    });
    const hold = measureEnvelopeHold(frames, { sampleRate: SR, fftSize: FFT });
    expect(hold.confident).toBe(true);
    expect(hold.driftDb as number).toBeLessThan(ENVELOPE_HELD_DB);
  });

  it("abstains on a window too short to average", () => {
    const frames = heldNote({ f0: 196, formants: AH, frames: MIN_ENVELOPE_FRAMES - 1 });
    const hold = measureEnvelopeHold(frames, { sampleRate: SR, fftSize: FFT });
    expect(hold.confident).toBe(false);
    expect(hold.abstained).toBe("too-few-frames");
    expect(hold.framesUsed).toBe(MIN_ENVELOPE_FRAMES - 1);
  });

  it("never reports a number alongside an abstention, or NaN in place of one", () => {
    const windows = [
      [],
      heldNote({ f0: 880, formants: AH }),
      heldNote({ f0: 196, formants: AH }),
      heldNote({ f0: 196, formants: AH, frames: 2 }),
    ];
    for (const frames of windows) {
      const hold = measureEnvelopeHold(frames, { sampleRate: SR, fftSize: FFT });
      if (hold.confident) {
        expect(Number.isFinite(hold.driftDb as number)).toBe(true);
        expect(hold.abstained).toBeNull();
      } else {
        expect(hold.driftDb).toBeNull();
      }
    }
  });
});
