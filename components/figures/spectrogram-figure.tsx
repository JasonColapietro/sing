import { MAX_HZ, MIN_HZ, RING_HI_HZ, RING_LO_HZ } from "@/lib/audio/spectrum";
import { AMBER, AMBER_INK, DIM, LINE, MONO, PANEL } from "@/lib/chart-colors";
import { ExampleChip, cn } from "./chip";

const W = 960;
const H = 320;
const GUTTER = 44;
const TOP = 12;
const BOTTOM = 304;
const TICKS = [100, 200, 400, 800, 1600, 3200, 6400];
/**
 * A sung A3 and its harmonics, up through the singer's formant band. The source
 * falls with harmonic number, so the fundamental is drawn strongest and the
 * ring band is only a local lift, never the loudest part of the voice.
 */
const F0 = 220;
const HARMONICS = 15;

/** The live canvas's log axis (lib/audio/spectrum logPos), in viewBox units. */
function logY(hz: number): number {
  const t = Math.log(hz / MIN_HZ) / Math.log(MAX_HZ / MIN_HZ);
  return BOTTOM - t * (BOTTOM - TOP);
}

function tick(hz: number): string {
  return hz >= 1000 ? `${hz / 1000}k` : String(hz);
}

/** One harmonic as a rippling band: steady vibrato, the same on every partial. */
function band(y: number): string {
  const pts: string[] = [];
  for (let x = GUTTER + 8; x <= W; x += 12) {
    pts.push(`${x},${(y + 3 * Math.sin(x / 22)).toFixed(1)}`);
  }
  return pts.join(" ");
}

const BANDS = Array.from({ length: HARMONICS }, (_, i) => {
  const k = i + 1;
  const hz = F0 * k;
  const inRing = hz >= RING_LO_HZ - 300 && hz <= RING_HI_HZ + 300;
  return {
    hz,
    points: band(logY(hz)),
    width: Math.max(5, 11 - k * 0.5),
    opacity: inRing ? 0.6 : Math.max(0.2, 0.95 - 0.07 * (k - 1)),
  };
});

/**
 * What the analyzer paints before the mic is on: a sung A3 as a stack of
 * harmonics on the live canvas's log axis, with the ring band and 440 Hz marked.
 */
export function SpectrogramFigure({ className }: { className?: string }) {
  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="xMinYMid slice"
      role="img"
      aria-label="Example spectrogram of a sung A3: horizontal harmonic bands stacked up a logarithmic frequency axis, rippling with vibrato, strongest at the fundamental and low harmonics and fading upward, with a lift around the 2.8 to 3.2 kilohertz ring band, and 440 hertz marked. Sample data, not your voice."
      className={cn("block w-full", className)}
    >
      <rect x="0" y="0" width={W} height={H} fill={PANEL} />
      {TICKS.map((hz) => (
        <g key={hz}>
          <line x1={GUTTER} y1={logY(hz)} x2={W} y2={logY(hz)} stroke={LINE} strokeWidth="1" opacity="0.7" />
          <text x={GUTTER - 6} y={logY(hz) + 3.5} textAnchor="end" fontFamily={MONO} fontSize="10" fill={DIM}>
            {tick(hz)}
          </text>
        </g>
      ))}
      <rect
        x={GUTTER}
        y={logY(RING_HI_HZ)}
        width={W - GUTTER}
        height={logY(RING_LO_HZ) - logY(RING_HI_HZ)}
        fill={AMBER}
        opacity="0.12"
      />
      {BANDS.map((b) => (
        <polyline
          key={b.hz}
          points={b.points}
          fill="none"
          stroke={AMBER}
          strokeWidth={b.width}
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity={b.opacity}
        />
      ))}
      <line
        x1={GUTTER}
        y1={logY(440)}
        x2={W}
        y2={logY(440)}
        stroke={AMBER_INK}
        strokeWidth="1"
        strokeDasharray="4 4"
      />
      <text x={GUTTER + 10} y={logY(440) - 6} fontFamily={MONO} fontSize="10" fontWeight="700" fill={AMBER_INK}>
        440 Hz
      </text>
      <ExampleChip right={GUTTER + 76} top={8} />
    </svg>
  );
}
