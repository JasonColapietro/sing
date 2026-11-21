import { describe, expect, it } from "vitest";
import { noteReports, rangeGrowth, rangeSeries } from "./analytics";
import { RANGE_RETEST_DAYS } from "./progress";
import {
  SAMPLE_DATA_LABEL,
  SAMPLE_NOTE_TALLIES,
  SAMPLE_RANGE,
  SAMPLE_RANGE_HISTORY,
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

  it("is labelled as a sample", () => {
    expect(SAMPLE_DATA_LABEL).toMatch(/sample/i);
  });
});
