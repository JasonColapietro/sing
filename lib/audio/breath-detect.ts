/**
 * Hears an audible inhale in the microphone stream.
 *
 * Built for one job: letting a breath drill wait for the singer to breathe in
 * before it starts counting. It answers "was a breath heard, when, and for how
 * long" and nothing else. It does not measure airflow, lung volume, support or
 * anything the diaphragm is doing, and no caller may present it as if it did —
 * a loud gasp and a quiet sip through the nose are the same event here, and the
 * quiet one is often not heard at all.
 *
 * What an audible inhale is, acoustically: turbulent air through the mouth or
 * nose. No vocal-fold vibration, so no pitch and low periodicity; energy spread
 * across roughly 1 to 8 kHz rather than stacked in harmonics; quiet to
 * moderate; rising out of the room's own noise and falling back into it (or
 * giving way to the note it was taken for) within a quarter of a second to a
 * couple of seconds.
 *
 * So each frame is reduced to five numbers — level, periodicity, the power
 * below and above 1 kHz, and how flat the spectrum is above 1 kHz — and a
 * small state machine compares them against a noise floor it keeps for the
 * room. The floor is the part that makes it work in a real room. A fan has
 * exactly the spectrum of a breath; what it does not have is a beginning and
 * an end, so it becomes the floor and the breath is whatever rises above it.
 *
 * Voiced sound can never be an inhale. A frame with a confident pitch ends any
 * candidate on the spot, and a quiet hum below the pitch detector's own
 * silence floor is re-checked at normalized level rather than read as
 * unvoiced — see `breathFeatures`.
 *
 * Pure and frame-rate agnostic: every rule is in milliseconds of the
 * timestamps it is handed. `breath-detect.test.ts` has the measured rates.
 */
import { SILENCE_RMS, detectPitch } from "./pitch";

/** Samples in the spectral frame: the newest 2048 of whatever buffer is passed. */
export const BREATH_FFT_SIZE = 2048;

/** Below this the frame is the voice's territory: fundamentals and first formant. */
export const BREATH_SPLIT_HZ = 1000;
const LOW_FROM_HZ = 80;
const HIGH_TO_HZ = 8000;

/** Tunables, exported so the tests can name what they are checking. */
export const BREATH_RULES = {
  /**
   * How long the floor simply follows the room before it is trusted. Counted
   * from the first frame with any signal in it: a stream that has just opened
   * hands over a buffer of zeros that fills with the room over the next few
   * frames, and a floor learned from those zeros reads whatever is already
   * running — a fan, say — as a breath that has just begun.
   */
  warmupMs: 300,
  /** The floor falls fast (a quiet moment is always the room)… */
  floorDownTauMs: 250,
  /** …and rises slowly, so a steady source is absorbed and a breath is not. */
  floorUpTauMs: 8000,
  /** Power above 1 kHz must rise this far over its floor to start a candidate (6 dB). */
  startRise: 4,
  /** …and stay this far over it to continue one (4 dB). */
  holdRise: 2.5,
  /** Share of the new energy that must sit above 1 kHz. A vowel's sits below. */
  minHighShare: 0.6,
  /** Spectral flatness above 1 kHz. Noise is ~0.5; harmonics are near 0. */
  minFlatness: 0.2,
  /** Periodicity above which a frame cannot be breath. */
  maxClarity: 0.6,
  /** Periodicity at which a frame is voice, and ends a candidate outright. */
  voicedClarity: 0.75,
  /** Level window, RMS. Below is the room; above is not a breath. */
  minRms: 0.0015,
  maxRms: 0.2,
  /** A breath may flicker below the line this long without ending. */
  gapMs: 150,
  minInhaleMs: 250,
  maxInhaleMs: 2500,
  /** Share of a candidate's frames that must be breath-like. */
  minBreathyShare: 0.6,
  /**
   * A candidate that ends by fading must fade to within this factor of the
   * floor it rose from. One that has not is a source switching on — a fan, a
   * vent — and the floor is still catching up to it.
   */
  maxEndOverStart: 2.5,
  /** How long a candidate must have run before the live indicator lights. */
  indicatorMs: 100,
  /**
   * A breath straight into a hiss — the sustain test's other way to hold — is
   * one unbroken run of noise, and without a split it runs past maxInhaleMs
   * and is thrown out, so the gate never opens for anyone who hisses. It is
   * split where the sound steps up: louder or brighter, abruptly, and staying
   * that way. A hiss is both, next to a breath. `hissConfirmMs` is how long
   * the new sound must have held before the breath is published.
   */
  hissConfirmMs: 400,
  /** The span either side of a split compared for abruptness. */
  hissLocalMs: 150,
  /** A step up in level above 1 kHz… */
  hissStepDb: 3,
  /** …or in spectral centroid, 1–8 kHz. */
  hissStepHz: 600,
} as const;

