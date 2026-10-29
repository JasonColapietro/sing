"use client";

import { CapSlide } from "@/components/practice/free-cap";
import { StepIntroSlide } from "@/components/practice/step-intro";
import { useStepRunner } from "@/components/practice/step-runner";
import { formatClock, useFreeCap } from "@/lib/free-cap";

import { useState } from "react";
import type { UsePitchResult } from "@/lib/audio/use-pitch";
import { useIdleMicRelease } from "@/lib/audio/use-idle-mic-release";
import type { VocalRange } from "@/lib/progress";
import { ExercisePlayer } from "./exercise-player";
import { patternSpan, tooWideForRange, type WarmupExercise } from "./exercises";
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

/** Why the routine moves past a step the saved range cannot hold (tooWideForRange); null when it can. */
export function outOfRangeNote(ex: WarmupExercise, range: VocalRange): string | null {
  if (!tooWideForRange(ex, range)) return null;
  const width = patternSpan(ex);
  const span = range.highMidi! - range.lowMidi!;
  const floor = span < width ? "start below the lowest" : "start on the lowest";
  return `${ex.title} spans ${width} semitones and your saved range spans ${span}, so every rep would reach the highest note your range test found and ${floor}. This routine skips it for your range.`;
}

/** The step's starting tempo: a step-down never stretches a one-breath pattern past MAX_ONE_BREATH_SEC. */
export function stepStartingTempo(ex: WarmupExercise, start: 0.75 | 1 | 1.25): 0.75 | 1 | 1.25 {
  return start < 1 ? (Math.max(start, slowestOneBreathTempo(ex)) as 0.75 | 1) : start;
}

/** At most this many reps of a routine's first exercise warm a cold voice in. */
export const WARM_IN_MAX_REPS = 6;

/** The warm-in a routine opened part-way sings first on a cold day: its own first exercise, shortened. */
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
 * A routine, start to finish, on the session surface: the between-steps slide
 * runs inside the same shell the player uses, so a routine reads as one
 * continuous session rather than a page swapping cards under a header.
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
  /** No warmup logged today: a run opened past step 1 sings warmInStep first. */
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
  // Captured once: a first exercise the saved range cannot hold would only be skipped, so it never warms in.
  const [warmInFirst] = useState(
    () => warmIn && firstStep > 0 && !tooWideForRange(stepExercise(routine.steps[0]), range),
  );
  // True while the warm-in is the step on screen; it runs as step 0.
  const [warming, setWarming] = useState(warmInFirst);
  const runner = useStepRunner<SessionSummaryData>(stepCount, {
    capped,
    startStep: warmInFirst ? 0 : firstStep,
  });
  const { phase, results } = runner;

  const stepIndex = phase.kind === "done" ? stepCount - 1 : phase.step;
  const step = warming ? warmInStep(routine) : routine.steps[stepIndex];
  const ex = stepExercise(step);
  // A step the range cannot hold: the intro says why and moves on, and the step closes unsung.
  const rangeNote = outOfRangeNote(ex, range);

  const summary = (steps: (SessionSummaryData | null)[], completed: boolean): RoutineSummaryData => ({
    routine,
    steps,
    completed,
    startStep: firstStep,
    warmIn: warmInFirst,
  });

  function closeStep(i: number, data: SessionSummaryData | null) {
    // The warm-in is logged like any step (the free minutes count it), then the run goes to the linked step.
    if (warming) {
      runner.record(i, data);
      setWarming(false);
      runner.goTo({ kind: "intro", step: firstStep });
      return;
    }
    const next = runner.closeStep(i, data);
    if (i + 1 >= stepCount) onDone(summary(next, true));
  }

  /** `capStoppedAt`: the step whose intro the cap slide replaced, when it did. */
  function quit(capStoppedAt?: number) {
    const dense = runner.quit(capStoppedAt);
    if (dense === null) onQuit();
    else onDone({ ...summary(dense, false), ...(capStoppedAt === undefined ? {} : { capStoppedAt }) });
  }

  const clockLabel = introClockLabel(
    warming
      ? stepSeconds(step) + STEP_INTRO_SEC + remainingSeconds(routine, firstStep, range)
      : remainingSeconds(routine, stepIndex, range),
    cap.isPro ? null : cap.leftSec,
  );
  // The cap slide ends the run, so the room's mic closes after the idle wait instead of staying lit behind it.
  useIdleMicRelease({
    listening: pitch.listening,
    hold: !runner.atCapSlide,
    stop: pitch.stop,
  });

  // Steps before a `?step=` link's first one get no "skipped" chip; the warm-in, sung just before it, does.
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

  // The summary owns the screen once the last step closes.
  if (phase.kind === "done") return null;

  // A warm-in stopped here reached nothing at all.
  if (runner.atCapSlide) return <CapSlide cap={cap} onExit={() => quit(warming ? undefined : phase.step)} />;

  const warmInLine = warming
    ? `No warmup yet today, so a few easy reps come first. Then step ${firstStep + 1}.`
    : null;

  return (
    <StepIntroSlide
      key={warming ? "warm-in" : phase.step}
      routineName={routine.name}
      stepIndex={phase.step}
      stepCount={stepCount}
      subtitle={warming ? "Warm-in" : undefined}
      progress={warming ? 0 : undefined}
      kicker={warming ? "First up" : undefined}
      clockLabel={clockLabel}
      title={warming ? `Warm-in: ${ex.title}` : ex.title}
      prev={prevEx ? { label: prevEx.title, score: prev ? prev.avgScore : null } : null}
      note={rangeNote ?? undefined}
      meta={
        <>
          {step.reps} reps
          <span className="mx-2 text-[var(--s-line2)]">·</span>~{Math.round(stepSeconds(step))}s
          {ex.glide === true && (
            <>
              <span className="mx-2 text-[var(--s-line2)]">·</span>Glide
            </>
          )}
        </>
      }
      holdSec={rangeNote ? SKIP_INTRO_SEC : STEP_INTRO_SEC}
      onStart={() => (rangeNote === null ? runner.play(phase.step) : closeStep(phase.step, null))}
      onSkip={() => closeStep(phase.step, null)}
      onQuit={() => quit()}
    >
      {warmInLine && (
        <p className="mx-auto mt-4 max-w-md rounded-2xl border border-[var(--s-line2)] px-4 py-3 text-sm text-[var(--s-ink)]">
          {warmInLine}
        </p>
      )}
      <p className="mx-auto mt-4 max-w-md text-[var(--s-mut)]">{ex.desc}</p>
      <p className="mx-auto mt-2 max-w-md text-sm text-[var(--s-dim)]">{ex.tip}</p>
    </StepIntroSlide>
  );
}
