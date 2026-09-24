"use client";

import { useEffect, useRef, useState } from "react";
import { usePitch, type UsePitchResult } from "@/lib/audio/use-pitch";
import { useBreathDetect } from "@/lib/audio/use-breath-detect";
import { logSession, type Achievement, type LogResult } from "@/lib/progress";
import { Button, Card, MicGate, MIC_PRIVACY, Pill, Stat } from "@/components/ui";
import { ProInlineNudge, ProWhisper } from "@/components/pro/gate";
import { SessionButton, SessionShell } from "@/components/practice/session-shell";
import {
  loadBreath,
  recordAttempt,
  recordBreathBest,
  type BreathData,
} from "./store";
import { RewardNote } from "./reward";
import {
  BREATH_FALLBACK_SEC,
  SUSTAIN_ATTEMPT_MIN_SEC,
  SUSTAIN_BENCHMARKS_SEC,
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
const METER_SEGS = 28;
/** How long the between-attempts card holds before the next attempt arms itself. */
const NEXT_ATTEMPT_MS = 3000;

/** Volume mapped for the meter with a sqrt curve; ~0.3 RMS pins the strip. */
function meterNorm(v: number) {
  return Math.min(1, Math.sqrt(Math.max(0, v) / 0.3));
}

export function LevelMeter({
  volume,
  threshold,
  tone = "page",
}: {
  volume: number;
  threshold: number;
  /** The session surface is dark and takes the scoped tokens instead. */
  tone?: "page" | "session";
}) {
  const lit = Math.round(meterNorm(volume) * METER_SEGS);
  const thPct = meterNorm(threshold) * 100;
  const session = tone === "session";
  const off = session ? "bg-[var(--s-over)]" : "bg-panel2";
  const hot = session ? "bg-[var(--s-rec)]" : "bg-rec";
  const mid = session ? "bg-[var(--s-accent)]" : "bg-violet";
  const low = session ? "bg-[var(--s-ok)]" : "bg-ok";
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
        className={`absolute -bottom-1.5 -top-1.5 w-px ${
          session ? "bg-[var(--s-amber)]" : "bg-violet/70"
        }`}
        style={{ left: `${thPct}%` }}
      />
      <span className="sr-only">
        Input level {Math.round(meterNorm(volume) * 100)} percent
      </span>
    </div>
  );
}

