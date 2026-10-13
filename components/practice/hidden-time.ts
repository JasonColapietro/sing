/**
 * Time a tab spends hidden is not practice.
 *
 * The rooms that run on lib/practice-clock pause it on hide. The ear games
 * and the breath drill that time a run from one start instant use this
 * instead: each hidden stretch is reported when the tab comes back, and the
 * caller moves its start forward by that much, so a parked tab never uses up
 * a free singer's daily minutes or earns XP. Those callers also leave out
 * idle time on a visible screen, with ./active-clock.
 */

/** The slice of `document` the tracker listens to. */
export interface VisibilitySource {
  readonly visibilityState: DocumentVisibilityState;
  addEventListener(type: "visibilitychange", listener: () => void): void;
  removeEventListener(type: "visibilitychange", listener: () => void): void;
}

/**
 * Report each stretch the tab spends hidden, in milliseconds, when it comes
 * back. Returns the unsubscribe. A tab already hidden when tracking starts is
 * timed from that moment.
 */
export function trackHiddenTime(
  doc: VisibilitySource,
  now: () => number,
  onHidden: (ms: number) => void,
): () => void {
  let hiddenAt: number | null = doc.visibilityState === "hidden" ? now() : null;
  const onVis = () => {
    if (doc.visibilityState === "hidden") {
      hiddenAt ??= now();
    } else if (hiddenAt !== null) {
      const ms = Math.max(0, now() - hiddenAt);
      hiddenAt = null;
      onHidden(ms);
    }
  };
  doc.addEventListener("visibilitychange", onVis);
  return () => doc.removeEventListener("visibilitychange", onVis);
}
