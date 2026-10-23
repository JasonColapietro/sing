export interface PitchResult {
  freq: number;
  /** 0..1, normalized autocorrelation peak. Above ~0.8 is a confident voiced frame. */
  clarity: number;
}

/**
 * Time-domain pitch detector for the human voice, using the normalized square
 * difference function (McLeod & Wyvill) with parabolic interpolation. Rejects
 * frames quieter than a small RMS floor and frequencies outside C2–1600 Hz.
 *
 * The normalization is the whole point, and it replaced a raw autocorrelation
 * that could not measure a low male voice at all.
 *
 * A raw autocorrelation sums fewer and fewer overlapping terms as the lag
 * grows, so for a perfectly periodic signal `c[T] ≈ c[0]·(1 − T/size)`. When
 * clarity is read off as `c[T]/c[0]` it therefore decays with the lag itself,
 * and the caller's fixed `clarity >= 0.75` gate silently becomes a
 * *frequency* gate at `4·sampleRate/size`, 93.9 Hz for the 2048-sample frames
 * every practice room uses at 48 kHz. Measured against that: E2 at 82.4 Hz,
 * the note that defines the bottom of a bass, scored 0.714 and was discarded
 * as unvoiced no matter how cleanly it was sung. The range test then fell back
 * to the warm-up anchor and told a bass his lowest note was A3.
 *
 * The NSDF divides by the energy actually present in each lag's overlap
 * instead, so a perfectly periodic frame scores ~1.0 at every period from the
 * shortest to the longest, and clarity means "how periodic is this" rather
 * than "how high is this".
 *
 * Peak choice changes with it. The old taper suppressed sub-octave lags for
 * free: `c[2T]` was always smaller than `c[T]`, so taking the largest value
 * in range was safe. Normalized, `n[2T] ≈ n[T]`, and the largest value is as
 * likely to be the octave below as the true period. Hence McLeod's rule: take
 * the *first* peak that comes within `PEAK_TOLERANCE` of the best one, which
 * is the shortest period that explains the signal.
 *
 * Every lag's NSDF numerator, the sum of x[j]·x[j+lag] over the window, comes
 * from one FFT autocorrelation. The trimmed, filtered window is zero-padded
 * to a power of two at least as long as the window plus the longest lag read,
 * so the circular correlation never wraps into a lag that matters; it is
 * transformed, squared in magnitude and transformed back. Everything after
 * that is the full scan's code unchanged: the energy normalization, the walk
 * off the initial descent, McLeod's first-peak rule, the hum check, the
 * parabola and the range check.
 *
 * The readings are the direct sum's, bit for bit, and this is why. The FFT
 * value and the direct sum each differ from the exact sum by rounding only,
 * and `n` is stored as a Float32, whose steps are tens of thousands of times
 * coarser than the bound on either error for a value the size of a peak. So
 * for each lag the FFT value is widened by the worst-case error of both
 * computations, and if the whole interval rounds to one Float32, the direct
 * sum would have stored that same Float32, because rounding is monotone.
 * When the interval straddles a rounding boundary, that lag is summed
 * directly with the full scan's own arithmetic. That happens on about one
 * voiced frame in five, for one lag, and on every lag of a stretch where the
 * correlation is exactly zero (a short burst in a silent frame): the direct
 * sum gives exact zeros there and the FFT gives round-off near 1e-16, and
 * without the check such a frame reads a spurious peak in the round-off.
 *
 * The weak point is the error bound itself. It rests on the standard error
 * model for a radix-2 FFT (Higham, Accuracy and Stability of Numerical
 * Algorithms, chapter 24) with twiddles accurate to the last bit or so, taken
 * at several times the per-stage error that model gives, rather than on a
 * proof written for this code. Measured on synthetic frames, the largest FFT
 * error was about 160 times smaller than the bound. `pitch-fft.test.ts`
 * keeps a copy of the full scan and checks bitwise equality on a few thousand
 * frames.
 *
 * Cost: about 0.3 ms per 4096-sample frame at 48 kHz in Node, against 5.8 ms
 * for the direct sums over the ~700 lags the full scan computed. The FFT
 * costs the same whatever the signal, so a frame of room noise is as cheap as
 * a clean vowel.
 *
 * An AMDF coarse search was tried first: it found candidate lags on a
 * decimated copy of the window and computed the NSDF only around them. It was
 * faster than the full scan on voiced frames, but it missed the true period
 * on some high notes and on frames with clicks, and it gained little on
 * noise, so its readings could not be guaranteed. `pitch-regressions.test.ts`
 * keeps the frames it misread.
 */
