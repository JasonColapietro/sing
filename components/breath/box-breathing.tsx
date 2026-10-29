"use client";

import { useEffect, useRef, useState } from "react";
import { logSession } from "@/lib/progress";
import { SessionButton, SessionShell } from "@/components/practice/session-shell";
import { useStepCloseLabel } from "@/components/practice/step-intro";
import { recordBreathBest } from "./store";
import { boxSeconds, type BreathDrillResult } from "./routines";

type Mode = "setup" | "running";

const PHASES = ["Inhale", "Hold", "Exhale", "Hold"] as const;
const LENGTHS = [1, 3, 5] as const;
type Minutes = (typeof LENGTHS)[number];

/** Minimum elapsed seconds for an early-ended session to still be logged. */
const MIN_LOG_SEC = 30;

// SVG geometry
const VB = 260;
const X0 = 40;
const Y0 = 40;
const X1 = 220;
const Y1 = 220;

/** Dot position along the square edge for a phase (0..3) and progress 0..1. */
function dotPos(phaseIdx: number, p: number): { x: number; y: number } {
  switch (phaseIdx) {
    case 0: // inhale — up the left edge
      return { x: X0, y: Y1 - (Y1 - Y0) * p };
    case 1: // hold — across the top
      return { x: X0 + (X1 - X0) * p, y: Y0 };
    case 2: // exhale — down the right edge
      return { x: X1, y: Y0 + (Y1 - Y0) * p };
    default: // hold — back along the bottom
      return { x: X1 - (X1 - X0) * p, y: Y1 };
  }
}

/** Center-circle fullness 0..1 for a phase and progress. */
function breathAmount(phaseIdx: number, p: number): number {
  switch (phaseIdx) {
    case 0:
      return p;
    case 1:
      return 1;
    case 2:
      return 1 - p;
    default:
      return 0;
  }
}

