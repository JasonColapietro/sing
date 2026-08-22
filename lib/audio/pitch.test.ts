import { describe, expect, it } from "vitest";
import { detectPitch } from "./pitch";

/** One analyser frame of a sung vowel: fundamental plus the first harmonics. */
function voiceFrame({
  freq = 220,
  level = 0.03,
  noise = 0,
  sampleRate = 44100,
  size = 2048,
  seed = 1,
}: {
  freq?: number;
  level?: number;
  noise?: number;
  sampleRate?: number;
  size?: number;
  seed?: number;
} = {}): Float32Array {
  // Deterministic PRNG: a flaky detector test is worse than none.
  let s = seed;
  const rand = () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return (s / 4294967296) * 2 - 1;
  };
  const out = new Float32Array(size);
  let phase = 0;
  for (let i = 0; i < size; i++) {
    phase += (2 * Math.PI * freq) / sampleRate;
    const tone =
      Math.sin(phase) + 0.4 * Math.sin(2 * phase) + 0.22 * Math.sin(3 * phase);
    out[i] = tone * level + rand() * noise;
  }
  return out;
}

describe("detectPitch", () => {
  it("reads a clean sung note", () => {
    const r = detectPitch(voiceFrame(), 44100);
    expect(r).not.toBeNull();
    expect(r!.freq).toBeCloseTo(220, 0);
  });

  /**
   * The bug: a singer in a normal room, or any signal that has been through the
   * browser's capture and resampling path, arrives with a noise floor. The
   * autocorrelation then peaks on noise at a very short lag, the resulting
   * frequency lands outside the vocal range, and the whole frame is thrown away
   * as "no pitch" — even though the note is perfectly audible and perfectly on
   * pitch. On /range that reads as the warm hold never filling: the singer holds
   * a note and the app says it hears nothing.
   */
  it("still reads the note when the room is noisy", () => {
    const frame = voiceFrame({ level: 0.03, noise: 0.02 });
    const r = detectPitch(frame, 44100);
    expect(r).not.toBeNull();
    expect(r!.freq).toBeCloseTo(220, -1);
  });

  it("holds up across a run of noisy frames, not just a lucky one", () => {
    let resolved = 0;
    const total = 40;
    for (let seed = 1; seed <= total; seed++) {
      const r = detectPitch(voiceFrame({ level: 0.03, noise: 0.02, seed }), 44100);
      if (r && Math.abs(r.freq - 220) < 25) resolved++;
    }
    // The warm hold resets after 350 ms of unvoiced frames (~21 frames at 60fps),
    // so an occasional miss is survivable but a majority of misses is not.
    expect(resolved).toBeGreaterThan(total * 0.8);
  });

  it("does not invent a pitch for noise alone", () => {
    const noiseOnly = voiceFrame({ level: 0, noise: 0.05 });
    const r = detectPitch(noiseOnly, 44100);
    // Either no reading, or one the caller's confidence gate will reject.
    expect(r === null || r.clarity < 0.75).toBe(true);
  });

  it("rejects a frame below the silence floor", () => {
    expect(detectPitch(voiceFrame({ level: 0.0005 }), 44100)).toBeNull();
  });

  it("reads the low and high ends of the singing range", () => {
    const low = detectPitch(voiceFrame({ freq: 82 }), 44100); // E2
    const high = detectPitch(voiceFrame({ freq: 880 }), 44100); // A5
    expect(low!.freq).toBeCloseTo(82, 0);
    expect(high!.freq).toBeCloseTo(880, -1);
  });
  /**
   * The gate every practice room actually applies is `clarity >= 0.75`
   * (lib/audio/use-pitch.ts), not "did detectPitch return something". Asserting
   * only the frequency is how a detector that could not hear a bass passed its
   * own tests for months: E2 came back at the right pitch with a clarity of
   * 0.714, and every caller threw it away as unvoiced.
   *
   * 2048 samples at 48 kHz is the exact frame every room uses, and the case
   * that used to fail.
   */
  describe("clears the caller's clarity gate across the whole vocal range", () => {
    const CLARITY_GATE = 0.75;
    const notes: Array<[string, number]> = [
      ["C2", 65.41],
      ["E2 (bass floor)", 82.41],
      ["F#2", 92.5],
      ["G2", 98.0],
      ["A2 (baritone floor)", 110.0],
      ["C3", 130.81],
      ["A3", 220.0],
      ["C5", 523.25],
      ["A5", 880.0],
    ];

    for (const [name, freq] of notes) {
      it(`${name} at 48 kHz`, () => {
        const r = detectPitch(
          voiceFrame({ freq, sampleRate: 48000, size: 2048 }),
          48000,
        );
        expect(r).not.toBeNull();
        expect(r!.freq).toBeCloseTo(freq, freq > 400 ? -1 : 0);
        expect(r!.clarity).toBeGreaterThanOrEqual(CLARITY_GATE);
      });
    }
  });

  /**
   * Normalizing the correlation removed the taper that used to suppress
   * sub-octave lags for free, so the octave below now scores about as well as
   * the true period. Without first-peak selection a bass singing E2 reads as
   * E1 and the range test overstates him instead of understating him.
   */
  it("does not drop an octave when the sub-octave lag scores as well", () => {
    for (const freq of [82.41, 110, 146.83, 220]) {
      const r = detectPitch(
        voiceFrame({ freq, sampleRate: 48000, size: 2048 }),
        48000,
      );
      expect(r).not.toBeNull();
      // Half the true frequency would be the classic failure.
      expect(r!.freq).toBeGreaterThan(freq * 0.8);
      expect(r!.freq).toBeLessThan(freq * 1.25);
    }
  });

  /**
   * Two singers with the same voice used to get different range tests
   * depending on their sound card, because the old clarity floor moved with
   * the sample rate (4*sampleRate/size).
   */
  it("reads the same low note at 44.1 kHz and 48 kHz", () => {
    const a = detectPitch(voiceFrame({ freq: 87.31, sampleRate: 44100 }), 44100);
    const b = detectPitch(
      voiceFrame({ freq: 87.31, sampleRate: 48000, size: 2048 }),
      48000,
    );
    expect(a).not.toBeNull();
    expect(b).not.toBeNull();
    expect(a!.clarity).toBeGreaterThanOrEqual(0.75);
    expect(b!.clarity).toBeGreaterThanOrEqual(0.75);
    expect(Math.abs(a!.freq - b!.freq)).toBeLessThan(2);
  });
});
