/**
 * The routine helpers every room shares. A room's catalogue is any list of
 * `{ id; steps }`; its own step length (`secondsOf`) and intro hold are the
 * only room-specific inputs. Sizing a pick to the free minutes is
 * `sizeToAllowance` in lib/free-cap.ts.
 */
export interface RoutineShape<S> {
  id: string;
  steps: readonly S[];
}

/** The routine with this id, or null for a missing or unknown id. */
export function findRoutine<R extends { id: string }>(
  all: readonly R[],
  id: string | null | undefined,
): R | null {
  if (!id) return null;
  return all.find((r) => r.id === id) ?? null;
}

/** Estimated seconds for a whole routine: every step plus its intro slide. */
export function routineTotalSeconds<S>(
  r: RoutineShape<S>,
  secondsOf: (step: S) => number,
  introSec: number,
): number {
  return r.steps.reduce((a, s) => a + secondsOf(s) + introSec, 0);
}

/** Whole minutes for a routine card, never "0 min". */
export function routineMinutesOf(seconds: number): number {
  return Math.max(1, Math.round(seconds / 60));
}

/**
 * Ear and breath recommend the same way: a second visit today is a top-up
 * (the quick routine); otherwise the daily one. Falls back to the first.
 */
export function recommendQuickOrDaily<R extends { id: string }>(
  all: readonly R[],
  opts: { practicedToday: boolean },
): R {
  return findRoutine(all, opts.practicedToday ? "quick" : "daily") ?? all[0];
}
