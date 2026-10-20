/**
 * A runner's per-step results with step `i` set to `result`, as a dense array
 * of exactly `stepCount` entries: null wherever no step has reported.
 *
 * A routine or breath set opened part-way (a program row's `?step=` link,
 * carrying on from the step the free minutes stopped at) closes its first
 * step at an index past 0. Assigning there on a copy of an empty array
 * (`next[i] = data`) leaves holes in front of it, and the next copy made
 * with a spread turns those holes into explicit `undefined` entries. A
 * results screen that dropped the empty steps with `!== null` kept the
 * undefined ones and read a score off them, and the room's error boundary
 * replaced the summary of every resumed run of two steps or more.
 */
export function withStepResult<T>(
  results: readonly (T | null | undefined)[],
  i: number,
  result: T | null,
  stepCount: number,
): (T | null)[] {
  return Array.from({ length: Math.max(stepCount, i + 1) }, (_, k) =>
    k === i ? result : (results[k] ?? null),
  );
}

/** The same results, dense, for a run that ends without closing a step (a quit). */
export function denseStepResults<T>(
  results: readonly (T | null | undefined)[],
  stepCount: number,
): (T | null)[] {
  return Array.from({ length: Math.max(stepCount, results.length) }, (_, k) => results[k] ?? null);
}
