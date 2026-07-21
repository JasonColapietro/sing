"use client";

import { midiToLabel } from "@/lib/audio/notes";
import type { Segment } from "./exercises";

export interface TracePoint {
  t: number;
  midi: number | null;
}

/**
 * Note-lane view for one rep: horizontal semitone lanes with mono labels on
 * the left. Target notes render as ivory-outlined blocks (a slanted stroke
 * for glide steps); each block fills green left-to-right as the singer holds
 * it within tolerance. During "sing", the live pitch renders as an amber dot
 * with a trailing trace.
 */
export function NoteLaneCanvas({
  segs,
  totalSec,
  hitSec,
  cursorSec,
  liveMidiFloat,
  trace,
  showLive,
}: {
  segs: Segment[];
  totalSec: number;
  /** Accumulated in-tolerance seconds per segment, same length as segs. */
  hitSec: number[];
  /** Current playback position in seconds, or null to hide the cursor. */
  cursorSec: number | null;
  liveMidiFloat: number | null;
  trace: TracePoint[];
  showLive: boolean;
}) {
  const midis = segs.flatMap((s) => [s.startMidi, s.endMidi]);
  const lo = Math.min(...midis, liveMidiFloat ?? Infinity) - 2;
  const hi = Math.max(...midis, liveMidiFloat ?? -Infinity) + 2;
  const lanes = Math.max(1, Math.round(hi - lo) + 1);

  const laneH = 20;
  const labelW = 40;
  const padTop = 6;
  const plotW = Math.max(320, totalSec * 170);
  const w = labelW + plotW + 12;
  const h = lanes * laneH + padTop * 2;

  const clampT = (t: number) => Math.min(totalSec, Math.max(0, t));
  const x = (t: number) => labelW + (clampT(t) / Math.max(0.001, totalSec)) * plotW;
  const y = (midi: number) => padTop + (hi - midi) * laneH;

  const tracePath = trace
    .filter((p): p is { t: number; midi: number } => p.midi !== null)
    .map((p) => `${x(p.t)},${y(p.midi)}`)
    .join(" ");

  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      className="w-full"
      role="img"
      aria-label="Note lanes: ivory outlines are the target melody, the amber trail is your voice"
    >
      {/* lanes */}
      {Array.from({ length: lanes }, (_, i) => {
        const midi = Math.round(hi) - i;
        const laneY = y(midi) + laneH / 2;
        return (
          <g key={midi}>
            <line
              x1={labelW}
              y1={laneY}
              x2={w - 4}
              y2={laneY}
              stroke="#2b2519"
              strokeWidth="1"
            />
            <text
              x={labelW - 6}
              y={laneY + 3}
              textAnchor="end"
              fontSize="8.5"
              fill="#6f685a"
              fontFamily="var(--font-mono, monospace)"
            >
              {midiToLabel(midi)}
            </text>
          </g>
        );
      })}

      {/* target blocks / glide strokes */}
      {segs.map((seg, i) => {
        const x0 = x(seg.t0);
        const x1 = x(seg.t0 + seg.dur);
        const ratio =
          seg.dur > 0 ? Math.min(1, Math.max(0, (hitSec[i] ?? 0) / seg.dur)) : 0;
        if (seg.startMidi === seg.endMidi) {
          const blockY = y(seg.startMidi) + 3;
          const blockH = laneH - 6;
          return (
            <g key={i}>
              <rect
                x={x0 + 2}
                y={blockY}
                width={Math.max(2, x1 - x0 - 4)}
                height={blockH}
                rx={5}
                fill="none"
                stroke="#f2ede3"
                strokeWidth="1.4"
                opacity="0.75"
              />
              {ratio > 0 && (
                <rect
                  x={x0 + 2}
                  y={blockY}
                  width={Math.max(0, (x1 - x0 - 4) * ratio)}
                  height={blockH}
                  rx={5}
                  fill="#7fd99a"
                  opacity="0.85"
                />
              )}
            </g>
          );
        }
        // glide: diagonal stroke from start to end pitch
        const y0 = y(seg.startMidi) + laneH / 2;
        const y1 = y(seg.endMidi) + laneH / 2;
        const xr = x0 + (x1 - x0) * ratio;
        const yr = y0 + (y1 - y0) * ratio;
        return (
          <g key={i}>
            <line
              x1={x0}
              y1={y0}
              x2={x1}
              y2={y1}
              stroke="#f2ede3"
              strokeWidth="7"
              strokeLinecap="round"
              opacity="0.5"
            />
            {ratio > 0 && (
              <line
                x1={x0}
                y1={y0}
                x2={xr}
                y2={yr}
                stroke="#7fd99a"
                strokeWidth="7"
                strokeLinecap="round"
                opacity="0.85"
              />
            )}
          </g>
        );
      })}

      {/* live pitch trail + dot */}
      {showLive && tracePath && (
        <polyline
          points={tracePath}
          fill="none"
          stroke="#f5b03e"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.85"
        />
      )}
      {showLive && liveMidiFloat !== null && cursorSec !== null && (
        <circle
          cx={x(cursorSec)}
          cy={y(liveMidiFloat)}
          r="4.5"
          fill="#f5b03e"
        />
      )}

      {/* playhead */}
      {cursorSec !== null && (
        <line
          x1={x(cursorSec)}
          y1={padTop - 2}
          x2={x(cursorSec)}
          y2={h - padTop + 2}
          stroke="#3a3222"
          strokeWidth="1.5"
          strokeDasharray="2,2"
        />
      )}
    </svg>
  );
}
