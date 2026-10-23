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
 * free, since `c[2T]` was always smaller than `c[T]`, so taking the largest value
 * in range was safe. Normalized, `n[2T] ≈ n[T]`, and the largest value is as
 * likely to be the octave below as the true period. Hence McLeod's rule: take
 * the *first* peak that comes within `PEAK_TOLERANCE` of the best one, which
 * is the shortest period that explains the signal.
 *
 * The detector now runs in two stages. The full NSDF scan cost one inner loop
 * of up to 4096 multiplies for every one of ~700 lags, about 5.7 ms per
 * 4096-sample frame at 48 kHz in Node on the build server, and the live rooms
 * call it inside requestAnimationFrame at 60 fps, where a phone has 16.7 ms
 * for everything. So the lags are no longer scanned blindly. Stage one is an
 * open-loop coarse search, the way speech codecs find a pitch candidate: an
 * average magnitude difference function on a copy of the window decimated to
 * about 11 kHz, whose dips mark every lag that could be a period. Stage two
 * computes the NSDF only in small windows around those dips, plus whatever
 * each window turns out to need, and then applies exactly the selection the
 * full scan applied.
 *
 * The readings are identical to the full scan, not merely close: the same
 * chosen lag, the same three NSDF values under the parabola, the same clarity.
 * Every value the second stage computes is the same arithmetic in the same
 * order as before; what changed is which lags get computed at all, and each
 * shortcut below carries the argument for why the lags it skips cannot change
 * the answer. Verified bitwise against the full scan over 6,486 synthetic
 * frames (clean, weak fundamental, jitter, vibrato, 20 to 0 dB SNR, phone-mic
 * bass, clicks, crescendo, at 44.1 and 48 kHz, plus 2048-sample frames at
 * 22.05 and 24 kHz for the breath detector) and the rejection fixtures in
 * pitch.test.ts; `pitch-coarse.test.ts` keeps a copy of the full scan and
 * repeats that comparison. Cost: a mean of 29 NSDF lags per frame instead of
 * 679, about 0.5 ms instead of 5.7 ms on the same frames. On a frame that is
 * only room noise above the silence floor the saving is small, because the
 * full scan's answer on noise depends on nearly every lag.
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
 * The coarse search runs on the window decimated by the largest whole factor
 * that keeps the decimated rate at or above this: 4 at 44.1 and 48 kHz, 2 at
 * the 22.05 and 24 kHz the breath detector hands over, 1 at 16 kHz or below.
 * Its Nyquist, at least 5.5 kHz, stays above the 4 kHz low-pass corner, so the
 * decimated copy holds every harmonic the NSDF sees. Decimating by 2 instead
 * costs 3.7 times the coarse work for the same number of refined lags;
 * decimating by 8 saves a quarter of the coarse work but the grid is then too
 * sparse at the top of the range and the refinement computes 45% more lags.
 */
export const COARSE_RATE_HZ = 11025;

/**
 * A coarse dip is refined when its depth (one minus the normalized AMDF) is
 * at least this share of the deepest dip's. Measured over 31,397 NSDF peaks
 * that could have won across the synthetic sweeps, the dip that covered each
 * one was never shallower than 0.70 of the deepest, so 0.5 leaves a margin of
 * 0.2 and costs about 12% more refined lags than 0.6 would. No cap on the
 * number of dips: at high notes the depth of each period multiple is set by
 * where it falls on the decimated grid rather than by periodicity, so the dip
 * at the period itself can rank last, and any cap reads the octave below.
 */
export const COARSE_DIP_TOLERANCE = 0.5;

/**
 * Half-width, in samples, of the NSDF window first computed around each
 * refined dip. The dip's centre was never more than 2 samples from the peak's
 * run in the sweeps; a window whose maximum sits on an edge grows outward
 * until it does not, so a wider start only costs lags.
 */
export const REFINE_RADIUS = 2;

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
 * Stage one: the coarse lags worth refining, shortest first.
 *
 * The trimmed window is decimated by `D` (each output is the sum of `D`
 * consecutive samples, as the breath detector does with pairs), and the
 * average magnitude difference function is taken over the coarse lags that
 * cover the singable range, normalized by the magnitude in the two overlapping
 * halves so it lies in [0, 1]. A periodic signal makes a dip at every multiple
 * of its period; the dips deep enough under `COARSE_DIP_TOLERANCE` are the
 * candidates. One extra coarse lag is searched beyond each end of the range,
 * because a full-rate peak at the very edge can have its dip on the far side
 * of the nearest grid point.
 */
