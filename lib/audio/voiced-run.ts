import {
  type F0Frame,
  frameIntervalSec,
  isVoiced,
} from "@/lib/audio/f0-trace";

/**
 * Longest unbroken voiced run.
 *
 * A reducer over the voicing half of the trace: it walks the frames, groups the
 * consecutive voiced ones into runs, and reports how long the longest of them
 * lasted. Nothing here looks at what pitch was sung, which is the whole point
 * of having it separately from the pitch-hit streak that scoring already keeps.
 *
 * `maxCombo` in the scored rooms is the nearest existing primitive and it
 * answers a different question. It counts consecutive *targets hit*, so it
 * resets when a singer holds a note beautifully at the wrong pitch and it
 * advances in units of targets rather than seconds. "Sing eight bars without
 * stopping" is a claim about phonation being continuous, and a combo counter
 * cannot distinguish a singer who stopped to breathe from one who sang a wrong
 * note.
 *
 * What the number establishes, exactly: the longest stretch of the take during
 * which the pitch detector reported a confident fundamental on every frame,
 * allowing gaps no longer than `VOICED_BRIDGE_MAX_SEC` to be spanned.
 *
 * What it does not establish — and this is the confusion worth guarding in
 * code, because the two read alike in a lesson:
 *
 * - It is not the absence of a register crack. A crack is usually voiced
 *   throughout; the folds change mechanism, the timbre lurches, and the
 *   detector keeps returning a pitch the whole way through. A siren with an
 *   audible break can score a single unbroken run of its full length, and a
 *   clean siren sung with one quiet catch of breath can score two. Whether the
 *   crossing was smooth is a register-mechanism question, which no measurement
 *   in this app answers.
 * - It is not proof the singer did not stop. An unvoiced frame is any frame
 *   without a confident pitch, so a whispered or very quiet passage, a long
 *   consonant, or a detector failure on a low note all end a run without the
 *   singer having stopped singing.
 * - It says nothing about what was sung: not pitch, not key, not whether the
 *   phrase was the one asked for.
 */

/**
 * The longest unvoiced gap a run may span, in seconds.
 *
 * About three frames at 60 fps. The detector drops an occasional frame in the
 * middle of a perfectly steady note — a window that straddles a consonant, a
 * clarity score that dips under the gate for one hop — and splitting a six
 * second phrase into two three second ones on that basis would report the
 * detector's behaviour rather than the singer's. Anything longer than this is
 * taken at face value as the voice having stopped, because at 60 ms a real
 * breath or rest has not yet happened and a dropped frame already has.
 *
 * Gaps that are spanned stay inside the run and count toward its duration. A
 * run's duration is therefore wall-clock time from its first voiced frame to
 * its last, not a sum of voiced frames.
 */
export const VOICED_BRIDGE_MAX_SEC = 0.06;

/**
 * The shortest run worth reporting, in seconds. Two or three stray voiced
 * frames in the middle of room noise is not a phrase, and listing it as one
 * inflates the run count that callers use to describe how broken a take was.
 */
export const MIN_VOICED_RUN_SEC = 0.1;

export interface VoicedRun {
  /** Seconds into the trace at which the run's first voiced frame sits. */
  startSec: number;
  /** Seconds into the trace at which the run's last voiced frame sits. */
  endSec: number;
  /**
   * Wall-clock seconds the run covers, including any bridged gaps and one
   * frame interval for the final frame, which represents time as much as the
   * ones before it do.
   */
  durationSec: number;
  /** Frames with a confident pitch inside the run. */
  voicedFrames: number;
  /** Unvoiced gaps short enough to be spanned rather than end the run. */
  bridgedGaps: number;
}

export interface VoicedRunSummary {
  runs: VoicedRun[];
  /** The longest run, or null when nothing in the trace was voiced. */
  longest: VoicedRun | null;
  /** Convenience for the single number a lesson or chart wants. */
  longestSec: number | null;
  /** Seconds of the trace the detector called voiced, summed over all runs. */
  voicedSec: number;
}

export interface VoicedRunOptions {
  /** Override only to test the bridging rule; the default is the shipped one. */
  bridgeMaxSec?: number;
  minRunSec?: number;
}

/** Every voiced run in the trace, in time order. */
export function voicedRuns(
  frames: F0Frame[],
  options: VoicedRunOptions = {},
): VoicedRun[] {
  const bridgeMaxSec = options.bridgeMaxSec ?? VOICED_BRIDGE_MAX_SEC;
  const minRunSec = options.minRunSec ?? MIN_VOICED_RUN_SEC;
  const frameSec = frameIntervalSec(frames);

  const runs: VoicedRun[] = [];
  let open: VoicedRun | null = null;
  // Where the current unvoiced stretch began, so its length can be compared
  // against the bridging allowance once the voice comes back.
  let gapStart: number | null = null;

  for (const frame of frames) {
    if (isVoiced(frame)) {
      if (open === null) {
        open = {
          startSec: frame.t,
          endSec: frame.t,
          durationSec: frameSec,
          voicedFrames: 1,
          bridgedGaps: 0,
        };
      } else {
        if (gapStart !== null) open.bridgedGaps += 1;
        open.endSec = frame.t;
        open.durationSec = frame.t - open.startSec + frameSec;
        open.voicedFrames += 1;
      }
      gapStart = null;
      continue;
    }

    if (open === null) continue;
    if (gapStart === null) gapStart = frame.t;
    // The gap is measured from the last voiced frame rather than from the first
    // unvoiced one, because the silence began somewhere in between and the
    // conservative reading of "how long was the voice away" is the longer one.
    if (frame.t - open.endSec > bridgeMaxSec) {
      runs.push(open);
      open = null;
      gapStart = null;
    }
  }
  if (open !== null) runs.push(open);

  return runs.filter((run) => run.durationSec >= minRunSec);
}

/** The runs plus the one number most callers want off them. */
export function summarizeVoicedRuns(
  frames: F0Frame[],
  options: VoicedRunOptions = {},
): VoicedRunSummary {
  const runs = voicedRuns(frames, options);
  let longest: VoicedRun | null = null;
  let voicedSec = 0;
  const frameSec = frameIntervalSec(frames);
  for (const run of runs) {
    voicedSec += run.voicedFrames * frameSec;
    if (longest === null || run.durationSec > longest.durationSec) longest = run;
  }
  return {
    runs,
    longest,
    longestSec: longest === null ? null : longest.durationSec,
    voicedSec,
  };
}

/** Seconds of the longest unbroken voiced run, or null if nothing was voiced. */
export function longestVoicedRunSec(
  frames: F0Frame[],
  options: VoicedRunOptions = {},
): number | null {
  return summarizeVoicedRuns(frames, options).longestSec;
}
