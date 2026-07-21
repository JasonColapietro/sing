"use client";

import { useEffect, useRef, useState } from "react";
import { usePitch } from "@/lib/audio/use-pitch";
import { logSession, type LogResult } from "@/lib/progress";
import { Button, Card, Pill, Stat } from "@/components/ui";
import { loadBreath, recordAttempt, type BreathData } from "./store";
import { RewardNote } from "./reward";

type Phase = "idle" | "armed" | "running" | "done";

const SILENCE_MS = 700;
const METER_SEGS = 28;
/** Volume mapped for the meter with a sqrt curve; ~0.3 RMS pins the strip. */
function meterNorm(v: number) {
  return Math.min(1, Math.sqrt(Math.max(0, v) / 0.3));
}

function LevelMeter({
  volume,
  threshold,
}: {
  volume: number;
  threshold: number;
}) {
  const lit = Math.round(meterNorm(volume) * METER_SEGS);
  const thPct = meterNorm(threshold) * 100;
  return (
    <div className="relative">
      <div className="flex h-4 items-stretch gap-[3px]" aria-hidden="true">
        {Array.from({ length: METER_SEGS }, (_, i) => {
          const on = i < lit;
          const color =
            i >= METER_SEGS * 0.85
              ? "bg-rec"
              : i >= METER_SEGS * 0.6
                ? "bg-amber"
                : "bg-ok";
          return (
            <div
              key={i}
              className={`flex-1 rounded-[2px] ${on ? color : "bg-panel2"}`}
            />
          );
        })}
      </div>
      {/* threshold marker */}
      <div
        aria-hidden="true"
        className="absolute -bottom-1.5 -top-1.5 w-px bg-amber/70"
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
            stroke="var(--color-amber)"
            strokeWidth={1}
            strokeDasharray="4 3"
          />
          <text
            x={W - 2}
            y={y(data.bestSec) - 3}
            textAnchor="end"
            fill="var(--color-amber)"
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
}

export function SustainTest() {
  const { frame, listening, error, start, stop } = usePitch();
  const [phase, setPhase] = useState<Phase>("idle");
  const [threshold, setThreshold] = useState(0.015);
  const [elapsed, setElapsed] = useState(0);
  const [data, setData] = useState<BreathData | null>(null);
  const [result, setResult] = useState<AttemptResult | null>(null);

  const startRef = useRef(0);
  const lastLoudRef = useRef(0);
  const samplesRef = useRef<number[]>([]);

  useEffect(() => {
    setData(loadBreath());
  }, []);

  // If the mic is turned off mid-attempt, drop back to idle cleanly.
  useEffect(() => {
    if (!listening && (phase === "armed" || phase === "running")) {
      setPhase("idle");
      setElapsed(0);
    }
  }, [listening, phase]);

  // Attempt state machine, driven by pitch frames (one per animation frame).
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
      if (secFinal >= 1) {
        setData(recordAttempt(secFinal, steadiness));
      }
      if (secFinal >= 5) {
        logged = logSession({
          type: "breath",
          durationSec: secFinal,
          score: steadiness,
          detail: "Sustain test",
        });
      }
      setResult({ sec: secFinal, steadiness, logged });
      setPhase("done");
    }
  }, [frame, phase, threshold]);

  const benchmark = (sec: number) =>
    sec >= 45 ? "excellent" : sec >= 30 ? "strong" : sec >= 20 ? "good" : sec >= 10 ? "fair" : "keep at it";

  // ---- Mic gate ----
  if (!listening) {
    return (
      <Card>
        <div className="flex flex-col items-center gap-4 py-10 text-center">
          <svg
            width="36"
            height="36"
            viewBox="0 0 24 24"
            fill="none"
            stroke="var(--color-mut)"
            strokeWidth="1.5"
            aria-hidden="true"
          >
            <rect x="9" y="3" width="6" height="11" rx="3" />
            <path d="M5 11a7 7 0 0 0 14 0" />
            <path d="M12 18v3" />
          </svg>
          <div>
            <h3 className="font-display text-xl">Sustain test</h3>
            <p className="mx-auto mt-2 max-w-sm text-sm text-mut">
              Sing or hiss one steady note for as long as you can. The timer
              runs while the mic hears you and stops when you run out of air.
            </p>
          </div>
          <Button
            variant="rec"
            onClick={() => {
              void start();
            }}
          >
            <span className="h-2 w-2 rounded-full bg-current animate-recblink" />
            Enable microphone
          </Button>
          {error && (
            <p role="alert" className="max-w-sm text-sm text-rec">
              {error}
            </p>
          )}
        </div>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
      <Card>
        <div className="flex items-center justify-between gap-2">
          <h3 className="font-display text-xl">Sustain test</h3>
          <div className="flex items-center gap-2">
            {phase === "running" ? (
              <Pill tone="rec">
                <span className="h-1.5 w-1.5 rounded-full bg-rec animate-recblink" />
                sustaining
              </Pill>
            ) : phase === "armed" ? (
              <Pill tone="amber">waiting for sound</Pill>
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
                Take a full breath, press start, then hold one even
                &ldquo;sss&rdquo; or &ldquo;ahh&rdquo;. Stopping for a moment
                ends the attempt.
              </p>
              <Button variant="amber" size="lg" onClick={() => setPhase("armed")}>
                Start attempt
              </Button>
            </>
          )}

          {(phase === "armed" || phase === "running") && (
            <>
              <p
                className="text-center text-sm text-mut"
                role="status"
                aria-live="polite"
              >
                {phase === "armed"
                  ? "Listening — begin whenever you're ready."
                  : "Keep it steady. The timer stops after a moment of silence."}
              </p>
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
                  tone="amber"
                />
                <Stat
                  label="Steadiness"
                  value={`${result.steadiness}%`}
                  sub="volume consistency"
                  tone="cool"
                />
              </div>
              {result.logged ? (
                <RewardNote result={result.logged} />
              ) : (
                <p className="text-xs text-dim">
                  Attempts of 5 seconds or more are logged for XP.
                </p>
              )}
              <Button
                variant="amber"
                onClick={() => {
                  setElapsed(0);
                  setResult(null);
                  setPhase("armed");
                }}
              >
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
              className="w-full accent-[var(--color-amber)]"
            />
            <span className="text-xs text-mut">noisy room</span>
          </div>
        </div>
      </Card>

      <Card>
        <h4 className="font-display text-lg">Your attempts</h4>
        {data && data.attempts.length > 0 ? (
          <>
            <div className="mt-3 flex gap-6">
              <Stat
                label="Best ever"
                value={`${data.bestSec.toFixed(1)}s`}
                tone="amber"
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
            10s fair · 20s good · 30s strong · 45s+ excellent
          </p>
        </div>
      </Card>
    </div>
  );
}
