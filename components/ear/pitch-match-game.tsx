"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePitch } from "@/lib/audio/use-pitch";
import { frameDelta, isFrameFresh } from "@/lib/audio/frame-clock";
import { useAudioPrefs } from "@/lib/audio/devices";
import { playTone } from "@/lib/audio/synth";
import { freqToMidiFloat, midiToLabel } from "@/lib/audio/notes";
import { useProgress } from "@/lib/progress";
import {
  centsToTarget,
  randInt,
  singableRegister,
  type Difficulty,
} from "./lib";
import {
  GameShell,
  RoundFeedback,
  ShellBar,
  ShellButton,
  ShellMicGate,
  StepDone,
  SummaryView,
  useEarSession,
  type OnEarComplete,
} from "./session";

const HOLD_MS = 1500;
const WINDOW_MS = 8000;

type Phase = "listen" | "sing" | "result";

/**
 * Live tuner needle, -60..+60 cents.
 *
 * Drawn on the session shell's dark tokens rather than the site's paper ones:
 * this only ever renders inside the full-screen surface, where the ivory band
 * and brown ticks it used to use were a bright rectangle on a dark ground.
 * The colours come through `style` — SVG presentation attributes do not accept
 * `var()`, only real CSS declarations do.
 */
function CentsNeedle({
  cents,
  tolerance,
  voiced,
}: {
  cents: number | null;
  tolerance: number;
  voiced: boolean;
}) {
  const clamped = cents === null ? 0 : Math.max(-60, Math.min(60, cents));
  const x = 150 + (clamped / 60) * 130;
  const inTune = voiced && cents !== null && Math.abs(cents) <= tolerance;
  const tolW = (tolerance / 60) * 130;
  return (
    <svg
      viewBox="0 0 300 84"
      className="w-full"
      role="img"
      aria-label={
        !voiced || cents === null
          ? "No pitch detected"
          : `${Math.abs(Math.round(cents))} cents ${cents > 0 ? "sharp" : "flat"}`
      }
    >
      {/* tolerance band */}
      <rect
        x={150 - tolW}
        y={18}
        width={tolW * 2}
        height={34}
        rx={6}
        style={{
          fill: inTune ? "var(--s-ok-soft)" : "var(--s-over)",
          stroke: inTune ? "var(--s-ok)" : "var(--s-line2)",
        }}
      />
      {/* scale */}
      <line x1="20" y1="35" x2="280" y2="35" strokeWidth="2" style={{ stroke: "var(--s-line2)" }} />
      {[-50, -25, 0, 25, 50].map((c) => {
        const tx = 150 + (c / 60) * 130;
        return (
          <g key={c}>
            <line
              x1={tx}
              y1={c === 0 ? 22 : 28}
              x2={tx}
              y2={c === 0 ? 48 : 42}
              strokeWidth={c === 0 ? 2 : 1.5}
              style={{ stroke: c === 0 ? "var(--s-mut)" : "var(--s-line2)" }}
            />
            <text
              x={tx}
              y={64}
              textAnchor="middle"
              fontSize="9"
              fontFamily="monospace"
              style={{ fill: "var(--s-dim)" }}
            >
              {c > 0 ? `+${c}` : c}
            </text>
          </g>
        );
      })}
      {/* needle */}
      {voiced && cents !== null && (
        <g style={{ fill: inTune ? "var(--s-ok)" : "var(--s-amber)", stroke: inTune ? "var(--s-ok)" : "var(--s-amber)" }}>
          <line x1={x} y1={12} x2={x} y2={56} strokeWidth="3" strokeLinecap="round" />
          <circle cx={x} cy={12} r={3.5} stroke="none" />
        </g>
      )}
      {!voiced && (
        <text
          x="150"
          y="80"
          textAnchor="middle"
          fontSize="10"
          fontFamily="monospace"
          style={{ fill: "var(--s-dim)" }}
        >
          sing to move the needle
        </text>
      )}
    </svg>
  );
}

