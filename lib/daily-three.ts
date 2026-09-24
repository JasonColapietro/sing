// Today's three: a daily set of three warmup exercises picked for this singer.
//
// "Today's warmup" answers "which routine" — the same fixed sequence for
// everyone, chosen by the hour and the last three scores. Vanido's daily set
// answers a narrower question: of everything you could sing, which three would
// do you the most good today? That is this module. It reads the warmup log,
// favours what the singer is weakest at or has not sung in a while, keeps the
// three from being three versions of one thing, and puts one exercise they
// already sing well in the set so the session is not all struggle.
//
// Difficulty adapts per exercise through the one lever the player already
// has and every exercise honours: the starting tempo. Nothing here invents a
// new mechanic; the singer can still change tempo under Adjust.
//
// Pure and deterministic. The same log and the same local day give the same
// plan, and sessions logged today are ignored for picking, so singing one of
// the three does not reshuffle the other two mid-afternoon.

import { EXERCISES, titlesFor, type WarmupExercise } from "@/components/warmups/exercises";
import type { SessionLog } from "@/lib/progress-shape";

/** Starting tempos the planner may hand the player — a subset of its TEMPOS. */
export type DailyTempo = 0.5 | 0.75 | 1 | 1.25;

/**
 * What an exercise trains, derived from its shape rather than tagged, so a
 * new catalogue entry lands in a kind without anyone remembering to label it.
 */
export type ExerciseKind = "sirens" | "holds" | "runs" | "leaps" | "patterns";

export const KIND_LABELS: Record<ExerciseKind, string> = {
  sirens: "Siren",
  holds: "Sustain",
  runs: "Agility",
  leaps: "Leaps",
  patterns: "Scales and arpeggios",
};

/**
 * Why a pick is in today's set:
 * - `focus`: among the singer's lowest recent scores.
 * - `refresh`: sung well once, but not for a while.
 * - `new`: never scored.
 * - `confidence`: one they already sing well, to warm up on.
 */
export type PickRole = "focus" | "refresh" | "new" | "confidence";

export interface DailyPick {
  exercise: WarmupExercise;
  kind: ExerciseKind;
  role: PickRole;
  /** The tempo the player should start at. */
  tempo: DailyTempo;
  /** How `tempo` sits against the normal 1x. */
  step: "down" | "hold" | "up";
  /** Mean of the last three scores before today, rounded, or null if unscored. */
  recentAvg: number | null;
  /** One line, in the singer's terms, on why this one is here. */
  why: string;
}

export interface DailyThree {
  /** The local day this plan is for, YYYY-MM-DD. */
  day: string;
  picks: DailyPick[];
}

/** Scores that count as "sings it well" — the two-star floor. */
export const CONFIDENT_AVG = 75;
/** How many of an exercise's most recent scores the planner reads. */
const RECENT_SCORES = 3;
/** Days after which an unsung exercise is worth bringing back. */
const STALE_DAYS = 14;
/** Staleness adds up to this many days' worth of need, one point a day. */
const MAX_STALE_BONUS = 28;
/** Seeded tie-breaking noise, in need points: enough to rotate near-equals. */
const JITTER = 8;
/**
 * The need an unscored exercise starts with, by tier. A new singer should
 * meet the foundations first; an advanced exercise nobody has tried is not
 * the most useful thing to hand them, even though it has the least history.
 */
const NEW_NEED: Record<WarmupExercise["tier"], number> = {
  beginner: 60,
  intermediate: 45,
  advanced: 25,
};

export function exerciseKind(ex: WarmupExercise): ExerciseKind {
  if (ex.glide) return "sirens";
  const steps = ex.buildSteps(0);
  const notes = steps.flat();
  if (notes.length <= 2 || (ex.noteDur ?? 0) >= 2) return "holds";
  if ((ex.noteDur ?? 0.55) <= 0.3) return "runs";
  let widest = 0;
  for (const step of steps) {
    for (let i = 1; i < step.length; i++) widest = Math.max(widest, Math.abs(step[i] - step[i - 1]));
  }
  return widest >= 7 ? "leaps" : "patterns";
}

