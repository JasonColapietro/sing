"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Button, Card, ProgressBar } from "@/components/ui";
import { usePitch } from "@/lib/audio/use-pitch";
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
  MicGate,
  RoundFeedback,
  SummaryView,
  useEarSession,
} from "./session";

const HOLD_MS = 1500;
const WINDOW_MS = 8000;

type Phase = "listen" | "sing" | "result";

/** Live tuner needle, -60..+60 cents. */
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
        fill={inTune ? "#7fd99a" : "#1f1a13"}
        opacity={inTune ? 0.18 : 1}
        stroke={inTune ? "#7fd99a" : "#2b2519"}
      />
      {/* scale */}
      <line x1="20" y1="35" x2="280" y2="35" stroke="#2b2519" strokeWidth="2" />
      {[-50, -25, 0, 25, 50].map((c) => {
        const tx = 150 + (c / 60) * 130;
        return (
          <g key={c}>
            <line x1={tx} y1={c === 0 ? 22 : 28} x2={tx} y2={c === 0 ? 48 : 42} stroke={c === 0 ? "#a69d8c" : "#3a3222"} strokeWidth={c === 0 ? 2 : 1.5} />
            <text x={tx} y={64} textAnchor="middle" fontSize="9" fill="#6f685a" fontFamily="monospace">
              {c > 0 ? `+${c}` : c}
            </text>
          </g>
        );
      })}
      {/* needle */}
      {voiced && cents !== null && (
        <g>
          <line
            x1={x}
            y1={12}
            x2={x}
            y2={56}
            stroke={inTune ? "#7fd99a" : "#f5b03e"}
            strokeWidth="3"
            strokeLinecap="round"
          />
          <circle cx={x} cy={12} r={3.5} fill={inTune ? "#7fd99a" : "#f5b03e"} />
        </g>
      )}
      {!voiced && (
        <text x="150" y="80" textAnchor="middle" fontSize="10" fill="#6f685a" fontFamily="monospace">
          sing to move the needle
        </text>
      )}
    </svg>
  );
}

export function PitchMatchGame({
  difficulty,
  onExit,
}: {
  difficulty: Difficulty;
  onExit: () => void;
}) {
  const session = useEarSession();
  const { latest, listening, error, start, stop } = usePitch();
  const progress = useProgress();
  const octaveAgnostic = difficulty === "easy";
  const tolerance = difficulty === "hard" ? 35 : 50;

  const [target, setTarget] = useState<number | null>(null);
  const [phase, setPhase] = useState<Phase>("listen");
  const [correct, setCorrect] = useState(false);
  const [heldMs, setHeldMs] = useState(0);
  const [leftMs, setLeftMs] = useState(WINDOW_MS);
  const [liveCents, setLiveCents] = useState<number | null>(null);
  const startedAt = useRef(performance.now());
  const rafRef = useRef(0);
  const phaseRef = useRef<Phase>("listen");
  phaseRef.current = phase;

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

  // Kick off the first round once the mic is on.
  useEffect(() => {
    if (listening && target === null && !session.done) {
      startedAt.current = performance.now();
      const t = pickTarget();
      setTarget(t);
      beginRound(t);
    }
  }, [listening, target, session.done, pickTarget, beginRound]);

  // The sing-phase loop: accumulate in-tune time inside the window.
  useEffect(() => {
    if (phase !== "sing" || target === null) return;
    const windowStart = performance.now();
    let lastT = windowStart;
    let held = 0;
    let settled = false;

    const tick = () => {
      const now = performance.now();
      const dt = now - lastT;
      lastT = now;

      const f = latest.current;
      let cents: number | null = null;
      if (f.freq !== null) {
        cents = centsToTarget(freqToMidiFloat(f.freq), target, octaveAgnostic);
        if (Math.abs(cents) <= tolerance) held += dt;
      }
      setLiveCents(cents);
      setHeldMs(held);
      setLeftMs(Math.max(0, WINDOW_MS - (now - windowStart)));

      if (held >= HOLD_MS) {
        settled = true;
        setCorrect(true);
        setPhase("result");
        session.record(true);
        return;
      }
      if (now - windowStart >= WINDOW_MS) {
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
      if ((e.key === "r" || e.key === "R") && phase !== "listen")
        playTone(target, { dur: 1.1, gain: 0.25 });
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [session.done, target, phase, next]);

  useEffect(() => () => cancelAnimationFrame(rafRef.current), []);

  // Release the mic while the summary is up.
  useEffect(() => {
    if (session.done && listening) stop();
  }, [session.done, listening, stop]);

  if (session.done) {
    return (
      <div className="mx-auto max-w-2xl">
        <SummaryView
          game="pitch-match"
          difficulty={difficulty}
          session={session}
          startedAt={startedAt.current}
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

  if (!listening) {
    return (
      <div className="mx-auto max-w-2xl">
        <MicGate
          error={error}
          onEnable={() => void start()}
          trains="You'll hear a reference note, then sing it back and hold it steady."
        />
      </div>
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
      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="font-mono text-[11px] uppercase tracking-[0.14em] text-dim">
              Target note
            </div>
            <div className="tabular mt-1 font-mono text-3xl text-amber">
              {targetLabel}
            </div>
            {octaveAgnostic && (
              <div className="mt-0.5 text-xs text-mut">any octave counts</div>
            )}
          </div>
          <Button
            variant="outline"
            size="sm"
            disabled={phase === "listen"}
            onClick={() => target !== null && playTone(target, { dur: 1.1, gain: 0.25 })}
          >
            Hear again
            <span className="font-mono text-xs text-dim" aria-hidden="true">R</span>
          </Button>
        </div>

        <div className="mt-5">
          {phase === "listen" && (
            <p className="text-sm text-amber animate-recblink">Listen…</p>
          )}
          {phase === "sing" && (
            <p className="text-sm text-mut">
              Sing the note and hold it inside the band.
            </p>
          )}
        </div>

        <div className="mt-3 rounded-2xl border border-line bg-bg p-4">
          <CentsNeedle
            cents={liveCents}
            tolerance={tolerance}
            voiced={phase === "sing" && liveCents !== null}
          />
        </div>

        {phase === "sing" && (
          <div className="mt-4 space-y-2">
            <div className="flex items-center justify-between font-mono text-xs text-mut">
              <span>Held {(heldMs / 1000).toFixed(1)}s / {(HOLD_MS / 1000).toFixed(1)}s</span>
              <span className="tabular">{Math.ceil(leftMs / 1000)}s left</span>
            </div>
            <ProgressBar value={(heldMs / HOLD_MS) * 100} tone="ok" />
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
            <Button variant="amber" onClick={next}>
              Next round
              <span className="font-mono text-xs opacity-70" aria-hidden="true">Enter</span>
            </Button>
          </div>
        )}
      </Card>
    </GameShell>
  );
}
