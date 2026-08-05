/**
 * "A result just landed" signal.
 *
 * The one-time Pro moment used to watch the progress store, which fires on
 * every write — mid-exercise XP, a cross-tab sync — so the modal could land
 * on top of someone who was still singing. This is the narrow replacement:
 * result screens announce themselves explicitly, and nothing else can.
 *
 * Deliberately tiny — no React, no storage, no store import. It carries no
 * payload and returns nothing, so it can be dropped into an existing effect
 * without touching what that effect already returns (logSession and
 * setVocalRange still hand back their LogResult untouched).
 */

const listeners = new Set<() => void>();

/** Announces that a completed result is now on screen. Fire-and-forget. */
export function emitProResult(): void {
  for (const l of listeners) l();
}

/** Listens for completed results. Returns the unsubscribe. */
export function subscribeProResult(cb: () => void): () => void {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}
