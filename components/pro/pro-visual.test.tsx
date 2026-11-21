/**
 * The example coach report on /pro and the homepage is sample data, labelled
 * as such — but it must not show a habit the product advises against or a
 * plan the coach cannot produce.
 */
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { EXERCISES } from "@/components/warmups/exercises";
import {
  SAMPLE_ACCURACY,
  SAMPLE_NOTES,
  SAMPLE_RANGE,
  SAMPLE_WEAK_NOTE,
} from "@/lib/pro-sample";
import ProVisual from "./pro-visual";

const html = renderToStaticMarkup(<ProVisual />);

describe("the example coach report", () => {
  it("charts range tests weeks apart, never a weekly testing habit", () => {
    expect(html).toContain("RANGE / 3 TESTS · 12 WEEKS");
    expect(html).toContain("three range tests about six weeks apart");
    expect(html).not.toMatch(/8 WEEKS|eight weeks/i);
  });

  it("names a next step the coach plan can emit: a free catalogue exercise of at most 6 minutes", () => {
    const m = /Tomorrow: ([^,<]+), (\d+) min/.exec(html);
    expect(m).not.toBeNull();
    expect(EXERCISES.map((e) => e.title)).toContain(m![1]);
    expect(Number(m![2])).toBeLessThanOrEqual(6);
  });

  it("draws the one sample voice /pro's showcase charts, not a second one", () => {
    // It used to show E2 to G4 at 87% beside a showcase sample of C3 to G4 at 82%.
    for (const note of SAMPLE_NOTES) expect(html, note.label).toContain(`>${note.label}</text>`);
    expect(html.match(/class="pro-visual-bar"/g)).toHaveLength(SAMPLE_NOTES.length);
    expect(html).toContain(`>WORK ${SAMPLE_WEAK_NOTE.label} ↘</text>`);
    expect(html).toContain(`${SAMPLE_WEAK_NOTE.label} flagged as the note to work on`);
    expect(html).toContain(`Accuracy ${SAMPLE_ACCURACY}%`);
    // The range labels are the sample's floor and ceiling, each printed twice:
    // on the band and under its bar.
    expect(html.split(`>${SAMPLE_RANGE.low}</text>`).length - 1).toBe(2);
    expect(html.split(`>${SAMPLE_RANGE.high}</text>`).length - 1).toBe(2);
    expect(html).toContain(">Sample data</span>");
  });
});
