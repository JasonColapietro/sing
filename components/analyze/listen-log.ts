/**
 * Listening time the voice analyzer logs as practice. A chunk counts its full
 * length of listening (speech pauses included), but only when a voice was
 * heard in it: a muted mic or the wrong input used to log five minutes of
 * silence as practice, with XP, a streak day and "First note", the defect
 * round 15 fixed in the studio and in song practice.
 */
export interface ListenLog {
  /** Seconds the mic has listened since the last log. */
  sec: number;
  /** Whether any frame since the last log carried a pitch. */
  heard: boolean;
}

export const emptyListenLog = (): ListenLog => ({ sec: 0, heard: false });

/** Add one analysis frame's time. */
export function listen(log: ListenLog, dtSec: number, f0: number | null): void {
  log.sec += dtSec;
  if (f0) log.heard = true;
}

/**
 * Take a full chunk once `chunkSec` has passed. True when it should be logged;
 * a silent chunk is dropped all the same, so its seconds never join the next.
 */
export function takeChunk(log: ListenLog, chunkSec: number): boolean {
  if (log.sec < chunkSec) return false;
  log.sec -= chunkSec;
  if (!log.heard) return false;
  log.heard = false;
  return true;
}

/**
 * Take the tail on stop or exit: its whole seconds when it ran `minSec` and a
 * voice was heard, else null. A silent tail is dropped; a short one stays.
 */
export function takeTail(log: ListenLog, minSec: number): number | null {
  const sec = Math.round(log.sec);
  if (sec < minSec) return null;
  log.sec = 0;
  if (!log.heard) return null;
  log.heard = false;
  return sec;
}
