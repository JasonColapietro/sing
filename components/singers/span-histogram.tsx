import { AMBER, COOL, DIM, LINE2 } from "@/lib/chart-colors";
import type { SpanHistogram } from "@/lib/singer-catalog-position";

const W = 300;
const H = 60;
const BASE = 48;
const GAP = 1;

/** The catalog's span widths as a 300x60 bar chart; this singer's bin in teal, the median marked. */
export function SpanHistogramFigure({
  histogram,
  name,
  spanSemitones,
}: {
  histogram: SpanHistogram;
  name: string;
  spanSemitones: number;
}) {
  const { bins, binSize, singerBin, median } = histogram;
  const max = Math.max(...bins.map((b) => b.count));
  const bw = W / bins.length;
  const first = bins[0].from;
  const span = bins.length * binSize;
  const medianX = ((median - first) / span) * W;
  const label = `Catalog span widths in ${binSize}-semitone bins: ${name}'s ${spanSemitones}-semitone span sits in the bin ${bins[singerBin].count === 1 ? "of 1 singer" : `of ${bins[singerBin].count} singers`}; the median is ${median} semitones.`;
  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="mt-4 block h-auto w-full max-w-[300px]"
      role="img"
      aria-label={label}
    >
      {bins.map((b, i) => {
        const h = max ? (b.count / max) * (BASE - 4) : 0;
        return (
          <rect
            key={b.from}
            x={i * bw + GAP / 2}
            y={BASE - h}
            width={Math.max(0, bw - GAP)}
            height={h}
            fill={i === singerBin ? COOL : LINE2}
          />
        );
      })}
      <line x1={0} y1={BASE} x2={W} y2={BASE} stroke={LINE2} strokeWidth={1} />
      <line x1={medianX} y1={2} x2={medianX} y2={BASE} stroke={AMBER} strokeWidth={1} strokeDasharray="2 2" />
      <text x={2} y={H - 2} fontSize={8} fill={DIM} fontFamily="var(--font-mono)">
        {first} st
      </text>
      <text x={W - 2} y={H - 2} fontSize={8} fill={DIM} fontFamily="var(--font-mono)" textAnchor="end">
        {first + span} st
      </text>
      <text
        x={Math.min(W - 30, Math.max(30, medianX))}
        y={H - 2}
        fontSize={8}
        fill={AMBER}
        fontFamily="var(--font-mono)"
        textAnchor="middle"
      >
        median {median}
      </text>
    </svg>
  );
}
