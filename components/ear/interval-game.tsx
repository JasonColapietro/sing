"use client";

import { useCallback, useEffect, useState } from "react";
import { playSequence, playTone } from "@/lib/audio/synth";
import {
  INTERVAL_NAMES,
  INTERVAL_SETS,
  SHORTCUT_KEYS,
  pick,
  randInt,
  type Difficulty,
} from "./lib";
import {
  AnswerButton,
  GameShell,
  RoundFeedback,
  ShellButton,
  StepDone,
  SummaryView,
  useEarSession,
  type OnEarComplete,
} from "./session";

interface Round {
  root: number;
  semi: number;
}

function makeRound(difficulty: Difficulty): Round {
  return { root: randInt(50, 69), semi: pick(INTERVAL_SETS[difficulty]) };
}

export function IntervalGame({
  difficulty,
  onExit,
  onComplete,
}: {
  difficulty: Difficulty;
  onExit: () => void;
  /** Set when this game is one step of a workout: the result goes up instead
      of being drawn here, and no summary card renders. */
  onComplete?: OnEarComplete;
}) {
  const session = useEarSession();
  const options = INTERVAL_SETS[difficulty];
  const harmonic = difficulty === "hard";

  const [round, setRound] = useState<Round>(() => makeRound(difficulty));
  const [answered, setAnswered] = useState<number | null>(null);
  const [key, setKey] = useState(0); // remount trigger for replay
  const [startedAt, setStartedAt] = useState(() => performance.now());

  const play = useCallback(() => {
    if (harmonic) {
      playTone(round.root, { dur: 1.2 });
      playTone(round.root + round.semi, { dur: 1.2 });
    } else {
      playSequence([round.root, round.root + round.semi], {
        noteDur: 0.6,
        gap: 0.12,
      });
    }
  }, [round, harmonic]);

  // Play the pair at the start of each round.
  useEffect(() => {
    if (!session.done) play();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [round, key]);

  const answer = useCallback(
    (semi: number) => {
      if (answered !== null || session.done) return;
      setAnswered(semi);
      session.record(semi === round.semi);
    },
    [answered, session, round.semi],
  );

  const next = useCallback(() => {
    if (answered === null) return;
    setAnswered(null);
    setRound(makeRound(difficulty));
  }, [answered, difficulty]);

  // Keyboard: number keys answer, Enter advances, R replays.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (session.done) return;
      if (e.key === "Enter") {
        next();
        return;
      }
      if (e.key === "r" || e.key === "R") {
        play();
        return;
      }
      const idx = SHORTCUT_KEYS.indexOf(e.key);
      if (idx >= 0 && idx < options.length) answer(options[idx]);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [answer, next, play, options, session.done]);

  const replayAll = () => {
    session.reset();
    setAnswered(null);
    setRound(makeRound(difficulty));
    setStartedAt(performance.now());
    setKey((k) => k + 1);
  };

  if (session.done) {
    if (onComplete) {
      return (
        <StepDone
          game="interval"
          difficulty={difficulty}
          session={session}
          startedAt={startedAt}
          onExit={onExit}
          onComplete={onComplete}
        />
      );
    }
    return (
      <div className="mx-auto max-w-2xl">
        <SummaryView
          game="interval"
          difficulty={difficulty}
          session={session}
          startedAt={startedAt}
          onReplay={replayAll}
          onExit={onExit}
        />
      </div>
    );
  }

  return (
    <GameShell game="interval" difficulty={difficulty} session={session} onExit={onExit}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-[var(--s-mut)]">
          {harmonic
            ? "Two notes play together. Which interval is it?"
            : "Two notes play one after the other. Which interval is it?"}
        </p>
        <ShellButton onClick={play}>
          Hear again
          <span className="font-mono text-xs text-[var(--s-dim)]" aria-hidden="true">R</span>
        </ShellButton>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-2.5 sm:grid-cols-3">
        {options.map((semi, i) => {
          const isAnswer = answered !== null && semi === round.semi;
          const isWrongPick =
            answered !== null && semi === answered && semi !== round.semi;
          return (
            <AnswerButton
              key={semi}
              state={
                isAnswer
                  ? "correct"
                  : isWrongPick
                    ? "wrong"
                    : answered !== null
                      ? "muted"
                      : "idle"
              }
              onClick={() => answer(semi)}
              disabled={answered !== null}
              ariaLabel={`${INTERVAL_NAMES[semi]}, shortcut ${SHORTCUT_KEYS[i]}`}
              className="items-center justify-between gap-2 py-3 text-left text-sm"
            >
              <span>{INTERVAL_NAMES[semi]}</span>
              <kbd className="rounded border border-[var(--s-line)] px-1.5 font-mono text-[11px] opacity-70">
                {SHORTCUT_KEYS[i]}
              </kbd>
            </AnswerButton>
          );
        })}
      </div>

      {answered !== null && (
        <div className="mt-6 space-y-4">
          <RoundFeedback
            correct={answered === round.semi}
            message={
              answered === round.semi
                ? `That was a ${INTERVAL_NAMES[round.semi].toLowerCase()}.`
                : `It was a ${INTERVAL_NAMES[round.semi].toLowerCase()}.`
            }
          />
          <ShellButton tone="primary" onClick={next}>
            Next round
            <span className="font-mono text-xs opacity-70" aria-hidden="true">
              Enter
            </span>
          </ShellButton>
        </div>
      )}
    </GameShell>
  );
}
