"use client";

import { midiToLabel } from "@/lib/audio/notes";
import { midiMatches } from "./lib";

/**
 * Mini note-lane view: horizontal semitone lanes, one column per melody
 * position. Ivory outlines mark the target notes, amber blocks the sung
 * notes, green when a sung note hits its target.
 */
export function NoteLanes({
  target,
  detected,
  octaveAgnostic,
}: {
  target: number[];
  /** Sung notes by position; undefined = not yet sung, null = nothing detected. */
  detected?: (number | null)[];
  octaveAgnostic: boolean;
}) {
  // Fold detected notes into the target's octave so easy mode displays sanely.
  const shown = target.map((t, i) => {
    const d = detected?.[i];
    if (d === undefined || d === null) return null;
    if (!octaveAgnostic) return d;
    let m = d;
    while (m - t > 6) m -= 12;
    while (t - m > 6) m += 12;
    return m;
  });

  const all = [...target, ...shown.filter((m): m is number => m !== null)];
  const lo = Math.min(...all) - 1;
  const hi = Math.max(...all) + 1;
  const lanes = hi - lo + 1;

  const laneH = 16;
  const labelW = 34;
  const colW = 52;
  const w = labelW + target.length * colW + 8;
  const h = lanes * laneH + 8;
  const yFor = (midi: number) => 4 + (hi - midi) * laneH;

  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      className="w-full"
      role="img"
      aria-label="Melody: target versus what you sang"
    >
      {/* lanes */}
      {Array.from({ length: lanes }, (_, i) => {
        const midi = hi - i;
        const y = yFor(midi) + laneH / 2;
        return (
          <g key={midi}>
            <line
              x1={labelW}
              y1={y}
              x2={w - 4}
              y2={y}
              stroke="#2b2519"
              strokeWidth="1"
            />
            <text
              x={labelW - 6}
              y={y + 3}
              textAnchor="end"
              fontSize="8.5"
              fill="#6f685a"
              fontFamily="monospace"
            >
              {midiToLabel(midi)}
            </text>
          </g>
        );
      })}
      {/* target outlines */}
      {target.map((t, i) => (
        <rect
          key={`t${i}`}
          x={labelW + i * colW + 6}
          y={yFor(t) + 2}
          width={colW - 12}
          height={laneH - 4}
          rx={5}
          fill="none"
          stroke="#f2ede3"
          strokeWidth="1.4"
          opacity="0.8"
        />
      ))}
      {/* sung notes */}
      {shown.map((m, i) => {
        if (m === null) return null;
        const hit =
          detected?.[i] != null && midiMatches(detected[i], target[i], octaveAgnostic);
        return (
          <rect
            key={`d${i}`}
            x={labelW + i * colW + 9}
            y={yFor(m) + 4}
            width={colW - 18}
            height={laneH - 8}
            rx={4}
            fill={hit ? "#7fd99a" : "#f5b03e"}
          />
        );
      })}
    </svg>
  );
}
