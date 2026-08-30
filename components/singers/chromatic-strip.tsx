import { midiToLabel } from "@/lib/audio/notes";
import {
  COOL,
  DIM,
  LINE,
  MONO,
  REC,
  STRIP_BLACK,
  STRIP_WHITE,
} from "@/lib/chart-colors";

const BLACK_PCS = new Set([1, 3, 6, 8, 10]);

function isBlack(midi: number): boolean {
  return BLACK_PCS.has(((midi % 12) + 12) % 12);
}

/**
 * Equal-width-per-semitone keyboard strip with a teal band over a range.
 * Same geometry as the progress page's mini keyboard, but with configurable
 * bounds so extreme ranges (whistle sopranos, deep basses) render without
 * clamping — and deliberately teal, not violet: across /range and /progress an
 * violet band on keys means "your measured voice", so a reference singer's
 * cited range has to read in the other tone. Pure SVG, safe in server
 * components (the visitor's own range is client-only, and lives in the
 * CompareWithMe card further down the page).
 */
export function ChromaticStrip({
  low,
  high,
  beltMidi,
  className,
  label,
}: {
  /** Highlighted range (also drives the strip bounds, snapped to octaves). */
  low: number;
  high: number;
  /** Optional belt marker inside the band. */
  beltMidi?: number | null;
  className?: string;
  label?: string;
}) {
  const stripLow = Math.floor(low / 12) * 12;
  const stripHigh = Math.ceil(high / 12) * 12;
  const CW = 9;
  const KH = 38;
  const n = stripHigh - stripLow + 1;
  const W = n * CW;
  const x = (m: number) => (m - stripLow) * CW;

  // The whole range always fits — a horizontally scrolled strip hid the one
  // note people came to see (Mariah Carey's G7 started off-screen). Instead the
  // strip scales to the container and the type scales with it, so a 6-octave
  // span renders its labels at the same on-screen size a 2-octave one does.
  // Reference: a 4-octave strip (W = 441) at fontSize 10.
  const k = Math.max(1, W / 441);
  const noteFont = 10 * k;
  const octaveFont = 8 * k;
  const LABEL_H = 18 * k;

  return (
    <div className={className}>
      <svg
        viewBox={`0 0 ${W} ${KH + LABEL_H}`}
        className="h-auto w-full"
        role="img"
        aria-label={
          label ??
          `Keyboard strip highlighting the range ${midiToLabel(low)} to ${midiToLabel(high)}.`
        }
      >
      {Array.from({ length: n }, (_, i) => {
        const m = stripLow + i;
        const black = isBlack(m);
        return (
          <rect
            key={m}
            x={x(m) + 0.5}
            y={0.5}
            width={CW - 1}
            height={(black ? KH * 0.62 : KH) - 1}
            rx={1.5}
            fill={black ? STRIP_BLACK : STRIP_WHITE}
            stroke={LINE}
            strokeWidth={1}
          />
        );
      })}
      <rect
        x={x(low)}
        y={0}
        width={x(high) - x(low) + CW}
        height={KH}
        rx={2}
        fill="rgba(17, 97, 93, 0.20)"
        stroke="rgba(17, 97, 93, 0.60)"
        strokeWidth={1}
      />
      {beltMidi != null && (
        <line
          x1={x(beltMidi) + CW / 2}
          y1={0}
          x2={x(beltMidi) + CW / 2}
          y2={KH}
          stroke={REC}
          strokeWidth={1.5}
          strokeDasharray="3 2"
          vectorEffect="non-scaling-stroke"
        />
      )}
      {[low, high].map((m) => (
        <text
          key={m}
          x={x(m) + CW / 2}
          y={KH + noteFont + 3}
          textAnchor="middle"
          fontSize={noteFont}
          fontWeight={600}
          fontFamily={MONO}
          fill={COOL}
        >
          {midiToLabel(m)}
        </text>
      ))}
      {/* Octave marks, minus any that would sit under an endpoint label. The
          clearance scales with the type, since wider strips carry wider glyphs. */}
      {Array.from({ length: n }, (_, i) => stripLow + i)
        .filter(
          (m) =>
            m % 12 === 0 &&
            Math.abs(m - low) > 1.5 * k &&
            Math.abs(m - high) > 1.5 * k,
        )
        .map((m) => (
          <text
            key={`oct-${m}`}
            x={x(m) + CW / 2}
            y={KH + noteFont + 3}
            textAnchor="middle"
            fontSize={octaveFont}
            fontFamily={MONO}
            fill={DIM}
          >
            {midiToLabel(m)}
          </text>
        ))}
      </svg>
    </div>
  );
}
