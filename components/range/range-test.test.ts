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
