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
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { buildContract, CONTRACT_VERSION } from "./suede-vocal";
import { VOICE_TYPE_PASSAGGIO } from "@/lib/voice-types";
import { VOICE_KINDS } from "@/lib/singers-core";
import { EXERCISES, PRO_PACKS } from "@/components/warmups/exercises";
import { isFreeExercise } from "@/components/warmups/routines";
import { SUSTAIN_BENCHMARKS_SEC, SUSTAIN_STAR_SEC } from "@/components/breath/routines";
import { starsForSustain } from "@/components/breath/store";
import { BOOK_CONTENTS, BOOK_WORDS } from "@/lib/book-data";
import { ATLAS_CONTENTS, ATLAS_WORDS } from "@/lib/atlas-data";
import { POP_SONGS, popDifficulty } from "@/lib/pop-songs";
import { SINGERS } from "@/lib/singers-data";

const FILE = fileURLToPath(new URL("./suede-vocal.json", import.meta.url));
const SUSTAIN_SRC = fileURLToPath(
  new URL("../components/breath/sustain-test.tsx", import.meta.url),
);
const PITCH_SRC = fileURLToPath(new URL("../lib/audio/pitch.ts", import.meta.url));
const VIBRATO_SRC = fileURLToPath(new URL("../lib/audio/vibrato.ts", import.meta.url));
const PLAYER_SRC = fileURLToPath(
  new URL("../components/warmups/exercise-player.tsx", import.meta.url),
);
const USE_PITCH_SRC = fileURLToPath(new URL("../lib/audio/use-pitch.ts", import.meta.url));

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
        "editorial",
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

  /**
   * The sustain ladder must be imported, not restated.
   *
   * It was restated: `benchmarksSec` and `starsSec` were copied literals, so
   * changing the runtime ladder would regenerate this contract byte-for-byte
   * while publishing the old numbers to GuitarHub. That is the exact drift the
   * contract exists to catch, and it is the same defect the star thresholds had
   * before `lib/stars.ts`. Asserting against both the constants and the
   * behaviour, so neither half can move alone.
   */
  it("publishes the sustain ladder the breath room actually runs", () => {
    const sustain = buildContract().breath.sustain;
    expect(sustain.benchmarksSec).toEqual({ ...SUSTAIN_BENCHMARKS_SEC });
    expect(sustain.starsSec).toEqual({ ...SUSTAIN_STAR_SEC });

    // And the star cuts have to agree with the function that awards them.
    expect(starsForSustain(sustain.starsSec.three)).toBe(3);
    expect(starsForSustain(sustain.starsSec.three - 0.1)).toBe(2);
    expect(starsForSustain(sustain.starsSec.two)).toBe(2);
    expect(starsForSustain(sustain.starsSec.two - 0.1)).toBe(1);
    expect(starsForSustain(sustain.starsSec.one)).toBe(1);
    expect(starsForSustain(sustain.starsSec.one - 0.1)).toBe(0);
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

    /**
     * Vibrato rate moved from "no" to "yes" in version 4. The row has to keep
     * pointing at code that exists and is tested, and a singer has to be able
     * to reach it: a measurement no surface calls is the "adaptable" row it
     * used to be one step short of.
     */
    it("vibrato rate is measured, tested, and shown by a drill", () => {
      const row = buildContract().measurement.vibratoRateHz;
      expect(row.measurable).toBe("yes");
      for (const path of row.evidence) {
        expect(existsSync(fileURLToPath(new URL(`../${path}`, import.meta.url))), path).toBe(true);
      }
      expect(readFileSync(VIBRATO_SRC, "utf8")).toMatch(/export function analyzeVibrato\(/);
      expect(readFileSync(PLAYER_SRC, "utf8")).toContain("readVibrato(");
      expect(EXERCISES.some((e) => e.vibrato), "no free exercise shows a vibrato reading").toBe(true);
      // The cue is still unmeasured, and the row says so rather than the rate.
      expect(buildContract().measurement.vibratoOnCue.measurable).toBe("no");
    });

    /**
     * `pitch.engine` is only worth serializing if the app runs on those exact
     * constants. A literal creeping back in beside a named constant would let
     * the contract and the detector disagree with every equality check green.
     */
    it("the pitch engine is the constants the detector and usePitch run on", () => {
      const pitchSrc = readFileSync(PITCH_SRC, "utf8");
      expect(pitchSrc).toContain("rms < SILENCE_RMS");
      expect(pitchSrc).toContain("lowpass(input, sampleRate, LOWPASS_HZ)");
      expect(pitchSrc).toContain("best * PEAK_TOLERANCE");
      expect(pitchSrc).toContain("Math.abs(buf[i]) < TRIM_THRESHOLD");
      expect(pitchSrc).toContain("Math.abs(buf[SIZE - i]) < TRIM_THRESHOLD");
      expect(pitchSrc).toContain("size < MIN_WINDOW_SAMPLES");
      const hookSrc = readFileSync(USE_PITCH_SRC, "utf8");
      expect(hookSrc).toContain("?? DEFAULT_CLARITY_THRESHOLD");
      expect(hookSrc).toContain("hist.length > PITCH_MEDIAN_WINDOW");
      expect(hookSrc).toContain("fftSize = PITCH_FFT_SIZE");
      expect(hookSrc).toContain("median(hist)");
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
   * The editorial section exists so GuitarHub can cite this library through an
   * identifier instead of a hand-written URL. Three things have to hold for
   * that to be worth anything: the identifiers have to be the real ones, the
   * gate has to be the real gate, and the prose has to stay here.
   */
  describe("the editorial library", () => {
    it("publishes every chapter of both books, with its resolved path", () => {
      const { book, atlas } = buildContract().editorial;

      expect(book.chapters.length).toBe(BOOK_CONTENTS.length);
      expect(atlas.chapters.length).toBe(ATLAS_CONTENTS.length);
      expect(book.totalWords).toBe(BOOK_WORDS);
      expect(atlas.totalWords).toBe(ATLAS_WORDS);

      for (const shelf of [book, atlas]) {
        for (const chapter of shelf.chapters) {
          expect(chapter.path, `chapter ${chapter.slug} has no resolved path`).toBe(
            `${shelf.pathPrefix}/${chapter.slug}`,
          );
          expect(chapter.title, `chapter ${chapter.slug} has no title`).toBeTruthy();
          expect(chapter.summary, `chapter ${chapter.slug} has no summary`).toBeTruthy();
          expect(chapter.words, `chapter ${chapter.slug} has no word count`).toBeGreaterThan(0);
        }
      }
    });

    /**
     * The gate is the field a citing surface has to read, because most of this
     * library is behind Pro and a free lesson citing a gated chapter without
     * saying so sends a singer at a paywall it did not mention. So it has to be
     * the compiled content's own flag rather than anything re-derived.
     */
    it("reports each chapter's gate as the content itself reports it", () => {
      const { book, atlas } = buildContract().editorial;
      const bySlug = new Map(
        [...BOOK_CONTENTS, ...ATLAS_CONTENTS].map((c) => [c.slug, c.free] as const),
      );
      for (const chapter of [...book.chapters, ...atlas.chapters]) {
        expect(chapter.free, `${chapter.slug} gate disagrees with the compiled content`).toBe(
          bySlug.get(chapter.slug),
        );
      }
      // And the gate must not be vacuous in either direction: if everything
      // were free, or nothing were, a consumer's disclosure logic would never
      // be exercised.
      const all = [...book.chapters, ...atlas.chapters];
      expect(all.some((c) => c.free)).toBe(true);
      expect(all.some((c) => !c.free)).toBe(true);
    });

    /**
     * The whole point of citing rather than copying. If a body ever reached the
     * contract, GuitarHub would vendor 104,000 words of this app's writing and
     * the two sites would start competing to be the place it lives.
     */
    it("carries no chapter body", () => {
      const { book, atlas } = buildContract().editorial;
      for (const chapter of [...book.chapters, ...atlas.chapters]) {
        expect(Object.keys(chapter)).not.toContain("body");
        expect(Object.keys(chapter)).not.toContain("entries");
      }
      // A summary is an abstract; a body is not. Nothing here should be long.
      const longest = Math.max(
        ...[...book.chapters, ...atlas.chapters].map((c) => c.summary.length),
      );
      expect(longest).toBeLessThan(600);
    });

    it("publishes the popular-song catalogue with key, range and derived difficulty", () => {
      const { repertoire } = buildContract().editorial;
      expect(repertoire.songs.length).toBe(POP_SONGS.length);
      expect(repertoire.scored).toBe(false);

      const source = new Map(POP_SONGS.map((s) => [s.slug, s] as const));
      for (const song of repertoire.songs) {
        const original = source.get(song.slug);
        expect(original, `${song.slug} is not in POP_SONGS`).toBeTruthy();
        expect(song.key, `${song.slug} has no key`).toBeTruthy();
        expect(song.lowMidi).toBe(original!.lowMidi);
        expect(song.highMidi).toBe(original!.highMidi);
        expect(song.spanSemitones).toBe(original!.highMidi - original!.lowMidi);
        expect(song.difficulty, `${song.slug} difficulty was authored, not derived`).toBe(
          popDifficulty(original!),
        );
        expect(song.path).toBe(`${repertoire.pathPrefix}/${song.slug}`);
      }
    });

    /**
     * 636 records is not a list a consuming curriculum should vendor. What it
     * needs to know is that every record carries a written technique paragraph
     * rather than only a range, because that is the thing worth citing.
     */
    it("counts the singer library rather than enumerating it", () => {
      const { singers } = buildContract().editorial;
      expect(singers.count).toBe(SINGERS.length);
      expect(singers.withTechnique).toBe(SINGERS.filter((s) => s.technique !== null).length);
      expect(singers.withTechnique).toBe(singers.count);
      expect(Object.keys(singers)).not.toContain("records");
    });

    /**
     * The band grid is a page, not a chapter. The voice-types chapter refuses
     * to print it on purpose, so a consumer that wants the grid has to be sent
     * to the page that answers the question.
     */
    it("points the band grid at the page that prints it", () => {
      const { referenceTables, atlas } = buildContract().editorial;
      const table = referenceTables.vocalRangeByVoiceType;
      expect(table.path).toBe("/atlas/vocal-range-by-voice-type");
      expect(table.free).toBe(true);
      // It must not be mistaken for a chapter, or a consumer resolving it
      // through the chapter list would find nothing.
      expect(atlas.chapters.some((c) => c.path === table.path)).toBe(false);
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
    expect(rooms.breath.params).toEqual(["drill", "routine", "step"]);
    expect(rooms.programs.params).toEqual(["program"]);
    // Rooms with no parser must advertise none.
    expect(rooms.range.params).toEqual([]);
    expect(rooms.studio.params).toEqual([]);
    expect(rooms.analyze.params).toEqual([]);
  });
});
