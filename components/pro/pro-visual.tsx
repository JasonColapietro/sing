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

/**
 * The drawing's two layouts. One unit of the wide one is under a CSS pixel at
 * a desktop column and about half of one on a phone, where its 11-unit labels
 * came out near 6px. So a phone gets its own drawing, `NARROW`, whose viewBox
 * is about as wide as the phone's card: one unit is about one pixel and every
 * label is 11px or more. The wide one, shown from `sm` up, labels every other
 * bar so its text can be 12 units. Fewer labels, never smaller ones.
 */
interface Layout {
  w: number;
  h: number;
  /** Panel edges: the range band, then the bars. */
  left: [number, number];
  right: [number, number];
  /** Baseline of the last title line. */
  titleY: number;
  /** Top gridline and the shared baseline. */
  top: number;
  base: number;
  font: number;
  /** Titles on two lines where one would not fit the panel. */
  stacked: boolean;
  /** Label every nth bar. */
  labelEvery: number;
  tag: { w: number; h: number; y: number };
}
const WIDE: Layout = {
  w: 640,
  h: 300,
  left: [36, 286],
  right: [356, 604],
  titleY: 52,
  top: 86,
  base: 230,
  font: 13,
  stacked: false,
  labelEvery: 2,
  tag: { w: 100, h: 24, y: 112 },
};
const NARROW: Layout = {
  w: 340,
  h: 226,
  left: [14, 150],
  right: [184, 328],
  titleY: 38,
  top: 62,
  base: 190,
  font: 11,
  stacked: true,
  labelEvery: 2,
  tag: { w: 84, h: 22, y: 78 },
};

const WEAK_INDEX = SAMPLE_NOTES.findIndex((n) => n.midi === SAMPLE_WEAK_NOTE.midi);
const RANGE_TITLE = [`RANGE`, `${TESTS.length} TESTS · ${WEEKS} WEEKS`] as const;
const NOTES_TITLE = ["ACCURACY", "BY NOTE"] as const;

