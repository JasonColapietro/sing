import { getAudioContext } from "./context";

/**
 * Frames `usePitch` keeps in its median window. `usePitch` bounds its history
 * with this constant, so the smoothing and the seconds it is converted into
 * below cannot drift apart.
 */
export const PITCH_MEDIAN_WINDOW = 4;

/**
 * Seconds between a sound reaching the microphone and `usePitch` reporting it.
 *
 * Two sources, both real. The analyser holds the last `fftSize` samples, so its
 * estimate describes the midpoint of that window rather than its end. The median
 * of the last `PITCH_MEDIAN_WINDOW` accepted frames then pushes the answer back
 * by half the window's span.
 *
 * At 48 kHz with the 4096-sample frame use-pitch.ts opens, this is about 68 ms.
 * Scoring a frame against the target at *now* therefore misattributes roughly
 * 68 ms of every note onset to the note before it.
 */
export function pitchReportLagSec(
  sampleRate: number,
  fftSize: number,
  frameSec = 1 / 60,
): number {
  if (!(sampleRate > 0) || !(fftSize > 0)) return 0;
  const analyserHalf = fftSize / sampleRate / 2;
  const medianHalf = ((PITCH_MEDIAN_WINDOW - 1) / 2) * frameSec;
  return analyserHalf + medianHalf;
}

/**
 * Seconds between scheduling a tone on the audio clock and hearing it.
 *
 * `outputLatency` is the full path to the speaker and already includes the graph
 * buffer that `baseLatency` reports, so the two are never summed. Bluetooth
 * routinely reports 150–300 ms here, which is why a guide sounding under the
 * voice cannot be aligned by assuming zero.
 */
export function outputLagSec(ctx: AudioContext): number {
  const reported = (ctx as AudioContext & { outputLatency?: number }).outputLatency;
  if (typeof reported === "number" && Number.isFinite(reported) && reported > 0) {
    return reported;
  }
  return Number.isFinite(ctx.baseLatency) ? ctx.baseLatency : 0;
}

/**
 * How far to rewind the target timeline when scoring a pitch frame.
 *
 * A guide scheduled at audio time `t0` is heard at `t0 + outputLag`. A singer
 * following it makes sound at that moment, and `usePitch` reports that sound
 * `pitchLag` later still. So a frame read at audio time `now` describes the
 * pattern at `now - t0 - scoreLagSec(...)`. The two lags add; they do not cancel.
 */
export function scoreLagSec(pitchLag: number, outputLag: number): number {
  return Math.max(0, pitchLag) + Math.max(0, outputLag);
}

/**
 * How far behind the target an aligned voice actually read, measured end to end.
 *
 * scripts/audit-warmup-timing.mjs drives the real warmup room with a synthetic
 * voice sung exactly on the scored window. Probing the live cents readout of
 * that take (2026-08-23) showed the voice landing about 200 ms after the target
 * at every note boundary.
 */
export const MEASURED_ONSET_LAG_SEC = 0.2;

/**
 * The part of MEASURED_ONSET_LAG_SEC that `scoreLagSec` already rewinds, in the
 * same rig and the same probe: about 95 ms (the analyser half-window and the
 * median window from `pitchReportLagSec`, plus the context's output latency).
 */
export const MODELLED_ONSET_LAG_SEC = 0.095;

/**
 * Input latency the model does not carry: stream buffering ahead of the
 * analyser, and the median window's real flip behaviour at a note change. About
 * 105 ms that every note onset still loses after the rewind. It is not rewound
 * as well, because it varies by device; the warmup scorer instead forgives a
 * window of this length at the front of each note (components/warmups/scoring).
 */
export const UNMODELLED_INPUT_LAG_SEC =
  // Rounded to the millisecond, so the published contract carries 0.105 rather
  // than the float subtraction's 0.10500000000000001.
  Math.round((MEASURED_ONSET_LAG_SEC - MODELLED_ONSET_LAG_SEC) * 1000) / 1000;

/** Both lags for the live context, in one call, for a room about to score. */
export function liveLags(sampleRate: number, fftSize: number): {
  pitchLag: number;
  outputLag: number;
  scoreLag: number;
} {
  const pitchLag = pitchReportLagSec(sampleRate, fftSize);
  const outputLag = outputLagSec(getAudioContext());
  return { pitchLag, outputLag, scoreLag: scoreLagSec(pitchLag, outputLag) };
}
