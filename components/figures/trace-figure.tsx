import { COOL, DIM, LINE, MONO, OK, OK_INK } from "@/lib/chart-colors";
import { ExampleChip, cn } from "./chip";

const W = 640;
const H = 220;
/** The lane grid: eight seconds across, a semitone per lane. */
const X0 = 40;
const X1 = 620;
const AXIS_Y = 196;
const LANES = [30, 60, 90, 120, 150, 180];
/** The target band, C4, one lane tall. */
const BAND_TOP = 96;
const BAND_H = 24;
const CENTER = BAND_TOP + BAND_H / 2;

/** A trace that wobbles for three seconds, overshoots, then settles a touch sharp. */
function tracePoints(): string {
  const pts: string[] = [];
  for (let x = X0; x <= 600; x += 8) {
    let y: number;
    if (x < 200) {
      y = 152 - ((x - X0) / 160) * 50 + 8 * Math.sin(x / 9);
    } else if (x < 300) {
      y = 102 - 10 * Math.sin(((x - 200) / 100) * Math.PI);
    } else {
      y = CENTER - 2 + 2.5 * Math.sin(x / 7);
    }
    pts.push(`${x},${y.toFixed(1)}`);
  }
  return pts.join(" ");
}

const TRACE = tracePoints();
const LAST = TRACE.split(" ").at(-1)!.split(",").map(Number) as [number, number];

/**
 * The studio's pitch trace with sample data: a teal line finding and holding
 * a C4 target over eight seconds.
 */
export function TraceFigure({ className }: { className?: string }) {
  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      role="img"
      aria-label="Example of the studio's pitch trace: over eight seconds a teal line wobbles, then settles inside the green target band at C4, ending twelve cents sharp. Sample data, not your voice."
      className={cn("block w-full", className)}
    >
      {LANES.map((y) => (
        <line key={y} x1={X0} y1={y} x2={X1} y2={y} stroke={LINE} strokeWidth="1" />
      ))}
      <rect x={X0} y={BAND_TOP} width={X1 - X0} height={BAND_H} fill={OK} opacity="0.16" />
      <line
        x1={X0}
        y1={CENTER}
        x2={X1}
        y2={CENTER}
        stroke={OK}
        strokeWidth="1"
        strokeDasharray="3 5"
        opacity="0.7"
      />
      <text
        x={X0 - 8}
        y={CENTER + 4}
        textAnchor="end"
        fontFamily={MONO}
        fontSize="11"
        fontWeight="700"
        fill={OK_INK}
      >
        C4
      </text>
      <line x1={X0} y1={AXIS_Y} x2={X1} y2={AXIS_Y} stroke={LINE} strokeWidth="1" />
      {[
        [X0, "−8 s", "start"],
        [(X0 + X1) / 2, "−4 s", "middle"],
        [X1, "now", "end"],
      ].map(([x, t, anchor]) => (
        <text
          key={t}
          x={x as number}
          y={AXIS_Y + 16}
          textAnchor={anchor as "start" | "middle" | "end"}
          fontFamily={MONO}
          fontSize="10"
          fill={DIM}
        >
          {t}
        </text>
      ))}
      <polyline
        points={TRACE}
        fill="none"
        stroke={COOL}
        strokeWidth="2.25"
        strokeLinecap="round"
        strokeLinejoin="round"
        pathLength={1000}
        className="pro-visual-spark"
      />
      <circle cx={LAST[0]} cy={LAST[1]} r="3.5" fill={COOL} />
      <text
        x={LAST[0] - 10}
        y={BAND_TOP - 8}
        textAnchor="end"
        fontFamily={MONO}
        fontSize="11"
        fill={COOL}
      >
        +12¢
      </text>
      <ExampleChip right={W - 8} top={8} />
    </svg>
  );
}
