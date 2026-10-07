import { describe, expect, it } from "vitest";
import * as mod from "./fixtures.mjs";
import {
  FIXTURES,
  SAMPLE_RATE,
  bestOffset,
  buildFixture,
  centsError,
  getFixture,
  median,
  p95,
  renderSamples,
  rms,
  scoreFixture,
  voicedFraction,
  zeroCrossingHz,
} from "./fixtures.mjs";

const cents = (a, b) => 1200 * Math.log2(a / b);
const SINES = FIXTURES.filter((f) => f.id.startsWith("sine-"));

describe("fixture catalogue", () => {
  it("pins the exported names run.mjs depends on", () => {
    expect(Object.keys(mod).sort()).toEqual(
      [
        "FIXTURES",
        "FIXTURE_DURATION_SEC",
        "PASS_RULES",
        "SAMPLE_RATE",
        "bestOffset",
        "buildFixture",
        "centsError",
        "encodeWav",
        "getFixture",
        "median",
        "p95",
        "renderSamples",
        "rms",
        "scoreFixture",
        "voicedFraction",
        "zeroCrossingHz",
      ].sort(),
    );
  });

  it("has the 17 planned fixtures, all 12 s", () => {
    expect(FIXTURES.map((f) => f.id)).toEqual([
      "sine-110", "sine-130.81", "sine-164.81", "sine-220", "sine-261.63",
      "sine-440", "sine-523.25", "sine-659.26", "sine-880",
      "harmonic-110", "harmonic-220", "harmonic-440",
      "glide-110-220", "vibrato-220", "silence", "pink-noise", "snr10-220",
    ]);
    for (const f of FIXTURES) {
      expect(f.durationSec).toBe(12);
      expect(["steady", "harmonic", "glide", "vibrato", "null"]).toContain(f.kind);
      expect(f.kind === "null" ? f.expectedHz === null : typeof f.expectedHz === "function").toBe(true);
    }
    expect(() => getFixture("nope")).toThrow();
  });
});

describe("WAV encoding", () => {
  it.each([
    [SAMPLE_RATE, 1],
    [44100, 2],
  ])("sample count and header at %i Hz x %i ch", (rate, channels) => {
    const { wav, meta } = buildFixture("sine-440", { sampleRate: rate, channels });
    const n = Math.round(12 * rate) * channels;
    expect(meta.frames * channels).toBe(n);
    expect(wav.byteLength).toBe(44 + 2 * n);
    const view = new DataView(wav.buffer, wav.byteOffset, wav.byteLength);
    const ascii = (o) => String.fromCharCode(...wav.slice(o, o + 4));
    expect(ascii(0)).toBe("RIFF");
    expect(view.getUint32(4, true)).toBe(36 + 2 * n);
    expect(ascii(8)).toBe("WAVE");
    expect(ascii(12)).toBe("fmt ");
    expect(view.getUint16(20, true)).toBe(1);
    expect(view.getUint16(22, true)).toBe(channels);
    expect(view.getUint32(24, true)).toBe(rate);
    expect(view.getUint16(34, true)).toBe(16);
    expect(ascii(36)).toBe("data");
    expect(view.getUint32(40, true)).toBe(2 * n);
    if (channels === 2) {
      // Mono duplicated into both channels.
      for (let i = 44; i < 44 + 400; i += 4) expect(view.getInt16(i, true)).toBe(view.getInt16(i + 2, true));
    }
  });

  it("renders byte-identical output twice, including the seeded noise", () => {
    for (const id of ["pink-noise", "snr10-220", "vibrato-220"]) {
      const a = buildFixture(id).wav;
      const b = buildFixture(id).wav;
      expect(Buffer.from(a).equals(Buffer.from(b))).toBe(true);
    }
    const a = buildFixture("snr10-220", { sampleRate: 44100, channels: 2 }).wav;
    const b = buildFixture("snr10-220", { sampleRate: 44100, channels: 2 }).wav;
    expect(Buffer.from(a).equals(Buffer.from(b))).toBe(true);
  });
});

