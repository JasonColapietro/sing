"use client";

import { useEffect, useRef, useState } from "react";
import type { UsePitchResult } from "@/lib/audio/use-pitch";
import { STALE_FRAME_MS } from "@/lib/audio/frame-clock";
import { useBreathDetect } from "@/lib/audio/use-breath-detect";
import { logSession, type LogResult } from "@/lib/progress";
import { MIC_PRIVACY } from "@/components/ui";
import { SessionButton, SessionShell } from "@/components/practice/session-shell";
import { BreathGatePanel } from "./breath-gate";
import { LevelMeter } from "./sustain-test";
import { recordBreathBest } from "./store";
import { trackHiddenTime } from "@/components/practice/hidden-time";
import {
  activeElapsedMs,
  markActive,
  skipHidden,
  startActiveClock,
  trackActivity,
} from "@/components/practice/active-clock";
import {
  BREATH_FALLBACK_SEC,
  CUE_REP_CHOICES,
  CUE_REST_SEC,
  cueDrillLoggedSeconds,
  type BreathDrillResult,
} from "./routines";

/**
 * Breathe and sing: a short note, many times, each one opened by a breath.
 *
 * The sustain test asks how long one breath lasts. This asks for the habit
 * underneath it — breathe, then sing — because the phrase a singer runs out of
 * air in is usually the one they started without taking a breath for. A rep's
 * note only counts once the mic has heard the inhale before it; a note begun
 * without one is simply not counted, and the rep waits for a breath.
 *
 * The mic hears the breath and nothing more. It does not judge how deep it
 * was or where it went, and the drill never says otherwise. Where the mic
 * cannot hear breathing at all, the fallback turns the gate into a timed cue.
 *
 *   setup   → choose a rep count (a routine step skips this)
 *   breath  → waiting for an inhale (or, without detection, a timed cue)
 *   ready   → breath heard; waiting for the voice
 *   holding → the note, until it has lasted holdSec
 *   rest    → a beat before the next rep
 */
type Phase = "setup" | "breath" | "ready" | "holding" | "rest";

/** A note that stops for this long has ended. The sustain test's own figure. */
const SILENCE_MS = 700;
// A full silence timeout plus the allowed age of one reading cannot establish
// a continuous note. Short scheduling hitches keep the usual hold semantics.
const MAX_HOLD_GAP_MS = SILENCE_MS + STALE_FRAME_MS;
const REST_MS = CUE_REST_SEC * 1000;
/** Without detection, the breath is a count rather than something heard. */
const TIMED_BREATH_MS = 2500;
/** An early-ended run shorter than this is not logged. */
const MIN_LOG_SEC = 20;

