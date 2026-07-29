import { midiToLabel } from "@/lib/audio/notes";

const BLACK_PCS = new Set([1, 3, 6, 8, 10]);

function isBlack(midi: number): boolean {
  return BLACK_PCS.has(((midi % 12) + 12) % 12);
}

/**
 * Equal-width-per-semitone keyboard strip with an amber band over a range.
 * Same visual language as the progress page's mini keyboard, but with
 * configurable bounds so extreme ranges (whistle sopranos, deep basses)
 * render without clamping. Pure SVG — safe in server components.
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
  const LABEL_H = 18;
  const n = stripHigh - stripLow + 1;
  const W = n * CW;
  const x = (m: number) => (m - stripLow) * CW;

  return (
    <svg
      viewBox={`0 0 ${W} ${KH + LABEL_H}`}
      className={className ?? "h-auto w-full"}
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
            fill={black ? "#fffaf2" : "#e9e2d3"}
            stroke="#ddd4c4"
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
        fill="rgba(197, 150, 66, 0.24)"
        stroke="rgba(197, 150, 66, 0.6)"
        strokeWidth={1}
      />
      {beltMidi != null && (
        <line
          x1={x(beltMidi) + CW / 2}
          y1={0}
          x2={x(beltMidi) + CW / 2}
          y2={KH}
          stroke="#9d3f33"
          strokeWidth={1.5}
          strokeDasharray="3 2"
        />
      )}
      {[low, high].map((m) => (
        <text
          key={m}
          x={x(m) + CW / 2}
          y={KH + 13}
          textAnchor="middle"
          fontSize={10}
          fontWeight={600}
          fontFamily="var(--font-mono)"
          fill="#c59642"
        >
          {midiToLabel(m)}
        </text>
      ))}
      {Array.from({ length: n }, (_, i) => stripLow + i)
        .filter((m) => m % 12 === 0 && Math.abs(m - low) > 1 && Math.abs(m - high) > 1)
        .map((m) => (
          <text
            key={`oct-${m}`}
            x={x(m) + CW / 2}
            y={KH + 13}
            textAnchor="middle"
            fontSize={8}
            fontFamily="var(--font-mono)"
            fill="#8a8272"
          >
            {midiToLabel(m)}
          </text>
        ))}
    </svg>
  );
}
