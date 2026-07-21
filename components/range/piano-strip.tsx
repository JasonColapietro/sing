"use client";

import { midiToLabel } from "@/lib/audio/notes";

/** Keyboard strip bounds: C2..C6. */
export const STRIP_LOW = 36;
export const STRIP_HIGH = 84;

const WHITE_W = 20;
const WHITE_H = 72;
const BLACK_W = 12;
const BLACK_H = 44;
const LABEL_H = 22;

const BLACK_PCS = new Set([1, 3, 6, 8, 10]);

function isBlack(midi: number): boolean {
  return BLACK_PCS.has(((midi % 12) + 12) % 12);
}

interface KeyGeom {
  midi: number;
  x: number;
  black: boolean;
}

function buildKeys(): { keys: KeyGeom[]; width: number } {
  const keys: KeyGeom[] = [];
  let whiteCount = 0;
  for (let m = STRIP_LOW; m <= STRIP_HIGH; m++) {
    if (isBlack(m)) {
      keys.push({ midi: m, x: whiteCount * WHITE_W - BLACK_W / 2, black: true });
    } else {
      keys.push({ midi: m, x: whiteCount * WHITE_W, black: false });
      whiteCount++;
    }
  }
  return { keys, width: whiteCount * WHITE_W };
}

const { keys: KEYS, width: STRIP_W } = buildKeys();

/** Horizontal center of a key on the strip, in viewBox units. Clamped to C2..C6. */
export function midiToStripX(midi: number): number {
  const clamped = Math.max(STRIP_LOW, Math.min(STRIP_HIGH, Math.round(midi)));
  const k = KEYS.find((key) => key.midi === clamped);
  if (!k) return 0;
  return k.black ? k.x + BLACK_W / 2 : k.x + WHITE_W / 2;
}

/** 0..1 position of a midi note across the strip. Clamped. */
export function midiToStripPct(midi: number): number {
  return midiToStripX(midi) / STRIP_W;
}

export interface PianoStripProps {
  /** Currently sung note — lights up amber. */
  activeMidi?: number | null;
  /** Start of a highlighted range band (inclusive). */
  rangeLow?: number;
  /** End of a highlighted range band (inclusive). */
  rangeHigh?: number;
  /** Extra endpoint marker with a note label under the keys. */
  markLow?: number;
  markHigh?: number;
  className?: string;
  ariaLabel?: string;
}

/**
 * Reusable piano keyboard strip, C2 to C6. Highlights the current sung note
 * in amber and can overlay a range band plus labelled endpoint markers.
 */
export function PianoStrip({
  activeMidi,
  rangeLow,
  rangeHigh,
  markLow,
  markHigh,
  className,
  ariaLabel = "Piano keyboard from C2 to C6",
}: PianoStripProps) {
  const active =
    activeMidi != null && activeMidi >= STRIP_LOW && activeMidi <= STRIP_HIGH
      ? Math.round(activeMidi)
      : null;
  const hasRange = rangeLow !== undefined && rangeHigh !== undefined;
  const bandX0 = hasRange ? midiToStripX(rangeLow) - WHITE_W / 2 + 2 : 0;
  const bandX1 = hasRange ? midiToStripX(rangeHigh) + WHITE_W / 2 - 2 : 0;

  const markers: Array<{ midi: number; edge: "low" | "high" }> = [];
  if (markLow !== undefined) markers.push({ midi: markLow, edge: "low" });
  if (markHigh !== undefined) markers.push({ midi: markHigh, edge: "high" });

  return (
    <svg
      viewBox={`0 0 ${STRIP_W} ${WHITE_H + LABEL_H}`}
      className={className ?? "w-full"}
      role="img"
      aria-label={ariaLabel}
    >
      {/* White keys */}
      {KEYS.filter((k) => !k.black).map((k) => (
        <rect
          key={k.midi}
          x={k.x + 0.5}
          y={0.5}
          width={WHITE_W - 1}
          height={WHITE_H - 1}
          rx={2}
          fill={k.midi === active ? "#f5b03e" : "#e9e2d3"}
          stroke="#2b2519"
          strokeWidth={1}
        />
      ))}
      {/* Black keys */}
      {KEYS.filter((k) => k.black).map((k) => (
        <rect
          key={k.midi}
          x={k.x}
          y={0}
          width={BLACK_W}
          height={BLACK_H}
          rx={1.5}
          fill={k.midi === active ? "#f5b03e" : "#17140f"}
          stroke="#2b2519"
          strokeWidth={1}
        />
      ))}
      {/* Range band overlay */}
      {hasRange && (
        <rect
          x={bandX0}
          y={0}
          width={Math.max(0, bandX1 - bandX0)}
          height={WHITE_H}
          fill="rgba(245, 176, 62, 0.22)"
          stroke="rgba(245, 176, 62, 0.55)"
          strokeWidth={1}
          rx={2}
        />
      )}
      {/* Octave labels on C keys */}
      {KEYS.filter((k) => !k.black && k.midi % 12 === 0).map((k) => (
        <text
          key={`oct-${k.midi}`}
          x={k.x + WHITE_W / 2}
          y={WHITE_H + 14}
          textAnchor="middle"
          fontSize={9}
          fontFamily="var(--font-mono)"
          fill="#6f685a"
        >
          {midiToLabel(k.midi)}
        </text>
      ))}
      {/* Endpoint markers */}
      {markers.map((m) => {
        const x = midiToStripX(m.midi);
        return (
          <g key={`${m.edge}-${m.midi}`}>
            <line
              x1={x}
              y1={0}
              x2={x}
              y2={WHITE_H + 4}
              stroke="#f5b03e"
              strokeWidth={1.5}
            />
            <text
              x={x}
              y={WHITE_H + 16}
              textAnchor="middle"
              fontSize={10}
              fontWeight={600}
              fontFamily="var(--font-mono)"
              fill="#f5b03e"
            >
              {midiToLabel(m.midi)}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
