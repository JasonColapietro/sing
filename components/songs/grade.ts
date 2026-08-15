/**
 * Karaoke-style grading, kept free of JSX so it can be unit tested and
 * reused by both the summary panel and the shareable result card without
 * either owning the rules.
 */

import { JUDGMENTS, emptyTally, type JudgmentTally } from "./lib";

export type Grade = "S" | "A" | "B" | "C" | "D";
export type Tone = "ok" | "amber" | "rec";

/**
 * Score floor each letter needs before any tiebreak runs. Deliberately
 * aligned with the score-color split session-summary.tsx already uses
 * (scoreTone: >=80 "ok", >=50 "amber", else "rec") so a grade badge never
 * contradicts the color of the raw score sitting next to it: S and A read
 * "ok", B and C read "amber", D reads "rec" (see toneForGrade below).
 */
export const GRADE_SCORE_FLOOR: Record<Grade, number> = {
  S: 95, // near-flawless: room for a "great" or two, not more
  A: 80, // matches scoreTone's "ok" floor — clearly nailed it
  B: 65, // solidly in tune, a handful of rough notes
  C: 50, // matches scoreTone's "amber" floor — recognizable, needs work
  D: 0, // below the amber floor: more misses than hits
};

/** Ascending order — index math for "the next grade up" relies on this. */
const GRADE_ORDER: Grade[] = ["D", "C", "B", "A", "S"];

/**
 * A single badly-missed word can drag the average score below a threshold
 * even when the rest of the take was clean and unbroken — the average
 * punishes that one word far more than a listener would. Within this many
 * points of the next grade, a long combo or a mostly-perfect judgment mix
 * is taken as evidence the take was cleaner than the raw average shows, and
 * bumps the letter up by exactly one. It never skips a grade and never
 * fires far from a boundary, so it can't turn a genuinely average take into
 * a top grade — only resolve a close call in the singer's favor.
 */
export const TIEBREAK_SCORE_MARGIN = 3;
/** Share of judged notes that must be "perfect" for the tiebreak to apply. */
export const TIEBREAK_PERFECT_RATIO = 0.6;
/** Share of judged notes the max combo must cover for the tiebreak to apply. */
export const TIEBREAK_COMBO_RATIO = 0.8;

export const STAR_MAX = 5;

export interface GradeResult {
  grade: Grade;
  /** 0..STAR_MAX, rounded from the raw score independent of the tiebreak. */
  stars: number;
  tone: Tone;
}

function letterForScore(score: number): Grade {
  for (let i = GRADE_ORDER.length - 1; i >= 0; i--) {
    const g = GRADE_ORDER[i];
    if (score >= GRADE_SCORE_FLOOR[g]) return g;
  }
  return "D";
}

function nextGradeUp(g: Grade): Grade {
  const i = GRADE_ORDER.indexOf(g);
  return GRADE_ORDER[Math.min(GRADE_ORDER.length - 1, i + 1)];
}

/** Matches the amber/ok/rec convention scoreTone() uses for raw scores. */
export function toneForGrade(grade: Grade): Tone {
  if (grade === "S" || grade === "A") return "ok";
  if (grade === "D") return "rec";
  return "amber";
}

/**
 * Maps a finished, scored session to a letter grade and star rating.
 *
 * Returns null whenever `score` is undefined — that's how a listen-mode
 * session (no mic, so nothing was judged) is represented, and a session
 * with nothing judged must not be able to earn a grade. Callers should
 * treat null as "no grade to show", not as a D.
 */
export function computeGrade(
  score: number | undefined,
  maxCombo: number,
  judgments: JudgmentTally,
): GradeResult | null {
  if (score === undefined) return null;

  let grade = letterForScore(score);

  const total = JUDGMENTS.reduce((n, j) => n + judgments[j], 0);
  if (total > 0) {
    const bumped = nextGradeUp(grade);
    const nextFloor = GRADE_SCORE_FLOOR[bumped];
    const withinMargin = score < nextFloor && nextFloor - score <= TIEBREAK_SCORE_MARGIN;
    if (withinMargin) {
      const perfectRatio = judgments.perfect / total;
      const comboRatio = maxCombo / total;
      if (perfectRatio >= TIEBREAK_PERFECT_RATIO || comboRatio >= TIEBREAK_COMBO_RATIO) {
        grade = bumped;
      }
    }
  }

  const stars = Math.max(0, Math.min(STAR_MAX, Math.round((score / 100) * STAR_MAX)));
  return { grade, stars, tone: toneForGrade(grade) };
}

/**
 * Grade for a session that produces one score and no per-note judgments —
 * a warmup ladder, where nothing builds a JudgmentTally.
 *
 * The tiebreak above only runs when a tally has entries, so the empty one
 * passed here is the honest input rather than a placeholder: the letter and
 * stars come from the score alone. A warmup therefore can't earn the combo
 * bump a song can, which is correct — there is no combo to earn it with.
 */
export function gradeForScore(score: number | undefined): GradeResult | null {
  return computeGrade(score, 0, emptyTally());
}

/** Screen-reader text for a star rating — never rely on glyphs alone. */
export function starRatingLabel(stars: number): string {
  return `${stars} of ${STAR_MAX} stars`;
}

const FILLED_STAR = "★";
const EMPTY_STAR = "☆";

/** Plain-text star glyphs, filled then empty. Pair with starRatingLabel for a11y. */
export function starGlyphs(stars: number): string {
  const filled = Math.max(0, Math.min(STAR_MAX, stars));
  return FILLED_STAR.repeat(filled) + EMPTY_STAR.repeat(STAR_MAX - filled);
}
