"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Button, Card, MIC_PRIVACY, Pill, Stat } from "@/components/ui";
import { MicAlert } from "@/components/mic-alert";
import { ProCrescendoNudge } from "@/components/pro/gate";
import { SessionShell } from "@/components/practice/session-shell";
import { logSession, type Achievement } from "@/lib/progress";
import { emitProResult } from "@/lib/pro-signal";
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

/**
 * What a finished game hands back to whoever started it — a routine runner or
 * the room, either of which draws the results screen. The logging has already
 * happened by the time this is delivered; these are its numbers, not a request
 * to log them again.
 */
export interface EarStepResult {
  score: number;
  bestStreak: number;
  results: boolean[];
  xpGained: number;
  newAchievements: Achievement[];
  newBest: boolean;
}

/** The prop every game takes to run as one step of something larger. */
export type OnEarComplete = (result: EarStepResult) => void;

/* ---------------- game shell ---------------- */

function difficultyLabel(difficulty: Difficulty): string {
  return DIFFICULTIES.find((d) => d.id === difficulty)?.label ?? difficulty;
}

/**
 * A game's live screen: the full-screen dark session surface, with the round
 * UI in the body. The top bar carries the way out and the progress through
 * the ten rounds; the score and the current streak sit in its right slot, the
 * two numbers a player glances at between rounds.
 */
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
  children: ReactNode;
}) {
  return (
    <SessionShell
      title={GAME_NAMES[game]}
      subtitle={`${difficultyLabel(difficulty)} · Round ${session.round}/${ROUNDS}`}
      progress={(session.results.length / ROUNDS) * 100}
      onClose={onExit}
      closeLabel="Quit game"
      topRight={<ScoreChip score={session.score} streak={session.streak} />}
    >
      <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-10 pt-2 sm:px-6">
        <div className="mx-auto w-full max-w-2xl">{children}</div>
      </div>
    </SessionShell>
  );
}

/** Score, and the run of correct answers behind it, for the top bar. */
export function ScoreChip({ score, streak }: { score: number; streak: number }) {
  return (
    <div className="flex items-center gap-2">
      <span
        className="tabular font-mono text-sm text-[var(--s-ink)]"
        aria-label={`Score ${score} points`}
      >
        {score}
        <span className="text-[var(--s-dim)]">/100</span>
      </span>
      {streak >= 2 && (
        <span className="tabular inline-flex items-center gap-1.5 rounded-full border border-[var(--s-line2)] bg-[var(--s-elev)] px-2 py-0.5 font-mono text-[11px] text-[var(--s-ok)]">
          <span
            className={streak >= 4 ? "animate-recblink" : undefined}
            aria-hidden="true"
          >
            <svg width="8" height="8" viewBox="0 0 10 10">
              <circle cx="5" cy="5" r="4" fill="currentColor" />
            </svg>
          </span>
          {streak}
        </span>
      )}
    </div>
  );
}

/** Kept for anything still reading the old paper header. */
export function StreakPill({ streak }: { streak: number }) {
  if (streak < 2) return null;
  return (
    <Pill tone="violet">
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

/* ---------------- dark controls ---------------- */

const FOCUS_RING =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--s-amber)]";

/**
 * A game's answer button on the dark surface. Large enough to hit on a phone,
 * quiet until it is answered, then filled green for the right answer and red
 * for the one that was picked instead.
 */
export function AnswerButton({
  state,
  onClick,
  disabled,
  ariaLabel,
  className = "",
  children,
}: {
  state: "idle" | "correct" | "wrong" | "muted";
  onClick: () => void;
  disabled?: boolean;
  ariaLabel?: string;
  className?: string;
  children: ReactNode;
}) {
  const tones = {
    idle: "border-[var(--s-line2)] bg-[var(--s-elev)] text-[var(--s-ink)] hover:bg-[var(--s-over)]",
    correct: "border-transparent bg-[var(--s-ok)] text-[oklch(0.16_0.03_155)]",
    wrong: "border-transparent bg-[var(--s-rec)] text-[oklch(0.98_0.01_25)]",
    muted: "border-[var(--s-line)] bg-transparent text-[var(--s-dim)]",
  } as const;
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      className={`flex min-h-11 rounded-2xl border px-4 transition-colors disabled:cursor-default ${tones[state]} ${FOCUS_RING} ${className}`}
    >
      {children}
    </button>
  );
}