function coarseCandidates(
  buf: Float32Array,
  r1: number,
  size: number,
  D: number,
  minLag: number,
  maxLag: number,
): number[] {
  const m = Math.floor(size / D);
  const y = new Float64Array(m);
  for (let j = 0, s = r1; j < m; j++, s += D) {
    let v = 0;
    for (let k = 0; k < D; k++) v += buf[s + k];
    y[j] = v;
  }
  const mass = new Float64Array(m + 1);
  for (let j = 0; j < m; j++) mass[j + 1] = mass[j] + Math.abs(y[j]);
  const total = mass[m];

  const cLo = Math.max(2, Math.floor(minLag / D) - 1);
  const cHi = Math.min(m - 2, Math.ceil(maxLag / D) + 1);
  if (cHi < cLo) return [];
  const a = new Float64Array(cHi + 2);
  for (let L = cLo - 1; L <= cHi + 1; L++) {
    let d = 0;
    const end = m - L;
    for (let j = 0; j < end; j++) d += Math.abs(y[j] - y[j + L]);
    const l1 = mass[end] + (total - mass[L]);
    a[L] = l1 > 0 ? d / l1 : 1;
  }
  const dips: number[] = [];
  const depths: number[] = [];
  let bestDepth = -Infinity;
  for (let c = cLo; c <= cHi; c++) {
    if (a[c] < a[c - 1] && a[c] <= a[c + 1]) {
      const depth = 1 - a[c];
      dips.push(c);
      depths.push(depth);
      if (depth > bestDepth) bestDepth = depth;
    }
  }
  const out: number[] = [];
  for (let i = 0; i < dips.length; i++) {
    if (depths[i] >= COARSE_DIP_TOLERANCE * bestDepth) out.push(dips[i]);
  }
  return out;
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
  for (let i = 0; i < size; i++) {
    const x = buf[r1 + i];
    energy[i + 1] = energy[i] + x * x;
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

  // The normalized square difference function, computed lazily: only the
  // lags the refinement asks for, and below C2 only around an integer
  // multiple that could expose a hidden hum fundamental.
  const n = new Float32Array(analysisMaxLag + 2);
  const computed = new Uint8Array(analysisMaxLag + 2);
  const computeLag = (lag: number) => {
    if (lag < minLag || lag > analysisMaxLag + 1 || lag >= size) return;
    if (computed[lag]) return;
    let sum = 0;
    for (let j = 0; j < size - lag; j++) {
      sum += buf[r1 + j] * buf[r1 + j + lag];
    }
    // Energy under the two halves the lag actually overlaps.
    const m = energy[size - lag] + (total - energy[lag]);
    n[lag] = m > 0 ? (2 * sum) / m : 0;
    computed[lag] = 1;
  };

  /**
   * The largest value any computed `n[lag]` can hold, for the two shortcuts
   * below. In exact arithmetic the NSDF never exceeds 1, because
   * `2·Σ a·b <= Σ a² + Σ b²`. The computed value can only go above 1 through
   * the overlap energy `m`, which is read off the Float32 running sum: each
   * of its `size` additions rounds with a relative error of at most 2^-24,
   * every partial sum is at most `total`, and `m` combines two stretches of
   * that sum, so its absolute error is at most `2·size·2^-24·total`. While
   * every searched lag is at most half the window, both halves together cover
   * the window and `m >= total`, so the relative error of `m` is at most
   * `2·size·2^-24` and `n` at most `1/(1 − 2·size·2^-24)`. The ceiling here
   * doubles that margin to cover the second-order term, the double-precision
   * product sum and the Float32 store of `n`. For a 4096-sample frame it is
   * about 1.001. A window trimmed so short that a searched lag exceeds half
   * of it keeps the bound out of reach, and both shortcuts stay off.
   */
  const nsdfCeiling =
    2 * analysisMaxLag <= size ? 1 + 4 * size * 2 ** -24 : Infinity;

  // Stage one.
  const D = Math.max(1, Math.floor(sampleRate / COARSE_RATE_HZ));
  const candidates = coarseCandidates(buf, r1, size, D, minLag, maxLag);

  // Stage two. The eligible peaks are the local maxima of n strictly inside
  // (minLag, maxLag), as before. The full scan also walked off the initial
  // descent from minLag before looking for peaks; that exclusion is implied
  // by the peak test itself, because no local maximum can sit at or below the
  // end of a strict descent (each lag there is lower than the one before it),
  // and a descent that reaches maxLag leaves no peak at all, which is the
  // same null either way.
  const collectPeaks = () => {
    const peaks: number[] = [];
    let best = -Infinity;
    for (let i = minLag + 1; i < maxLag; i++) {
      if (
        computed[i] &&
        computed[i - 1] &&
        computed[i + 1] &&
        n[i] > n[i - 1] &&
        n[i] >= n[i + 1]
      ) {
        peaks.push(i);
        if (n[i] > best) best = n[i];
      }
    }
    return { peaks, best };
  };
  const firstQualifying = (peaks: number[], cutoff: number) => {
    for (const i of peaks) if (n[i] >= cutoff) return i;
    return -1;
  };

  /**
   * Compute n over [lo − 1, hi + 1], so a peak anywhere in lo..hi has both
   * neighbours, and grow the window outward whenever its maximum sits on an
   * edge: the coarse dip pointed at a slope and the peak is further out.
   * Returns the range computed.
   */
  const extendStep = D + 1;
  const scanWindow = (lo: number, hi: number): [number, number] => {
    for (let tries = 0; ; tries++) {
      const a0 = Math.max(minLag, lo - 1);
      const a1 = Math.min(maxLag, hi + 1);
      let argmax = a0;
      for (let lag = a0; lag <= a1; lag++) {
        computeLag(lag);
        if (n[lag] > n[argmax]) argmax = lag;
      }
      if (tries < 16) {
        if (argmax === a0 && a0 > minLag) {
          lo = Math.max(minLag, lo - extendStep);
          continue;
        }
        if (argmax === a1 && a1 < maxLag) {
          hi = Math.min(maxLag, hi + extendStep);
          continue;
        }
      }
      return [a0, a1];
    }
  };

  /**
   * The walk. McLeod's rule takes the first local maximum within tolerance of
   * the best, and on a noisy frame that is often a bump on the shoulder of
   * the main peak rather than the peak itself: at 0 dB SNR the full scan chose
   * a bump 7 to 12 lags before the peak on 5 of 294 low notes. So from any
   * window edge still at or above the cutoff, n is computed lag by lag until
   * it drops below the cutoff, and every bump in that stretch becomes a peak.
   * The cutoff used is the running best's, which can only rise later; a lower
   * cutoff walks at least as far, so nothing that the final cutoff would admit
   * is left uncomputed.
   */
  const walkLeft = (a0: number, cutoff: number) => {
    if (n[a0] < cutoff) return;
    for (let lag = a0 - 1; lag >= minLag; lag--) {
      computeLag(lag);
      if (n[lag] < cutoff) break;
    }
  };
  const walkRight = (a1: number, cutoff: number) => {
    if (n[a1] < cutoff) return;
    for (let lag = a1 + 1; lag <= maxLag; lag++) {
      computeLag(lag);
      if (n[lag] < cutoff) break;
    }
  };

  // The early exit. Candidates are refined shortest lag first. Refining a
  // later one can only raise `best`, and with it the cutoff, so the first
  // qualifying peak can only move later, never earlier, and it moves only if
  // its own value falls under the raised cutoff. Once the current winner's
  // value is at least PEAK_TOLERANCE times the ceiling, no later peak can
  // push it out, and the remaining candidates, like the walk to the right of
  // its window, cannot change the reading. A clean high note refines one
  // candidate instead of sixteen multiples of its period.
  const exitLevel = PEAK_TOLERANCE * nsdfCeiling;
  let peaks: number[] = [];
  let best = -Infinity;
  for (const c of candidates) {
    const centre = D * c;
    const [a0, a1] = scanWindow(
      Math.max(minLag, centre - REFINE_RADIUS),
      Math.min(maxLag, centre + REFINE_RADIUS),
    );
    ({ peaks, best } = collectPeaks());
    if (best === -Infinity) continue;
    walkLeft(a0, best * PEAK_TOLERANCE);
    ({ peaks, best } = collectPeaks());
    let winner = firstQualifying(peaks, best * PEAK_TOLERANCE);
    if (winner > 0 && n[winner] >= exitLevel) break;
    walkRight(a1, best * PEAK_TOLERANCE);
    ({ peaks, best } = collectPeaks());
    winner = firstQualifying(peaks, best * PEAK_TOLERANCE);
    if (winner > 0 && n[winner] >= exitLevel) break;
  }

  // The fallback. If no window held a local maximum (a frame whose NSDF is
  // still rising at maxLag, which the coarse dips point at but never top,
  // happened once in 6,486 frames, at 0 dB on a C2), the lags are scanned in
  // full, which is the old detector's cost and exactly its result.
  if (peaks.length === 0) {
    scanWindow(minLag, maxLag);
    ({ peaks, best } = collectPeaks());
    if (peaks.length === 0) return null;
  }

  // Every eligible peak the full scan could have chosen is now computed, and
  // the best value among them. The first peak within PEAK_TOLERANCE of the
  // best is the answer: it is the shortest period that explains the signal,
  // which is the fundamental rather than one of the octaves below it that
  // score just as well.
  const cutoff = best * PEAK_TOLERANCE;
  let maxpos = firstQualifying(peaks, cutoff);
  if (maxpos <= 0) return null;

  // A periodic electrical source often has a weak 50/60 Hz fundamental and a
  // much louder 100/120 Hz rectifier harmonic. If a clean integer-multiple
  // peak below C2 is materially stronger than the reportable candidate, use
  // that as the period; the range check below will then reject the frame. An
  // equally good sub-octave peak is deliberately ignored so low sung notes do
  // not disappear merely because their waveform repeats across two periods.
  //
  // The hum skip. The search can only change the period when some lag scores
  // above `initialPeak + SUBRANGE_MARGIN`. When that is above the ceiling no
  // computed value can reach, the loop is skipped with the same result. It
  // fires on any frame with clarity above about 0.98, which after the 4 kHz
  // low-pass includes a 10 dB SNR vowel, and saves 55 to 75 lags, each over
  // most of the window, on every note below C4.
  const initialPeak = n[maxpos];
  const humPossible = initialPeak + SUBRANGE_MARGIN <= nsdfCeiling;
  for (let multiple = 2; humPossible && multiple <= 4; multiple++) {
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
