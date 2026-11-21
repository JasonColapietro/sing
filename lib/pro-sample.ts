/**
 * Sample data for showing Pro's charts to a visitor who has none of their own.
 *
 * Public surface (used by the /pro showcase):
 *   SAMPLE_RANGE          { lowMidi, highMidi } of the sample voice (C3 to G4)
 *   SAMPLE_NOTE_TALLIES   NoteTallies, for <NoteAccuracyChart tallies={...} />
 *   SAMPLE_RANGE_HISTORY  RangeEntry[], for <RangeHistoryChart history={...} />
 *   SAMPLE_DATA_LABEL     the visible label a surface must print beside either
 *
 * Rules:
 * - It is a made-up voice, so every surface that draws it prints
 *   SAMPLE_DATA_LABEL (or its own wording that says "sample") where a sighted
 *   reader sees it. It never stands in for the visitor's own record.
 * - Deterministic: fixed dates and fixed numbers, never Date.now() or
 *   Math.random(), so the server HTML and the first client render agree and
 *   nothing shifts on hydration.
 * - It claims no outcome. The range edges wobble by a semitone and end where
 *   they began, as the range result's worked example does
 *   (components/range/result-view.tsx sampleHistory): range edges move slowly
 *   if at all, and a sample that widened would promise growth nobody measured.
 * - Type-only imports, so this module adds nothing to a bundle.
 */
import type { NoteTallies, RangeEntry } from "./analytics";

/** The sample voice's range: C3 to G4, 19 semitones. */
export const SAMPLE_RANGE = { lowMidi: 48, highMidi: 67 } as const;

/** Printed wherever the sample is drawn. */
export const SAMPLE_DATA_LABEL = "Sample data";

/**
 * Seconds scored and seconds in tune for each note of a C major scale across
 * the sample range. The middle is steady and the edges are weaker, which is
 * the shape the chart exists to show: the notes worth practicing stand out.
 * [midi, scored seconds, in-tune seconds, mean cents off]
 */
const SAMPLE_NOTES: ReadonlyArray<readonly [number, number, number, number]> = [
  [48, 14, 8.5, 31],
  [50, 22, 16.5, 24],
  [52, 31, 26, 17],
  [53, 36, 32, 14],
  [55, 44, 40.5, 11],
  [57, 41, 37, 12],
  [59, 33, 28, 16],
  [60, 38, 33.5, 13],
  [62, 27, 21.5, 19],
  [64, 21, 15, 23],
  [65, 16, 10.5, 28],
  [67, 12, 6.5, 34],
];

export const SAMPLE_NOTE_TALLIES: NoteTallies = Object.fromEntries(
  SAMPLE_NOTES.map(([midi, sec, hitSec, cents]) => [
    String(midi),
    { sec, hitSec, cents, frames: Math.round(sec * 40) },
  ]),
);

/**
 * Three range tests six weeks apart (RANGE_RETEST_DAYS; pro-sample.test.ts
 * holds the two together), on fixed dates.
 */
export const SAMPLE_RANGE_HISTORY: RangeEntry[] = [
  { lowMidi: 48, highMidi: 67, testedAt: "2026-06-01T09:00:00.000Z" },
  { lowMidi: 49, highMidi: 66, testedAt: "2026-07-13T09:00:00.000Z" },
  { lowMidi: 48, highMidi: 67, testedAt: "2026-08-24T09:00:00.000Z" },
];
