import { AMBER, DIM, LINE, MONO, MUT, PANEL, REC } from "@/lib/chart-colors";
import { ExampleChip, cn } from "./chip";

const W = 640;
const H = 96;
const X0 = 10;
const X1 = 630;
const STEP = 4;
const MID = 60;
const PLAYHEAD = X0 + Math.round((X1 - X0) * 0.42);

/** Deterministic bar heights: a sung phrase's envelope with syllable swells. */
function bars(): Array<{ x: number; h: number }> {
  const out: Array<{ x: number; h: number }> = [];
  const n = Math.floor((X1 - X0) / STEP);
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const env = Math.sin(Math.PI * t) ** 0.6;
    const syl = 0.35 + 0.65 * (Math.abs(Math.sin(i * 0.37) + 0.5 * Math.sin(i * 1.3)) / 1.5);
    out.push({ x: X0 + i * STEP, h: Number((3 + 28 * env * syl).toFixed(1)) });
  }
  return out;
}

const BARS = bars();

/**
 * A saved take's waveform strip with sample data: the amber bars the recorder
 * draws, a playhead part-way through, and the take's name and position.
 */
export function WaveformFigure({ className }: { className?: string }) {
  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      role="img"
      aria-label="Example of a saved take in the recorder: an amber waveform strip labelled Take 2, with the playhead fourteen seconds in. Sample data, not your recording."
      className={cn("block w-full", className)}
    >
      <rect x="0" y="0" width={W} height={H} fill={PANEL} />
      <text x={X0 + 2} y="18" fontFamily={MONO} fontSize="11" fill={MUT}>
        Take 2 · 0:14
      </text>
      <line x1={X0} y1={MID} x2={X1} y2={MID} stroke={LINE} strokeWidth="1" />
      {BARS.map((b) => (
        <rect
          key={b.x}
          x={b.x - 1.25}
          y={MID - b.h}
          width="2.5"
          height={b.h * 2}
          rx="1.25"
          fill={AMBER}
          opacity={b.x <= PLAYHEAD ? 0.95 : 0.32}
        />
      ))}
      <line x1={PLAYHEAD} y1="28" x2={PLAYHEAD} y2={H - 4} stroke={REC} strokeWidth="1.5" />
      <text x={X1} y={H - 6} textAnchor="end" fontFamily={MONO} fontSize="10" fill={DIM}>
        0:31
      </text>
      <ExampleChip right={W - 8} top={6} />
    </svg>
  );
}
