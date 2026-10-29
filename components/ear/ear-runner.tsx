"use client";

import { CapSlide, CappedAgainNote } from "@/components/practice/free-cap";
import { StepIntroSlide } from "@/components/practice/step-intro";
import { useStepRunner, type StepPhase } from "@/components/practice/step-runner";
import { formatClock, useFreeCap, type FreeCap } from "@/lib/free-cap";
import { usePitch, type UsePitchResult } from "@/lib/audio/use-pitch";
import { liveStreak } from "@/components/account/save-state";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { ResultsScreen, starsForScore } from "@/components/practice/results-screen";
import { useDailyGoal, useGoalDoneSec } from "@/components/practice/learn-home";
import { useProgress, type Achievement } from "@/lib/progress";
import { SITE_URL } from "@/lib/site";
import { DIFFICULTIES, GAME_NAMES, type Difficulty, type GameId } from "./lib";
import {
  EAR_STEP_INTRO_SEC,
  GAME_DESC,
  GAME_MIC,
  GAME_TRAINS,
  earRoutineSeconds,
  earStepLabel,
  type EarRoutine,
  type EarRoutineStep,
} from "./routines";
import type { EarStepResult } from "./session";
import { IntervalGame } from "./interval-game";
import { PitchMatchGame } from "./pitch-match-game";
import { MelodyEchoGame } from "./melody-echo-game";
import { HigherLowerGame } from "./higher-lower-game";
import { NoteCatcherGame } from "./note-catcher-game";

/**
 * Whether the routine's microphone is analysed in this phase: only while a
 * game that listens is played. The stream stays open between such steps, but
 * detection (and its per-frame state update) pauses through slides, tapping
 * games and results.
 */
export function earPhaseListens(phase: StepPhase, steps: readonly EarRoutineStep[]): boolean {
  return phase.kind === "play" && GAME_MIC[steps[phase.step].game];
}

/**
 * The free minutes left today, for a step's intro slide, when they run out
 * before the rest of the routine does; null on Pro and while they cover it.
 *
 * A program row opens a routine straight into this runner, past the room's
 * own allowance line, so the intro shows the countdown the cap would cut. The
 * estimate only decides whether to show it.
 */
export function earIntroFreeLeft(
  routine: EarRoutine,
  fromStep: number,
  cap: Pick<FreeCap, "isPro" | "leftSec">,
): string | null {
  if (cap.isPro) return null;
  // The card's own estimate (earRoutineSeconds), of the games still ahead.
  const setLeftSec = earRoutineSeconds({ ...routine, steps: routine.steps.slice(fromStep) });
  return cap.leftSec < setLeftSec ? `${formatClock(cap.leftSec)} free left today` : null;
}

function difficultyLabel(d: Difficulty): string {
  return DIFFICULTIES.find((x) => x.id === d)?.label ?? d;
}

/* ---------------- one step ---------------- */

function GameStep({
  step,
  songId,
  pitch,
  onExit,
  onComplete,
}: {
  step: EarRoutineStep;
  /** Note catcher only: chase this song instead of random notes. */
  songId?: string;
  /** A routine's microphone, lent to the games that listen; a lone game opens its own. */
  pitch?: UsePitchResult;
  onExit: () => void;
  onComplete: (r: EarStepResult) => void;
}) {
  const props = { difficulty: step.difficulty, onExit, onComplete };
  switch (step.game) {
    case "note-catcher":
      return <NoteCatcherGame {...props} songId={songId} pitch={pitch} />;
    case "interval":
      return <IntervalGame {...props} />;
    case "pitch-match":
      return <PitchMatchGame {...props} pitch={pitch} />;
    case "melody-echo":
      return <MelodyEchoGame {...props} pitch={pitch} />;
    case "higher-lower":
      return <HigherLowerGame {...props} />;
  }
}

/* ---------------- results ---------------- */

/** The end of a routine or a single game: scores average over the steps played. */
function EarResults({
  title,
  subtitle,
  steps,
  onContinue,
  onAgain,
  notice,
  children,
}: {
  title: string;
  subtitle?: string;
  /** `note` replaces the row's "skipped" when the step was not skipped but never reached. */
  steps: { label: string; result: EarStepResult | null; note?: string }[];
  onContinue: () => void;
  /** Omitted once the free minutes are spent: "Play again" would start past the cap. */
  onAgain?: () => void;
  /** Above the rows: why the run ended where it did (ResultsScreen). */
  notice?: ReactNode;
  children?: ReactNode;
}) {
  const progress = useProgress();
  const { goalSec } = useDailyGoal();
  const goalDoneSec = useGoalDoneSec(progress);

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
      streakDays={liveStreak(progress.streak)}
      goal={{ doneSec: goalDoneSec, goalSec }}
      rows={steps.map((s) => ({
        label: s.label,
        score: s.result?.score ?? null,
        note: s.result === null ? (s.note ?? "skipped") : undefined,
      }))}
      achievements={achievements}
      onContinue={onContinue}
      onAgain={onAgain}
      share={{ title, subtitle, url: `${SITE_URL}/ear-training` }}
      notice={notice}
    >
      {children}
    </ResultsScreen>
  );
}

