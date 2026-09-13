/**
 * Keeps contracts/suede-progress.json equal to the live shape, and keeps the
 * shape equal to what the contract claims about it.
 *
 * The second half matters more here than in most of these files, because most of
 * what this contract publishes is not a number. It publishes which fields are
 * mandatory, which caps are enforced, and two refusals — XP and the streak — and
 * every one of those can rot without a single value changing. A byte comparison
 * alone would keep the file in step with the builder while both drifted away
 * from the app.
 *
 * Regenerate with:
 *   CONTRACT_WRITE=1 npx vitest run contracts/suede-progress.test.ts
 */
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  buildContract,
  serializeContract,
  CONTRACT_KEYS,
  CONTRACT_NAME,
  CONTRACT_VERSION,
} from "./suede-progress";
import { PROGRESS_STORAGE_KEY } from "@/lib/progress";
import {
  ACTIVITY_TYPES,
  DEFAULT_PROGRESS,
  MAX_ACHIEVEMENTS,
  MAX_RANGE_HISTORY,
  MAX_SESSIONS,
  MAX_XP,
  WARMUP_MODES,
  checkProgress,
  isValidSession,
} from "@/lib/progress-shape";

const FILE = fileURLToPath(new URL("./suede-progress.json", import.meta.url));
const PARITY = fileURLToPath(new URL("./practice-parity.json", import.meta.url));

/**
 * Every path in the built contract whose value is `undefined`.
 *
 * This builder's older sibling serialized `undefined` for two constants that
 * were never exported. `JSON.stringify` dropped both keys, every equality
 * assertion in the suite still passed, and the contract quietly described less
 * than it claimed to. An equality check cannot catch that; a walk can.
 */
function undefinedLeaves(value: unknown, path = "$"): string[] {
  if (value === undefined) return [path];
  if (Array.isArray(value)) {
    return value.flatMap((entry, index) => undefinedLeaves(entry, `${path}[${index}]`));
  }
  if (value && typeof value === "object") {
    return Object.entries(value).flatMap(([key, entry]) =>
      undefinedLeaves(entry, `${path}.${key}`),
    );
  }
  return [];
}

/** Every key name appearing anywhere in the contract, at any depth. */
function allKeys(value: unknown): string[] {
  if (Array.isArray(value)) return value.flatMap(allKeys);
  if (value && typeof value === "object") {
    return Object.entries(value).flatMap(([key, entry]) => [key, ...allKeys(entry)]);
  }
  return [];
}

function session(over: Record<string, unknown> = {}) {
  return {
    id: "s1",
    type: "warmup",
    date: "2026-01-01T12:00:00.000Z",
    day: "2026-01-01",
    durationSec: 60,
    xp: 10,
    ...over,
  };
}

describe("suede-progress contract", () => {
  it("matches the live shape", () => {
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
        "contracts/suede-progress.json is missing. Regenerate it with " +
          "CONTRACT_WRITE=1 npx vitest run contracts/suede-progress.test.ts",
      );
    }
    expect(actual).toBe(expected);
  });

  it("has no undefined leaves", () => {
    expect(undefinedLeaves(buildContract())).toEqual([]);
  });

  it("declares every top-level key, in a list kept sorted for review", () => {
    expect([...CONTRACT_KEYS]).toEqual([...CONTRACT_KEYS].sort());
    expect(Object.keys(buildContract()).sort()).toEqual([...CONTRACT_KEYS]);
  });

  it("publishes the live vocabularies rather than a copy of them", () => {
    const contract = buildContract();
    expect(contract.contract).toBe(CONTRACT_NAME);
    expect(contract.version).toBe(CONTRACT_VERSION);
    expect(contract.storage.key).toBe(PROGRESS_STORAGE_KEY);
    expect(contract.session.activityTypes).toEqual([...ACTIVITY_TYPES]);
    expect(contract.session.warmupModes).toEqual([...WARMUP_MODES]);
    expect(contract.record.fields).toEqual(Object.keys(DEFAULT_PROGRESS).sort());
  });

  /**
   * The field split is derived by probing the validator, so this restates the
   * three fields that are required for a reason and would be a behaviour change
   * to loosen. A derivation agreeing with itself proves nothing; this is the
   * independent opinion.
   */
  it("requires the three fields a corrupt row cannot be repaired without", () => {
    const { required, optional } = buildContract().session;
    expect(required).toEqual(["date", "day", "durationSec", "id", "type", "xp"]);
    expect(optional).toEqual(["detail", "mode", "notes", "score"]);

    // And the probe is reading the real validator, not a stale memory of it.
    expect(isValidSession(session())).toBe(true);
    for (const field of ["id", "type", "day"] as const) {
      const broken: Record<string, unknown> = session();
      delete broken[field];
      expect(isValidSession(broken), `${field} must still be mandatory`).toBe(false);
    }
    expect(isValidSession(session({ score: undefined, detail: undefined }))).toBe(true);
  });

  it("publishes caps that the acceptance check actually enforces", () => {
    const { caps } = buildContract();
    expect(caps.maxSessions).toBe(MAX_SESSIONS);
    expect(caps.maxRangeHistory).toBe(MAX_RANGE_HISTORY);
    expect(caps.maxAchievements).toBe(MAX_ACHIEVEMENTS);
    expect(caps.maxXp).toBe(MAX_XP);

    const base = {
      xp: 0,
      sessions: [],
      streak: { current: 0, best: 0, lastDay: null },
      range: {},
      rangeHistory: [],
      achievements: [],
    };
    expect(checkProgress(base)).toBeNull();
    // A published cap that nothing refuses is a suggestion, not a cap.
    expect(
      checkProgress({
        ...base,
        sessions: Array.from({ length: caps.maxSessions + 1 }, () => session()),
      })?.overCap,
    ).toBe(true);
    expect(checkProgress({ ...base, xp: caps.maxXp + 1 })?.overCap).toBe(true);
    expect(
      checkProgress({
        ...base,
        achievements: Array.from({ length: caps.maxAchievements + 1 }, (_, i) => `a${i}`),
      })?.overCap,
    ).toBe(true);
  });

  /**
   * The refusals are the part of this contract a consumer is most likely to
   * argue with, so they are asserted rather than trusted to stay written down.
   */
  it("refuses XP and the streak, and says why", () => {
    const { portability } = buildContract();
    expect(portability.xp.importable).toBe(false);
    expect(portability.streak.importable).toBe(false);
    expect(portability.achievements.importable).toBe(false);
    expect(portability.sessions.importable).toBe(true);
    expect(portability.range.importable).toBe(true);
    for (const verdict of Object.values(portability)) {
      expect(verdict.because.length).toBeGreaterThan(80);
    }
  });

  /**
   * The XP rate is published once, in practice-parity, and pointed at from here.
   * Both halves of that arrangement are checked: the pointer has to resolve, and
   * this contract must not have quietly grown its own copy of the numbers.
   */
  it("points at the XP rate instead of repeating it", () => {
    const parity = JSON.parse(readFileSync(PARITY, "utf8")) as {
      progress?: { xpEarn?: Record<string, unknown> };
    };
    expect(buildContract().portability.xp.definedIn).toBe(
      "contracts/practice-parity.json#progress.xpEarn",
    );
    expect(parity.progress?.xpEarn).toBeTruthy();

    const keys = new Set(allKeys(buildContract()));
    for (const duplicated of ["perMinute", "minPerSession", "maxPerSession", "scoreBonuses", "perAchievement", "xpThresholds", "levelTitles"]) {
      expect(keys.has(duplicated), `${duplicated} belongs to practice-parity only`).toBe(false);
    }
  });
});