/** The live rooms and native apps all start at C2. */
export const MIN_FREQ = 65;
export const MAX_FREQ = 1600;

/**
 * Search this far below C2 when checking a candidate's integer multiples.
 * That makes the 50/60 Hz fundamental of mains hum visible even when its
 * louder 100/120 Hz harmonic is the first reportable peak.
 */
export const SUBRANGE_FLOOR_HZ = 40;
// Windowing and broadband room noise can shift the fundamental peak a few
// percent away from the exact multiple of the initially selected harmonic.
export const SUBRANGE_SEARCH_RATIO = 0.03;
// Hum's hidden fundamental improves clarity by about 0.03; repeated periods
// of a real low note remain nearly equal. Keep enough separation between them.
export const SUBRANGE_MARGIN = 0.02;
export const SUBRANGE_MIN_CLARITY = 0.8;

/**
 * How close to the best peak a shorter-period peak has to be to win.
 *
 * Too high and a slightly imperfect true period loses to its own sub-octave;
 * too low and a half-frequency artefact wins outright. 0.9 is McLeod's
 * recommendation and it holds up across the vowel frames in the tests.
 */
export const PEAK_TOLERANCE = 0.9;

/**
 * Corner of the low-pass applied before analysis.
 *
 * Voice pitch lives in the fundamental and the first few harmonics; above a
 * few kHz a microphone mostly delivers room hiss, and in the NSDF that hiss
 * lands as random error on the peak the parabola is fitted to. Measured on
 * the synthetic vowels in pitch-precision.test.ts, filtering at 4 kHz took a
 * 10 dB SNR frame's p95 error from 16 c to 1.4 c and the misses at 5 dB SNR
 * from 83 of 294 frames to none. The price is ~0.2 c on a clean frame. 4 kHz
 * still passes the top fundamental (1600 Hz) and its second harmonic; 3 kHz
 * was slightly better in noise and slightly worse clean, and nothing between
 * them is worth tuning to a synthetic signal.
 */
export const LOWPASS_HZ = 4000;

/**
 * RMS below which a frame is silence and returns no pitch. Judged on the raw
 * frame, before the low-pass, so filtering never changes which frames count
 * as quiet.
 */
export const SILENCE_RMS = 0.01;

/**
 * Edge trim. From each end of the filtered frame, the analysis window starts
 * at the first sample whose magnitude is below this. It changes which samples
 * the NSDF sees, so a port has to use the same value to read the same peak.
 */
export const TRIM_THRESHOLD = 0.2;

/** A trimmed window shorter than this many samples reads as no pitch. */
export const MIN_WINDOW_SAMPLES = 128;

/**
 * The clarity a reading needs before the live hooks trust it. Below this the
 * frame is treated as unvoiced and the median history is cleared.
 */
export const DEFAULT_CLARITY_THRESHOLD = 0.75;

/**
 * Second-order Butterworth low-pass (RBJ biquad), into a new buffer.
 *
 * The caller's frame is left untouched: every room reads the same analyser
 * buffer for its level meter as well.
 */
function lowpass(x: Float32Array, sampleRate: number, cornerHz: number): Float32Array {
  const w = (2 * Math.PI * cornerHz) / sampleRate;
  const alpha = Math.sin(w) / (2 * Math.SQRT1_2);
  const cos = Math.cos(w);
  const a0 = 1 + alpha;
  const b0 = (1 - cos) / 2 / a0;
  const b1 = (1 - cos) / a0;
  const a1 = (-2 * cos) / a0;
  const a2 = (1 - alpha) / a0;
  const y = new Float32Array(x.length);
  let x1 = 0;
  let x2 = 0;
  let y1 = 0;
  let y2 = 0;
  for (let i = 0; i < x.length; i++) {
    const v = b0 * x[i] + b1 * x1 + b0 * x2 - a1 * y1 - a2 * y2;
    x2 = x1;
    x1 = x[i];
    y2 = y1;
    y1 = v;
    y[i] = v;
  }
  return y;
}

/**
 * Twiddles, bit reversal and scratch for one transform length, built once
 * and reused for every frame of that length. A real transform of length `N`
 * runs as a complex one of length `M = N / 2`.
 */
