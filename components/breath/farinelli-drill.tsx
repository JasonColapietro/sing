"use client";

import { useEffect, useRef, useState } from "react";
import { audioNow } from "@/lib/audio/context";
import { clickAt } from "@/lib/audio/synth";
import { logSession, type LogResult } from "@/lib/progress";
import { Button, Card, Pill, ProgressBar, Stat } from "@/components/ui";
import { RewardNote } from "./reward";

type Mode = "setup" | "running" | "done";

const PHASE_LABELS = ["Inhale", "Hold", "Exhale"] as const;
const START_N = 4;
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

export function FarinelliDrill() {
  const [mode, setMode] = useState<Mode>("setup");
  const [cap, setCap] = useState(8);
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
    setSummary({
      sec,
      rounds: reached?.round ?? 0,
      topN: reached?.n ?? START_N,
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

  const totalRounds = cap - START_N + 1;

  // ---- setup ----
  if (mode === "setup") {
    const beats = buildBeats(cap);
    const mins = Math.round(beats.length / 60 * 10) / 10;
    return (
      <Card>
        <h3 className="font-display text-xl">Farinelli drill</h3>
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
            variant={sound ? "amber" : "outline"}
            aria-pressed={sound}
            onClick={() => setSound((s) => !s)}
          >
            {sound ? "Count clicks on" : "Count clicks off"}
          </Button>
        </div>
        <Button variant="amber" size="lg" className="mt-6" onClick={begin}>
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
          <h3 className="font-display text-xl">Drill complete</h3>
          <div className="flex gap-8">
            <Stat
              label="Time"
              value={`${Math.floor(summary.sec / 60)}:${String(summary.sec % 60).padStart(2, "0")}`}
              tone="cool"
            />
            <Stat label="Rounds" value={summary.rounds} />
            <Stat label="Top count" value={summary.topN} tone="amber" />
          </div>
          {summary.logged ? (
            <RewardNote result={summary.logged} />
          ) : (
            <p className="text-xs text-dim">
              Drills under {MIN_LOG_SEC} seconds aren&rsquo;t logged.
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
  const beatIdx = run?.beatIdx ?? -1;
  const beat = beatIdx >= 0 ? beats[beatIdx] : null;
  const progress = beats.length ? (Math.max(0, beatIdx) / beats.length) * 100 : 0;

  return (
    <Card>
      <div className="flex items-center justify-between gap-2">
        <h3 className="font-display text-xl">Farinelli drill</h3>
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
              <div className="font-display text-2xl text-ink">
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
            <div className="font-display text-2xl text-ink">Ready&hellip;</div>
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
