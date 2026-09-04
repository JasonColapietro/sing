"use client";

import { useEffect, useRef, useState } from "react";
import { audioNow } from "@/lib/audio/context";
import { clickAt } from "@/lib/audio/synth";
import { logSession, type LogResult } from "@/lib/progress";
import { Button, Card, Pill, ProgressBar, Stat } from "@/components/ui";
import { SessionButton, SessionShell } from "@/components/practice/session-shell";
import { RewardNote } from "./reward";
import { recordBreathBest } from "./store";
import { FARINELLI_START_N, type BreathDrillResult } from "./routines";

type Mode = "setup" | "running" | "done";

const PHASE_LABELS = ["Inhale", "Hold", "Exhale"] as const;
const START_N = FARINELLI_START_N;
const LEAD_SEC = 1.5;
/** Minimum elapsed seconds for an early-ended drill to still be logged. */
const MIN_LOG_SEC = 30;

interface Beat {
  round: number;
  n: number;
  phase: 0 | 1 | 2;
  count: number;
}

/** One beat per second (~60 bpm): rounds of inhale N / hold N / exhale N, N = 4..cap. */
function buildBeats(cap: number): Beat[] {
  const beats: Beat[] = [];
  let round = 1;
  for (let n = START_N; n <= cap; n++, round++) {
    for (let phase = 0; phase < 3; phase++) {
      for (let count = 1; count <= n; count++) {
        beats.push({ round, n, phase: phase as 0 | 1 | 2, count });
      }
    }
  }
  return beats;
}

interface RunFrame {
  beatIdx: number; // -1 during lead-in
  elapsed: number;
}

function ClickGlyph({ on }: { on: boolean }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <path d="M11 5 6 9H3v6h3l5 4z" />
      {on ? (
        <path d="M15.5 8.5a5 5 0 0 1 0 7" />
      ) : (
        <path d="M16 9.5 21 15M21 9.5 16 15" />
      )}
    </svg>
  );
}

