/**
 * Keeps contracts/suede-vocal.json equal to the app, and keeps the app equal
 * to what the contract claims about it.
 *
 * The second half is the unusual part. Most of this contract is numbers, and
 * the regenerate-and-compare test covers those the same way practice-parity
 * does. But the rows a consumer relies on most are *capability* claims —
 * "the breath room does not read pitch", "the detector is monophonic" — and a
 * capability claim can rot without any number changing. Someone could wire f0
 * into the sustain test next month and this contract would still tell
 * GuitarHub the measurement does not exist.
 *
 * So the claims that a consumer would be harmed by are asserted against the
 * implementation itself, not just serialized.
 *
 * Regenerate with:
 *   CONTRACT_WRITE=1 npx vitest run contracts/suede-vocal.test.ts
 */
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { buildContract, CONTRACT_VERSION } from "./suede-vocal";
import { VOICE_TYPE_PASSAGGIO } from "@/lib/voice-types";
import { VOICE_KINDS } from "@/lib/singers-core";
import { EXERCISES, PRO_PACKS } from "@/components/warmups/exercises";
import { isFreeExercise } from "@/components/warmups/routines";

const FILE = fileURLToPath(new URL("./suede-vocal.json", import.meta.url));
const SUSTAIN_SRC = fileURLToPath(
  new URL("../components/breath/sustain-test.tsx", import.meta.url),
);
const PITCH_SRC = fileURLToPath(new URL("../lib/audio/pitch.ts", import.meta.url));

/** The exact bytes the committed file should hold: stable key order, 2-space, trailing newline. */
function serialize(contract: unknown): string {
  return `${JSON.stringify(contract, null, 2)}\n`;
}

