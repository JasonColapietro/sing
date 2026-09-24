// What the vibrato drills tell a singer after a hold.
//
// lib/audio/vibrato.ts does the measuring; this file is the thin layer between
// it and the player. It collects the live pitch frames of one hold into the f0
// trace the analysis takes, and turns the analysis into one short reading. The
// reading is two numbers about the pitch contour, the rate and the width of the
// wobble, and whether the rate landed in the drill's target band. It never
// grades the vibrato: nothing here knows whether it sounded good.

import type { F0Frame } from "@/lib/audio/f0-trace";
import { analyzeVibrato, type VibratoAnalysis } from "@/lib/audio/vibrato";

export interface VibratoBand {
  minHz: number;
  maxHz: number;
}

export type VibratoReading =
  | {
      kind: "measured";
      rateHz: number;
      /** Peak to peak, as lib/audio/vibrato.ts reports it: ±50 cents is 100. */
      extentCents: number;
      inBand: boolean;
      band: VibratoBand;
    }
  | { kind: "none"; reason: VibratoAnalysis["reason"]; band: VibratoBand };

/**
 * Collects one hold's pitch frames as an f0 trace. The player's animation loop
 * and the pitch loop run side by side, so the same published frame can be seen
 * twice or a frame can be missed; duplicates are dropped by timestamp, and a
 * missed frame is only a gap, which the analysis's median frame interval
 * ignores.
 */
export function createF0Recorder() {
  let frames: F0Frame[] = [];
  let lastT = -Infinity;
  return {
    /** `t` in milliseconds, as PitchFrame carries it; `f0` null when unvoiced. */
    push(tMs: number, f0: number | null) {
      if (!(tMs > lastT)) return;
      lastT = tMs;
      frames.push({ t: tMs / 1000, f0 });
    },
    reset() {
      frames = [];
      lastT = -Infinity;
    },
    frames(): F0Frame[] {
      return frames;
    },
  };
}

export type F0Recorder = ReturnType<typeof createF0Recorder>;

/**
 * The least of a wobble the live tracker's analysis window lets through, as a
 * share of its true width, before this file stops correcting for it.
 */
const MIN_WINDOW_GAIN = 0.5;

/**
 * How much of a vibrato's width survives the live pitch tracker's analysis
 * window, 0 to 1.
 *
 * The live loop reads pitch off a frame `windowSec` long (4096 samples, 85 ms
 * at 48 kHz), and a period detector reports roughly the mean pitch across its
 * frame — the same fact lib/audio/voice-fixture.ts's `expectedHz` is built on.
 * A frame half a vibrato cycle long therefore averages away a third of the
 * swing: a moving average of length T passes a sinusoid of rate f at
 * sin(πfT)/(πfT). Measured through Chrome, a ±50 cent, 5.5 Hz voice read 57
 * cents peak to peak uncorrected. The rate is untouched; only the width needs
 * this.
 */
export function windowGain(rateHz: number, windowSec: number): number {
  const x = Math.PI * rateHz * windowSec;
  return x > 0 ? Math.sin(x) / x : 1;
}

/**
 * Read one hold's trace against the drill's band. `windowSec` is the live
 * tracker's analysis frame; with it, the width is corrected for what that frame
 * averaged away, down to a gain of MIN_WINDOW_GAIN — past that, which is above
 * about 7 Hz at 48 kHz, the reading is left narrower than the truth rather
 * than inflated by a large division. Without it the width is the trace's own.
 */
export function readVibrato(
  frames: F0Frame[],
  band: VibratoBand,
  opts: { windowSec?: number } = {},
): VibratoReading {
  const analysis = analyzeVibrato(frames);
  if (!analysis.present || analysis.rateHz === null || analysis.extentCents === null) {
    return { kind: "none", reason: analysis.reason, band };
  }
  const gain = opts.windowSec
    ? Math.max(MIN_WINDOW_GAIN, windowGain(analysis.rateHz, opts.windowSec))
    : 1;
  return {
    kind: "measured",
    rateHz: analysis.rateHz,
    extentCents: analysis.extentCents / gain,
    inBand: analysis.rateHz >= band.minHz && analysis.rateHz <= band.maxHz,
    band,
  };
}

/** The headline: "5.5 Hz · 98¢ wide", or the honest absence. */
export function vibratoHeadline(r: VibratoReading): string {
  if (r.kind === "none") return "No steady vibrato yet";
  return `${r.rateHz.toFixed(1)} Hz · ${Math.round(r.extentCents)}¢ wide`;
}

/** The line under it: where the rate sits against the band, and nothing more. */
export function vibratoDetail(r: VibratoReading): string {
  const band = `${r.band.minHz}–${r.band.maxHz} Hz`;
  if (r.kind === "none") {
    return r.reason === "too-short"
      ? "The hold was too short to read. Keep the note going to the end."
      : "A straight tone is fine. This only measures the pitch wobble when there is one.";
  }
  if (r.inBand) return `In the ${band} target band.`;
  return r.rateHz < r.band.minHz
    ? `Slower than the ${band} target band.`
    : `Faster than the ${band} target band.`;
}