/** The end of a routine; once the free minutes are spent "Play again" is left off, the note says why. */
export function EarRunResults({
  routine,
  results,
  capStoppedAt = null,
  capped,
  onContinue,
  onAgain,
}: {
  routine: EarRoutine;
  results: (EarStepResult | null)[];
  /**
   * The step whose intro became the cap slide: it and the steps after it
   * were never reached, which is not the same as skipped. Null otherwise.
   */
  capStoppedAt?: number | null;
  capped: boolean;
  onContinue: () => void;
  onAgain: () => void;
}) {
  const notReached = capStoppedAt === null ? 0 : Math.max(0, routine.steps.length - capStoppedAt);
  return (
    <EarResults
      title={routine.name}
      subtitle={routine.tagline}
      steps={routine.steps.map((s, i) => ({
        label: earStepLabel(s),
        result: results[i] ?? null,
        note: capStoppedAt !== null && i >= capStoppedAt ? "not reached" : undefined,
      }))}
      onContinue={onContinue}
      onAgain={capped ? undefined : onAgain}
      // Above the rows, so the reason comes before "not reached" on a phone.
      notice={capped ? <CappedAgainNote notReached={notReached} /> : undefined}
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
  const runner = useStepRunner<EarStepResult>(stepCount, { capped });
  const { phase, results } = runner;

  // The routine holds the microphone and lends it to the games that listen, so
  // one gate opens it and the later singing steps start as their intro runs out.
  const pitch = usePitch({ analyse: earPhaseListens(phase, routine.steps) });
  const { listening: micOn, stop: stopMic } = pitch;
  // Nothing listens on the results screen or behind the cap slide.
  const micDone = phase.kind === "done" || runner.atCapSlide;
  useEffect(() => {
    if (micDone && micOn) stopMic();
  }, [micDone, micOn, stopMic]);

  // A quit with nothing played has nothing to summarise, so it just leaves.
  const quit = (capAt?: number) => {
    if (runner.quit(capAt) === null) onExit();
  };

  if (phase.kind === "done") {
    return (
      <EarRunResults
        routine={routine}
        results={results}
        capStoppedAt={runner.capStoppedAt}
        capped={capped}
        onContinue={onExit}
        onAgain={runner.again}
      />
    );
  }

  const step = routine.steps[phase.step];

  if (phase.kind === "intro") {
    if (runner.atCapSlide) return <CapSlide cap={cap} onExit={() => quit(phase.step)} />;
    const prevStep = phase.step > 0 ? routine.steps[phase.step - 1] : null;
    const prevScore = results[phase.step - 1]?.score ?? null;
    return (
      <StepIntroSlide
        key={runner.stepKey}
        routineName={routine.name}
        stepIndex={phase.step}
        stepCount={stepCount}
        title={GAME_NAMES[step.game]}
        prev={
          prevStep
            ? {
                label: earStepLabel(prevStep),
                score: prevScore,
                scoreLabel: prevScore === null ? undefined : `${prevScore}/100`,
              }
            : null
        }
        meta={
          <>
            {GAME_TRAINS[step.game]}
            <span className="mx-2 text-[var(--s-line2)]">·</span>
            {difficultyLabel(step.difficulty)}
            <span className="mx-2 text-[var(--s-line2)]">·</span>10 rounds
          </>
        }
        clockLabel={earIntroFreeLeft(routine, phase.step, cap) ?? undefined}
        holdSec={EAR_STEP_INTRO_SEC}
        onStart={() => runner.play(phase.step)}
        onSkip={() => runner.closeStep(phase.step, null)}
        onQuit={() => quit()}
      >
        <p className="mx-auto mt-4 max-w-md text-[var(--s-mut)]">{GAME_DESC[step.game]}</p>
      </StepIntroSlide>
    );
  }

  return (
    <GameStep
      key={runner.stepKey}
      step={step}
      pitch={pitch}
      onExit={() => quit()}
      onComplete={(r) => runner.closeStep(phase.step, r)}
    />
  );
}

/* ---------------- one game, on its own ---------------- */

/** A single game picked off the path: one results row and no slide in front of it. */
export function EarGameSession({
  capped = false,
  game,
  difficulty,
  song,
  onExit,
}: {
  /** The free allowance is spent: the results offer no "Play again". */
  capped?: boolean;
  game: GameId;
  difficulty: Difficulty;
  /** Note catcher chasing a song: its id, and the title the results show. */
  song?: { id: string; title: string };
  onExit: () => void;
}) {
  const [result, setResult] = useState<EarStepResult | null>(null);
  const [run, setRun] = useState(0);
  const step: EarRoutineStep = { game, difficulty };

  if (result) {
    return (
      <EarResults
        title={song ? `Chase: ${song.title}` : GAME_NAMES[game]}
        subtitle={`${song ? GAME_NAMES[game] : difficultyLabel(difficulty)} · 10 rounds`}
        steps={[{ label: earStepLabel(step), result }]}
        onContinue={onExit}
        onAgain={
          capped
            ? undefined
            : () => {
                setResult(null);
                setRun((r) => r + 1);
              }
        }
      >
        {capped && <CappedAgainNote />}
      </EarResults>
    );
  }

  return (
    <GameStep
      key={run}
      step={step}
      songId={song?.id}
      onExit={onExit}
      onComplete={setResult}
    />
  );
}
