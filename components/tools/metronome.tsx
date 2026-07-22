"use client";

import { useEffect, useRef, useState } from "react";
import { clickAt, playTone } from "@/lib/audio/synth";
import { audioNow, getAudioContext } from "@/lib/audio/context";
import { Button, Card, Pill, SectionLabel } from "@/components/ui";

const SIGS = [
  { id: "2/4", beats: 2 },
  { id: "3/4", beats: 3 },
  { id: "4/4", beats: 4 },
  { id: "6/8", beats: 6 },
] as const;

type SigId = (typeof SIGS)[number]["id"];
type Subdivision = "quarter" | "eighth";

const MIN_BPM = 30;
const MAX_BPM = 240;
const LOOKAHEAD_SEC = 0.1;
const TICK_MS = 25;

function clampBpm(n: number): number {
  return Math.min(MAX_BPM, Math.max(MIN_BPM, Math.round(n)));
}

function beatsFor(sig: SigId): number {
  return SIGS.find((s) => s.id === sig)!.beats;
}

export function Metronome({ onActive }: { onActive: (active: boolean) => void }) {
  const [bpm, setBpm] = useState(96);
  const [bpmText, setBpmText] = useState("96");
  const [sig, setSig] = useState<SigId>("4/4");
  const [sub, setSub] = useState<Subdivision>("quarter");
  const [running, setRunning] = useState(false);
  const [beat, setBeat] = useState(-1);

  // Refs so the scheduler always reads fresh values without restarting.
  const bpmRef = useRef(bpm);
  const beatsRef = useRef(beatsFor(sig));
  const subRef = useRef(sub);
  useEffect(() => {
    bpmRef.current = bpm;
    beatsRef.current = beatsFor(sig);
    subRef.current = sub;
  }, [bpm, sig, sub]);

  const sched = useRef({ nextTime: 0, beat: 0 });
  const queue = useRef<Array<{ time: number; beat: number }>>([]);
  const taps = useRef<number[]>([]);

  useEffect(() => {
    onActive(running);
  }, [running, onActive]);
  useEffect(() => () => onActive(false), [onActive]);

  // Lookahead scheduler + rAF beat indicator.
  useEffect(() => {
    if (!running) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- coupled to this effect's own scheduler teardown below, not a derivable render value
      setBeat(-1);
      return;
    }
    const tick = () => {
      const horizon = audioNow() + LOOKAHEAD_SEC;
      const s = sched.current;
      while (s.nextTime < horizon) {
        const interval = 60 / bpmRef.current;
        const beatInBar = s.beat % beatsRef.current;
        clickAt(s.nextTime, beatInBar === 0);
        if (subRef.current === "eighth") {
          // Lighter sub-click halfway through the beat.
          playTone(96, {
            dur: 0.03,
            gain: 0.06,
            at: s.nextTime + interval / 2 - audioNow(),
          });
        }
        queue.current.push({ time: s.nextTime, beat: beatInBar });
        s.beat += 1;
        s.nextTime += interval;
      }
    };
    const intervalId = window.setInterval(tick, TICK_MS);
    tick();

    let raf = 0;
    const loop = () => {
      const now = audioNow();
      let latest = -1;
      while (queue.current.length > 0 && queue.current[0].time <= now) {
        latest = queue.current.shift()!.beat;
      }
      if (latest >= 0) setBeat(latest);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    return () => {
      window.clearInterval(intervalId);
      cancelAnimationFrame(raf);
    };
  }, [running]);

  const start = () => {
    getAudioContext(); // resume from the user gesture
    sched.current = { nextTime: audioNow() + 0.12, beat: 0 };
    queue.current = [];
    setRunning(true);
  };

  const stop = () => setRunning(false);

  const applyBpm = (n: number) => {
    const c = clampBpm(n);
    setBpm(c);
    setBpmText(String(c));
  };

  const commitBpmText = () => {
    const n = Number(bpmText);
    if (bpmText.trim() !== "" && Number.isFinite(n)) applyBpm(n);
    else setBpmText(String(bpm));
  };

  const tap = () => {
    const now = performance.now();
    const t = taps.current;
    if (t.length > 0 && now - t[t.length - 1] > 2000) t.length = 0;
    t.push(now);
    if (t.length > 4) t.shift(); // average the last 4 taps
    if (t.length >= 2) {
      const avg = (t[t.length - 1] - t[0]) / (t.length - 1);
      applyBpm(60000 / avg);
    }
    clickAt(audioNow(), false); // audible tap feedback
  };

  const beats = beatsFor(sig);

  return (
    <Card>
      <div className="mb-5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            aria-hidden="true"
            className="text-amber-ink"
          >
            <path
              d="M6 2h4l2.5 12h-9L6 2Z"
              stroke="currentColor"
              strokeWidth="1.3"
              strokeLinejoin="round"
            />
            <path
              d="M8 10 12 4"
              stroke="currentColor"
              strokeWidth="1.3"
              strokeLinecap="round"
            />
          </svg>
          <SectionLabel>Metronome</SectionLabel>
        </div>
        {running && (
          <Pill tone="rec">
            <span className="animate-recblink h-1.5 w-1.5 rounded-full bg-rec" />
            running
          </Pill>
        )}
      </div>

      {/* Tempo readout + LED beat indicator */}
      <div className="flex flex-wrap items-end justify-between gap-4 rounded-xl border border-line bg-panel2 px-4 py-3">
        <div>
          <div className="font-mono text-[11px] uppercase tracking-[0.14em] text-dim">
            Tempo
          </div>
          <div className="tabular font-mono text-4xl text-amber-ink">
            {bpm}
            <span className="ml-1.5 text-sm text-mut">BPM</span>
          </div>
        </div>
        <div
          className="mb-1.5 flex items-center gap-2.5"
          role="img"
          aria-label={
            running ? `Beat ${beat + 1} of ${beats}` : "Metronome stopped"
          }
        >
          {Array.from({ length: beats }, (_, i) => (
            <span
              key={i}
              className={`rounded-full border transition-colors duration-75 ${
                i === 0 ? "h-4 w-4" : "h-3 w-3"
              } ${
                running && i === beat
                  ? i === 0
                    ? "border-rec bg-rec shadow-[0_0_12px_rgba(157, 63, 51,0.75)]"
                    : "border-amber bg-amber shadow-[0_0_10px_rgba(197, 150, 66,0.65)]"
                  : "border-line2 bg-panel"
              }`}
            />
          ))}
        </div>
      </div>

      {/* BPM controls */}
      <div className="mt-5 flex flex-wrap items-center gap-3">
        <label htmlFor="met-bpm" className="sr-only">
          Tempo in beats per minute
        </label>
        <input
          id="met-bpm"
          type="range"
          min={MIN_BPM}
          max={MAX_BPM}
          step={1}
          value={bpm}
          onChange={(e) => applyBpm(Number(e.target.value))}
          className="accent-amber h-1.5 min-w-40 flex-1 cursor-pointer"
        />
        <label htmlFor="met-bpm-num" className="sr-only">
          Tempo, exact value
        </label>
        <input
          id="met-bpm-num"
          type="number"
          min={MIN_BPM}
          max={MAX_BPM}
          inputMode="numeric"
          value={bpmText}
          onChange={(e) => setBpmText(e.target.value)}
          onBlur={commitBpmText}
          onKeyDown={(e) => {
            if (e.key === "Enter") commitBpmText();
          }}
          className="tabular w-20 rounded-lg border border-line2 bg-panel2 px-2.5 py-1.5 text-center font-mono text-sm text-ink"
        />
        <Button variant="outline" size="sm" onClick={tap}>
          Tap tempo
        </Button>
      </div>

      {/* Time signature + subdivision */}
      <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-3">
        <fieldset className="flex items-center gap-2">
          <legend className="sr-only">Time signature</legend>
          <span
            className="font-mono text-[11px] uppercase tracking-[0.14em] text-dim"
            aria-hidden="true"
          >
            Time
          </span>
          {SIGS.map((s) => (
            <button
              key={s.id}
              type="button"
              aria-pressed={sig === s.id}
              onClick={() => setSig(s.id)}
              className={`rounded-full border px-2.5 py-1 font-mono text-xs transition-colors ${
                sig === s.id
                  ? "border-amber bg-panel2 text-amber-ink"
                  : "border-line text-mut hover:border-line2 hover:text-ink"
              }`}
            >
              {s.id}
            </button>
          ))}
        </fieldset>
        <fieldset className="flex items-center gap-2">
          <legend className="sr-only">Subdivision</legend>
          <span
            className="font-mono text-[11px] uppercase tracking-[0.14em] text-dim"
            aria-hidden="true"
          >
            Sub
          </span>
          {(
            [
              { id: "quarter", label: "Quarters" },
              { id: "eighth", label: "Eighths" },
            ] as const
          ).map((o) => (
            <button
              key={o.id}
              type="button"
              aria-pressed={sub === o.id}
              onClick={() => setSub(o.id)}
              className={`rounded-full border px-2.5 py-1 font-mono text-xs transition-colors ${
                sub === o.id
                  ? "border-amber bg-panel2 text-amber-ink"
                  : "border-line text-mut hover:border-line2 hover:text-ink"
              }`}
            >
              {o.label}
            </button>
          ))}
        </fieldset>
      </div>

      <div className="mt-5">
        {running ? (
          <Button variant="rec" onClick={stop}>
            Stop metronome
          </Button>
        ) : (
          <Button variant="amber" onClick={start}>
            Start metronome
          </Button>
        )}
      </div>
    </Card>
  );
}
