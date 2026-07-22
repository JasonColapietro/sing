"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePitch } from "@/lib/audio/use-pitch";
import { logSession, type LogResult } from "@/lib/progress";
import { Button, Card, PageShell, Pill, SectionLabel } from "@/components/ui";
import { CentsGauge } from "./cents-gauge";
import { LevelMeter } from "./level-meter";
import { PitchTrace } from "./pitch-trace";
import { TargetPractice } from "./target-practice";

const MIN_LOG_SEC = 45;

function fmtTime(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function MicIcon() {
  return (
    <svg
      width="28"
      height="28"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="9" y="2.5" width="6" height="11" rx="3" />
      <path d="M5.5 11a6.5 6.5 0 0 0 13 0" />
      <path d="M12 17.5V21M8.5 21h7" />
    </svg>
  );
}

export function StudioClient() {
  const { frame, latest, listening, error, start, stop } = usePitch();
  const [elapsed, setElapsed] = useState(0);
  const [toast, setToast] = useState<LogResult | null>(null);
  const [targetMidi, setTargetMidi] = useState<number | null>(null);
  const startedAtRef = useRef<number | null>(null);

  // Session timer while listening.
  useEffect(() => {
    if (!listening) return;
    const id = window.setInterval(() => {
      if (startedAtRef.current !== null) {
        setElapsed(Math.floor((Date.now() - startedAtRef.current) / 1000));
      }
    }, 1000);
    return () => window.clearInterval(id);
  }, [listening]);

  const handleStart = async () => {
    const ok = await start();
    if (ok) {
      startedAtRef.current = Date.now();
      setElapsed(0);
      setToast(null);
    }
  };

  /** Log the session if it ran long enough. Safe to call more than once. */
  const finishSession = useCallback((): LogResult | null => {
    const startedAt = startedAtRef.current;
    startedAtRef.current = null;
    if (startedAt === null) return null;
    const durationSec = Math.floor((Date.now() - startedAt) / 1000);
    if (durationSec <= MIN_LOG_SEC) return null;
    return logSession({
      type: "pitch",
      durationSec,
      detail: "Studio session",
    });
  }, []);

  const handleStop = () => {
    stop();
    const result = finishSession();
    if (result) setToast(result);
  };

  // Log on unmount too (e.g. navigating away mid-session).
  useEffect(() => () => void finishSession(), [finishSession]);

  const note = frame.note;
  const inTune = note !== null && Math.abs(note.cents) <= 15;

  return (
    <PageShell
      kicker="Studio"
      title="Pitch studio"
      subtitle="Sing into the mic and watch every note land — name, cents, and an eight-second trace."
      actions={
        listening ? (
          <>
            <Pill tone="rec">
              <span className="h-1.5 w-1.5 animate-recblink rounded-full bg-rec" />
              <span className="tabular font-mono">{fmtTime(elapsed)}</span>
            </Pill>
            <Button variant="outline" onClick={handleStop}>
              Stop
            </Button>
          </>
        ) : undefined
      }
    >
      {toast && (
        <Card className="mb-6 border-amber/40 bg-panel2">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3">
              <span className="tabular font-mono text-xl text-amber-ink">
                +{toast.xpGained} XP
              </span>
              <span className="text-sm text-mut">Session saved.</span>
              {toast.newAchievements.map((a) => (
                <Pill key={a.id} tone="ok">
                  {a.icon} {a.title}
                </Pill>
              ))}
            </div>
            <Button variant="ghost" size="sm" onClick={() => setToast(null)}>
              Dismiss
            </Button>
          </div>
        </Card>
      )}

      {!listening ? (
        <Card className="mx-auto max-w-2xl py-10 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-line2 bg-panel2 text-amber-ink">
            <MicIcon />
          </div>
          <h2 className="mt-5 text-2xl">The voice oscilloscope</h2>
          <p className="mx-auto mt-2 max-w-md text-mut">
            Sing or hum any note and watch it land on the dial in real time —
            note name, cents sharp or flat, and a scrolling trace of your last
            eight seconds. Pick a target note to practice locking your pitch.
          </p>
          <p className="mt-2 text-xs text-dim">
            Audio is analyzed on this device and never uploaded.
          </p>
          <Button variant="rec" size="lg" className="mt-6" onClick={handleStart}>
            Enable microphone
          </Button>
          {error && <p className="mt-4 text-sm text-rec">{error}</p>}
        </Card>
      ) : (
        <>
          <div className="grid gap-4 lg:grid-cols-[380px_minmax(0,1fr)]">
            <Card>
              <div className="flex items-center justify-between">
                <SectionLabel>Tuner</SectionLabel>
                {note &&
                  (inTune ? (
                    <Pill tone="ok">In tune</Pill>
                  ) : (
                    <Pill tone="amber">{note.cents > 0 ? "Sharp" : "Flat"}</Pill>
                  ))}
              </div>
              <div className="mt-4 text-center">
                <div
                  className={`tabular font-mono text-7xl tracking-tight ${
                    note ? (inTune ? "text-ok" : "text-ink") : "text-dim"
                  }`}
                >
                  {note ? note.label : "--"}
                </div>
                <div className="tabular mt-2 font-mono text-sm text-mut">
                  {frame.freq !== null
                    ? `${frame.freq.toFixed(1)} Hz`
                    : "listening"}
                  {" · "}
                  {note
                    ? `${note.cents > 0 ? "+" : ""}${note.cents} cents`
                    : "no note"}
                </div>
              </div>
              <CentsGauge cents={note ? note.cents : null} />
              <div className="mt-5">
                <LevelMeter volume={frame.volume} />
              </div>
            </Card>

            <Card className="flex min-h-[320px] flex-col">
              <div className="flex items-center justify-between">
                <SectionLabel>Pitch trace</SectionLabel>
                <span className="font-mono text-[11px] text-dim">last 8 s</span>
              </div>
              <PitchTrace
                latest={latest}
                targetMidi={targetMidi}
                className="mt-4 w-full grow rounded-lg"
              />
            </Card>
          </div>

          <TargetPractice
            className="mt-4"
            frame={frame}
            latest={latest}
            listening={listening}
            targetMidi={targetMidi}
            onTargetChange={setTargetMidi}
          />
        </>
      )}
    </PageShell>
  );
}
