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
});
