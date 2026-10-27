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

/**
 * Where the one-time Pro moment (components/pro/moments.tsx) records that it
 * has been shown and closed. Shared with the session nudges, which keep to
 * their quiet one-line form until then, so a singer never meets the modal and
 * a full upgrade card at the same moment.
 */
export const PRO_MOMENT_SEEN_KEY = "suede-sing:coach-intro:v1";

/**
 * Whether the one-time Pro moment has already been shown in this browser.
 * Where storage cannot be read the moment never opens, so it reads as seen.
 */
export function proMomentSeen(): boolean {
  try {
    return Boolean(window.localStorage.getItem(PRO_MOMENT_SEEN_KEY));
  } catch {
    return true;
  }
}

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