/** The quiet secondary control on the dark surface — "Hear again", "I'm done". */
export function ShellButton({
  onClick,
  children,
  disabled,
  title,
  tone = "quiet",
  className = "",
}: {
  onClick: () => void;
  children: ReactNode;
  disabled?: boolean;
  title?: string;
  tone?: "quiet" | "primary";
  className?: string;
}) {
  const tones = {
    quiet:
      "border-[var(--s-line2)] text-[var(--s-mut)] hover:bg-[var(--s-over)] hover:text-[var(--s-ink)]",
    primary:
      "border-transparent bg-[var(--s-ok)] text-[oklch(0.16_0.03_155)] hover:brightness-110",
  } as const;
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`inline-flex min-h-11 items-center gap-2 rounded-full border px-4 py-2 text-sm transition-colors disabled:opacity-40 ${tones[tone]} ${FOCUS_RING} ${className}`}
    >
      {children}
    </button>
  );
}

/** A progress bar on the dark surface — hold time, answer window. */
export function ShellBar({
  value,
  tone = "ok",
  label,
}: {
  /** 0..100. */
  value: number;
  tone?: "ok" | "voice" | "accent";
  label?: string;
}) {
  const colors = {
    ok: "var(--s-ok)",
    voice: "var(--s-voice)",
    accent: "var(--s-accent)",
  } as const;
  return (
    <div
      className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--s-over)]"
      role="progressbar"
      aria-label={label}
      aria-valuenow={Math.round(value)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className="h-full rounded-full transition-[width] duration-150"
        style={{
          width: `${Math.min(100, Math.max(0, value))}%`,
          background: colors[tone],
        }}
      />
    </div>
  );
}

/**
 * The microphone gate, on the dark surface.
 *
 * The shared `MicGate` is the same gate in the site's warm palette — its ink,
 * its panel and its dim type are all fixed browns, which read as smudges on
 * the session's dark ground. This is that gate's content (badge, what the
 * game does, where the audio goes, one button, the failure under it) drawn on
 * the session tokens, so the surface stays continuous from the top bar down.
 * The privacy sentence is imported, not restated, so there is still exactly
 * one of it in the app.
 */
export function ShellMicGate({
  title,
  description,
  onEnable,
  error = null,
}: {
  title: string;
  description: string;
  onEnable: () => void;
  error?: string | null;
}) {
  return (
    <div className="py-10 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-[var(--s-line2)] bg-[var(--s-elev)] text-[var(--s-voice)]">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <rect x="9" y="3" width="6" height="11" rx="3" stroke="currentColor" strokeWidth="1.8" />
          <path d="M5 11a7 7 0 0 0 14 0M12 18v3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      </div>
      <h2 className="mt-5 text-2xl text-[var(--s-ink)]">{title}</h2>
      <p className="mx-auto mt-2 max-w-md text-[var(--s-mut)]">{description}</p>
      <p className="mt-2 text-xs text-[var(--s-dim)]">{MIC_PRIVACY}</p>
      <div className="mt-6 flex justify-center">
        <ShellButton tone="primary" onClick={onEnable}>
          {error ? "Try again" : "Enable microphone"}
        </ShellButton>
      </div>
      {error && (
        <MicAlert
          message={error}
          className="mx-auto mt-4 max-w-md text-sm text-[var(--s-rec)]"
        />
      )}
    </div>
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
  children?: ReactNode;
}) {
  return (
    <div
      role="status"
      className="rounded-2xl border p-4"
      style={{
        borderColor: correct ? "var(--s-ok)" : "var(--s-rec)",
        background: correct
          ? "var(--s-ok-soft)"
          : "color-mix(in oklch, var(--s-rec) 16%, transparent)",
      }}
    >
      <div
        className="text-lg"
        style={{ color: correct ? "var(--s-ok)" : "var(--s-rec)" }}
      >
        {correct ? "Correct" : "Not quite"}
      </div>
      <p className="mt-1 text-sm text-[var(--s-mut)]">{message}</p>
      {children}
    </div>
  );
}