describe("rendered signal", () => {
  it("never exceeds full scale", () => {
    for (const f of FIXTURES) {
      const { samples } = renderSamples(f.id);
      let peak = 0;
      for (const v of samples) peak = Math.max(peak, Math.abs(v));
      expect(peak, f.id).toBeLessThanOrEqual(1);
    }
  });

  it("RMS matches theory for sines, harmonics and silence", () => {
    for (const f of SINES) {
      const { samples, meta } = renderSamples(f.id);
      expect(rms(samples)).toBeCloseTo(meta.amplitudes[0] / Math.SQRT2, 3);
    }
    for (const id of ["harmonic-110", "harmonic-220", "harmonic-440"]) {
      const { samples, meta } = renderSamples(id);
      expect(meta.amplitudes).toHaveLength(8);
      const expected = Math.sqrt(meta.amplitudes.reduce((s, a) => s + a * a, 0) / 2);
      expect(rms(samples)).toBeCloseTo(expected, 3);
      let peak = 0;
      for (const v of samples) peak = Math.max(peak, Math.abs(v));
      expect(peak).toBeCloseTo(0.8, 6);
    }
    expect(rms(renderSamples("silence").samples)).toBe(0);
    expect(rms(renderSamples("pink-noise").samples)).toBeGreaterThan(0);
  });

  it("snr10-220 carries its tone 10 dB over its noise", () => {
    const mixed = renderSamples("snr10-220").samples;
    const tone = renderSamples("sine-220").samples;
    const noise = mixed.map((v, i) => v - tone[i]);
    const db = 20 * Math.log10(rms(tone) / rms(noise));
    expect(Math.abs(db - 10)).toBeLessThanOrEqual(0.5);
  });

  it("zero-crossing Hz lands within 5 cents on every sine", () => {
    for (const f of SINES) {
      const { samples } = renderSamples(f.id);
      expect(Math.abs(cents(zeroCrossingHz(samples, SAMPLE_RATE), f.hz)), f.id).toBeLessThanOrEqual(5);
    }
  });

  it("vibrato averages to 220 Hz within 5 cents", () => {
    const { samples } = renderSamples("vibrato-220");
    expect(Math.abs(cents(zeroCrossingHz(samples, SAMPLE_RATE), 220))).toBeLessThanOrEqual(5);
  });

  it("glide starts at 110 and ends at 220 within 10 cents", () => {
    const { samples } = renderSamples("glide-110-220");
    const q = Math.round(0.25 * SAMPLE_RATE);
    const head = samples.slice(0, q);
    const tail = samples.slice(samples.length - q);
    expect(Math.abs(cents(zeroCrossingHz(head, SAMPLE_RATE), 110))).toBeLessThanOrEqual(10);
    expect(Math.abs(cents(zeroCrossingHz(tail, SAMPLE_RATE), 220))).toBeLessThanOrEqual(10);
  });
});

describe("scoring helpers", () => {
  const readingsFor = (fixture, shift, hzAt = (t) => fixture.expectedHz(t - shift)) =>
    Array.from({ length: 200 }, (_, i) => {
      const t = i * 0.05;
      return { t, hz: t - shift >= 0 ? hzAt(t) : null };
    });

  it("computes cents, median, p95 and voiced fraction", () => {
    expect(centsError(880, 440)).toBeCloseTo(1200, 9);
    expect(centsError(440, 440)).toBe(0);
    expect(centsError(null, 440)).toBeNull();
    expect(median([3, 1, 2])).toBe(2);
    expect(median([4, 1, 2, 3])).toBe(2.5);
    expect(median([])).toBeNull();
    expect(p95(Array.from({ length: 100 }, (_, i) => i + 1))).toBe(95);
    expect(p95([7])).toBe(7);
    expect(voicedFraction([{ hz: 220 }, { hz: null }, { hz: 0 }, { hz: 110 }])).toBe(0.5);
    expect(voicedFraction([])).toBe(0);
  });

  it("bestOffset recovers a 400 ms shift on the glide within 20 ms", () => {
    const glide = getFixture("glide-110-220");
    expect(Math.abs(bestOffset(glide, readingsFor(glide, 0.4)) - 0.4)).toBeLessThanOrEqual(0.02);
  });

  it("bestOffset reports 0 for a steady tone", () => {
    const f = getFixture("sine-220");
    expect(bestOffset(f, readingsFor(f, 0))).toBe(0);
  });

  it("passes a clean steady read and fails a sharp one", () => {
    const f = getFixture("sine-440");
    const clean = scoreFixture(f, readingsFor(f, 0));
    expect(clean.pass).toBe(true);
    expect(clean.medianCents).toBeCloseTo(0, 9);
    const sharp = scoreFixture(f, readingsFor(f, 0, () => 440 * Math.pow(2, 20 / 1200)));
    expect(sharp.pass).toBe(false);
    expect(sharp.medianCents).toBeCloseTo(20, 6);
  });

  it("fails a harmonic read with more than 2% octave errors", () => {
    const f = getFixture("harmonic-220");
    const readings = readingsFor(f, 0).map((r, i) => ({ ...r, hz: i % 10 === 0 ? 440 : 220 }));
    const s = scoreFixture(f, readings);
    expect(s.octaveErrors).toBe(20);
    expect(s.pass).toBe(false);
  });

  it("scores a delayed glide at its best offset", () => {
    const f = getFixture("glide-110-220");
    const s = scoreFixture(f, readingsFor(f, 0.3));
    expect(s.pass).toBe(true);
    expect(Math.abs(s.offset - 0.3)).toBeLessThanOrEqual(0.02);
  });

  it("fails a voiced fixture with fewer than 10 readings as no-reading", () => {
    const f = getFixture("sine-220");
    const s = scoreFixture(f, Array.from({ length: 9 }, (_, i) => ({ t: i * 0.05, hz: 220 })));
    expect(s.pass).toBe(false);
    expect(s.reason).toBe("no-reading");
  });

  it("null fixtures pass at <=10% voiced and fail above", () => {
    const f = getFixture("silence");
    const quiet = Array.from({ length: 100 }, (_, i) => ({ t: i * 0.05, hz: i < 10 ? 200 : null }));
    expect(scoreFixture(f, quiet).pass).toBe(true);
    const noisy = Array.from({ length: 100 }, (_, i) => ({ t: i * 0.05, hz: i < 11 ? 200 : null }));
    expect(scoreFixture(f, noisy).pass).toBe(false);
  });
});
