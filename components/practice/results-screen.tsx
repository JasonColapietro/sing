"use client";

import type { ReactNode } from "react";
import { SESSION_FOCUS, SessionShell } from "./session-shell";
import { gradeForScore } from "@/components/songs/grade";
import { ShareableResult } from "@/components/songs/result-card";

/**
 * The end of any scored session, written once for every practice room.
 *
 * A warmup routine, an ear game and a breath drill all finish the same way —
 * a singer wants to know how it went, what it earned, and what to press next —
 * so they finish on this screen rather than on three pages that drifted apart.
 * It stays on the session's dark surface instead of dropping the singer back
 * onto the paper page: the run is not over until they press Continue, and a
 * results page that arrives as a scroll position halfway down an article is
 * not an ending.
 *
 * Nothing here writes progress. Every room logs its own sessions on the way
 * through; this only reads the numbers back.
 */

export type Stars = 0 | 1 | 2 | 3;

/**
 * Score to stars. Three bands, chosen to match what the rooms already call
 * good: 90 is the "nailed it" line the grade table calls S/A territory, 75 is
 * a clean take with rough edges, 50 is the floor a recognizable attempt clears.
 * An unscored session (listen mode, nothing sung) earns none — it is not a
 * zero-star performance, it is no performance.
 */
export function starsForScore(score: number | null): Stars {
  if (score === null) return 0;
  if (score >= 90) return 3;
  if (score >= 75) return 2;
  if (score >= 50) return 1;
  return 0;
}

export interface ResultRow {
  label: string;
  /** 0..100, or null where this step was skipped or sung silently. */
  score: number | null;
  /** Why there is no score, in the room's own words. */
  note?: string;
}

export interface ResultAchievement {
  id: string;
  title: string;
  desc: string;
  icon: string;
}

/** The one filled star of a one-star result reads silver, the way it does in
 *  every game that grades this way: earned, but not gold yet. */
const SILVER = "oklch(0.84 0.015 90)";

/** Total of the stagger below stays under half a second — a result screen that
 *  makes a singer wait to read their score has stopped being a reward. */
const STAR_STEP_MS = 140;

