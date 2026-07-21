"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { buildSegments, computeRootLadder, type WarmupExercise } from "./exercises";
import type { UsePitchResult } from "@/lib/audio/use-pitch";
import { centsOff, freqToMidiFloat, midiToLabel } from "@/lib/audio/notes";
import { logSession, type VocalRange } from "@/lib/progress";
import { Button, Card, Pill, ProgressBar, SectionLabel } from "@/components/ui";
import { IconArrowLeft, IconMinus, IconPlay, IconPlus, IconSkip, IconStop } from "./icons";
import { NoteLaneCanvas, type TracePoint } from "./note-lane-canvas";
import {
  bestRep,
  playGuide,
  repAvgScore,
  segmentIndexAt,
  singWindowSec,
  targetMidiAt,
  totalTargetDur,
  type RepResult,
  type SessionSummaryData,
} from "./lib";

const TEMPOS = [0.75, 1, 1.25] as const;
const TOLERANCE_CENTS = 50;
const REP_RESULT_PAUSE_MS = 1100;
const MIN_VOLUME = 0.006;

type Phase = "listen" | "sing" | "rep-result";

export function ExercisePlayer({
  ex,
  pitch,
  range,
  onFinish,
  onExit,
}: {
  ex: WarmupExercise;
  pitch: UsePitchResult;
  range: VocalRange;
  onFinish: (summary: SessionSummaryData) => void;
  onExit: () => void;
}) {
  const roots = useMemo(
    () => computeRootLadder(ex, range.lowMidi, range.highMidi),
    [ex, range.lowMidi, range.highMidi],
  );

  const [repIndex, setRepIndex] = useState(0);
  const [tempo, setTempo] = useState<(typeof TEMPOS)[number]>(1);
  const [transpose, setTranspose] = useState(0);
  const [phase, setPhase] = useState<Phase>("listen");
  const [results, setResults] = useState<RepResult[]>([]);
  const [elapsedSec, setElapsedSec] = useState(0);
  const [hitSec, setHitSec] = useState<number[]>([]);
  const [trace, setTrace] = useState<TracePoint[]>([]);
  const [liveMidiFloat, setLiveMidiFloat] = useState<number | null>(null);

  const currentRoot = Math.max(24, Math.min(96, roots[repIndex] + transpose));
  const { segs, totalSec } = useMemo(
    () => buildSegments(ex, currentRoot, tempo),
    [ex, currentRoot, tempo],
  );
  const singWindow = singWindowSec(totalSec);
  const lastResult = results[results.length - 1] ?? null;

  const hitAccumRef = useRef<number[]>([]);
  const centsSumRef = useRef(0);
  const centsCountRef = useRef(0);
  const traceRef = useRef<TracePoint[]>([]);
  const sessionStartRef = useRef(performance.now());
  const resultsRef = useRef<RepResult[]>([]);
  resultsRef.current = results;

  function finalize(finalResults: RepResult[]) {
    const avgScore = repAvgScore(finalResults);
    const best = bestRep(finalResults);
    const durationSec = Math.max(
      1,
      Math.round((performance.now() - sessionStartRef.current) / 1000),
    );
    const log = logSession({
      type: "warmup",
      durationSec,
      score: avgScore,
      detail: ex.title,
    });
    onFinish({
      ex,
      results: finalResults,
      avgScore,
      best,
      xpGained: log.xpGained,
      newAchievements: log.newAchievements,
    });
  }

  // Listen: auto-play the guide melody, animate the cursor, then flip to Sing.
  useEffect(() => {
    if (phase !== "listen") return;
    const { segs: guideSegs, totalSec: t } = playGuide(ex, currentRoot, tempo);
    const start = performance.now();
    setElapsedSec(0);
    setHitSec(guideSegs.map(() => 0));
    setTrace([]);
    setLiveMidiFloat(null);

    let raf = 0;
    const tick = () => {
      const el = (performance.now() - start) / 1000;
      setElapsedSec(Math.min(t, el));
      if (el < t) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    const timer = setTimeout(() => setPhase("sing"), Math.max(50, t * 1000));
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, repIndex, ex, currentRoot, tempo]);

  // Sing: score the live pitch against the target melody in real time.
  useEffect(() => {
    if (phase !== "sing") return;
    hitAccumRef.current = segs.map(() => 0);
    centsSumRef.current = 0;
    centsCountRef.current = 0;
    traceRef.current = [];
    setHitSec(hitAccumRef.current);
    setTrace([]);
    setLiveMidiFloat(null);

    const start = performance.now();
    let last = start;
    let raf = 0;
    const tick = () => {
      const now = performance.now();
      const dt = Math.min(0.12, (now - last) / 1000);
      last = now;
      const elapsed = (now - start) / 1000;
      setElapsedSec(elapsed);

      const frame = pitch.latest.current;
      const voiced = frame.freq !== null && frame.volume >= MIN_VOLUME;
      const midiFloat = voiced && frame.freq !== null ? freqToMidiFloat(frame.freq) : null;
      setLiveMidiFloat(midiFloat);

      if (elapsed <= totalSec) {
        const target = targetMidiAt(segs, elapsed);
        if (target !== null && voiced && frame.freq !== null) {
          const cents = centsOff(frame.freq, target);
          centsSumRef.current += Math.abs(cents);
          centsCountRef.current += 1;
          if (Math.abs(cents) <= TOLERANCE_CENTS) {
            const idx = segmentIndexAt(segs, elapsed);
            if (idx >= 0) {
              hitAccumRef.current[idx] = (hitAccumRef.current[idx] ?? 0) + dt;
            }
          }
        }
        traceRef.current = [...traceRef.current, { t: elapsed, midi: midiFloat }].slice(-260);
        setHitSec([...hitAccumRef.current]);
        setTrace(traceRef.current);
      }

      if (elapsed < singWindow) {
        raf = requestAnimationFrame(tick);
      } else {
        const denom = totalTargetDur(segs);
        const hitTotal = hitAccumRef.current.reduce((a, b) => a + b, 0);
        const score =
          denom > 0 ? Math.round(Math.min(100, (hitTotal / denom) * 100)) : 0;
        const avgCentsErr =
          centsCountRef.current > 0
            ? Math.round(centsSumRef.current / centsCountRef.current)
            : 0;
        const result: RepResult = { root: currentRoot, score, avgCentsErr, skipped: false };
        setResults((prev) => [...prev, result]);
        setPhase("rep-result");
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, repIndex]);

  // Rep result: brief pause, then advance the ladder or finish the session.
  useEffect(() => {
    if (phase !== "rep-result") return;
    const timer = setTimeout(() => {
      if (repIndex + 1 >= roots.length) {
        finalize(resultsRef.current);
      } else {
        setRepIndex((i) => i + 1);
        setPhase("listen");
      }
    }, REP_RESULT_PAUSE_MS);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  function skipRep() {
    const result: RepResult = { root: currentRoot, score: 0, avgCentsErr: 0, skipped: true };
    const next = [...results, result];
    setResults(next);
    if (repIndex + 1 >= roots.length) {
      finalize(next);
    } else {
      setRepIndex((i) => i + 1);
      setPhase("listen");
    }
  }

  function endExercise() {
    if (results.length === 0) {
      onExit();
    } else {
      finalize(results);
    }
  }

  const controlsEnabled = phase === "listen";
  const currentCents =
    phase === "sing" && liveMidiFloat !== null
      ? Math.round((liveMidiFloat - (targetMidiAt(segs, Math.min(elapsedSec, totalSec)) ?? liveMidiFloat)) * 100)
      : null;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={endExercise}
          aria-label="Exit exercise"
          className="inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-sm text-mut hover:text-ink"
        >
          <IconArrowLeft />
          Exit
        </button>
        <Pill tone="amber">
          Rep {repIndex + 1} of {roots.length}
        </Pill>
      </div>
      <ProgressBar value={((repIndex + (phase === "rep-result" ? 1 : 0)) / roots.length) * 100} tone="amber" />

      <Card>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <SectionLabel>{ex.title}</SectionLabel>
            <h2 className="mt-3 text-xl">
              {phase === "sing" ? "Your turn" : "Listen"}
            </h2>
            <p className="mt-1.5 max-w-md text-sm text-mut">{ex.tip}</p>
          </div>
          <div className="text-right">
            <div className="font-mono text-[11px] uppercase tracking-[0.14em] text-dim">
              Root
            </div>
            <div className="tabular mt-1 font-mono text-3xl font-bold text-amber">
              {midiToLabel(currentRoot)}
            </div>
          </div>
        </div>

        <div className="mt-6 overflow-x-auto rounded-xl border border-line bg-panel2 p-3">
          <NoteLaneCanvas
            segs={segs}
            totalSec={totalSec}
            hitSec={hitSec}
            cursorSec={phase === "rep-result" ? null : elapsedSec}
            liveMidiFloat={liveMidiFloat}
            trace={trace}
            showLive={phase === "sing"}
          />
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-6">
          {phase === "sing" && (
            <div>
              <div className="font-mono text-[11px] uppercase tracking-[0.14em] text-dim">
                Cents off
              </div>
              <div className="tabular mt-1 font-mono text-2xl text-amber">
                {currentCents !== null ? (currentCents > 0 ? `+${currentCents}` : currentCents) : "—"}
              </div>
            </div>
          )}
          {phase === "rep-result" && lastResult && (
            <div className="flex flex-1 flex-wrap items-center gap-4">
              <Pill tone={lastResult.skipped ? "mut" : lastResult.score >= 80 ? "ok" : "amber"}>
                {lastResult.skipped ? "Skipped" : `Rep score ${lastResult.score}%`}
              </Pill>
              {!lastResult.skipped && (
                <span className="font-mono text-xs text-dim">
                  avg {lastResult.avgCentsErr}¢ off
                </span>
              )}
            </div>
          )}
          {pitch.error && (
            <p className="font-mono text-xs text-rec" role="alert">
              {pitch.error}
            </p>
          )}
        </div>
      </Card>

      <Card>
        <div className="flex flex-wrap items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            disabled={phase === "sing"}
            onClick={() => playGuide(ex, currentRoot, tempo)}
          >
            <IconPlay /> Play reference again
          </Button>

          <div className="flex items-center gap-1 rounded-full border border-line2 px-1 py-1">
            <button
              type="button"
              aria-label="Transpose down a semitone"
              disabled={!controlsEnabled}
              onClick={() => setTranspose((t) => Math.max(-6, t - 1))}
              className="rounded-full p-1.5 text-mut hover:text-ink disabled:opacity-40"
            >
              <IconMinus />
            </button>
            <span className="tabular px-1 font-mono text-xs text-mut">Transpose</span>
            <button
              type="button"
              aria-label="Transpose up a semitone"
              disabled={!controlsEnabled}
              onClick={() => setTranspose((t) => Math.min(6, t + 1))}
              className="rounded-full p-1.5 text-mut hover:text-ink disabled:opacity-40"
            >
              <IconPlus />
            </button>
          </div>

          <div className="flex items-center gap-1 rounded-full border border-line2 px-1 py-1">
            {TEMPOS.map((tv) => (
              <button
                key={tv}
                type="button"
                disabled={!controlsEnabled}
                onClick={() => setTempo(tv)}
                aria-pressed={tempo === tv}
                className={`rounded-full px-2.5 py-1 font-mono text-xs disabled:opacity-40 ${
                  tempo === tv ? "bg-panel2 text-amber" : "text-mut hover:text-ink"
                }`}
              >
                {tv}×
              </button>
            ))}
          </div>

          <span className="flex-1" />

          <Button variant="ghost" size="sm" onClick={skipRep}>
            <IconSkip /> Skip rep
          </Button>
          <Button variant="rec" size="sm" onClick={endExercise}>
            <IconStop /> End exercise
          </Button>
        </div>
      </Card>
    </div>
  );
}