function AttemptsChart({ data }: { data: BreathData }) {
  const W = 340;
  const H = 130;
  const padT = 12;
  const padB = 20;
  const innerH = H - padT - padB;
  const attempts = [...data.attempts].reverse(); // oldest → newest
  const max = Math.max(45, data.bestSec) * 1.15;
  const y = (sec: number) => padT + innerH - (sec / max) * innerH;
  const slot = W / 10;
  const marks = [10, 20, 30, 45].filter((m) => m < max);
  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="w-full"
      role="img"
      aria-label={`Last ${attempts.length} sustain attempts. Best ${data.bestSec.toFixed(1)} seconds.`}
    >
      {marks.map((m) => (
        <g key={m}>
          <line
            x1={0}
            x2={W}
            y1={y(m)}
            y2={y(m)}
            stroke="var(--color-line)"
            strokeWidth={1}
          />
          <text
            x={2}
            y={y(m) - 3}
            fill="var(--color-dim)"
            fontSize={8}
            fontFamily="var(--font-mono, monospace)"
          >
            {m}s
          </text>
        </g>
      ))}
      {attempts.map((a, i) => (
        <rect
          key={i}
          x={i * slot + slot * 0.22}
          y={y(a.sec)}
          width={slot * 0.56}
          height={Math.max(2, padT + innerH - y(a.sec))}
          rx={3}
          fill="var(--color-cool)"
          opacity={i === attempts.length - 1 ? 1 : 0.55}
        />
      ))}
      {data.bestSec > 0 && (
        <g>
          <line
            x1={0}
            x2={W}
            y1={y(data.bestSec)}
            y2={y(data.bestSec)}
            stroke="var(--color-violet)"
            strokeWidth={1}
            strokeDasharray="4 3"
          />
          <text
            x={W - 2}
            y={y(data.bestSec) - 3}
            textAnchor="end"
            fill="var(--color-violet)"
            fontSize={8}
            fontFamily="var(--font-mono, monospace)"
          >
            best {data.bestSec.toFixed(1)}s
          </text>
        </g>
      )}
      <line
        x1={0}
        x2={W}
        y1={padT + innerH}
        y2={padT + innerH}
        stroke="var(--color-line2)"
        strokeWidth={1}
      />
      <text
        x={2}
        y={H - 6}
        fill="var(--color-dim)"
        fontSize={8}
        fontFamily="var(--font-mono, monospace)"
      >
        oldest
      </text>
      <text
        x={W - 2}
        y={H - 6}
        textAnchor="end"
        fill="var(--color-dim)"
        fontSize={8}
        fontFamily="var(--font-mono, monospace)"
      >
        latest
      </text>
    </svg>
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
 * Fold a set of attempts into the one result a step reports.
 *
 * Each attempt over five seconds logs its own practice session — that rule is
 * older than routines and stays — so a three-attempt step produces up to three
 * `LogResult`s, and the results screen wants one number for XP. The union of
 * the achievements is deduped by id because two attempts in a row can each
 * report the same freshly unlocked badge only if the first one didn't save,
 * and the last state is the newest.
 */
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
  autoStart = false,
  onComplete,
  onExit,
  variant = "page",
}: {
  /**
   * The room's microphone, when it owns one. A routine runs the sustain step
   * after two silent drills, and re-opening the input stream between steps is
   * both a permission prompt in some browsers and a second's dead air in all
   * of them, so the room holds the mic and lends it to the step.
   */
  pitch?: UsePitchResult;
  /** How many attempts this step asks for. */
  preset?: { attempts: number };
  /** Arm the first attempt as soon as the mic is listening. */
  autoStart?: boolean;
  /** Report the step instead of drawing a per-attempt result card. */
  onComplete?: (result: BreathDrillResult) => void;
  /** Leaving with nothing held — there is nothing to report. */
  onExit?: () => void;
  variant?: "page" | "session";
}) {
  // `usePitch` opens no stream until start() is called, so the fallback costs a
  // few pieces of idle state and nothing else. Hooks cannot be conditional.
  const ownPitch = usePitch();
  const mic = pitch ?? ownPitch;
  const { frame, listening, error, start, stop } = mic;

  const attemptsTarget = Math.max(1, preset?.attempts ?? 1);
  const [phase, setPhase] = useState<Phase>("idle");
  const [threshold, setThreshold] = useState(0.015);
  const [elapsed, setElapsed] = useState(0);
  const [data, setData] = useState<BreathData | null>(null);
  const [result, setResult] = useState<AttemptResult | null>(null);
  const [doneCount, setDoneCount] = useState(0);
  /**
   * Whether an attempt waits for the mic to hear a breath first. On by
   * default; the fallback turns it off for the rest of the drill, because a
   * mic that could not hear one breath will not hear the next.
   */
  const [gated, setGated] = useState(true);
  const [breathStale, setBreathStale] = useState(false);
  const breath = useBreathDetect(mic, gated);

  const startRef = useRef(0);
  const lastLoudRef = useRef(0);
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
    // Deliberately deferred to an effect: reading localStorage during the
    // lazy initializer would return real attempts on the client but null on
    // the server, causing a hydration mismatch on this route's SSR-prerendered
    // HTML shell.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setData(loadBreath());
  }, []);

  /** Hand the whole step back — every attempt so far, folded into one row. */
  const completeStep = () => {
    const done = completeRef.current;
    if (!done || finishedRef.current) return;
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
    done({
      durationSec: all.reduce((a, b) => a + b.sec, 0),
      score,
      logged: foldAttempts(all),
      label: bestAttempt ? holdLabel(bestAttempt) : "0.0 s",
      best,
    });
  };

  /** Start an attempt: listen for the breath first, unless that is switched off. */
  const arm = (withGate = gated) => {
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

  // If the mic is turned off mid-attempt, drop back to idle cleanly. Adjusted
  // during render (guarded by prevListening) rather than in an effect, per
  // https://react.dev/learn/you-might-not-need-an-effect#adjusting-some-state-when-a-prop-changes
  const [prevListening, setPrevListening] = useState(listening);
  if (listening !== prevListening) {
    setPrevListening(listening);
    if (!listening && (phase === "breath" || phase === "armed" || phase === "running")) {
      setPhase("idle");
      setElapsed(0);
    }
  }

  // A routine step arms itself the moment the mic is live — there is nothing to
  // set up on this drill, and a "Start attempt" button between two auto-running
  // drills is a stop the routine did not need. The session surface has no such
  // button at all, so there the "Enable microphone" press is the start.
  const selfArming = autoStart || variant === "session";
  useEffect(() => {
    if (!selfArming || finishedRef.current) return;
    if (listening && phase === "idle") {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- arming follows the mic stream going live, which is not a render-derivable value
      arm();
    }
    // `arm` reads only state this effect already re-runs on.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selfArming, listening, phase]);

  // The gate: an inhale heard since this attempt started listening arms it.
  // One heard earlier — during the last hold's result card, say — does not.
  const latest = mic.latest;
  useEffect(() => {
    const heard = breath.lastInhale;
    if (phase !== "breath" || !heard || heard.endMs < breathSinceRef.current) return;
    setHeardSec(Math.round(heard.durationSec * 10) / 10);
    const now = latest.current;
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
  }, [breath.lastInhale, phase, latest]);

  // Some mics and rooms never carry a breath. After a fair wait, say so and
  // put the way round it first, rather than leaving the singer breathing at a
  // screen that is not going to answer.
  useEffect(() => {
    if (phase !== "breath") return;
    const id = window.setTimeout(() => setBreathStale(true), BREATH_FALLBACK_SEC * 1000);
    return () => window.clearTimeout(id);
  }, [phase, doneCount]);

  // Between attempts of a multi-attempt step: read the last figure, then the
  // next attempt arms itself, the way the routine's own steps do.
  const moreToDo = !!onComplete && doneCount > 0 && doneCount < attemptsTarget;
  useEffect(() => {
    if (!moreToDo || phase !== "done") return;
    const id = window.setTimeout(() => arm(), NEXT_ATTEMPT_MS);
    return () => window.clearTimeout(id);
    // `arm` reads `gated`, which only the fallback changes, and never mid-card.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [moreToDo, phase]);

  // Attempt state machine, driven by pitch frames (one per animation frame).
  // This is a subscription to an external, continuously-updating signal
  // (mic frames), not a derivable render value — genuinely effect-shaped.
  useEffect(() => {
    if (phase !== "armed" && phase !== "running") return;
    const v = frame.volume;
    const now = frame.t;
    if (now === 0) return;

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
        setData(recordAttempt(secFinal, steadiness));
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
      if (completeRef.current && attemptsRef.current.length >= attemptsTarget) {
        completeStep();
      }
    }
    // `completeStep` and `attemptsTarget` are stable for the life of a step;
    // adding them would re-run this subscription on every parent render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [frame, phase, threshold]);

  const benchmark = (sec: number) =>
    sec >= SUSTAIN_BENCHMARKS_SEC.excellent
      ? "excellent"
      : sec >= SUSTAIN_BENCHMARKS_SEC.strong
        ? "strong"
        : sec >= SUSTAIN_BENCHMARKS_SEC.good
          ? "good"
          : sec >= SUSTAIN_BENCHMARKS_SEC.fair
            ? "fair"
            : "keep at it";

  /* ---------------------------------------------------------------- *
   * Session — the full-screen dark surface.
   * ---------------------------------------------------------------- */
  if (variant === "session") {
    const closeSession = () => {
      if (attemptsRef.current.length > 0 && completeRef.current) completeStep();
      else onExit?.();
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
        closeLabel="End drill"
        bottom={
          <div className="flex items-center justify-center gap-3">
            {phase === "done" && !moreToDo && !onComplete && (
              <SessionButton label="Again" onClick={() => arm()}>
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
                  <path d="M20 11a8 8 0 1 0-2.3 5.7" />
                  <path d="M20 5v6h-6" />
                </svg>
              </SessionButton>
            )}
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
        {!listening ? (
          <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-5 px-5 py-6 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full border border-[var(--s-line2)] bg-[var(--s-elev)] text-[var(--s-voice)]">
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
                aria-hidden="true"
              >
                <rect x="9" y="3" width="6" height="11" rx="3" />
                <path d="M5 11a7 7 0 0 0 14 0" />
                <path d="M12 18v3" />
              </svg>
            </div>
            <h2 className="font-display text-3xl">Sustain test</h2>
            <p className="max-w-sm text-sm text-[var(--s-mut)]">
              Breathe in, then sing or hiss one steady note for as long as you
              can. The mic listens for your breath before it starts timing, and
              stops when you run out of air.
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
              <LevelMeter
                volume={frame.volume}
                threshold={threshold}
                tone="session"
              />
            </div>

            <p
              className="min-h-[2.5rem] max-w-sm text-sm text-[var(--s-mut)]"
              role="status"
              aria-live="polite"
            >
              {phase === "breath"
                ? "Take a full breath in. The attempt starts once the mic hears it."
                : phase === "armed"
                  ? heardSec !== null
                    ? `Breath heard (${heardSec.toFixed(1)} s). Now hold one even “sss” or “ahh”.`
                    : "Take a full breath, then hold one even “sss” or “ahh”."
                  : phase === "running"
                    ? "Keep it steady. The timer stops after a moment of silence."
                    : result
                      ? `${result.steadiness}% steady · ${benchmark(result.sec)}${
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
                tone="session"
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
                Sensitivity — the timer runs above the marker
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

  /* ---------------------------------------------------------------- *
   * Page — the drill exactly as the room has always shown it.
   * ---------------------------------------------------------------- */

  // ---- Mic gate ----
  if (!listening) {
    return (
      <MicGate
        title="Sustain test"
        description="Breathe in, then sing or hiss one steady note for as long as you can. The mic listens for your breath before it starts timing, and stops when you run out of air."
        onEnable={() => {
          void start();
        }}
        error={error}
        footer={<ProWhisper />}
      />
    );
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
      <Card>
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-xl">Sustain test</h3>
          <div className="flex items-center gap-2">
            {phase === "running" ? (
              <Pill tone="rec">
                <span className="h-1.5 w-1.5 rounded-full bg-rec animate-recblink" />
                sustaining
              </Pill>
            ) : phase === "armed" ? (
              <Pill tone="violet">waiting for sound</Pill>
            ) : phase === "breath" ? (
              <Pill tone="cool">{breath.inhaling ? "inhale heard" : "listening for breath"}</Pill>
            ) : (
              <Pill tone="ok">mic ready</Pill>
            )}
            <Button size="sm" variant="ghost" onClick={() => stop()}>
              Mic off
            </Button>
          </div>
        </div>

        <div className="mt-6 flex flex-col items-center gap-5">
          <div
            className="tabular font-mono text-6xl text-ink sm:text-7xl"
            aria-live="off"
          >
            {(phase === "done" && result ? result.sec : elapsed).toFixed(1)}
            <span className="ml-1 text-2xl text-dim">s</span>
          </div>

          <div className="w-full max-w-md">
            <LevelMeter volume={frame.volume} threshold={threshold} />
          </div>

          {phase === "idle" && (
            <>
              <p className="max-w-sm text-center text-sm text-mut">
                Press start and take a full breath. Once the mic hears it, hold
                one even &ldquo;sss&rdquo; or &ldquo;ahh&rdquo;. Stopping for a
                moment ends the attempt.
              </p>
              <Button variant="violet" size="lg" onClick={() => arm()}>
                Start attempt
              </Button>
            </>
          )}

          {(phase === "breath" || phase === "armed" || phase === "running") && (
            <>
              <p
                className="text-center text-sm text-mut"
                role="status"
                aria-live="polite"
              >
                {phase === "breath"
                  ? "Breathe in — the attempt starts once the mic hears it."
                  : phase === "armed"
                    ? heardSec !== null
                      ? `Breath heard (${heardSec.toFixed(1)} s) — begin whenever you're ready.`
                      : "Listening — begin whenever you're ready."
                    : "Keep it steady. The timer stops after a moment of silence."}
              </p>
              {phase === "breath" && (
                <BreathGatePanel
                  tone="page"
                  inhaling={breath.inhaling}
                  stale={breathStale}
                  onFallback={startWithoutBreath}
                />
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setPhase("idle");
                  setElapsed(0);
                }}
              >
                Cancel
              </Button>
            </>
          )}

          {phase === "done" && result && (
            <div className="flex w-full flex-col items-center gap-3">
              <div className="flex items-center gap-4">
                <Stat
                  label="Held for"
                  value={`${result.sec.toFixed(1)}s`}
                  sub={benchmark(result.sec)}
                  tone="violet"
                />
                <Stat
                  label="Steadiness"
                  value={`${result.steadiness}%`}
                  sub="volume consistency"
                  tone="cool"
                />
                {result.inhaleSec !== null && (
                  <Stat
                    label="Breath in"
                    value={`${result.inhaleSec.toFixed(1)}s`}
                    sub="heard before the hold"
                  />
                )}
              </div>
              {result.logged ? (
                <RewardNote result={result.logged} />
              ) : (
                <p className="text-xs text-dim">
                  Attempts of 5 seconds or more are logged for XP.
                </p>
              )}
              <Button variant="violet" onClick={() => arm()}>
                Go again
              </Button>
            </div>
          )}
        </div>

        <div className="mt-6 border-t border-line pt-4">
          <label
            htmlFor="sustain-sensitivity"
            className="font-mono text-[11px] uppercase tracking-[0.14em] text-dim"
          >
            Sensitivity — timer runs above the marker
          </label>
          <div className="mt-2 flex items-center gap-3">
            <span className="text-xs text-mut">quiet room</span>
            <input
              id="sustain-sensitivity"
              type="range"
              min={0.005}
              max={0.05}
              step={0.005}
              value={threshold}
              onChange={(e) => setThreshold(Number(e.target.value))}
              className="w-full accent-[var(--color-violet)]"
            />
            <span className="text-xs text-mut">noisy room</span>
          </div>
        </div>
      </Card>

      <Card>
        <h4 className="text-lg">Your attempts</h4>
        {data && data.attempts.length > 0 ? (
          <>
            <div className="mt-3 flex gap-6">
              <Stat
                label="Best ever"
                value={`${data.bestSec.toFixed(1)}s`}
                tone="violet"
              />
              <Stat
                label="Last attempt"
                value={`${data.attempts[0].sec.toFixed(1)}s`}
                sub={`${data.attempts[0].steadiness}% steady`}
              />
            </div>
            <div className="mt-4">
              <AttemptsChart data={data} />
            </div>
            <div className="mt-3">
              <ProInlineNudge>
                Last 10 shown — Pro keeps every attempt and trends
              </ProInlineNudge>
            </div>
          </>
        ) : (
          <p className="mt-3 text-sm text-mut">
            No attempts yet. Your last ten show up here with your best-ever
            line.
          </p>
        )}
        <div className="mt-4 border-t border-line pt-3">
          <div className="font-mono text-[11px] uppercase tracking-[0.14em] text-dim">
            Benchmarks
          </div>
          <p className="tabular mt-1.5 font-mono text-xs text-mut">
            {SUSTAIN_BENCHMARKS_SEC.fair}s fair · {SUSTAIN_BENCHMARKS_SEC.good}s good ·{" "}
            {SUSTAIN_BENCHMARKS_SEC.strong}s strong · {SUSTAIN_BENCHMARKS_SEC.excellent}s+ excellent
          </p>
        </div>
      </Card>
    </div>
  );
}
