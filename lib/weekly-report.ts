import { TYPE_META } from "@/components/progress/format";
import type { ActivityType, SessionLog } from "./progress-shape";
import { starsForScore } from "./stars";

/**
 * The weekly report, as pure functions over the session log.
 *
 * /progress shows the week so far against the complete previous week; the
 * "Your week" card (components/weekly-report-card.tsx) shows the week that just
 * ended against the one before it. Both read the same boundaries and the same
 * totals from here, so the two surfaces cannot disagree about what "last week"
 * was. No React, no DOM, no storage: everything takes `now` so the tests can
 * pin a date and a timezone.
 *
 * Weeks are Monday-based and built from local calendar-day keys, the same
 * YYYY-MM-DD strings every SessionLog carries in `day`. Day arithmetic goes
 * through `new Date(y, m, d, 12)` and setDate rather than adding 86 400 000ms,
 * because a DST week is 167 or 169 hours long and millisecond maths lands on
 * the wrong side of midnight. Noon, not midnight, because a handful of zones
 * move their clocks at midnight and have no 00:00 on the changeover day.
 */

/** Local calendar day as YYYY-MM-DD — the same key lib/progress's localDay writes. */
function dayKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function shiftDays(d: Date, n: number): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + n, 12);
}

/** Local noon on the Monday of the week containing `now`. */
function mondayNoon(now: Date): Date {
  const noon = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12);
  return shiftDays(noon, -((noon.getDay() + 6) % 7));
}

/**
 * Day keys for the current week and the two before it. `lastEnd` is the
 * Sunday that closes last week; everything is inclusive.
 */
export function weekBoundaries(now = new Date()) {
  const monday = mondayNoon(now);
  return {
    today: dayKey(now),
    start: dayKey(monday),
    lastStart: dayKey(shiftDays(monday, -7)),
    lastEnd: dayKey(shiftDays(monday, -1)),
    priorStart: dayKey(shiftDays(monday, -14)),
    priorEnd: dayKey(shiftDays(monday, -8)),
  };
}

export interface WeekTotals {
  /** Up to three per scored session, on the practice-room scale in lib/stars. */
  stars: number;
  sessions: number;
  /** Includes unscored activity: a listen-through is still time spent singing. */
  durationSec: number;
}

/** Totals for sessions whose day falls in [from, to], inclusive. */
export function weekTotals(
  sessions: readonly SessionLog[],
  from: string,
  to: string,
): WeekTotals {
  const totals: WeekTotals = { stars: 0, sessions: 0, durationSec: 0 };
  for (const s of sessions) {
    if (s.day < from || s.day > to) continue;
    totals.sessions++;
    totals.durationSec += s.durationSec;
    totals.stars += starsForScore(s.score);
  }
  return totals;
}

/** Suggestion kinds, most specific first; see `pickSuggestion`. */
export type WeeklySuggestion =
  | { kind: "neglected"; type: ActivityType; label: string; href: string; before: number }
  | { kind: "weakest"; type: ActivityType; label: string; href: string; average: number; overall: number }
  | { kind: "more-days"; days: number }
  | { kind: "keep-going"; days: number };

export interface WeekInReview {
  /** Monday of the reported week, YYYY-MM-DD. This is what the seen key stores. */
  weekStart: string;
  weekEnd: string;
  /** Includes unscored activity, same as the /progress card. */
  durationSec: number;
  minutes: number;
  sessions: number;
  stars: number;
  daysPractised: number;
  /** Longest run of consecutive practice days inside the week (1..7). */
  bestRun: number;
  /** Over scored sessions only; null when nothing in the week was scored. */
  bestScore: number | null;
  averageScore: number | null;
  /**
   * The week before, for the "change" line. `null` when nothing at all was
   * logged before the reported week — a first week has nothing to be up on.
   */
  previous: { durationSec: number; minutes: number; sessions: number } | null;
  suggestion: WeeklySuggestion;
}

const minutesOf = (sec: number) => Math.round(sec / 60);

/** Longest run of consecutive calendar days in a set of day keys. */
function longestRun(days: ReadonlySet<string>, from: string): number {
  let best = 0;
  let run = 0;
  // Walk the seven days of the week in order rather than sorting keys and
  // diffing dates, so a DST day is just another step of setDate.
  const [y, m, d] = from.split("-").map(Number);
  const monday = new Date(y, m - 1, d, 12);
  for (let i = 0; i < 7; i++) {
    if (days.has(dayKey(shiftDays(monday, i)))) {
      run++;
      best = Math.max(best, run);
    } else {
      run = 0;
    }
  }
  return best;
}

