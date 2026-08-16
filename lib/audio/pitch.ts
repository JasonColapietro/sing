export interface PitchResult {
  freq: number;
  /** 0..1, normalized autocorrelation peak. Above ~0.8 is a confident voiced frame. */
  clarity: number;
}

/**
 * Time-domain autocorrelation pitch detector (ACF2+ with parabolic
 * interpolation). Tuned for the human voice: rejects frames quieter than a
 * small RMS floor and frequencies outside 45–1600 Hz.
 */
/** The singable range this detector will report, in Hz. */
const MIN_FREQ = 45;
const MAX_FREQ = 1600;

export function detectPitch(
  buf: Float32Array,
  sampleRate: number,
): PitchResult | null {
  const SIZE = buf.length;
  let rms = 0;
  for (let i = 0; i < SIZE; i++) rms += buf[i] * buf[i];
  rms = Math.sqrt(rms / SIZE);
  if (rms < 0.006) return null;

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

  const c = new Float32Array(size);
  for (let i = 0; i < size; i++) {
    let sum = 0;
    for (let j = 0; j < size - i; j++) {
      sum += buf[r1 + j] * buf[r1 + j + i];
    }
    c[i] = sum;
  }

  // Only lags that correspond to a singable pitch are candidates. Searching
  // every lag and rejecting the answer afterwards throws the whole frame away
  // whenever noise wins the peak at some implausible lag — which is what a
  // normal room, or the browser's own capture and resampling path, reliably
  // produces. The note is audible and on pitch; the detector was just looking
  // outside the range it was going to accept anyway.
  const minLag = Math.max(1, Math.floor(sampleRate / MAX_FREQ));
  const maxLag = Math.min(size - 1, Math.ceil(sampleRate / MIN_FREQ));
  if (maxLag <= minLag) return null;

  // Skip the correlation's initial descent from lag 0 so the trivial peak at
  // zero lag can't win, but never search below the shortest singable period.
  let d = 0;
  while (d < size - 1 && c[d] > c[d + 1]) d++;
  const from = Math.max(d, minLag);

  let maxval = -1;
  let maxpos = -1;
  for (let i = from; i <= maxLag; i++) {
    if (c[i] > maxval) {
      maxval = c[i];
      maxpos = i;
    }
  }
  if (maxpos <= 0 || c[0] <= 0) return null;

  let T0 = maxpos;
  // Parabolic interpolation around the peak for sub-sample precision.
  const x1 = c[T0 - 1] ?? c[T0];
  const x2 = c[T0];
  const x3 = c[T0 + 1] ?? c[T0];
  const a = (x1 + x3 - 2 * x2) / 2;
  const b = (x3 - x1) / 2;
  if (a) T0 = T0 - b / (2 * a);

  const freq = sampleRate / T0;
  // Parabolic interpolation can nudge the period just past the search bounds.
  if (freq < MIN_FREQ || freq > MAX_FREQ) return null;

  return { freq, clarity: Math.max(0, Math.min(1, maxval / c[0])) };
}
