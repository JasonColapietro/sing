import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { offersProMomentAfterRangeTest } from "./range-test";

describe("Pro moment after a range test", () => {
  it("keeps a singer's first range result clear of the sales dialog", () => {
    expect(offersProMomentAfterRangeTest([])).toBe(false);
  });

  it("allows it once a range has been saved before", () => {
    expect(
      offersProMomentAfterRangeTest([
        {
          lowMidi: 45,
          highMidi: 69,
          voiceTypeLabel: "Baritone",
          testedAt: "2026-01-01T00:00:00.000Z",
        },
      ]),
    ).toBe(true);
  });

  /**
   * The helper only works if finish() asks it before setVocalRange appends
   * this test to the history; asked afterwards, the history is never empty
   * and the dialog covers every first result again.
   */
  it("checks the history before finish() saves the test, and gates the signal on it", () => {
    const src = readFileSync(join(__dirname, "range-test.tsx"), "utf8");
    const start = src.indexOf("const finish = () => {");
    expect(start).toBeGreaterThan(-1);
    const body = src.slice(start, src.indexOf("\n  };", start));
    const check = body.indexOf("offersProMomentAfterRangeTest(progress.rangeHistory)");
    expect(check).toBeGreaterThan(-1);
    expect(check).toBeLessThan(body.indexOf("setVocalRange("));
    expect(body.match(/emitProResult\(/g)).toHaveLength(1);
    expect(body).toMatch(/if \(offerPro\) emitProResult\(\);/);
  });
});

describe("range test on a phone", () => {
  /**
   * Each stage swaps in a card of a different height while the page stays
   * where it was, which left the "counted" line, the too-quiet hint and the
   * "I can't go lower" button under a 375px phone's tab bar, and opened the
   * result with its readout under the header.
   */
  it("brings every stage after the intro to the top of the screen", () => {
    const src = readFileSync(join(__dirname, "range-test.tsx"), "utf8");
    // The anchor sits directly above the stage cards, so its top is theirs.
    const anchor = src.indexOf('<div id="range-stage" ref={stageRef} />');
    expect(anchor).toBeGreaterThan(-1);
    expect(src.indexOf('{stage === "intro" && (')).toBeLessThan(anchor);
    for (const block of [
      '{stage === "warm" && (',
      '{(stage === "low" || stage === "high") && (',
      '{stage === "result" && result && (',
    ]) {
      expect(src.indexOf(block)).toBeGreaterThan(anchor);
    }
    // Only a change of stage scrolls, so the first render stays where the
    // page landed, and the intro (after "Start over") goes to its own top.
    expect(src).toMatch(
      /if \(stage === from\) return;\s*\(stage === "intro" \? topRef : stageRef\)\.current\?\.scrollIntoView\(\{ block: "start" \}\);\s*\}, \[stage\]\);/,
    );
  });

  it("brings the intro's heading back into view after Start over", () => {
    // The stage scroll leaves the page at the stage card, so returning to
    // the intro without a scroll put "How to find your vocal range" under
    // the header.
    const src = readFileSync(join(__dirname, "range-test.tsx"), "utf8");
    const body = src.slice(src.indexOf("return wrap("));
    const top = body.indexOf("<div ref={topRef} />");
    expect(top).toBeGreaterThan(-1);
    expect(top).toBeLessThan(body.indexOf("<StepIndicator"));
    expect(top).toBeLessThan(body.indexOf('{stage === "intro" && ('));
  });
});