export function PitchMatchGame({
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
  const { latest, listening, error, start, stop } = usePitch();
  const progress = useProgress();
  const octaveAgnostic = difficulty === "easy";
  const tolerance = difficulty === "hard" ? 35 : 50;

  const [target, setTarget] = useState<number | null>(null);
  const [phase, setPhase] = useState<Phase>("listen");
  const { monitoring } = useAudioPrefs();
  /**
   * Whether "Hear again" may sound right now.
   *
   * Replaying the reference is genuinely useful, and on headphones it is
   * harmless. Through speakers it plays the answer into an open mic that has
   * echo cancellation deliberately off, and a synthesised tone is a cleaner,
   * steadier pitch than any voice — so the detector locks onto it, cents reads
   * about zero, and two presses of R clear HOLD_MS while the singer says
   * nothing. It also quietly corrupts honest use: someone who replays to
   * re-listen is credited for the app's own tone.
   */
  const replayAllowed =
    phase !== "listen" && (phase !== "sing" || monitoring === "headphones");
  const [correct, setCorrect] = useState(false);
  const [heldMs, setHeldMs] = useState(0);
  const [leftMs, setLeftMs] = useState(WINDOW_MS);
  const [liveCents, setLiveCents] = useState<number | null>(null);
  const [startedAt, setStartedAt] = useState(() => performance.now());
  const rafRef = useRef(0);
  const phaseRef = useRef<Phase>("listen");
  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  const pickTarget = useCallback(() => {
    const { lo, hi } = singableRegister(progress.range);
    return randInt(lo, hi);
  }, [progress.range]);

  const beginRound = useCallback(
    (t: number) => {
      setPhase("listen");
      setHeldMs(0);
      setLeftMs(WINDOW_MS);
      setLiveCents(null);
      const end = playTone(t, { dur: 1.3, gain: 0.25 });
      window.setTimeout(() => {
        if (phaseRef.current === "listen") setPhase("sing");
      }, end * 1000 + 150);
    },
    [],
  );

  // Kick off the first round once the mic is on. This bootstraps playback (a
  // side effect that must not run during render), so the state it seeds
  // lives here too.
  useEffect(() => {
    if (listening && target === null && !session.done) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- seeds the round that beginRound() below immediately plays audio for
      setStartedAt(performance.now());
      const t = pickTarget();
      setTarget(t);
      beginRound(t);
    }
  }, [listening, target, session.done, pickTarget, beginRound]);

  // The sing-phase loop: accumulate in-tune time inside the window.
  useEffect(() => {
    if (phase !== "sing" || target === null) return;
    let lastT = performance.now();
    // Both the hold and the answer window run on accumulated capped deltas
    // rather than wall clock, so time the tab spent hidden is time neither of
    // them counts. See lib/audio/frame-clock.
    let elapsed = 0;
    let held = 0;
    let settled = false;

    const tick = () => {
      const now = performance.now();
      const dt = frameDelta(now, lastT);
      lastT = now;
      elapsed += dt;

      const f = latest.current;
      let cents: number | null = null;
      // A suspended loop leaves the last frame before the tab was hidden
      // sitting in the ref looking current. Without this check the first frame
      // back re-credits a note that stopped sounding minutes ago — and pairs it
      // with the whole absence as a single delta, which cleared HOLD_MS
      // outright and scored the round correct for someone who sang nothing.
      if (f.freq !== null && isFrameFresh(f.t, now)) {
        cents = centsToTarget(freqToMidiFloat(f.freq), target, octaveAgnostic);
        if (Math.abs(cents) <= tolerance) held += dt;
      }
      setLiveCents(cents);
      setHeldMs(held);
      setLeftMs(Math.max(0, WINDOW_MS - elapsed));

      if (held >= HOLD_MS) {
        settled = true;
        setCorrect(true);
        setPhase("result");
        session.record(true);
        return;
      }
      if (elapsed >= WINDOW_MS) {
        settled = true;
        setCorrect(false);
        setPhase("result");
        session.record(false);
        return;
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (!settled) cancelAnimationFrame(rafRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, target]);

  const next = useCallback(() => {
    if (session.done) return;
    const t = pickTarget();
    setTarget(t);
    beginRound(t);
  }, [session.done, pickTarget, beginRound]);

  // Keyboard: Enter advances from result, R replays the reference.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (session.done || target === null) return;
      if (e.key === "Enter" && phase === "result") next();
      if ((e.key === "r" || e.key === "R") && replayAllowed)
        playTone(target, { dur: 1.1, gain: 0.25 });
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [session.done, target, phase, next, replayAllowed]);

  useEffect(() => () => cancelAnimationFrame(rafRef.current), []);

  // Release the mic while the summary is up.
  useEffect(() => {
    if (session.done && listening) stop();
  }, [session.done, listening, stop]);

  if (session.done) {
    if (onComplete) {
      return (
        <StepDone
          game="pitch-match"
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
          game="pitch-match"
          difficulty={difficulty}
          session={session}
          startedAt={startedAt}
          onReplay={() => {
            session.reset();
            setTarget(null);
            setPhase("listen");
            void start();
          }}
          onExit={onExit}
        />
      </div>
    );
  }

  // The gate lives inside the shell, so the surface a singer sees when the
  // game opens is the one they play on.
  if (!listening) {
    return (
      <GameShell game="pitch-match" difficulty={difficulty} session={session} onExit={onExit}>
        <ShellMicGate
          title="This game listens to you sing"
          description="You'll hear a reference note, then sing it back and hold it steady."
          onEnable={() => void start()}
          error={error}
        />
      </GameShell>
    );
  }

  const targetLabel =
    target !== null
      ? octaveAgnostic
        ? midiToLabel(target).replace(/-?\d+$/, "")
        : midiToLabel(target)
      : "—";

  return (
    <GameShell game="pitch-match" difficulty={difficulty} session={session} onExit={onExit}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="font-mono text-[11px] uppercase tracking-[0.14em] text-[var(--s-dim)]">
            Target note
          </div>
          <div
            className="tabular mt-1 font-mono text-4xl"
            style={{ color: "var(--s-voice)" }}
          >
            {targetLabel}
          </div>
          {octaveAgnostic && (
            <div className="mt-0.5 text-xs text-[var(--s-mut)]">any octave counts</div>
          )}
        </div>
        <ShellButton
          disabled={!replayAllowed}
          title={
            phase === "sing" && !replayAllowed
              ? "Replaying through speakers would play the answer into your mic. Switch to headphones in Audio setup to use this while singing."
              : undefined
          }
          onClick={() => target !== null && playTone(target, { dur: 1.1, gain: 0.25 })}
        >
          Hear again
          <span className="font-mono text-xs text-[var(--s-dim)]" aria-hidden="true">R</span>
        </ShellButton>
      </div>

      <div className="mt-5">
        {phase === "listen" && (
          <p className="animate-recblink text-sm" style={{ color: "var(--s-voice)" }}>
            Listen…
          </p>
        )}
        {phase === "sing" && (
          <p className="text-sm text-[var(--s-mut)]">
            Sing the note and hold it inside the band.
          </p>
        )}
      </div>

      <div className="mt-3 rounded-2xl border border-[var(--s-line)] bg-[var(--s-elev)] p-4">
        <CentsNeedle
          cents={liveCents}
          tolerance={tolerance}
          voiced={phase === "sing" && liveCents !== null}
        />
      </div>

      {phase === "sing" && (
        <div className="mt-4 space-y-2">
          <div className="flex items-center justify-between font-mono text-xs text-[var(--s-mut)]">
            <span>Held {(heldMs / 1000).toFixed(1)}s / {(HOLD_MS / 1000).toFixed(1)}s</span>
            <span className="tabular">{Math.ceil(leftMs / 1000)}s left</span>
          </div>
          <ShellBar value={(heldMs / HOLD_MS) * 100} label="Time held in tune" />
        </div>
      )}

      {phase === "result" && (
        <div className="mt-5 space-y-4">
          <RoundFeedback
            correct={correct}
            message={
              correct
                ? `You locked onto ${targetLabel}.`
                : `The note was ${targetLabel}. Try matching it before the timer runs out.`
            }
          />
          <ShellButton tone="primary" onClick={next}>
            Next round
            <span className="font-mono text-xs opacity-70" aria-hidden="true">Enter</span>
          </ShellButton>
        </div>
      )}
    </GameShell>
  );
}
