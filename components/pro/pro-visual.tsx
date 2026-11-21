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
import {
  SAMPLE_ACCURACY,
  SAMPLE_DATA_LABEL,
  SAMPLE_NOTES,
  SAMPLE_RANGE,
  SAMPLE_RANGE_HISTORY,
  SAMPLE_WEAK_NOTE,
} from "@/lib/pro-sample";
import { ProChip } from "./ui";

/**
 * The report draws lib/pro-sample.ts, the same sample voice /pro's showcase
 * charts: its three range tests, its per-note tallies, its weakest note and
 * its overall accuracy. Nothing about the voice is typed here.
 *
 * The range band: three tests about six weeks apart, the spacing the coach
 * prompts a retest at (RANGE_RETEST_DAYS) and book ch. 8 advises; testing
 * weekly mostly measures noise. A level band with one short test in the
 * middle, because range edges move slowly, and sometimes not at all (see
 * /book/when-numbers-lie). A band that widened test over test read as a
 * promise of new notes, which is not how voices work and not something Pro
 * can sell.
 */
const TESTS = SAMPLE_RANGE_HISTORY;
const WEEKS = Math.round(
  (Date.parse(TESTS[TESTS.length - 1].testedAt) - Date.parse(TESTS[0].testedAt)) / (7 * 86_400_000),
);

const SPARK_X0 = 36;
const SPARK_W = 250;
const SPARK_STEP = SPARK_W / (TESTS.length - 1);
/** Five units a semitone, with the sample's floor a few lines above the baseline. */
const yOfMidi = (midi: number) => 230 - (midi - (SAMPLE_RANGE.lowMidi - 4)) * 5;

function sparkPoints(pick: (test: (typeof TESTS)[number]) => number): string {
  return TESTS.map((test, i) => `${SPARK_X0 + i * SPARK_STEP},${yOfMidi(pick(test))}`).join(" ");
}

const HIGH_LINE = sparkPoints((t) => t.highMidi);
const LOW_LINE = sparkPoints((t) => t.lowMidi);
const BAND = `${HIGH_LINE} ${LOW_LINE.split(" ").reverse().join(" ")}`;

/** Per-note accuracy bars, 96 units for 100%. Each grows in just after the one before it. */
const BARS_X0 = 356;
const BAR_STEP = 248 / SAMPLE_NOTES.length;
const BAR_W = Math.min(22, Math.round(BAR_STEP * 0.62));
const barX = (i: number) => BARS_X0 + i * BAR_STEP + (BAR_STEP - BAR_W) / 2;
const barH = (accuracy: number) => Math.round(accuracy * 0.96);

const WEAK_INDEX = SAMPLE_NOTES.findIndex((n) => n.midi === SAMPLE_WEAK_NOTE.midi);
/** The "work this note" tag, centred over the weak bar and kept inside the plot. */
const TAG_W = 94;
const TAG_X = Math.min(604 - TAG_W, Math.max(BARS_X0, barX(WEAK_INDEX) + BAR_W / 2 - TAG_W / 2));

/**
 * An example Pro "coach report", labelled as one: three saved range tests
 * about six weeks apart plus per-note accuracy with the weak note flagged.
 * Every figure in it is sample data, and the header says so — but each is one
 * the product can produce: the footer's next step is what the coach's
 * buildPlan names for this voice's weak note (components/progress/coach.tsx:
 * a weak note within five semitones of the ceiling, in a span of at least
 * OCTAVE_SIREN_MIN_SEMIS from components/warmups/exercises.ts, gets the
 * Octave siren for 6 minutes; lib/pro-sample.test.ts holds the sample to
 * both conditions). Same console-card frame as the landing hero
 * visual, in gold. Pure CSS animation: the pro-visual-* rules in
 * app/globals.css, not a CSS module, so the header's prefetch of / and /pro
 * preloads no stylesheet that the page it runs on never uses.
 */
export default function ProVisual() {
  return (
    <div className="overflow-hidden rounded-2xl border border-violet/40 bg-panel">
      <div className="flex items-center justify-between border-b border-line bg-panel2 px-4 py-2.5">
        <span className="flex items-center gap-2">
          <ProChip />
          <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-mut">
            Example coach report
          </span>
        </span>
        <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-dim">
          {SAMPLE_DATA_LABEL}
        </span>
      </div>

      <svg
        viewBox="0 0 640 300"
        role="img"
        aria-label={`Example Pro coach report with sample data: three range tests about six weeks apart, and per-note accuracy bars with ${SAMPLE_WEAK_NOTE.label} flagged as the note to work on`}
        className="block w-full"
      >
        {/* ---- left: range history band ---- */}
        <text
          x="36"
          y="52"
          fontFamily={MONO}
          fontSize="11"
          letterSpacing="1.5"
          fill={DIM}
        >
          {`RANGE / ${TESTS.length} TESTS · ${WEEKS} WEEKS`}
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
          className="pro-visual-spark-fill"
        />
        <polyline
          points={HIGH_LINE}
          fill="none"
          stroke={AMBER}
          strokeWidth="2.25"
          strokeLinecap="round"
          strokeLinejoin="round"
          pathLength={1000}
          className="pro-visual-spark"
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
          className="pro-visual-spark"
        />
        <g className="pro-visual-note">
          <text
            x="286"
            y={yOfMidi(SAMPLE_RANGE.highMidi) - 4}
            textAnchor="end"
            fontFamily={MONO}
            fontSize="11"
            fill={AMBER_INK}
          >
            {SAMPLE_RANGE.high}
          </text>
          <text
            x="286"
            y={yOfMidi(SAMPLE_RANGE.lowMidi) + 16}
            textAnchor="end"
            fontFamily={MONO}
            fontSize="11"
            fill={AMBER_INK}
          >
            {SAMPLE_RANGE.low}
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
        {SAMPLE_NOTES.map((note, i) => {
          const weak = i === WEAK_INDEX;
          const h = barH(note.accuracy);
          return (
            <g key={note.label}>
              <rect
                x={barX(i)}
                y={230 - h}
                width={BAR_W}
                height={h}
                rx="4"
                fill={weak ? "rgba(157, 63, 51, 0.55)" : AMBER}
                className="pro-visual-bar"
                style={{ animationDelay: `${350 + i * 50}ms` }}
              />
              <text
                x={barX(i) + BAR_W / 2}
                y="250"
                textAnchor="middle"
                fontFamily={MONO}
                fontSize="9"
                fill={weak ? REC : DIM}
              >
                {note.label}
              </text>
            </g>
          );
        })}
        <g className="pro-visual-note">
          <rect
            x={TAG_X}
            y="112"
            width={TAG_W}
            height="24"
            rx="12"
            fill={PANEL}
            stroke={REC}
            strokeWidth="1"
          />
          <text
            x={TAG_X + TAG_W / 2}
            y="128"
            textAnchor="middle"
            fontFamily={MONO}
            fontSize="10.5"
            fill={REC}
          >
            {`WORK ${SAMPLE_WEAK_NOTE.label} ↘`}
          </text>
        </g>
      </svg>

      <div className="flex items-center justify-between border-t border-line px-4 py-2.5 font-mono text-[11px] uppercase tracking-[0.14em]">
        <span className="text-dim">Tomorrow: Octave siren, 6 min</span>
        <span className="text-violet-ink">Accuracy {SAMPLE_ACCURACY}%</span>
      </div>
    </div>
  );
}
