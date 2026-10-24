// @vitest-environment node
import { describe, expect, it } from "vitest";
import { detectPitch } from "./pitch";
import fixtures from "./pitch-regressions.json";

/**
 * Frames where an earlier version of this detector chose a different period
 * from the full NSDF scan.
 *
 * That version found candidate lags with an AMDF coarse search and computed
 * the NSDF only around them. A random search over 20,000 frames shaped like
 * the ones the app actually analyzes (44.1 and 48 kHz at 2048 and 4096
 * samples, plus the breath detector's 2048-sample frames at 22.05 and
 * 24 kHz) found 123 where it read something else. Of the ones a singer could
 * have seen, all but one were high notes, 887 to 1505 Hz, read anywhere from
 * a minor third to an octave low, read as 79 Hz, or dropped as null. The
 * coarse search had kept no candidate near the short-lag peak the full scan
 * chose, so the NSDF there was never computed. The weaker frames show the
 * same miss at lower clarity, and some of them at lower notes.
 *
 * Kept here: every one of those frames with clarity at or above 0.75 on
 * either side, which is where a room's voicing gate would have shown the
 * wrong note (21 frames), and six weaker ones that cover the breath path at
 * both rates and other frame shapes. The generator that made them is not
 * part of this repo, so each frame is stored as its raw Float32 samples
 * (little-endian, base64) with its sample rate, next to the reading the full
 * scan gave it.
 *
 * The detector now computes every lag, so each frame must read exactly as
 * the full scan did: null on both sides, or the same frequency and clarity
 * bit for bit.
 */

interface Fixture {
  name: string;
  material: boolean;
  sampleRate: number;
  samples: string;
  expected: { freq: number; clarity: number } | null;
}

const frames = (fixtures as { frames: Fixture[] }).frames;

function decode(samples: string): Float32Array {
  const bytes = Buffer.from(samples, "base64");
  const out = new Float32Array(bytes.byteLength / 4);
  new Uint8Array(out.buffer).set(bytes);
  return out;
}

describe("detectPitch on frames the coarse search once misread", () => {
  it("has its fixtures", () => {
    expect(frames.length).toBe(27);
    expect(frames.filter((f) => f.material).length).toBe(21);
  });

  it.each(frames.map((f) => [f.name, f] as const))("%s", (_name, f) => {
    const got = detectPitch(decode(f.samples), f.sampleRate);
    if (f.expected === null) {
      expect(got).toBeNull();
      return;
    }
    expect(got).not.toBeNull();
    if (!got) return;
    expect(got.freq).toBe(f.expected.freq);
    expect(got.clarity).toBe(f.expected.clarity);
  });
});
