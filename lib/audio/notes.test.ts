import { describe, expect, it } from "vitest";
import {
  CLOSE_CENTS,
  IN_TUNE_CENTS,
  classifyVoice,
  crossFamilyAlternative,
  labelToMidi,
  tuneZone,
  voiceFitLabel,
} from "./notes";

/** Midi for a scientific pitch label, failing loudly on a typo. */
function m(label: string): number {
  const midi = labelToMidi(label);
  if (midi === null) throw new Error(`bad label ${label}`);
  return midi;
}

describe("tuneZone", () => {
  it("shares one set of thresholds between the meter and the tuner", () => {
    expect(IN_TUNE_CENTS).toBe(15);
    expect(CLOSE_CENTS).toBe(35);
  });

  it.each([
    [0, "in-tune"],
    [15, "in-tune"],
    [-15, "in-tune"],
    [16, "close"],
    [-35, "close"],
    [36, "off"],
    // The pitch meter used to call 45 cents "a little flat" while coloring it
    // as off. Anything past the close band is plainly flat or sharp.
    [-45, "off"],
    [50, "off"],
  ] as const)("%i cents reads as %s", (cents, zone) => {
    expect(tuneZone(cents)).toBe(zone);
  });
});

describe("classifyVoice", () => {
  it.each([
    ["E2", "E4", "Bass"],
    ["C3", "C5", "Tenor"],
    ["G3", "D5", "Contralto"],
    ["C4", "C6", "Soprano"],
  ])("files a clear %s–%s range under %s", (low, high, label) => {
    expect(classifyVoice(m(low), m(high)).label).toBe(label);
  });

  it("settles a bass/baritone tie on Baritone, not the rarest band", () => {
    // A2–E4 scores the two bands exactly level.
    expect(classifyVoice(m("A2"), m("E4")).label).toBe("Baritone");
  });
});

describe("crossFamilyAlternative", () => {
  it("names contralto beside tenor when range alone cannot split them", () => {
    expect(classifyVoice(m("F3"), m("C5")).label).toBe("Tenor");
    expect(crossFamilyAlternative(m("F3"), m("C5"))?.label).toBe("Contralto");
  });

  it("names tenor beside contralto for a falsetto-inclusive male range", () => {
    expect(classifyVoice(m("A2"), m("A5")).label).toBe("Contralto");
    expect(crossFamilyAlternative(m("A2"), m("A5"))?.label).toBe("Tenor");
  });

  it("stays out of the way when one side clearly fits better", () => {
    expect(crossFamilyAlternative(m("A2"), m("E4"))).toBeNull();
    expect(crossFamilyAlternative(m("E2"), m("E4"))).toBeNull();
    expect(crossFamilyAlternative(m("G3"), m("D5"))).toBeNull();
    expect(crossFamilyAlternative(m("C4"), m("C6"))).toBeNull();
  });
});

describe("voiceFitLabel", () => {
  it("names one band when one side clearly fits better", () => {
    expect(voiceFitLabel(m("C3"), m("C5"))).toBe("Tenor");
    expect(voiceFitLabel(m("A2"), m("E4"))).toBe("Baritone");
  });

  it("names both bands, best fit first, when range alone cannot split them", () => {
    expect(voiceFitLabel(m("F3"), m("C5"))).toBe("Tenor or Contralto");
    expect(voiceFitLabel(m("A2"), m("A5"))).toBe("Contralto or Tenor");
  });
});