export function ResultsScreen({
  title,
  subtitle,
  score,
  stars,
  xp,
  streakDays,
  goal,
  rows = [],
  achievements = [],
  onContinue,
  onAgain,
  onPractice,
  share,
  children,
}: {
  /** What was just practised — "Daily warmup", "Interval ID", "Box breathing". */
  title: string;
  /** One short line under it, e.g. "9 exercises · 10 min". */
  subtitle?: string;
  /** 0..100, or null when nothing was scored. */
  score: number | null;
  /** Computed by the caller with starsForScore(), so a room can grade on
   *  something other than the raw score if it has a better measure. */
  stars: Stars;
  /** XP this session earned, already logged by the room. */
  xp: number;
  streakDays: number;
  /** Today's practice against today's goal. */
  goal: { doneSec: number; goalSec: number };
  /** One row per step, in order. */
  rows?: ResultRow[];
  achievements?: ResultAchievement[];
  /** The primary way out. Escape and the X do this too. */
  onContinue: () => void;
  onAgain?: () => void;
  /** Run the weakest part again, where the room can. */
  onPractice?: () => void;
  /** Renders the shareable card, but only when there is a score to share. */
  share?: { title: string; subtitle?: string };
  /**
   * Anything the room wants under the rows — a nudge, a hint, a chart. This
   * renders on the dark surface, so anything built out of the site's paper
   * tokens has to bring its own ground: `text-mut` on `--s-bg` is about 2.3:1.
   */
  children?: ReactNode;
}) {
  const shareGrade = share && score !== null ? gradeForScore(score) : null;

  return (
    <SessionShell
      title="Session complete"
      progress={100}
      onClose={onContinue}
      closeLabel="Close results"
      bottom={
        <div className="mx-auto flex w-full max-w-lg flex-wrap items-center gap-2">
          <ResultButton tone="primary" onClick={onContinue} className="flex-1">
            Continue
          </ResultButton>
          {onAgain && <ResultButton onClick={onAgain}>Play again</ResultButton>}
          {onPractice && <ResultButton onClick={onPractice}>Practice</ResultButton>}
        </div>
      }
    >
      {/* Scoped here rather than in globals.css: this is the only screen that
          pops stars, and the reduced-motion rule has to land the final state
          rather than inherit the global duration collapse, which shortens the
          animation but not the stagger delay before it. */}
      <style>{`
        @keyframes sing-star-pop {
          from { opacity: 0; transform: scale(0.4); }
          60%  { opacity: 1; transform: scale(1.12); }
          to   { opacity: 1; transform: scale(1); }
        }
        .sing-star { animation: sing-star-pop 200ms cubic-bezier(0.2, 0.8, 0.3, 1) both; }
        @media (prefers-reduced-motion: reduce) {
          .sing-star { animation: none; opacity: 1; transform: none; }
        }
      `}</style>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-6 sm:px-6">
        <div className="mx-auto w-full max-w-lg">
          <div className="pt-4 text-center sm:pt-6">
            <StarRow stars={stars} />
            <h2 className="mt-5 text-2xl text-[var(--s-ink)] sm:text-3xl">{title}</h2>
            {subtitle && (
              <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.14em] text-[var(--s-dim)]">
                {subtitle}
              </p>
            )}
            <div className="tabular mt-4 font-mono text-6xl leading-none text-[var(--s-ink)] sm:text-7xl">
              {score === null ? "—" : `${score}%`}
            </div>
            <p className="mt-2 text-sm text-[var(--s-mut)]">
              {score === null ? "Nothing scored this time" : "Average score"}
            </p>
          </div>

          {/* What the run earned, in one line: XP, the day's goal, the streak. */}
          <div className="mt-6 flex items-center justify-center gap-4 rounded-2xl border border-[var(--s-line)] bg-[var(--s-elev)] px-4 py-3 sm:gap-6">
            <div className="text-center">
              <div className="tabular font-mono text-xl text-[var(--s-ok)]">+{xp}</div>
              <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--s-dim)]">
                XP
              </div>
            </div>
            <span aria-hidden="true" className="h-8 w-px bg-[var(--s-line2)]" />
            <GoalRing doneSec={goal.doneSec} goalSec={goal.goalSec} />
            <span aria-hidden="true" className="h-8 w-px bg-[var(--s-line2)]" />
            <div className="text-center">
              <div className="tabular font-mono text-xl text-[var(--s-amber)]">
                <span aria-hidden="true">🔥</span> {streakDays}
              </div>
              <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--s-dim)]">
                Day streak
              </div>
            </div>
          </div>

          {rows.length > 0 && (
            <div className="mt-6">
              <div className="font-mono text-[11px] uppercase tracking-[0.14em] text-[var(--s-dim)]">
                Step by step
              </div>
              <ul className="mt-3 space-y-2">
                {rows.map((r, i) => (
                  <li key={`${r.label}-${i}`} className="flex items-center gap-3">
                    <span className="tabular w-5 shrink-0 font-mono text-xs text-[var(--s-dim)]">
                      {i + 1}
                    </span>
                    <span className="w-28 shrink-0 truncate text-sm text-[var(--s-ink)] sm:w-44">
                      {r.label}
                    </span>
                    <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-[var(--s-over)]">
                      <span
                        className="block h-full rounded-full"
                        style={{
                          width: `${Math.min(100, Math.max(0, r.score ?? 0))}%`,
                          background: r.score === null ? "var(--s-line2)" : "var(--s-ok)",
                        }}
                      />
                    </span>
                    <span className="tabular w-16 shrink-0 text-right font-mono text-xs text-[var(--s-mut)]">
                      {r.score === null ? (r.note ?? "—") : `${r.score}%`}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {achievements.length > 0 && (
            <div className="mt-6 rounded-2xl border border-[var(--s-ok)]/40 bg-[var(--s-ok-soft)] px-4 py-3">
              <div className="font-mono text-[11px] uppercase tracking-[0.14em] text-[var(--s-ok)]">
                New achievements
              </div>
              <ul className="mt-2 space-y-1.5">
                {achievements.map((a) => (
                  <li key={a.id} className="flex items-baseline gap-2 text-sm">
                    <span aria-hidden="true">{a.icon}</span>
                    <span className="font-medium text-[var(--s-ink)]">{a.title}</span>
                    <span className="text-[var(--s-mut)]">{a.desc}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {children && <div className="mt-6">{children}</div>}

          {share && shareGrade && score !== null && (
            <div className="mt-6">
              <ShareableResult
                title={share.title}
                subtitle={share.subtitle}
                score={score}
                grade={shareGrade}
              />
            </div>
          )}
        </div>
      </div>
    </SessionShell>
  );
}

function StarRow({ stars }: { stars: Stars }) {
  return (
    <div
      className="flex items-end justify-center gap-2"
      role="img"
      aria-label={`${stars} of 3 stars`}
    >
      {[0, 1, 2].map((i) => (
        <Star
          key={i}
          earned={i < stars}
          silver={stars === 1}
          big={i === 1}
          delayMs={i * STAR_STEP_MS}
        />
      ))}
    </div>
  );
}

function Star({
  earned,
  silver,
  big,
  delayMs,
}: {
  earned: boolean;
  silver: boolean;
  big: boolean;
  delayMs: number;
}) {
  const size = big ? 68 : 56;
  return (
    <svg
      className="sing-star"
      style={{ animationDelay: `${delayMs}ms` }}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        d="M12 2.6l2.9 5.9 6.5.95-4.7 4.6 1.1 6.45L12 17.45 6.2 20.5l1.1-6.45-4.7-4.6 6.5-.95z"
        fill={earned ? (silver ? SILVER : "var(--s-amber)") : "none"}
        stroke={earned ? "none" : "var(--s-line2)"}
        strokeWidth={1.5}
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Today's minutes against today's goal, drawn as a ring on the dark surface. */
function GoalRing({ doneSec, goalSec }: { doneSec: number; goalSec: number }) {
  const doneMin = Math.floor(doneSec / 60);
  const goalMin = Math.max(1, Math.round(goalSec / 60));
  const pct = goalSec > 0 ? Math.min(1, doneSec / goalSec) : 0;
  const r = 18;
  const c = 2 * Math.PI * r;
  return (
    <div className="flex flex-col items-center">
      <svg width="46" height="46" viewBox="0 0 46 46" aria-hidden="true">
        <circle cx="23" cy="23" r={r} fill="none" stroke="var(--s-over)" strokeWidth="5" />
        <circle
          cx="23"
          cy="23"
          r={r}
          fill="none"
          stroke="var(--s-accent)"
          strokeWidth="5"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - pct)}
          transform="rotate(-90 23 23)"
        />
      </svg>
      <div className="mt-1 font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--s-dim)]">
        {doneMin} / {goalMin} min today
      </div>
    </div>
  );
}

/** A wide text button for the results strip — SessionButton is an icon control
 *  built for the play screen's bottom rail, which is not this shape. */
function ResultButton({
  children,
  onClick,
  tone = "plain",
  className = "",
}: {
  children: ReactNode;
  onClick: () => void;
  tone?: "plain" | "primary";
  className?: string;
}) {
  const tones = {
    plain:
      "border border-[var(--s-line2)] text-[var(--s-ink)] hover:bg-[var(--s-over)]",
    primary:
      "border border-transparent bg-[var(--s-ok)] text-[oklch(0.15_0.02_155)] hover:brightness-110",
  } as const;
  return (
    <button
      type="button"
      onClick={onClick}
      className={`min-h-11 rounded-full px-5 py-2.5 text-sm font-medium transition-colors ${SESSION_FOCUS} ${tones[tone]} ${className}`}
    >
      {children}
    </button>
  );
}