interface FftPlan {
  N: number;
  M: number;
  /** Bit reversal of 0..M−1. */
  rev: Uint32Array;
  /** e^{iπj/h} at index h + j, for each stage half-length h. */
  twr: Float64Array;
  twi: Float64Array;
  /** e^{2πik/N} for k = 0..M, for packing and unpacking the real transform. */
  cosN: Float64Array;
  sinN: Float64Array;
  re: Float64Array;
  im: Float64Array;
  /** |X[k]|² for k = 0..M. */
  power: Float64Array;
  /** The autocorrelation, r[lag] for lag < N. */
  r: Float64Array;
}

const fftPlans = new Map<number, FftPlan>();

function fftPlan(N: number): FftPlan {
  const cached = fftPlans.get(N);
  if (cached) return cached;
  const M = N >> 1;
  let bits = 0;
  while (1 << bits < M) bits++;
  const rev = new Uint32Array(M);
  for (let i = 0; i < M; i++) {
    let r = 0;
    for (let b = 0; b < bits; b++) if (i & (1 << b)) r |= 1 << (bits - 1 - b);
    rev[i] = r;
  }
  // Each twiddle is computed directly rather than by recurrence, so each is
  // as accurate as Math.cos and Math.sin, which the error bound assumes.
  const twr = new Float64Array(Math.max(2, M));
  const twi = new Float64Array(Math.max(2, M));
  for (let h = 1; h < M; h <<= 1) {
    for (let j = 0; j < h; j++) {
      twr[h + j] = Math.cos((Math.PI * j) / h);
      twi[h + j] = Math.sin((Math.PI * j) / h);
    }
  }
  const cosN = new Float64Array(M + 1);
  const sinN = new Float64Array(M + 1);
  for (let k = 0; k <= M; k++) {
    cosN[k] = Math.cos((2 * Math.PI * k) / N);
    sinN[k] = Math.sin((2 * Math.PI * k) / N);
  }
  const plan: FftPlan = {
    N,
    M,
    rev,
    twr,
    twi,
    cosN,
    sinN,
    re: new Float64Array(M),
    im: new Float64Array(M),
    power: new Float64Array(M + 1),
    r: new Float64Array(N),
  };
  fftPlans.set(N, plan);
  return plan;
}

/**
 * In-place radix-2 complex FFT of the plan's `re`/`im`, which the caller has
 * already written in bit-reversed order. `sign` is −1 forward, +1 inverse
 * (unscaled). Two butterfly stages are done per pass over the data: the same
 * butterflies as one stage at a time, with half the loads and stores.
 */
function fft(plan: FftPlan, sign: number): void {
  const { M, twr, twi, re, im } = plan;
  let stages = 0;
  while (1 << stages < M) stages++;
  let h = 1;
  if (stages & 1) {
    // One stage on its own (all twiddles 1), so the rest pair up.
    for (let a = 0; a < M; a += 2) {
      const b = a + 1;
      const xr = re[b];
      const xi = im[b];
      re[b] = re[a] - xr;
      im[b] = im[a] - xi;
      re[a] += xr;
      im[a] += xi;
    }
    h = 2;
  }
  for (; 4 * h <= M; h *= 4) {
    const len = 4 * h;
    for (let j = 0; j < h; j++) {
      const w1r = twr[h + j];
      const w1i = sign * twi[h + j];
      const w2r = twr[2 * h + j];
      const w2i = sign * twi[2 * h + j];
      for (let p0 = j; p0 < M; p0 += len) {
        const p1 = p0 + h;
        const p2 = p1 + h;
        const p3 = p2 + h;
        const x0r = re[p0];
        const x0i = im[p0];
        const x2r = re[p2];
        const x2i = im[p2];
        // Stage with half-length h: (p0, p1) and (p2, p3), twiddle w1.
        let tr = re[p1] * w1r - im[p1] * w1i;
        let ti = re[p1] * w1i + im[p1] * w1r;
        const y0r = x0r + tr;
        const y0i = x0i + ti;
        const y1r = x0r - tr;
        const y1i = x0i - ti;
        tr = re[p3] * w1r - im[p3] * w1i;
        ti = re[p3] * w1i + im[p3] * w1r;
        const y2r = x2r + tr;
        const y2i = x2i + ti;
        const y3r = x2r - tr;
        const y3i = x2i - ti;
        // Stage with half-length 2h: (p0, p2) with w2, and (p1, p3) with w2
        // turned a quarter, which multiplying by ±i does exactly.
        tr = y2r * w2r - y2i * w2i;
        ti = y2r * w2i + y2i * w2r;
        re[p0] = y0r + tr;
        im[p0] = y0i + ti;
        re[p2] = y0r - tr;
        im[p2] = y0i - ti;
        const ur = y3r * w2r - y3i * w2i;
        const ui = y3r * w2i + y3i * w2r;
        tr = -sign * ui;
        ti = sign * ur;
        re[p1] = y1r + tr;
        im[p1] = y1i + ti;
        re[p3] = y1r - tr;
        im[p3] = y1i - ti;
      }
    }
  }
}

