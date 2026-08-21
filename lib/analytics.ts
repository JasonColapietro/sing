/**
 * Vocal analytics — the maths behind Pro's per-note reporting.
 *
 * Pure and structurally typed, so the coach, the charts, and the exercises
 * that record data can all share it. Nothing here imports React or storage.
 *
 * The tally is built around *scored seconds*, not attempts, because that is
 * what the exercises actually measure: warmups and songs both accumulate
 * seconds spent within tolerance of a target note against the seconds that
 * note was on screen. A three-second hold in the studio is simply sec=3.
 *
 * Exercises produce a pitch sample per animation frame, which is far too much
 * to keep. We fold frames into one tally per note at write time — a few
 * hundred bytes a session instead of tens of kilobytes.
 */

/** In-tune threshold, matching the ±25 cents the studio shows singers. */
export const IN_TUNE_CENTS = 25;

/** Below this much scored time, a note's accuracy is noise. */
export const MIN_SCORED_SEC = 1.5;

/** What one note looked like across a session. */
export interface NoteTally {
  /** Seconds this note was scorable. */
  sec: number;
  /** Of those, seconds sung within tolerance. */
  hitSec: number;
  /** Mean absolute cents error over voiced frames, or null if not measured. */
  cents: number | null;
  /** Voiced frames behind the cents mean. */
  frames: number;
}

/** Per-note tallies keyed by MIDI note number as a string (JSON-friendly). */
export type NoteTallies = Record<string, NoteTally>;

/** What an exercise reports for one note it scored. */
export interface NoteScore {
  midi: number;
  /** Seconds sung within tolerance. */
  hitSec: number;
  /** Seconds the note was scorable. */
  possibleSec: number;
  /** Sum of absolute cents error over voiced frames, when measured. */
  centsSum?: number;
  /** Number of voiced frames behind centsSum. */
  centsFrames?: number;
}

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

/* ------------------------------------------------------------------ build */

/** Folds an exercise's per-note scores into the compact tally we persist. */
export function tallyFromScores(scores: readonly NoteScore[]): NoteTallies {
  const out: NoteTallies = {};
  for (const score of scores) {
    if (!Number.isFinite(score.midi) || !Number.isFinite(score.possibleSec)) continue;
    const midi = Math.round(score.midi);
    if (midi < 0 || midi > 127 || score.possibleSec <= 0) continue;

    const key = String(midi);
    const frames = score.centsFrames ?? 0;
    const centsSum = frames > 0 ? (score.centsSum ?? 0) : 0;
    const prev = out[key];

    if (prev) {
      const totalFrames = prev.frames + frames;
      out[key] = {
        sec: round1(prev.sec + score.possibleSec),
        hitSec: round1(prev.hitSec + Math.min(score.hitSec, score.possibleSec)),
        frames: totalFrames,
        cents:
          totalFrames > 0
            ? round1(((prev.cents ?? 0) * prev.frames + centsSum) / totalFrames)
            : null,
      };
    } else {
      out[key] = {
        sec: round1(score.possibleSec),
        hitSec: round1(Math.min(score.hitSec, score.possibleSec)),
        frames,
        cents: frames > 0 ? round1(centsSum / frames) : null,
      };
    }
  }
  return out;
}

/** Adds `from` into `into`, keeping the cents mean frame-weighted. */
export function mergeTallies(
  into: NoteTallies,
  from: NoteTallies | undefined,
): NoteTallies {
  if (!from) return into;
  for (const [key, add] of Object.entries(from)) {
    const prev = into[key];
    if (!prev) {
      into[key] = { ...add };
      continue;
    }
    const frames = prev.frames + add.frames;
    into[key] = {
      sec: round1(prev.sec + add.sec),
      hitSec: round1(prev.hitSec + add.hitSec),
      frames,
      cents:
        frames > 0
          ? round1(
              ((prev.cents ?? 0) * prev.frames + (add.cents ?? 0) * add.frames) /
                frames,
            )
          : null,
    };
  }
  return into;
}

/* -------------------------------------------------------------- aggregate */

interface SessionLike {
  day: string;
  date: string;
  type: string;
  score?: number;
  notes?: NoteTallies;
}

/** Combines every session's tallies into one picture of the voice. */
export function aggregateNotes(
  sessions: readonly SessionLike[],
  { sinceDay }: { sinceDay?: string } = {},
): NoteTallies {
  const out: NoteTallies = {};
  for (const session of sessions) {
    if (sinceDay && session.day < sinceDay) continue;
    mergeTallies(out, session.notes);
  }
  return out;
}

