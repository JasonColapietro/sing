// What the vibrato drills tell a singer after a hold.
//
// lib/audio/vibrato.ts does the measuring; this file is the thin layer between
// it and the player. It collects the live pitch frames of one hold into the f0
// trace the analysis takes, and turns the analysis into one short reading. The
// reading is two numbers about the pitch contour, the rate and the width of the
// wobble, and whether the rate landed in the drill's target band. It never
// grades the vibrato: nothing here knows whether it sounded good.

import type { F0Frame } from "@/lib/audio/f0-trace";
import {
  VIBRATO_MIN_EXTENT_CENTS,
  analyzeVibrato,
  type VibratoAnalysis,
} from "@/lib/audio/vibrato";

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
  | {
      kind: "none";
      reason: VibratoAnalysis["reason"];
      /** Only for a rate outside the band vibrato is accepted in at all. */
      rateHz: number | null;
      band: VibratoBand;
    };

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
 * Trailing stretches of the hold, in seconds, read when the whole run shows no
 * vibrato. The drill asks for a straight start and then a wobble, and the
 * analysis's extent is a median over every cycle-long window of the run: three
 * straight seconds and a second and a half of vibrato read as too narrow,
 * because most of the windows are straight. The tail is where vibrato arrives
 * if it arrives, so it is read on its own. Each is long enough, with no onset
 * to skip, to leave the analysis its one-second minimum after detrending.
 */
const TAIL_WINDOWS_SEC = [2.5, 1.75] as const;

/** The trace cut to its last `sec` seconds of voicing. */
function tail(frames: F0Frame[], sec: number): F0Frame[] {
  let end = -Infinity;
  for (const f of frames) if (f.f0 !== null && f.f0 > 0) end = f.t;
  if (!Number.isFinite(end)) return [];
  return frames.filter((f) => f.t > end - sec && f.t <= end);
}

/**
 * The hold's analysis: the whole voiced run first, then its tail, so a
 * vibrato that comes in late is read on the stretch where it happened. The
 * gates are the same on every stretch; only the onset skip is dropped for a
 * tail, which does not start on an onset. When nothing passes, the whole
 * run's reason is the one reported.
 */
export function analyzeHold(frames: F0Frame[]): VibratoAnalysis {
  const whole = analyzeVibrato(frames);
  if (whole.present) return whole;
  for (const sec of TAIL_WINDOWS_SEC) {
    const late = analyzeVibrato(tail(frames, sec), { onsetSkipSec: 0 });
    if (late.present) return late;
  }
  return whole;
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
  const analysis = analyzeHold(frames);
  if (!analysis.present || analysis.rateHz === null || analysis.extentCents === null) {
    // vibrato.ts checks the rate and the periodicity before the width, so a
    // straight tone, whose residual is only detector noise, usually fails as
    // "not periodic". Measured through Chrome it did, and called a straight
    // tone an irregular wobble. Anything narrower than the width vibrato has
    // to reach is reported as too narrow whichever gate it failed first.
    const narrow =
      analysis.extentCents !== null && analysis.extentCents < VIBRATO_MIN_EXTENT_CENTS;
    const reason =
      narrow && (analysis.reason === "not-periodic" || analysis.reason === "rate-out-of-band")
        ? "too-narrow"
        : analysis.reason;
    // A rate that fell outside the band vibrato.ts accepts is still a measured
    // rate, and the only case where one is worth showing.
    const rateHz = reason === "rate-out-of-band" ? analysis.rateHz : null;
    return { kind: "none", reason, rateHz, band };
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
  if (r.kind === "measured") return `${r.rateHz.toFixed(1)} Hz · ${Math.round(r.extentCents)}¢ wide`;
  switch (r.reason) {
    case "too-narrow":
    case "too-short":
      return "No steady vibrato yet";
    case "rate-out-of-band":
      return r.rateHz !== null ? `${r.rateHz.toFixed(1)} Hz wobble` : "No steady vibrato yet";
    case "not-periodic":
      return "Irregular wobble";
    case "no-periodic-peak":
      return "No steady vibrato yet";
    default:
      return "Couldn't read this hold";
  }
}

/**
 * The line under it: where the rate sits against the band, and nothing more.
 * Each absence says what was actually found — only a wobble too narrow to
 * count is described as a straight tone.
 */
export function vibratoDetail(r: VibratoReading): string {
  const band = `${r.band.minHz}–${r.band.maxHz} Hz`;
  if (r.kind === "none") {
    switch (r.reason) {
      case "too-narrow":
        return "A straight tone is fine. This only measures the pitch wobble when there is one.";
      case "too-short":
        return "The hold was too short to read. Keep the note going to the end.";
      case "rate-out-of-band":
        if (r.rateHz === null) return "The wobble was outside the range vibrato usually runs.";
        return r.rateHz < r.band.minHz
          ? `Much slower than the ${band} target band, more a drift than a vibrato.`
          : `Much faster than the ${band} target band, more a flutter than a vibrato.`;
      case "not-periodic":
        return "The pitch moved, but not in a steady cycle, so there is no rate to read.";
      case "no-periodic-peak":
        return "No steady cycle in the pitch to read a rate from.";
      default:
        return "No steady pitch came through for long enough to read. Hold one note, a little louder.";
    }
  }
  if (r.inBand) return `In the ${band} target band.`;
  return r.rateHz < r.band.minHz
    ? `Slower than the ${band} target band.`
    : `Faster than the ${band} target band.`;
}
