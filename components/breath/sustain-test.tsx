"use client";

import { useEffect, useRef, useState } from "react";
import { usePitch, type UsePitchResult } from "@/lib/audio/use-pitch";
import { useBreathDetect } from "@/lib/audio/use-breath-detect";
import { STALE_FRAME_MS } from "@/lib/audio/frame-clock";
import { logSession, type Achievement, type LogResult } from "@/lib/progress";
import { MicGate } from "@/components/ui";
import { SessionAudioSetup } from "@/components/practice/session-audio-setup";
import { SessionButton, SessionShell } from "@/components/practice/session-shell";
import { useStepCloseLabel } from "@/components/practice/step-intro";
import { recordAttempt, recordBreathBest } from "./store";
import {
  BREATH_FALLBACK_SEC,
  SUSTAIN_ATTEMPT_MIN_SEC,
  SUSTAIN_LOG_MIN_SEC,
  type BreathDrillResult,
} from "./routines";
import { BreathGatePanel } from "./breath-gate";

/**
 * `breath` waits for the mic to hear an inhale before the attempt arms. It is
 * skipped once the singer starts without breath detection.
 */
type Phase = "idle" | "breath" | "armed" | "running" | "done";

const SILENCE_MS = 700;
// Allow ordinary scheduling hitches, but never bridge a whole silence window
// plus the shared analysis-frame freshness allowance without an observation.
const MAX_HOLD_GAP_MS = SILENCE_MS + STALE_FRAME_MS;
const METER_SEGS = 28;
/** How long the between-attempts card holds before the next attempt arms itself. */
const NEXT_ATTEMPT_MS = 3000;

/** Volume mapped for the meter with a sqrt curve; ~0.3 RMS pins the strip. */
function meterNorm(v: number) {
  return Math.min(1, Math.sqrt(Math.max(0, v) / 0.3));
}

/** The input level on the dark session surface, with the detector's threshold marked. */
export function LevelMeter({ volume, threshold }: { volume: number; threshold: number }) {
  const lit = Math.round(meterNorm(volume) * METER_SEGS);
  const thPct = meterNorm(threshold) * 100;
  const off = "bg-[var(--s-over)]";
  const hot = "bg-[var(--s-rec)]";
  const mid = "bg-[var(--s-accent)]";
  const low = "bg-[var(--s-ok)]";
  return (
    <div className="relative">
      <div className="flex h-4 items-stretch gap-[3px]" aria-hidden="true">
        {Array.from({ length: METER_SEGS }, (_, i) => {
          const on = i < lit;
          const color =
            i >= METER_SEGS * 0.85 ? hot : i >= METER_SEGS * 0.6 ? mid : low;
          return (
            <div
              key={i}
              className={`flex-1 rounded-[2px] ${on ? color : off}`}
            />
          );
        })}
      </div>
      {/* threshold marker */}
      <div
        aria-hidden="true"
        className="absolute -bottom-1.5 -top-1.5 w-px bg-[var(--s-amber)]"
        style={{ left: `${thPct}%` }}
      />
      <span className="sr-only">
        Input level {Math.round(meterNorm(volume) * 100)} percent
      </span>
    </div>
  );
}

interface AttemptResult {
  sec: number;
  steadiness: number;
  logged: LogResult | null;
  /** The inhale heard before this hold, in seconds; null when none was asked for. */
  inhaleSec: number | null;
}

/** "18.4 s", and the breath before it when one was heard. */
function holdLabel(a: AttemptResult): string {
  const held = `${a.sec.toFixed(1)} s`;
  return a.inhaleSec === null ? held : `${held} · ${a.inhaleSec.toFixed(1)} s breath in`;
}

/**
 * The line a finished step reports: its longest hold, and, when no attempt
 * reached SUSTAIN_LOG_MIN_SEC, that nothing was logged. A single sustain of
 * 4.7 s used to end on "Session complete · 93%" with +0 XP and no reason.
 */
export function stepHoldLabel(
  best: { sec: number; inhaleSec: number | null } | null,
  logged: boolean,
): string {
  if (best === null) return "0.0 s";
  const line = holdLabel({ ...best, steadiness: 0, logged: null });
  return logged || best.sec < SUSTAIN_ATTEMPT_MIN_SEC
    ? line
    : `${line} · under ${SUSTAIN_LOG_MIN_SEC} s, not logged`;
}