/**
 * The autocorrelation of the `size` samples of `buf` from `r1`, zero-padded to
 * `N`: `r[lag]` is the sum of buf[r1 + j]·buf[r1 + j + lag] for every lag up
 * to N − size. Returns the plan's buffer, which the next call overwrites.
 *
 * The real window is packed as z[n] = x[2n] + i·x[2n+1] into one complex
 * transform of length N/2, unpacked into X[k] for k = 0..N/2, and |X[k]|² is
 * packed the same way for the inverse, which then yields r[2n] + i·r[2n+1].
 */
function autocorrelate(buf: Float32Array, r1: number, size: number, N: number): Float64Array {
  const plan = fftPlan(N);
  const { M, rev, cosN, sinN, re, im, power, r } = plan;
  const pairs = size >> 1;
  for (let k = 0; k < pairs; k++) {
    const q = rev[k];
    re[q] = buf[r1 + 2 * k];
    im[q] = buf[r1 + 2 * k + 1];
  }
  if (size & 1) {
    const q = rev[pairs];
    re[q] = buf[r1 + size - 1];
    im[q] = 0;
  }
  for (let k = (size + 1) >> 1; k < M; k++) {
    const q = rev[k];
    re[q] = 0;
    im[q] = 0;
  }
  fft(plan, -1);

  // X[k] = (Z[k] + conj Z[M−k]) / 2 + e^{−2πik/N}·(Z[k] − conj Z[M−k]) / 2i.
  for (let k = 0; k <= M; k++) {
    const ka = k === M ? 0 : k;
    const kb = k === 0 ? 0 : M - k;
    const ar = re[ka];
    const ai = im[ka];
    const br = re[kb];
    const bi = -im[kb];
    const er = 0.5 * (ar + br);
    const ei = 0.5 * (ai + bi);
    const or = 0.5 * (ai - bi);
    const oi = -0.5 * (ar - br);
    const c = cosN[k];
    const s = -sinN[k];
    const xr = er + or * c - oi * s;
    const xi = ei + or * s + oi * c;
    power[k] = xr * xr + xi * xi;
  }

  // The power spectrum is real and even, so the inverse packs as
  // Y[k] = (P[k] + P[M−k]) + i·(P[k] − P[M−k])·e^{2πik/N}.
  for (let k = 0; k < M; k++) {
    const e = power[k] + power[M - k];
    const d = power[k] - power[M - k];
    const q = rev[k];
    re[q] = e - d * sinN[k];
    im[q] = d * cosN[k];
  }
  fft(plan, 1);
  const scale = 1 / N;
  for (let k = 0; k < M; k++) {
    r[2 * k] = re[k] * scale;
    r[2 * k + 1] = im[k] * scale;
  }
  return r;
}

/**
 * The most an FFT autocorrelation value can differ from the exact sum, in
 * units of 2^-53 times the window's energy, for a transform of length `N`.
 *
 * In the standard model a radix-2 butterfly stage adds a relative error of
 * about 6 to 8 units in the 2-norm with accurate twiddles; 32 is used here,
 * over the log2(N/2) stages plus two for the packing and unpacking. Call the
 * total `a`. The forward transform's error then moves the power spectrum by
 * at most (2a + a² + 2)·N·energy summed over all N bins, which is at most
 * (2a + a² + 2)·energy on any one lag after the inverse. The inverse's own
 * error is bounded per output (each output depends on each input through one
 * chain of unit-size twiddles) by about a times the sum of its inputs, which
 * is 2·N·energy, so 2a·energy after the 1/N. The a² term is negligible.
 */
function fftErrorUnits(N: number): number {
  const a = 32 * (Math.log2(N >> 1) + 2);
  return 2 * a + 2 + 2 * a * 1.01 + 16;
}

