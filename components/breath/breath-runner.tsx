"use client";

import { useEffect, useState } from "react";
import type { UsePitchResult } from "@/lib/audio/use-pitch";
import {
  todayPracticeSec,
  useProgress,
  type Achievement,
} from "@/lib/progress";
import { SessionShell } from "@/components/practice/session-shell";
import { ResultsScreen, starsForScore } from "@/components/practice/results-screen";
import { useDailyGoal } from "@/components/practice/learn-home";
import { BoxBreathing } from "./box-breathing";
import { FarinelliDrill } from "./farinelli-drill";
import { SustainTest } from "./sustain-test";
import {
  BREATH_STEP_INTRO_SEC,
  breathDrillDesc,
  breathDrillTitle,
  breathStepSeconds,
  breathStepSummary,
  breathStepTitle,
  farinelliCapReached,
  type BreathDrillId,
  type BreathDrillResult,
  type BreathRoutine,
  type BreathStep,
} from "./routines";
import { starsForBox, starsForFarinelli, starsForSustain } from "./store";

type Stars = 0 | 1 | 2 | 3;

/**
 * Where the runner is: reading the card for step `step`, doing it, or done.
 *
 * Steps advance themselves — the intro card starts on a timer, every drill is
 * bounded and reports when it is over — so a breath routine runs to the end
 * without the singer touching anything.
 */
type RunnerPhase =
  | { kind: "intro"; step: number }
  | { kind: "play"; step: number }
  | { kind: "done" };

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
          variant="session"
          autoStart={autoStart}
          preset={{ side: step.side, minutes: step.minutes }}
          onComplete={onComplete}
          onExit={onExit}
        />
      );
    case "farinelli":
      return (
        <FarinelliDrill
          variant="session"
          autoStart={autoStart}
          preset={{ cap: step.cap }}
          onComplete={onComplete}
          onExit={onExit}
        />
      );
    default:
      return (
        <SustainTest
          variant="session"
          pitch={pitch}
          autoStart={autoStart}
          preset={{ attempts: step.attempts }}
          onComplete={onComplete}
          onExit={onExit}
        />
      );
  }
}

/**
 * The card between steps: what is next, what it does, and the preset it will
 * run. It starts the step on its own after BREATH_STEP_INTRO_SEC so the routine
 * keeps its own pace; the two buttons are for a singer who wants to move sooner.
 */
