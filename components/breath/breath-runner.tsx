"use client";

import { CapSlide, CappedAgainNote } from "@/components/practice/free-cap";
import { ProCrescendoNudge } from "@/components/pro/gate";
import { emitProResult } from "@/lib/pro-signal";
import { StepIntroSlide } from "@/components/practice/step-intro";
import { useStepRunner } from "@/components/practice/step-runner";
import { formatClock, useFreeCap, type FreeCap } from "@/lib/free-cap";
import { FREE_DAILY_MINUTES } from "@/lib/practice-limits";
import { liveStreak } from "@/components/account/save-state";

import { useEffect, useState } from "react";
import type { UsePitchResult } from "@/lib/audio/use-pitch";
import { useIdleMicRelease } from "@/lib/audio/use-idle-mic-release";
import { useProgress, type Achievement } from "@/lib/progress";
import { ResultsScreen, starsForScore } from "@/components/practice/results-screen";
import { useDailyGoal, useGoalDoneSec } from "@/components/practice/learn-home";
import { BoxBreathing } from "./box-breathing";
import { BreathCueDrill } from "./breath-cue-drill";
import { FarinelliDrill } from "./farinelli-drill";
import { SustainTest } from "./sustain-test";
import {
  BREATH_STEP_INTRO_SEC,
  CUE_HOLD_SEC,
  CUE_REP_CHOICES,
  SUSTAIN_ATTEMPT_MIN_SEC,
  SUSTAIN_LOG_MIN_SEC,
  breathDrillDesc,
  breathDrillTitle,
  breathRoutineSeconds,
  breathStepSeconds,
  breathStepSummary,
  breathStepTitle,
  farinelliCapReached,
  type BreathDrillId,
  type BreathDrillResult,
  type BreathRoutine,
  type BreathStep,
} from "./routines";
import { starsForBox, starsForCue, starsForFarinelli, starsForSustain } from "./store";

type Stars = 0 | 1 | 2 | 3;

/** One drill, rendered on the session surface, wired to whoever owns the ending. */
function StepDrill({
  step,
  pitch,
  autoStart,
  onComplete,
  onExit,
}: {
  step: BreathStep;
  pitch: UsePitchResult;
  autoStart: boolean;
  onComplete: (r: BreathDrillResult) => void;
  onExit: () => void;
}) {
  switch (step.drill) {
    case "box":
      return (
        <BoxBreathing
          autoStart={autoStart}
          preset={{ side: step.side, minutes: step.minutes }}
          onComplete={onComplete}
          onExit={onExit}
        />
      );
    case "farinelli":
      return (
        <FarinelliDrill
          autoStart={autoStart}
          preset={{ cap: step.cap }}
          onComplete={onComplete}
          onExit={onExit}
        />
      );
    case "cue":
      return (
        <BreathCueDrill
          pitch={pitch}
          autoStart={autoStart}
          preset={{ reps: step.reps, holdSec: step.holdSec }}
          onComplete={onComplete}
          onExit={onExit}
        />
      );
    default:
      return (
        <SustainTest
          pitch={pitch}
          preset={{ attempts: step.attempts }}
          onComplete={onComplete}
          onExit={onExit}
        />
      );
  }
}

/** Stars for one drill, from how far it was taken, on the path's own bands. */
/**
 * The free minutes left today, for a step's intro card, when they run out
 * before the rest of the routine does; null on Pro and while they cover it.
 *
 * A program row opens a routine straight into this runner, past the room's
 * own allowance line, so the intro shows the countdown the cap would cut.
 */
export function breathIntroFreeLeft(
  routine: BreathRoutine,
  fromStep: number,
  cap: Pick<FreeCap, "isPro" | "leftSec">,
): string | null {
  if (cap.isPro) return null;
  // The card's own estimate (breathRoutineSeconds), of the steps still ahead.
  const setLeftSec = breathRoutineSeconds({ ...routine, steps: routine.steps.slice(fromStep) });
  return cap.leftSec < setLeftSec ? `${formatClock(cap.leftSec)} free left today` : null;
}

function starsForDrillResult(drill: BreathDrillId, r: BreathDrillResult): Stars {
  switch (drill) {
    case "box":
      return starsForBox(Math.floor(r.durationSec / 60));
    case "farinelli":
      return starsForFarinelli(farinelliCapReached(r.durationSec));
    case "cue":
      return starsForCue(r.reps ?? 0);
    default:
      // The longest single hold, never the sum of attempts.
      return starsForSustain(r.best ?? r.durationSec);
  }
}

