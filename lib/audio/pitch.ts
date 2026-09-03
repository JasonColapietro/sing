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
 * *frequency* gate at `4·sampleRate/size` — 93.9 Hz for the 2048-sample frames
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
 * free — `c[2T]` was always smaller than `c[T]` — so taking the largest value
 * in range was safe. Normalized, `n[2T] ≈ n[T]`, and the largest value is as
 * likely to be the octave below as the true period. Hence McLeod's rule: take
 * the *first* peak that comes within `PEAK_TOLERANCE` of the best one, which
 * is the shortest period that explains the signal.
 */
/** The live rooms and native apps all start at C2. */
const MIN_FREQ = 65;
const MAX_FREQ = 1600;

/**
 * Search this far below C2 when checking a candidate's integer multiples.
 * That makes the 50/60 Hz fundamental of mains hum visible even when its
 * louder 100/120 Hz harmonic is the first reportable peak.
 */
const SUBRANGE_FLOOR_HZ = 40;
// Windowing and broadband room noise can shift the fundamental peak a few
// percent away from the exact multiple of the initially selected harmonic.
const SUBRANGE_SEARCH_RATIO = 0.03;
// Hum's hidden fundamental improves clarity by about 0.03; repeated periods
// of a real low note remain nearly equal. Keep enough separation between them.
const SUBRANGE_MARGIN = 0.02;
const SUBRANGE_MIN_CLARITY = 0.8;

/**
 * How close to the best peak a shorter-period peak has to be to win.
 *
 * Too high and a slightly imperfect true period loses to its own sub-octave;
 * too low and a half-frequency artefact wins outright. 0.9 is McLeod's
 * recommendation and it holds up across the vowel frames in the tests.
 */
const PEAK_TOLERANCE = 0.9;

export function detectPitch(
  buf: Float32Array,
  sampleRate: number,
): PitchResult | null {
  const SIZE = buf.length;
  let rms = 0;
  for (let i = 0; i < SIZE; i++) rms += buf[i] * buf[i];
  rms = Math.sqrt(rms / SIZE);
  if (rms < 0.01) return null;

  // Trim leading/trailing low-energy samples so the correlation focuses on
  // the voiced middle of the frame.
  let r1 = 0;
  let r2 = SIZE - 1;
  const thres = 0.2;
  for (let i = 0; i < SIZE / 2; i++) {
    if (Math.abs(buf[i]) < thres) {
      r1 = i;
      break;
    }
  }
  for (let i = 1; i < SIZE / 2; i++) {
    if (Math.abs(buf[SIZE - i]) < thres) {
      r2 = SIZE - i;
      break;
    }
  }
  const size = r2 - r1;
  if (size < 128) return null;

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
  // whenever noise wins the peak at some implausible lag — which is what a
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

  // The normalized square difference function over the candidate lags. It is
  // extended lazily below C2 only around an integer multiple that could expose
  // a hidden hum fundamental; a full extra scan would be needless per-frame
  // work for ordinary singing.
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