function StepIntro({
  step,
  stepIndex,
  stepCount,
  progress,
  onStart,
  onSkip,
  onQuit,
}: {
  step: BreathStep;
  stepIndex: number;
  stepCount: number;
  progress: number;
  onStart: () => void;
  onSkip: () => void;
  onQuit: () => void;
}) {
  // Ten updates a second is smooth enough for a four-second bar and cheap
  // enough to ignore.
  const [pct, setPct] = useState(0);
  useEffect(() => {
    const t0 = performance.now();
    const holdMs = BREATH_STEP_INTRO_SEC * 1000;
    const id = window.setInterval(() => {
      const p = Math.min(100, ((performance.now() - t0) / holdMs) * 100);
      setPct(p);
      if (p >= 100) {
        window.clearInterval(id);
        onStart();
      }
    }, 100);
    return () => window.clearInterval(id);
    // Runs once per intro: the card is keyed by step, so a new step is a new
    // mount and a fresh timer. onStart is stable for the card's lifetime.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const secondsLeft = Math.max(
    1,
    Math.ceil(BREATH_STEP_INTRO_SEC - (pct / 100) * BREATH_STEP_INTRO_SEC),
  );

  return (
    <SessionShell
      title={breathStepTitle(step)}
      subtitle={`Step ${stepIndex + 1} of ${stepCount}`}
      progress={progress}
      onClose={onQuit}
      closeLabel="Leave routine"
    >
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-4 px-5 py-6 text-center">
        <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-[var(--s-dim)]">
          {stepIndex === 0 ? "First up" : "Up next"} · Step {stepIndex + 1} of{" "}
          {stepCount}
        </span>
        <h2 className="font-display text-[clamp(2rem,7vw,3rem)] leading-none">
          {breathStepTitle(step)}
        </h2>
        <p className="max-w-md text-[var(--s-mut)]">
          {breathDrillDesc(step.drill)}
        </p>
        <p className="tabular font-mono text-[11px] uppercase tracking-[0.14em] text-[var(--s-dim)]">
          {breathStepSummary(step)}
          <span className="mx-2 text-[var(--s-line2)]">·</span>~
          {Math.round(breathStepSeconds(step))}s
        </p>
        <div className="mt-2 flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={onStart}
            className="min-h-11 rounded-full bg-[var(--s-ok)] px-7 text-base font-medium text-[oklch(0.15_0.02_155)] transition-[filter] hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--s-amber)]"
          >
            Start now
          </button>
          <button
            type="button"
            onClick={onSkip}
            className="min-h-11 rounded-full border border-[var(--s-line2)] px-6 text-sm text-[var(--s-mut)] transition-colors hover:bg-[var(--s-over)] hover:text-[var(--s-ink)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--s-amber)]"
          >
            Skip this one
          </button>
        </div>
        <div className="mt-3 w-full max-w-xs">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--s-over)]">
            <div
              className="h-full rounded-full bg-[var(--s-amber)] transition-[width] duration-100 ease-linear"
              style={{ width: `${pct}%` }}
            />
          </div>
          <p className="tabular mt-2 font-mono text-xs text-[var(--s-dim)]">
            Starting in {secondsLeft}
          </p>
        </div>
      </div>
    </SessionShell>
  );
}

/**
 * Stars for one drill, read out of what it actually did.
 *
 * The two guided drills report no score, so the alternative was to hand out
 * three stars for finishing — and "finishing" includes pressing End three
 * seconds in. Every drill reports the seconds it ran, and every drill's star
 * bands are already written in terms of how far it was taken, so the run is
 * measured against the same bands the path uses.
 */
