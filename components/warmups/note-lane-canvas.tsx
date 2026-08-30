"use client";

import { midiToLabel } from "@/lib/audio/notes";
import { COOL, DIM, INK, LINE, LINE2, MONO, OK } from "@/lib/chart-colors";
import type { Segment } from "./exercises";

export interface TracePoint {
  t: number;
  midi: number | null;
}

/**
 * Note-lane view for one rep: horizontal semitone lanes with mono labels on
 * the left. Target notes render as ivory-outlined blocks (a slanted stroke
 * for glide steps); each block fills green left-to-right as the singer holds
 * it within tolerance. During "sing", the live pitch renders as a teal dot
 * with a trailing trace — the same colour the studio draws a voice in, and
 * deliberately not violet, which means "Pro" everywhere else.
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

  // 20 was fine at native size and the SVG was never at native size — see the
  // width note below. 24 gives the note labels room to be legible at arm's
  // length, which is where a singer's eyes actually are.
  const laneH = 24;
  const labelW = 42;
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
      /**
       * Fills a wide container, but never shrinks below its own natural width.
       *
       * This was `className="w-full"` inside an `overflow-x-auto` wrapper,
       * which meant the wrapper could never scroll — the SVG simply shrank to
       * whatever was available. A four-second exercise is 732 units wide, and
       * the box inside PageShell's px-4, the Card's p-5 and the wrapper's p-3
       * on a 375px phone is about 279px: a 0.38 scale. Lanes became 7.6px tall
       * and the note labels rendered at roughly 3.2px. The singer was being
       * asked to hit a melody they could not read, on the one screen where
       * reading it is the entire task.
       *
       * With a min-width the parent scrolls instead, and every unit below is a
       * real pixel again.
       */
      style={{ width: "100%", minWidth: `${w}px` }}
      className="block h-auto"
      role="img"
      aria-label="Note lanes: ivory outlines are the target melody, the teal trail is your voice"
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
              stroke={LINE}
              strokeWidth="1"
            />
            <text
              x={labelW - 6}
              y={laneY + 3}
              textAnchor="end"
              fontSize="10.5"
              fill={DIM}
              fontFamily={MONO}
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
                stroke={INK}
                strokeWidth="2"
                opacity="0.9"
              />
              {ratio > 0 && (
                <rect
                  x={x0 + 2}
                  y={blockY}
                  width={Math.max(0, (x1 - x0 - 4) * ratio)}
                  height={blockH}
                  rx={5}
                  fill={OK}
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
              stroke={INK}
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
                stroke={OK}
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
          stroke={COOL}
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
          fill={COOL}
        />
      )}

      {/* playhead */}
      {cursorSec !== null && (
        <line
          x1={x(cursorSec)}
          y1={padTop - 2}
          x2={x(cursorSec)}
          y2={h - padTop + 2}
          stroke={LINE2}
          strokeWidth="1.5"
          strokeDasharray="2,2"
        />
      )}
    </svg>
  );
}
