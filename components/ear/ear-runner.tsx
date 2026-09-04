"use client";

import { CapSlide } from "@/components/practice/free-cap";
import { useFreeCap } from "@/lib/free-cap";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ResultsScreen, starsForScore } from "@/components/practice/results-screen";
import { useDailyGoal } from "@/components/practice/learn-home";
import { SessionShell } from "@/components/practice/session-shell";
import { todayPracticeSec, useProgress, type Achievement } from "@/lib/progress";
import { DIFFICULTIES, GAME_NAMES, type Difficulty, type GameId } from "./lib";
import {
  EAR_STEP_INTRO_SEC,
  GAME_DESC,
  GAME_TRAINS,
  earStepLabel,
  type EarRoutine,
  type EarRoutineStep,
} from "./routines";
import { ShellButton, type EarStepResult } from "./session";
import { IntervalGame } from "./interval-game";
import { PitchMatchGame } from "./pitch-match-game";
import { MelodyEchoGame } from "./melody-echo-game";
import { HigherLowerGame } from "./higher-lower-game";

/**
 * Where the runner is: reading the slide for step `step`, playing it, or done.
 * Steps advance themselves — the intro starts on a timer, a game ends after
 * its tenth round — so a workout runs to the end without the singer choosing
 * anything, which is the whole point of a workout.
 */
export type EarPhase =
  | { kind: "intro"; step: number }
  | { kind: "play"; step: number }
  | { kind: "done" };

/**
 * The phase after step `step` closes, however it closed.
 *
 * Deliberately a copy of the warmup runner's helper rather than an import:
 * three lines of arithmetic are not worth a dependency from the ear room into
 * the warmup room, and the two runners are free to diverge.
 */
export function afterStep(step: number, stepCount: number): EarPhase {
  return step + 1 < stepCount ? { kind: "intro", step: step + 1 } : { kind: "done" };
}

function difficultyLabel(d: Difficulty): string {
  return DIFFICULTIES.find((x) => x.id === d)?.label ?? d;
}

/* ---------------- one step ---------------- */

function GameStep({
  step,
  onExit,
  onComplete,
}: {
  step: EarRoutineStep;
  onExit: () => void;
  onComplete: (r: EarStepResult) => void;
}) {
  const props = { difficulty: step.difficulty, onExit, onComplete };
  switch (step.game) {
    case "interval":
      return <IntervalGame {...props} />;
    case "pitch-match":
      return <PitchMatchGame {...props} />;
    case "melody-echo":
      return <MelodyEchoGame {...props} />;
    case "higher-lower":
      return <HigherLowerGame {...props} />;
  }
}

/**
 * The slide between steps: what is next, what it trains, how hard. It starts
 * the step on its own after EAR_STEP_INTRO_SEC so the workout keeps its own
 * pace; the two buttons are for someone who wants to move sooner or skip.
 */
