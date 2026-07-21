"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button, Card, Pill, ProgressBar, Stat } from "@/components/ui";
import { logSession, type Achievement } from "@/lib/progress";
import {
  DIFFICULTIES,
  GAME_NAMES,
  POINTS_PER_ROUND,
  ROUNDS,
  saveBest,
  type Difficulty,
  type GameId,
} from "./lib";

/* ---------------- session state ---------------- */

export interface EarSession {
  /** 1-based round currently being played (clamped to ROUNDS). */
  round: number;
  score: number;
  streak: number;
  bestStreak: number;
  results: boolean[];
  done: boolean;
  record: (correct: boolean) => void;
  reset: () => void;
}

export function useEarSession(): EarSession {
  const [results, setResults] = useState<boolean[]>([]);

  const record = useCallback((correct: boolean) => {
    setResults((prev) => (prev.length >= ROUNDS ? prev : [...prev, correct]));
  }, []);

  const reset = useCallback(() => setResults([]), []);

  return useMemo<EarSession>(() => {
    let streak = 0;
    let bestStreak = 0;
    for (const r of results) {
      streak = r ? streak + 1 : 0;
      bestStreak = Math.max(bestStreak, streak);
    }
    return {
      round: Math.min(results.length + 1, ROUNDS),
      score: results.filter(Boolean).length * POINTS_PER_ROUND,
      streak,
      bestStreak,
      results,
      done: results.length >= ROUNDS,
      record,
      reset,
    };
  }, [results, record, reset]);
}

/* ---------------- game header / shell ---------------- */

export function GameShell({
  game,
  difficulty,
  session,
  onExit,
  children,
}: {
  game: GameId;
  difficulty: Difficulty;
  session: EarSession;
  onExit: () => void;
  children: React.ReactNode;
}) {
  const diffLabel =
    DIFFICULTIES.find((d) => d.id === difficulty)?.label ?? difficulty;
  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <h2 className="text-xl">{GAME_NAMES[game]}</h2>
          <Pill tone="cool">{diffLabel}</Pill>
        </div>
        <div className="flex items-center gap-3">
          <span className="tabular font-mono text-sm text-mut">
            Round {session.round}/{ROUNDS}
          </span>
          <span
            className="tabular font-mono text-sm text-ink"
            aria-label={`Score ${session.score} points`}
          >
            {session.score} pts
          </span>
          <StreakPill streak={session.streak} />
          <Button variant="ghost" size="sm" onClick={onExit} aria-label="Back to games">
            Quit
          </Button>
        </div>
      </div>
      <ProgressBar
        value={(session.results.length / ROUNDS) * 100}
        tone="cool"
        className="mb-5"
      />
      {children}
    </div>
  );
}

export function StreakPill({ streak }: { streak: number }) {
  if (streak < 2) return null;
  return (
    <Pill tone="amber">
      <span
        className={streak >= 4 ? "animate-recblink" : undefined}
        aria-hidden="true"
      >
        <svg width="10" height="10" viewBox="0 0 10 10">
          <circle cx="5" cy="5" r="4" fill="currentColor" />
        </svg>
      </span>
      <span className="tabular font-mono">{streak} in a row</span>
    </Pill>
  );
}

/* ---------------- round feedback ---------------- */

export function RoundFeedback({
  correct,
  message,
  children,
}: {
  correct: boolean;
  /** e.g. "It was a perfect fifth." */
  message: string;
  children?: React.ReactNode;
}) {
  return (
    <div
      role="status"
      className={`rounded-2xl border p-4 ${
        correct ? "border-ok/40 bg-panel2" : "border-line2 bg-panel2"
      }`}
    >
      <div className={`font-display text-lg ${correct ? "text-ok" : "text-ink"}`}>
        {correct ? "Correct" : "Not quite"}
      </div>
      <p className="mt-1 text-sm text-mut">{message}</p>
      {children}
    </div>
  );
}