function starsForDrillResult(drill: BreathDrillId, r: BreathDrillResult): Stars {
  switch (drill) {
    case "box":
      return starsForBox(Math.floor(r.durationSec / 60));
    case "farinelli":
      return starsForFarinelli(farinelliCapReached(r.durationSec));
    default:
      return starsForSustain(r.durationSec);
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

/**
 * Stars when nothing in the routine was scored.
 *
 * Two of the three breath drills have no score at all — box breathing and the
 * Farinelli climb are pass/fail by doing them — so a routine of those two would
 * otherwise land on a blank results screen. Finishing everything is three
 * stars, most of it two, any of it one. That is the honest reading of a set
 * whose only measure is whether the singer stayed with it.
 */
export function starsForCompletion(done: number, total: number): Stars {
  if (total <= 0 || done <= 0) return 0;
  if (done >= total) return 3;
  return done * 2 >= total ? 2 : 1;
}

export function BreathRunner({
  routine,
  pitch,
  onExit,
}: {
  routine: BreathRoutine;
  pitch: UsePitchResult;
  /** Back to the room. */
  onExit: () => void;
}) {
  const stepCount = routine.steps.length;
  const [runId, setRunId] = useState(0);
  const [phase, setPhase] = useState<RunnerPhase>({ kind: "intro", step: 0 });
  const [results, setResults] = useState<(BreathDrillResult | null)[]>([]);

  const progress = useProgress();
  const { goalSec } = useDailyGoal();

  function closeStep(i: number, data: BreathDrillResult | null) {
    const next = [...results];
    next[i] = data;
    setResults(next);
    setPhase(i + 1 < stepCount ? { kind: "intro", step: i + 1 } : { kind: "done" });
  }

  /** The X on an intro card: leave, but never throw away work already done. */
  function leave() {
    if (results.some((r) => r)) setPhase({ kind: "done" });
    else onExit();
  }

  function again() {
    setResults([]);
    setPhase({ kind: "intro", step: 0 });
    setRunId((n) => n + 1);
  }

  if (phase.kind === "done") {
    const doneSteps = results.filter((r) => r).length;
    const scored = results.filter(
      (r): r is BreathDrillResult => !!r && r.score !== null,
    );
    const score = scored.length
      ? Math.round(
          scored.reduce((a, r) => a + (r.score ?? 0), 0) / scored.length,
        )
      : null;
    return (
      <ResultsScreen
        title={routine.name}
        subtitle={
          doneSteps === stepCount
            ? "Routine complete"
            : `${doneSteps} of ${stepCount} steps`
        }
        score={score}
        stars={
          score !== null
            ? starsForScore(score)
            : starsForCompletion(doneSteps, stepCount)
        }
        xp={results.reduce((a, r) => a + (r?.logged?.xpGained ?? 0), 0)}
        streakDays={progress.streak.current}
        goal={{ doneSec: todayPracticeSec(progress), goalSec }}
        rows={routine.steps.map((s, i) => ({
          label: breathStepTitle(s),
          score: results[i]?.score ?? null,
          note: results[i]?.label ?? "Skipped",
        }))}
        achievements={mergeAchievements(results)}
        onContinue={onExit}
        onAgain={again}
      />
    );
  }

  const step = routine.steps[phase.step];
  // The bar tracks the routine, not the drill: each drill draws its own
  // progress inside its own shell, and a bar that restarted three times would
  // say nothing about how far through the set the singer is.
  const stepProgress = (phase.step / stepCount) * 100;

  if (phase.kind === "intro") {
    return (
      <StepIntro
        key={`${runId}-${phase.step}`}
        step={step}
        stepIndex={phase.step}
        stepCount={stepCount}
        progress={stepProgress}
        onStart={() => setPhase({ kind: "play", step: phase.step })}
        onSkip={() => closeStep(phase.step, null)}
        onQuit={leave}
      />
    );
  }

  return (
    <StepDrill
      key={`${runId}-${phase.step}`}
      step={step}
      pitch={pitch}
      autoStart
      onComplete={(r) => closeStep(phase.step, r)}
      onExit={() => closeStep(phase.step, null)}
    />
  );
}

/**
 * One drill on its own, chosen from the path.
 *
 * It gets its normal setup — a singer who picked "Box breathing" out of a list
 * wants to say how long for — and the same results screen a routine ends on, so
 * the path and the workouts grid agree on what finishing something looks like.
 */
export function BreathDrillSession({
  drill,
  pitch,
  onExit,
}: {
  drill: BreathDrillId;
  pitch: UsePitchResult;
  onExit: () => void;
}) {
  const [runId, setRunId] = useState(0);
  const [result, setResult] = useState<BreathDrillResult | null>(null);

  const progress = useProgress();
  const { goalSec } = useDailyGoal();

  // The path's rows are drills, not presets, so the step handed to StepDrill is
  // only a carrier for the drill id — every field the drills would read as a
  // preset is ignored, because autoStart is false and the setup card decides.
  const step: BreathStep =
    drill === "box"
      ? { drill: "box", side: 4, minutes: 3 }
      : drill === "farinelli"
        ? { drill: "farinelli", cap: 8 }
        : { drill: "sustain", attempts: 1 };

  if (result) {
    return (
      <ResultsScreen
        title={breathDrillTitle(drill)}
        subtitle="Breath"
        score={result.score}
        stars={starsForDrillResult(drill, result)}
        xp={result.logged?.xpGained ?? 0}
        streakDays={progress.streak.current}
        goal={{ doneSec: todayPracticeSec(progress), goalSec }}
        rows={[
          {
            label: breathDrillTitle(drill),
            score: result.score,
            note: result.label,
          },
        ]}
        achievements={result.logged?.newAchievements ?? []}
        onContinue={onExit}
        onAgain={() => {
          setResult(null);
          setRunId((n) => n + 1);
        }}
      />
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
