import type { WarmupMode } from "@/lib/progress-shape";

/** Count-in clicks before every scored window. */
export const COUNT_IN_CLICKS = 2;

/**
 * Seconds of lead-in before a scored window opens: two beats of the exercise's
 * own pulse, floored so a fast pattern still leaves room to breathe.
 *
 * The player previously opened the scored window in the same instant the guide's
 * last note decayed, so a singer lost the whole first note to an ordinary breath.
 * Scaling by noteDur rather than using a constant means a slow exercise gets a
 * slow breath and 0.75x tempo stretches it with everything else.
 */
export const MIN_LEAD_SEC = 0.8;
/**
 * And capped. Two beats of a 3.5-second sustained hold is a seven-second wait
 * with nothing on screen, and a singer moving from a fast scale to a slow hold
 * felt the wait times "all over the place" — the lead-in swung from 0.8s to 7s
 * between neighbouring exercises. Two seconds is a full, unhurried breath; no
 * exercise needs more than that between the count-in and the first note.
 */
export const MAX_LEAD_SEC = 2;
export function leadSec(noteDur: number): number {
  return Math.min(MAX_LEAD_SEC, Math.max(MIN_LEAD_SEC, noteDur * 2));
}

/**
 * Seconds the scored window stays open past the pattern's last note.
 *
 * Not extra singing time: `targetMidiAt` returns null past the final segment, so
 * nothing accumulates here. It exists so the final note's frames, which arrive
 * up to `scoreLagSec` late, are still inside the window when they land.
 */
export const GRACE_SEC = 0.35;

export interface RepPlan {
  /** Audio-clock time of this rep's first scheduled event. */
  t0: number;
  /** Offset from t0 where a guide-alone pass starts, or null when there is none. */
  guideAt: number | null;
  /** Offset from t0 of the first count-in click. */
  leadAt: number;
  /** Offset from t0 where the scored window opens. */
  singAt: number;
  /** Length of the scored window, pattern plus grace. */
  singDur: number;
  /** Length of the whole rep. The next rep's t0 is t0 + repDur. */
  repDur: number;
  /** Whether the guide sounds during the scored window. */
  guideUnderVoice: boolean;
}

/**
 * One rep, in both modes.
 *
 * Sing-along teaches the pattern once: rep 0 carries a guide-alone pass, every
 * later rep goes straight to the count-in and the guide sounds under the voice.
 * Call-and-response plays the guide alone before every rep and leaves the scored
 * window silent, which is the harder task and is scored as its own thing.
 */
export function planRep(opts: {
  mode: WarmupMode;
  repIndex: number;
  t0: number;
  patternSec: number;
  noteDur: number;
}): RepPlan {
  const { mode, repIndex, t0, patternSec, noteDur } = opts;
  const lead = leadSec(noteDur);
  const teaches = mode === "call-response" || repIndex === 0;
  const guideAt = teaches ? 0 : null;
  const leadAt = teaches ? patternSec : 0;
  const singAt = leadAt + lead;
  const singDur = patternSec + GRACE_SEC;
  return {
    t0,
    guideAt,
    leadAt,
    singAt,
    singDur,
    repDur: singAt + singDur,
    guideUnderVoice: mode === "sing-along",
  };
}

/** Audio-clock times of this rep's count-in clicks, first one accented. */
export function clickTimes(plan: RepPlan, noteDur: number): number[] {
  const beat = leadSec(noteDur) / COUNT_IN_CLICKS;
  return Array.from(
    { length: COUNT_IN_CLICKS },
    (_, i) => plan.t0 + plan.leadAt + i * beat,
  );
}
