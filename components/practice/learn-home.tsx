"use client";

import { useIsPro } from "@/lib/pro";
import { FREE_DAILY_SEC, guidedSecondsToday } from "@/lib/free-cap";

import Link from "next/link";
import { useCallback, useEffect, useId, useState, type ReactNode } from "react";
import { todayPracticeSec, type ProgressState } from "@/lib/progress";
import { Button, Card, Pill, SectionLabel } from "@/components/ui";
import { MicAlert } from "@/components/mic-alert";
import { starsForScore, type Stars } from "./results-screen";
import { RETIRED_TITLES, titlesFor } from "@/components/warmups/exercises";

// Re-exported so a room home can type its own star maths without reaching past
// this module for the one type every piece in it speaks.
export type { Stars };

/**
 * The room home, in parts.
 *
 * Every practice room used to open the same way: a wall of cards, each one an
 * equally-weighted invitation, none of them an answer to "what should I do
 * right now". A course app answers that in two moves — one card that continues
 * where you left off, then a path you can see yourself moving along — and puts
 * the day's goal and the streak next to both so the answer has a reason. These
 * are those parts, on the site's paper palette, shared so warmups, ear training
 * and breath cannot drift into three different front doors.
 *
 * The dark session surface is the other half of the story and lives in
 * ./session-shell and ./results-screen.
 */

/* -------------------------------------------------------------- daily goal */

export const DAILY_GOAL_KEY = "suede-sing:daily-goal:v1";
export const DEFAULT_GOAL_MIN = 10;
const MAX_GOAL_MIN = 240;

function readGoalMin(): number {
  if (typeof window === "undefined") return DEFAULT_GOAL_MIN;
  try {
    const raw = window.localStorage.getItem(DAILY_GOAL_KEY);
    const n = raw === null ? NaN : Number(raw);
    if (!Number.isFinite(n)) return DEFAULT_GOAL_MIN;
    return Math.min(MAX_GOAL_MIN, Math.max(1, Math.round(n)));
  } catch {
    return DEFAULT_GOAL_MIN;
  }
}

/**
 * The singer's daily practice goal in minutes, kept on the device.
 *
 * Read after mount rather than during render: the server has no localStorage,
 * so reading it in the initial state would render a goal the server never
 * agreed to and trip hydration. Everyone sees the default for one frame.
 */
export function useDailyGoal(): {
  goalSec: number;
  goalMin: number;
  setGoalMin: (min: number) => void;
} {
  const [goalMin, setStored] = useState(DEFAULT_GOAL_MIN);
  const isPro = useIsPro();

  useEffect(() => {
    /* eslint-disable-next-line react-hooks/set-state-in-effect */
    setStored(readGoalMin());
  }, []);

  const setGoalMin = useCallback((min: number) => {
    const clamped = Math.min(MAX_GOAL_MIN, Math.max(1, Math.round(min)));
    setStored(clamped);
    try {
      window.localStorage.setItem(DAILY_GOAL_KEY, String(clamped));
    } catch {
      // A browser with storage denied still gets a working goal this session.
    }
  }, []);

  // A free account's day cannot run past its allowance, so its ring fills at
  // the cap rather than at a goal it can never reach.
  const goalSec = isPro ? goalMin * 60 : Math.min(goalMin * 60, FREE_DAILY_SEC);
  return { goalSec, goalMin, setGoalMin };
}

/**
 * What fills the day's ring: all practice on Pro; on free, the guided minutes
 * the goal is clamped to.
 *
 * The free goal is the daily allowance, so its ring has to count what the
 * allowance counts. Fed every session type instead, ten minutes in the
 * uncapped pitch studio read as a full ring while all five guided minutes
 * were still unused.
 */
export function useGoalDoneSec(progress: ProgressState): number {
  const isPro = useIsPro();
  return isPro ? todayPracticeSec(progress) : guidedSecondsToday(progress);
}

/* ------------------------------------------------------------------- stars */

/**
 * The best score this exercise has ever earned, or null if it has never been
 * scored. Warmup sessions are filed under the exercise's title, which is what
 * `detail` carries — there is no exercise id in the log, and adding one would
 * be a store migration this lane has no business writing.
 */