export interface BreathFeatures {
  /** RMS of the whole buffer. */
  rms: number;
  /** Summed power, 80 Hz to 1 kHz. */
  lowPower: number;
  /** Summed power, 1 to 8 kHz. */
  highPower: number;
  /** Geometric over arithmetic mean of the power spectrum, 1 to 8 kHz, 0..1. */
  flatness: number;
  /** Power-weighted mean frequency, 1 to 8 kHz. A hiss sits higher than a breath. */
  centroidHz: number;
  /**
   * NSDF periodicity, 0..1, from `detectPitch` — or NaN on a frame too quiet
   * for the detector, until `measureClarity` is asked for it.
   */
  clarity: number;
  /** Measures a quiet frame's periodicity on demand. See `breathFeatures`. */
  measureClarity?: () => number;
}

export interface InhaleEvent {
  /** Timestamps in the caller's clock, ms: the first breath-like frame, and that plus the duration. */
  startMs: number;
  endMs: number;
  durationSec: number;
  /** True when the breath gave way to a voiced note rather than fading. */
  endedByVoice: boolean;
  /**
   * True when the breath ran straight into a hiss, split off at the step. The
   * hiss is still sounding when this is reported, `hissConfirmMs` in.
   */
  endedByHiss: boolean;
}

export interface BreathUpdate {
  /** A breath is under way right now, for a live indicator. */
  inhaling: boolean;
  /** Set on the frame an inhale is confirmed. */
  inhale: InhaleEvent | null;
  /** Why a candidate was thrown out on this frame, for the probe and tests. */
  rejected: "short" | "long" | "sparse" | "step" | null;
}

/* ------------------------------------------------------------------ *
 * Features
 * ------------------------------------------------------------------ */

const fftCache = new Map<number, { window: Float64Array; cos: Float64Array; sin: Float64Array }>();

function fftTables(n: number) {
  let t = fftCache.get(n);
  if (!t) {
    const window = new Float64Array(n);
    for (let i = 0; i < n; i++) window[i] = 0.5 - 0.5 * Math.cos((2 * Math.PI * i) / (n - 1));
    const cos = new Float64Array(n / 2);
    const sin = new Float64Array(n / 2);
    for (let i = 0; i < n / 2; i++) {
      cos[i] = Math.cos((2 * Math.PI * i) / n);
      sin[i] = -Math.sin((2 * Math.PI * i) / n);
    }
    t = { window, cos, sin };
    fftCache.set(n, t);
  }
  return t;
}

/**
 * Hann-windowed power spectrum of the newest `n` samples, bins 0..n/2-1.
 * A plain iterative radix-2 FFT; `n` must be a power of two.
 */