function mmss(sec: number): string {
  const s = Math.max(0, Math.floor(sec));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

interface RunFrame {
  phaseIdx: number;
  secondsLeft: number;
  p: number;
  round: number;
  elapsed: number;
}

/**
 * The square, the breathing circle and the travelling dot. The circle's radius
 * follows the animation frame, not a CSS transition: its growth is the cue to
 * inhale, so reduced motion keeps the pace steady rather than freezing it.
 */
function BoxFigure({
  phaseIdx,
  p,
  className,
  line,
  fill,
  dot,
}: {
  phaseIdx: number;
  p: number;
  className: string;
  line: string;
  fill: string;
  dot: string;
}) {
  const pos = dotPos(phaseIdx, p);
  const r = 34 + 28 * breathAmount(phaseIdx, p);
  return (
    <svg viewBox={`0 0 ${VB} ${VB}`} className={className} aria-hidden="true">
      <rect
        x={X0}
        y={Y0}
        width={X1 - X0}
        height={Y1 - Y0}
        rx={14}
        fill="none"
        stroke={line}
        strokeWidth={2}
      />
      <circle
        cx={VB / 2}
        cy={VB / 2}
        r={r}
        fill={fill}
        stroke={dot}
        strokeOpacity={0.35}
        strokeWidth={1.5}
      />
      <circle cx={pos.x} cy={pos.y} r={7} fill={dot} />
    </svg>
  );
}

export function BoxBreathing({
  preset,
  autoStart = false,
  onComplete,
  onExit,
}: {
  /** Run these settings instead of the singer's own picks. */
  preset?: { side: number; minutes: Minutes };
  /** Skip the setup card and start on mount — a routine step, not a visit. */
  autoStart?: boolean;
  /** What was done; the runner and the path both put a results screen after it. */
  onComplete: (result: BreathDrillResult) => void;
  /** Leaving before anything ran — there is nothing to report. */
  onExit: () => void;
}) {
  const closeLabel = useStepCloseLabel("Exit drill");
  const [mode, setMode] = useState<Mode>("setup");
  const [side, setSide] = useState(preset?.side ?? 4);
  const [minutes, setMinutes] = useState<Minutes>(preset?.minutes ?? 3);
  const [run, setRun] = useState<RunFrame | null>(null);
  const [runTargetSec, setRunTargetSec] = useState(0);

  const rafRef = useRef(0);
  const startRef = useRef(0);
  const cfgRef = useRef<{ side: number; minutes: Minutes; targetSec: number }>({
    side: 4,
    minutes: 3,
    targetSec: 180,
  });

  useEffect(() => () => cancelAnimationFrame(rafRef.current), []);

  // Read through a ref inside finish(): the rAF loop closes over `finish` once,
  // and a parent re-rendering with a fresh callback must not need a new loop.
  const completeRef = useRef(onComplete);
  useEffect(() => {
    completeRef.current = onComplete;
  }, [onComplete]);

  const finish = (elapsed: number, early: boolean) => {
    cancelAnimationFrame(rafRef.current);
    const sec = Math.round(elapsed);
    const logged =
      !early || sec >= MIN_LOG_SEC
        ? logSession({ type: "breath", durationSec: sec, detail: "Box breathing" })
        : null;
    // A best is earned by finishing: a five-minute run abandoned at ninety
    // seconds is not a five-minute run.
    if (!early) recordBreathBest({ boxMinutes: cfgRef.current.minutes });
    completeRef.current({
      durationSec: sec,
      score: null,
      logged,
      // What was done, not what was configured: an early End is not the full session.
      label: `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, "0")} · ${cfgRef.current.side}s sides`,
    });
  };

  const begin = () => {
    // finish on a completed cycle at or after the chosen length
    const targetSec = boxSeconds({ side, minutes });
    cfgRef.current = { side, minutes, targetSec };
    startRef.current = performance.now();
    setRunTargetSec(targetSec);
    setRun({ phaseIdx: 0, secondsLeft: side, p: 0, round: 1, elapsed: 0 });
    setMode("running");

    const loop = () => {
      const { side: s, targetSec: target } = cfgRef.current;
      const cycleSec = s * 4;
      const elapsed = (performance.now() - startRef.current) / 1000;
      if (elapsed >= target) {
        finish(target, false);
        return;
      }
      const inCycle = elapsed % cycleSec;
      const phaseIdx = Math.min(3, Math.floor(inCycle / s));
      const inPhase = inCycle - phaseIdx * s;
      setRun({
        phaseIdx,
        secondsLeft: Math.max(1, Math.ceil(s - inPhase)),
        p: Math.min(1, inPhase / s),
        round: Math.floor(elapsed / cycleSec) + 1,
        elapsed,
      });
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
  };

  const endEarly = () => {
    if (run) finish(run.elapsed, true);
  };

  // A routine step starts itself; start and teardown share one effect so dev double-mount restarts it.
  useEffect(() => {
    if (!autoStart) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- begin() seeds the run frame the loop it starts will overwrite next tick
    begin();
    return () => cancelAnimationFrame(rafRef.current);
    // Runs once on mount: `begin` closes over the preset-seeded initial state,
    // which is exactly the state a routine step is meant to run.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoStart]);

  const phaseIdx = run?.phaseIdx ?? 0;
  const p = run?.p ?? 0;
  const elapsed = run?.elapsed ?? 0;
  // Before begin() has run, the length the settings ask for, so a routine's
  // first frame already reads the run's length.
  const target = runTargetSec || boxSeconds({ side, minutes });

  const closeSession = () => {
    if (mode === "running") endEarly();
    else onExit();
  };
  // A routine's step (autoStart) is drawn as its run from the first render, so the figure does not jump when begin() runs.
  const running = mode === "running" || (autoStart && mode === "setup");

  return (
    <SessionShell
      title="Box breathing"
      subtitle={`${minutes} min · ${side}s sides`}
      progress={running && target > 0 ? (elapsed / target) * 100 : 0}
      onClose={closeSession}
      closeLabel={closeLabel}
      topRight={
        running ? (
          <span className="tabular font-mono text-xs text-[var(--s-dim)]">
            round {run?.round ?? 1}
          </span>
        ) : undefined
      }
      bottom={
        <div className="flex items-center justify-center">
          <SessionButton label="End" onClick={closeSession} tone="danger">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="currentColor"
              aria-hidden="true"
            >
              <rect x="6" y="6" width="12" height="12" rx="2" />
            </svg>
          </SessionButton>
        </div>
      }
    >
      {running ? (
        <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-4 px-4 py-3">
          <BoxFigure
            phaseIdx={phaseIdx}
            p={p}
            className="w-full max-w-[min(44vh,340px)]"
            line="var(--s-line2)"
            fill="var(--s-elev)"
            dot="var(--s-voice)"
          />
          <div
            className="flex flex-col items-center gap-1"
            role="status"
            aria-live="polite"
            aria-atomic="true"
          >
            <div className="font-display text-[clamp(2.25rem,7vw,3.75rem)] leading-none">
              {PHASES[phaseIdx]}
            </div>
            <div className="tabular font-mono text-[clamp(1.75rem,5vw,2.5rem)] leading-none text-[var(--s-voice)]">
              {run?.secondsLeft ?? side}
            </div>
          </div>
          <div className="tabular font-mono text-xs text-[var(--s-dim)]">
            {mmss(elapsed)} / {mmss(target)}
          </div>
        </div>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-6 overflow-y-auto px-5 py-6 text-center">
          <BoxFigure
            phaseIdx={0}
            p={0}
            className="w-full max-w-[min(26vh,190px)]"
            line="var(--s-line2)"
            fill="var(--s-elev)"
            dot="var(--s-voice)"
          />
          <p className="max-w-sm text-sm text-[var(--s-mut)]">
            Breathe around the square: inhale, hold, exhale, hold, with equal
            counts on every side. No microphone needed.
          </p>
          <div className="w-full max-w-sm space-y-5 text-left">
            <div>
              <label
                htmlFor="box-side-session"
                className="font-mono text-[11px] uppercase tracking-[0.14em] text-[var(--s-dim)]"
              >
                Seconds per side
              </label>
              <div className="mt-2 flex items-center gap-3">
                <input
                  id="box-side-session"
                  type="range"
                  min={3}
                  max={8}
                  step={1}
                  value={side}
                  onChange={(e) => setSide(Number(e.target.value))}
                  className="h-11 w-full accent-[var(--s-voice)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--s-amber)]"
                />
                <span className="tabular font-mono text-lg text-[var(--s-voice)]">
                  {side}s
                </span>
              </div>
            </div>
            <div>
              <div className="font-mono text-[11px] uppercase tracking-[0.14em] text-[var(--s-dim)]">
                Session length
              </div>
              <div className="mt-2 flex gap-2">
                {LENGTHS.map((m) => (
                  <button
                    key={m}
                    type="button"
                    aria-pressed={minutes === m}
                    onClick={() => setMinutes(m)}
                    className={`min-h-11 flex-1 rounded-xl border px-3 text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--s-amber)] ${
                      minutes === m
                        ? "border-transparent bg-[var(--s-ok)] text-[oklch(0.15_0.02_155)]"
                        : "border-[var(--s-line2)] text-[var(--s-mut)] hover:bg-[var(--s-over)] hover:text-[var(--s-ink)]"
                    }`}
                  >
                    {m} min
                  </button>
                ))}
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={begin}
            className="min-h-11 rounded-full bg-[var(--s-ok)] px-8 text-base font-medium text-[oklch(0.15_0.02_155)] transition-[filter] hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--s-amber)]"
          >
            Start
          </button>
        </div>
      )}
    </SessionShell>
  );
}
