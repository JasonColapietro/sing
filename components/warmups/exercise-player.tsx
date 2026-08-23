"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { buildSegments, computeRootLadder, ladderWalk, type WarmupExercise } from "./exercises";
import type { UsePitchResult } from "@/lib/audio/use-pitch";
import { centsOff, freqToMidiFloat, midiToLabel } from "@/lib/audio/notes";
import { frameDelta, isFrameFresh } from "@/lib/audio/frame-clock";
import { logSession, type VocalRange } from "@/lib/progress";
import { tallyFromScores } from "@/lib/analytics";
import { Button, Card, Pill, ProgressBar, SectionLabel } from "@/components/ui";
import { IconArrowLeft, IconMinus, IconPlay, IconPlus, IconSkip, IconStop } from "./icons";
import { NoteLaneCanvas, type TracePoint } from "./note-lane-canvas";
import {
  bestRep,
  playGuide,
  repAvgScore,
  sungReps,
  segmentIndexAt,
  singWindowSec,
  targetMidiAt,
  totalTargetDur,
  type RepResult,
  type SessionSummaryData,
} from "./lib";

const TEMPOS = [0.75, 1, 1.25] as const;
/**
 * In-tune window a rep is scored against. Exported so the summary can state
 * the rule the score came from rather than restating the number.
 */
export const TOLERANCE_CENTS = 50;
const REP_RESULT_PAUSE_MS = 1100;
const MIN_VOLUME = 0.006;
/**
 * Consecutive reps without a single voiced frame before the walk ends itself.
 * The ladder never stops on its own, so silence is the only signal that the
 * singer has left: two reps is roughly 25 s of quiet — generous enough for
 * catching a breath, tight enough that an abandoned tab stops almost at once.
 */
const MAX_UNSUNG_REPS = 2;

type Phase = "listen" | "sing" | "rep-result";

/** Phases where a rep is still in play, so skipping it means something. */
const SKIPPABLE_PHASES: Phase[] = ["listen", "sing"];

/**
 * What an unsung rep — one where the mic never landed a voiced frame on a
 * target — means for the endless walk. `unsungStreak` counts consecutive
 * unsung reps, this one included; `sungRepCount` is how many reps were
 * actually sung and scored — skips do not count, since a skipped rung is an
 * abstention rather than a performance.
 *
 * - "continue": the singer may just be between breaths, so keep walking.
 * - "finish": end the session and log only the reps that were sung.
 * - "exit": nothing was ever sung — leave without logging a session at all.
 *
 * Unsung reps are never recorded, so they cannot drag the logged average
 * down: eight reps at 85% followed by an abandoned tab still log 85%.
 */
export function unsungRepAction(
  unsungStreak: number,
  sungRepCount: number,
): "continue" | "finish" | "exit" {
  if (unsungStreak < MAX_UNSUNG_REPS) return "continue";
  return sungRepCount > 0 ? "finish" : "exit";
}

/**
 * Seconds of practice to log: mount → the end of the last scored rep, never
 * mount → now. The walk is endless, so wall-clock time would bill every idle
 * minute of a forgotten tab as singing — enough to read as a heavy day.
 */
export function practicedDurationSec(
  sessionStart: number,
  lastScoredAt: number | null,
): number {
  return Math.max(
    1,
    Math.round(((lastScoredAt ?? sessionStart) - sessionStart) / 1000),
  );
}

/**
 * Height in the ladder as 0..100: the bottom rung reads 0, the top reads 100.
 * A one-rung ladder has no height to travel, so it stays at 0 rather than
 * reporting a permanent 100 on an exercise that never completes.
 */
export function ladderHeightPct(ladderIndex: number, rungs: number): number {
  if (rungs <= 1) return 0;
  return (ladderIndex / (rungs - 1)) * 100;
}

/**
 * Whether a published pitch frame may be scored against the target.
 *
 * Three things have to hold: the detector found a pitch, the input was loud
 * enough to be a voice rather than room noise, and the reading is recent.
 * The last one matters most here. `usePitch` publishes through a ref it only
 * clears on stop, so a loop suspended by a hidden tab leaves the frame from
 * before the tab hid sitting there looking current — and scoring it would not
 * just credit a note that stopped sounding, it would mark a rep the singer was
 * never present for as sung, which is exactly what `unsungRepAction` relies on
 * being able to detect.
 */