/** Every achievement any step unlocked, each named once. */
function mergeAchievements(results: (BreathDrillResult | null)[]): Achievement[] {
  const seen = new Set<string>();
  const out: Achievement[] = [];
  for (const r of results) {
    for (const a of r?.logged?.newAchievements ?? []) {
      if (seen.has(a.id)) continue;
      seen.add(a.id);
      out.push(a);
    }
  }
  return out;
}

/** Stars when nothing was scored: all done is three, most two, any one. */
export function starsForCompletion(done: number, total: number): Stars {
  if (total <= 0 || done <= 0) return 0;
  if (done >= total) return 3;
  return done * 2 >= total ? 2 : 1;
}

/**
 * Whether a step of a set was done, from what it handed back.
 *
 * A guided drill counts once it ran long enough to be logged (its own
 * MIN_LOG_SEC), not merely because End was pressed. The sustain test is the
 * exception: a hold from SUSTAIN_ATTEMPT_MIN_SEC is a real attempt, kept in
 * the room's record and counted by programs, even though only holds of
 * SUSTAIN_LOG_MIN_SEC or more are logged for XP. A set whose three steps
 * all ran must not read "2 of 3 steps" because its sustain was short.
 */
export function breathStepDone(step: BreathStep, r: BreathDrillResult | null | undefined): boolean {
  if (r == null) return false;
  if (step.drill === "sustain") return (r.best ?? 0) >= SUSTAIN_ATTEMPT_MIN_SEC;
  return r.logged !== null;
}

/**
 * The sustain hold a set counted as done but did not log, or null. Its row
 * prints the steadiness score, so without this a set's XP silently left the
 * sustain out and the singer had no way to tell why.
 */
export function shortSustainHold(
  routine: BreathRoutine,
  results: readonly (BreathDrillResult | null | undefined)[],
): number | null {
  for (let i = 0; i < routine.steps.length; i++) {
    const r = results[i];
    if (routine.steps[i].drill === "sustain" && r != null && r.logged === null && breathStepDone(routine.steps[i], r)) {
      return r.best ?? r.durationSec;
    }
  }
  return null;
}

/** Why a short sustain earned nothing, on the paper panel the results screen's notes use. */
function ShortSustainNote({ held }: { held: number }) {
  return (
    <p className="mb-3 rounded-2xl bg-panel p-4 text-sm text-mut sm:p-5">
      Your longest sustain hold was {held.toFixed(1)} s. It counts as done, but only holds of{" "}
      {SUSTAIN_LOG_MIN_SEC} seconds or more are logged for XP and today&apos;s minutes.
    </p>
  );
}

/** The Pro offer after a breath routine, on a paper panel; `empty:hidden` since it self-hides on Pro. */
function BreathProNudge() {
  return (
    <div className="rounded-2xl bg-panel p-4 empty:hidden sm:p-5">
      <ProCrescendoNudge
        line="Pro removes the daily limit and shows your full coach plan"
        title="Keep the breath work going"
        body={`Breath sets share the free plan's ${FREE_DAILY_MINUTES} guided minutes a day. Pro removes the limit and lays out the full daily plan.`}
        context="Breath"
      />
    </div>
  );
}

/**
 * The results screen's subtitle. A `?step=` link (a program row carrying on
 * from the step the free minutes stopped at) runs the set from `firstStep`,
 * so the steps before it were sung in an earlier run, not skipped in this
 * one: the count is of this run's steps.
 */
export function breathRunSubtitle(doneSteps: number, firstStep: number, stepCount: number): string {
  const ran = stepCount - firstStep;
  if (doneSteps < ran) return `${doneSteps} of ${ran} ${ran === 1 ? "step" : "steps"}`;
  if (firstStep === 0) return "Routine complete";
  return ran === 1 ? `Step ${stepCount} done` : `Steps ${firstStep + 1}–${stepCount} done`;
}