/** Fold a step's attempts (each logged on its own) into one result: XP summed, achievements deduped by id. */
function foldAttempts(all: AttemptResult[]): LogResult | null {
  const logs = all.map((a) => a.logged).filter((l): l is LogResult => l !== null);
  if (logs.length === 0) return null;
  const seen = new Set<string>();
  const newAchievements: Achievement[] = [];
  for (const l of logs) {
    for (const a of l.newAchievements) {
      if (seen.has(a.id)) continue;
      seen.add(a.id);
      newAchievements.push(a);
    }
  }
  return {
    xpGained: logs.reduce((a, l) => a + l.xpGained, 0),
    newAchievements,
    state: logs[logs.length - 1].state,
  };
}

export function SustainTest({
  pitch,
  preset,
  onComplete,
  onExit,
}: {
  /** The room's microphone, when it holds one; the step opens its own otherwise. */
  pitch?: UsePitchResult;
  /** How many attempts this step asks for. */
  preset?: { attempts: number };
  /** The whole step, every attempt folded into one row. */
  onComplete: (result: BreathDrillResult) => void;
  /** Leaving with nothing held — there is nothing to report. */
  onExit: () => void;
}) {
  const closeLabel = useStepCloseLabel("Exit drill");
  // usePitch opens no stream until start(): a lent mic costs nothing here.
  const ownPitch = usePitch();
  const mic = pitch ?? ownPitch;
  const { frame, listening, error, start } = mic;

  const attemptsTarget = Math.max(1, preset?.attempts ?? 1);
  const [phase, setPhase] = useState<Phase>("idle");
  const [threshold, setThreshold] = useState(0.015);
  const [elapsed, setElapsed] = useState(0);
  const [result, setResult] = useState<AttemptResult | null>(null);
  const [doneCount, setDoneCount] = useState(0);
  /**
   * Whether an attempt waits for the mic to hear a breath first. On by
   * default; the fallback turns it off for the rest of the drill, because a
   * mic that could not hear one breath will not hear the next.
   */
  const [gated, setGated] = useState(true);
  const [breathStale, setBreathStale] = useState(false);
  const [visible, setVisible] = useState(true);
  const available = listening && visible;
  const breath = useBreathDetect(mic, gated && visible);

  const startRef = useRef(0);
  const lastLoudRef = useRef(0);
  const lastFrameRef = useRef(0);
  const samplesRef = useRef<number[]>([]);
  const attemptsRef = useRef<AttemptResult[]>([]);
  const finishedRef = useRef(false);
  /** When the current attempt started listening for a breath, on the frame clock. */
  const breathSinceRef = useRef(0);
  /** The inhale that opened this attempt, in seconds, once one has. */
  const [heardSec, setHeardSec] = useState<number | null>(null);

  const completeRef = useRef(onComplete);
  useEffect(() => {
    completeRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    const onVisibility = () => setVisible(document.visibilityState !== "hidden");
    onVisibility();
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  /** Hand the whole step back — every attempt so far, folded into one row. */
  const completeStep = () => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    const all = attemptsRef.current;
    const bestAttempt = all.reduce<AttemptResult | null>(
      (m, a) => (m === null || a.sec > m.sec ? a : m),
      null,
    );
    const best = bestAttempt?.sec ?? 0;
    const scored = all.filter((a) => a.sec >= 1);
    const score = scored.length
      ? Math.round(scored.reduce((a, b) => a + b.steadiness, 0) / scored.length)
      : null;
    const logged = foldAttempts(all);
    completeRef.current({
      durationSec: all.reduce((a, b) => a + b.sec, 0),
      score,
      logged,
      label: stepHoldLabel(bestAttempt, logged !== null),
      best,
    });
  };

  /** Start an attempt: listen for the breath first, unless that is switched off. */
  const arm = (withGate = gated) => {
    startRef.current = 0;
    lastLoudRef.current = 0;
    lastFrameRef.current = 0;
    samplesRef.current = [];
    setElapsed(0);
    setResult(null);
    setBreathStale(false);
    setHeardSec(null);
    breathSinceRef.current = performance.now();
    setPhase(withGate ? "breath" : "armed");
  };

  /** The fallback: this mic or room is not carrying the breath, so time on sound alone. */
  const startWithoutBreath = () => {
    setGated(false);
    arm(false);
  };

  // If the mic disappears or the tab hides mid-attempt, discard only that
  // unfinished hold. Adjusted during render (guarded by prevAvailable) rather than in an effect, per
  // https://react.dev/learn/you-might-not-need-an-effect#adjusting-some-state-when-a-prop-changes
  const [prevAvailable, setPrevAvailable] = useState(available);
  if (available !== prevAvailable) {
    setPrevAvailable(available);
    if (!available && (phase === "breath" || phase === "armed" || phase === "running")) {
      setPhase("idle");
      setElapsed(0);
    }
  }

  // The step arms itself the moment the mic is live: the "Enable microphone" press is the start.
  useEffect(() => {
    if (finishedRef.current) return;
    if (available && phase === "idle") {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- arming follows the mic stream going live, which is not a render-derivable value
      arm();
    }
    // `arm` reads only state this effect already re-runs on.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [available, phase]);

  // The gate: an inhale heard since this attempt started listening arms it.
  // One heard earlier — during the last hold's result card, say — does not.
  const latest = mic.latest;
  useEffect(() => {
    const heard = breath.lastInhale;
    if (!available || phase !== "breath" || !heard || heard.endMs < breathSinceRef.current) return;
    const now = latest.current;
    // Hiss confirmation may arrive on the first frame after an unobserved gap.
    // Reject its old split before it can backdate the start of this attempt.
    if (lastFrameRef.current > 0 && now.t - lastFrameRef.current > MAX_HOLD_GAP_MS) {
      breathSinceRef.current = now.t;
      return;
    }
    setHeardSec(Math.round(heard.durationSec * 10) / 10);
    if (heard.endedByHiss && now.volume > threshold) {
      // The breath ran straight into the hiss, which has been sounding since
      // the split — reported a moment after it, once the hiss had held. The
      // hold is timed from the split, not from the report.
      startRef.current = heard.endMs;
      lastLoudRef.current = now.t;
      samplesRef.current = [now.volume];
      // eslint-disable-next-line react-hooks/set-state-in-effect -- the inhale is an event from the mic stream, not render-derivable state
      setElapsed(Math.max(0, (now.t - heard.endMs) / 1000));
      setPhase("running");
      return;
    }
    setPhase("armed");
    // `threshold` is read at the moment the gate opens, not watched.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [breath.lastInhale, phase, latest, available]);

  // Some mics and rooms never carry a breath. After a fair wait, say so and
  // put the way round it first, rather than leaving the singer breathing at a
  // screen that is not going to answer.
  useEffect(() => {
    if (!available || phase !== "breath") return;
    const id = window.setTimeout(() => setBreathStale(true), BREATH_FALLBACK_SEC * 1000);
    return () => window.clearTimeout(id);
  }, [phase, doneCount, available]);

  // Between attempts of a multi-attempt step: read the last figure, then the
  // next attempt arms itself, the way the routine's own steps do.
  const moreToDo = doneCount > 0 && doneCount < attemptsTarget;
  useEffect(() => {
    if (!available || !moreToDo || phase !== "done") return;
    const id = window.setTimeout(() => arm(), NEXT_ATTEMPT_MS);
    return () => window.clearTimeout(id);
    // `arm` reads `gated`, which only the fallback changes, and never mid-card.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [moreToDo, phase, available]);

  // Attempt state machine, driven by pitch frames (one per animation frame).
  // This is a subscription to an external, continuously-updating signal
  // (mic frames), not a derivable render value — genuinely effect-shaped.
  useEffect(() => {
    if (!available) return;
    const now = frame.t;
    if (now === 0 || now < breathSinceRef.current) return;
    const previous = lastFrameRef.current;
    lastFrameRef.current = now;
    if (phase === "breath") {
      // Cover frame-first delivery too, without restarting the gate's timer.
      if (previous > 0 && now - previous > MAX_HOLD_GAP_MS) breathSinceRef.current = now;
      return;
    }
    if (phase !== "armed" && phase !== "running") return;
    if (previous > 0 && now - previous > MAX_HOLD_GAP_MS) {
      arm();
      return;
    }
    const v = frame.volume;

    if (phase === "armed") {
      if (v > threshold) {
        startRef.current = now;
        lastLoudRef.current = now;
        samplesRef.current = [v];
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setElapsed(0);
        setPhase("running");
      }
      return;
    }

    // running
    if (v > threshold) {
      lastLoudRef.current = now;
      samplesRef.current.push(v);
    }
    const sec = Math.max(0, (lastLoudRef.current - startRef.current) / 1000);
    setElapsed(sec);

    if (now - lastLoudRef.current > SILENCE_MS) {
      // finished — compute steadiness from volume consistency
      const s = samplesRef.current;
      let steadiness = 0;
      if (s.length > 4) {
        const mean = s.reduce((a, b) => a + b, 0) / s.length;
        const variance =
          s.reduce((a, b) => a + (b - mean) * (b - mean), 0) / s.length;
        const cv = mean > 0 ? Math.sqrt(variance) / mean : 1;
        steadiness = Math.round(Math.max(0, Math.min(100, 100 * (1 - cv))));
      }
      const secFinal = Math.round(sec * 10) / 10;
      let logged: LogResult | null = null;
      if (secFinal >= SUSTAIN_ATTEMPT_MIN_SEC) {
        recordAttempt(secFinal, steadiness);
        recordBreathBest({ sustainSec: secFinal });
      }
      if (secFinal >= SUSTAIN_LOG_MIN_SEC) {
        logged = logSession({
          type: "breath",
          durationSec: secFinal,
          score: steadiness,
          detail: "Sustain test",
        });
      }
      const attempt: AttemptResult = {
        sec: secFinal,
        steadiness,
        logged,
        inhaleSec: heardSec,
      };
      attemptsRef.current = [...attemptsRef.current, attempt];
      setResult(attempt);
      setDoneCount(attemptsRef.current.length);
      setPhase("done");
      if (attemptsRef.current.length >= attemptsTarget) completeStep();
    }
    // `completeStep` and `attemptsTarget` are stable for the life of a step;
    // adding them would re-run this subscription on every parent render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [frame, phase, threshold, available]);

  const closeSession = () => {
    if (attemptsRef.current.length > 0) completeStep();
    else onExit();
  };
  const shown = phase === "done" && result ? result.sec : elapsed;

  return (
    <SessionShell
      title="Sustain test"
      subtitle={
        attemptsTarget > 1
          ? `Attempt ${Math.min(attemptsTarget, doneCount + (phase === "done" ? 0 : 1))} of ${attemptsTarget}`
          : undefined
      }
      progress={(doneCount / attemptsTarget) * 100}
      onClose={closeSession}
      closeLabel={closeLabel}
      bottom={
        <div className="flex items-center justify-center gap-3">
          <SessionButton label="End" onClick={closeSession} tone="danger">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <rect x="6" y="6" width="12" height="12" rx="2" />
            </svg>
          </SessionButton>
        </div>
      }
    >
      {!listening ? (
        <MicGate
          tone="session"
          audioSetup={<SessionAudioSetup />}
          title="Sustain test"
          description="Breathe in, then sing or hiss one steady note for as long as it stays easy. The mic listens for your breath before it starts timing, and stops when the sound stops. End the note when it starts to tighten, before the last of your air."
          onEnable={() => {
            void start();
          }}
          error={error}
        />
      ) : (
        <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-5 px-5 py-4 text-center">
          <div className="font-display text-[clamp(1.75rem,5vw,2.5rem)] leading-none">
            {phase === "running"
              ? "Hold"
              : phase === "done"
                ? "Breathe"
                : phase === "breath"
                  ? "Breathe in"
                  : heardSec !== null
                    ? "Sing"
                    : "Ready"}
          </div>
          <div
            className="tabular font-mono text-[clamp(3.5rem,17vw,7rem)] leading-none text-[var(--s-voice)]"
            aria-live="off"
          >
            {shown.toFixed(1)}
            <span className="ml-1 text-[0.3em] text-[var(--s-dim)]">s</span>
          </div>

          <div className="w-full max-w-md">
            <LevelMeter volume={frame.volume} threshold={threshold} />
          </div>

          <p
            className="min-h-[2.5rem] max-w-sm text-sm text-[var(--s-mut)]"
            role="status"
            aria-live="polite"
          >
            {phase === "breath"
              ? "Take a low, easy breath in. The attempt starts once the mic hears it."
              : phase === "armed"
                ? heardSec !== null
                  ? `Breath heard (${heardSec.toFixed(1)} s). Now hold one even “sss” or “ahh”.`
                  : "Take a low, easy breath, then hold one even “sss” or “ahh”."
                : phase === "running"
                  ? "Keep it steady. The timer stops after a moment of silence."
                  : result
                    ? `${result.steadiness}% steady${
                        result.inhaleSec !== null
                          ? ` · ${result.inhaleSec.toFixed(1)} s breath in`
                          : ""
                      }${
                        moreToDo
                          ? ` · attempt ${doneCount + 1} of ${attemptsTarget} coming up`
                          : ""
                      }`
                    : "Listening."}
          </p>

          {phase === "breath" && (
            <BreathGatePanel
              inhaling={breath.inhaling}
              stale={breathStale}
              onFallback={startWithoutBreath}
            />
          )}

          <div className="w-full max-w-md text-left">
            <label
              htmlFor="sustain-sensitivity-session"
              className="font-mono text-[11px] uppercase tracking-[0.14em] text-[var(--s-dim)]"
            >
              Sensitivity: the timer runs above the marker
            </label>
            <input
              id="sustain-sensitivity-session"
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