export function powerSpectrum(buf: Float32Array, n = BREATH_FFT_SIZE): Float64Array {
  const { window, cos, sin } = fftTables(n);
  const re = new Float64Array(n);
  const im = new Float64Array(n);
  const offset = Math.max(0, buf.length - n);
  for (let i = 0; i < n; i++) re[i] = (buf[offset + i] ?? 0) * window[i];

  for (let i = 1, j = 0; i < n; i++) {
    let bit = n >> 1;
    for (; j & bit; bit >>= 1) j ^= bit;
    j ^= bit;
    if (i < j) {
      [re[i], re[j]] = [re[j], re[i]];
      [im[i], im[j]] = [im[j], im[i]];
    }
  }
  for (let size = 2; size <= n; size <<= 1) {
    const half = size >> 1;
    const step = n / size;
    for (let start = 0; start < n; start += size) {
      for (let k = 0; k < half; k++) {
        const wr = cos[k * step];
        const wi = sin[k * step];
        const a = start + k;
        const b = a + half;
        const tr = re[b] * wr - im[b] * wi;
        const ti = re[b] * wi + im[b] * wr;
        re[b] = re[a] - tr;
        im[b] = im[a] - ti;
        re[a] += tr;
        im[a] += ti;
      }
    }
  }
  const power = new Float64Array(n / 2);
  for (let i = 0; i < n / 2; i++) power[i] = re[i] * re[i] + im[i] * im[i];
  return power;
}

/**
 * Periodicity of a frame the pitch loop has not already measured.
 *
 * Two changes from calling `detectPitch` on the frame as it stands. It is
 * scaled to a normal level first: the detector returns nothing under SILENCE_RMS,
 * which reads as clarity 0 — unvoiced — so a hum under that level would look
 * exactly like breath in the one feature meant to tell them apart. Only the
 * shape of the waveform matters to the NSDF. And it is halved in rate by
 * averaging sample pairs, which quarters the cost of the NSDF while keeping
 * every singable period whole; the detector's own 4 kHz low-pass sits well
 * inside the new Nyquist. This is a voiced-or-not decision, not a pitch
 * reading, so the resolution given up does not matter.
 */
function frameClarity(buf: Float32Array, sampleRate: number, level: number): number {
  if (level <= 0) return 0;
  const half = new Float32Array(buf.length >> 1);
  const k = 0.05 / level;
  for (let i = 0; i < half.length; i++) half[i] = (buf[2 * i] + buf[2 * i + 1]) * k;
  return detectPitch(half, sampleRate / 2)?.clarity ?? 0;
}

/**
 * One frame's features.
 *
 * `clarity` is the pitch loop's own reading, when there is one, so a live room
 * does not run the detector twice. It is only trusted at a level the detector
 * actually analyses. Otherwise it is left for `InhaleDetector` to measure, and
 * only on the frames where the answer could change anything — a rise out of
 * the room, or a breath already under way — because a full NSDF on every
 * frame of a silent room is the pitch loop's whole cost over again.
 */
export function breathFeatures(
  buf: Float32Array,
  sampleRate: number,
  clarity?: number,
): BreathFeatures {
  let sum = 0;
  for (let i = 0; i < buf.length; i++) sum += buf[i] * buf[i];
  const level = Math.sqrt(sum / Math.max(1, buf.length));

  const n = BREATH_FFT_SIZE;
  const power = powerSpectrum(buf, n);
  const hz = sampleRate / n;
  const splitBin = Math.ceil(BREATH_SPLIT_HZ / hz);
  const lowFrom = Math.ceil(LOW_FROM_HZ / hz);
  const highTo = Math.min(power.length - 1, Math.floor(HIGH_TO_HZ / hz));

  let lowPower = 0;
  for (let i = lowFrom; i < splitBin; i++) lowPower += power[i];
  let highPower = 0;
  let logSum = 0;
  let moment = 0;
  const count = highTo - splitBin + 1;
  for (let i = splitBin; i <= highTo; i++) {
    highPower += power[i];
    moment += power[i] * i * hz;
    logSum += Math.log(power[i] + 1e-20);
  }
  const mean = highPower / count;
  const flatness = mean > 0 ? Math.min(1, Math.exp(logSum / count) / mean) : 0;
  const centroidHz = highPower > 0 ? moment / highPower : 0;

  const features: BreathFeatures = {
    rms: level,
    lowPower,
    highPower,
    flatness,
    centroidHz,
    clarity: 0,
  };
  if (level >= SILENCE_RMS && clarity !== undefined) {
    features.clarity = clarity;
  } else if (level > 0) {
    // Reads the caller's buffer, which the live loop overwrites next frame.
    // `InhaleDetector.push` calls it synchronously, inside the same frame.
    features.clarity = NaN;
    features.measureClarity = () => frameClarity(buf, sampleRate, level);
  }
  return features;
}

