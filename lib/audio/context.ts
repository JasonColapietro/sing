let _ctx: AudioContext | null = null;

/**
 * Shared AudioContext. Call only on the client, ideally from a user gesture
 * (click) so the browser allows it to start.
 */
export function getAudioContext(): AudioContext {
  if (typeof window === "undefined") {
    throw new Error("getAudioContext is client-only");
  }
  if (!_ctx) _ctx = new AudioContext();
  if (_ctx.state === "suspended") void _ctx.resume();
  return _ctx;
}

/** Current time of the shared AudioContext, for scheduling. */
export function audioNow(): number {
  return getAudioContext().currentTime;
}