/** FNV-1a over a string, folded to [0, 1). Stable across engines and reloads. */
export function seededUnit(key: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < key.length; i++) {
    h ^= key.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0) / 0x100000000;
}

/** Whole days from `from` to `to`, both YYYY-MM-DD. */
function daysBetween(from: string, to: string): number {
  const a = Date.parse(`${from}T00:00:00Z`);
  const b = Date.parse(`${to}T00:00:00Z`);
  if (!Number.isFinite(a) || !Number.isFinite(b)) return 0;
  return Math.max(0, Math.round((b - a) / 86_400_000));
}

/**
 * The starting tempo an exercise has earned from its recent scores. Two
 * clean takes in a row step it up; a middling average steps it down one; a
 * poor one steps it down two. An exercise never scored starts at 1x, except
 * the advanced tier, whose own tips say to learn it slow first.
 */
export function tempoForScores(
  recent: readonly number[],
  tier: WarmupExercise["tier"],
): DailyTempo {
  if (recent.length === 0) return tier === "advanced" ? 0.75 : 1;
  const avg = recent.reduce((a, b) => a + b, 0) / recent.length;
  if (recent.length >= 2 && recent[0] >= 85 && recent[1] >= 85) return 1.25;
  if (avg >= 70) return 1;
  if (avg >= 50) return 0.75;
  return 0.5;
}

interface Candidate {
  exercise: WarmupExercise;
  kind: ExerciseKind;
  /** Most recent first. */
  recent: number[];
  avg: number | null;
  /** Days since it was last scored, or null if never. */
  idle: number | null;
  jitter: number;
  need: number;
}

function candidates(
  sessions: readonly SessionLog[],
  day: string,
  catalogue: readonly WarmupExercise[],
): Candidate[] {
  // Only the free catalogue, whatever the caller passes: the contract rule is
  // that EXERCISES is what a free singer may start, and this plan is linked
  // from places that do not know whether the viewer is Pro.
  const free = catalogue.filter((ex) => EXERCISES.some((e) => e.id === ex.id));
  // Before today only — see the note at the top of the file.
  const past = sessions
    .filter((s) => s.type === "warmup" && s.day < day && typeof s.score === "number" && Number.isFinite(s.score))
    .sort((a, b) => b.date.localeCompare(a.date));

  return free.map((exercise) => {
    const titles = titlesFor(exercise.title);
    const mine = past.filter((s) => s.detail !== undefined && titles.includes(s.detail));
    const recent = mine.slice(0, RECENT_SCORES).map((s) => s.score!);
    const avg = recent.length ? recent.reduce((a, b) => a + b, 0) / recent.length : null;
    const idle = mine.length ? daysBetween(mine[0].day, day) : null;
    const jitter = seededUnit(`${day}:${exercise.id}`);
    const need =
      avg === null
        ? NEW_NEED[exercise.tier] + jitter * JITTER
        : 100 - avg + Math.min(idle ?? 0, MAX_STALE_BONUS) + jitter * JITTER;
    return { exercise, kind: exerciseKind(exercise), recent, avg, idle, jitter, need };
  });
}

function pick(c: Candidate, role: PickRole, why: string): DailyPick {
  const tempo = tempoForScores(c.recent, c.exercise.tier);
  return {
    exercise: c.exercise,
    kind: c.kind,
    role,
    tempo,
    step: tempo < 1 ? "down" : tempo > 1 ? "up" : "hold",
    recentAvg: c.avg === null ? null : Math.round(c.avg),
    why,
  };
}

/**
 * The confidence slot: an exercise the singer already sings well, rotated
 * day to day by staleness and the seed so it is not the same favourite every
 * morning. With nothing at two stars yet it falls back to their best scored
 * exercise, and with no history at all to an easy foundation exercise.
 */