const ROUNDOFF = 2 ** -53;

let directSums = 0;

/**
 * How many lags have been summed directly since the module loaded, because
 * their FFT value sat too close to a Float32 rounding boundary to settle the
 * stored value. For tests.
 */
export function nsdfDirectSums(): number {
  return directSums;
}

export function detectPitch(
  input: Float32Array,
  sampleRate: number,
): PitchResult | null {
  const SIZE = input.length;
  // The silence floor is judged on the raw frame, so filtering never changes
  // which frames count as quiet.
  let rms = 0;
  for (let i = 0; i < SIZE; i++) rms += input[i] * input[i];
  rms = Math.sqrt(rms / SIZE);
  if (rms < SILENCE_RMS) return null;
  const buf =
    sampleRate > 2 * LOWPASS_HZ ? lowpass(input, sampleRate, LOWPASS_HZ) : input;

  // Trim leading/trailing low-energy samples so the correlation focuses on
  // the voiced middle of the frame.
  let r1 = 0;
  let r2 = SIZE - 1;
  for (let i = 0; i < SIZE / 2; i++) {
    if (Math.abs(buf[i]) < TRIM_THRESHOLD) {
      r1 = i;
      break;
    }
  }
  for (let i = 1; i < SIZE / 2; i++) {
    if (Math.abs(buf[SIZE - i]) < TRIM_THRESHOLD) {
      r2 = SIZE - i;
      break;
    }
  }
  const size = r2 - r1;
  if (size < MIN_WINDOW_SAMPLES) return null;

  // Cumulative energy, so each lag's overlap energy is two lookups rather than
  // its own inner loop: `energy[k]` is the sum of squares of the first k
  // samples of the trimmed window.
  const energy = new Float32Array(size + 1);
  let windowEnergy = 0;
  for (let i = 0; i < size; i++) {
    const x = buf[r1 + i];
    energy[i + 1] = energy[i] + x * x;
    windowEnergy += x * x;
  }
  const total = energy[size];
  if (total <= 0) return null;

  // Only lags that correspond to a singable pitch are candidates. Searching
  // every lag and rejecting the answer afterwards throws the whole frame away
  // whenever noise wins the peak at some implausible lag, which is what a
  // normal room, or the browser's own capture and resampling path, reliably
  // produces. The note is audible and on pitch; the detector was just looking
  // outside the range it was going to accept anyway.
  const minLag = Math.max(1, Math.floor(sampleRate / MAX_FREQ));
  const maxLag = Math.min(size - 1, Math.ceil(sampleRate / MIN_FREQ));
  const analysisMaxLag = Math.min(
    size - 1,
    Math.ceil(sampleRate / SUBRANGE_FLOOR_HZ),
  );
  if (maxLag <= minLag) return null;

  // Every lag's numerator at once, by FFT. The longest lag the full scan could
  // read is analysisMaxLag + 1, and none at or past the window's end; padding
  // to at least the window plus that lag keeps the circular correlation from
  // wrapping into any of them.
  const lastLag = Math.min(analysisMaxLag + 1, size - 1);
  let N = 2;
  while (N < size + lastLag) N <<= 1;
  const r = autocorrelate(buf, r1, size, N);
  // Absolute error allowances for the guard below: the FFT's, and how far the
  // Float32 running sum can put the overlap energy `m` from the exact energy
  // of the two halves it stands for.
  const fftError = fftErrorUnits(N) * ROUNDOFF * windowEnergy * 1.01;
  const energyError = 2 * size * 2 ** -24 * windowEnergy * 1.01;

  // The normalized square difference function over the candidate lags. Lags
  // are filled in lazily, exactly the ones the full scan computed: the
  // singable range, and below C2 only around an integer multiple that could
  // expose a hidden hum fundamental.
  const n = new Float32Array(analysisMaxLag + 2);
  const computed = new Uint8Array(analysisMaxLag + 2);
  const computeLag = (lag: number) => {
    if (lag < minLag || lag > analysisMaxLag + 1 || lag >= size) return;
    if (computed[lag]) return;
    computed[lag] = 1;
    // Energy under the two halves the lag actually overlaps.
    const m = energy[size - lag] + (total - energy[lag]);
    if (!(m > 0)) {
      n[lag] = 0;
      return;
    }
    const v = (2 * r[lag]) / m;
    // The guard. The direct sum adds size − lag products, each exact in double
    // precision, so it is off by at most (size − lag)·2^-53 times the sum of
    // their magnitudes, which is at most half the exact overlap energy
    // (Cauchy-Schwarz, then the mean of two numbers bounding their geometric
    // mean), and that energy is at most m + energyError. If the FFT value
    // widened by both errors rounds to one Float32, the direct sum's stored
    // value is that Float32.
    const e =
      ((2 * fftError + (size - lag) * ROUNDOFF * 1.001 * (m + energyError)) / m) * 1.001 +
      4 * ROUNDOFF * Math.abs(v) +
      Number.MIN_VALUE;
    if (Math.fround(v - e) === Math.fround(v + e)) {
      n[lag] = v;
      return;
    }
    // Too close to a rounding boundary to tell: the full scan's own sum.
    directSums++;
    let sum = 0;
    for (let j = 0; j < size - lag; j++) {
      sum += buf[r1 + j] * buf[r1 + j + lag];
    }
    n[lag] = (2 * sum) / m;
  };
  for (let lag = minLag; lag <= maxLag + 1 && lag < size; lag++) {
    computeLag(lag);
  }

  // Walk off the correlation's initial descent from lag 0 so the trivial peak
  // at zero lag can't win, but never search below the shortest singable period.
  let d = minLag;
  while (d < maxLag && n[d] > n[d + 1]) d++;
  const from = Math.max(d, minLag);
  if (from >= maxLag) return null;

  // Every local maximum in range, and the best value among them. The first
  // peak within PEAK_TOLERANCE of the best is the answer: it is the shortest
  // period that explains the signal, which is the fundamental rather than one
  // of the octaves below it that score just as well.
  let best = -Infinity;
  for (let i = from + 1; i < maxLag; i++) {
    if (n[i] > n[i - 1] && n[i] >= n[i + 1] && n[i] > best) best = n[i];
  }
  if (best === -Infinity) return null;

  const cutoff = best * PEAK_TOLERANCE;
  let maxpos = -1;
  for (let i = from + 1; i < maxLag; i++) {
    if (n[i] > n[i - 1] && n[i] >= n[i + 1] && n[i] >= cutoff) {
      maxpos = i;
      break;
    }
  }
  if (maxpos <= 0) return null;

  // A periodic electrical source often has a weak 50/60 Hz fundamental and a
  // much louder 100/120 Hz rectifier harmonic. If a clean integer-multiple
  // peak below C2 is materially stronger than the reportable candidate, use
  // that as the period; the range check below will then reject the frame. An
  // equally good sub-octave peak is deliberately ignored so low sung notes do
  // not disappear merely because their waveform repeats across two periods.
  const initialPeak = n[maxpos];
  for (let multiple = 2; multiple <= 4; multiple++) {
    const expectedLag = maxpos * multiple;
    if (expectedLag > analysisMaxLag) break;
    if (expectedLag <= maxLag) continue;

    const searchRadius = Math.max(
      2,
      Math.ceil(expectedLag * SUBRANGE_SEARCH_RATIO),
    );
    const localFrom = Math.max(maxLag + 1, expectedLag - searchRadius);
    const localTo = Math.min(analysisMaxLag, expectedLag + searchRadius);
    let localLag = localFrom;
    for (let lag = localFrom; lag <= localTo; lag++) {
      computeLag(lag);
      if (n[lag] > n[localLag]) localLag = lag;
    }
    if (
      n[localLag] >= SUBRANGE_MIN_CLARITY &&
      n[localLag] > initialPeak + SUBRANGE_MARGIN
    ) {
      maxpos = localLag;
      break;
    }
  }

  let T0 = maxpos;
  // Parabolic interpolation around the peak for sub-sample precision.
  computeLag(T0 - 1);
  computeLag(T0 + 1);
  const x1 = n[T0 - 1];
  const x2 = n[T0];
  const x3 = n[T0 + 1];
  const a = (x1 + x3 - 2 * x2) / 2;
  const b = (x3 - x1) / 2;
  if (a) T0 = T0 - b / (2 * a);

  const freq = sampleRate / T0;
  // Parabolic interpolation can nudge the period just past the search bounds.
  if (freq < MIN_FREQ || freq > MAX_FREQ) return null;

  return { freq, clarity: Math.max(0, Math.min(1, n[maxpos])) };
}
