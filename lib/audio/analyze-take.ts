/**
 * Offline per-take pitch analysis. Decodes a stored take, walks it in
 * 4096-sample windows, and reduces the voiced frames to a chartable trace
 * plus nearest-note intonation stats. Client-only: decoding rides the
 * shared AudioContext.
 */

import { decodeTakeBlob } from "@/components/recorder/wav";
import { type F0Frame } from "@/lib/audio/f0-trace";
import { freqToMidiFloat } from "@/lib/audio/notes";
import { detectPitch } from "@/lib/audio/pitch";
import { longestVoicedRunSec } from "@/lib/audio/voiced-run";

// Matches the live detector — see lib/audio/use-pitch.ts for why 4096. A take
// analysed in a shorter window than it was scored in would disagree with the
// score the singer already saw, and disagree worst on exactly the low notes
// this is meant to prove they hit.
const WINDOW = 4096;
const HOP = 2048;
const CLARITY_MIN = 0.75;
/** Analysis cap — long takes are truncated so the trace stays cheap. */
const MAX_ANALYZE_SEC = 180;
/** Windows per synchronous burst before yielding back to the event loop. */
const CHUNK_WINDOWS = 40;

export interface TakeAnalysis {
  points: Array<{ t: number; midi: number } | { t: number; midi: null }>;
  medianMidi: number | null;
  /** % of voiced points within ±25 cents of the nearest semitone. */
  inTunePct: number | null;
  durationSec: number;
  /** True when the take ran past the analysis cap. */
  truncated: boolean;
  /**
   * Seconds of the longest stretch the detector found a pitch on every frame
   * of. See lib/audio/voiced-run.ts for what this does and does not mean — in
   * particular it is not the absence of a register crack.
   *
   * Vibrato is deliberately absent from this summary. The hop below is 2048
   * samples, which is about 23 frames a second at 48 kHz, and
   * lib/audio/vibrato.ts will not report a rate from a trace too coarse to
   * carry the top of the vibrato band. Vibrato is measured from the live 60 fps
   * trace instead; measuring it here would mean either halving the hop for
   * every take or reporting a number the frame rate cannot support.
   */
  longestVoicedRunSec: number | null;
}

export async function analyzeTake(blob: Blob): Promise<TakeAnalysis> {
  const buffer = await decodeTakeBlob(blob);
  const sampleRate = buffer.sampleRate;
  const capSamples = Math.floor(MAX_ANALYZE_SEC * sampleRate);
  const truncated = buffer.length > capSamples;
  const length = Math.min(buffer.length, capSamples);

  let mono: Float32Array;
  if (buffer.numberOfChannels === 1) {
    const data = buffer.getChannelData(0);
    mono = data.length > length ? data.subarray(0, length) : data;
  } else {
    mono = new Float32Array(length);
    const nch = buffer.numberOfChannels;
    for (let c = 0; c < nch; c++) {
      const data = buffer.getChannelData(c);
      for (let i = 0; i < length; i++) mono[i] += data[i] / nch;
    }
  }

  const points: TakeAnalysis["points"] = [];
  const trace: F0Frame[] = [];
  const voiced: number[] = [];
  let inTune = 0;
  let burst = 0;
  for (let start = 0; start + WINDOW <= mono.length; start += HOP) {
    const t = (start + WINDOW / 2) / sampleRate;
    const result = detectPitch(mono.subarray(start, start + WINDOW), sampleRate);
    if (result && result.clarity >= CLARITY_MIN) {
      const midi = freqToMidiFloat(result.freq);
      points.push({ t, midi });
      trace.push({ t, f0: result.freq });
      voiced.push(midi);
      if (Math.abs(midi - Math.round(midi)) <= 0.25) inTune += 1;
    } else {
      points.push({ t, midi: null });
      trace.push({ t, f0: null });
    }
    burst += 1;
    if (burst >= CHUNK_WINDOWS) {
      burst = 0;
      await new Promise((resolve) => setTimeout(resolve, 0));
    }
  }

  let medianMidi: number | null = null;
  if (voiced.length > 0) {
    const sorted = [...voiced].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    medianMidi =
      sorted.length % 2 === 1 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
  }

  return {
    points,
    medianMidi,
    inTunePct:
      voiced.length > 0 ? Math.round((inTune / voiced.length) * 100) : null,
    durationSec: buffer.duration,
    truncated,
    longestVoicedRunSec: longestVoicedRunSec(trace),
  };
}
