"use client";

import { CapSlide } from "@/components/practice/free-cap";
import { useFreeCap } from "@/lib/free-cap";

import { useEffect, useState } from "react";
import type { UsePitchResult } from "@/lib/audio/use-pitch";
import type { VocalRange } from "@/lib/progress";
import { SESSION_FOCUS, SessionShell } from "@/components/practice/session-shell";
import { ExercisePlayer } from "./exercise-player";
import { IconPlay, IconSkip } from "./icons";
import type { SessionSummaryData } from "./lib";
import {
  STEP_INTRO_SEC,
  stepExercise,
  stepSeconds,
  type Routine,
} from "./routines";

/**
 * Where the runner is: reading the card for step `step`, singing it, or done.
 * Steps advance themselves — the intro card starts on a timer, the bounded
 * player finishes on its own — so a routine runs to the end without the singer
 * touching anything, the way a class does.
 */
export type RunnerPhase =
  | { kind: "intro"; step: number }
  | { kind: "play"; step: number }
  | { kind: "done" };

/** The phase after step `step` closes, however it closed. */
export function afterStep(step: number, stepCount: number): RunnerPhase {
  return step + 1 < stepCount ? { kind: "intro", step: step + 1 } : { kind: "done" };
}

/** Seconds of routine still ahead from the start of step `from`, intros included. */
export function remainingSeconds(routine: Routine, from: number): number {
  return routine.steps
    .slice(from)
    .reduce((a, s) => a + stepSeconds(s) + STEP_INTRO_SEC, 0);
}

export interface RoutineSummaryData {
  routine: Routine;
  /** One entry per step, in order; null where nothing was sung (skipped or silent). */
  steps: (SessionSummaryData | null)[];
  /** False when the singer quit before the last step. */
  completed: boolean;
}

/**
 * A routine, start to finish, on the session surface.
 *
 * The whole run is full-screen and dark: the between-steps card is a slide
 * inside the same shell the player uses, so a routine reads as one continuous
 * session instead of a page that swaps a card in and out under a site header.
 * That also retired the scroll-into-view this used to need — there is no page
 * to scroll, and the "Listen / Your turn" line can no longer end up above the
 * fold while a singer is already singing over the teach pass.
 */
export function RoutineRunner({
  routine,
  pitch,
  range,
  onDone,
  onQuit,
  capped = false,
  initialTempo = 1,
}: {
  initialTempo?: 0.75 | 1 | 1.25;
  routine: Routine;
  pitch: UsePitchResult;
  range: VocalRange;
  /** The free allowance is spent: the next intro becomes the cap slide. */
  capped?: boolean;
  /** Every finished routine, and any quit that had at least one sung step. */
  onDone: (data: RoutineSummaryData) => void;
  /** A quit with nothing sung: there is nothing to summarise. */
  onQuit: () => void;
}) {
  const stepCount = routine.steps.length;
  const [startingTempo] = useState(initialTempo);
  const cap = useFreeCap();
  const [phase, setPhase] = useState<RunnerPhase>({ kind: "intro", step: 0 });
  const [results, setResults] = useState<(SessionSummaryData | null)[]>([]);

  const stepIndex = phase.kind === "done" ? stepCount - 1 : phase.step;
  const step = routine.steps[stepIndex];
  const ex = stepExercise(step);

  function closeStep(i: number, data: SessionSummaryData | null) {
    const next = [...results];
    next[i] = data;
    setResults(next);
    const after = afterStep(i, stepCount);
    if (after.kind === "done") {
      setPhase(after);
      onDone({ routine, steps: next, completed: true });
    } else {
      setPhase(after);
    }
  }

  function quit() {
    if (results.some((r) => r !== null)) {
      onDone({ routine, steps: results, completed: false });
    } else {
      onQuit();
    }
  }

  const minutesLeft = Math.max(1, Math.round(remainingSeconds(routine, stepIndex) / 60));
  const prev = stepIndex > 0 ? (results[stepIndex - 1] ?? null) : null;
  const prevEx = stepIndex > 0 ? stepExercise(routine.steps[stepIndex - 1]) : null;

  if (phase.kind === "play") {
    return (
      <ExercisePlayer
        key={phase.step}
        ex={ex}
        pitch={pitch}
        range={range}
        variant="session"
        initialTempo={startingTempo}
        bounds={{ reps: step.reps, stepIndex: phase.step, stepCount }}
        onFinish={(data) => closeStep(phase.step, data)}
        onExit={() => closeStep(phase.step, null)}
      />
    );
  }

  // The summary owns the screen once the last step closes; rendering a fourth
  // shell under it would only fight the results screen's portal for the body.
  if (phase.kind === "done") return null;

  // Checked between steps, never mid-step: the exercise under way finishes and
  // logs, and the routine ends on what was sung.
  if (capped) return <CapSlide cap={cap} onExit={quit} />;

  return (
    <StepIntro
      key={phase.step}
      routineName={routine.name}
      stepIndex={phase.step}
      stepCount={stepCount}
      minutesLeft={minutesLeft}
      title={ex.title}
      desc={ex.desc}
      tip={ex.tip}
      reps={step.reps}
      seconds={stepSeconds(step)}
      glide={ex.glide === true}
      prev={prevEx ? { title: prevEx.title, score: prev ? prev.avgScore : null } : null}
      onStart={() => setPhase({ kind: "play", step: phase.step })}
      onSkip={() => closeStep(phase.step, null)}
      onQuit={quit}
    />
  );
}