/* ------------------------------------------------------------------ *
 * Detector
 * ------------------------------------------------------------------ */

const FLOOR_MIN = 1e-12;

interface Candidate {
  startMs: number;
  lastBreathyMs: number;
  /** The frame interval, so the last frame's own span is counted. */
  frameMs: number;
  frames: number;
  breathyFrames: number;
  /** High-band floor when the breath began, for the step check. */
  startHighFloor: number;
  overlong: boolean;
  /** Every breath-like frame so far, for finding where a hiss took over. */
  hist: { t: number; db: number; hz: number }[];
  /** A breath was split off it and published; the rest is the hiss. */
  spent: boolean;
}

function mean(xs: number[]): number {
  return xs.reduce((a, b) => a + b, 0) / xs.length;
}

/** The `q` quantile, by nearest rank. */
function quantile(xs: number[], q: number): number {
  const s = [...xs].sort((a, b) => a - b);
  return s[Math.min(s.length - 1, Math.floor(q * s.length))];
}

/**
 * Where a breath became a hiss, if it did: the first frame of the louder or
 * brighter sound, or -1.
 *
 * The step has to hold two ways. Abruptly — the span just after the split
 * against the span just before — so a breath that swells never splits. And
 * for good — nearly everything after it (its 20th percentile) against the
 * middle of everything before (its median) — so a hiss that wavers, whose
 * troughs sit where its peaks were, does not either. Not means: the breath's
 * own rise and fall are far quieter than its middle and would drag a mean
 * down into a false step. Only upward steps count: a hiss that starts loud and
 * fades is one sound, not two.
 */
const STAY_Q = 0.2;

function hissSplit(c: Candidate, nowMs: number): number {
  const R = BREATH_RULES;
  const h = c.hist;
  let best = -1;
  let bestScore = 1;
  for (let k = 1; k < h.length; k++) {
    const tk = h[k].t;
    if (tk - c.startMs < R.minInhaleMs) continue;
    // Every split whose span after is complete is weighed, so a better one
    // just behind the first to qualify is not passed over.
    if (tk - c.startMs > R.maxInhaleMs || nowMs - tk < R.hissLocalMs) break;
    // Anchored on the last frame before the split, not on the split itself:
    // a breath running into a hiss often dips for a frame or two between
    // them, and those frames are not breath-like enough to be kept.
    const before = h.slice(0, k).filter((f) => f.t > h[k - 1].t - R.hissLocalMs);
    const after = h.slice(k).filter((f) => f.t < tk + R.hissLocalMs);
    if (before.length < 2 || after.length < 2) continue;
    const A = h.slice(0, k);
    const B = h.slice(k);
    const dbLocal = mean(after.map((f) => f.db)) - mean(before.map((f) => f.db));
    const dbWhole = quantile(B.map((f) => f.db), STAY_Q) - quantile(A.map((f) => f.db), 0.5);
    const hzLocal = mean(after.map((f) => f.hz)) - mean(before.map((f) => f.hz));
    const hzWhole = quantile(B.map((f) => f.hz), STAY_Q) - quantile(A.map((f) => f.hz), 0.5);
    const score = Math.max(
      Math.min(dbLocal, dbWhole) / R.hissStepDb,
      Math.min(hzLocal, hzWhole) / R.hissStepHz,
    );
    if (score >= bestScore) {
      bestScore = score;
      best = k;
    }
  }
  // Published only once the new sound has held past the best split.
  return best >= 0 && nowMs - h[best].t >= R.hissConfirmMs ? best : -1;
}

/**
 * The inhale state machine. Feed it one frame of features per analysis frame,
 * in time order; it reports a breath once it has finished.
 */
export class InhaleDetector {
  private lowFloor = 0;
  private highFloor = 0;
  private firstMs: number | null = null;
  private lastMs = 0;
  private cand: Candidate | null = null;

