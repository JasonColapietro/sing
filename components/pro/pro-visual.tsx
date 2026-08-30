import styles from "./pro-visual.module.css";
import {
  AMBER,
  AMBER_INK,
  DIM,
  LINE,
  LINE2,
  MONO,
  PANEL,
  REC,
} from "@/lib/chart-colors";
import { ProChip } from "./ui";

/** Weekly range span, chart units above the floor. [low, high] per week —
    the band widens week over week: lows drop, highs climb. */
const RANGE_WEEKS = [
  [96, 118],
  [93, 124],
  [89, 130],
  [84, 136],
  [78, 142],
  [71, 148],
  [61, 154],
  [50, 160],
] as const;

/** Per-note accuracy bars: label, height (of 96 max), weak note flagged. */
const NOTE_BARS: Array<{
  label: string;
  h: number;
  cls: string;
  weak?: boolean;
}> = [
  { label: "C4", h: 78, cls: styles.b1 },
  { label: "D4", h: 84, cls: styles.b2 },
  { label: "E4", h: 44, cls: styles.b3, weak: true },
  { label: "F4", h: 72, cls: styles.b4 },
  { label: "G4", h: 88, cls: styles.b5 },
  { label: "A4", h: 82, cls: styles.b6 },
  { label: "B4", h: 64, cls: styles.b7 },
];

const SPARK_X0 = 36;
const SPARK_W = 250;
const SPARK_STEP = SPARK_W / (RANGE_WEEKS.length - 1);

function sparkPoints(pick: (w: readonly [number, number]) => number): string {
  return RANGE_WEEKS.map(
    (w, i) => `${SPARK_X0 + i * SPARK_STEP},${230 - pick(w)}`,
  ).join(" ");
}

const HIGH_LINE = sparkPoints((w) => w[1]);
const LOW_LINE = sparkPoints((w) => w[0]);
const BAND = `${HIGH_LINE} ${LOW_LINE.split(" ").reverse().join(" ")}`;

/**
 * The Pro "coach report": range growth over eight weeks plus per-note
 * accuracy with the weak note flagged. Same console-card frame as the
 * landing hero visual, in gold. Pure CSS animation.
 */
export default function ProVisual() {
  return (
    <div className="overflow-hidden rounded-2xl border border-violet/40 bg-panel">
      <div className="flex items-center justify-between border-b border-line bg-panel2 px-4 py-2.5">
        <span className="flex items-center gap-2">
          <ProChip />
          <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-mut">
            Coach report — week 8
          </span>
        </span>
        <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-ok-ink">
          Range +4 st
        </span>
      </div>

      <svg
        viewBox="0 0 640 300"
        role="img"
        aria-label="Pro coach report: a chart of vocal range widening over eight weeks, and per-note accuracy bars with E4 flagged as the note to work on"
        className="block w-full"
      >
        {/* ---- left: range growth band ---- */}
        <text
          x="36"
          y="52"
          fontFamily={MONO}
          fontSize="11"
          letterSpacing="1.5"
          fill={DIM}
        >
          RANGE / 8 WEEKS
        </text>
        {[86, 134, 182, 230].map((y) => (
          <line
            key={y}
            x1="36"
            y1={y}
            x2="286"
            y2={y}
            stroke={LINE}
            strokeWidth="1"
          />
        ))}
        <polygon
          points={BAND}
          fill="rgba(197, 150, 66, 0.14)"
          className={styles.sparkFill}
        />
        <polyline
          points={HIGH_LINE}
          fill="none"
          stroke={AMBER}
          strokeWidth="2.25"
          strokeLinecap="round"
          strokeLinejoin="round"
          pathLength={1000}
          className={styles.spark}
        />
        <polyline
          points={LOW_LINE}
          fill="none"
          stroke={AMBER}
          strokeWidth="2.25"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.55"
          pathLength={1000}
          className={styles.spark}
        />
        <g className={styles.note}>
          <text
            x="286"
            y="72"
            textAnchor="end"
            fontFamily={MONO}
            fontSize="11"
            fill={AMBER_INK}
          >
            G4
          </text>
          <text
            x="286"
            y="192"
            textAnchor="end"
            fontFamily={MONO}
            fontSize="11"
            fill={AMBER_INK}
          >
            E2
          </text>
        </g>

        {/* ---- divider ---- */}
        <line x1="322" y1="36" x2="322" y2="264" stroke={LINE} strokeWidth="1" />

        {/* ---- right: per-note accuracy ---- */}
        <text
          x="356"
          y="52"
          fontFamily={MONO}
          fontSize="11"
          letterSpacing="1.5"
          fill={DIM}
        >
          ACCURACY BY NOTE
        </text>
        <line x1="356" y1="230" x2="604" y2="230" stroke={LINE2} strokeWidth="1" />
        {NOTE_BARS.map((b, i) => {
          const x = 356 + i * 36;
          return (
            <g key={b.label}>
              <rect
                x={x}
                y={230 - b.h}
                width="22"
                height={b.h}
                rx="5"
                fill={b.weak ? "rgba(157, 63, 51, 0.55)" : AMBER}
                className={`${styles.bar} ${b.cls}`}
              />
              <text
                x={x + 11}
                y="250"
                textAnchor="middle"
                fontFamily={MONO}
                fontSize="10"
                fill={b.weak ? REC : DIM}
              >
                {b.label}
              </text>
            </g>
          );
        })}
        <g className={styles.note}>
          <rect
            x="410"
            y="120"
            width="94"
            height="24"
            rx="12"
            fill={PANEL}
            stroke={REC}
            strokeWidth="1"
          />
          <text
            x="457"
            y="136"
            textAnchor="middle"
            fontFamily={MONO}
            fontSize="10.5"
            fill={REC}
          >
            WORK E4 ↘
          </text>
        </g>
      </svg>

      <div className="flex items-center justify-between border-t border-line px-4 py-2.5 font-mono text-[11px] uppercase tracking-[0.14em]">
        <span className="text-dim">Tomorrow: head-voice builder, 12 min</span>
        <span className="text-violet-ink">Accuracy 87%</span>
      </div>
    </div>
  );
}
