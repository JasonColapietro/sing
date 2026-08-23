/**
 * Time as an animation loop is allowed to count it.
 *
 * `requestAnimationFrame` stops firing when a tab is hidden; the AudioContext
 * clock and `performance.now()` do not. Every scored surface in this app is an
 * rAF loop measuring elapsed time with one of those two wall clocks, so
 * switching tabs mid-exercise made the first frame after returning arrive
 * carrying the entire absence as a single delta. What that meant depended on
 * which side of the comparison the delta landed on:
 *
 * - Pitch match credited it as time spent in tune. Tab away for five seconds
 *   while singing the right note and the round scored correct on the first
 *   frame back, HOLD_MS cleared without a note being sung. It also
 *   over-credited on any ordinary hitch: a 300 ms GC pause was 300 ms of
 *   "hold" from one stale frame.
 * - Melody echo counted it against the answer window and auto-failed the round.
 * - /songs finalized the whole session, judged every note that passed while
 *   hidden as a miss, and logged a near-zero score whose wall-clock duration
 *   also hit the 80 XP ceiling — permanently, before the summary rendered.
 *
 * Capping the delta is the fix for all of them. A loop that accumulates capped
 * deltas measures time the loop was actually awake for, which is the only time
 * during which anything was being measured.
 */

/**
 * The largest delta one frame may contribute, in milliseconds.
 *
 * Roughly four frames at 60 fps. `useAnalyser` already caps its own dt at 1/15
 * of a second for this reason; this is the same number, shared.
 */
export const MAX_FRAME_MS = 1000 / 15;

/**
 * How old an analysis frame may be before it stops counting as evidence.
 *
 * `usePitch` publishes through a ref and never clears it, so a suspended loop
 * leaves the last frame from before the tab was hidden sitting there looking
 * current. Anything that reads `latest.current` to decide whether the singer is
 * on pitch has to ask when that reading was taken, or it will score a note that
 * stopped sounding minutes ago.
 */
export const STALE_FRAME_MS = 200;

/** Clamps one frame's elapsed time to something the loop was awake for. */
export function frameDelta(now: number, last: number): number {
  return Math.min(Math.max(0, now - last), MAX_FRAME_MS);
}

/** Whether a published analysis frame is recent enough to score against. */
export function isFrameFresh(frameT: number, now: number): boolean {
  return frameT > 0 && now - frameT < STALE_FRAME_MS;
}