function confidencePick(pool: Candidate[]): DailyPick | null {
  const strong = pool.filter((c) => c.avg !== null && c.avg >= CONFIDENT_AVG);
  if (strong.length > 0) {
    const c = strong.reduce((best, c) => (rotation(c) > rotation(best) ? c : best));
    return pick(c, "confidence", `One you sing well (${Math.round(c.avg!)}% lately), to warm up on.`);
  }
  const scored = pool.filter((c) => c.avg !== null);
  if (scored.length > 0) {
    const c = scored.reduce((best, c) => (c.avg! > best.avg! ? c : best));
    return pick(c, "confidence", `Your best lately (${Math.round(c.avg!)}%), to warm up on.`);
  }
  const easy = pool.filter((c) => c.exercise.tier === "beginner");
  if (easy.length === 0) return null;
  const c = easy.reduce((best, c) => (c.jitter > best.jitter ? c : best));
  return pick(c, "new", "An easy one to start with.");
}

function rotation(c: Candidate): number {
  return Math.min(c.idle ?? 0, STALE_DAYS) / STALE_DAYS + c.jitter;
}

function focusWhy(c: Candidate): { role: PickRole; why: string } {
  if (c.avg === null) return { role: "new", why: "New to you — see where it sits." };
  if (c.avg >= CONFIDENT_AVG && (c.idle ?? 0) >= STALE_DAYS) {
    return { role: "refresh", why: `Not sung in ${c.idle} days.` };
  }
  return { role: "focus", why: `One of your lowest lately (${Math.round(c.avg)}%).` };
}

/**
 * Plan today's three.
 *
 * The confidence pick goes first — familiar ground to warm up on — then the
 * two exercises with the most need, each from a kind not already in the set.
 * Only if the catalogue runs out of kinds does a kind repeat.
 */
export function planDailyThree({
  sessions,
  day,
  catalogue = EXERCISES,
}: {
  sessions: readonly SessionLog[];
  /** The singer's local day, YYYY-MM-DD (lib/progress `localDay()`). */
  day: string;
  catalogue?: readonly WarmupExercise[];
}): DailyThree {
  const pool = candidates(sessions, day, catalogue);
  const picks: DailyPick[] = [];
  const first = confidencePick(pool);
  if (first) picks.push(first);

  const byNeed = pool
    .filter((c) => !picks.some((p) => p.exercise.id === c.exercise.id))
    .sort((a, b) => b.need - a.need || a.exercise.id.localeCompare(b.exercise.id));
  const take = (c: Candidate) => {
    const { role, why } = focusWhy(c);
    picks.push(pick(c, role, why));
  };
  for (const c of byNeed) {
    if (picks.length >= 3) break;
    if (!picks.some((p) => p.kind === c.kind)) take(c);
  }
  for (const c of byNeed) {
    if (picks.length >= 3) break;
    if (!picks.some((p) => p.exercise.id === c.exercise.id)) take(c);
  }
  return { day, picks };
}

/**
 * Which of today's picks have been sung today, in plan order. Any logged
 * warmup session under the exercise's title counts — the player only logs a
 * session once something was actually sung.
 */
export function dailyThreeDone(plan: DailyThree, sessions: readonly SessionLog[]): boolean[] {
  return plan.picks.map((p) => {
    const titles = titlesFor(p.exercise.title);
    return sessions.some(
      (s) => s.type === "warmup" && s.day === plan.day && s.detail !== undefined && titles.includes(s.detail),
    );
  });
}

/** The planned starting tempo for an exercise, if it is in today's set. */
export function dailyTempoFor(plan: DailyThree | null, exerciseId: string): DailyTempo | null {
  return plan?.picks.find((p) => p.exercise.id === exerciseId)?.tempo ?? null;
}