// The retired-title table lives with the catalogue now, so the pure daily
// planner (lib/daily-three.ts) can read it without importing a client
// component. Re-exported because the path and its test have always found it
// here.
export { RETIRED_TITLES, titlesFor };

export function bestScoreForExercise(
  progress: ProgressState,
  exerciseTitle: string,
): number | null {
  const titles = titlesFor(exerciseTitle);
  let best: number | null = null;
  for (const s of progress.sessions) {
    if (s.type !== "warmup" || s.detail === undefined || !titles.includes(s.detail)) continue;
    if (typeof s.score !== "number") continue;
    if (best === null || s.score > best) best = s.score;
  }
  return best;
}

/** Stars for an exercise: its best score ever, banded. */
export function starsForExercise(
  progress: ProgressState,
  exerciseTitle: string,
): Stars {
  return starsForScore(bestScoreForExercise(progress, exerciseTitle));
}

/**
 * Stars for a group of things that each have stars — a routine from its steps,
 * a level from its exercises. Rounded down, because a set is only as warmed up
 * as the work actually done in it: two gold steps and one untouched one is not
 * a two-star routine.
 */
export function averageStars(stars: number[]): Stars {
  if (stars.length === 0) return 0;
  const mean = stars.reduce((a, s) => a + s, 0) / stars.length;
  return Math.max(0, Math.min(3, Math.floor(mean))) as Stars;
}

/* ------------------------------------------------------------------ pieces */