export function BreathCueDrill({
  pitch,
  preset,
  autoStart = false,
  onComplete,
  onExit,
}: {
  /** The room's microphone. */
  pitch: UsePitchResult;
  preset: { reps: number; holdSec: number };
  /** Skip the rep picker and start once the mic is live — a routine step. */
  autoStart?: boolean;
  onComplete: (result: BreathDrillResult) => void;
  /** Leaving before any rep finished — there is nothing to report. */
  onExit: () => void;
}) {
  const { frame, listening, error, start } = pitch;
  const holdSec = preset.holdSec;
  const [reps, setReps] = useState(preset.reps);
  const [phase, setPhase] = useState<Phase>("setup");
  const [done, setDone] = useState(0);
  const [heard, setHeard] = useState(0);
  const [held, setHeld] = useState(0);
  const [gated, setGated] = useState(true);
  const [stale, setStale] = useState(false);
  /** The last rep's note stopped before it counted. */
  const [cutShort, setCutShort] = useState(false);
  const [lastBreathSec, setLastBreathSec] = useState<number | null>(null);
  const [threshold, setThreshold] = useState(0.015);

  const [visible, setVisible] = useState(true);
  const available = listening && visible;
  const breath = useBreathDetect(pitch, gated && visible);

  /** The run's play clock: hidden time and idle time past the grace left out. */
  const clockRef = useRef(startActiveClock(0));
  const breathSinceRef = useRef(0);
  const holdStartRef = useRef(0);
  const lastLoudRef = useRef(0);
  const lastFrameRef = useRef(0);
  const finishedRef = useRef(false);

  /** A tap, a key, a breath heard or a note sung: the singer is still here. */
  const markActiveAt = (t: number) => {
    clockRef.current = markActive(clockRef.current, t);
  };

  // The run is timed on an active clock (components/practice/active-clock.ts).
  // A hidden tab moves its start past the time it was away, and a stretch of
  // more than thirty seconds with no tap, key, breath or note counts as
  // thirty, so a phone left on "Breathe in" is not logged as practice.
  useEffect(() => {
    const onVisibility = () => setVisible(document.visibilityState !== "hidden");
    onVisibility();
    document.addEventListener("visibilitychange", onVisibility);
    const stopHidden = trackHiddenTime(
      document,
      () => performance.now(),
      (ms) => {
        clockRef.current = skipHidden(clockRef.current, ms, performance.now());
      },
    );
    const stopInput = trackActivity(document, () => {
      clockRef.current = markActive(clockRef.current, performance.now());
    });
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      stopHidden();
      stopInput();
    };
  }, []);

  /** Begin a rep: listen for the breath (or count one, without detection). */
  const startRep = () => {
    setHeld(0);
    setStale(false);
    breathSinceRef.current = performance.now();
    setPhase("breath");
  };

  const restartInterruptedRep = () => {
    holdStartRef.current = 0;
    lastLoudRef.current = 0;
    setCutShort(false);
    setLastBreathSec(null);
    startRep();
  };

  // The borrowed mic can disappear while this drill stays mounted behind its
  // retry gate. Keep completed reps/settings, but require a fresh breath.
  useEffect(() => {
    if (available || phase === "setup" || finishedRef.current) return;
    lastFrameRef.current = 0;
    restartInterruptedRep();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- interruption resets only the unfinished rep
  }, [available, phase]);

  const begin = () => {
    clockRef.current = startActiveClock(performance.now());
    setDone(0);
    setHeard(0);
    setCutShort(false);
    setLastBreathSec(null);
    startRep();
  };

  const finish = (repsDone: number, heardCount: number, early: boolean) => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    const sec = cueDrillLoggedSeconds(
      activeElapsedMs(clockRef.current, performance.now()) / 1000,
      reps,
      holdSec,
    );
    const logged: LogResult | null =
      repsDone > 0 && (!early || sec >= MIN_LOG_SEC)
        ? logSession({ type: "breath", durationSec: sec, detail: "Breathe and sing" })
        : null;
    // A best is earned by finishing the run, as Farinelli's is.
    if (!early) recordBreathBest({ cueReps: repsDone });
    onComplete({
      durationSec: sec,
      score: null,
      logged,
      label: gated
        ? `${repsDone} reps · ${heardCount} breaths heard`
        : `${repsDone} reps`,
      reps: repsDone,
    });
  };

  // A routine step starts once the mic is live; there is nothing to choose.
  useEffect(() => {
    if (!autoStart || !available || phase !== "setup" || finishedRef.current) return;
    begin();
    // `begin` only resets state and reads the clock.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoStart, available, phase]);

  // The gate: a breath heard since this rep began listening opens it.
  const latest = pitch.latest;
  useEffect(() => {
    const inhale = breath.lastInhale;
    if (!available || !gated || phase !== "breath" || !inhale || inhale.endMs < breathSinceRef.current) return;
    const now = latest.current;
    // The detector can confirm an old hiss on the first frame after a gap.
    // Validate continuity before that event can open and backdate a hold.
    if (lastFrameRef.current > 0 && now.t - lastFrameRef.current > MAX_HOLD_GAP_MS) {
      breathSinceRef.current = now.t;
      return;
    }
    markActiveAt(performance.now());
    setHeard((n) => n + 1);
    setLastBreathSec(Math.round(inhale.durationSec * 10) / 10);
    setCutShort(false);
    if (inhale.endedByHiss && now.volume > threshold) {
      // Straight into a hiss: the note began at the split, a moment before
      // the breath was reported, and is timed from there.
      holdStartRef.current = inhale.endMs;
      lastLoudRef.current = now.t;
      // eslint-disable-next-line react-hooks/set-state-in-effect -- the inhale is an event from the mic stream, not render-derivable state
      setPhase("holding");
      return;
    }
    setPhase("ready");
    // `threshold` is read at the moment the gate opens, not watched.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [breath.lastInhale, gated, phase, latest, available]);

  // Without detection the breath is a timed cue; with it, a long wait offers
  // the way round.
  useEffect(() => {
    if (!available || phase !== "breath") return;
    const id = window.setTimeout(
      () => (gated ? setStale(true) : setPhase("ready")),
      gated ? BREATH_FALLBACK_SEC * 1000 : TIMED_BREATH_MS,
    );
    return () => window.clearTimeout(id);
  }, [phase, gated, done, cutShort, available]);

  useEffect(() => {
    if (!available || phase !== "rest") return;
    const id = window.setTimeout(startRep, REST_MS);
    return () => window.clearTimeout(id);
  }, [phase, available]);

  // The note, driven by the pitch loop's frames. The same subscription shape as
  // the sustain test's: an external signal, not a render-derivable value.
  useEffect(() => {
    if (!available) return;
    const now = frame.t;
    if (now === 0) return;
    const previous = lastFrameRef.current;
    lastFrameRef.current = now;
    if (phase === "breath") {
      // Also reject the old inhale if its state update arrives after the frame.
      // Keep the existing wait/fallback timer: this is still the same gate.
      if (previous > 0 && now - previous > MAX_HOLD_GAP_MS) breathSinceRef.current = now;
      return;
    }
    if (phase !== "ready" && phase !== "holding") return;
    if (previous > 0 && now - previous > MAX_HOLD_GAP_MS) {
      restartInterruptedRep();
      return;
    }
    const v = frame.volume;
    if (v > threshold) markActiveAt(now);
    if (phase === "ready") {
      if (v > threshold) {
        holdStartRef.current = now;
        lastLoudRef.current = now;
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setPhase("holding");
      }
      return;
    }
    if (v > threshold) lastLoudRef.current = now;
    const sec = (lastLoudRef.current - holdStartRef.current) / 1000;
    setHeld(Math.min(holdSec, sec));
    if (sec >= holdSec) {
      const next = done + 1;
      setDone(next);
      if (next >= reps) finish(next, heard, false);
      else setPhase("rest");
      return;
    }
    if (now - lastLoudRef.current > SILENCE_MS) {
      // Stopped before it counted. The rep starts again from the breath.
      setCutShort(true);
      startRep();
    }
    // `finish` and `startRep` are stable in what they read for this frame.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [frame, phase, threshold, available]);

  const close = () => {
    if (done > 0) finish(done, heard, true);
    else onExit();
  };

  const word =
    phase === "breath"
      ? "Breathe in"
      : phase === "ready"
        ? "Sing"
        : phase === "holding"
          ? "Hold"
          : phase === "rest"
            ? "Good"
            : "Breathe and sing";

  const status =
    phase === "breath"
      ? gated
        ? cutShort
          ? `That note stopped before ${holdSec} seconds. Breathe in again. The rep starts once the mic hears it.`
          : "Take an easy breath in. The note counts once the mic hears it."
        : "Breathe in now…"
      : phase === "ready"
        ? lastBreathSec !== null && gated
          ? `Breath heard (${lastBreathSec.toFixed(1)} s). Now sing one easy note.`
          : "Now sing one easy note."
        : phase === "holding"
          ? `Keep it going for ${holdSec} seconds.`
          : phase === "rest"
            ? "Let the air go. Next rep in a moment."
            : "";

  return (
    <SessionShell
      title="Breathe and sing"
      subtitle={phase === "setup" ? undefined : `Rep ${Math.min(reps, done + 1)} of ${reps}`}
      progress={(done / reps) * 100}
      onClose={close}
      closeLabel="End drill"
      bottom={
        <div className="flex items-center justify-center gap-3">
          <SessionButton label="End" onClick={close} tone="danger">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <rect x="6" y="6" width="12" height="12" rx="2" />
            </svg>
          </SessionButton>
        </div>
      }
    >
      {!listening ? (
        <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-5 px-5 py-6 text-center">
          <h2 className="font-display text-3xl">Breathe and sing</h2>
          <p className="max-w-sm text-sm text-[var(--s-mut)]">
            Breathe in, then sing one easy note for {holdSec} seconds. Each
            note counts once the mic has heard the breath before it.
          </p>
          <p className="text-xs text-[var(--s-dim)]">{MIC_PRIVACY}</p>
          <button
            type="button"
            onClick={() => {
              void start();
            }}
            className="min-h-11 rounded-full bg-[var(--s-ok)] px-8 text-base font-medium text-[oklch(0.15_0.02_155)] transition-[filter] hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--s-amber)]"
          >
            {error ? "Try again" : "Enable microphone"}
          </button>
          {error && (
            <p role="alert" className="max-w-sm text-sm text-[var(--s-rec)]">
              {error}
            </p>
          )}
        </div>
      ) : phase === "setup" ? (
        <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-6 px-5 py-6 text-center">
          <p className="max-w-sm text-sm text-[var(--s-mut)]">
            Breathe in, then sing one easy note for {holdSec} seconds. Let the
            air go, and do it again. The mic listens for each breath before the
            note counts.
          </p>
          <div className="flex flex-col items-center gap-2">
            <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-[var(--s-dim)]">
              Reps
            </span>
            <div className="flex gap-2" role="group" aria-label="Reps">
              {CUE_REP_CHOICES.map((n) => (
                <button
                  key={n}
                  type="button"
                  aria-pressed={reps === n}
                  onClick={() => setReps(n)}
                  className={`tabular min-h-11 min-w-11 rounded-full border px-4 font-mono transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--s-amber)] ${
                    reps === n
                      ? "border-[var(--s-voice)] text-[var(--s-voice)]"
                      : "border-[var(--s-line2)] text-[var(--s-mut)] hover:bg-[var(--s-over)]"
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
          <button
            type="button"
            onClick={begin}
            className="min-h-11 rounded-full bg-[var(--s-ok)] px-8 text-base font-medium text-[oklch(0.15_0.02_155)] transition-[filter] hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--s-amber)]"
          >
            Begin
          </button>
        </div>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-5 px-5 py-4 text-center">
          <div className="font-display text-[clamp(1.75rem,5vw,2.5rem)] leading-none">{word}</div>
          <div
            className="tabular font-mono text-[clamp(3rem,14vw,6rem)] leading-none text-[var(--s-voice)]"
            aria-live="off"
          >
            {held.toFixed(1)}
            <span className="ml-1 text-[0.3em] text-[var(--s-dim)]">/ {holdSec}s</span>
          </div>
          <div className="flex gap-2" aria-label={`${done} of ${reps} reps done`} role="img">
            {Array.from({ length: reps }, (_, i) => (
              <span
                key={i}
                className={`h-2.5 w-2.5 rounded-full ${
                  i < done ? "bg-[var(--s-ok)]" : "bg-[var(--s-over)]"
                }`}
              />
            ))}
          </div>
          <div className="w-full max-w-md">
            <LevelMeter volume={frame.volume} threshold={threshold} tone="session" />
          </div>
          <p
            className="min-h-[2.5rem] max-w-sm text-sm text-[var(--s-mut)]"
            role="status"
            aria-live="polite"
          >
            {status}
          </p>
          {phase === "breath" && gated && (
            <BreathGatePanel
              tone="session"
              inhaling={breath.inhaling}
              stale={stale}
              onFallback={() => {
                setGated(false);
                setPhase("ready");
              }}
            />
          )}
          <div className="w-full max-w-md text-left">
            <label
              htmlFor="cue-sensitivity"
              className="font-mono text-[11px] uppercase tracking-[0.14em] text-[var(--s-dim)]"
            >
              Sensitivity: the note counts above the marker
            </label>
            <input
              id="cue-sensitivity"
              type="range"
              min={0.005}
              max={0.05}
              step={0.005}
              value={threshold}
              onChange={(e) => setThreshold(Number(e.target.value))}
              className="mt-1 h-11 w-full accent-[var(--s-voice)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--s-amber)]"
            />
          </div>
        </div>
      )}
    </SessionShell>
  );
}
