"use client";

import { useEffect, useState } from "react";
import { Stat } from "@/components/ui";
import {
  type DoseState,
  fmtCycles,
  recentDays,
  today,
} from "@/lib/audio/vocal-dose";

/** "0s", "4m 20s", "1h 12m". */
function fmtTime(sec: number): string {
  const s = Math.round(sec);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ${String(s % 60).padStart(2, "0")}s`;
  return `${Math.floor(m / 60)}h ${String(m % 60).padStart(2, "0")}m`;
}

const WEEKDAY = ["S", "M", "T", "W", "T", "F", "S"];

/**
 * Today's dose, plus the week behind it.
 *
 * The live figures are written straight into the DOM by the analysis loop —
 * `liveRef` is handed the two spans — because at 60 fps a setState per frame
 * would re-render this subtree sixty times a second to change two numbers.
 * State here only carries the history, which changes when a session ends.
 */
export function VocalLoad({
  state,
  running,
  secRef,
  cyclesRef,
}: {
  state: DoseState;
  running: boolean;
  secRef: React.RefObject<HTMLSpanElement | null>;
  cyclesRef: React.RefObject<HTMLSpanElement | null>;
}) {
  // The strip is derived, not stored. `tick` exists only to recompute it once a
  // minute while a session runs, so today's bar grows without the analysis loop
  // having to touch React at frame rate.
  const [, setTick] = useState(0);
  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => setTick((n) => n + 1), 60_000);
    return () => window.clearInterval(id);
  }, [running]);

  const days = recentDays(state, 7);
  const t = today(state);
  const peak = Math.max(1, ...days.map((d) => d.cycles));

  return (
    <div>
      <div className="grid grid-cols-2 gap-4">
        <Stat
          label="Voiced today"
          value={<span ref={secRef}>{fmtTime(t.phonationSec)}</span>}
          sub="time your voice was actually sounding"
        />
        <Stat
          label="Cycle dose"
          value={<span ref={cyclesRef}>{fmtCycles(t.cycles)}</span>}
          tone="amber"
          sub="vocal-fold vibrations, pitch × time"
        />
      </div>

      <div className="mt-6">
        <div className="font-mono text-[11px] uppercase tracking-[0.14em] text-dim">
          Last 7 days
        </div>
        <div className="mt-3 flex items-end gap-1.5" aria-hidden>
          {days.map((d) => (
            <div key={d.day} className="flex flex-1 flex-col items-center gap-1.5">
              <div
                className="w-full rounded-sm bg-amber/70"
                style={{ height: `${Math.max(2, (d.cycles / peak) * 56)}px` }}
              />
              <span className="font-mono text-[10px] text-dim">
                {WEEKDAY[new Date(`${d.day}T12:00:00`).getDay()]}
              </span>
            </div>
          ))}
        </div>
        <ul className="sr-only">
          {days.map((d) => (
            <li key={d.day}>
              {d.day}: {fmtTime(d.phonationSec)} voiced, {fmtCycles(d.cycles)} cycles
            </li>
          ))}
        </ul>
      </div>

      <p className="mt-5 text-xs text-mut">
        Cycle dose counts how many times your vocal folds opened and closed —
        pitch multiplied by the time you were actually sounding. An hour spent
        high in your range is far more work than an hour spent low, which is why
        a stopwatch alone tends to understate a soprano&rsquo;s day.
      </p>
    </div>
  );
}

export { fmtTime };
