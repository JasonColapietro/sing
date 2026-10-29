"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { SessionShell } from "@/components/practice/session-shell";
import { logSession, type Achievement } from "@/lib/progress";
import { emitProResult } from "@/lib/pro-signal";
import { trackHiddenTime } from "@/components/practice/hidden-time";
import {
  createActiveTimer,
  trackActivity,
  type ActiveTimer,
} from "@/components/practice/active-clock";
import {
  DIFFICULTIES,
  GAME_NAMES,
  POINTS_PER_ROUND,
  ROUNDS,
  saveBest,
  type Difficulty,
  type GameId,
} from "./lib";
import { EAR_GAME_SECONDS } from "./routines";

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
 * A run of a game that is not comparable with its plain levels — Note catcher
 * chasing one song. `key` keeps its best apart; `label` names it on the top bar
 * and in the logged session's detail. Every other game passes nothing.
 */
export interface EarVariant {
  key: string;
  label: string;
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
  variant,
  children,
}: {
  game: GameId;
  difficulty: Difficulty;
  session: EarSession;
  onExit: () => void;
  variant?: EarVariant;
  children: ReactNode;
}) {
  return (
    <SessionShell
      // A variant names itself in the title, which truncates; the subtitle
      // never shrinks, so a song title there pushed the game name off a phone.
      title={variant?.label ?? GAME_NAMES[game]}
      subtitle={
        variant
          ? `Round ${session.round}/${ROUNDS}`
          : `${difficultyLabel(difficulty)} · Round ${session.round}/${ROUNDS}`
      }
      progress={(session.results.length / ROUNDS) * 100}
      onClose={onExit}
      closeLabel="Exit game"
      topRight={<ScoreChip score={session.score} streak={session.streak} />}
    >
      <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-10 pt-2 sm:px-6">
        <div className="mx-auto w-full max-w-2xl">{children}</div>
      </div>
    </SessionShell>
  );
}

/** Score, and the run of correct answers behind it, for the top bar. */
function ScoreChip({ score, streak }: { score: number; streak: number }) {
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
    // Dark text: near-white on the red fill measured about 2.5:1.
    wrong: "border-transparent bg-[var(--s-rec)] text-[oklch(0.16_0.03_25)]",
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

/* ---------------- play time ---------------- */

/**
 * Where a finished game's play time is read from. Note catcher passes the
 * performance.now() instant its play began, which its own pause screen and a
 * hidden tab already move forward. The turn-based games pass the timer from
 * useActiveStart, which also leaves out idle time on a visible screen.
 */
export type PlayStart = number | ActiveTimer;

/** The turn-based games' play clock: hidden time and idle stretches past thirty seconds are left out; `roundEvent` counts finished rounds as activity. */
export function useActiveStart(roundEvent: number): [ActiveTimer, () => void] {
  const [timer] = useState(() => createActiveTimer(performance.now()));
  useEffect(() => {
    const stopHidden = trackHiddenTime(
      document,
      () => performance.now(),
      (ms) => timer.hidden(ms, performance.now()),
    );
    const stopInput = trackActivity(document, () => timer.mark(performance.now()));
    return () => {
      stopHidden();
      stopInput();
    };
  }, [timer]);
  useEffect(() => {
    timer.mark(performance.now());
  }, [timer, roundEvent]);
  const restart = useCallback(() => timer.restart(performance.now()), [timer]);
  return [timer, restart];
}

/** Seconds of a finished game to log: the turn-based games are held to three times their usual length as a backstop against a phone put down mid-game. */
export function earSessionSeconds(game: GameId, startedAt: PlayStart, now: number): number {
  const ms = typeof startedAt === "number" ? now - startedAt : startedAt.elapsedMs(now);
  const raw = Math.round(ms / 1000);
  const capped = game === "note-catcher" ? raw : Math.min(raw, EAR_GAME_SECONDS[game] * 3);
  return Math.max(1, capped);
}

/* ---------------- logging ---------------- */

export interface EarLogResult {
  xpGained: number;
  newAchievements: Achievement[];
  newBest: boolean;
  /** False until the write has happened — the moment a result can be handed on. */
  logged: boolean;
}

/** Write one finished game to the progress store, exactly once. */
function useLogEarSession(
  game: GameId,
  difficulty: Difficulty,
  session: EarSession,
  /** When play began, or the game's play clock, for session duration. */
  startedAt: PlayStart,
  variant?: EarVariant,
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
    const durationSec = earSessionSeconds(game, startedAt, performance.now());
    const res = logSession({
      type: "ear",
      durationSec,
      score: session.score,
      detail: variant ? `${GAME_NAMES[game]} · ${variant.label}` : GAME_NAMES[game],
    });
    setResult({
      xpGained: res.xpGained,
      newAchievements: res.newAchievements,
      newBest: saveBest(game, difficulty, session.score, variant?.key),
      logged: true,
    });
    emitProResult();
  }, [game, difficulty, session.done, session.score, startedAt, variant]);

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
  variant,
}: {
  game: GameId;
  difficulty: Difficulty;
  session: EarSession;
  startedAt: PlayStart;
  onExit: () => void;
  onComplete: OnEarComplete;
  variant?: EarVariant;
}) {
  const log = useLogEarSession(game, difficulty, session, startedAt, variant);
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
    <GameShell
      game={game}
      difficulty={difficulty}
      session={session}
      onExit={onExit}
      variant={variant}
    >
      <p className="py-24 text-center text-sm text-[var(--s-mut)]" role="status">
        Scoring your round…
      </p>
    </GameShell>
  );
}
