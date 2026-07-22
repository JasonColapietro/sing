"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Button, Card } from "@/components/ui";
import { playSequence } from "@/lib/audio/synth";
import { pick, randInt, type Difficulty } from "./lib";
import { GameShell, SummaryView, useEarSession } from "./session";

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
}: {
  difficulty: Difficulty;
  onExit: () => void;
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
      <Card>
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm text-mut">
            Two notes. Was the second one higher{hasSame ? ", lower, or the same" : " or lower"}?
          </p>
          <Button variant="outline" size="sm" onClick={play}>
            Hear again
            <span className="font-mono text-xs text-dim" aria-hidden="true">R</span>
          </Button>
        </div>

        <div className="mt-6 flex flex-wrap justify-center gap-3">
          {answers.map((a) => {
            const isRight = answered !== null && a === correctAnswer;
            const isWrongPick =
              answered !== null && a === answered && a !== correctAnswer;
            const arrow =
              a === "higher" ? "↑" : a === "lower" ? "↓" : "→";
            const keyHint =
              a === "higher" ? "Up" : a === "lower" ? "Down" : "Right";
            return (
              <button
                key={a}
                onClick={() => answer(a)}
                disabled={answered !== null}
                aria-label={`${LABELS[a]}, shortcut ${keyHint} arrow`}
                className={`flex min-w-28 flex-col items-center gap-1 rounded-2xl border px-6 py-4 transition-colors disabled:cursor-default ${
                  isRight
                    ? "border-ok/60 bg-panel2 text-ok"
                    : isWrongPick
                      ? "border-rec/50 bg-panel2 text-rec"
                      : answered !== null
                        ? "border-line text-dim"
                        : "border-line2 text-ink hover:border-amber hover:text-amber-ink"
                }`}
              >
                <span className="font-mono text-xl" aria-hidden="true">
                  {arrow}
                </span>
                <span className="text-sm">{LABELS[a]}</span>
                <kbd className="rounded border border-line bg-panel px-1.5 font-mono text-[10px] text-dim">
                  {keyHint}
                </kbd>
              </button>
            );
          })}
        </div>

        <div className="mt-5 text-center text-sm" role="status" aria-live="polite">
          {answered === null ? (
            <span className="text-dim">Answer with the arrow keys for speed.</span>
          ) : answered === correctAnswer ? (
            <span className="text-ok">Correct — it was {LABELS[correctAnswer].toLowerCase()}.</span>
          ) : (
            <span className="text-mut">
              It was {LABELS[correctAnswer].toLowerCase()}.
            </span>
          )}
        </div>
      </Card>
    </GameShell>
  );
}