function StarGlyph({ filled, size = 14 }: { filled: boolean; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M12 2.6l2.9 5.9 6.5.95-4.7 4.6 1.1 6.45L12 17.45 6.2 20.5l1.1-6.45-4.7-4.6 6.5-.95z"
        fill={filled ? "var(--color-amber)" : "none"}
        stroke={filled ? "none" : "var(--color-line2)"}
        strokeWidth={1.6}
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Three stars, filled to `stars`. Always paired with a text label for anyone
 *  who cannot see the glyphs. */
export function StarTrio({ stars, size = 14 }: { stars: Stars; size?: number }) {
  return (
    <span className="inline-flex items-center gap-0.5" role="img" aria-label={`${stars} of 3 stars`}>
      {[0, 1, 2].map((i) => (
        <StarGlyph key={i} filled={i < stars} size={size} />
      ))}
    </span>
  );
}

/** The day's practice against the day's goal. */
export function GoalRing({
  doneSec,
  goalSec,
  size = 64,
}: {
  doneSec: number;
  goalSec: number;
  size?: number;
}) {
  const doneMin = Math.floor(doneSec / 60);
  const goalMin = Math.max(1, Math.round(goalSec / 60));
  const pct = goalSec > 0 ? Math.min(1, doneSec / goalSec) : 0;
  const stroke = Math.max(4, Math.round(size * 0.1));
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const mid = size / 2;
  return (
    <div
      className="relative shrink-0"
      style={{ width: size, height: size }}
      role="img"
      aria-label={`${doneMin} of ${goalMin} minutes practiced today`}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
        <circle cx={mid} cy={mid} r={r} fill="none" stroke="var(--color-line)" strokeWidth={stroke} />
        <circle
          cx={mid}
          cy={mid}
          r={r}
          fill="none"
          stroke="var(--color-violet)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - pct)}
          transform={`rotate(-90 ${mid} ${mid})`}
        />
      </svg>
      <span
        aria-hidden="true"
        className="tabular absolute inset-0 flex items-center justify-center font-mono text-[11px] text-dim"
      >
        {doneMin}/{goalMin}
      </span>
    </div>
  );
}

/**
 * `days` must be the live streak (0 once it has lapsed), never the stored
 * count, which keeps its old value for days after a streak has ended. `best`,
 * when given, turns a lapsed singer's "start a streak" into the record they
 * are coming back to beat.
 */
export function StreakChip({ days, best = 0 }: { days: number; best?: number }) {
  // Pill's shape and tones, in the kicker's tape style: under "Start here"
  // a sans pill read as a second label in a different voice.
  const chip =
    "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 font-mono text-[11px] uppercase tracking-[0.14em]";
  if (days < 1) {
    return (
      <span className={`${chip} border-line text-mut`}>
        {best >= 2 ? `Best streak ${best} days, start a new one today` : "Start a streak today"}
      </span>
    );
  }
  return (
    <span className={`${chip} border-ok/40 text-ok-ink`}>
      <span aria-hidden="true">🔥</span> {days}-day streak
    </span>
  );
}

/* ----------------------------------------------------------- continue card */

/**
 * The words beside a continue card's stars. "Not started" only for something
 * not started: a finished set whose drills average under one star is "So far".
 */
export function starLabel(stars: Stars, started: boolean = stars > 0): string {
  if (stars === 3) return "All three stars";
  return stars === 0 && !started ? "Not started" : "So far";
}

/**
 * The first thing in a room: one thing to do, and one button that does it.
 *
 * A singer who opens a practice room to practise should not have to choose
 * from a thirty-card catalogue before they have sung a note.
 */
export function ContinueCard({
  kicker,
  title,
  tagline,
  meta,
  stepTitles = [],
  onStart,
  startLabel,
  micReady,
  error,
  streakDays,
  streakBest,
  stars,
  started,
  goal,
  children,
  unavailableReason,
}: {
  /** The tape label — "Today's warmup", "Continue learning". */
  kicker: string;
  title: string;
  tagline?: string;
  /** The mono meta line: length, count, how it is scored. */
  meta?: ReactNode;
  /** What is inside, as chips. Truncated with a "+N more". */
  stepTitles?: string[];
  onStart: () => void;
  /** Overrides the mic-aware default label. */
  startLabel?: string;
  /** False until mic permission lands — the button says so rather than
   *  surprising the singer with a browser prompt. */
  micReady: boolean;
  /** A mic failure that came from this card's button, or null. */
  error: string | null;
  /** The live streak: 0 once it has lapsed. */
  streakDays: number;
  /** The best streak on record, shown to a singer whose streak lapsed. */
  streakBest?: number;
  /** Where the singer already stands on this thing, if anywhere. */
  stars?: Stars;
  /**
   * Whether any of it has been done, which no star count can say: stars are
   * floored averages, so a set finished with one star on two drills and none
   * on the third reads zero. Defaults to whether there are stars.
   */
  started?: boolean;
  goal?: { doneSec: number; goalSec: number };
  children?: ReactNode;
  /** Why starting is unavailable; shown beside the disabled action. */
  unavailableReason?: string;
}) {
  const unavailableId = useId();
  const shown = stepTitles.slice(0, 5);
  const more = stepTitles.length - shown.length;
  return (
    <Card className="border-violet/40 bg-[radial-gradient(700px_260px_at_0%_0%,rgba(139,92,246,0.07),transparent_65%)]">
      {/* On a phone the two columns dissolve (`contents`) into one flex column
          and the start button is ordered straight under the title: with the
          tagline, chips and goal ring first, a 375×667 phone put the room's
          only action under the tab bar on /warmups, /ear-training and
          /breath. DOM order — and so focus and reading order — is unchanged,
          and from sm up the two-column layout is exactly as before. */}
      <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-start sm:justify-between sm:gap-6">
        <div className="contents sm:block sm:max-w-xl">
          {/* On a phone the streak chip always takes its own line under the
              kicker. Side by side, whether the pair fit on one line depended
              on both texts, and both change at hydration: the prerender is a
              newcomer's ("Start a streak today", the newcomer's kicker), a
              returning singer's is "🔥 4-day streak" or a lapsed singer's
              best, beside "Continue your path" or "Top up today". At 375 the
              row went from two lines to one for a singer with a streak on
              /ear-training and moved the title, start button and everything
              under them by 30px (CLS 0.085); other widths and rooms moved
              the other way. Stacked, the row is the same height in every
              state. From sm up there is room for both on one line, as before. */}
          <div className="order-1 flex flex-col items-start gap-2 sm:flex-row sm:flex-wrap sm:items-center">
            <SectionLabel>{kicker}</SectionLabel>
            <StreakChip days={streakDays} best={streakBest} />
          </div>
          <h2 className="order-1 mt-3 text-3xl sm:text-4xl">{title}</h2>
          {/* mt-4 on a phone, where it follows the full-width button rather
              than the title; mt-2 under the title from sm up, as before. */}
          {tagline && <p className="order-3 mt-4 text-mut sm:mt-2">{tagline}</p>}
          {stars !== undefined && (
            <div className="order-3 mt-3 flex items-center gap-2">
              <StarTrio stars={stars} size={16} />
              <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-dim">
                {starLabel(stars, started)}
              </span>
            </div>
          )}
          {meta && <div className="order-3 mt-4">{meta}</div>}
          {shown.length > 0 && (
            <ol className="order-3 mt-4 flex flex-wrap gap-1.5" aria-label="What is inside">
              {shown.map((t, i) => (
                <li key={`${t}-${i}`}>
                  <Pill tone="mut">{t}</Pill>
                </li>
              ))}
              {more > 0 && (
                <li>
                  <Pill tone="mut">+{more} more</Pill>
                </li>
              )}
            </ol>
          )}
        </div>
        <div className="contents sm:flex sm:w-auto sm:flex-col sm:items-end sm:gap-3">
          {goal && (
            <div className="order-3 mt-4 flex items-center gap-3 sm:order-none sm:mt-0 sm:flex-row-reverse">
              <GoalRing doneSec={goal.doneSec} goalSec={goal.goalSec} />
              <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-dim">
                Today&apos;s goal
              </span>
            </div>
          )}
          <Button variant="rec" size="lg" onClick={onStart} className="order-2 mt-4 w-full sm:order-none sm:mt-0 sm:w-auto"
            disabled={Boolean(unavailableReason)} aria-describedby={unavailableReason ? unavailableId : undefined}>
            {startLabel ?? (micReady ? "Start" : "Enable mic and start")}
          </Button>
          {unavailableReason && <p id={unavailableId} className="order-2 mt-2 max-w-xs text-sm text-mut sm:order-none sm:mt-0 sm:text-right">{unavailableReason}</p>}
          {children && <div className="order-3 mt-3 sm:order-none sm:mt-0">{children}</div>}
        </div>
      </div>
      {error && <MicAlert message={error} className="mt-4 text-sm text-rec" />}
    </Card>
  );
}

/* ------------------------------------------------------------------- path */

export interface PathItem {
  id: string;
  title: string;
  /** A small static figure or glyph before the title: what the row's exercise looks like. */
  figure?: ReactNode;
  /** The secondary line when the row has no `meta` — a row carries one line of
   *  explanation, and the denser mono line wins when both are given. */
  desc?: string;
  /** The mono line under the title: length, ladder, mode. */
  meta?: string;
  stars: Stars;
  /** True when pressing this asks for the microphone first. */
  mic?: boolean;
  /** Behind the paywall — pass `href` for where it should lead instead. */
  locked?: boolean;
  href?: string;
  /** Practised in the last few days. */
  recent?: boolean;
  onSelect?: () => void;
  /** A mic failure that came from this row, rendered under it. */
  error?: string | null;
}

export interface PathLevel {
  title: string;
  blurb?: string;
  /** What the rows in this level are, for the counted header line: warmups
   *  have exercises, the ear room has games, breath has drills. */
  unit?: string;
  items: PathItem[];
}

/** A tier is complete only when every row has earned at least one star. */
export function levelCompletion(level: PathLevel) {
  const sung = level.items.filter((item) => item.stars >= 1).length;
  const total = level.items.length;
  return { sung, total, complete: total > 0 && sung === total };
}

/**
 * The learning path: levels top to bottom, one row per exercise, stars on the
 * right. Rows rather than a card grid, because a path is an order — a grid
 * says "any of these", and the whole point is that there is a next one.
 */
export function PathList({
  levels,
  micNoteId = "practice-mic-note",
  unavailableReason,
}: {
  levels: PathLevel[];
  /**
   * The id of the room's mic note, which mic rows describe themselves by.
   * Pass null in a room that renders no such note: an IDREF to nothing is an
   * accessibility defect, not a harmless default.
   */
  micNoteId?: string | null;
  unavailableReason?: string;
}) {
  const unavailableId = useId();
  const nextId = nextUpId(levels);
  return (
    <div className="space-y-8">
      {unavailableReason && <p id={unavailableId} className="text-sm text-mut">{unavailableReason}</p>}
      {levels.map((level) => (
        <section key={level.title}>
          <div className="flex flex-wrap items-center gap-2">
            <SectionLabel>{level.title}</SectionLabel>
            {/* Counted, never a literal, so the number cannot drift from the
                rows underneath it. */}
            <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-dim">
              {levelCompletion(level).sung} of {level.items.length} {level.unit ?? "exercises"} sung
            </span>
          </div>
          {levelCompletion(level).complete && <Pill tone="ok">Complete</Pill>}
          {level.blurb && <p className="mt-2 max-w-xl text-sm text-mut">{level.blurb}</p>}
          <ul className="mt-3 divide-y divide-line overflow-hidden rounded-2xl border border-line bg-panel">
            {level.items.map((item) => (
              <li key={item.id}>
                <PathRow item={item} isNext={item.id === nextId} micNoteId={micNoteId}
                  unavailableId={unavailableReason ? unavailableId : undefined} />
                {item.error && (
                  <MicAlert message={item.error} className="px-4 pb-3 text-sm text-rec" />
                )}
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

/**
 * The row the "Next" pill goes on: the first unstarred, unlocked item in the
 * first level that still has one. Exported for the unit test — the rule is
 * easy to state and easy to get subtly wrong.
 */
export function nextUpId(levels: PathLevel[]): string | null {
  for (const level of levels) {
    const item = level.items.find((i) => !i.locked && i.stars === 0);
    if (item) return item.id;
  }
  return null;
}

function PathRow({
  item,
  isNext,
  micNoteId,
  unavailableId,
}: {
  item: PathItem;
  isNext: boolean;
  micNoteId: string | null;
  unavailableId?: string;
}) {
  const secondary = item.meta ?? item.desc;
  const body = (
    <>
      {item.figure && <span className="shrink-0 text-dim">{item.figure}</span>}
      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-center gap-2">
          <span className="truncate font-medium">{item.title}</span>
          {isNext && <Pill tone="violet">Next</Pill>}
          {item.recent && <Pill tone="ok">Done recently</Pill>}
          {item.locked && <Pill tone="violet">Pro</Pill>}
        </span>
        {/* Neither line truncates: at 375 the meta lost its last tag
            ("G…" for Glide) and a pack's description its second clause. A
            two-line clamp clipped the breath and pro-pack descriptions to a
            third of their text at 100% zoom, and at 200% (WCAG 1.4.4) to a
            few words, so the description wraps in full like the meta. */}
        {secondary && (
          <span
            className={`mt-0.5 block text-dim ${
              item.meta
                ? "font-mono text-[11px] uppercase tracking-[0.14em]"
                : "text-sm"
            }`}
          >
            {secondary}
          </span>
        )}
      </span>
      <StarTrio stars={item.stars} />
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        className="shrink-0 text-dim"
      >
        <path d="m9 6 6 6-6 6" />
      </svg>
    </>
  );

  const rowClass =
    "flex min-h-[3.5rem] w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-panel2 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-transparent focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-violet-ink";

  if (item.locked && item.href) {
    return (
      // No aria-label: the visible title, "Pro" pill and description are the
      // name, so nothing shown is hidden from a screen reader (WCAG 2.5.3).
      <Link href={item.href} className={rowClass}>
        {body}
      </Link>
    );
  }
  return (
    <button
      type="button"
      onClick={item.onSelect}
      disabled={Boolean(unavailableId)}
      aria-describedby={unavailableId ?? (item.mic && micNoteId ? micNoteId : undefined)}
      className={rowClass}
    >
      {body}
    </button>
  );
}