/** Accuracy for one note, 0..100. */
export function accuracyOf(tally: NoteTally): number {
  return tally.sec === 0 ? 0 : Math.round((tally.hitSec / tally.sec) * 100);
}

export interface NoteReport {
  midi: number;
  /** 0..100 */
  accuracy: number;
  /** Seconds of scored practice on this note. */
  sec: number;
  /** Mean absolute cents error, or null if never measured. */
  cents: number | null;
}

/** Every note with enough scored time to judge, low to high. */
export function noteReports(
  tallies: NoteTallies,
  { minSec = MIN_SCORED_SEC }: { minSec?: number } = {},
): NoteReport[] {
  return Object.entries(tallies)
    .map(([midi, tally]) => ({
      midi: Number(midi),
      accuracy: accuracyOf(tally),
      sec: tally.sec,
      cents: tally.cents,
    }))
    .filter((report) => report.sec >= minSec)
    .sort((a, b) => a.midi - b.midi);
}

/**
 * The notes worth practising, worst first. Ties break toward the note with
 * more scored time, so a genuinely shaky note outranks one bad run.
 */
export function weakNotes(
  tallies: NoteTallies,
  { limit = 3, minSec = MIN_SCORED_SEC }: { limit?: number; minSec?: number } = {},
): NoteReport[] {
  return noteReports(tallies, { minSec })
    .sort((a, b) => a.accuracy - b.accuracy || b.sec - a.sec)
    .slice(0, limit);
}

export function strongNotes(
  tallies: NoteTallies,
  { limit = 3, minSec = MIN_SCORED_SEC }: { limit?: number; minSec?: number } = {},
): NoteReport[] {
  return noteReports(tallies, { minSec })
    .sort((a, b) => b.accuracy - a.accuracy || b.sec - a.sec)
    .slice(0, limit);
}

/** In-tune rate across all scored time, or null when nothing is tallied. */
export function overallAccuracy(tallies: NoteTallies): number | null {
  let sec = 0;
  let hitSec = 0;
  for (const tally of Object.values(tallies)) {
    sec += tally.sec;
    hitSec += tally.hitSec;
  }
  return sec === 0 ? null : Math.round((hitSec / sec) * 100);
}

/** Total scored seconds, for deciding whether a chart has enough to show. */
export function scoredSeconds(tallies: NoteTallies): number {
  return Object.values(tallies).reduce((total, tally) => total + tally.sec, 0);
}

/* ----------------------------------------------------------------- ladder */

/**
 * One rep of a warmup ladder: the root it was sung at, and what it scored.
 * Reps are in the order they were sung; the walk climbs and descends, so the
 * roots are not sorted.
 */
export interface LadderRep {
  root: number;
  score: number;
  skipped?: boolean;
}

export interface LadderBreak {
  /** Root of the rep the ladder came apart on. */
  root: number;
  /** Best score reached earlier in the same climb. */
  heldAt: number;
  /** What that rep scored. */
  score: number;
  /** heldAt - score, never below the minimum drop. */
  drop: number;
}

/** Under this, a dip is rep-to-rep noise rather than the ladder breaking. */
export const MIN_LADDER_DROP = 12;

/**
 * Where a climb of the warmup ladder stopped holding: the *first* rep that
 * fell a real distance below the best score reached earlier in the same
 * climb.
 *
 * First, not worst, because a climb rises — once the voice gives out every
 * root above it scores badly too, so the note worth naming is where it gave
 * out, not the lowest number that follows.
 *
 * A warmup walks the ladder endlessly — every semitone up to the top of the
 * range, then back down, over and over — so `reps` is a triangle wave that
 * revisits the same roots many times. Only a *rising* run of roots can break.
 * A rep sung at or below the previous rep's root is the walk turning around,
 * so it starts a fresh climb and clears the best held so far; the roots are
 * the only direction we have, and none is asked of the caller. Without that
 * reset an ordinary wobble on the way down would be measured against a peak
 * set dozens of reps earlier and named as a break on a root the singer
 * already sang cleanly on the way up.
 *
 * The break returned is the earliest one in the session, on whichever climb
 * it happened: a voice that holds for ten minutes and then gives out is
 * telling us something the first climb alone cannot.
 *
 * Returns null when nothing fell far enough to name. A ladder that held is a
 * real result, and inventing a weak point out of a three-point wobble would
 * tell the singer to go practice a note that is fine.
 */
