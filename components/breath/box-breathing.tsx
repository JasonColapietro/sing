"use client";

import { useEffect, useRef, useState } from "react";
import { logSession, type LogResult } from "@/lib/progress";
import { Button, Card, Pill, ProgressBar, Stat } from "@/components/ui";
import { RewardNote } from "./reward";

type Mode = "setup" | "running" | "done";

const PHASES = ["Inhale", "Hold", "Exhale", "Hold"] as const;
const LENGTHS = [1, 3, 5] as const;

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

interface RunFrame {
  phaseIdx: number;
  secondsLeft: number;
  p: number;
  round: number;
  elapsed: number;
}

export function BoxBreathing() {
  const [mode, setMode] = useState<Mode>("setup");
  const [side, setSide] = useState(4);
  const [minutes, setMinutes] = useState<(typeof LENGTHS)[number]>(3);
  const [run, setRun] = useState<RunFrame | null>(null);
  const [runTargetSec, setRunTargetSec] = useState(0);
  const [summary, setSummary] = useState<{
    sec: number;
    rounds: number;
    logged: LogResult | null;
  } | null>(null);

  const rafRef = useRef(0);
  const startRef = useRef(0);
  const cfgRef = useRef({ side: 4, targetSec: 180 });

  useEffect(() => () => cancelAnimationFrame(rafRef.current), []);

  const finish = (elapsed: number, rounds: number, early: boolean) => {
    cancelAnimationFrame(rafRef.current);
    const sec = Math.round(elapsed);
    const logged =
      !early || sec >= MIN_LOG_SEC
        ? logSession({ type: "breath", durationSec: sec, detail: "Box breathing" })
        : null;
    setSummary({ sec, rounds, logged });
    setMode("done");
  };

  const begin = () => {
    const cycle = side * 4;
    // finish on a completed cycle at or after the chosen length
    const targetSec = Math.ceil((minutes * 60) / cycle) * cycle;
    cfgRef.current = { side, targetSec };
    startRef.current = performance.now();
    setRunTargetSec(targetSec);
    setSummary(null);
    setMode("running");

    const loop = () => {
      const { side: s, targetSec: target } = cfgRef.current;
      const cycleSec = s * 4;
      const elapsed = (performance.now() - startRef.current) / 1000;
      if (elapsed >= target) {
        finish(target, Math.round(target / cycleSec), false);
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
    if (!run) return;
    const cycleSec = cfgRef.current.side * 4;
    finish(run.elapsed, Math.floor(run.elapsed / cycleSec), true);
  };

  // ---- setup ----
  if (mode === "setup") {
    return (
      <Card>
        <div className="grid gap-6 sm:grid-cols-2">
          <div>
            <h3 className="font-display text-xl">Box breathing</h3>
            <p className="mt-2 max-w-sm text-sm text-mut">
              Breathe around the square: inhale, hold, exhale, hold — equal
              counts on every side. A calm way to settle nerves before you
              sing. No microphone needed.
            </p>
            <div className="mt-5">
              <label
                htmlFor="box-side"
                className="font-mono text-[11px] uppercase tracking-[0.14em] text-dim"
              >
                Seconds per side
              </label>
              <div className="mt-2 flex items-center gap-3">
                <input
                  id="box-side"
                  type="range"
                  min={3}
                  max={8}
                  step={1}
                  value={side}
                  onChange={(e) => setSide(Number(e.target.value))}
                  className="w-full max-w-[220px] accent-[var(--color-cool)]"
                />
                <span className="tabular font-mono text-lg text-cool">
                  {side}s
                </span>
              </div>
            </div>
            <div className="mt-5">
              <div className="font-mono text-[11px] uppercase tracking-[0.14em] text-dim">
                Session length
              </div>
              <div className="mt-2 flex gap-2">
                {LENGTHS.map((m) => (
                  <Button
                    key={m}
                    size="sm"
                    variant={minutes === m ? "amber" : "outline"}
                    aria-pressed={minutes === m}
                    onClick={() => setMinutes(m)}
                  >
                    {m} min
                  </Button>
                ))}
              </div>
            </div>
            <Button variant="amber" size="lg" className="mt-6" onClick={begin}>
              Begin
            </Button>
          </div>
          <div className="flex items-center justify-center">
            <svg
              viewBox={`0 0 ${VB} ${VB}`}
              className="w-full max-w-[220px]"
              aria-hidden="true"
            >
              <rect
                x={X0}
                y={Y0}
                width={X1 - X0}
                height={Y1 - Y0}
                rx={14}
                fill="none"
                stroke="var(--color-line2)"
                strokeWidth={2}
              />
              <circle cx={VB / 2} cy={VB / 2} r={44} fill="var(--color-panel2)" />
              <circle cx={X0} cy={Y1} r={7} fill="var(--color-cool)" />
            </svg>
          </div>
        </div>
      </Card>
    );
  }

  // ---- done ----
  if (mode === "done" && summary) {
    return (
      <Card>
        <div className="flex flex-col items-center gap-4 py-8 text-center">
          <h3 className="font-display text-xl">Session complete</h3>
          <div className="flex gap-8">
            <Stat
              label="Time"
              value={`${Math.floor(summary.sec / 60)}:${String(summary.sec % 60).padStart(2, "0")}`}
              tone="cool"
            />
            <Stat label="Rounds" value={summary.rounds} />
          </div>
          {summary.logged ? (
            <RewardNote result={summary.logged} />
          ) : (
            <p className="text-xs text-dim">
              Sessions under {MIN_LOG_SEC} seconds aren&rsquo;t logged.
            </p>
          )}
          <div className="flex gap-2">
            <Button variant="amber" onClick={begin}>
              Go again
            </Button>
            <Button variant="outline" onClick={() => setMode("setup")}>
              Change settings
            </Button>
          </div>
        </div>
      </Card>
    );
  }

  // ---- running ----
  const phaseIdx = run?.phaseIdx ?? 0;
  const p = run?.p ?? 0;
  const dot = dotPos(phaseIdx, p);
  const amt = breathAmount(phaseIdx, p);
  const r = 34 + 28 * amt;
  const target = runTargetSec;
  const elapsed = run?.elapsed ?? 0;

  return (
    <Card>
      <div className="flex items-center justify-between gap-2">
        <h3 className="font-display text-xl">Box breathing</h3>
        <div className="flex items-center gap-2">
          <Pill tone="cool">round {run?.round ?? 1}</Pill>
          <Button size="sm" variant="outline" onClick={endEarly}>
            End session
          </Button>
        </div>
      </div>

      <div className="mt-4 flex flex-col items-center gap-4">
        <svg
          viewBox={`0 0 ${VB} ${VB}`}
          className="w-full max-w-[300px]"
          aria-hidden="true"
        >
          <rect
            x={X0}
            y={Y0}
            width={X1 - X0}
            height={Y1 - Y0}
            rx={14}
            fill="none"
            stroke="var(--color-line2)"
            strokeWidth={2}
          />
          <circle
            cx={VB / 2}
            cy={VB / 2}
            r={r}
            fill="var(--color-panel2)"
            stroke="var(--color-cool)"
            strokeOpacity={0.35}
            strokeWidth={1.5}
          />
          <circle cx={dot.x} cy={dot.y} r={7} fill="var(--color-cool)" />
        </svg>

        <div
          className="flex flex-col items-center gap-1"
          role="status"
          aria-live="polite"
          aria-atomic="true"
        >
          <div className="font-display text-2xl text-ink">
            {PHASES[phaseIdx]}&hellip;
          </div>
          <div className="tabular font-mono text-5xl text-cool">
            {run?.secondsLeft ?? side}
          </div>
        </div>

        <div className="w-full max-w-sm">
          <ProgressBar value={(elapsed / target) * 100} tone="cool" />
          <div className="tabular mt-1.5 flex justify-between font-mono text-xs text-dim">
            <span>
              {Math.floor(elapsed / 60)}:{String(Math.floor(elapsed) % 60).padStart(2, "0")}
            </span>
            <span>
              {Math.floor(target / 60)}:{String(target % 60).padStart(2, "0")}
            </span>
          </div>
        </div>
      </div>
    </Card>
  );
}
