import { describe, expect, it } from "vitest";
import { detectPitch, MIN_FREQ } from "./pitch";
import {
  centsBetween,
  expectedHz,
  midiToHz,
  synthVoice,
  WEAK_FUNDAMENTAL_HARMONICS,
  type VoiceSpec,
} from "./voice-fixture";

/**
 * Precision, not detection. `pitch.test.ts` asks whether a note is read at
 * all; this suite asks how many cents the reading is off, across the whole
 * singing range, both sample rates the browsers use, and the conditions a real
 * voice brings with it (vibrato, jitter, a weak fundamental, a noisy room).
 *
 * The ceilings are measured values with headroom, not aspirations. The
 * fixtures are deterministic, so a ceiling that starts failing means the
 * detector changed, and the numbers in the failure say by how much.
 *
 * Measured on introduction (cents, |error|):
 *   clean ................ max 0.2
 *   ±37 c detune ......... max 0.2
 *   weak fundamental ..... max 0.1, no octave errors
 *   10 c jitter .......... p95 3.8
 *   vibrato 5.5 Hz ±50 c . p95 4.0, max 5.1 (vs. the frame's mean pitch)
 *   20 dB SNR ............ p95 1.2, max 2.4
 *   10 dB SNR ............ p50 1.6, p95 16.2, max 30.6, 2 of 294 frames missed
 */

/** C2 to C6: the range the live rooms accept, a semitone at a time. */
const MIDI_RANGE = Array.from({ length: 49 }, (_, i) => 36 + i);
const SAMPLE_RATES = [44100, 48000] as const;
const SEEDS = [1, 2, 3] as const;
/** The gate `usePitch` applies before a reading reaches any room. */
const CLARITY_GATE = 0.75;

interface Sweep {
  errors: number[];
  missed: number;
  octaveErrors: number;
  total: number;
}

function sweep(make: (midi: number, sampleRate: number, seed: number) => VoiceSpec): Sweep {
  const result: Sweep = { errors: [], missed: 0, octaveErrors: 0, total: 0 };
  for (const midi of MIDI_RANGE) {
    for (const sampleRate of SAMPLE_RATES) {
      for (const seed of SEEDS) {
        const spec = make(midi, sampleRate, seed);
        result.total++;
        const r = detectPitch(synthVoice(spec), sampleRate);
        if (!r || r.clarity < CLARITY_GATE) {
          result.missed++;
          continue;
        }
        const cents = centsBetween(r.freq, expectedHz(spec));
        // Anything past a tritone is a wrong-octave (or wrong-harmonic) read,
        // which is a different failure from imprecision and is counted apart.
        if (Math.abs(cents) > 600) {
          result.octaveErrors++;
          continue;
        }
        result.errors.push(Math.abs(cents));
      }
    }
  }
  result.errors.sort((a, b) => a - b);
  return result;
}

function quantile(sorted: number[], q: number): number {
  return sorted[Math.min(sorted.length - 1, Math.floor(q * sorted.length))];
}

describe("detectPitch precision", () => {
  it("reads clean notes within a fraction of a cent across C2–C6", () => {
    const s = sweep((midi, sampleRate, seed) => ({ freq: midiToHz(midi), sampleRate, seed }));
    expect(s.missed).toBe(0);
    expect(s.octaveErrors).toBe(0);
    expect(s.errors.at(-1)).toBeLessThan(0.5);
  });

  it("is as precise with the 2048-sample frames of the older rooms", () => {
    const s = sweep((midi, sampleRate, seed) => ({
      freq: midiToHz(midi),
      sampleRate,
      seed,
      length: 2048,
    }));
    expect(s.missed).toBe(0);
    expect(s.octaveErrors).toBe(0);
    expect(s.errors.at(-1)).toBeLessThan(0.5);
  });

  it("measures a flat or sharp note by how far off it is, not just its nearest note", () => {
    for (const detuneCents of [-37, -12, 12, 37]) {
      for (const midi of MIDI_RANGE) {
        const target = midiToHz(midi);
        const spec: VoiceSpec = { freq: target, detuneCents, sampleRate: 48000 };
        const r = detectPitch(synthVoice(spec), 48000);
        if (expectedHz(spec) < MIN_FREQ) {
          // Below C2 by design: the rooms never score it.
          expect(r).toBeNull();
          continue;
        }
        expect(r).not.toBeNull();
        expect(Math.abs(centsBetween(r!.freq, target) - detuneCents)).toBeLessThan(0.5);
      }
    }
  });

  it("does not jump an octave when the second harmonic is louder than the fundamental", () => {
    const s = sweep((midi, sampleRate, seed) => ({
      freq: midiToHz(midi),
      sampleRate,
      seed,
      harmonics: WEAK_FUNDAMENTAL_HARMONICS,
    }));
    expect(s.missed).toBe(0);
    expect(s.octaveErrors).toBe(0);
    expect(s.errors.at(-1)).toBeLessThan(0.5);
  });

  it("stays within a few cents through natural jitter", () => {
    const s = sweep((midi, sampleRate, seed) => ({
      freq: midiToHz(midi),
      sampleRate,
      seed,
      jitterCents: 10,
    }));
    expect(s.missed).toBe(0);
    expect(s.octaveErrors).toBe(0);
    expect(quantile(s.errors, 0.95)).toBeLessThan(6);
  });

  it("tracks the frame's mean pitch through a wide vibrato", () => {
    const s = sweep((midi, sampleRate, seed) => ({
      freq: midiToHz(midi),
      sampleRate,
      seed,
      vibratoHz: 5.5,
      vibratoCents: 50,
    }));
    expect(s.missed).toBe(0);
    expect(s.octaveErrors).toBe(0);
    expect(quantile(s.errors, 0.95)).toBeLessThan(6);
    expect(s.errors.at(-1)).toBeLessThan(8);
  });

  it("holds precision in an ordinary room (20 dB SNR)", () => {
    const s = sweep((midi, sampleRate, seed) => ({
      freq: midiToHz(midi),
      sampleRate,
      seed,
      snrDb: 20,
    }));
    expect(s.missed).toBe(0);
    expect(s.octaveErrors).toBe(0);
    expect(quantile(s.errors, 0.95)).toBeLessThan(2.5);
    expect(s.errors.at(-1)).toBeLessThan(4);
  });

  it("degrades without octave errors in a loud room (10 dB SNR)", () => {
    const s = sweep((midi, sampleRate, seed) => ({
      freq: midiToHz(midi),
      sampleRate,
      seed,
      snrDb: 10,
    }));
    // A regression ceiling on a known weak spot: the tail here is what a
    // precision improvement should shrink, so tighten these when it does.
    expect(s.octaveErrors).toBe(0);
    expect(s.missed / s.total).toBeLessThanOrEqual(0.02);
    expect(quantile(s.errors, 0.5)).toBeLessThan(3);
    expect(quantile(s.errors, 0.95)).toBeLessThan(25);
    expect(s.errors.at(-1)).toBeLessThan(40);
  });

  it("reads a quiet voice precisely once it clears the silence floor", () => {
    const s = sweep((midi, sampleRate, seed) => ({
      freq: midiToHz(midi),
      sampleRate,
      seed,
      level: 0.05,
    }));
    expect(s.missed).toBe(0);
    expect(s.errors.at(-1)).toBeLessThan(0.5);
  });
});
