"use client";

import { useIsPro } from "@/lib/pro";
import { FREE_DAILY_SEC } from "@/lib/free-cap";

import Link from "next/link";
import { useCallback, useEffect, useState, type ReactNode } from "react";
import type { ProgressState } from "@/lib/progress";
import { Button, Card, Pill, SectionLabel } from "@/components/ui";
import { MicAlert } from "@/components/mic-alert";
import { starsForScore, type Stars } from "./results-screen";

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

/* ------------------------------------------------------------------- stars */

/**
 * The best score this exercise has ever earned, or null if it has never been
 * scored. Warmup sessions are filed under the exercise's title, which is what
 * `detail` carries — there is no exercise id in the log, and adding one would
 * be a store migration this lane has no business writing.
 */
/**
 * Titles an exercise used to log under. Sessions carry the title, not an id,
 * so a rename would otherwise zero a returning singer's stars and "Best %"
 * for that row. Add a line here whenever a title changes; the test pins it.
 */
export const RETIRED_TITLES: Record<string, readonly string[]> = {
  "Lip-trill arpeggio": ["Lip-trill scale"],
  "N run": ["N-hum scale"],
  "Hoo descent": ["Four-note hoo", "Hoo descending arpeggio"],
  "Hung-ee-mm": ["Hung-ee-mm scale"],
};

/** Every title a session for this exercise may have been filed under. */
export function titlesFor(exerciseTitle: string): readonly string[] {
  return [exerciseTitle, ...(RETIRED_TITLES[exerciseTitle] ?? [])];
}

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
      aria-label={`${doneMin} of ${goalMin} minutes practised today`}
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

export function StreakChip({ days }: { days: number }) {
  if (days < 1) {
    return <Pill tone="mut">Start a streak today</Pill>;
  }
  return (
    <Pill tone="ok">
      <span aria-hidden="true">🔥</span> {days}-day streak
    </Pill>
  );
}

/* ----------------------------------------------------------- continue card */

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
  stars,
  goal,
  children,
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
  streakDays: number;
  /** Where the singer already stands on this thing, if anywhere. */
  stars?: Stars;
  goal?: { doneSec: number; goalSec: number };
  children?: ReactNode;
}) {
  const shown = stepTitles.slice(0, 5);
  const more = stepTitles.length - shown.length;
  return (
    <Card className="border-violet/40 bg-[radial-gradient(700px_260px_at_0%_0%,rgba(139,92,246,0.07),transparent_65%)]">
      <div className="flex flex-wrap items-start justify-between gap-6">
        <div className="max-w-xl">
          <div className="flex flex-wrap items-center gap-2">
            <SectionLabel>{kicker}</SectionLabel>
            <StreakChip days={streakDays} />
          </div>
          <h2 className="mt-3 text-3xl sm:text-4xl">{title}</h2>
          {tagline && <p className="mt-2 text-mut">{tagline}</p>}
          {stars !== undefined && (
            <div className="mt-3 flex items-center gap-2">
              <StarTrio stars={stars} size={16} />
              <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-dim">
                {stars === 0 ? "Not started" : stars === 3 ? "All three stars" : "So far"}
              </span>
            </div>
          )}
          {meta && <div className="mt-4">{meta}</div>}
          {shown.length > 0 && (
            <ol className="mt-4 flex flex-wrap gap-1.5" aria-label="What is inside">
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
        <div className="flex w-full flex-col items-stretch gap-3 sm:w-auto sm:items-end">
          {goal && (
            <div className="flex items-center gap-3 sm:flex-row-reverse">
              <GoalRing doneSec={goal.doneSec} goalSec={goal.goalSec} />
              <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-dim">
                Today&apos;s goal
              </span>
            </div>
          )}
          <Button variant="rec" size="lg" onClick={onStart} className="w-full sm:w-auto">
            {startLabel ?? (micReady ? "Start" : "Enable mic and start")}
          </Button>
          {children}
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

/**
 * The learning path: levels top to bottom, one row per exercise, stars on the
 * right. Rows rather than a card grid, because a path is an order — a grid
 * says "any of these", and the whole point is that there is a next one.
 */
export function PathList({
  levels,
  micNoteId = "practice-mic-note",
}: {
  levels: PathLevel[];
  /**
   * The id of the room's mic note, which mic rows describe themselves by.
   * Pass null in a room that renders no such note: an IDREF to nothing is an
   * accessibility defect, not a harmless default.
   */
  micNoteId?: string | null;
}) {
  const nextId = nextUpId(levels);
  return (
    <div className="space-y-8">
      {levels.map((level) => (
        <section key={level.title}>
          <div className="flex flex-wrap items-center gap-2">
            <SectionLabel>{level.title}</SectionLabel>
            {/* Counted, never a literal, so the number cannot drift from the
                rows underneath it. */}
            <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-dim">
              {level.items.length} {level.unit ?? "exercises"}
            </span>
          </div>
          {level.blurb && <p className="mt-2 max-w-xl text-sm text-mut">{level.blurb}</p>}
          <ul className="mt-3 divide-y divide-line overflow-hidden rounded-2xl border border-line bg-panel">
            {level.items.map((item) => (
              <li key={item.id}>
                <PathRow item={item} isNext={item.id === nextId} micNoteId={micNoteId} />
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
}: {
  item: PathItem;
  isNext: boolean;
  micNoteId: string | null;
}) {
  const secondary = item.meta ?? item.desc;
  const body = (
    <>
      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-center gap-2">
          <span className="truncate font-medium">{item.title}</span>
          {isNext && <Pill tone="violet">Next</Pill>}
          {item.recent && <Pill tone="ok">Done recently</Pill>}
          {item.locked && <Pill tone="violet">Pro</Pill>}
        </span>
        {secondary && (
          <span
            className={`mt-0.5 block truncate text-dim ${
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
    "flex min-h-[3.5rem] w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-panel2 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-violet";

  if (item.locked && item.href) {
    return (
      <Link href={item.href} className={rowClass} aria-label={`${item.title} — Suede Pro`}>
        {body}
      </Link>
    );
  }
  return (
    <button
      type="button"
      onClick={item.onSelect}
      aria-describedby={item.mic && micNoteId ? micNoteId : undefined}
      className={rowClass}
    >
      {body}
    </button>
  );
}
