/**
 * No practice credit for silence. A muted mic or the wrong input used to log
 * a session nobody sang as practice: XP, a streak day, "First note", free
 * minutes and a program tick, and its zero scores then steered the coach.
 * Every room that logs practice from the microphone refuses a session the mic
 * heard nothing of; silent-session.test.ts drives each room's own rule with a
 * silent input, and fails when a new room calls logSession without one.
 *
 * Most rooms carry their own measure of "heard" (the studio and the pitch
 * meter count heard milliseconds, /analyze a ListenLog, songs runHearing,
 * warmups a voiced frame per rep). This latch is the plain one for a room
 * that only needs to know whether any fresh voiced frame arrived at all.
 */
export interface HeardLatch {
  heard: boolean;
}

export const createHeardLatch = (): HeardLatch => ({ heard: false });

/** One mic frame: set the latch when it carried a fresh voiced reading. */
export function hearFrame(latch: HeardLatch, voiced: boolean): void {
  if (voiced) latch.heard = true;
}

/**
 * Seconds a session may log: its length when it ran `minSec` and the mic
 * heard something, else null. Silence is never practice, however long.
 */
export function creditedSeconds(sec: number, minSec: number, heard: boolean): number | null {
  return heard && sec >= minSec ? sec : null;
}

/** The heading the warmups, songs and ear games show over a run that heard nothing. */
export const NO_SOUND_TITLE = "No sound picked up";
