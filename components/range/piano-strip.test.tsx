import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { PianoStrip, octaveLabelMidis } from "./piano-strip";

const C = [36, 48, 60, 72, 84];

/** Every text label in the strip, in order. */
function labels(html: string): string[] {
  return [...html.matchAll(/<text[^>]*>([^<]*)<\/text>/g)].map((m) => m[1]);
}

describe("the piano strip's labels", () => {
  it("labels every C when nothing is marked", () => {
    expect(octaveLabelMidis([])).toEqual(C);
  });

  it("drops the octave label an edge on a C would print over", () => {
    // F3–C5: the dim "C5" and the bold "C5" drew on one baseline and read
    // like "G5".
    expect(octaveLabelMidis([53, 72])).toEqual([36, 48, 60, 84]);
    // C3–C5, the tablet case: both doubled.
    expect(octaveLabelMidis([48, 72])).toEqual([36, 60, 84]);
    const html = renderToStaticMarkup(<PianoStrip rangeLow={48} rangeHigh={72} markLow={48} markHigh={72} />);
    expect(labels(html).filter((t) => t === "C5")).toHaveLength(1);
    expect(labels(html).filter((t) => t === "C3")).toHaveLength(1);
    expect(labels(html)).toEqual(["C2", "C4", "C6", "C3", "C5"]);
  });

  it("drops it for an edge one key away, which half covered it", () => {
    // C#5 sits on the line between C5 and D5.
    expect(octaveLabelMidis([73])).not.toContain(72);
    expect(octaveLabelMidis([61])).not.toContain(60);
  });

  it("keeps the octave labels clear of an edge a whole key or more away", () => {
    // B4 and D5 are a white key either side of C5, with room between labels.
    expect(octaveLabelMidis([71])).toEqual(C);
    expect(octaveLabelMidis([47])).toEqual(C);
    expect(octaveLabelMidis([74])).toEqual(C);
    expect(octaveLabelMidis([70, 75])).toEqual(C);
  });
});
