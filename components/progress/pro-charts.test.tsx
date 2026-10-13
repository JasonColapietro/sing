/**
 * The range-history chart's caption. Range edges move slowly, if at all
 * (content/book/11-tracking-change.md), so after one test the caption asks for
 * a retest to chart change, not growth, and afterwards it reports whatever
 * the tests show: more, fewer or the same number of semitones.
 */
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { NoteAccuracyChart, RangeHistoryChart } from "@/components/progress/pro-charts";
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
    // Each test's tooltip is one string, so the server renderer writes it.
    expect(html).toMatch(/<title>[^<]+: C3–A4 \(21 semitones, closest fit [^<)]+\)<\/title>/);
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

describe("the per-note accuracy chart", () => {
  // The tallies count time within the ±50-cent scoring window, which passes a
  // phrase sung clearly flat (book chapter 9). On this site "in tune" is the
  // studio's ±15-cent zone, so the chart names the window instead.
  it("names the scoring window in its caption, label and bar titles, never in tune", () => {
    const html = renderToStaticMarkup(
      <NoteAccuracyChart
        tallies={{
          "60": { sec: 10, hitSec: 4, cents: 35, frames: 100 },
          "64": { sec: 10, hitSec: 8, cents: 12, frames: 100 },
        }}
      />,
    );
    expect(html).toContain("within 50 cents of the target across");
    expect(html).toMatch(/Overall \d+% within 50 cents of the target\./);
    expect(html).toContain("<title>C4: 40% within 50 cents of the target over 10s, 35 cents off on average</title>");
    expect(html).not.toMatch(/in tune/i);
  });
});
