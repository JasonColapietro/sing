"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { buildSegments, computeRootLadder, ladderWalk, type WarmupExercise } from "./exercises";
import { PITCH_FFT_SIZE, type UsePitchResult } from "@/lib/audio/use-pitch";
import { freqToMidiFloat, midiToLabel } from "@/lib/audio/notes";
import { frameDelta, isFrameFresh } from "@/lib/audio/frame-clock";
import { audioNow, getAudioContext } from "@/lib/audio/context";
import { clickAt, createToneGroup, type ToneGroup } from "@/lib/audio/synth";
import { liveLags } from "@/lib/audio/latency";
import { logSession, type VocalRange, type WarmupMode } from "@/lib/progress";
import { tallyFromScores } from "@/lib/analytics";
import { Button, Card, Pill, ProgressBar, SectionLabel } from "@/components/ui";
import {
  IconArrowLeft,
  IconChevron,
  IconMetronome,
  IconMinus,
  IconPlay,
  IconPlus,
  IconSkip,
  IconStop,
} from "./icons";
import { NoteLaneCanvas, type TracePoint } from "./note-lane-canvas";
import { HighwayCanvas } from "./highway-canvas";
import { CountIn } from "@/components/practice/count-in";
import {
  SESSION_FOCUS,
  SessionButton,
  SessionShell,
} from "@/components/practice/session-shell";
import {
  bestRep,
  playGuide,
  repAvgScore,
  sungReps,
  targetMidiAt,
  type RepResult,
  type SessionSummaryData,
} from "./lib";
import { COUNT_IN_CLICKS, clickTimes, leadSec, planRep, type RepPlan } from "./timeline";
import { createRepScorer, type RepScorer } from "./scoring";
import { MODE_LABELS, setClick, setGuidePct, setWarmupMode, useWarmupPrefs } from "./prefs";

// 0.5x matches the songs room: the room most likely to need slow is the one
// that previously would not go slow.
const TEMPOS = [0.5, 0.75, 1, 1.25] as const;
const MAX_TRANSPOSE = 12;
const MIN_VOLUME = 0.006;
/** Guide gain with the level at 100 — the gain the teach pass has always used. */
const GUIDE_MAX_GAIN = 0.22;
/** Seconds between scheduling a rep and its first event, so nothing lands in the past. */
const SCHEDULE_LEAD_SEC = 0.2;
/**
 * Consecutive reps without a single voiced frame before the walk ends itself.
 * The ladder never stops on its own, so silence is the only signal that the
 * singer has left: two reps of quiet is generous enough for catching a breath,
 * tight enough that an abandoned tab stops almost at once.
 */
const MAX_UNSUNG_REPS = 2;

/** Where in one rep's timeline the loop currently is. */
type Stage = "teach" | "lead" | "sing";

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

/**
 * What a routine tells the player about the step it is running. With bounds
 * the step completes itself after `reps` reps, sung or skipped, and the header
 * counts reps instead of ladder height; the runner owns the session, so the
 * Exit button goes away and End becomes "Finish step". Without bounds the
 * exercise is the endless walk a deep link still opens.
 */
export interface ExerciseBounds {
  reps: number;
  stepIndex: number;
  stepCount: number;
}