export function FarinelliDrill({
  preset,
  autoStart = false,
  onComplete,
  onExit,
  variant = "page",
}: {
  /** Run this top count instead of the singer's own pick. */
  preset?: { cap: number };
  /** Skip the setup card and start on mount — a routine step, not a visit. */
  autoStart?: boolean;
  /** Report what was done instead of drawing a "done" card. */
  onComplete?: (result: BreathDrillResult) => void;
  /** Leaving before anything ran — there is nothing to report. */
  onExit?: () => void;
  variant?: "page" | "session";
}) {
  const [mode, setMode] = useState<Mode>("setup");
  const [cap, setCap] = useState(preset?.cap ?? 8);
  const [sound, setSound] = useState(true);
  const [run, setRun] = useState<RunFrame | null>(null);
  const [summary, setSummary] = useState<{
    sec: number;
    rounds: number;
    topN: number;
    logged: LogResult | null;
  } | null>(null);

  const [beats, setBeats] = useState<Beat[]>([]);
  const rafRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const t0Ref = useRef(0);
  const nextClickRef = useRef(0);
  const soundRef = useRef(true);
  useEffect(() => {
    soundRef.current = sound;
  }, [sound]);

  // Read through a ref inside finish(): the rAF loop closes over `finish` once,
  // and a parent re-rendering with a fresh callback must not need a new loop.
  const completeRef = useRef(onComplete);
  useEffect(() => {
    completeRef.current = onComplete;
  }, [onComplete]);

  const cleanup = () => {
    cancelAnimationFrame(rafRef.current);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
  };
  useEffect(() => cleanup, []);

  const finish = (elapsed: number, allBeats: Beat[], early: boolean) => {
    cleanup();
    const sec = Math.max(0, Math.round(Math.min(elapsed, allBeats.length)));
    const idx = Math.min(allBeats.length - 1, Math.max(0, Math.floor(elapsed) - 1));
    const reached = early ? allBeats[idx] : allBeats[allBeats.length - 1];
    const logged =
      !early || sec >= MIN_LOG_SEC
        ? logSession({ type: "breath", durationSec: sec, detail: "Farinelli drill" })
        : null;
    const topN = reached?.n ?? START_N;
    // A best is earned by finishing the climb, not by starting it.
    if (!early) recordBreathBest({ farinelliCap: topN });
    const done = completeRef.current;
    if (done) {
      done({
        durationSec: sec,
        score: null,
        logged,
        label: `Top count ${topN}`,
      });
      return;
    }
    setSummary({
      sec,
      rounds: reached?.round ?? 0,
      topN,
      logged,
    });
    setMode("done");
  };

  const begin = () => {
    const newBeats = buildBeats(cap);
    setBeats(newBeats);
    t0Ref.current = audioNow() + LEAD_SEC; // audio clock is the master clock
    nextClickRef.current = 0;
    setSummary(null);
    setRun({ beatIdx: -1, elapsed: -LEAD_SEC });
    setMode("running");

    // Lookahead click scheduler — schedules ~0.35s ahead for stable timing.
    timerRef.current = setInterval(() => {
      const horizon = audioNow() + 0.35;
      while (
        nextClickRef.current < newBeats.length &&
        t0Ref.current + nextClickRef.current < horizon
      ) {
        const b = newBeats[nextClickRef.current];
        if (soundRef.current) {
          clickAt(t0Ref.current + nextClickRef.current, b.count === 1);
        }
        nextClickRef.current++;
      }
    }, 100);

    const loop = () => {
      const elapsed = audioNow() - t0Ref.current;
      if (elapsed >= newBeats.length) {
        finish(newBeats.length, newBeats, false);
        return;
      }
      setRun({ beatIdx: elapsed < 0 ? -1 : Math.floor(elapsed), elapsed });
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
  };

  // A routine step starts itself. Guarded by a ref rather than by `mode` so a
  // development double-mount cannot leave two schedulers running.
  const startedRef = useRef(false);
  useEffect(() => {
    if (!autoStart || startedRef.current) return;
    startedRef.current = true;
    begin();
    // Runs once on mount: `begin` closes over the preset-seeded initial cap,
    // which is exactly the drill a routine step is meant to run.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoStart]);

  const totalRounds = cap - START_N + 1;
  const beatIdx = run?.beatIdx ?? -1;
  const beat = beatIdx >= 0 ? beats[beatIdx] : null;
  const progress = beats.length ? (Math.max(0, beatIdx) / beats.length) * 100 : 0;

  /* ---------------------------------------------------------------- *
   * Session — the full-screen dark surface.
   * ---------------------------------------------------------------- */
  if (variant === "session") {
    const closeSession = () => {
      if (mode === "running") finish(run?.elapsed ?? 0, beats, true);
      else onExit?.();
    };

    return (
      <SessionShell
        title="Farinelli drill"
        subtitle={`Top count ${cap}`}
        progress={mode === "running" ? progress : 0}
        onClose={closeSession}
        closeLabel={mode === "running" ? "End drill" : "Leave"}
        topRight={
          beat ? (
            <span className="tabular font-mono text-xs text-[var(--s-dim)]">
              round {beat.round}/{totalRounds}
            </span>
          ) : undefined
        }
        bottom={
          <div className="flex items-center justify-center gap-3">
            <SessionButton
              label={sound ? "Click on" : "Click off"}
              onClick={() => setSound((s) => !s)}
              pressed={sound}
            >
              <ClickGlyph on={sound} />
            </SessionButton>
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
        {mode === "running" ? (
          <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-6 px-4 py-3 text-center">
            {beat ? (
              <div
                className="flex flex-col items-center gap-3"
                role="status"
                aria-live="polite"
                aria-atomic="true"
              >
                <div className="font-display text-[clamp(2.5rem,9vw,4.5rem)] leading-none">
                  {PHASE_LABELS[beat.phase]}
                </div>
                <div className="tabular font-mono text-[clamp(3.5rem,16vw,7rem)] leading-none text-[var(--s-voice)]">
                  {beat.count}
                  <span className="mx-3 text-[0.45em] text-[var(--s-dim)]">/</span>
                  <span className="text-[0.45em] text-[var(--s-mut)]">{beat.n}</span>
                </div>
              </div>
            ) : (
              <div
                className="flex flex-col items-center gap-3"
                role="status"
                aria-live="polite"
              >
                <div className="font-display text-[clamp(2.5rem,9vw,4.5rem)] leading-none">
                  Ready
                </div>
                <p className="max-w-xs text-sm text-[var(--s-mut)]">
                  Exhale fully — the inhale starts on the first count.
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-6 overflow-y-auto px-5 py-6 text-center">
            <p className="max-w-sm text-sm text-[var(--s-mut)]">
              Inhale for four counts, hold for four, exhale for four — then add
              a count each round. Counts tick at one a second. No microphone
              needed.
            </p>
            <div className="w-full max-w-sm text-left">
              <label
                htmlFor="farinelli-cap-session"
                className="font-mono text-[11px] uppercase tracking-[0.14em] text-[var(--s-dim)]"
              >
                Top count — the drill climbs from 4 to here
              </label>
              <div className="mt-2 flex items-center gap-3">
                <input
                  id="farinelli-cap-session"
                  type="range"
                  min={8}
                  max={12}
                  step={1}
                  value={cap}
                  onChange={(e) => setCap(Number(e.target.value))}
                  className="h-11 w-full accent-[var(--s-voice)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--s-amber)]"
                />
                <span className="tabular font-mono text-lg text-[var(--s-voice)]">
                  {cap}
                </span>
              </div>
              <p className="tabular mt-1.5 font-mono text-xs text-[var(--s-dim)]">
                {totalRounds} rounds · about{" "}
                {Math.round((buildBeats(cap).length / 60) * 10) / 10} min
              </p>
            </div>
            <button
              type="button"
              onClick={begin}
              className="min-h-11 rounded-full bg-[var(--s-ok)] px-8 text-base font-medium text-[oklch(0.15_0.02_155)] transition-[filter] hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--s-amber)]"
            >
              Begin
            </button>
          </div>
        )}
      </SessionShell>
    );
  }

  /* ---------------------------------------------------------------- *
   * Page — the drill exactly as the room has always shown it.
   * ---------------------------------------------------------------- */

  // ---- setup ----
  if (mode === "setup") {
    const preview = buildBeats(cap);
    const mins = Math.round((preview.length / 60) * 10) / 10;
    return (
      <Card>
        <h3 className="text-xl">Farinelli drill</h3>
        <p className="mt-2 max-w-lg text-sm text-mut">
          A classic singer&rsquo;s exercise: inhale for four counts, hold for
          four, exhale for four. Each round adds one count, so the breath gets
          longer as you go. Counts tick at one per second. No microphone
          needed.
        </p>
        <div className="mt-5">
          <label
            htmlFor="farinelli-cap"
            className="font-mono text-[11px] uppercase tracking-[0.14em] text-dim"
          >
            Top count — the drill climbs from 4 to here
          </label>
          <div className="mt-2 flex items-center gap-3">
            <input
              id="farinelli-cap"
              type="range"
              min={8}
              max={12}
              step={1}
              value={cap}
              onChange={(e) => setCap(Number(e.target.value))}
              className="w-full max-w-[220px] accent-[var(--color-cool)]"
            />
            <span className="tabular font-mono text-lg text-cool">{cap}</span>
          </div>
          <p className="tabular mt-1.5 font-mono text-xs text-dim">
            {totalRounds} rounds · about {mins} min
          </p>
        </div>
        <div className="mt-4 flex items-center gap-3">
          <Button
            size="sm"
            variant={sound ? "violet" : "outline"}
            aria-pressed={sound}
            onClick={() => setSound((s) => !s)}
          >
            {sound ? "Count clicks on" : "Count clicks off"}
          </Button>
        </div>
        <Button variant="violet" size="lg" className="mt-6" onClick={begin}>
          Begin
        </Button>
      </Card>
    );
  }

  // ---- done ----
  if (mode === "done" && summary) {
    return (
      <Card>
        <div className="flex flex-col items-center gap-4 py-8 text-center">
          <h3 className="text-xl">Drill complete</h3>
          <div className="flex gap-8">
            <Stat
              label="Time"
              value={`${Math.floor(summary.sec / 60)}:${String(summary.sec % 60).padStart(2, "0")}`}
              tone="cool"
            />
            <Stat label="Rounds" value={summary.rounds} />
            <Stat label="Top count" value={summary.topN} tone="violet" />
          </div>
          {summary.logged ? (
            <RewardNote result={summary.logged} />
          ) : (
            <p className="text-xs text-dim">
              Drills under {MIN_LOG_SEC} seconds aren&rsquo;t logged.
            </p>
          )}
          <div className="flex gap-2">
            <Button variant="violet" onClick={begin}>
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
  return (
    <Card>
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-xl">Farinelli drill</h3>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="ghost"
            aria-pressed={sound}
            onClick={() => setSound((s) => !s)}
          >
            {sound ? "Clicks on" : "Clicks off"}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => finish(run?.elapsed ?? 0, beats, true)}
          >
            Stop
          </Button>
        </div>
      </div>

      <div className="mt-6 flex flex-col items-center gap-4">
        {beat ? (
          <>
            <div
              className="flex flex-col items-center gap-1"
              role="status"
              aria-live="polite"
              aria-atomic="true"
            >
              <div className="text-2xl text-ink">
                {PHASE_LABELS[beat.phase]}&hellip;
              </div>
              <div className="tabular font-mono text-6xl text-cool sm:text-7xl">
                {beat.count}
                <span className="mx-2 text-3xl text-dim">/</span>
                <span className="text-3xl text-mut">{beat.n}</span>
              </div>
            </div>
            <Pill tone="cool">
              round {beat.round} of {totalRounds} · {beat.n} counts
            </Pill>
          </>
        ) : (
          <div
            className="flex flex-col items-center gap-1 py-6"
            role="status"
            aria-live="polite"
          >
            <div className="text-2xl text-ink">Ready&hellip;</div>
            <p className="text-sm text-mut">Exhale fully — inhale starts on the first count.</p>
          </div>
        )}

        <div className="w-full max-w-sm">
          <ProgressBar value={progress} tone="cool" />
        </div>
      </div>
    </Card>
  );
}
