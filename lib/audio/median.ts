/**
 * The median, averaging the two middle values when there is an even count.
 *
 * `sorted[Math.floor(n / 2)]` is the *upper* middle value for an even count,
 * which is not a median. For pitch that is a directional error, not noise:
 * usePitch smooths over the last 4 readings, so through a vibrato it reported
 * the sharper of the two middle readings every frame and every room read the
 * singer ~5.5 c sharp (measured by e2e/pitch-precision.mjs; the raw detector's
 * bias on the same signal was 0.4 c).
 *
 * Returns NaN for an empty list. Does not modify its argument.
 */
export function median(values: readonly number[]): number {
  const n = values.length;
  if (n === 0) return NaN;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = n >> 1;
  return n % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}