/** One drawing of the report, in the given layout. */
function Report({ g, className }: { g: Layout; className: string }) {
  const [l0, l1] = g.left;
  const [r0, r1] = g.right;
  const plotH = g.base - g.top;
  /** The plot spans the sample's range with four semitones of air either side. */
  const perSemi = plotH / (SAMPLE_RANGE.highMidi - SAMPLE_RANGE.lowMidi + 8);
  const yOfMidi = (midi: number) => g.base - (midi - (SAMPLE_RANGE.lowMidi - 4)) * perSemi;
  const sparkStep = (l1 - l0) / (TESTS.length - 1);
  const line = (pick: (test: (typeof TESTS)[number]) => number) =>
    TESTS.map((test, i) => `${l0 + i * sparkStep},${yOfMidi(pick(test)).toFixed(1)}`).join(" ");
  const high = line((t) => t.highMidi);
  const low = line((t) => t.lowMidi);
  const band = `${high} ${low.split(" ").reverse().join(" ")}`;
  const grid = [0, 1, 2, 3].map((i) => g.top + (plotH * i) / 3);

  /** Per-note accuracy bars, two thirds of the plot for 100%, so the tag has air above them. */
  const barStep = (r1 - r0) / SAMPLE_NOTES.length;
  const barW = Math.min(22, Math.round(barStep * 0.62));
  const barX = (i: number) => r0 + i * barStep + (barStep - barW) / 2;
  const barH = (accuracy: number) => Math.round((accuracy / 100) * plotH * (2 / 3));
  /** The "work this note" tag, centred over the weak bar and kept inside the plot. */
  const tagX = Math.min(r1 - g.tag.w, Math.max(r0, barX(WEAK_INDEX) + barW / 2 - g.tag.w / 2));
  const title = (x: number, lines: readonly string[]) =>
    (g.stacked ? lines : [lines.join(lines === RANGE_TITLE ? " / " : " ")]).map((text, i, all) => (
      <text
        key={text}
        x={x}
        y={g.titleY - (all.length - 1 - i) * (g.font + 3)}
        fontFamily={MONO}
        fontSize={g.font}
        letterSpacing={g.stacked ? 1 : 1.5}
        fill={DIM}
      >
        {text}
      </text>
    ));

  return (
    <svg
      viewBox={`0 0 ${g.w} ${g.h}`}
      role="img"
      aria-label={`Example Pro coach report with sample data: three range tests about six weeks apart, and per-note accuracy bars with ${SAMPLE_WEAK_NOTE.label} flagged as the note to work on`}
      className={className}
    >
      {/* ---- left: range history band ---- */}
      {title(l0, RANGE_TITLE)}
      {grid.map((y) => (
        <line
          key={y}
          x1={l0}
          y1={y}
          x2={l1}
          y2={y}
          stroke={LINE}
          strokeWidth="1"
        />
      ))}
      <polygon
        points={band}
        fill="rgba(197, 150, 66, 0.14)"
        className="pro-visual-spark-fill"
      />
      <polyline
        points={high}
        fill="none"
        stroke={AMBER}
        strokeWidth="2.25"
        strokeLinecap="round"
        strokeLinejoin="round"
        pathLength={1000}
        className="pro-visual-spark"
      />
      <polyline
        points={low}
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
          x={l1}
          y={yOfMidi(SAMPLE_RANGE.highMidi) - 5}
          textAnchor="end"
          fontFamily={MONO}
          fontSize={g.font}
          fill={AMBER_INK}
        >
          {SAMPLE_RANGE.high}
        </text>
        <text
          x={l1}
          y={yOfMidi(SAMPLE_RANGE.lowMidi) + g.font + 4}
          textAnchor="end"
          fontFamily={MONO}
          fontSize={g.font}
          fill={AMBER_INK}
        >
          {SAMPLE_RANGE.low}
        </text>
      </g>

      {/* ---- divider ---- */}
      <line x1={(l1 + r0) / 2} y1={g.titleY - 16} x2={(l1 + r0) / 2} y2={g.base + 26} stroke={LINE} strokeWidth="1" />

      {/* ---- right: per-note accuracy ---- */}
      {title(r0, NOTES_TITLE)}
      <line x1={r0} y1={g.base} x2={r1} y2={g.base} stroke={LINE2} strokeWidth="1" />
      {SAMPLE_NOTES.map((note, i) => {
        const weak = i === WEAK_INDEX;
        const h = barH(note.accuracy);
        return (
          <g key={note.label}>
            <rect
              x={barX(i)}
              y={g.base - h}
              width={barW}
              height={h}
              rx="4"
              fill={weak ? "rgba(157, 63, 51, 0.55)" : AMBER}
              className="pro-visual-bar"
              style={{ animationDelay: `${350 + i * 50}ms` }}
            />
            {/* Every other bar, counted so the flagged note keeps its name. */}
            {i % g.labelEvery === WEAK_INDEX % g.labelEvery && (
              <text
                x={barX(i) + barW / 2}
                y={g.base + g.font + 8}
                textAnchor="middle"
                fontFamily={MONO}
                fontSize={g.font}
                fill={weak ? REC : DIM}
              >
                {note.label}
              </text>
            )}
          </g>
        );
      })}
      <g className="pro-visual-note">
        <rect
          x={tagX}
          y={g.tag.y}
          width={g.tag.w}
          height={g.tag.h}
          rx={g.tag.h / 2}
          fill={PANEL}
          stroke={REC}
          strokeWidth="1"
        />
        <text
          x={tagX + g.tag.w / 2}
          y={g.tag.y + g.tag.h / 2 + g.font * 0.36}
          textAnchor="middle"
          fontFamily={MONO}
          fontSize={g.font}
          fill={REC}
        >
          {`WORK ${SAMPLE_WEAK_NOTE.label} ↘`}
        </text>
      </g>
    </svg>
  );
}

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

      {/* Two drawings of one report, one shown at a time; the hidden one is
          display:none, so it is not announced and its animations do not run. */}
      <Report g={NARROW} className="block w-full sm:hidden" />
      <Report g={WIDE} className="hidden w-full sm:block" />

      <div className="flex items-center justify-between border-t border-line px-4 py-2.5 font-mono text-[11px] uppercase tracking-[0.14em]">
        <span className="text-dim">Tomorrow: Octave siren, 6 min</span>
        <span className="text-violet-ink">Accuracy {SAMPLE_ACCURACY}%</span>
      </div>
    </div>
  );
}
