/**
 * Cumulative active practice time. Pause on hide; resume only when visible.
 * Snapshots are elapsed values, so a later pause cannot shorten an earlier
 * scored rep. Milliseconds stay intact across interruptions until logging.
 */
export function createPracticeClock(now: () => number = () => performance.now()) {
  let startedAt: number | null = null;
  let accumulatedMs = 0;

  return {
    resume() {
      startedAt ??= now();
    },
    /** Returns false when an earlier exit event already closed the stretch. */
    pause(): boolean {
      if (startedAt === null) return false;
      accumulatedMs += Math.max(0, now() - startedAt);
      startedAt = null;
      return true;
    },
    elapsedMs(): number {
      return accumulatedMs + (startedAt === null ? 0 : Math.max(0, now() - startedAt));
    },
    reset() {
      startedAt = null;
      accumulatedMs = 0;
    },
  };
}
