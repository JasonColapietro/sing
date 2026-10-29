import { AMBER, COOL, DIM, INK, LINE, LINE2, MONO, OK, PANEL, PANEL2, REC } from "@/lib/chart-colors";
import { ExampleChip, cn } from "./chip";

const W = 640;
const H = 200;
const X0 = 52;
const PLAYHEAD = 250;
const BLOCK_H = 24;

/** Four notes of a phrase; the first two sung, the rest ahead of the playhead. */
const BLOCKS = [
  { label: "C4", x: 60, w: 110, y: 118, state: "hit" },
  { label: "D4", x: 180, w: 110, y: 90, state: "close" },
  { label: "E4", x: 300, w: 110, y: 62, state: "next" },
  { label: "G4", x: 420, w: 160, y: 34, state: "next" },
] as const;

function tracePoints(): string {
  const pts: string[] = [];
  for (let x = 60; x <= PLAYHEAD; x += 6) {
    const center = x < 175 ? 130 : 102;
    const sag = x >= 175 ? 5 : 0;
    const y = center + sag + 2.5 * Math.sin(x / 6);
    pts.push(`${x},${y.toFixed(1)}`);
  }
  return pts.join(" ");
}

const TRACE = tracePoints();
const LAST = TRACE.split(" ").at(-1)!.split(",").map(Number) as [number, number];

/**
 * The songs room's scrolling piano roll with sample data: note blocks, a
 * playhead, and the singer's trace scored against the blocks it has passed.
 */
export function PianoRollFigure({ className }: { className?: string }) {
  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      role="img"
      aria-label="Example of the song piano roll: four note blocks for C4, D4, E4 and G4 with a teal pitch trace running through them; the C4 block is scored green and the D4 block amber. Sample data, not your voice."
      className={cn("block w-full", className)}
    >
      {BLOCKS.map((b) => (
        <line
          key={`lane-${b.label}`}
          x1={X0}
          y1={b.y + BLOCK_H / 2}
          x2={W - 8}
          y2={b.y + BLOCK_H / 2}
          stroke={LINE}
          strokeWidth="1"
        />
      ))}
      {BLOCKS.map((b) => (
        <text
          key={`label-${b.label}`}
          x={X0 - 8}
          y={b.y + BLOCK_H / 2 + 4}
          textAnchor="end"
          fontFamily={MONO}
          fontSize="11"
          fill={DIM}
        >
          {b.label}
        </text>
      ))}
      {BLOCKS.map((b) => (
        <rect
          key={`block-${b.label}`}
          x={b.x}
          y={b.y}
          width={b.w}
          height={BLOCK_H}
          rx="6"
          fill={b.state === "hit" ? OK : b.state === "close" ? AMBER : PANEL2}
          stroke={b.state === "next" ? LINE2 : "none"}
          strokeWidth="1"
          opacity={b.state === "next" ? 1 : 0.85}
        />
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
      <line x1={PLAYHEAD} y1="22" x2={PLAYHEAD} y2="160" stroke={REC} strokeWidth="1.5" />
      <path d={`M${PLAYHEAD - 5},16 H${PLAYHEAD + 5} L${PLAYHEAD},23 Z`} fill={REC} />
      <rect x={X0} y="172" width="118" height="18" rx="9" fill={PANEL} stroke={LINE} />
      <text x={X0 + 59} y="184.5" textAnchor="middle" fontFamily={MONO} fontSize="9.5" letterSpacing="1.2" fill={INK}>
        SING ALONG · 1/4
      </text>
      <ExampleChip right={W - 8} top={8} />
    </svg>
  );
}
