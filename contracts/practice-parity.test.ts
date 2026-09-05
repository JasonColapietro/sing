/**
 * Keeps contracts/practice-parity.json equal to the constants the app runs on.
 *
 * The contract is only worth something if it cannot go stale. The builder
 * imports the live modules, so this test comparing the builder's output to the
 * committed file is what makes the JSON a fact about the app rather than a
 * snapshot someone took once. Change TEMPO_STEP and this test fails until the
 * file is regenerated; regenerate the file and the native repos see the change
 * as a diff instead of never hearing about it.
 *
 * Regenerate with:
 *   CONTRACT_WRITE=1 npx vitest run contracts/practice-parity.test.ts
 */
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { buildContract, CONTRACT_VERSION } from "./practice-parity";

const FILE = fileURLToPath(new URL("./practice-parity.json", import.meta.url));

/** The exact bytes the committed file should hold: stable key order, 2-space, trailing newline. */
function serialize(contract: unknown): string {
  return `${JSON.stringify(contract, null, 2)}\n`;
}

describe("practice-parity contract", () => {
  it("matches the constants the app runs on", () => {
    const expected = serialize(buildContract());

    if (process.env.CONTRACT_WRITE) {
      writeFileSync(FILE, expected);
      return;
    }

    let actual: string;
    try {
      actual = readFileSync(FILE, "utf8");
    } catch {
      throw new Error(
        "contracts/practice-parity.json is missing. Regenerate it with CONTRACT_WRITE=1 npx vitest run contracts/practice-parity.test.ts",
      );
    }

    // Compared as parsed objects so the failure output names the key that moved
    // rather than dumping two long strings at the reader.
    expect(JSON.parse(actual)).toEqual(JSON.parse(expected));
    // Then as bytes, because the native repos vendor this file verbatim and a
    // reformat that changes nothing semantically still shows up there as a diff.
    expect(actual).toBe(expected);
  });

  /**
   * A contract that quietly loses a section is worse than no contract: the
   * native test still passes, against less. These are the sections the native
   * assertions read, named here so deleting one is a failure and not a silence.
   */
  it("carries every section the native tests read", () => {
    const c = buildContract();
    expect(Object.keys(c).sort()).toEqual(
      [
        "bands",
        "contract",
        "difficulty",
        "guide",
        "knownDivergences",
        "mastery",
        "multiplier",
        "progress",
        "reference",
        "rules",
        "scoring",
        "tempo",
        "transpose",
        "version",
      ].sort(),
    );
    expect(c.version).toBe(CONTRACT_VERSION);
  });

  /**
   * Proves the file is a real serialization and not an empty object that would
   * make every native assertion vacuous.
   */
  it("carries real values, not placeholders", () => {
    const c = buildContract();
    expect(c.scoring.judgmentThresholds.length).toBeGreaterThan(0);
    expect(c.progress.levelTitles.length).toBeGreaterThan(0);
    expect(c.progress.xpThresholds.length).toBeGreaterThan(0);
    expect(c.bands.order.length).toBeGreaterThan(0);
    expect(c.multiplier.rungs.length).toBeGreaterThan(0);
    expect(c.tempo.step).toBeGreaterThan(0);
    expect(c.tempo.max).toBeGreaterThan(c.tempo.min);
    expect(c.transpose.max).toBeGreaterThan(c.transpose.min);
  });

  /**
   * The XP ladder is serialized rung by rung. If the rungs did not follow the
   * documented formula the native side would be asserting against numbers that
   * do not describe the web, so check the serialization against the rule the
   * contract states in prose.
   */
  it("serializes an XP ladder that matches the stated formula", () => {
    for (const { level, cumulativeXp } of buildContract().progress.xpThresholds) {
      expect(cumulativeXp).toBe(40 * level * (level + 1));
    }
  });
});
