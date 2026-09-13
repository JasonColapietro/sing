/**
 * Score to stars, in one place.
 *
 * This lived in `components/practice/results-screen.tsx` — a `"use client"`
 * module with JSX — which is why `contracts/practice-parity.ts` could not
 * import it and hand-typed `[90, 75, 50]` instead. That made the one key in
 * the whole contract that the regeneration test could not police: the README
 * promises "the test fails when the committed JSON and the live constants
 * disagree", and for star thresholds it did not, because there was no live
 * constant to disagree with. The ladder was also re-typed inline in
 * `lib/progress.ts` and `components/warmups/routines.ts`.
 *
 * So the numbers live here, in a module with no React and no DOM, and the
 * rooms, the weekly rollup and the contract all read the same array.
 *
 * Three bands, chosen to match what the rooms already call good: 90 is the
 * "nailed it" line the grade table calls S/A territory, 75 is a clean take
 * with rough edges, 50 is the floor a recognizable attempt clears.
 *
 * Note this is the *practice-room* 3-star scale. The songbook grades on a
 * separate 5-star linear scale (`components/songs/grade.ts`, `STAR_MAX`), and
 * the two are deliberately different instruments, not a drift to reconcile.
 */

export type Stars = 0 | 1 | 2 | 3;

/**
 * Percentage floors for 3, 2 and 1 star, highest first.
 *
 * Ordered descending because `starsForScore` walks it and takes the first
 * floor the score clears; a re-sort would silently change the ladder.
 */
export const STAR_THRESHOLDS = [90, 75, 50] as const;

/**
 * An unscored session (listen mode, nothing sung) earns none — it is not a
 * zero-star performance, it is no performance.
 */
export function starsForScore(score: number | null | undefined): Stars {
  if (score === null || score === undefined || !Number.isFinite(score)) return 0;
  for (const [index, floor] of STAR_THRESHOLDS.entries()) {
    if (score >= floor) return (STAR_THRESHOLDS.length - index) as Stars;
  }
  return 0;
}
