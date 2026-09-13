/**
 * Binds the producing side of one decision: this app does not measure strain or
 * pressed phonation, and nothing in it may be dressed up as if it did.
 *
 * The consuming repository's voice track gates four checkpoints on an absence
 * of strain, and the contract this file guards is what tells it those
 * checkpoints cannot be scored. Measuring strain honestly needs jitter,
 * shimmer, harmonic-to-noise ratio or cepstral peak prominence — none of which
 * exists here — and then it needs a threshold validated against something other
 * than the author's own ear, because a number that tells a singer their voice is
 * safe is a clinical-adjacent claim. The threshold is the real blocker; the
 * signal processing is the easy half.
 *
 * `ringRatio` is the specific thing that must not be substituted, and the
 * reason it is dangerous is that it is genuine. It ships, it is a single
 * number, and it rises on a bright forward tone, so it looks like a measure of
 * effort. It is the share of plotted energy in a fixed 2800–3200 Hz band and it
 * is self-relative: it compares a singer against their own earlier takes and
 * means nothing against a target, another singer, or a notion of safety. The
 * `/analyze` copy says exactly that today, and these tests are what keep it
 * saying so — a guard on a decision, rather than a comment recording one.
 *
 * `suede-vocal.test.ts` already regenerates and byte-compares the whole
 * contract. This file does not duplicate that. It asserts the handful of rows a
 * consumer would be harmed by if they moved, and then scans the app for the
 * substitution itself, which no equality check over the contract could see.
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { buildContract } from "./suede-vocal";

const contract = buildContract();
const ROOT = fileURLToPath(new URL("..", import.meta.url));

describe("the contract's strain row", () => {
  it("still reports strain and pressed phonation as unmeasurable", () => {
    const row = contract.measurement.strainOrPressedPhonation;
    expect(
      row.measurable,
      "Promoting this row needs a primitive that exists (jitter, shimmer, HNR or CPP) and a " +
        "threshold validated outside this codebase. Neither is a contract edit.",
    ).toBe("no");
    expect(row.module).toBeNull();
    expect(row.unit).toBeNull();
    // The row has to keep naming what is missing, or the gap becomes merely an
    // absence rather than something a future change could close on purpose.
    for (const primitive of [/jitter/i, /shimmer/i, /HNR/, /CPP/]) {
      expect(row.note).toMatch(primitive);
    }
    expect(row.note).toMatch(/do not substitute ring ?ratio/i);
  });

  it("still describes ringRatio as self-relative and not a strain measure", () => {
    const row = contract.measurement.ringRatio;
    expect(row.measurable).toBe("yes");
    expect(row.note).toMatch(/self-relative/i);
    expect(row.note).toMatch(/not a strain measure/i);
    expect(row.note).toMatch(/never against a target|rather than against a target/i);
  });

  it("offers no substitute for a strain-free verdict", () => {
    // An empty `useInstead` is the prohibition in machine-readable form. Every
    // other unsupported claim can point at the measurement a lesson should have
    // used; this one cannot, because there is nothing to point at.
    const claim = contract.unsupportedClaims["strain-free-verdict"];
    expect(claim).toBeTruthy();
    expect(claim.useInstead).toEqual([]);
    expect(claim.reality).toMatch(/no strain detector exists/i);
  });
});

/** Roots walked by the substitution scan. Prose in `content/` and `data/` is editorial. */
const SOURCE_ROOTS = ["app", "components", "lib", "contracts", "scripts"];

function sourceFiles(): string[] {
  const found: string[] = [];
  const walk = (directory: string) => {
    for (const name of readdirSync(join(ROOT, directory))) {
      if (name === "node_modules" || name === ".next" || name === ".git") continue;
      const path = join(directory, name);
      if (statSync(join(ROOT, path)).isDirectory()) {
        walk(path);
        continue;
      }
      if (!/\.(ts|tsx|mjs|js|json)$/.test(name)) continue;
      // This file argues about the prohibition at length and would otherwise
      // report itself.
      if (path.endsWith("strain-prohibition.test.ts")) continue;
      found.push(path);
    }
  };
  for (const root of SOURCE_ROOTS) walk(root);
  return found;
}

/** A share of energy in a frequency band, by any of the names this app uses for one. */
const RESONANCE_TERM = /ring[ _]?ratio|ring band|resonance share|bandRatio|RING_LO_HZ|RING_HI_HZ/i;

/**
 * The kind of claim such a number must never be attached to. "Pressed
 * phonation" is matched through a hyphen as well as a space because the
 * consuming repository's voice track wrote it that way — "no pressed-phonation
 * flag", against a `ringRatio` basis — and a space-only pattern walked past it.
 */
const VERDICT_TERM =
  /\bstrain|pressed[ -]?phonation|\bsafe\b|\bsafety\b|\bsafely\b|\bunsafe\b|\bhealth|\bdamag|\binjur|\bhoarse/i;

