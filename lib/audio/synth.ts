import { getAudioContext, getOutput } from "./context";
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
  /** Where the tone connects. Defaults to the shared context destination. */
  out?: AudioNode;
}

/**
 * Harmonic recipe for the reference tone, a warm piano-organ blend rather
 * than a triangle. A triangle's overtones fall off as 1/n^2, so a C3
 * reference put almost all its energy at 130 Hz, which a phone speaker cannot
 * reproduce, and the note vanished. With real energy up through the 10th
 * harmonic the ear still hears the fundamental (the missing-fundamental
 * effect), so the pitch is identical and the note is audible on any speaker.
 */
const TONE_HARMONICS = [0, 1, 0.82, 0.56, 0.44, 0.32, 0.24, 0.17, 0.12, 0.08, 0.05];

const waves = new WeakMap<BaseAudioContext, PeriodicWave>();

function referenceWave(ctx: AudioContext): PeriodicWave {
  let wave = waves.get(ctx);
  if (!wave) {
    const imag = new Float32Array(TONE_HARMONICS);
    wave = ctx.createPeriodicWave(new Float32Array(imag.length), imag);
    waves.set(ctx, wave);
  }
  return wave;
}

/** Output level of the reference tone relative to the gain a caller asks for. */
const TONE_LEVEL = 1.6;
/** Two voices a hair apart give the tone body without audible wobble. */
const DETUNE_CENTS = 3;

/**
 * Play a single reference tone. The default timbre is a warm, piano-like
 * voice: a bright strike whose top end mellows within a quarter second, then a
 * steady sustain so a held guide note stays audible to the end. Passing `type`
 * asks for a plain oscillator instead.
 * Returns the offset in seconds from now at which the tone ends.
 */
export function playTone(midi: number, opts: ToneOptions = {}): number {
  const { dur = 0.7, type, gain = 0.2, at = 0, glideToMidi } = opts;
  const ctx = getAudioContext();
  const t0 = ctx.currentTime + at;
  const freq = midiToFreq(midi);
  const peak = Math.max(0.001, gain * TONE_LEVEL);

  // Amplitude: quick strike, settle to a sustain, short release at the end.
  const attackEnd = t0 + Math.min(0.012, dur / 4);
  const settleEnd = t0 + Math.min(0.3, dur / 2);
  const releaseStart = Math.max(settleEnd, t0 + dur - 0.09);
  const out = ctx.createGain();
  out.gain.setValueAtTime(0.0001, t0);
  out.gain.exponentialRampToValueAtTime(peak, attackEnd);
  out.gain.exponentialRampToValueAtTime(peak * 0.72, settleEnd);
  out.gain.setValueAtTime(peak * 0.72, releaseStart);
  out.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  out.connect(opts.out ?? getOutput());

  // Brightness: opens on the strike, mellows to a warm sustain that still
  // keeps the harmonics a phone speaker plays.
  const tone = ctx.createBiquadFilter();
  tone.type = "lowpass";
  tone.Q.value = 0.6;
  tone.frequency.setValueAtTime(Math.min(7000, Math.max(3500, freq * 12)), t0);
  tone.frequency.exponentialRampToValueAtTime(
    Math.min(4000, Math.max(1600, freq * 5)),
    settleEnd,
  );
  tone.connect(out);

  const voices = type ? [0] : [-DETUNE_CENTS, DETUNE_CENTS];
  const voiceGain = ctx.createGain();
  voiceGain.gain.value = 1 / voices.length;
  voiceGain.connect(tone);
  for (const cents of voices) {
    const osc = ctx.createOscillator();
    if (type) osc.type = type;
    else osc.setPeriodicWave(referenceWave(ctx));
    osc.detune.value = cents;
    osc.frequency.setValueAtTime(freq, t0);
    if (glideToMidi !== undefined) {
      osc.frequency.exponentialRampToValueAtTime(midiToFreq(glideToMidi), t0 + dur);
    }
    osc.connect(voiceGain);
    osc.start(t0);
    osc.stop(t0 + dur + 0.05);
  }
  return at + dur;
}