/* ---------------- summary ---------------- */

export function SummaryView({
  game,
  difficulty,
  session,
  startedAt,
  onReplay,
  onExit,
}: {
  game: GameId;
  difficulty: Difficulty;
  session: EarSession;
  /** performance.now() when play began, for session duration. */
  startedAt: number;
  onReplay: () => void;
  onExit: () => void;
}) {
  const logged = useRef(false);
  const [xpGained, setXpGained] = useState(0);
  const [newAchievements, setNewAchievements] = useState<Achievement[]>([]);
  const [newBest, setNewBest] = useState(false);

  useEffect(() => {
    if (logged.current) return;
    logged.current = true;
    const durationSec = Math.max(
      1,
      Math.round((performance.now() - startedAt) / 1000),
    );
    const res = logSession({
      type: "ear",
      durationSec,
      score: session.score,
      detail: GAME_NAMES[game],
    });
    setXpGained(res.xpGained);
    setNewAchievements(res.newAchievements);
    setNewBest(saveBest(game, difficulty, session.score));
  }, [game, difficulty, session.score, startedAt]);

  return (
    <Card>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-lg">Session complete</h3>
        {newBest && <Pill tone="amber">New personal best</Pill>}
      </div>
      <div className="mt-5 grid grid-cols-3 gap-4">
        <Stat
          label="Score"
          value={
            <>
              {session.score}
              <span className="text-base text-dim">/100</span>
            </>
          }
          tone={session.score >= 70 ? "ok" : "ink"}
        />
        <Stat label="Best streak" value={session.bestStreak} tone="amber" />
        <Stat label="XP earned" value={`+${xpGained}`} tone="cool" />
      </div>
      <div className="mt-5 flex gap-1.5" aria-label="Round results">
        {session.results.map((r, i) => (
          <span
            key={i}
            title={`Round ${i + 1}: ${r ? "correct" : "missed"}`}
            className={`h-2 flex-1 rounded-full ${r ? "bg-ok" : "bg-line2"}`}
          />
        ))}
      </div>
      {newAchievements.length > 0 && (
        <div className="mt-5 space-y-2">
          {newAchievements.map((a) => (
            <div
              key={a.id}
              className="flex items-center gap-3 rounded-2xl border border-amber/40 bg-panel2 px-4 py-3"
            >
              <span className="text-xl" aria-hidden="true">
                {a.icon}
              </span>
              <div>
                <div className="text-sm text-amber">{a.title}</div>
                <div className="text-xs text-mut">{a.desc}</div>
              </div>
            </div>
          ))}
        </div>
      )}
      <div className="mt-6 flex gap-2">
        <Button variant="amber" onClick={onReplay}>
          Play again
        </Button>
        <Button variant="outline" onClick={onExit}>
          All games
        </Button>
      </div>
    </Card>
  );
}

/* ---------------- mic gate ---------------- */

export function MicGate({
  error,
  onEnable,
  trains,
}: {
  error: string | null;
  onEnable: () => void;
  trains: string;
}) {
  return (
    <Card className="text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-line2 bg-panel2">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <rect x="9" y="3" width="6" height="11" rx="3" stroke="#5c564d" strokeWidth="1.6" />
          <path
            d="M5 11a7 7 0 0 0 14 0M12 18v3"
            stroke="#5c564d"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
        </svg>
      </div>
      <h3 className="mt-4 text-lg">This game listens to you sing</h3>
      <p className="mx-auto mt-2 max-w-sm text-sm text-mut">{trains} Audio
        stays on your device — nothing is uploaded.</p>
      <div className="mt-5">
        <Button variant="rec" onClick={onEnable}>
          Enable microphone
        </Button>
      </div>
      {error && (
        <p role="alert" className="mx-auto mt-4 max-w-sm text-sm text-rec">
          {error}
        </p>
      )}
    </Card>
  );
}