function StepIntro({
  routineName,
  step,
  stepIndex,
  stepCount,
  prev,
  onStart,
  onSkip,
  onQuit,
}: {
  routineName: string;
  step: EarRoutineStep;
  stepIndex: number;
  stepCount: number;
  prev: { label: string; score: number | null } | null;
  onStart: () => void;
  onSkip: () => void;
  onQuit: () => void;
}) {
  // Fraction of the hold elapsed, drawn as the bar filling. Ten updates a
  // second is smooth enough for a 4-second bar and cheap enough to ignore.
  const [pct, setPct] = useState(0);
  useEffect(() => {
    const t0 = performance.now();
    const holdMs = EAR_STEP_INTRO_SEC * 1000;
    const id = window.setInterval(() => {
      const p = Math.min(100, ((performance.now() - t0) / holdMs) * 100);
      setPct(p);
      if (p >= 100) {
        window.clearInterval(id);
        onStart();
      }
    }, 100);
    return () => window.clearInterval(id);
    // Runs once per slide: the component is keyed by step, so a new step is a
    // new mount and a fresh timer. onStart is stable for its lifetime.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const secondsLeft = Math.max(
    1,
    Math.ceil(EAR_STEP_INTRO_SEC - (pct / 100) * EAR_STEP_INTRO_SEC),
  );

  return (
    <SessionShell
      title={routineName}
      subtitle={`Step ${stepIndex + 1} of ${stepCount}`}
      progress={(stepIndex / stepCount) * 100}
      onClose={onQuit}
      closeLabel="Quit workout"
    >
      <div className="flex min-h-0 flex-1 items-center justify-center px-5 py-8">
        <div className="w-full max-w-md text-center">
          {prev && (
            <p className="mb-6 font-mono text-[11px] uppercase tracking-[0.14em] text-[var(--s-dim)]">
              {prev.score === null
                ? `${prev.label} · skipped`
                : `${prev.label} · ${prev.score}/100`}
            </p>
          )}
          <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-[var(--s-dim)]">
            {stepIndex === 0 ? "First up" : "Up next"} · Step {stepIndex + 1} of {stepCount}
          </p>
          <h2 className="mt-4 text-3xl text-[var(--s-ink)] sm:text-4xl" aria-live="polite">
            {GAME_NAMES[step.game]}
          </h2>
          <p className="mt-3 text-[var(--s-mut)]">{GAME_DESC[step.game]}</p>
          <p className="mt-5 font-mono text-[11px] uppercase tracking-[0.14em] text-[var(--s-dim)]">
            {GAME_TRAINS[step.game]}
            <span className="mx-2 text-[var(--s-line2)]">·</span>
            {difficultyLabel(step.difficulty)}
            <span className="mx-2 text-[var(--s-line2)]">·</span>10 rounds
          </p>
          <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
            <ShellButton tone="primary" onClick={onStart}>
              Start now
            </ShellButton>
            <ShellButton onClick={onSkip}>Skip this one</ShellButton>
          </div>
          <div className="mx-auto mt-7 max-w-[16rem]">
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--s-over)]">
              <div
                className="h-full rounded-full bg-[var(--s-ok)] transition-[width] duration-150"
                style={{ width: `${pct}%` }}
              />
            </div>
            <p className="tabular mt-2 font-mono text-[11px] uppercase tracking-[0.14em] text-[var(--s-dim)]">
              Starting in {secondsLeft}
            </p>
          </div>
        </div>
      </div>
    </SessionShell>
  );
}

/* ---------------- results ---------------- */

/**
 * The end of anything played in this room — a whole workout, or one game
 * started from the path. Scores average across the steps that were played;
 * a skipped step keeps its row but contributes nothing to the average.
 */
function EarResults({
  title,
  subtitle,
  steps,
  onContinue,
  onAgain,
}: {
  title: string;
  subtitle?: string;
  steps: { label: string; result: EarStepResult | null }[];
  onContinue: () => void;
  onAgain: () => void;
}) {
  const progress = useProgress();
  const { goalSec } = useDailyGoal();

  const played = steps.filter((s) => s.result !== null);
  const score =
    played.length === 0
      ? null
      : Math.round(
          played.reduce((a, s) => a + s.result!.score, 0) / played.length,
        );
  const xp = played.reduce((a, s) => a + s.result!.xpGained, 0);

  const achievements = useMemo(() => {
    const seen = new Map<string, Achievement>();
    for (const s of steps) {
      for (const a of s.result?.newAchievements ?? []) {
        if (!seen.has(a.id)) seen.set(a.id, a);
      }
    }
    return [...seen.values()];
  }, [steps]);

  return (
    <ResultsScreen
      title={title}
      subtitle={subtitle}
      score={score}
      stars={starsForScore(score)}
      xp={xp}
      streakDays={progress.streak.current}
      goal={{ doneSec: todayPracticeSec(progress), goalSec }}
      rows={steps.map((s) => ({
        label: s.label,
        score: s.result?.score ?? null,
        note: s.result === null ? "skipped" : undefined,
      }))}
      achievements={achievements}
      onContinue={onContinue}
      onAgain={onAgain}
      share={{ title, subtitle }}
    />
  );
}

