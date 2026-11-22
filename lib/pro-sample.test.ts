import { describe, expect, it } from "vitest";
import { OCTAVE_SIREN_MIN_SEMIS } from "@/components/warmups/exercises";
import { noteReports, overallAccuracy, rangeGrowth, rangeSeries, weakNotes } from "./analytics";
import { midiToLabel } from "./audio/notes";
import { RANGE_RETEST_DAYS } from "./progress";
import {
  SAMPLE_ACCURACY,
  SAMPLE_NOTE_TALLIES,
  SAMPLE_NOTES,
  SAMPLE_RANGE,
  SAMPLE_RANGE_HISTORY,
  SAMPLE_WEAK_NOTE,
} from "./pro-sample";

describe("the Pro sample voice", () => {
  it("scores only notes inside its own range", () => {
    const reports = noteReports(SAMPLE_NOTE_TALLIES);
    // Every note clears the chart's minimum scored time, so none is dropped.
    expect(reports).toHaveLength(Object.keys(SAMPLE_NOTE_TALLIES).length);
    expect(reports.length).toBeGreaterThan(5);
    for (const r of reports) {
      expect(r.midi).toBeGreaterThanOrEqual(SAMPLE_RANGE.lowMidi);
      expect(r.midi).toBeLessThanOrEqual(SAMPLE_RANGE.highMidi);
    }
  });

  it("holds possible tallies: in-tune time never exceeds scored time", () => {
    for (const t of Object.values(SAMPLE_NOTE_TALLIES)) {
      expect(t.sec).toBeGreaterThan(0);
      expect(t.hitSec).toBeGreaterThan(0);
      expect(t.hitSec).toBeLessThanOrEqual(t.sec);
      expect(t.cents).toBeGreaterThanOrEqual(0);
      expect(t.cents).toBeLessThanOrEqual(50);
    }
  });

  it("charts every range test, each inside the sample range, ending on it", () => {
    const series = rangeSeries(SAMPLE_RANGE_HISTORY);
    expect(series).toHaveLength(SAMPLE_RANGE_HISTORY.length);
    for (const p of series) {
      expect(p.lowMidi).toBeGreaterThanOrEqual(SAMPLE_RANGE.lowMidi);
      expect(p.highMidi).toBeLessThanOrEqual(SAMPLE_RANGE.highMidi);
    }
    const last = series[series.length - 1];
    expect([last.lowMidi, last.highMidi]).toEqual([SAMPLE_RANGE.lowMidi, SAMPLE_RANGE.highMidi]);
  });

  it("promises no growth: the sample ends as wide as it began", () => {
    expect(rangeGrowth(SAMPLE_RANGE_HISTORY)).toBe(0);
  });

  it("spaces its tests by the retest interval the product recommends, on fixed dates", () => {
    const times = SAMPLE_RANGE_HISTORY.map((e) => Date.parse(e.testedAt));
    for (let i = 1; i < times.length; i++) {
      expect((times[i] - times[i - 1]) / 86_400_000).toBe(RANGE_RETEST_DAYS);
    }
  });

  it("shows a middle test a reader can tell from the others", () => {
    // Three identical bars read as one test drawn three times; a one-semitone
    // wobble is under a pixel on a phone.
    const [first, middle, last] = rangeSeries(SAMPLE_RANGE_HISTORY);
    expect(middle.lowMidi - first.lowMidi).toBeGreaterThanOrEqual(2);
    expect(first.highMidi - middle.highMidi).toBeGreaterThanOrEqual(2);
    expect(last.semitones).toBe(first.semitones);
  });

  it("types the constants the coach report prints as the charts compute them", () => {
    // pro-visual.tsx reads these literals so the homepage imports no chart
    // code; the showcase's charts compute theirs from the same tallies.
    for (const note of SAMPLE_NOTES) expect(note.label, String(note.midi)).toBe(midiToLabel(note.midi));
    expect(SAMPLE_RANGE.low).toBe(midiToLabel(SAMPLE_RANGE.lowMidi));
    expect(SAMPLE_RANGE.high).toBe(midiToLabel(SAMPLE_RANGE.highMidi));
    expect(SAMPLE_ACCURACY).toBe(overallAccuracy(SAMPLE_NOTE_TALLIES));
    const [weakest, next] = weakNotes(SAMPLE_NOTE_TALLIES, { limit: 2 });
    expect(SAMPLE_WEAK_NOTE.midi).toBe(weakest.midi);
    expect(SAMPLE_WEAK_NOTE.accuracy).toBe(weakest.accuracy);
    // One note stands out: the chart paints a note red under 70%.
    expect(weakest.accuracy).toBeLessThan(70);
    expect(next.accuracy).toBeGreaterThanOrEqual(70);
  });

  it("is a voice the coach gives the octave siren: wide enough, weak near the top", () => {
    // components/progress/coach.tsx buildPlan; the coach report's footer
    // names that exercise (pro-visual.test.tsx).
    expect(SAMPLE_RANGE.highMidi - SAMPLE_RANGE.lowMidi).toBeGreaterThanOrEqual(OCTAVE_SIREN_MIN_SEMIS);
    expect(SAMPLE_WEAK_NOTE.midi).toBeGreaterThanOrEqual(SAMPLE_RANGE.highMidi - 5);
  });
});
