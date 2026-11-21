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
    // Two drawings now, a phone's and a wider one (one shown at a time), each
    // naming every other bar: with all 14 named, the labels were 5px on a
    // phone. So the counts below are per drawing, and a name is required for
    // every second note and the flagged one rather than for all of them.
    const drawings = html.split("<svg").slice(1);
    expect(drawings).toHaveLength(2);
    expect(html).toMatch(/<svg[^>]*class="block w-full sm:hidden"/);
    expect(html).toMatch(/<svg[^>]*class="hidden w-full sm:block"/);
    const weak = SAMPLE_NOTES.findIndex((n) => n.midi === SAMPLE_WEAK_NOTE.midi);
    for (const svg of drawings) {
      expect(svg.match(/class="pro-visual-bar"/g)).toHaveLength(SAMPLE_NOTES.length);
      SAMPLE_NOTES.forEach((note, i) => {
        // Under its bar; the floor and ceiling are also printed on the band.
        const onBand = note.label === SAMPLE_RANGE.low || note.label === SAMPLE_RANGE.high ? 1 : 0;
        const named = i % 2 === weak % 2 ? 1 : 0;
        expect(svg.split(`>${note.label}</text>`).length - 1, note.label).toBe(onBand + named);
      });
      // Nothing is labelled that is not one of the sample's notes or titles.
      const texts = [...svg.matchAll(/<text[^>]*>([^<]*)<\/text>/g)].map((m) => m[1]);
      const noteLike = texts.filter((t) => /^[A-G]#?\d$/.test(t));
      for (const t of noteLike) expect(SAMPLE_NOTES.map((n) => n.label)).toContain(t);
      expect(svg).toContain(`>WORK ${SAMPLE_WEAK_NOTE.label} ↘</text>`);
      expect(svg).toContain(`${SAMPLE_WEAK_NOTE.label} flagged as the note to work on`);
      // Readable on a phone: no label under 11 units in a drawing whose unit
      // is about a pixel there (the phone's viewBox is 340 wide).
      for (const m of svg.matchAll(/font-size="([\d.]+)"/g)) expect(Number(m[1])).toBeGreaterThanOrEqual(11);
    }
    expect(drawings[0]).toMatch(/^ viewBox="0 0 340 /);
    expect(html).toContain(`Accuracy ${SAMPLE_ACCURACY}%`);
    expect(html).toContain(">Sample data</span>");
  });
});
