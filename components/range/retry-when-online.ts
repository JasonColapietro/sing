/**
 * Loads an optional chunk, and when it cannot load, waits for the connection
 * instead of failing.
 *
 * The /range page loads two things late on purpose, so its cold traffic never
 * downloads them: the running program's range test (ProgramRangeProbe, in
 * ./pitch-meter.tsx) and the song catalog the result counts against
 * (./result-view.tsx). Offline, on a train with the page already open, each
 * import rejected with a ChunkLoadError. In render that took the whole room
 * down to app/error.tsx; in an effect it was an uncaught rejection. Neither
 * is needed for the measurement itself, only for a line of copy, so the
 * promise simply stays pending until the browser reports it is back online,
 * then tries again.
 *
 * `signal` drops the wait when the caller no longer wants the result (an
 * unmounted room). The promise then never settles, which is harmless: nothing
 * holds it.
 */
export function retryWhenOnline<T>(
  load: () => Promise<T>,
  { target, signal }: { target?: EventTarget; signal?: AbortSignal } = {},
): Promise<T> {
  return load().catch(
    () =>
      new Promise<T>((resolve) => {
        const on: EventTarget | undefined =
          target ?? (typeof window === "undefined" ? undefined : window);
        if (!on || signal?.aborted) return;
        const retry = () => {
          signal?.removeEventListener("abort", drop);
          resolve(retryWhenOnline(load, { target, signal }));
        };
        const drop = () => on.removeEventListener("online", retry);
        on.addEventListener("online", retry, { once: true });
        signal?.addEventListener("abort", drop, { once: true });
      }),
  );
}
