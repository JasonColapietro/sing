import {
  AMBER,
  AMBER_INK,
  DIM,
  LINE,
  LINE2,
  MONO,
  STRIP_BLACK,
  STRIP_WHITE,
} from "@/lib/chart-colors";
import { ExampleChip, cn } from "./chip";

/** C2..C6, the same bounds as components/range/piano-strip.tsx. */
const LOW = 36;
const HIGH = 84;
const WHITE_W = 20;
const BLACK_W = 12;
const KEY_TOP = 34;
const WHITE_H = 72;
const BLACK_H = 44;
const LABEL_Y = 122;
const BLACK_PCS = new Set([1, 3, 6, 8, 10]);

/** The example span: G2 to E4, a common first result. */
const MARK_LOW = 43;
const MARK_HIGH = 64;
const NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

function label(midi: number): string {
  return `${NAMES[midi % 12]}${Math.floor(midi / 12) - 1}`;
}

interface Key {
  midi: number;
  x: number;
  black: boolean;
}

const KEYS: Key[] = [];
let whites = 0;
for (let m = LOW; m <= HIGH; m++) {
  const black = BLACK_PCS.has(m % 12);
  KEYS.push({ midi: m, x: black ? whites * WHITE_W - BLACK_W / 2 : whites * WHITE_W, black });
  if (!black) whites++;
}
const W = whites * WHITE_W;

function centerX(midi: number): number {
  const k = KEYS.find((key) => key.midi === midi);
  if (!k) return 0;
  return k.black ? k.x + BLACK_W / 2 : k.x + WHITE_W / 2;
}

const X_LOW = centerX(MARK_LOW);
const X_HIGH = centerX(MARK_HIGH);

/**
 * The range test's result shape, drawn before the mic is asked for: a C2–C6
 * keyboard strip with an example span bracketed on it.
 */
export function RangeFigure({ className }: { className?: string }) {
  return (
    <svg
      viewBox={`0 0 ${W} 136`}
      role="img"
      aria-label={`Example of a range test result: a keyboard from C2 to C6 with a sample range of ${label(MARK_LOW)} to ${label(MARK_HIGH)} bracketed on it. Sample data, not your voice.`}
      className={cn("block w-full", className)}
    >
      <text x={X_LOW} y="12" fontFamily={MONO} fontSize="10" letterSpacing="1.5" fill={AMBER_INK}>
        YOUR RANGE
      </text>
      <path
        d={`M${X_LOW},28 V20 H${X_HIGH} V28`}
        fill="none"
        stroke={AMBER_INK}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <ExampleChip right={W - 4} top={4} />
      {KEYS.filter((k) => !k.black).map((k) => (
        <rect
          key={k.midi}
          x={k.x}
          y={KEY_TOP}
          width={WHITE_W}
          height={WHITE_H}
          fill={STRIP_WHITE}
          stroke={LINE2}
          strokeWidth="1"
        />
      ))}
      {KEYS.filter((k) => k.black).map((k) => (
        <rect
          key={k.midi}
          x={k.x}
          y={KEY_TOP}
          width={BLACK_W}
          height={BLACK_H}
          fill={STRIP_BLACK}
          stroke={LINE}
          strokeWidth="1"
        />
      ))}
      <rect
        x={X_LOW - WHITE_W / 2}
        y={KEY_TOP}
        width={X_HIGH - X_LOW + WHITE_W}
        height={WHITE_H}
        fill={AMBER}
        opacity="0.18"
      />
      {[X_LOW, X_HIGH].map((x) => (
        <line
          key={x}
          x1={x}
          y1={KEY_TOP}
          x2={x}
          y2={KEY_TOP + WHITE_H}
          stroke={AMBER_INK}
          strokeWidth="2"
        />
      ))}
      {KEYS.filter((k) => !k.black && k.midi % 12 === 0).map((k) => (
        <text
          key={k.midi}
          x={k.x + WHITE_W / 2}
          y={LABEL_Y}
          textAnchor="middle"
          fontFamily={MONO}
          fontSize="9"
          fill={DIM}
        >
          {label(k.midi)}
        </text>
      ))}
      {[MARK_LOW, MARK_HIGH].map((m) => (
        <text
          key={m}
          x={centerX(m)}
          y={LABEL_Y}
          textAnchor="middle"
          fontFamily={MONO}
          fontSize="12"
          fontWeight="700"
          fill={AMBER_INK}
        >
          {label(m)}
        </text>
      ))}
    </svg>
  );
}