/* ---------------- the runner ---------------- */

export function EarRunner({
  capped = false,
  routine,
  onExit,
}: {
  /** The free allowance is spent: the next intro becomes the cap slide. */
  capped?: boolean;
  routine: EarRoutine;
  /** Back to the room. */
  onExit: () => void;
}) {
  const cap = useFreeCap();
  const stepCount = routine.steps.length;
  const [phase, setPhase] = useState<EarPhase>({ kind: "intro", step: 0 });
  const [results, setResults] = useState<(EarStepResult | null)[]>([]);
  // Bumped on "Play again" so every game remounts with a clean session.
  const [run, setRun] = useState(0);

  const closeStep = useCallback(
    (i: number, result: EarStepResult | null) => {
      setResults((prev) => {
        const next = [...prev];
        next[i] = result;
        return next;
      });
      setPhase(afterStep(i, stepCount));
    },
    [stepCount],
  );

  const quit = useCallback(() => {
    // A quit that played something still earned a summary; a quit with nothing
    // played has nothing to summarise, so it just leaves.
    if (results.some((r) => r !== null)) setPhase({ kind: "done" });
    else onExit();
  }, [results, onExit]);

  const again = useCallback(() => {
    setResults([]);
    setRun((r) => r + 1);
    setPhase({ kind: "intro", step: 0 });
  }, []);

  if (phase.kind === "done") {
    return (
      <EarResults
        title={routine.name}
        subtitle={routine.tagline}
        steps={routine.steps.map((s, i) => ({
          label: earStepLabel(s),
          result: results[i] ?? null,
        }))}
        onContinue={onExit}
        onAgain={again}
      />
    );
  }

  const step = routine.steps[phase.step];

  if (phase.kind === "intro") {
    // Between steps only: a game under way finishes and logs first.
    if (capped) return <CapSlide cap={cap} onExit={quit} />;
    const prevStep = phase.step > 0 ? routine.steps[phase.step - 1] : null;
    return (
      <StepIntro
        key={`${run}-${phase.step}`}
        routineName={routine.name}
        step={step}
        stepIndex={phase.step}
        stepCount={stepCount}
        prev={
          prevStep
            ? {
                label: earStepLabel(prevStep),
                score: results[phase.step - 1]?.score ?? null,
              }
            : null
        }
        onStart={() => setPhase({ kind: "play", step: phase.step })}
        onSkip={() => closeStep(phase.step, null)}
        onQuit={quit}
      />
    );
  }

  return (
    <GameStep
      key={`${run}-${phase.step}`}
      step={step}
      onExit={quit}
      onComplete={(r) => closeStep(phase.step, r)}
    />
  );
}

/* ---------------- one game, on its own ---------------- */

/**
 * A single game picked off the path. Same surface, same results screen as a
 * workout — the only difference is that there is one row instead of several
 * and no slide in front of it.
 */
export function EarGameSession({
  game,
  difficulty,
  onExit,
}: {
  game: GameId;
  difficulty: Difficulty;
  onExit: () => void;
}) {
  const [result, setResult] = useState<EarStepResult | null>(null);
  const [run, setRun] = useState(0);
  const step: EarRoutineStep = { game, difficulty };

  if (result) {
    return (
      <EarResults
        title={GAME_NAMES[game]}
        subtitle={`${difficultyLabel(difficulty)} · 10 rounds`}
        steps={[{ label: earStepLabel(step), result }]}
        onContinue={onExit}
        onAgain={() => {
          setResult(null);
          setRun((r) => r + 1);
        }}
      />
    );
  }

  return <GameStep key={run} step={step} onExit={onExit} onComplete={setResult} />;
}