  reset(): void {
    this.lowFloor = 0;
    this.highFloor = 0;
    this.firstMs = null;
    this.lastMs = 0;
    this.cand = null;
  }

  /** The room's floor above 1 kHz, for tests and diagnostics. */
  get floor(): number {
    return this.highFloor;
  }

  push(f: BreathFeatures, tMs: number): BreathUpdate {
    const R = BREATH_RULES;
    const idle: BreathUpdate = { inhaling: false, inhale: null, rejected: null };
    if (this.firstMs === null) {
      // Digital silence is a stream that has not started, not a quiet room.
      if (f.rms === 0) return idle;
      this.firstMs = tMs;
    }
    const dt = Math.max(0, tMs - this.lastMs);
    this.lastMs = tMs;
    if (tMs - this.firstMs < R.warmupMs) {
      this.lowFloor = Math.max(FLOOR_MIN, f.lowPower);
      this.highFloor = Math.max(FLOOR_MIN, f.highPower);
      return idle;
    }

    // Judged against the floor as it stood before this frame moved it.
    const hiRise = f.highPower / this.highFloor;
    const excessHigh = Math.max(0, f.highPower - this.highFloor);
    const excessLow = Math.max(0, f.lowPower - this.lowFloor);
    const share = excessHigh + excessLow > 0 ? excessHigh / (excessHigh + excessLow) : 0;
    const spectral =
      f.rms >= R.minRms &&
      f.rms <= R.maxRms &&
      f.flatness >= R.minFlatness &&
      share >= R.minHighShare &&
      hiRise >= R.holdRise;
    // A quiet frame's periodicity is only worth an NSDF when it could decide
    // something: a frame that might be breath, one inside a breath (a voice
    // ends it), or one that has risen out of the room (a voice keeps the floor
    // where it is). Everything else is the room.
    let clarity = f.clarity;
    if (Number.isNaN(clarity)) {
      const risen =
        f.highPower >= this.highFloor * R.holdRise || f.lowPower >= this.lowFloor * R.holdRise;
      const matters = spectral || risen || this.cand !== null;
      clarity = matters && f.measureClarity ? f.measureClarity() : 0;
    }
    const voiced = clarity >= R.voicedClarity;
    const breathLike = spectral && !voiced && clarity < R.maxClarity;
    const starts = breathLike && hiRise >= R.startRise;
    const holds = breathLike;

    this.track(f, dt, voiced);

    let out: BreathUpdate = { inhaling: false, inhale: null, rejected: null };
    const c = this.cand;
    if (!c) {
      if (starts) {
        this.cand = {
          startMs: tMs,
          lastBreathyMs: tMs,
          frameMs: dt,
          frames: 1,
          breathyFrames: 1,
          startHighFloor: this.highFloor,
          overlong: false,
          hist: [{ t: tMs, db: 10 * Math.log10(f.highPower + 1e-20), hz: f.centroidHz }],
          spent: false,
        };
      }
    } else if (voiced) {
      out = this.close(c, f, share, true);
    } else {
      c.frames++;
      if (holds) {
        c.breathyFrames++;
        c.lastBreathyMs = tMs;
        c.frameMs = dt;
        if (!c.spent && !c.overlong) {
          c.hist.push({ t: tMs, db: 10 * Math.log10(f.highPower + 1e-20), hz: f.centroidHz });
          const k = tMs - c.startMs >= R.minInhaleMs + R.hissConfirmMs ? hissSplit(c, tMs) : -1;
          if (k > 0 && c.breathyFrames / c.frames >= R.minBreathyShare) {
            // The breath is everything before the step; the hiss goes on.
            c.spent = true;
            const endMs = c.hist[k].t;
            out = {
              inhaling: false,
              rejected: null,
              inhale: {
                startMs: c.startMs,
                endMs,
                durationSec: (endMs - c.startMs) / 1000,
                endedByVoice: false,
                endedByHiss: true,
              },
            };
          }
        }
      }
      if (!c.overlong && tMs - c.startMs > R.maxInhaleMs) {
        // Too long for a breath: a hiss, a vent, a fan being switched on. Take
        // the room as it now is, so whatever it was stops holding the gate.
        c.overlong = true;
        this.lowFloor = Math.max(FLOOR_MIN, f.lowPower);
        this.highFloor = Math.max(FLOOR_MIN, f.highPower);
      }
      if (tMs - c.lastBreathyMs > R.gapMs) out = this.close(c, f, share, false);
    }
    if (this.cand) {
      out.inhaling =
        !this.cand.overlong && !this.cand.spent && tMs - this.cand.startMs >= R.indicatorMs;
    }
    return out;
  }

