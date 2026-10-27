"use client";

import { CapSlide } from "@/components/practice/free-cap";
import { denseStepResults, withStepResult } from "@/components/practice/step-results";
import { formatClock, useFreeCap } from "@/lib/free-cap";

import { useEffect, useState } from "react";
import type { UsePitchResult } from "@/lib/audio/use-pitch";
import { useIdleMicRelease } from "@/lib/audio/use-idle-mic-release";
import type { VocalRange } from "@/lib/progress";
import { SESSION_FOCUS, SessionShell } from "@/components/practice/session-shell";
import { ExercisePlayer } from "./exercise-player";
import { patternSpan, tooWideForRange, type WarmupExercise } from "./exercises";
import { IconPlay, IconSkip } from "./icons";
import type { SessionSummaryData } from "./lib";
import { slowestOneBreathTempo } from "@/lib/daily-three";
import {
  SKIP_INTRO_SEC,
  STEP_INTRO_SEC,
  stepExercise,
  stepSeconds,
  type Routine,
  type RoutineStep,
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

/**
 * Seconds of routine still ahead from the start of step `from`, intros
 * included. A step the saved `range` cannot hold (tooWideForRange) is never
 * sung, so it counts only the slide that says so.
 */
export function remainingSeconds(routine: Routine, from: number, range: VocalRange = {}): number {
  return routine.steps
    .slice(from)
    .reduce(
      (a, s) =>
        a + (tooWideForRange(stepExercise(s), range) ? SKIP_INTRO_SEC : stepSeconds(s) + STEP_INTRO_SEC),
      0,
    );
}

/**
 * The clock on a step's intro slide. It counts the routine, unless the free
 * guided minutes left today run out first: then it counts those, because the
 * routine stops after the step that uses them up and "~6 min left" would
 * promise minutes the singer will not get. `freeLeftSec` is null on Pro.
 */
export function introClockLabel(routineLeftSec: number, freeLeftSec: number | null): string {
  if (freeLeftSec !== null && freeLeftSec < routineLeftSec) {
    return `${formatClock(freeLeftSec)} free left today`;
  }
  return `~${Math.max(1, Math.round(routineLeftSec / 60))} min left`;
}

/**
 * The line a step intro shows when the saved range cannot hold the step (see
 * tooWideForRange): why the routine moves past it. Null when it can. The run
 * peaks in its middle and comes back to its root, so every rep "reaches" the
 * measured top rather than ending on it; its root is the measured low when
 * the range is exactly as wide as the run, and under it when narrower.
 */
export function outOfRangeNote(ex: WarmupExercise, range: VocalRange): string | null {
  if (!tooWideForRange(ex, range)) return null;
  const width = patternSpan(ex);
  const span = range.highMidi! - range.lowMidi!;
  const floor = span < width ? "start below the lowest" : "start on the lowest";
  return `${ex.title} spans ${width} semitones and your saved range spans ${span}, so every rep would reach the highest note your range test found and ${floor}. This routine skips it for your range.`;
}

/**
 * The tempo a routine step starts at. The readiness step-down (0.75x, after
 * low recent scores) never stretches a one-breath pattern past
 * MAX_ONE_BREATH_SEC (lib/daily-three.ts): slowing it makes the breath longer,
 * which is harder, not easier. Hung-ee-mm is 9.4s at 1x and 12.6s at 0.75x,
 * so it stays at 1x, as it does in Today's three. A step up is left as it is.
 */
export function stepStartingTempo(ex: WarmupExercise, start: 0.75 | 1 | 1.25): 0.75 | 1 | 1.25 {
  return start < 1 ? (Math.max(start, slowestOneBreathTempo(ex)) as 0.75 | 1) : start;
}

/** At most this many reps of a routine's first exercise warm a cold voice in. */
export const WARM_IN_MAX_REPS = 6;

/**
 * The few easy reps a routine opened part-way through sings first, when no
 * warmup is logged today: its own first exercise, shortened. A `?step=`
 * link from a program day the free minutes split carries on from the step the
 * cap stopped at, and on a later day that step can be an octave siren or a
 * tenth near the top of the range, which a cold voice should not open on
 * (the routines open gently for that reason; see ROUTINES).
 */
export function warmInStep(routine: Routine): RoutineStep {
  const first = routine.steps[0];
  return { exerciseId: first.exerciseId, reps: Math.min(WARM_IN_MAX_REPS, first.reps) };
}

export interface RoutineSummaryData {
  routine: Routine;
  /** One entry per step, in order; null where nothing was sung (skipped or silent). */
  steps: (SessionSummaryData | null)[];
  /** False when the singer quit before the last step. */
  completed: boolean;
  /** The step a `?step=` link opened on; the ones before it were not part of this run. */
  startStep?: number;
  /**
   * The run sang warmInStep before `startStep`, and `steps[0]` holds that
   * warm-in rather than the routine's own first step.
   */
  warmIn?: boolean;
  /**
   * The step whose intro became the cap slide: today's free minutes ran out
   * before it, so it and every step after it were never reached rather than
   * skipped. Absent when the run was not stopped by the cap.
   */
  capStoppedAt?: number;
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
  startStep = 0,
  warmIn = false,
}: {
  initialTempo?: 0.75 | 1 | 1.25;
  routine: Routine;
  /** The step to open on (0-based), from a `?step=` link. */
  startStep?: number;
  /**
   * No warmup is logged today: a run opened past step 1 sings a few reps of
   * the routine's first exercise before it (warmInStep). Read once, when the
   * run starts.
   */
  warmIn?: boolean;
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
  const [firstStep] = useState(() => Math.min(Math.max(0, startStep), stepCount - 1));
  // Captured once: the warm-in logs a warmup itself, and the run must not
  // change its mind about it half-way. A first exercise the saved range cannot
  // hold would only be skipped, so it never warms in.
  const [warmInFirst] = useState(
    () => warmIn && firstStep > 0 && !tooWideForRange(stepExercise(routine.steps[0]), range),
  );
  // True while the warm-in is the step on screen; it runs as step 0.
  const [warming, setWarming] = useState(warmInFirst);
  const [phase, setPhase] = useState<RunnerPhase>({ kind: "intro", step: warmInFirst ? 0 : firstStep });
  const [results, setResults] = useState<(SessionSummaryData | null)[]>([]);

  const stepIndex = phase.kind === "done" ? stepCount - 1 : phase.step;
  const step = warming ? warmInStep(routine) : routine.steps[stepIndex];
  const ex = stepExercise(step);
  // A twelfth run in a range no wider than the run: the intro says why and
  // moves on, and the step closes unsung, so the summary reads it as skipped.
  const rangeNote = outOfRangeNote(ex, range);

  function closeStep(i: number, data: SessionSummaryData | null) {
    // Dense: a run opened at a later step closes its first one past index 0.
    const next = withStepResult(results, i, data, stepCount);
    setResults(next);
    // The warm-in is sung as step 0 and logged like any step (so the free
    // minutes count it); then the run goes to the step the link asked for.
    if (warming) {
      setWarming(false);
      setPhase({ kind: "intro", step: firstStep });
      return;
    }
    const after = afterStep(i, stepCount);
    if (after.kind === "done") {
      setPhase(after);
      onDone({ routine, steps: next, completed: true, startStep: firstStep, warmIn: warmInFirst });
    } else {
      setPhase(after);
    }
  }

  /** `capStoppedAt`: the step whose intro the cap slide replaced, when it did. */
  function quit(capStoppedAt?: number) {
    if (results.some((r) => r != null)) {
      onDone({
        routine,
        steps: denseStepResults(results, stepCount),
        completed: false,
        startStep: firstStep,
        warmIn: warmInFirst,
        ...(capStoppedAt === undefined ? {} : { capStoppedAt }),
      });
    } else {
      onQuit();
    }
  }

  const clockLabel = introClockLabel(
    warming
      ? stepSeconds(step) + STEP_INTRO_SEC + remainingSeconds(routine, firstStep, range)
      : remainingSeconds(routine, stepIndex, range),
    cap.isPro ? null : cap.leftSec,
  );
  // The cap slide ends the run, so nothing after it needs the microphone.
  // The room holds it for the whole routine (warmups-client.tsx); here it
  // closes after the usual idle wait instead of staying lit behind the slide.
  useIdleMicRelease({
    listening: pitch.listening,
    hold: !(capped && phase.kind === "intro"),
    stop: pitch.stop,
  });

  // Steps before a `?step=` link's first one weren't part of this run, so
  // they get no "skipped" chip; the warm-in, sung just before it, does.
  const afterWarmIn = warmInFirst && !warming && stepIndex === firstStep;
  const prev = stepIndex > firstStep || afterWarmIn ? (results[afterWarmIn ? 0 : stepIndex - 1] ?? null) : null;
  const prevEx = afterWarmIn
    ? stepExercise(routine.steps[0])
    : stepIndex > firstStep
      ? stepExercise(routine.steps[stepIndex - 1])
      : null;

  if (phase.kind === "play") {
    return (
      <ExercisePlayer
        key={phase.step}
        ex={ex}
        pitch={pitch}
        range={range}
        variant="session"
        initialTempo={stepStartingTempo(ex, startingTempo)}
        bounds={{
          reps: step.reps,
          stepIndex: phase.step,
          stepCount,
          label: warming ? `Warm-in, then step ${firstStep + 1}` : undefined,
        }}
        onFinish={(data) => closeStep(phase.step, data)}
        onExit={() => closeStep(phase.step, null)}
      />
    );
  }

  // The summary owns the screen once the last step closes; rendering a fourth
  // shell under it would only fight the results screen's portal for the body.
  if (phase.kind === "done") return null;

  // Checked between steps, never mid-step: the exercise under way finishes and
  // logs, and the routine ends on what was sung. The step this slide stands in
  // for, and the ones after it, were not reached; the summary says so rather
  // than calling them skipped. A warm-in stopped here reached nothing at all.
  if (capped) return <CapSlide cap={cap} onExit={() => quit(warming ? undefined : phase.step)} />;

  return (
    <StepIntro
      key={warming ? "warm-in" : phase.step}
      routineName={routine.name}
      stepIndex={phase.step}
      stepCount={stepCount}
      clockLabel={clockLabel}
      title={warming ? `Warm-in: ${ex.title}` : ex.title}
      warmInLine={
        warming
          ? `No warmup yet today, so a few easy reps come first. Then step ${firstStep + 1}.`
          : undefined
      }
      desc={ex.desc}
      tip={ex.tip}
      reps={step.reps}
      seconds={stepSeconds(step)}
      glide={ex.glide === true}
      prev={prevEx ? { title: prevEx.title, score: prev ? prev.avgScore : null } : null}
      note={rangeNote ?? undefined}
      onStart={() =>
        rangeNote === null ? setPhase({ kind: "play", step: phase.step }) : closeStep(phase.step, null)
      }
      onSkip={() => closeStep(phase.step, null)}
      onQuit={() => quit()}
    />
  );
}

/**
 * The slide between steps: what is next, why, and how long. It starts the step
 * on its own after STEP_INTRO_SEC so the routine keeps its own pace; the two
 * buttons are for a singer who wants to move sooner or skip a rung that does
 * not suit their voice today. With a `note`, the step is one the routine skips
 * (outOfRangeNote): the slide says why in place of the step's how-to, holds
 * for SKIP_INTRO_SEC so that can be read, and its timer and button move on to
 * the next step instead of starting this one.
 */
function StepIntro({
  routineName,
  stepIndex,
  stepCount,
  clockLabel,
  title,
  warmInLine,
  desc,
  tip,
  reps,
  seconds,
  glide,
  prev,
  note,
  onStart,
  onSkip,
  onQuit,
}: {
  routineName: string;
  stepIndex: number;
  stepCount: number;
  /** "~N min left", or the free minutes left when those run out first. */
  clockLabel: string;
  title: string;
  /** Set on a warm-in (warmInStep): why it comes first and where it leads. */
  warmInLine?: string;
  desc: string;
  tip: string;
  reps: number;
  seconds: number;
  glide: boolean;
  prev: { title: string; score: number | null } | null;
  /** Why the routine skips this step for the singer's range. */
  note?: string;
  onStart: () => void;
  onSkip: () => void;
  onQuit: () => void;
}) {
  // Fraction of the hold elapsed, drawn as the bar filling. Ten updates a
  // second is smooth enough for a 4-second bar and cheap enough to ignore.
  const [pct, setPct] = useState(0);
  const holdSec = note ? SKIP_INTRO_SEC : STEP_INTRO_SEC;
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
    // Runs once per intro: the slide is keyed by step, so a new step is a new
    // mount and a fresh timer. onStart and holdSec are stable for the slide's
    // lifetime.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const secondsLeft = Math.max(1, Math.ceil(holdSec - (pct / 100) * holdSec));

  return (
    <SessionShell
      title={routineName}
      subtitle={warmInLine ? "Warm-in" : `Step ${stepIndex + 1} of ${stepCount}`}
      progress={warmInLine ? 0 : (stepIndex / stepCount) * 100}
      onClose={onQuit}
      closeLabel="Quit routine"
      topRight={
        <span className="tabular font-mono text-[11px] uppercase tracking-[0.12em] text-[var(--s-dim)]">
          {clockLabel}
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
              {note ? (
                <>
                  <IconSkip /> Next
                </>
              ) : (
                <>
                  <IconPlay /> Start now
                </>
              )}
            </button>
            {!note && (
              <button
                type="button"
                onClick={onSkip}
                className={`flex min-h-11 items-center justify-center gap-2 rounded-full border border-[var(--s-line2)] px-5 py-2.5 text-sm text-[var(--s-mut)] transition-colors hover:bg-[var(--s-over)] hover:text-[var(--s-ink)] ${SESSION_FOCUS}`}
              >
                <IconSkip /> Skip
              </button>
            )}
          </div>
          <div className="mt-3 h-1 w-full overflow-hidden rounded-full bg-[var(--s-over)]">
            <div
              className="h-full rounded-full bg-[var(--s-accent)]"
              style={{ width: `${pct}%` }}
            />
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
            <span className="truncate">{prev.title}</span>
            <span aria-hidden="true" className="text-[var(--s-dim)]">
              ·
            </span>
            <span
              className="tabular font-mono"
              style={{
                // Green only for a score worth calling good; "0%" in
                // success green read as a pass.
                color:
                  prev.score === null
                    ? "var(--s-dim)"
                    : prev.score >= 50
                      ? "var(--s-ok)"
                      : "var(--s-mut)",
              }}
            >
              {prev.score === null ? "skipped" : `${prev.score}%`}
            </span>
          </p>
        )}
        <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-[var(--s-dim)]">
          {note ? "Skipping" : warmInLine || stepIndex === 0 ? "First up" : "Up next"}
        </p>
        <h2 className="mt-3 text-4xl text-[var(--s-ink)] sm:text-5xl" aria-live="polite">
          {title}
        </h2>
        {warmInLine && !note && (
          <p className="mx-auto mt-4 max-w-md rounded-2xl border border-[var(--s-line2)] px-4 py-3 text-sm text-[var(--s-ink)]">
            {warmInLine}
          </p>
        )}
        {/* A skipped step is never sung, so its how-to, rep count and length
            would only be read and then not happen: the slide says why instead. */}
        {note ? (
          <p className="mx-auto mt-4 max-w-md rounded-2xl border border-[var(--s-line2)] px-4 py-3 text-sm text-[var(--s-ink)]">
            {note}
          </p>
        ) : (
          <>
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
          </>
        )}
      </div>
    </SessionShell>
  );
}
