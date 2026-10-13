/**
 * The range-history chart's caption. Range edges move slowly, if at all
 * (content/book/11-tracking-change.md), so after one test the caption asks for
 * a retest to chart change, not growth, and afterwards it reports whatever
 * the tests show: more, fewer or the same number of semitones.
 */
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { RangeHistoryChart } from "@/components/progress/pro-charts";
import type { RangeEntry } from "@/lib/analytics";

const test = (lowMidi: number, highMidi: number, testedAt: string): RangeEntry => ({
  lowMidi,
  highMidi,
  testedAt,
});

describe("the range history caption", () => {
  it("after one test, asks for a retest weeks apart without promising growth", () => {
    const html = renderToStaticMarkup(<RangeHistoryChart history={[test(48, 69, "2026-09-01T12:00:00Z")]} />);
    expect(html).toContain("retest about six weeks after this one to chart any change");
    expect(html).not.toMatch(/growth/i);
  });

  it("reports a narrower or unchanged range as plainly as a wider one", () => {
    const narrower = renderToStaticMarkup(
      <RangeHistoryChart history={[test(48, 69, "2026-08-01T12:00:00Z"), test(49, 68, "2026-09-12T12:00:00Z")]} />,
    );
    expect(narrower).toContain("-2 semitones since your first test");
    const same = renderToStaticMarkup(
      <RangeHistoryChart history={[test(48, 69, "2026-08-01T12:00:00Z"), test(48, 69, "2026-09-12T12:00:00Z")]} />,
    );
    expect(same).toContain("unchanged since your first test");
  });
});