export interface SequenceOptions {
  noteDur?: number;
  gap?: number;
  type?: OscillatorType;
  gain?: number;
  /** Seconds from now to start the first note. */
  at?: number;
  /** Where every note connects. Defaults to the shared context destination. */
  out?: AudioNode;
}

/** Play midis one after another. Returns total seconds until the last note ends. */
export function playSequence(
  midis: number[],
  opts: SequenceOptions = {},
): number {
  const { noteDur = 0.55, gap = 0.06, type, gain, at = 0, out } = opts;
  let t = at;
  for (const m of midis) {
    playTone(m, { dur: noteDur, type, gain, at: t, out });
    t += noteDur + gap;
  }
  return t;
}

/**
 * A set of scheduled tones that can be silenced together.
 *
 * Nothing in this module could previously un-schedule a sound. Every tone is
 * committed to the audio clock at the moment it is scheduled, so a guide melody
 * kept sounding through a transpose, a tempo change, a skipped rung and an exit
 * back to the library. That is survivable while the guide only ever plays into
 * silence; it is a scoring bug the moment a guide sounds under the voice, because
 * a stale group at the previous root is then bleeding into a scored take.
 */
export interface ToneGroup {
  /** Pass as `out` to playTone/playSequence to route a tone into this group. */
  readonly node: GainNode;
  /** True once cancel() has run. */
  readonly cancelled: boolean;
  /** Silence the group over 40 ms, including tones scheduled to start later. */
  cancel(): void;
}

export function createToneGroup(): ToneGroup {
  const ctx = getAudioContext();
  const node = ctx.createGain();
  node.gain.setValueAtTime(1, ctx.currentTime);
  node.connect(getOutput());
  let cancelled = false;
  return {
    node,
    get cancelled() {
      return cancelled;
    },
    cancel() {
      if (cancelled) return;
      cancelled = true;
      const t = ctx.currentTime;
      node.gain.cancelScheduledValues(t);
      node.gain.setValueAtTime(node.gain.value, t);
      node.gain.linearRampToValueAtTime(0, t + 0.04);
      // The gain stays at zero rather than disconnecting immediately: tones
      // already scheduled ramp their own envelopes through this node and each
      // stops itself at t0 + dur + 0.05. Five seconds clears the longest tone
      // this app schedules (an octave siren at 0.75x is 3.2 s).
      setTimeout(() => node.disconnect(), 5000);
    },
  };
}

/** Sustained practice drone. Returns a stop function (with a soft release). */
export function startDrone(midi: number, gain = 0.09): () => void {
  const ctx = getAudioContext();
  const t0 = ctx.currentTime;
  const out = ctx.createGain();
  out.gain.setValueAtTime(0.0001, t0);
  out.gain.exponentialRampToValueAtTime(gain, t0 + 0.35);
  out.connect(getOutput());

  const droneTone = ctx.createBiquadFilter();
  droneTone.type = "lowpass";
  droneTone.frequency.value = 3000;
  droneTone.connect(out);

  const freq = midiToFreq(midi);
  const oscs = [-3, 3].map((cents) => {
    const o = ctx.createOscillator();
    // Same harmonic series as the reference tone, so a low drone is audible
    // on a phone speaker, and a little quieter per voice since there are two.
    o.setPeriodicWave(referenceWave(ctx));
    o.frequency.value = freq * Math.pow(2, cents / 1200);
    o.connect(droneTone);
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
 * `out` routes the click through a ToneGroup so a cancelled rep silences its
 * count-in along with its guide.
 */
export function clickAt(at: number, accent = false, out?: AudioNode): void {
  const ctx = getAudioContext();
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = "sine";
  osc.frequency.value = accent ? 1660 : 1080;
  g.gain.setValueAtTime(0.0001, at);
  g.gain.exponentialRampToValueAtTime(accent ? 0.5 : 0.32, at + 0.002);
  g.gain.exponentialRampToValueAtTime(0.0001, at + 0.05);
  osc.connect(g).connect(out ?? getOutput());
  osc.start(at);
  osc.stop(at + 0.08);
}
