"use client";

const SEGS = 26;

/** Console-style LED input meter driven by frame.volume (RMS 0..~0.5). */
export function LevelMeter({ volume }: { volume: number }) {
  const level = Math.min(1, volume / 0.3);
  const lit = Math.round(level * SEGS);
  return (
    <div
      role="meter"
      aria-label="Input level"
      aria-valuenow={Math.round(level * 100)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div className="flex items-center justify-between">
        <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-dim">
          Input level
        </span>
        <span className="tabular font-mono text-[11px] text-dim">
          {String(Math.round(level * 100)).padStart(3, " ")}%
        </span>
      </div>
      <div className="mt-2 flex gap-[3px]" aria-hidden="true">
        {Array.from({ length: SEGS }, (_, i) => {
          const on = i < lit;
          const color =
            i >= SEGS - 3 ? "bg-rec" : i >= SEGS - 8 ? "bg-amber" : "bg-ok";
          return (
            <span
              key={i}
              className={`h-3 flex-1 rounded-[2px] ${on ? color : "bg-panel2"}`}
            />
          );
        })}
      </div>
    </div>
  );
}