  private close(c: Candidate, f: BreathFeatures, share: number, byVoice: boolean): BreathUpdate {
    const R = BREATH_RULES;
    this.cand = null;
    // First to last breath-like frame, plus the span the last one stands for:
    // a breath heard on two frames 33 ms apart lasted 66 ms, not 33.
    const durationMs = c.lastBreathyMs - c.startMs + c.frameMs;
    const none = { inhaling: false, inhale: null };
    // Its breath has already been published; this is the hiss ending.
    if (c.spent) return { ...none, rejected: null };
    if (c.overlong || durationMs > R.maxInhaleMs) return { ...none, rejected: "long" };
    if (durationMs < R.minInhaleMs) return { ...none, rejected: "short" };
    if (c.breathyFrames / c.frames < R.minBreathyShare) return { ...none, rejected: "sparse" };
    // Still loud above 1 kHz, and still noise-shaped: the source is running
    // and the floor is catching up. Loud because a note is starting — its new
    // energy below 1 kHz, not yet periodic enough to count as voiced — is a
    // breath ending the way breaths do. Found in the browser, where a vowel's
    // first frames closed the breath before it and read as a step.
    const stillNoise = share >= R.minHighShare;
    if (!byVoice && stillNoise && f.highPower > c.startHighFloor * R.maxEndOverStart) {
      return { ...none, rejected: "step" };
    }
    return {
      inhaling: false,
      rejected: null,
      inhale: {
        startMs: c.startMs,
        endMs: c.startMs + durationMs,
        durationSec: durationMs / 1000,
        endedByVoice: byVoice,
        endedByHiss: false,
      },
    };
  }

  /** Asymmetric floor: quick to fall, slow to rise, and never raised by a voice. */
  private track(f: BreathFeatures, dt: number, voiced: boolean): void {
    const R = BREATH_RULES;
    const move = (floor: number, v: number) => {
      if (v < floor) return floor + (v - floor) * (1 - Math.exp(-dt / R.floorDownTauMs));
      if (voiced) return floor;
      return floor + (v - floor) * (1 - Math.exp(-dt / R.floorUpTauMs));
    };
    this.lowFloor = Math.max(FLOOR_MIN, move(this.lowFloor, f.lowPower));
    this.highFloor = Math.max(FLOOR_MIN, move(this.highFloor, f.highPower));
  }
}

/**
 * Runs the detector over a whole signal the way a live room would: a
 * `frameSize` window ending at each hop, timestamped at its newest sample.
 * For tests and offline analysis.
 */
export function detectInhales(
  signal: Float32Array,
  sampleRate: number,
  opts: { frameSize?: number; hopSec?: number } = {},
): { events: InhaleEvent[]; rejected: BreathUpdate["rejected"][]; inhalingFrames: number } {
  const frameSize = opts.frameSize ?? 4096;
  const hop = Math.max(1, Math.round((opts.hopSec ?? 1 / 60) * sampleRate));
  const det = new InhaleDetector();
  const events: InhaleEvent[] = [];
  const rejected: BreathUpdate["rejected"][] = [];
  let inhalingFrames = 0;
  for (let end = frameSize; end <= signal.length; end += hop) {
    const frame = signal.subarray(end - frameSize, end);
    const u = det.push(breathFeatures(frame, sampleRate), (end / sampleRate) * 1000);
    if (u.inhale) events.push(u.inhale);
    if (u.rejected) rejected.push(u.rejected);
    if (u.inhaling) inhalingFrames++;
  }
  return { events, rejected, inhalingFrames };
}