function scoredAverage(list: readonly SessionLog[]): number | null {
  const scores = list
    .map((s) => s.score)
    .filter((v): v is number => typeof v === "number" && Number.isFinite(v));
  if (scores.length === 0) return null;
  return scores.reduce((a, v) => a + v, 0) / scores.length;
}

/**
 * One concrete next step, derived only from the record.
 *
 * 1. A room the singer used in the three weeks before and skipped last week —
 *    the one they used most, so the claim is "you dropped this", not a guess.
 * 2. The room whose scores trailed the week's average by 10+ points, with at
 *    least two scored sessions so one bad take cannot name a room.
 * 3. Fewer than three practice days: ask for one more.
 * 4. Otherwise, hold the pattern.
 */
function pickSuggestion(
  week: readonly SessionLog[],
  earlier: readonly SessionLog[],
  days: number,
): WeeklySuggestion {
  const used = new Set(week.map((s) => s.type));
  const skipped = new Map<ActivityType, number>();
  for (const s of earlier) {
    if (!used.has(s.type)) skipped.set(s.type, (skipped.get(s.type) ?? 0) + 1);
  }
  if (skipped.size > 0) {
    // Ties break on ACTIVITY_TYPES order via TYPE_META's key order, so the
    // pick is stable across renders and devices.
    const order = Object.keys(TYPE_META) as ActivityType[];
    const [type, before] = [...skipped.entries()].sort(
      (a, b) => b[1] - a[1] || order.indexOf(a[0]) - order.indexOf(b[0]),
    )[0];
    return { kind: "neglected", type, before, ...pick(type) };
  }

  const overall = scoredAverage(week);
  if (overall !== null) {
    let weakest: { type: ActivityType; average: number } | null = null;
    for (const type of used) {
      const scored = week.filter(
        (s) => s.type === type && typeof s.score === "number",
      );
      if (scored.length < 2) continue;
      const average = scoredAverage(scored)!;
      if (!weakest || average < weakest.average) weakest = { type, average };
    }
    if (weakest && overall - weakest.average >= 10) {
      return {
        kind: "weakest",
        type: weakest.type,
        average: Math.round(weakest.average),
        overall: Math.round(overall),
        ...pick(weakest.type),
      };
    }
  }

  return days < 3 ? { kind: "more-days", days } : { kind: "keep-going", days };
}

function pick(type: ActivityType) {
  return { label: TYPE_META[type].label, href: TYPE_META[type].href };
}

/**
 * The report for the week that just ended, or null when there is nothing to
 * report — a singer who skipped last week gets no card rather than a card of
 * zeros telling them so.
 */
export function weekInReview(
  sessions: readonly SessionLog[],
  now = new Date(),
): WeekInReview | null {
  const b = weekBoundaries(now);
  const week = sessions.filter((s) => s.day >= b.lastStart && s.day <= b.lastEnd);
  if (week.length === 0) return null;

  const totals = weekTotals(week, b.lastStart, b.lastEnd);
  const days = new Set(week.map((s) => s.day));
  const scores = week
    .map((s) => s.score)
    .filter((v): v is number => typeof v === "number" && Number.isFinite(v));
  const average = scoredAverage(week);

  const hasHistory = sessions.some((s) => s.day < b.lastStart);
  const prior = weekTotals(sessions, b.priorStart, b.priorEnd);

  // Three weeks before the reported one, for "a room you dropped".
  const [y, m, d] = b.lastStart.split("-").map(Number);
  const lookback = dayKey(shiftDays(new Date(y, m - 1, d, 12), -21));
  const earlier = sessions.filter((s) => s.day >= lookback && s.day < b.lastStart);

  return {
    weekStart: b.lastStart,
    weekEnd: b.lastEnd,
    durationSec: totals.durationSec,
    minutes: minutesOf(totals.durationSec),
    sessions: totals.sessions,
    stars: totals.stars,
    daysPractised: days.size,
    bestRun: longestRun(days, b.lastStart),
    bestScore: scores.length ? Math.round(Math.max(...scores)) : null,
    averageScore: average === null ? null : Math.round(average),
    previous: hasHistory
      ? {
          durationSec: prior.durationSec,
          minutes: minutesOf(prior.durationSec),
          sessions: prior.sessions,
        }
      : null,
    suggestion: pickSuggestion(week, earlier, days.size),
  };
}

/**
 * Whether the card should open: there is a report, and this device has not
 * already been shown the report for that week.
 */
export function shouldShowWeekInReview(
  report: WeekInReview | null,
  seenWeek: string | null,
): report is WeekInReview {
  return report !== null && seenWeek !== report.weekStart;
}