/**
 * Denials of the connection, which are the honest thing to write and therefore
 * pass. Every one of these says the *metric* is not a strain measure. A denial
 * about the singer — "no strain", "strain-free" — is not here and never will
 * be: that is the substitution itself, phrased as reassurance.
 */
const DENIALS = [
  /\bnot a strain (?:measure|proxy|detector|indicator|verdict|reading)\b/i,
  /\bsays nothing about strain\b/i,
  /\bdo not substitute\b/i,
  /\bnever a strain\b/i,
];

/** Reassurance shapes forbidden outright, denial in the same breath or not. */
const REASSURANCES = [
  /\b(?:no|without|zero|absence of|free of|free from)\s+(?:\w+[\s-]+){0,2}(?:strain|pressed[ -]?phonation|pressing)\b/i,
  // Nothing here emits a flag, so a cleared one is always a claim about an
  // instrument that does not exist.
  /\b(?:no|without|zero|clear(?:ed)?)\s+(?:\w+[\s-]+){0,3}flag(?:s|ged)?\b/i,
  /strain[- ]free/i,
  /\bsafe to sing\b/i,
  /\b(?:your|their|the singer'?s)\s+strain\b/i,
];

/**
 * Statement-sized chunks. Sentence enders catch prose that wraps across lines
 * in JSX, and braces stop one block merging with the next, which is what keeps
 * this from reporting two unrelated statements as one claim.
 */
function chunks(text: string): string[] {
  return text.replace(/\s+/g, " ").split(/(?<=[.;!?])\s+|[{}]/);
}

describe("the substitution guard", () => {
  it("finds no resonance share read as a strain, safety or health verdict", () => {
    const offenders: string[] = [];
    for (const path of sourceFiles()) {
      for (const chunk of chunks(readFileSync(join(ROOT, path), "utf8"))) {
        if (!RESONANCE_TERM.test(chunk)) continue;
        const reassurance = REASSURANCES.some((pattern) => pattern.test(chunk));
        if (!reassurance) {
          if (!VERDICT_TERM.test(chunk)) continue;
          if (DENIALS.some((pattern) => pattern.test(chunk))) continue;
        }
        offenders.push(`${path}: ${chunk.trim().slice(0, 200)}`);
      }
    }
    expect(
      offenders,
      "a resonance share is being spoken about as strain, safety or vocal health",
    ).toEqual([]);
  });

  it("finds no statement binding a resonance share to a verdict name", () => {
    const binding = [
      /(?:strain|pressed|safe|safety|health)\w*\s*[:=][^;\n]{0,120}(?:ring[ _]?ratio|bandRatio)/i,
      /(?:ring[ _]?ratio|bandRatio)[^;\n]{0,80}(?:=>|as)\s*(?:strain|pressed|safe|safety|health)/i,
    ];
    const offenders: string[] = [];
    for (const path of sourceFiles()) {
      for (const line of readFileSync(join(ROOT, path), "utf8").split("\n")) {
        for (const pattern of binding) {
          if (pattern.test(line)) offenders.push(`${path}: ${line.trim().slice(0, 200)}`);
        }
      }
    }
    expect(offenders, "a resonance share is bound to a verdict name").toEqual([]);
  });

  it("finds no module claiming the primitives a strain measurement would need", () => {
    /**
     * The other half of the prohibition. A file that computes jitter, shimmer,
     * HNR or CPP is not forbidden — those are tone metrics a validated study
     * could one day calibrate. What is forbidden is one of them reaching a
     * verdict, or the contract row above staying "no" while code elsewhere
     * quietly claims otherwise. So: if a primitive appears, it must not appear
     * next to a safety claim, and the contract has to have moved with it.
     */
    const primitive = /\bjitter\b|\bshimmer\b|\bharmonic[- ]to[- ]noise\b|\bHNR\b|\bcepstral peak\b|\bCPP\b/;
    const offenders: string[] = [];
    for (const path of sourceFiles()) {
      for (const chunk of chunks(readFileSync(join(ROOT, path), "utf8"))) {
        if (!primitive.test(chunk)) continue;
        if (!VERDICT_TERM.test(chunk)) continue;
        if (DENIALS.some((pattern) => pattern.test(chunk))) continue;
        // The contract row's own note names all four primitives in order to say
        // none of them exists, which is the honest form.
        if (/\bNo jitter, shimmer, HNR or CPP\b/.test(chunk)) continue;
        offenders.push(`${path}: ${chunk.trim().slice(0, 200)}`);
      }
    }
    expect(
      offenders,
      "a voice-quality primitive is being spoken about as strain, safety or vocal health. " +
        "Jitter, shimmer, HNR and CPP are tone metrics with no validated threshold here; " +
        "none of them may carry a verdict until one exists.",
    ).toEqual([]);
  });
});
