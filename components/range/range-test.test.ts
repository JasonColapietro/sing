import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { countedRange, MIN_SAVED_SPAN, offersProMomentAfterRangeTest } from "./range-test";

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

describe("a range too narrow to save", () => {
  it("counts the starting note in both directions, and needs five semitones to save", () => {
    // Bailed out at once: nothing counted beyond the A3 starting note.
    expect(countedRange(57, 57, 57)).toEqual({ lowMidi: 57, highMidi: 57, savable: false });
    expect(countedRange(57, null, null)).toEqual({ lowMidi: 57, highMidi: 57, savable: false });
    expect(countedRange(57, 55, 59).savable).toBe(false);
    expect(countedRange(57, 55, 60)).toEqual({ lowMidi: 55, highMidi: 60, savable: true });
    expect(MIN_SAVED_SPAN).toBe(5);
    // A note found on the wrong side of the anchor never shrinks the span.
    expect(countedRange(57, 59, 55)).toEqual({ lowMidi: 57, highMidi: 57, savable: false });
  });

  it("saves, logs and offers nothing until the span is wide enough", () => {
    const src = readFileSync(join(__dirname, "range-test.tsx"), "utf8");
    const start = src.indexOf("const finish = () => {");
    const body = src.slice(start, src.indexOf("\n  };", start));
    const guard = body.indexOf("if (!savable) {");
    expect(guard).toBeGreaterThan(-1);
    for (const effect of ["stop();", "setVocalRange(", "logSession(", "emitProResult("]) {
      expect(body.indexOf(effect), effect).toBeGreaterThan(guard);
    }
  });

  it("says so above the buttons, where a phone shows it, not under them by the tab bar", () => {
    const src = readFileSync(join(__dirname, "range-test.tsx"), "utf8");
    const hunt = src.slice(src.indexOf('{(stage === "low" || stage === "high") && ('));
    const status = hunt.indexOf("too narrow to save as your");
    expect(status).toBeGreaterThan(-1);
    expect(status).toBeLessThan(hunt.indexOf("I can&apos;t go higher"));
    expect(status).toBeLessThan(hunt.indexOf("<PianoStrip"));
  });
});

describe("the warm-up stage", () => {
  it("offers Start over like the other stages, so a stalled singer is never stuck with the mic on", () => {
    const src = readFileSync(join(__dirname, "range-test.tsx"), "utf8");
    const warm = src.slice(src.indexOf('{stage === "warm" && ('), src.indexOf('{(stage === "low" || stage === "high") && ('));
    expect(warm).toMatch(/<Button variant="ghost" size="sm" onClick=\{retake\}>\s*Start over\s*<\/Button>/);
  });
});

describe("the range test's too-quiet hint", () => {
  /**
   * The pitch meter shares this rule from ./pitch-meter-hint. A second copy
   * of the thresholds or the sentences here would let the two rooms drift
   * apart and describe the same input differently.
   */
  it("uses the rule it shares with the pitch meter, not a copy of its own", () => {
    const src = readFileSync(join(__dirname, "range-test.tsx"), "utf8");
    expect(src).toMatch(
      /import \{ freshInputHint, nextInputHint \} from "\.\/pitch-meter-hint";/,
    );
    expect(src).not.toMatch(/const (SILENCE_FLOOR|HINT_AFTER_MS)\b/);
    expect(src).not.toMatch(/too quietly to measure|picking up any sound|lock onto a pitch/);
    expect(src).toMatch(/useRef\(freshInputHint\(\)\)/);
    expect(src).toMatch(/inputRef\.current = freshInputHint\(\);/);
    expect(src).toMatch(
      /showHint\(nextInputHint\(inputRef\.current, frame, dt, voiced, MIN_VOLUME\)\);/,
    );
  });
});