/* ---------------- logging ---------------- */

export interface EarLogResult {
  xpGained: number;
  newAchievements: Achievement[];
  newBest: boolean;
  /** False until the write has happened — the moment a result can be handed on. */
  logged: boolean;
}

/**
 * Write one finished game to the progress store, exactly once.
 *
 * Both endings need this and neither may do it twice: the card summary that a
 * game shows when it was started on its own, and the silent step-done that
 * hands the numbers to a routine runner. The write lives here so there is one
 * `logSession` per game however the game was reached.
 */
export function useLogEarSession(
  game: GameId,
  difficulty: Difficulty,
  session: EarSession,
  /** performance.now() when play began, for session duration. */
  startedAt: number,
): EarLogResult {
  const written = useRef(false);
  const [result, setResult] = useState<EarLogResult>({
    xpGained: 0,
    newAchievements: [],
    newBest: false,
    logged: false,
  });

  useEffect(() => {
    if (written.current || !session.done) return;
    written.current = true;
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
    setResult({
      xpGained: res.xpGained,
      newAchievements: res.newAchievements,
      newBest: saveBest(game, difficulty, session.score),
      logged: true,
    });
    emitProResult();
  }, [game, difficulty, session.done, session.score, startedAt]);

  return result;
}

/**
 * The end of a game that is one step of something larger: log it, hand the
 * numbers up, draw nothing of its own. It stays inside the session shell for
 * the frame it lives, so the screen never flashes back to the page underneath
 * on the way to the results.
 */
export function StepDone({
  game,
  difficulty,
  session,
  startedAt,
  onExit,
  onComplete,
}: {
  game: GameId;
  difficulty: Difficulty;
  session: EarSession;
  startedAt: number;
  onExit: () => void;
  onComplete: OnEarComplete;
}) {
  const log = useLogEarSession(game, difficulty, session, startedAt);
  const handed = useRef(false);

  useEffect(() => {
    if (!log.logged || handed.current) return;
    handed.current = true;
    onComplete({
      score: session.score,
      bestStreak: session.bestStreak,
      results: session.results,
      xpGained: log.xpGained,
      newAchievements: log.newAchievements,
      newBest: log.newBest,
    });
  }, [log, session, onComplete]);

  return (
    <GameShell game={game} difficulty={difficulty} session={session} onExit={onExit}>
      <p className="py-24 text-center text-sm text-[var(--s-mut)]" role="status">
        Scoring your round…
      </p>
    </GameShell>
  );
}

/* ---------------- summary ---------------- */

/**
 * The original card summary, on the site's palette.
 *
 * Every route in the app now finishes a game through `ResultsScreen` instead,
 * but this stays exported and behaviourally unchanged: it is what a game
 * renders when it is mounted with no `onComplete`, which is how anything
 * outside this folder has always used them.
 */
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
  const { xpGained, newAchievements, newBest } = useLogEarSession(
    game,
    difficulty,
    session,
    startedAt,
  );

  return (
    <Card>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-lg">Session complete</h3>
        {newBest && <Pill tone="violet">New personal best</Pill>}
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
        <Stat label="Best streak" value={session.bestStreak} tone="violet" />
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
              className="flex items-center gap-3 rounded-2xl border border-violet/40 bg-panel2 px-4 py-3"
            >
              <span className="text-xl" aria-hidden="true">
                {a.icon}
              </span>
              <div>
                <div className="text-sm text-violet-ink">{a.title}</div>
                <div className="text-xs text-mut">{a.desc}</div>
              </div>
            </div>
          ))}
        </div>
      )}
      <div className="mt-5">
        <ProCrescendoNudge
          line="Pro unlocks your full daily plan and every practice pack"
          title="Build the rest of your practice"
          body="Pro unlocks your full daily Coach plan, range history, take analysis, and every Pro song and warmup."
          context="Ear training"
        />
      </div>
      <div className="mt-6 flex gap-2">
        <Button variant="violet" onClick={onReplay}>
          Play again
        </Button>
        <Button variant="outline" onClick={onExit}>
          All games
        </Button>
      </div>
    </Card>
  );
}
