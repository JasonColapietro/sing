/**
 * Keeps contracts/glossary.json equal to the glossary the app renders, and keeps
 * the claims the file makes about ownership true.
 *
 * Regenerate with:
 *   CONTRACT_WRITE=1 npx vitest run contracts/glossary.test.ts
 */
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  buildContract,
  CONTRACT_VERSION,
  serializeContract,
} from "./glossary";
import {
  GLOSSARY_TERMS,
  glossaryKey,
  publisherFor,
  SING_GLOSSARY_TERMS,
} from "@/lib/glossary";

const FILE = fileURLToPath(new URL("./glossary.json", import.meta.url));

describe("glossary contract", () => {
  it("matches the glossary the app runs on", () => {
    const expected = serializeContract();

    if (process.env.CONTRACT_WRITE) {
      writeFileSync(FILE, expected);
      return;
    }

    let actual: string;
    try {
      actual = readFileSync(FILE, "utf8");
    } catch {
      throw new Error(
        "contracts/glossary.json is missing. Regenerate it with CONTRACT_WRITE=1 npx vitest run contracts/glossary.test.ts",
      );
    }

    expect(JSON.parse(actual)).toEqual(JSON.parse(expected));
    expect(actual).toBe(expected);
  });

  /**
   * The key list is asserted rather than the shape inferred, so adding a
   * top-level section is a deliberate edit here and a visible one in review.
   */
  it("carries exactly the sections a consumer reads", () => {
    const contract = buildContract();

    expect(Object.keys(contract).sort()).toEqual([
      "contract",
      "counts",
      "reference",
      "sections",
      "version",
    ]);
    expect(contract.contract).toBe("suede-glossary");
    expect(contract.version).toBe(CONTRACT_VERSION);
  });

  it("carries every entry, with the publisher derived from the domain", () => {
    const contract = buildContract();
    const entries = contract.sections.flatMap((section) => section.entries);

    expect(entries).toHaveLength(GLOSSARY_TERMS.length);
    expect(entries.map((e) => e.key)).toEqual(GLOSSARY_TERMS.map(glossaryKey));
    for (const entry of entries) {
      expect(entry.publisher).toBe(publisherFor(entry.domain));
      expect(Object.keys(entry).sort()).toEqual([
        "aka",
        "anchor",
        "definition",
        "domain",
        "href",
        "key",
        "publisher",
        "term",
        "where",
      ]);
    }

    expect(contract.counts.total).toBe(GLOSSARY_TERMS.length);
    expect(contract.counts.byPublisher.sing).toBe(SING_GLOSSARY_TERMS.length);
    expect(contract.counts.byPublisher.guitarHub).toBe(
      GLOSSARY_TERMS.length - SING_GLOSSARY_TERMS.length,
    );
  });

  /**
   * JSON.stringify drops an undefined value silently, so a builder reading a
   * field that is optional on the source type — `aka` is — produces a contract
   * missing the key entirely while every equality assertion still passes. That
   * is how `pitch.detectorMinHz` vanished from the vocal contract.
   *
   * So walk the built object and fail on any undefined leaf.
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

  it("serializes with a stable indent and a trailing newline", () => {
    const text = serializeContract({ a: 1 });
    expect(text).toBe('{\n  "a": 1\n}\n');
  });
});