/** The end of a breath routine; once the free minutes are spent "Play again" is left off, the note says why. */
export function BreathRunResults({
  routine,
  results,
  firstStep,
  capStoppedAt,
  capped,
  onContinue,
  onAgain,
}: {
  routine: BreathRoutine;
  results: (BreathDrillResult | null)[];
  /** The step this run opened on; the ones before it were sung in an earlier run. */
  firstStep: number;
  /**
   * The step whose intro became the cap slide: it and the steps after it
   * were never reached. Null when the cap did not stop the run.
   */
  capStoppedAt?: number | null;
  capped: boolean;
  onContinue: () => void;
  onAgain: () => void;
}) {
  const progress = useProgress();
  const { goalSec } = useDailyGoal();
  const goalDoneSec = useGoalDoneSec(progress);
  const stepCount = routine.steps.length;
  // Read per step, never by filtering `results`: a resumed run's results
  // start past index 0, and an entry it never wrote is not a step it ran.
  const doneSteps = routine.steps.filter((s, i) => breathStepDone(s, results[i])).length;
  // Only this run's steps: the ones before a `?step=` link's were sung before.
  const ran = stepCount - firstStep;
  const scored = results.filter(
    (r): r is BreathDrillResult => r != null && r.score !== null,
  );
  const stoppedAt = capStoppedAt ?? null;
  const notReached = stoppedAt === null ? 0 : Math.max(0, stepCount - stoppedAt);
  const shortHold = shortSustainHold(routine, results);
  const score = scored.length
    ? Math.round(
        scored.reduce((a, r) => a + (r.score ?? 0), 0) / scored.length,
      )
    : null;
  // A completed result: the one-time Pro moment listens for this, and waits
  // for this full-screen screen to close (components/pro/moments.tsx).
  const finished = doneSteps > 0;
  useEffect(() => {
    if (finished) emitProResult();
  }, [finished]);
  return (
    <ResultsScreen
      title={routine.name}
      subtitle={breathRunSubtitle(doneSteps, firstStep, stepCount)}
      score={score}
      stars={
        score !== null
          ? starsForScore(score)
          : starsForCompletion(doneSteps, ran)
      }
      xp={results.reduce((a, r) => a + (r?.logged?.xpGained ?? 0), 0)}
      streakDays={liveStreak(progress.streak)}
      goal={{ doneSec: goalDoneSec, goalSec }}
      rows={routine.steps.map((s, i) => ({
        label: breathStepTitle(s),
        score: results[i]?.score ?? null,
        // The warmup summary's wording for the same cases (routine-summary.tsx),
        // capitalised like this list's own "Skipped".
        note:
          i < firstStep
            ? "Not in this run"
            : stoppedAt !== null && i >= stoppedAt
              ? "Not reached"
              : (results[i]?.label ?? "Skipped"),
      }))}
      achievements={mergeAchievements(results)}
      onContinue={onContinue}
      onAgain={capped ? undefined : onAgain}
      // Above the rows, so a set the cap stopped says why before its
      // "Not reached" rows rather than under them, below a phone's fold.
      notice={capped ? <CappedAgainNote notReached={notReached} /> : undefined}
    >
      {shortHold !== null && <ShortSustainNote held={shortHold} />}
      {/* At the cap the notice carries the priced ask; one is enough. */}
      {!capped && <BreathProNudge />}
    </ResultsScreen>
  );
}

export function BreathRunner({
  capped = false,
  routine,
  startStep = 0,
  pitch,
  onExit,
}: {
  /** The free allowance is spent: the next intro becomes the cap slide. */
  capped?: boolean;
  routine: BreathRoutine;
  /** The step to open on (0-based), from a `?step=` link; "again" starts from the top. */
  startStep?: number;
  pitch: UsePitchResult;
  /** Back to the room. */
  onExit: () => void;
}) {
  const cap = useFreeCap();
  const stepCount = routine.steps.length;
  const runner = useStepRunner<BreathDrillResult>(stepCount, { capped, startStep });
  const { phase, results } = runner;

  // Out of a drill the mic closes after the usual idle wait; a drill that needs it asks again.
  useIdleMicRelease({
    listening: pitch.listening,
    hold: phase.kind === "play" || (phase.kind === "intro" && !capped),
    stop: pitch.stop,
  });

  // The X on an intro card: leave, but never throw away work already done.
  const leave = (capAt?: number) => {
    if (runner.quit(capAt) === null) onExit();
  };

  if (phase.kind === "done") {
    return (
      <BreathRunResults
        routine={routine}
        results={results}
        firstStep={runner.firstStep}
        capStoppedAt={runner.capStoppedAt}
        capped={capped}
        onContinue={onExit}
        onAgain={runner.again}
      />
    );
  }

  const step = routine.steps[phase.step];

  if (phase.kind === "intro") {
    if (runner.atCapSlide) return <CapSlide cap={cap} onExit={() => leave(phase.step)} />;
    return (
      <StepIntroSlide
        key={runner.stepKey}
        routineName={routine.name}
        stepIndex={phase.step}
        stepCount={stepCount}
        title={breathStepTitle(step)}
        meta={
          <>
            {breathStepSummary(step)}
            <span className="mx-2 text-[var(--s-line2)]">·</span>~{Math.round(breathStepSeconds(step))}s
          </>
        }
        clockLabel={breathIntroFreeLeft(routine, phase.step, cap) ?? undefined}
        holdSec={BREATH_STEP_INTRO_SEC}
        onStart={() => runner.play(phase.step)}
        onSkip={() => runner.closeStep(phase.step, null)}
        onQuit={() => leave()}
      >
        <p className="mx-auto mt-4 max-w-md text-[var(--s-mut)]">{breathDrillDesc(step.drill)}</p>
      </StepIntroSlide>
    );
  }

  return (
    <StepDrill
      key={runner.stepKey}
      step={step}
      pitch={pitch}
      autoStart
      onComplete={(r) => runner.closeStep(phase.step, r)}
      onExit={() => runner.closeStep(phase.step, null)}
    />
  );
}

