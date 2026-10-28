"use client";

import { useEffect, useState, type ReactNode } from "react";
import { SESSION_FOCUS, SessionShell } from "./session-shell";

/** The verbs every routine runner uses, so the rooms never drift again. */
export const ROUTINE_LABELS = {
  start: "Start",
  skip: "Skip",
  next: "Next",
  exit: "Exit routine",
} as const;

function PlayIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M8 5.5v13l11-6.5z" />
    </svg>
  );
}

function SkipIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M5 5v14l9-7z" />
      <rect x="16" y="5" width="3" height="14" rx="1" />
    </svg>
  );
}

/**
 * The slide between a routine's steps: what is next, why, and how long. It
 * starts the step on its own after `holdSec`; Start and Skip are for a singer
 * who wants to move sooner or pass a step. With a `note` the step is one the
 * routine skips for the singer: the slide says why in place of the how-to,
 * and its timer and button move on to the next step instead of starting it.
 */
export function StepIntroSlide({
  routineName,
  stepIndex,
  stepCount,
  subtitle,
  progress,
  kicker,
  title,
  meta,
  prev,
  note,
  clockLabel,
  holdSec,
  onStart,
  onSkip,
  onQuit,
  children,
}: {
  routineName: string;
  stepIndex: number;
  stepCount: number;
  /** Under the routine name; "Step n of m" unless the run says otherwise. */
  subtitle?: string;
  /** 0..100 through the routine; the step's share unless the run says otherwise. */
  progress?: number;
  /** "First up" / "Up next" unless the run says otherwise. */
  kicker?: string;
  title: string;
  /** The mono line under the how-to: reps, length, difficulty. */
  meta?: ReactNode;
  /** The step just closed and how it went; null on the first slide. */
  prev?: { label: string; score: number | null; scoreLabel?: string } | null;
  /** Why the routine skips this step; replaces the how-to. */
  note?: string;
  /** Top right: "~N min left", or the free minutes left when those run out first. */
  clockLabel?: string;
  /** Seconds the slide holds before the step starts itself. */
  holdSec: number;
  onStart: () => void;
  onSkip: () => void;
  onQuit: () => void;
  /** The how-to: description, tip, anything the room wants read before the step. */
  children?: ReactNode;
}) {
  // Fraction of the hold elapsed, drawn as the bar filling; ten updates a second.
  const [pct, setPct] = useState(0);
  useEffect(() => {
    const t0 = performance.now();
    const holdMs = holdSec * 1000;
    const id = window.setInterval(() => {
      const p = Math.min(100, ((performance.now() - t0) / holdMs) * 100);
      setPct(p);
      if (p >= 100) {
        window.clearInterval(id);
        onStart();
      }
    }, 100);
    return () => window.clearInterval(id);
    // Once per slide: the slide is keyed by step, so a new step is a fresh timer.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const secondsLeft = Math.max(1, Math.ceil(holdSec - (pct / 100) * holdSec));
  const button = `flex min-h-11 items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm ${SESSION_FOCUS}`;

  return (
    <SessionShell
      title={routineName}
      subtitle={subtitle ?? `Step ${stepIndex + 1} of ${stepCount}`}
      progress={progress ?? (stepIndex / stepCount) * 100}
      onClose={onQuit}
      closeLabel={ROUTINE_LABELS.exit}
      topRight={
        clockLabel ? (
          <span className="tabular font-mono text-[11px] uppercase tracking-[0.12em] text-[var(--s-dim)]">
            {clockLabel}
          </span>
        ) : undefined
      }
      bottom={
        <div className="mx-auto w-full max-w-md">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onStart}
              className={`${button} flex-1 bg-[var(--s-ok)] font-medium text-[oklch(0.15_0.02_155)] transition-[filter] hover:brightness-110`}
            >
              {note ? (
                <>
                  <SkipIcon /> {ROUTINE_LABELS.next}
                </>
              ) : (
                <>
                  <PlayIcon /> {ROUTINE_LABELS.start}
                </>
              )}
            </button>
            {!note && (
              <button
                type="button"
                onClick={onSkip}
                className={`${button} border border-[var(--s-line2)] text-[var(--s-mut)] transition-colors hover:bg-[var(--s-over)] hover:text-[var(--s-ink)]`}
              >
                <SkipIcon /> {ROUTINE_LABELS.skip}
              </button>
            )}
          </div>
          <div className="mt-3 h-1 w-full overflow-hidden rounded-full bg-[var(--s-over)]">
            <div className="h-full rounded-full bg-[var(--s-accent)]" style={{ width: `${pct}%` }} />
          </div>
          <p className="tabular mt-2 text-center font-mono text-[11px] uppercase tracking-[0.12em] text-[var(--s-dim)]">
            {note ? "Next step in" : "Starting in"} {secondsLeft}
          </p>
        </div>
      }
    >
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center overflow-y-auto px-5 py-6 text-center">
        {prev && (
          <p className="mb-6 inline-flex items-center gap-2 rounded-full border border-[var(--s-line2)] px-3 py-1 text-xs text-[var(--s-mut)]">
            <span className="truncate">{prev.label}</span>
            <span aria-hidden="true" className="text-[var(--s-dim)]">
              ·
            </span>
            <span
              className="tabular font-mono"
              style={{
                // Green only for a score worth calling good; "0%" in green read as a pass.
                color:
                  prev.score === null
                    ? "var(--s-dim)"
                    : prev.score >= 50
                      ? "var(--s-ok)"
                      : "var(--s-mut)",
              }}
            >
              {prev.score === null ? "skipped" : (prev.scoreLabel ?? `${prev.score}%`)}
            </span>
          </p>
        )}
        <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-[var(--s-dim)]">
          {note ? "Skipping" : (kicker ?? (stepIndex === 0 ? "First up" : "Up next"))}
        </p>
        <h2 className="mt-3 text-4xl text-[var(--s-ink)] sm:text-5xl" aria-live="polite">
          {title}
        </h2>
        {note ? (
          <p className="mx-auto mt-4 max-w-md rounded-2xl border border-[var(--s-line2)] px-4 py-3 text-sm text-[var(--s-ink)]">
            {note}
          </p>
        ) : (
          <>
            {children}
            {meta && (
              <p className="mt-6 font-mono text-[11px] uppercase tracking-[0.14em] text-[var(--s-dim)]">
                {meta}
              </p>
            )}
          </>
        )}
      </div>
    </SessionShell>
  );
}
