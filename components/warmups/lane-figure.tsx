import { AMBER, COOL, DIM, LINE, LINE2, MONO } from "@/lib/chart-colors";
import { ExampleChip, cn } from "@/components/figures/chip";

const W = 600;
const H = 200;
const X0 = 44;
const X1 = 588;
/** One lane per scale degree, C4 at the bottom, G4 at the top. */
const LANE_H = 28;
const TOP = 34;
const NAMES = ["C4", "D4", "E4", "F4", "G4"] as const;
const laneY = (degree: number) => TOP + (NAMES.length - 1 - degree) * LANE_H;

/** A five-note scale up and back down: the pattern the warmup player draws. */
const PATTERN = [0, 1, 2, 3, 4, 3, 2, 1, 0];
const NOTE_W = (X1 - X0) / PATTERN.length;
/** The playhead, partway through the fourth note: what is left of it is still to sing. */
const PLAYHEAD = X0 + NOTE_W * 3.55;

/** A sample voice: scoops up into the first note, settles, then steps up with each target. */
function tracePoints(): string {
  const pts: string[] = [];
  for (let x = X0 + 4; x <= PLAYHEAD; x += 5) {
    const i = Math.min(PATTERN.length - 1, Math.floor((x - X0) / NOTE_W));
    const into = (x - X0 - i * NOTE_W) / NOTE_W;
    const center = laneY(PATTERN[i]) + LANE_H / 2;
    // The first note starts a little flat and scoops in; later notes land with a small overshoot.
    const settle = i === 0 ? 16 * Math.max(0, 1 - into * 2.5) : -5 * Math.max(0, 1 - into * 5);
    const y = center + settle + 1.6 * Math.sin(x / 5);
    pts.push(`${x.toFixed(0)},${y.toFixed(1)}`);
  }
  return pts.join(" ");
}

const TRACE = tracePoints();
const LAST = TRACE.split(" ").at(-1)!.split(",").map(Number) as [number, number];

/**
 * The warmup player's note lane with sample data: a five-note scale up and
 * back as stepped target bars, and a teal voice trace following the first
 * three and a half of them. Drawn in the gate, before the mic is asked for.
 */
export function LaneFigure({ className }: { className?: string }) {
  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      role="img"
      aria-label="Example of the warmup note lane: nine stepped target bars climb C4, D4, E4, F4, G4 and come back down, and a teal pitch trace scoops into the first bar, settles, and follows the scale up to the playhead. Sample data, not your voice."
      className={cn("block w-full", className)}
    >
      {NAMES.map((name, d) => (
        <g key={name}>
          <line x1={X0} y1={laneY(d) + LANE_H / 2} x2={X1} y2={laneY(d) + LANE_H / 2} stroke={LINE} strokeWidth="1" />
          <text x={X0 - 8} y={laneY(d) + LANE_H / 2 + 4} textAnchor="end" fontFamily={MONO} fontSize="11" fill={DIM}>
            {name}
          </text>
        </g>
      ))}
      {PATTERN.map((d, i) => {
        const x = X0 + i * NOTE_W + 3;
        const ahead = x > PLAYHEAD;
        return (
          <rect
            key={i}
            x={x}
            y={laneY(d) + 3}
            width={NOTE_W - 6}
            height={LANE_H - 6}
            rx="5"
            fill={AMBER}
            fillOpacity={ahead ? 0.1 : 0.22}
            stroke={ahead ? LINE2 : AMBER}
            strokeOpacity={ahead ? 1 : 0.6}
            strokeWidth="1"
          />
        );
      })}
      <line x1={PLAYHEAD} y1={TOP - 10} x2={PLAYHEAD} y2={TOP + NAMES.length * LANE_H + 4} stroke={DIM} strokeWidth="1" strokeDasharray="3 4" />
      <polyline points={TRACE} fill="none" stroke={COOL} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={LAST[0]} cy={LAST[1]} r="4.5" fill={COOL} />
      <ExampleChip right={X1} top={6} />
    </svg>
  );
}
