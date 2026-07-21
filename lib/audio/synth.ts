import { getAudioContext } from "./context";
import { midiToFreq } from "./notes";

export interface ToneOptions {
  /** Seconds. */
  dur?: number;
  type?: OscillatorType;
  /** Peak gain 0..1. */
  gain?: number;
  /** Seconds from now to start. */
  at?: number;
  /** If set, glide from the tone's pitch to this midi over the duration. */
  glideToMidi?: number;
}

/**
 * Play a single reference tone (warm triangle + quiet octave shimmer).
 * Returns the offset in seconds from now at which the tone ends.
 */
export function playTone(midi: number, opts: ToneOptions = {}): number {
  const { dur = 0.7, type = "triangle", gain = 0.2, at = 0, glideToMidi } = opts;
  const ctx = getAudioContext();
  const t0 = ctx.currentTime + at;
  const freq = midiToFreq(midi);

  const out = ctx.createGain();
  out.gain.setValueAtTime(0.0001, t0);
  out.gain.exponentialRampToValueAtTime(Math.max(0.001, gain), t0 + 0.02);
  out.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  out.connect(ctx.destination);

  const osc = ctx.createOscillator();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  const shimmer = ctx.createOscillator();
  shimmer.type = "sine";
  shimmer.frequency.setValueAtTime(freq * 2, t0);
  const shimmerGain = ctx.createGain();
  shimmerGain.gain.value = 0.12;

  if (glideToMidi !== undefined) {
    const f2 = midiToFreq(glideToMidi);
    osc.frequency.exponentialRampToValueAtTime(f2, t0 + dur);
    shimmer.frequency.exponentialRampToValueAtTime(f2 * 2, t0 + dur);
  }

  osc.connect(out);
  shimmer.connect(shimmerGain).connect(out);
  osc.start(t0);
  shimmer.start(t0);
  osc.stop(t0 + dur + 0.05);
  shimmer.stop(t0 + dur + 0.05);
  return at + dur;
}

export interface SequenceOptions {
  noteDur?: number;
  gap?: number;
  type?: OscillatorType;
  gain?: number;
  /** Seconds from now to start the first note. */
  at?: number;
}

/** Play midis one after another. Returns total seconds until the last note ends. */
export function playSequence(
  midis: number[],
  opts: SequenceOptions = {},
): number {
  const { noteDur = 0.55, gap = 0.06, type, gain, at = 0 } = opts;
  let t = at;
  for (const m of midis) {
    playTone(m, { dur: noteDur, type, gain, at: t });
    t += noteDur + gap;
  }
  return t;
}

/** Sustained practice drone. Returns a stop function (with a soft release). */
export function startDrone(midi: number, gain = 0.09): () => void {
  const ctx = getAudioContext();
  const t0 = ctx.currentTime;
  const out = ctx.createGain();
  out.gain.setValueAtTime(0.0001, t0);
  out.gain.exponentialRampToValueAtTime(gain, t0 + 0.35);
  out.connect(ctx.destination);

  const freq = midiToFreq(midi);
  const oscs = [-3, 3].map((cents) => {
    const o = ctx.createOscillator();
    o.type = "sine";
    o.frequency.value = freq * Math.pow(2, cents / 1200);
    o.connect(out);
    o.start(t0);
    return o;
  });

  let stopped = false;
  return () => {
    if (stopped) return;
    stopped = true;
    const t = ctx.currentTime;
    out.gain.cancelScheduledValues(t);
    out.gain.setValueAtTime(out.gain.value, t);
    out.gain.exponentialRampToValueAtTime(0.0001, t + 0.25);
    for (const o of oscs) o.stop(t + 0.3);
  };
}

/**
 * Schedule a metronome click at an absolute AudioContext time (see audioNow()).
 * Use a lookahead loop that schedules a few clicks ahead for stable timing.
 */
export function clickAt(at: number, accent = false): void {
  const ctx = getAudioContext();
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = "sine";
  osc.frequency.value = accent ? 1660 : 1080;
  g.gain.setValueAtTime(0.0001, at);
  g.gain.exponentialRampToValueAtTime(accent ? 0.5 : 0.32, at + 0.002);
  g.gain.exponentialRampToValueAtTime(0.0001, at + 0.05);
  osc.connect(g).connect(ctx.destination);
  osc.start(at);
  osc.stop(at + 0.08);
}