export function ExercisePlayer({
  ex,
  pitch,
  range,
  bounds,
  variant = "page",
  onFinish,
  onExit,
}: {
  ex: WarmupExercise;
  pitch: UsePitchResult;
  range: VocalRange;
  bounds?: ExerciseBounds;
  /**
   * `page` is the original card layout, still what a deep link into a single
   * exercise renders. `session` is the full-screen practice surface: same
   * engine, same handlers, a different room. Only the render differs — every
   * scheduling, scoring and ref path below is shared, because a second copy of
   * the audio loop is how the two views would drift apart.
   */
  variant?: "page" | "session";
  onFinish: (summary: SessionSummaryData) => void;
  onExit: () => void;
}) {
  // A "down" exercise walks the same band from the top: Singeo's raspberries
  // and hoo start high and drop a half-step a rep, and the walk's triangle
  // wave handles a reversed ladder without knowing it was reversed.
  const roots = useMemo(() => {
    const band = computeRootLadder(ex, range.lowMidi, range.highMidi);
    return ex.ladder === "down" ? [...band].reverse() : band;
  }, [ex, range.lowMidi, range.highMidi]);

  const { mode, guidePct, click } = useWarmupPrefs();
  const guideSliderId = useId();

  const [repIndex, setRepIndex] = useState(0);
  const [tempo, setTempo] = useState<(typeof TEMPOS)[number]>(1);
  const [transpose, setTranspose] = useState(0);
  const [stage, setStage] = useState<Stage>("lead");
  const [results, setResults] = useState<RepResult[]>([]);
  // The last rep that closed: "silent" shows the no-sound pill, "scored" the
  // score pill. Rendered in place while the next rep is already running, so
  // the ladder never stops to grade anyone.
  const [lastOutcome, setLastOutcome] = useState<"scored" | "silent" | null>(null);
  const [cursorSec, setCursorSec] = useState<number | null>(null);
  const [hitSec, setHitSec] = useState<number[]>([]);
  const [trace, setTrace] = useState<TracePoint[]>([]);
  const [liveMidiFloat, setLiveMidiFloat] = useState<number | null>(null);
  // Which count-in beat is sounding, 1-based; 0 outside the lead stage. The
  // wait before a scored window used to be silent and invisible, which is what
  // made it feel arbitrary — now it is drawn as beats filling.
  const [leadBeat, setLeadBeat] = useState(0);
  const [adjustOpen, setAdjustOpen] = useState(false);
  const adjustId = useId();

  const { index: ladderIndex } = ladderWalk(roots, repIndex);
  // The direction that produced this rep, not the one the walk turns to next.
  // "Climbing" is about pitch, not ladder index: on a reversed ladder an
  // ascending index is a falling root.
  const climbing = ex.ladder === "down" ? !repAscending(roots, repIndex) : repAscending(roots, repIndex);
  const currentRoot = Math.max(24, Math.min(96, ladderWalk(roots, repIndex).root + transpose));
  const { segs, totalSec } = useMemo(
    () => buildSegments(ex, currentRoot, tempo),
    [ex, currentRoot, tempo],
  );
  const lastResult = results[results.length - 1] ?? null;

  // The loop's working set. The rAF tick must see the rep that is actually
  // scheduled on the audio clock, not whatever render last committed, so
  // everything it reads lives in refs that scheduleRep writes synchronously.
  const planRef = useRef<RepPlan | null>(null);
  const scorerRef = useRef<RepScorer | null>(null);
  const groupRef = useRef<ToneGroup | null>(null);
  // The gain node the governed guide pass plays through, so the slider is
  // live mid-rep: the pass is scheduled at full gain and this node carries
  // the level, the way the songs mixer's guidePct works.
  const guideGainRef = useRef<GainNode | null>(null);
  const modeRef = useRef<WarmupMode>(mode);
  const guidePctRef = useRef(guidePct);
  const clickRef = useRef(click);
  const patternSecRef = useRef(0);
  const noteDurRef = useRef(0.55);
  const leadBeatRef = useRef(0);
  const rootRef = useRef(48);
  const repIndexRef = useRef(0);
  const tempoRef = useRef<(typeof TEMPOS)[number]>(1);
  const transposeRef = useRef(0);
  const resultsRef = useRef<RepResult[]>([]);
  const traceRef = useRef<TracePoint[]>([]);
  const stageRef = useRef<Stage>("lead");
  const lagsRef = useRef({ pitchLag: 0, outputLag: 0, scoreLag: 0 });
  const unsungRepsRef = useRef(0);
  const lastScoredAtRef = useRef<number | null>(null);
  const lastTickRef = useRef(0);
  const rafRef = useRef(0);
  // Set once the session has handed off (finish, exit, or unmount): the loop
  // stops scheduling and every handler becomes a no-op.
  const finishedRef = useRef(false);

  // The handlers below write these refs synchronously before touching the
  // store, so the loop never waits a render for a control change; this effect
  // only catches a preference changed somewhere else (another tab).
  useEffect(() => {
    modeRef.current = mode;
    guidePctRef.current = guidePct;
    clickRef.current = click;
  }, [mode, guidePct, click]);
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
      // Fixed at the first scored rep, so one session is one mode is one score.
      mode: modeRef.current,
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
      mode: modeRef.current,
    });
  }

  /**
   * Put rep `repIdx` on the audio clock starting at `t0`: cancel whatever the
   * previous rep still had scheduled, lay the plan out, and schedule its
   * sounds into a fresh cancellable group — the teach pass when the plan has
   * one, the count-in clicks, and the under-voice guide for sing-along.
   */
  function scheduleRep(repIdx: number, t0: number, opts?: { teach?: boolean }) {
    groupRef.current?.cancel();
    const ladderRoot = ladderWalk(roots, repIdx).root;
    const root = Math.max(24, Math.min(96, ladderRoot + transposeRef.current));
    const { segs, totalSec, noteDur } = buildSegments(ex, root, tempoRef.current);
    const plan = planRep({
      mode: modeRef.current,
      // A forced teach replays the guide-alone pass without moving the walk:
      // rep 0 is the one index every mode teaches at.
      repIndex: opts?.teach ? 0 : repIdx,
      t0,
      patternSec: totalSec,
      noteDur,
    });

    const group = createToneGroup();
    const now = audioNow();
    // The level the slider governs plays through its own gain node, scheduled
    // at full gain, so dragging the slider mid-rep is heard mid-rep. In
    // sing-along that is the under-voice pass and the teach pass stays at
    // full (a reference should be audible); in call-and-response it is the
    // reference itself, which is the only guide that mode has.
    const guideNode = getAudioContext().createGain();
    guideNode.gain.value = guidePctRef.current / 100;
    guideNode.connect(group.node);
    guideGainRef.current = guideNode;

    if (plan.guideAt !== null) {
      const governed = modeRef.current === "call-response";
      if (!governed || guidePctRef.current > 0) {
        playGuide(ex, root, tempoRef.current, {
          at: plan.t0 + plan.guideAt - now,
          gain: GUIDE_MAX_GAIN,
          out: governed ? guideNode : group.node,
        });
      }
    }
    if (clickRef.current) {
      clickTimes(plan, noteDur).forEach((time, i) => clickAt(time, i === 0, group.node));
    }
    if (plan.guideUnderVoice && guidePctRef.current > 0) {
      playGuide(ex, root, tempoRef.current, {
        at: plan.t0 + plan.singAt - now,
        gain: GUIDE_MAX_GAIN,
        out: guideNode,
      });
    }

    planRef.current = plan;
    groupRef.current = group;
    scorerRef.current = createRepScorer(segs);
    patternSecRef.current = totalSec;
    noteDurRef.current = noteDur;
    rootRef.current = root;
    repIndexRef.current = repIdx;
    traceRef.current = [];
    setRepIndex(repIdx);
    setTrace([]);
    setHitSec(segs.map(() => 0));
    setCursorSec(null);
  }

  /** In a routine, whether this step has used every rep it was given. */
  function stepComplete(): boolean {
    return bounds !== undefined && resultsRef.current.length >= bounds.reps;
  }

  /** Close the rep whose window just ended, then keep walking. */
  function closeRep() {
    const plan = planRef.current;
    const scorer = scorerRef.current;
    if (!plan || !scorer) return;

    const res = scorer.result(rootRef.current);
    if (res === null) {
      // Not one voiced frame all window: nobody sang this rep. Recording it
      // would fold a 0 into the logged average, and the walk never stops on
      // its own — so record nothing and end the session once the silence
      // stops looking like a breath.
      unsungRepsRef.current += 1;
      const action = unsungRepAction(unsungRepsRef.current, sungReps(resultsRef.current).length);
      if (action === "finish") {
        finishedRef.current = true;
        groupRef.current?.cancel();
        finalize(resultsRef.current);
        return;
      }
      if (action === "exit") {
        finishedRef.current = true;
        groupRef.current?.cancel();
        onExit();
        return;
      }
      setLastOutcome("silent");
    } else {
      unsungRepsRef.current = 0;
      lastScoredAtRef.current = performance.now();
      resultsRef.current = [...resultsRef.current, res];
      setResults(resultsRef.current);
      setLastOutcome("scored");
    }
    // A bounded step ends itself: the routine, not the singer, decides when
    // this exercise is done. At least one rep was sung to get here.
    if (stepComplete()) {
      finishedRef.current = true;
      groupRef.current?.cancel();
      finalize(resultsRef.current);
      return;
    }
    scheduleRep(repIndexRef.current + 1, plan.t0 + plan.repDur);
  }

  // The one loop. Reps chain edge to edge on the audio clock; the tick derives
  // the stage from where the clock sits in the current plan, draws the lane
  // where the singer *hears* the guide, and feeds the scorer the pattern
  // position the frame in hand actually describes.
  useEffect(() => {
    finishedRef.current = false;
    lagsRef.current = liveLags(getAudioContext().sampleRate, PITCH_FFT_SIZE);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- seeds the rep whose audio the effect just scheduled, same as the old listen effect
    scheduleRep(0, audioNow() + SCHEDULE_LEAD_SEC);
    lastTickRef.current = performance.now();

    const tick = () => {
      if (finishedRef.current) return;
      const plan = planRef.current;
      const scorer = scorerRef.current;
      if (!plan || !scorer) return;

      const nowPerf = performance.now();
      // Shared cap, not a local one: a hidden tab stops rAF while the wall
      // clock keeps running, so the first frame back would otherwise carry the
      // whole absence. See lib/audio/frame-clock.
      const dt = frameDelta(nowPerf, lastTickRef.current) / 1000;
      lastTickRef.current = nowPerf;
      const elapsed = audioNow() - plan.t0;
      const { outputLag, scoreLag } = lagsRef.current;
      const patternSec = patternSecRef.current;

      const stageNow: Stage =
        elapsed >= plan.singAt
          ? "sing"
          : plan.guideAt !== null && elapsed < plan.leadAt
            ? "teach"
            : "lead";
      if (stageNow !== stageRef.current) {
        stageRef.current = stageNow;
        setStage(stageNow);
        if (stageNow !== "lead" && leadBeatRef.current !== 0) {
          leadBeatRef.current = 0;
          setLeadBeat(0);
        }
      }

      const frame = pitch.latest.current;
      const scorable = isScorableFrame(frame, nowPerf);
      const midiFloat = scorable && frame.freq !== null ? freqToMidiFloat(frame.freq) : null;

      if (stageNow === "sing") {
        // Drawn where the guide is heard; scored where the voice actually was.
        // The two corrections differ by the pitch-report lag, and neither is
        // the raw clock — see lib/audio/latency.
        const drawSec = Math.min(patternSec, Math.max(0, elapsed - plan.singAt - outputLag));
        setCursorSec(drawSec);
        setLiveMidiFloat(midiFloat);
        scorer.feed(
          elapsed - plan.singAt - scoreLag,
          scorable && frame.freq !== null ? frame.freq : null,
          dt,
        );
        traceRef.current = [...traceRef.current, { t: drawSec, midi: midiFloat }].slice(-260);
        setTrace(traceRef.current);
        setHitSec(scorer.hitSec());
      } else if (stageNow === "teach") {
        setCursorSec(Math.min(patternSec, Math.max(0, elapsed - outputLag)));
        setLiveMidiFloat(null);
      } else {
        setCursorSec(null);
        setLiveMidiFloat(null);
        // The beat that is sounding now, from the same arithmetic clickTimes
        // schedules with, so the dots and the clicks cannot drift apart.
        const beatLen = leadSec(noteDurRef.current) / COUNT_IN_CLICKS;
        const beat = Math.min(
          COUNT_IN_CLICKS,
          Math.max(0, Math.floor((elapsed - plan.leadAt) / beatLen) + 1),
        );
        if (beat !== leadBeatRef.current) {
          leadBeatRef.current = beat;
          setLeadBeat(beat);
        }
      }

      if (elapsed >= plan.repDur) {
        closeRep();
        if (finishedRef.current) return;
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);

    // A hidden tab must go quiet and stall cleanly: rAF stops on its own, but
    // the tone group would keep playing whatever was already scheduled — one
    // full guide melody, out loud, to an empty room. Cancel it, and rebuild
    // the current rep from the clock when the singer comes back.
    const onVisibility = () => {
      if (document.visibilityState === "hidden") {
        groupRef.current?.cancel();
        cancelAnimationFrame(rafRef.current);
      } else if (!finishedRef.current) {
        lastTickRef.current = performance.now();
        scheduleRep(repIndexRef.current, audioNow() + SCHEDULE_LEAD_SEC);
        rafRef.current = requestAnimationFrame(tick);
      }
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      finishedRef.current = true;
      document.removeEventListener("visibilitychange", onVisibility);
      cancelAnimationFrame(rafRef.current);
      groupRef.current?.cancel();
    };
    // Everything the loop reads lives in refs precisely so this runs once per
    // exercise: reps chain inside the loop, and control changes reschedule
    // through scheduleRep rather than by re-running the effect.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ex]);

  /** Cancel the current rep's sounds and rebuild it from the clock. */
  function restartCurrentRep(opts?: { teach?: boolean }) {
    if (finishedRef.current) return;
    scheduleRep(repIndexRef.current, audioNow() + SCHEDULE_LEAD_SEC, opts);
  }

  function skipRep() {
    if (finishedRef.current) return;
    // A skipped rung is an abstention: recorded so the summary can list it,
    // never scored. Tapping skip is a sign of life, so the silence streak
    // starts over.
    groupRef.current?.cancel();
    unsungRepsRef.current = 0;
    const result: RepResult = { root: rootRef.current, score: 0, avgCentsErr: 0, skipped: true };
    resultsRef.current = [...resultsRef.current, result];
    setResults(resultsRef.current);
    setLastOutcome("scored");
    if (stepComplete()) {
      finishedRef.current = true;
      cancelAnimationFrame(rafRef.current);
      // Skips are abstentions: a step of nothing but skips is not a session.
      if (sungReps(resultsRef.current).length === 0) onExit();
      else finalize(resultsRef.current);
      return;
    }
    scheduleRep(repIndexRef.current + 1, audioNow() + SCHEDULE_LEAD_SEC);
  }

  function endExercise() {
    if (finishedRef.current) return;
    finishedRef.current = true;
    groupRef.current?.cancel();
    cancelAnimationFrame(rafRef.current);
    // Skips are abstentions, so a session of nothing but skips has nothing to
    // report: logging it would write a 0% warmup for singing that never
    // happened, the same way an abandoned tab used to.
    if (sungReps(resultsRef.current).length === 0) {
      onExit();
    } else {
      finalize(resultsRef.current);
    }
  }

  function changeTempo(tv: (typeof TEMPOS)[number]) {
    tempoRef.current = tv;
    setTempo(tv);
    restartCurrentRep();
  }

  function nudgeTranspose(delta: number) {
    // ±12 matches the songs room's clamp.
    const next = Math.max(-MAX_TRANSPOSE, Math.min(MAX_TRANSPOSE, transposeRef.current + delta));
    if (next === transposeRef.current) return;
    transposeRef.current = next;
    setTranspose(next);
    restartCurrentRep();
  }

  // The mode is what separates the two scoring rulers, so it locks the moment
  // a rep has been scored: one session is one mode is one score.
  const modeLocked = sungReps(results).length > 0;

  function changeMode(next: WarmupMode) {
    if (finishedRef.current || modeLocked || next === modeRef.current) return;
    modeRef.current = next;
    setWarmupMode(next);
    restartCurrentRep();
  }

  function changeGuidePct(pct: number) {
    guidePctRef.current = pct;
    setGuidePct(pct);
    // Level is monitoring, not scoring, so it moves mid-rep: the governed pass
    // is scheduled at full gain through this node precisely so the slider can
    // reach a rep that is already sounding.
    guideGainRef.current?.gain.setTargetAtTime(pct / 100, audioNow(), 0.03);
  }

  function toggleClick() {
    const next = !clickRef.current;
    clickRef.current = next;
    setClick(next);
  }

  const singing = stage === "sing";
  const currentCents =
    singing && liveMidiFloat !== null
      ? Math.round(
          (liveMidiFloat -
            (targetMidiAt(segs, Math.min(cursorSec ?? 0, totalSec)) ?? liveMidiFloat)) *
            100,
        )
      : null;

  // Everything both views read, derived once. The session view is a different
  // room, not a different exercise: it must never compute a rep count, a
  // progress figure or a stage word its own way.
  const progressPct = bounds
    ? (results.length / bounds.reps) * 100
    : ladderHeightPct(ladderIndex, roots.length);
  const repLabel = bounds
    ? `Rep ${Math.min(results.length + 1, bounds.reps)} of ${bounds.reps}`
    : `Rep ${repIndex + 1}`;
  const centsText =
    currentCents === null ? "—" : `${currentCents > 0 ? "+" : ""}${currentCents}`;
  const stageWord = singing ? "Sing" : stage === "teach" ? "Listen" : "Breathe";

  const segGroup =
    "flex items-center gap-1 rounded-2xl border border-[var(--s-line)] bg-[var(--s-bg)] p-1";
  const segItem = (on: boolean) =>
    `min-h-[44px] rounded-xl px-3 font-mono text-xs transition-colors disabled:opacity-40 ${SESSION_FOCUS} ${
      on
        ? "bg-[var(--s-over)] text-[var(--s-ink)]"
        : "text-[var(--s-mut)] hover:text-[var(--s-ink)]"
    }`;

  const panelLabel =
    "font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--s-dim)]";

  const sessionBottom = (
    <div className="space-y-3">
      {adjustOpen && (
        <div
          id={adjustId}
          className="flex flex-wrap items-center gap-x-5 gap-y-3 rounded-2xl border border-[var(--s-line)] bg-[var(--s-bg)] p-3"
        >
          <div
            className={segGroup}
            title={
              modeLocked
                ? "The mode is fixed once a rep has been scored, so one session is one score. End the exercise to switch."
                : undefined
            }
          >
            {(Object.keys(MODE_LABELS) as WarmupMode[]).map((m) => (
              <button
                key={m}
                type="button"
                disabled={modeLocked}
                onClick={() => changeMode(m)}
                aria-pressed={mode === m}
                className={segItem(mode === m)}
              >
                {MODE_LABELS[m]}
              </button>
            ))}
          </div>

          <div className="flex min-w-[220px] flex-1 items-center gap-3">
            <label htmlFor={guideSliderId} className={`shrink-0 ${panelLabel}`}>
              {mode === "call-response" ? "Reference" : "Guide"}
            </label>
            <input
              id={guideSliderId}
              type="range"
              min={0}
              max={100}
              step={5}
              value={guidePct}
              aria-valuetext={guidePct === 0 ? "Off" : `${guidePct} percent`}
              onChange={(e) => changeGuidePct(Number(e.target.value))}
              className={`min-w-0 flex-1 cursor-pointer accent-[var(--s-ok)] ${SESSION_FOCUS}`}
            />
            <span className="tabular w-9 shrink-0 text-right font-mono text-xs text-[var(--s-mut)]">
              {guidePct === 0 ? "Off" : `${guidePct}%`}
            </span>
          </div>

          <button
            type="button"
            onClick={toggleClick}
            aria-pressed={click}
            title="Count-in clicks before every scored window"
            className={`inline-flex min-h-[44px] items-center gap-1.5 rounded-2xl border border-[var(--s-line2)] px-3 font-mono text-xs transition-colors ${SESSION_FOCUS} ${
              click
                ? "bg-[var(--s-over)] text-[var(--s-ink)]"
                : "text-[var(--s-mut)] hover:text-[var(--s-ink)]"
            }`}
          >
            <IconMetronome /> Click
          </button>

          <div className={segGroup}>
            <button
              type="button"
              aria-label="Transpose down a semitone"
              onClick={() => nudgeTranspose(-1)}
              className={`flex h-11 w-11 items-center justify-center rounded-xl text-[var(--s-mut)] transition-colors hover:text-[var(--s-ink)] ${SESSION_FOCUS}`}
            >
              <IconMinus />
            </button>
            <span className="tabular px-1 font-mono text-xs text-[var(--s-mut)]">
              Transpose{transpose !== 0 ? ` ${transpose > 0 ? "+" : ""}${transpose}` : ""}
            </span>
            <button
              type="button"
              aria-label="Transpose up a semitone"
              onClick={() => nudgeTranspose(1)}
              className={`flex h-11 w-11 items-center justify-center rounded-xl text-[var(--s-mut)] transition-colors hover:text-[var(--s-ink)] ${SESSION_FOCUS}`}
            >
              <IconPlus />
            </button>
          </div>

          <div className={segGroup}>
            {TEMPOS.map((tv) => (
              <button
                key={tv}
                type="button"
                onClick={() => changeTempo(tv)}
                aria-pressed={tempo === tv}
                className={segItem(tempo === tv)}
              >
                {tv}×
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center gap-2">
        <SessionButton
          label="Reference"
          onClick={() => restartCurrentRep({ teach: true })}
        >
          {/* 14px is the icon size for a page button; this strip is read and
              hit at arm's length, so every glyph in it steps up to 20. */}
          <IconPlay className="h-5 w-5" />
        </SessionButton>
        <SessionButton label="Skip rep" onClick={skipRep}>
          <IconSkip className="h-5 w-5" />
        </SessionButton>
        <SessionButton
          label="Adjust"
          onClick={() => setAdjustOpen((o) => !o)}
          pressed={adjustOpen}
          expanded={adjustOpen}
          controls={adjustId}
        >
          <IconChevron
            className={`h-5 w-5 transition-transform ${adjustOpen ? "rotate-180" : ""}`}
          />
        </SessionButton>
        <span className="flex-1" />
        <SessionButton
          label={bounds ? "Finish step" : "End"}
          onClick={endExercise}
          tone="danger"
        >
          <IconStop className="h-5 w-5" />
        </SessionButton>
      </div>
    </div>
  );

  const sessionView = (
    <SessionShell
      title={ex.title}
      subtitle={bounds ? `Step ${bounds.stepIndex + 1} of ${bounds.stepCount}` : "Endless ladder"}
      progress={progressPct}
      onClose={endExercise}
      closeLabel={bounds ? "Finish step" : "Exit exercise"}
      topRight={
        <div className="text-right leading-tight">
          <div className="font-mono text-[11px] text-[var(--s-dim)]">
            Root · <span className="text-[var(--s-ink)]">{midiToLabel(currentRoot)}</span>
          </div>
          <div className="tabular font-mono text-[11px] text-[var(--s-dim)]">{repLabel}</div>
        </div>
      }
      bottom={sessionBottom}
    >
      {/*
       * The stage banner. "Listen" and "Sing" is the one state a singer has to
       * read correctly mid-exercise — sing over a teach pass and the rep is
       * wasted — so it is the largest thing on the screen after the highway,
       * in the editorial face, with the studio's blinking dot to mean "this is
       * recording you".
       */}
      <div className="flex shrink-0 items-start justify-between gap-4 px-4 pb-3 sm:px-5">
        <div className="min-w-0">
          <div className="flex items-center gap-3">
            {singing && (
              <span
                aria-hidden="true"
                className="animate-recblink inline-block h-3 w-3 shrink-0 rounded-full bg-[var(--s-rec)]"
              />
            )}
            <p
              aria-live="polite"
              className="font-display text-[clamp(1.75rem,4vw,2.5rem)] leading-none"
            >
              {stageWord}
            </p>
            {stage === "lead" && <CountIn beats={COUNT_IN_CLICKS} beat={leadBeat} />}
          </div>
          <p className="mt-2 max-w-md text-sm text-[var(--s-mut)]">{ex.tip}</p>
          {pitch.error && (
            <p className="mt-2 font-mono text-xs text-[var(--s-rec)]" role="alert">
              {pitch.error}
            </p>
          )}
        </div>
        <div className="shrink-0 text-right">
          {singing ? (
            <>
              <div className={panelLabel}>Cents off</div>
              <div className="tabular mt-1 font-mono text-[clamp(1.5rem,3.5vw,2rem)] leading-none text-[var(--s-ink)]">
                {centsText} <span className="text-[var(--s-dim)]">¢</span>
              </div>
            </>
          ) : lastOutcome === "silent" ? (
            <SessionPill tone="dim">No sound picked up</SessionPill>
          ) : lastOutcome === "scored" && lastResult ? (
            <SessionPill tone={lastResult.skipped ? "dim" : lastResult.score >= 80 ? "ok" : "amber"}>
              {lastResult.skipped ? "Skipped" : `Rep ${lastResult.score}%`}
            </SessionPill>
          ) : null}
        </div>
      </div>

      <HighwayCanvas
        segs={segs}
        totalSec={totalSec}
        hitSec={hitSec}
        // The count-in parks the pattern at its start, so the first bar sits
        // just right of the line and the singer can see what is coming while
        // they breathe. Null would draw the same frame, but saying 0 is what
        // this view actually means.
        cursorSec={stage === "lead" ? 0 : cursorSec}
        liveMidiFloat={liveMidiFloat}
        trace={trace}
        showLive={singing}
        className="block w-full min-h-[220px] flex-1"
      />
    </SessionShell>
  );

  // Built only for the page: the session view is chosen first so the rAF
  // tick's sixty renders a second never allocate a card tree they throw away.
  if (variant === "session") return sessionView;

  const pageView = (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {bounds ? (
          <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-dim">
            Step {bounds.stepIndex + 1} of {bounds.stepCount}
          </span>
        ) : (
          <button
            type="button"
            onClick={endExercise}
            aria-label="Exit exercise"
            className="inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-sm text-mut hover:text-ink"
          >
            <IconArrowLeft />
            Exit
          </button>
        )}
        <div className="flex items-center gap-2">
          <Pill tone="mut">
            {bounds
              ? `Rep ${Math.min(results.length + 1, bounds.reps)} of ${bounds.reps}`
              : `Rep ${repIndex + 1}`}
          </Pill>
          <Pill tone={climbing ? "violet" : "cool"}>
            {climbing ? "Climbing" : "Descending"}{" "}
            <span aria-hidden="true">{climbing ? "↑" : "↓"}</span>
          </Pill>
        </div>
      </div>
      {/* In a routine this is the step's completion. Unbounded, it is height in
          the ladder — it rises to the top note and falls back. */}
      <ProgressBar
        value={
          bounds
            ? (results.length / bounds.reps) * 100
            : ladderHeightPct(ladderIndex, roots.length)
        }
        tone="violet"
      />

      {/*
       * The container carries the stage, not just a word inside it.
       *
       * "Listen" and "Your turn" is the one state a singer has to read
       * correctly mid-exercise — sing over a teach pass and the rep is
       * wasted — so the whole card changes state, the word leads, and the
       * live stage gets the same blinking dot the studio already uses to
       * mean "this is recording you".
       */}
      <Card
        className={
          singing
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
              {singing && (
                <span
                  aria-hidden="true"
                  className="animate-recblink inline-block h-2.5 w-2.5 shrink-0 rounded-full bg-rec"
                />
              )}
              {singing ? "Your turn" : stage === "teach" ? "Listen" : "Breathe"}
            </h2>
            {stage === "lead" && (
              <div className="mt-2 flex items-center gap-2">
                {Array.from({ length: COUNT_IN_CLICKS }, (_, i) => (
                  <span
                    key={i}
                    aria-hidden="true"
                    className={`inline-block h-2.5 w-2.5 rounded-full transition-colors duration-150 ${
                      i < leadBeat ? "bg-violet" : "bg-line2"
                    }`}
                  />
                ))}
                <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-dim">
                  Count-in
                </span>
              </div>
            )}
            <SectionLabel className="mt-3">{ex.title}</SectionLabel>
            <p className="mt-2 max-w-md text-sm text-mut">{ex.tip}</p>
          </div>
          <div className="text-right">
            <div className="font-mono text-[11px] uppercase tracking-[0.14em] text-dim">
              Root
            </div>
            <div className="tabular mt-1 font-mono text-3xl font-bold text-violet-ink">
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
            singing ? "opacity-100" : "opacity-70"
          }`}
        >
          <NoteLaneCanvas
            segs={segs}
            totalSec={totalSec}
            hitSec={hitSec}
            cursorSec={cursorSec}
            liveMidiFloat={liveMidiFloat}
            trace={trace}
            showLive={singing}
          />
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-6">
          {singing && (
            <div>
              <div className="font-mono text-[11px] uppercase tracking-[0.14em] text-dim">
                Cents off
              </div>
              <div className="tabular mt-1 font-mono text-2xl text-violet-ink">
                {currentCents !== null ? (currentCents > 0 ? `+${currentCents}` : currentCents) : "—"}
              </div>
            </div>
          )}
          {lastOutcome === "silent" && <Pill tone="mut">No sound picked up</Pill>}
          {lastOutcome === "scored" && lastResult && (
            <div className="flex flex-1 flex-wrap items-center gap-4">
              <Pill tone={lastResult.skipped ? "mut" : lastResult.score >= 80 ? "ok" : "violet"}>
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

      {/*
       * The three things a singer reaches for mid-exercise stay on the card.
       * Everything that shapes the exercise — mode, guide level, click,
       * transpose, tempo — lives under Adjust, closed by default: nine controls
       * on one row read as a mixing desk, and a warmup is not the moment to be
       * offered one.
       */}
      <Card>
        <div className="flex flex-wrap items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => restartCurrentRep({ teach: true })}
          >
            <IconPlay /> Play reference again
          </Button>
          <Button variant="ghost" size="sm" onClick={skipRep}>
            <IconSkip /> Skip rep
          </Button>
          <button
            type="button"
            onClick={() => setAdjustOpen((o) => !o)}
            aria-expanded={adjustOpen}
            aria-controls={adjustId}
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 font-mono text-xs ${
              adjustOpen ? "bg-panel2 text-violet-ink" : "text-mut hover:text-ink"
            }`}
          >
            Adjust
            <IconChevron className={`transition-transform ${adjustOpen ? "rotate-180" : ""}`} />
          </button>

          <span className="flex-1" />

          <Button variant="rec" size="sm" onClick={endExercise}>
            <IconStop /> {bounds ? "Finish step" : "End exercise"}
          </Button>
        </div>

        {adjustOpen && (
          <div
            id={adjustId}
            className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-3 border-t border-line pt-4"
          >
            <div
              className="flex items-center gap-1 rounded-full border border-line2 px-1 py-1"
              title={
                modeLocked
                  ? "The mode is fixed once a rep has been scored, so one session is one score. End the exercise to switch."
                  : undefined
              }
            >
              {(Object.keys(MODE_LABELS) as WarmupMode[]).map((m) => (
                <button
                  key={m}
                  type="button"
                  disabled={modeLocked}
                  onClick={() => changeMode(m)}
                  aria-pressed={mode === m}
                  className={`rounded-full px-2.5 py-1 font-mono text-xs disabled:opacity-40 ${
                    mode === m ? "bg-panel2 text-violet-ink" : "text-mut hover:text-ink"
                  }`}
                >
                  {MODE_LABELS[m]}
                </button>
              ))}
            </div>

            <div className="flex min-w-[220px] flex-1 items-center gap-3">
              <label
                htmlFor={guideSliderId}
                className="shrink-0 font-mono text-[11px] uppercase tracking-[0.14em] text-dim"
              >
                {mode === "call-response" ? "Reference level" : "Guide level"}
              </label>
              {/* Left at its native height: squashing a range input clips the
                  thumb and shrinks the touch target on a phone. */}
              <input
                id={guideSliderId}
                type="range"
                min={0}
                max={100}
                step={5}
                value={guidePct}
                aria-valuetext={guidePct === 0 ? "Off" : `${guidePct} percent`}
                onChange={(e) => changeGuidePct(Number(e.target.value))}
                className="min-w-0 flex-1 cursor-pointer accent-violet"
              />
              <span className="tabular w-9 shrink-0 text-right font-mono text-xs text-mut">
                {guidePct === 0 ? "Off" : `${guidePct}%`}
              </span>
            </div>

            <button
              type="button"
              onClick={toggleClick}
              aria-pressed={click}
              title="Count-in clicks before every scored window"
              className={`inline-flex items-center gap-1.5 rounded-full border border-line2 px-2.5 py-1 font-mono text-xs ${
                click ? "bg-panel2 text-violet-ink" : "text-mut hover:text-ink"
              }`}
            >
              <IconMetronome /> Click
            </button>

            <div className="flex items-center gap-1 rounded-full border border-line2 px-1 py-1">
              <button
                type="button"
                aria-label="Transpose down a semitone"
                onClick={() => nudgeTranspose(-1)}
                className="rounded-full p-1.5 text-mut hover:text-ink"
              >
                <IconMinus />
              </button>
              <span className="tabular px-1 font-mono text-xs text-mut">
                Transpose{transpose !== 0 ? ` ${transpose > 0 ? "+" : ""}${transpose}` : ""}
              </span>
              <button
                type="button"
                aria-label="Transpose up a semitone"
                onClick={() => nudgeTranspose(1)}
                className="rounded-full p-1.5 text-mut hover:text-ink"
              >
                <IconPlus />
              </button>
            </div>

            <div className="flex items-center gap-1 rounded-full border border-line2 px-1 py-1">
              {TEMPOS.map((tv) => (
                <button
                  key={tv}
                  type="button"
                  onClick={() => changeTempo(tv)}
                  aria-pressed={tempo === tv}
                  className={`rounded-full px-2.5 py-1 font-mono text-xs ${
                    tempo === tv ? "bg-panel2 text-violet-ink" : "text-mut hover:text-ink"
                  }`}
                >
                  {tv}×
                </button>
              ))}
            </div>
          </div>
        )}
      </Card>
    </div>
  );

  // --- the session view -----------------------------------------------------
  // Same handlers, same state, dark tokens. The three shapes below are the
  // whole vocabulary of the Adjust panel, held here so a control cannot end up
  // styled one way in the mode row and another in the tempo row.
  return pageView;
}

/** The session surface's read-only chip — Pill's shape in the dark tokens. */
function SessionPill({
  children,
  tone,
}: {
  children: React.ReactNode;
  tone: "dim" | "ok" | "amber";
}) {
  const tones = {
    dim: "border-[var(--s-line2)] text-[var(--s-mut)]",
    ok: "border-[var(--s-ok)]/45 text-[var(--s-ok)]",
    amber: "border-[var(--s-amber)]/45 text-[var(--s-amber)]",
  } as const;
  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1 font-mono text-xs whitespace-nowrap ${tones[tone]}`}
    >
      {children}
    </span>
  );
}