export function ladderBreak(
  reps: readonly LadderRep[],
  { minDrop = MIN_LADDER_DROP }: { minDrop?: number } = {},
): LadderBreak | null {
  let bestSoFar: number | null = null;
  let prevRoot: number | null = null;
  for (const rep of reps) {
    // A skipped rep scores 0 by convention; counting it would report every
    // skip as the voice falling apart. It does not end the climb either — the
    // reps either side of the gap are still rising.
    if (rep.skipped) continue;
    // At or below the previous root, the walk has turned: this rep is the
    // foot of a new climb, with nothing above it yet to have fallen from.
    if (prevRoot !== null && rep.root <= prevRoot) bestSoFar = null;
    prevRoot = rep.root;
    if (bestSoFar !== null) {
      const drop = bestSoFar - rep.score;
      if (drop >= minDrop) {
        return { root: rep.root, heldAt: bestSoFar, score: rep.score, drop };
      }
    }
    bestSoFar = bestSoFar === null ? rep.score : Math.max(bestSoFar, rep.score);
  }
  return null;
}

/* ------------------------------------------------------------------ range */

export interface RangeEntry {
  lowMidi: number;
  highMidi: number;
  testedAt: string;
  voiceTypeLabel?: string;
}

export interface RangePoint extends RangeEntry {
  /** Semitones between low and high. */
  semitones: number;
}

/** Range tests oldest first, with the span precomputed for charting. */
export function rangeSeries(history: readonly RangeEntry[]): RangePoint[] {
  return [...history]
    .filter(
      (entry) =>
        Number.isFinite(entry.lowMidi) &&
        Number.isFinite(entry.highMidi) &&
        entry.highMidi > entry.lowMidi &&
        !Number.isNaN(Date.parse(entry.testedAt)),
    )
    .sort((a, b) => Date.parse(a.testedAt) - Date.parse(b.testedAt))
    .map((entry) => ({ ...entry, semitones: entry.highMidi - entry.lowMidi }));
}

/** Semitones gained since the first test. Null until there are two. */
export function rangeGrowth(history: readonly RangeEntry[]): number | null {
  const series = rangeSeries(history);
  if (series.length < 2) return null;
  return series[series.length - 1].semitones - series[0].semitones;
}

/* ----------------------------------------------------------------- trends */

export interface ScorePoint {
  /** YYYY-MM-DD of that week's Monday. */
  weekStart: string;
  /** Mean score that week, 0..100. */
  score: number;
  sessions: number;
}

function mondayOf(day: string): string {
  const date = new Date(`${day}T00:00:00`);
  if (Number.isNaN(date.getTime())) return day;
  const shift = (date.getDay() + 6) % 7;
  date.setDate(date.getDate() - shift);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Mean scored performance per week, oldest first. */
export function scoreTrend(
  sessions: readonly SessionLike[],
  { weeks = 8 }: { weeks?: number } = {},
): ScorePoint[] {
  const buckets = new Map<string, { sum: number; n: number }>();
  for (const session of sessions) {
    if (session.score === undefined) continue;
    const key = mondayOf(session.day);
    const bucket = buckets.get(key) ?? { sum: 0, n: 0 };
    bucket.sum += session.score;
    bucket.n += 1;
    buckets.set(key, bucket);
  }
  return [...buckets.entries()]
    .map(([weekStart, bucket]) => ({
      weekStart,
      score: Math.round(bucket.sum / bucket.n),
      sessions: bucket.n,
    }))
    .sort((a, b) => a.weekStart.localeCompare(b.weekStart))
    .slice(-weeks);
}

/** Change in mean score between the first and last week on record. */
export function scoreDelta(sessions: readonly SessionLike[]): number | null {
  const trend = scoreTrend(sessions, { weeks: 520 });
  if (trend.length < 2) return null;
  return trend[trend.length - 1].score - trend[0].score;
}

/** Mean score for one activity type over recent days, or null if unscored. */
export function meanScoreByType(
  sessions: readonly SessionLike[],
  type: string,
  { sinceDay }: { sinceDay?: string } = {},
): number | null {
  let sum = 0;
  let n = 0;
  for (const session of sessions) {
    if (session.type !== type || session.score === undefined) continue;
    if (sinceDay && session.day < sinceDay) continue;
    sum += session.score;
    n += 1;
  }
  return n === 0 ? null : Math.round(sum / n);
}
