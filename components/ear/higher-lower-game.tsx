"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { playSequence } from "@/lib/audio/synth";
import { pick, randInt, type Difficulty } from "./lib";
import {
  AnswerButton,
  GameShell,
  ShellButton,
  StepDone,
  SummaryView,
  useEarSession,
  type OnEarComplete,
} from "./session";

type Answer = "higher" | "lower" | "same";

interface Round {
  first: number;
  second: number;
}

function makeRound(difficulty: Difficulty): Round {
  const first = randInt(50, 76);
  let delta: number;
  if (difficulty === "easy") delta = randInt(3, 7) * pick([-1, 1]);
  else if (difficulty === "medium") delta = randInt(1, 3) * pick([-1, 1]);
  else delta = pick([-1, 0, 1]);
  return { first, second: first + delta };
}

function truth(r: Round): Answer {
  if (r.second > r.first) return "higher";
  if (r.second < r.first) return "lower";
  return "same";
}

const LABELS: Record<Answer, string> = {
  higher: "Higher",
  lower: "Lower",
  same: "Same",
};

export function HigherLowerGame({
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
  const hasSame = difficulty === "hard";
  const answers: Answer[] = hasSame
    ? ["higher", "lower", "same"]
    : ["higher", "lower"];

  const [round, setRound] = useState<Round>(() => makeRound(difficulty));
  const [answered, setAnswered] = useState<Answer | null>(null);
  const [startedAt, setStartedAt] = useState(() => performance.now());
  const advanceRef = useRef(0);

  const play = useCallback(() => {
    playSequence([round.first, round.second], { noteDur: 0.45, gap: 0.08 });
  }, [round]);

  useEffect(() => {
    if (!session.done) play();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [round]);

  const answer = useCallback(
    (a: Answer) => {
      if (answered !== null || session.done) return;
      setAnswered(a);
      session.record(a === truth(round));
      // Fast pace: brief feedback, then straight into the next pair.
      advanceRef.current = window.setTimeout(() => {
        setAnswered(null);
        setRound(makeRound(difficulty));
      }, 1000);
    },
    [answered, session, round, difficulty],
  );

  // Keyboard: arrows answer, R replays.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (session.done) return;
      if (e.key === "ArrowUp") {
        e.preventDefault();
        answer("higher");
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        answer("lower");
      } else if (hasSame && (e.key === "ArrowRight" || e.key === "s" || e.key === "S")) {
        e.preventDefault();
        answer("same");
      } else if (e.key === "r" || e.key === "R") {
        play();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [answer, play, hasSame, session.done]);

  useEffect(() => () => window.clearTimeout(advanceRef.current), []);

  if (session.done) {
    if (onComplete) {
      return (
        <StepDone
          game="higher-lower"
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
          game="higher-lower"
          difficulty={difficulty}
          session={session}
          startedAt={startedAt}
          onReplay={() => {
            session.reset();
            setAnswered(null);
            setRound(makeRound(difficulty));
            setStartedAt(performance.now());
          }}
          onExit={onExit}
        />
      </div>
    );
  }

  const correctAnswer = truth(round);

  return (
    <GameShell game="higher-lower" difficulty={difficulty} session={session} onExit={onExit}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-[var(--s-mut)]">
          Two notes. Was the second one higher{hasSame ? ", lower, or the same" : " or lower"}?
        </p>
        <ShellButton onClick={play}>
          Hear again
          <span className="font-mono text-xs text-[var(--s-dim)]" aria-hidden="true">R</span>
        </ShellButton>
      </div>

      <div className="mt-8 flex flex-wrap justify-center gap-3">
        {answers.map((a) => {
          const isRight = answered !== null && a === correctAnswer;
          const isWrongPick =
            answered !== null && a === answered && a !== correctAnswer;
          const arrow = a === "higher" ? "↑" : a === "lower" ? "↓" : "→";
          const keyHint =
            a === "higher" ? "Up" : a === "lower" ? "Down" : "Right";
          return (
            <AnswerButton
              key={a}
              state={
                isRight
                  ? "correct"
                  : isWrongPick
                    ? "wrong"
                    : answered !== null
                      ? "muted"
                      : "idle"
              }
              onClick={() => answer(a)}
              disabled={answered !== null}
              ariaLabel={`${LABELS[a]}, shortcut ${keyHint} arrow`}
              className="min-w-32 flex-col items-center justify-center gap-1 py-6 text-center"
            >
              <span className="font-mono text-2xl" aria-hidden="true">
                {arrow}
              </span>
              <span className="text-sm">{LABELS[a]}</span>
              <kbd className="rounded border border-[var(--s-line)] px-1.5 font-mono text-[10px] opacity-70">
                {keyHint}
              </kbd>
            </AnswerButton>
          );
        })}
      </div>

      <div className="mt-6 text-center text-sm" role="status" aria-live="polite">
        {answered === null ? (
          <span className="text-[var(--s-dim)]">Answer with the arrow keys for speed.</span>
        ) : answered === correctAnswer ? (
          <span style={{ color: "var(--s-ok)" }}>
            Correct — it was {LABELS[correctAnswer].toLowerCase()}.
          </span>
        ) : (
          <span className="text-[var(--s-mut)]">
            It was {LABELS[correctAnswer].toLowerCase()}.
          </span>
        )}
      </div>
    </GameShell>
  );
}