describe("suede-vocal contract", () => {
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
        "contracts/suede-vocal.json is missing. Regenerate it with CONTRACT_WRITE=1 npx vitest run contracts/suede-vocal.test.ts",
      );
    }

    expect(JSON.parse(actual)).toEqual(JSON.parse(expected));
    expect(actual).toBe(expected);
  });

  it("carries every section a consumer reads", () => {
    const c = buildContract();
    expect(Object.keys(c).sort()).toEqual(
      [
        "breath",
        "contract",
        "deepLinks",
        "earTraining",
        "knownDivergences",
        "measurement",
        "pitch",
        "rangeScan",
        "reference",
        "rules",
        "taxonomy",
        "unsupportedClaims",
        "version",
        "warmups",
      ].sort(),
    );
    expect(c.version).toBe(CONTRACT_VERSION);
  });

  it("carries real values, not placeholders", () => {
    const c = buildContract();
    expect(c.taxonomy.voiceKinds.length).toBe(8);
    expect(c.taxonomy.classifiableVoiceTypes.length).toBe(6);
    expect(c.warmups.exercises.length).toBe(EXERCISES.length + PRO_PACKS.reduce((n, p) => n + p.exercises.length, 0));
    expect(c.warmups.routines.length).toBeGreaterThan(0);
    expect(c.breath.routines.length).toBeGreaterThan(0);
    expect(c.earTraining.games.length).toBeGreaterThan(0);
    expect(Object.keys(c.measurement).length).toBeGreaterThan(10);
  });

  /**
   * JSON.stringify drops an undefined value silently, so a builder importing a
   * constant that is not actually exported produces a contract that is missing
   * the key entirely and still passes every equality check. That happened while
   * this file was being written: `MIN_FREQ`/`MAX_FREQ` were module-private, and
   * `pitch.detectorMinHz` simply vanished from the serialization.
   *
   * So walk the built contract and fail on any undefined leaf.
   */
  it("serializes no undefined values", () => {
    const offenders: string[] = [];
    const walk = (value: unknown, path: string) => {
      if (value === undefined) {
        offenders.push(path);
        return;
      }
      if (Array.isArray(value)) {
        value.forEach((item, i) => walk(item, `${path}[${i}]`));
        return;
      }
      if (value && typeof value === "object") {
        for (const [k, v] of Object.entries(value)) walk(v, `${path}.${k}`);
      }
    };
    walk(buildContract(), "contract");
    expect(offenders).toEqual([]);
  });

  /**
   * Every exercise carries its title as well as its id, because practice
   * history is keyed on the title. A consumer matching logged sessions with
   * only the id would silently find nothing.
   */
  it("carries a title for every warmup exercise", () => {
    for (const ex of buildContract().warmups.exercises) {
      expect(ex.title, `exercise ${ex.id} has no title`).toBeTruthy();
      expect(ex.steps.length, `exercise ${ex.id} serialized no steps`).toBeGreaterThan(0);
    }
  });

  /**
   * The Pro gate is array membership rather than a flag, so `free` in the
   * contract has to be derived from the same predicate the room enforces.
   * If these disagreed, a free surface could deep-link a paid exercise.
   */
  it("marks exactly the free exercises free", () => {
    for (const ex of buildContract().warmups.exercises) {
      expect(ex.free, `exercise ${ex.id} free flag disagrees with isFreeExercise`).toBe(
        isFreeExercise(ex.id),
      );
    }
  });

  it("never marks a free routine as containing paid steps", () => {
    for (const r of buildContract().warmups.routines) {
      if (!r.pro) expect(r.allStepsFree, `free routine ${r.id} leaks a pack exercise`).toBe(true);
    }
  });

  /**
   * Passaggio semantics are the reason this contract exists. Male rows are
   * Miller's primo and secondo, a perfect fourth apart; female rows are
   * contemporary-commercial break figures and are narrower. Mislabelling one
   * as the other is the specific authoring error this guards.
   */
  it("labels each passaggio row with the registration event it describes", () => {
    const zones = buildContract().taxonomy.passaggio.zones;
    for (const kind of VOICE_KINDS) {
      const row = zones[kind];
      expect(row, `no passaggio row for ${kind}`).toBeTruthy();
      expect(row.spanSemitones).toBe(VOICE_TYPE_PASSAGGIO[kind].high - VOICE_TYPE_PASSAGGIO[kind].low);
      if (row.semantics === "miller-primo-secondo") expect(row.spanSemitones).toBe(5);
      if (row.semantics === "ccm-break") expect(row.spanSemitones).toBeLessThan(5);
    }
    expect(zones.Countertenor.semantics).toBe("m1-m2-crossing");
    expect(zones.Countertenor.caveat).toBeTruthy();
  });

  it("states that a passaggio cannot be derived from a range scan", () => {
    const c = buildContract();
    expect(c.taxonomy.passaggio.derivableFromRangeScan).toBe(false);
    expect(c.measurement.passaggioPitches.measurable).toBe("no");
    expect(c.rangeScan.outputs).not.toContain("passaggio");
  });

  /**
   * The capability claims, checked against the source rather than trusted.
   * A contract that tells a consumer "this is not measured" has to fail when
   * it starts being measured, or the consumer keeps authoring around a gap
   * that closed.
   */
  describe("capability claims match the implementation", () => {
    it("sustain steadiness reads loudness and not pitch", () => {
      const c = buildContract();
      expect(c.breath.sustain.steadinessMetric).toBe("loudness_cv");
      expect(c.breath.sustain.measuresPitchDrift).toBe(false);

      const src = readFileSync(SUSTAIN_SRC, "utf8");
      // The drill samples frame.volume. If it ever reads frame.f0 the claim
      // above is stale and this contract is lying to its consumers.
      expect(src).toContain("frame.volume");
      expect(
        src.includes("frame.f0"),
        "sustain-test.tsx now reads frame.f0 — update breath.sustain.measuresPitchDrift and the unsupportedClaims entry",
      ).toBe(false);
    });

    it("the pitch detector is monophonic", () => {
      expect(buildContract().pitch.monophonic).toBe(true);
      const src = readFileSync(PITCH_SRC, "utf8");
      // detectPitch returns a single {freq, clarity} or null. A polyphonic
      // rewrite would have to change this signature.
      expect(src).toMatch(/export function detectPitch\([^)]*\)\s*:\s*PitchResult \| null/);
    });

    it("12 seconds is not a sustain threshold, so no lesson can pass or fail on it", () => {
      const { benchmarksSec, starsSec } = buildContract().breath.sustain;
      expect(Object.values(benchmarksSec)).not.toContain(12);
      expect(Object.values(starsSec)).not.toContain(12);
    });

    it("names no module for a measurement it reports as absent", () => {
      for (const [key, row] of Object.entries(buildContract().measurement)) {
        if (row.measurable === "no" || row.measurable === "adaptable") {
          expect(row.module, `${key} claims to be unmeasured but names a module`).toBeNull();
        } else {
          expect(row.module, `${key} is measurable but names no module`).toBeTruthy();
        }
      }
    });

    /**
     * Every remedy offered in `unsupportedClaims.useInstead` has to be a real
     * measurement that is actually implemented, or the advice sends a consumer
     * at another gap.
     */
    it("only recommends measurements that exist", () => {
      const c = buildContract();
      for (const [claim, entry] of Object.entries(c.unsupportedClaims)) {
        for (const key of entry.useInstead) {
          const row = c.measurement[key as keyof typeof c.measurement];
          expect(row, `${claim} recommends unknown measurement ${key}`).toBeTruthy();
          expect(row.measurable, `${claim} recommends unmeasurable ${key}`).toBe("yes");
        }
      }
    });
  });

  /**
   * A consumer builds URLs from this. A room listed with a parameter it does
   * not parse would send singers to a default state and look like a bug in the
   * lesson rather than in the link.
   */
  it("only advertises deep-link params the room actually parses", () => {
    const rooms = buildContract().deepLinks.rooms;
    expect(rooms.warmups.params).toEqual(["exercise", "routine"]);
    expect(rooms.songs.params).toEqual(["song"]);
    expect(rooms.breath.params).toEqual(["drill", "routine"]);
    // Rooms with no parser must advertise none.
    expect(rooms.range.params).toEqual([]);
    expect(rooms.studio.params).toEqual([]);
    expect(rooms.analyze.params).toEqual([]);
  });
});
