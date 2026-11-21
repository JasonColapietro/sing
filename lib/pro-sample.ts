/**
 * The one sample voice Pro is shown on, for a visitor with no record of their
 * own: the example coach report (components/pro/pro-visual.tsx, on / and
 * /pro) and the /pro showcase's charts both draw it, so the two never
 * describe different singers.
 *
 * Public surface:
 *   SAMPLE_DATA_LABEL     the words a surface prints beside the sample
 *   SAMPLE_RANGE          the voice's range, as midi and as note names
 *   SAMPLE_NOTES          one row per scored note: name, tally, accuracy
 *   SAMPLE_ACCURACY       in-tune share of all scored time, a whole percent
 *   SAMPLE_WEAK_NOTE      the note the sample is weakest on
 *   SAMPLE_NOTE_TALLIES   NoteTallies, for <NoteAccuracyChart tallies={...} />
 *   SAMPLE_RANGE_HISTORY  RangeEntry[], for <RangeHistoryChart history={...} />
 *
 * Rules:
 * - It is a made-up voice, so every surface that draws it prints
 *   SAMPLE_DATA_LABEL where a sighted reader sees it, and names it a sample
 *   to a screen reader. It never stands in for the visitor's own record.
 * - Deterministic: fixed dates and fixed numbers, never Date.now() or
 *   Math.random(), so the server HTML and the first client render agree and
 *   nothing shifts on hydration.
 * - It claims no outcome. The middle range test is narrower at both ends (a
 *   tired day measures short) and the last one is back where the first was:
 *   range edges move slowly if at all, and a sample that widened would
 *   promise growth nobody measured.
 * - The coach report's next step is the one the coach's plan gives this
 *   voice (see pro-visual.tsx), so the range must stay at least
 *   OCTAVE_SIREN_MIN_SEMIS wide with the weak note within five semitones of
 *   its top. pro-sample.test.ts holds both.
 * - Constants and type-only imports: the homepage draws the coach report, and
 *   this module must add nothing to its bundle. The note names are typed
 *   here for that reason, and the test checks each against midiToLabel.
 */
import type { NoteTallies, RangeEntry } from "./analytics";

/** Printed wherever the sample is drawn. */
export const SAMPLE_DATA_LABEL = "Sample data";

/** The sample voice's range: A2 to G4, 22 semitones. */
export const SAMPLE_RANGE = { lowMidi: 45, highMidi: 67, low: "A2", high: "G4" } as const;

/**
 * Seconds scored and seconds in tune for each note of a C major scale across
 * the range. Steady through the middle, a little looser at the edges, and
 * one note near the top that plainly needs work: the shape the chart exists
 * to show.
 * [midi, name, scored seconds, in-tune seconds, mean cents off]
 */
const ROWS: ReadonlyArray<readonly [number, string, number, number, number]> = [
  [45, "A2", 16, 12, 22],
  [47, "B2", 22, 18, 18],
  [48, "C3", 30, 26, 15],
  [50, "D3", 34, 30.5, 13],
  [52, "E3", 38, 35, 11],
  [53, "F3", 36, 32.5, 12],
  [55, "G3", 44, 40.5, 10],
  [57, "A3", 41, 37, 12],
  [59, "B3", 33, 28.5, 15],
  [60, "C4", 38, 33.5, 13],
  [62, "D4", 27, 22.5, 17],
  [64, "E4", 24, 11, 36],
  [65, "F4", 18, 14, 21],
  [67, "G4", 14, 10.5, 24],
];

export interface SampleNote {
  midi: number;
  label: string;
  sec: number;
  hitSec: number;
  cents: number;
  /** In-tune share of this note's scored time, a whole percent. */
  accuracy: number;
}

export const SAMPLE_NOTES: readonly SampleNote[] = ROWS.map(([midi, label, sec, hitSec, cents]) => ({
  midi,
  label,
  sec,
  hitSec,
  cents,
  accuracy: Math.round((hitSec / sec) * 100),
}));

export const SAMPLE_ACCURACY = Math.round(
  (SAMPLE_NOTES.reduce((sum, n) => sum + n.hitSec, 0) / SAMPLE_NOTES.reduce((sum, n) => sum + n.sec, 0)) * 100,
);

export const SAMPLE_WEAK_NOTE: SampleNote = SAMPLE_NOTES.reduce((a, b) => (b.accuracy < a.accuracy ? b : a));

export const SAMPLE_NOTE_TALLIES: NoteTallies = Object.fromEntries(
  SAMPLE_NOTES.map(({ midi, sec, hitSec, cents }) => [
    String(midi),
    { sec, hitSec, cents, frames: Math.round(sec * 40) },
  ]),
);

/**
 * Three range tests six weeks apart (RANGE_RETEST_DAYS; pro-sample.test.ts
 * holds the two together), on fixed dates. The middle one is two semitones
 * short at each end, so the chart shows three different bars rather than one
 * bar three times.
 */
export const SAMPLE_RANGE_HISTORY: RangeEntry[] = [
  { lowMidi: SAMPLE_RANGE.lowMidi, highMidi: SAMPLE_RANGE.highMidi, testedAt: "2026-06-01T09:00:00.000Z" },
  { lowMidi: 47, highMidi: 65, testedAt: "2026-07-13T09:00:00.000Z" },
  { lowMidi: SAMPLE_RANGE.lowMidi, highMidi: SAMPLE_RANGE.highMidi, testedAt: "2026-08-24T09:00:00.000Z" },
];