/**
 * The slide between steps: what is next, why, and how long. It starts the step
 * on its own after STEP_INTRO_SEC so the routine keeps its own pace; the two
 * buttons are for a singer who wants to move sooner or skip a rung that does
 * not suit their voice today.
 */
function StepIntro({
  routineName,
  stepIndex,
  stepCount,
  minutesLeft,
  title,
  desc,
  tip,
  reps,
  seconds,
  glide,
  prev,
  onStart,
  onSkip,
  onQuit,
}: {
  routineName: string;
  stepIndex: number;
  stepCount: number;
  minutesLeft: number;
  title: string;
  desc: string;
  tip: string;
  reps: number;
  seconds: number;
  glide: boolean;
  prev: { title: string; score: number | null } | null;
  onStart: () => void;
  onSkip: () => void;
  onQuit: () => void;
}) {
  // Fraction of the hold elapsed, drawn as the bar filling. Ten updates a
  // second is smooth enough for a 4-second bar and cheap enough to ignore.
  const [pct, setPct] = useState(0);
  useEffect(() => {
    const t0 = performance.now();
    const holdMs = STEP_INTRO_SEC * 1000;
    const id = window.setInterval(() => {
      const p = Math.min(100, ((performance.now() - t0) / holdMs) * 100);
      setPct(p);
      if (p >= 100) {
        window.clearInterval(id);
        onStart();
      }
    }, 100);
    return () => window.clearInterval(id);
    // Runs once per intro: the slide is keyed by step, so a new step is a new
    // mount and a fresh timer. onStart is stable for the slide's lifetime.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const secondsLeft = Math.max(1, Math.ceil(STEP_INTRO_SEC - (pct / 100) * STEP_INTRO_SEC));

  return (
    <SessionShell
      title={routineName}
      subtitle={`Step ${stepIndex + 1} of ${stepCount}`}
      progress={(stepIndex / stepCount) * 100}
      onClose={onQuit}
      closeLabel="Quit routine"
      topRight={
        <span className="tabular font-mono text-[11px] uppercase tracking-[0.12em] text-[var(--s-dim)]">
          ~{minutesLeft} min left
        </span>
      }
      bottom={
        <div className="mx-auto w-full max-w-md">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onStart}
              className={`flex min-h-11 flex-1 items-center justify-center gap-2 rounded-full bg-[var(--s-ok)] px-5 py-2.5 text-sm font-medium text-[oklch(0.15_0.02_155)] transition-[filter] hover:brightness-110 ${SESSION_FOCUS}`}
            >
              <IconPlay /> Start now
            </button>
            <button
              type="button"
              onClick={onSkip}
              className={`flex min-h-11 items-center justify-center gap-2 rounded-full border border-[var(--s-line2)] px-5 py-2.5 text-sm text-[var(--s-mut)] transition-colors hover:bg-[var(--s-over)] hover:text-[var(--s-ink)] ${SESSION_FOCUS}`}
            >
              <IconSkip /> Skip
            </button>
          </div>
          <div className="mt-3 h-1 w-full overflow-hidden rounded-full bg-[var(--s-over)]">
            <div
              className="h-full rounded-full bg-[var(--s-accent)]"
              style={{ width: `${pct}%` }}
            />
          </div>
          <p className="tabular mt-2 text-center font-mono text-[11px] uppercase tracking-[0.12em] text-[var(--s-dim)]">
            Starting in {secondsLeft}
          </p>
        </div>
      }
    >
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center overflow-y-auto px-5 py-6 text-center">
        {prev && (
          <p className="mb-6 inline-flex items-center gap-2 rounded-full border border-[var(--s-line2)] px-3 py-1 text-xs text-[var(--s-mut)]">
            <span className="truncate">{prev.title}</span>
            <span aria-hidden="true" className="text-[var(--s-dim)]">
              ·
            </span>
            <span
              className="tabular font-mono"
              style={{
                color: prev.score === null ? "var(--s-dim)" : "var(--s-ok)",
              }}
            >
              {prev.score === null ? "skipped" : `${prev.score}%`}
            </span>
          </p>
        )}
        <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-[var(--s-dim)]">
          {stepIndex === 0 ? "First up" : "Up next"}
        </p>
        <h2 className="mt-3 text-4xl text-[var(--s-ink)] sm:text-5xl" aria-live="polite">
          {title}
        </h2>
        <p className="mx-auto mt-4 max-w-md text-[var(--s-mut)]">{desc}</p>
        <p className="mx-auto mt-2 max-w-md text-sm text-[var(--s-dim)]">{tip}</p>
        <p className="mt-6 font-mono text-[11px] uppercase tracking-[0.14em] text-[var(--s-dim)]">
          {reps} reps
          <span className="mx-2 text-[var(--s-line2)]">·</span>~{Math.round(seconds)}s
          {glide && (
            <>
              <span className="mx-2 text-[var(--s-line2)]">·</span>Glide
            </>
          )}
        </p>
      </div>
    </SessionShell>
  );
}