export function isScorableFrame(
  frame: { freq: number | null; volume: number; t: number },
  now: number,
): boolean {
  return (
    frame.freq !== null &&
    frame.volume >= MIN_VOLUME &&
    isFrameFresh(frame.t, now)
  );
}

/**
 * Whether the rep at `repIndex` was reached by climbing. `LadderStep.ascending`
 * answers a different question — where the walk heads *after* this rep — so
 * using it as a label would call the top rung "Descending" while it is still
 * being sung. Compare against the previous rep instead; rep 0 starts the climb,
 * and a one-rung ladder that never travels keeps that same starting label.
 */
export function repAscending(roots: number[], repIndex: number): boolean {
  if (repIndex <= 0) return true;
  return ladderWalk(roots, repIndex).index >= ladderWalk(roots, repIndex - 1).index;
}

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
  // The rep that just ended picked up no sound at all — say so, instead of
  // leaving the previous rep's score on screen as if it belonged to this one.
  const [repSilent, setRepSilent] = useState(false);

  const { root: ladderRoot, index: ladderIndex } = ladderWalk(roots, repIndex);
  // The direction that produced this rep, not the one the walk turns to next.
  const climbing = repAscending(roots, repIndex);
  const currentRoot = Math.max(24, Math.min(96, ladderRoot + transpose));
  const { segs, totalSec } = useMemo(
    () => buildSegments(ex, currentRoot, tempo),
    [ex, currentRoot, tempo],
  );
  const singWindow = singWindowSec(totalSec);
  const lastResult = results[results.length - 1] ?? null;

  const hitAccumRef = useRef<number[]>([]);
  const centsSumRef = useRef(0);
  const centsCountRef = useRef(0);
  // Per-segment cents error for the Pro analytics, alongside the rep-wide
  // averages above.
  const segCentsSumRef = useRef<number[]>([]);
  const segCentsFramesRef = useRef<number[]>([]);
  const traceRef = useRef<TracePoint[]>([]);
  // Consecutive reps the singer didn't sing, and when the last rep that *was*
  // sung ended. Together they keep an abandoned tab out of permanent progress.
  const unsungRepsRef = useRef(0);
  const lastScoredAtRef = useRef<number | null>(null);
  // Lazy state initializer: performance.now() only runs once, on mount.
  const [sessionStart] = useState(() => performance.now());

  function finalize(finalResults: RepResult[]) {
    const avgScore = repAvgScore(finalResults);
    const best = bestRep(finalResults);
    const durationSec = practicedDurationSec(sessionStart, lastScoredAtRef.current);
    const log = logSession({
      type: "warmup",
      durationSec,
      score: avgScore,
      detail: ex.title,
      // The ladder sings the same shape at rising roots, so one exercise
      // covers many notes — fold every rep into a single per-note tally.
      notes: tallyFromScores(
        finalResults.flatMap((rep) => (rep.skipped ? [] : (rep.notes ?? []))),
      ),
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
  // Kept as an effect because it starts audio playback (a side effect that
  // must not run during render); the state resets below seed that playback.
  useEffect(() => {
    if (phase !== "listen") return;
    const { segs: guideSegs, totalSec: t } = playGuide(ex, currentRoot, tempo);
    const start = performance.now();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- seeds the rep that just started playing above
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
  }, [phase, repIndex, ex, currentRoot, tempo]);

  // Sing: score the live pitch against the target melody in real time.
  useEffect(() => {
    if (phase !== "sing") return;
    hitAccumRef.current = segs.map(() => 0);
    centsSumRef.current = 0;
    centsCountRef.current = 0;
    segCentsSumRef.current = segs.map(() => 0);
    segCentsFramesRef.current = segs.map(() => 0);
    traceRef.current = [];
    setHitSec(hitAccumRef.current);
    setTrace([]);
    setLiveMidiFloat(null);

    const start = performance.now();
    let last = start;
    let raf = 0;
    const tick = () => {
      const now = performance.now();
      // Shared cap, not a local one: a hidden tab stops rAF while the wall
      // clock keeps running, so the first frame back would otherwise carry the
      // whole absence. See lib/audio/frame-clock.
      const dt = frameDelta(now, last) / 1000;
      last = now;
      const elapsed = (now - start) / 1000;
      setElapsedSec(elapsed);

      const frame = pitch.latest.current;
      const voiced = isScorableFrame(frame, now);
      const midiFloat = voiced && frame.freq !== null ? freqToMidiFloat(frame.freq) : null;
      setLiveMidiFloat(midiFloat);

      if (elapsed <= totalSec) {
        const target = targetMidiAt(segs, elapsed);
        if (target !== null && voiced && frame.freq !== null) {
          const cents = centsOff(frame.freq, target);
          centsSumRef.current += Math.abs(cents);
          centsCountRef.current += 1;
          // Attribute every voiced frame to its segment, in tune or not —
          // an out-of-tune frame is exactly the signal weak-note detection
          // needs, so the index has to be resolved before the check.
          const idx = segmentIndexAt(segs, elapsed);
          if (idx >= 0) {
            segCentsSumRef.current[idx] =
              (segCentsSumRef.current[idx] ?? 0) + Math.abs(cents);
            segCentsFramesRef.current[idx] =
              (segCentsFramesRef.current[idx] ?? 0) + 1;
            if (Math.abs(cents) <= TOLERANCE_CENTS) {
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
        return;
      }

      // Not one voiced frame all window: nobody sang this rep. Recording it
      // would fold a 0 into the logged average, and the walk never stops on
      // its own — so record nothing and end the session once the silence
      // stops looking like a breath.
      if (centsCountRef.current === 0) {
        unsungRepsRef.current += 1;
        const action = unsungRepAction(unsungRepsRef.current, sungReps(results).length);
        if (action === "continue") {
          setRepSilent(true);
          setPhase("rep-result");
        } else if (action === "finish") {
          finalize(results);
        } else {
          onExit();
        }
        return;
      }

      unsungRepsRef.current = 0;
      lastScoredAtRef.current = now;
      const denom = totalTargetDur(segs);
      const hitTotal = hitAccumRef.current.reduce((a, b) => a + b, 0);
      const score =
        denom > 0 ? Math.round(Math.min(100, (hitTotal / denom) * 100)) : 0;
      const avgCentsErr =
        centsCountRef.current > 0
          ? Math.round(centsSumRef.current / centsCountRef.current)
          : 0;
      const result: RepResult = {
        root: currentRoot,
        score,
        avgCentsErr,
        skipped: false,
        notes: segs.flatMap((seg, i) => {
          const hitSec = hitAccumRef.current[i] ?? 0;
          const centsSum = segCentsSumRef.current[i] ?? 0;
          const centsFrames = segCentsFramesRef.current[i] ?? 0;
          // A glide sweeps between two pitches, so credit each endpoint
          // with half the segment rather than pinning it to one note.
          const endpoints =
            seg.startMidi === seg.endMidi
              ? [seg.startMidi]
              : [seg.startMidi, seg.endMidi];
          const share = 1 / endpoints.length;
          return endpoints.map((midi) => ({
            midi,
            hitSec: hitSec * share,
            possibleSec: seg.dur * share,
            centsSum: centsSum * share,
            centsFrames: Math.round(centsFrames * share),
          }));
        }),
      };
      setRepSilent(false);
      setResults((prev) => [...prev, result]);
      setPhase("rep-result");
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, repIndex]);

  // Rep result: brief pause, then keep walking the ladder — up to the top,
  // back down, and around again. The walk ends only when the singer says so,
  // or when the sing phase above has heard nothing for MAX_UNSUNG_REPS reps.
  useEffect(() => {
    if (phase !== "rep-result") return;
    const timer = setTimeout(() => {
      setRepIndex((i) => i + 1);
      setPhase("listen");
    }, REP_RESULT_PAUSE_MS);
    return () => clearTimeout(timer);
  }, [phase]);

  function skipRep() {
    // Only meaningful while the rep is still in play. During the rep-result
    // pause repIndex hasn't advanced yet, so a tap here would append a second
    // result for the rung just scored — counted twice in the average and
    // listed twice in the summary.
    if (!SKIPPABLE_PHASES.includes(phase)) return;
    // Tapping skip is a sign of life, so the silence streak starts over.
    unsungRepsRef.current = 0;
    const result: RepResult = { root: currentRoot, score: 0, avgCentsErr: 0, skipped: true };
    setResults((prev) => [...prev, result]);
    setRepIndex((i) => i + 1);
    setPhase("listen");
  }

  function endExercise() {
    // Skips are abstentions, so a session of nothing but skips has nothing to
    // report: logging it would write a 0% warmup for singing that never
    // happened, the same way an abandoned tab used to.
    if (sungReps(results).length === 0) {
      onExit();
    } else {
      finalize(results);
    }
  }

  const controlsEnabled = phase === "listen";
  const canSkip = SKIPPABLE_PHASES.includes(phase);
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
        <div className="flex items-center gap-2">
          <Pill tone="mut">Rep {repIndex + 1}</Pill>
          <Pill tone={climbing ? "amber" : "cool"}>
            {climbing ? "Climbing" : "Descending"}{" "}
            <span aria-hidden="true">{climbing ? "↑" : "↓"}</span>
          </Pill>
        </div>
      </div>
      {/* Height in the ladder, not session completion — it rises to the top note and falls back. */}
      <ProgressBar value={ladderHeightPct(ladderIndex, roots.length)} tone="amber" />

      {/*
       * The container carries the phase, not just a word inside it.
       *
       * "Listen" and "Your turn" is the one state a singer has to read
       * correctly mid-exercise — sing over the reference and the rep is
       * wasted — and it was a 20px word, the second element in the card, next
       * to a 30px root note that was larger than it. The card border, the
       * background and the lane frame were byte-identical across both phases
       * and the playhead animated in both, so there was nothing peripheral
       * vision could catch. Now the whole card changes state, the word leads,
       * and the live phase gets the same blinking dot the studio already uses
       * to mean "this is recording you".
       */}
      <Card
        className={
          phase === "sing"
            ? "border-rec bg-rec/[0.04] transition-colors"
            : "transition-colors"
        }
      >
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2
              className="flex items-center gap-2.5 text-3xl"
              aria-live="polite"
            >
              {phase === "sing" && (
                <span
                  aria-hidden="true"
                  className="animate-recblink inline-block h-2.5 w-2.5 shrink-0 rounded-full bg-rec"
                />
              )}
              {phase === "sing" ? "Your turn" : "Listen"}
            </h2>
            <SectionLabel className="mt-3">{ex.title}</SectionLabel>
            <p className="mt-2 max-w-md text-sm text-mut">{ex.tip}</p>
          </div>
          <div className="text-right">
            <div className="font-mono text-[11px] uppercase tracking-[0.14em] text-dim">
              Root
            </div>
            <div className="tabular mt-1 font-mono text-3xl font-bold text-amber-ink">
              {midiToLabel(currentRoot)}
            </div>
          </div>
        </div>

        {/* The lane now has a real minimum width, so this wrapper genuinely
            scrolls on a narrow screen instead of squashing it. Same fade and
            cue as the landing comparison table, so the affordance is one
            pattern rather than two. */}
        <p className="mt-6 mb-2 font-mono text-meta text-dim sm:hidden">
          Swipe the lanes <span aria-hidden>→</span>
        </p>
        <div
          className={`no-scrollbar well mt-2 overflow-x-auto rounded-xl p-3 transition-opacity [mask-image:linear-gradient(to_right,black_calc(100%-24px),transparent)] sm:mt-6 sm:[mask-image:none] ${
            phase === "listen" ? "opacity-70" : "opacity-100"
          }`}
        >
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
              <div className="tabular mt-1 font-mono text-2xl text-amber-ink">
                {currentCents !== null ? (currentCents > 0 ? `+${currentCents}` : currentCents) : "—"}
              </div>
            </div>
          )}
          {phase === "rep-result" && repSilent && (
            <Pill tone="mut">No sound picked up</Pill>
          )}
          {phase === "rep-result" && !repSilent && lastResult && (
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
                  tempo === tv ? "bg-panel2 text-amber-ink" : "text-mut hover:text-ink"
                }`}
              >
                {tv}×
              </button>
            ))}
          </div>

          <span className="flex-1" />

          <Button variant="ghost" size="sm" disabled={!canSkip} onClick={skipRep}>
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