/** One drill on its own, chosen from the path: its setup card, then the routine's results screen. */
export function BreathDrillSession({
  capped = false,
  drill,
  preset,
  pitch,
  onExit,
}: {
  /** The free allowance is spent: the results offer no "Play again". */
  capped?: boolean;
  drill: BreathDrillId;
  /** A setting a link asked for, such as a program day's five-count square; it seeds the setup card. */
  preset?: BreathStep;
  pitch: UsePitchResult;
  onExit: () => void;
}) {
  const [runId, setRunId] = useState(0);
  const [result, setResult] = useState<BreathDrillResult | null>(null);

  const progress = useProgress();
  const { goalSec } = useDailyGoal();
  const goalDoneSec = useGoalDoneSec(progress);

  // A linked preset only seeds the setup card; the singer can still change it.
  const step: BreathStep =
    preset && preset.drill === drill
      ? preset
      : drill === "box"
        ? { drill: "box", side: 4, minutes: 3 }
        : drill === "farinelli"
          ? { drill: "farinelli", cap: 8 }
          : drill === "cue"
            ? { drill: "cue", reps: CUE_REP_CHOICES[1], holdSec: CUE_HOLD_SEC }
            : { drill: "sustain", attempts: 1 };

  // A finished drill is a result; the one-time Pro moment waits for this
  // screen to close before it can open (components/pro/moments.tsx).
  useEffect(() => {
    if (result) emitProResult();
  }, [result]);

  // On the results screen the microphone closes after the usual idle wait,
  // as it does in every other room; Play again opens it from the drill.
  useIdleMicRelease({ listening: pitch.listening, hold: result === null, stop: pitch.stop });

  if (result) {
    return (
      <ResultsScreen
        title={breathDrillTitle(drill)}
        // A scored row prints its score, not its note, so a scored drill's own
        // line — the sustain's hold and the breath heard before it — goes here.
        subtitle={result.score !== null ? `Breath · ${result.label}` : "Breath"}
        score={result.score}
        // Stars follow the number on screen: a scored drill (the sustain's
        // steadiness) is starred by its score, as the legend beside it says;
        // only the unscored drills are starred by how far they were taken.
        stars={result.score !== null ? starsForScore(result.score) : starsForDrillResult(drill, result)}
        xp={result.logged?.xpGained ?? 0}
        streakDays={liveStreak(progress.streak)}
        goal={{ doneSec: goalDoneSec, goalSec }}
        rows={[
          {
            label: breathDrillTitle(drill),
            score: result.score,
            note: result.label,
          },
        ]}
        achievements={result.logged?.newAchievements ?? []}
        onContinue={onExit}
        onAgain={
          capped
            ? undefined
            : () => {
                setResult(null);
                setRunId((n) => n + 1);
              }
        }
      >
        {/* Why "Play again" is gone, and when it comes back. */}
        {capped && <CappedAgainNote />}
        {!capped && <BreathProNudge />}
      </ResultsScreen>
    );
  }

  return (
    <StepDrill
      key={runId}
      step={step}
      pitch={pitch}
      autoStart={false}
      onComplete={setResult}
      onExit={onExit}
    />
  );
}
