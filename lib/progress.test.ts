import { afterEach, describe, expect, it, vi } from "vitest";
import { TYPE_META } from "@/components/progress/format";
import { localDay } from "./progress";

describe("localDay", () => {
  it("formats the local calendar day, zero-padded", () => {
    expect(localDay(new Date(2026, 0, 5, 13, 0, 0))).toBe("2026-01-05");
    expect(localDay(new Date(2026, 11, 31, 23, 59, 0))).toBe("2026-12-31");
  });

  it("uses local time, not UTC — late-night practice counts for that night", () => {
    // 23:30 local on the 14th is already the 15th in UTC at any negative offset.
    expect(localDay(new Date(2026, 7, 14, 23, 30, 0))).toBe("2026-08-14");
  });

  it("defaults to now, which is what the streak compares against", () => {
    expect(localDay()).toBe(localDay(new Date()));
  });
});

const KEY = "suede-sing:progress:v1";

/**
 * A throwaway `window` with just enough localStorage for the store to read.
 * The suite runs in node, so there is no DOM to borrow one from, and the whole
 * point of these cases is what `load()` does with the bytes it finds there.
 */
async function withStoredRecord(raw: string) {
  const store = new Map<string, string>([[KEY, raw]]);
  vi.stubGlobal("window", {
    localStorage: {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => void store.set(k, v),
      removeItem: (k: string) => void store.delete(k),
    },
    addEventListener: () => {},
  });
  // The store caches the parsed state in a module-level variable, so each case
  // needs its own copy of the module rather than a shared, already-warm one.
  vi.resetModules();
  const mod = await import("./progress");
  return { ...mod, getStored: () => store.get(KEY) ?? null };
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.resetModules();
});

describe("load() against a corrupt record", () => {
  /**
   * The shape that took /progress down in production: valid JSON, right field
   * names at the top level, wrong shape underneath. `sessions[0]` carries the
   * `kind`/`sec` instead of `type`/`durationSec`, and note names in `range`
   * instead of MIDI numbers. No release ever wrote these names — the point is
   * that a record does not have to come from a real past schema to exist. A
   * half-written write, a foreign import, or thirty seconds in devtools gets
   * you here, and none of those are reasons to lose the page.
   */
  const CORRUPT = JSON.stringify({
    xp: 1240,
    sessions: [{ id: "s0", kind: "warmup", day: "2026-08-21", sec: 300 }],
    streak: { current: 4, best: 6, lastDay: "2026-08-21" },
    range: { low: "C3", high: "A4" },
    rangeHistory: [],
    achievements: [],
  });

  it("returns a state the progress page can render instead of throwing", async () => {
    const { getState } = await withStoredRecord(CORRUPT);
    const state = getState();

    // The actual production crash: the session table looks the activity up in
    // TYPE_META and reads `.tone` off the result. A session whose `type` is not
    // a known activity makes that lookup undefined and takes the page down.
    expect(() =>
      state.sessions.map((s) => TYPE_META[s.type].tone),
    ).not.toThrow();
  });

  it("drops the unusable session rather than handing it to consumers", async () => {
    const { getState } = await withStoredRecord(CORRUPT);
    expect(getState().sessions).toEqual([]);
  });

  it("strips range fields that are not the shape VocalRange promises", async () => {
    const { getState } = await withStoredRecord(CORRUPT);
    const { range } = getState();
    expect(range.lowMidi).toBeUndefined();
    expect(range.highMidi).toBeUndefined();
    // `low`/`high` are not VocalRange fields; they must not survive the read.
    expect(Object.keys(range)).toEqual([]);
  });

  it("keeps the parts of the record that were never corrupt", async () => {
    const { getState } = await withStoredRecord(CORRUPT);
    const state = getState();
    expect(state.xp).toBe(1240);
    expect(state.streak).toEqual({ current: 4, best: 6, lastDay: "2026-08-21" });
  });

  it("keeps well-formed sessions sitting alongside a corrupt one", async () => {
    const good = {
      id: "s1",
      type: "ear",
      date: "2026-08-20T18:04:00.000Z",
      day: "2026-08-20",
      durationSec: 240,
      score: 88,
      xp: 55,
    };
    const { getState } = await withStoredRecord(
      JSON.stringify({
        xp: 55,
        sessions: [{ id: "s0", kind: "warmup", day: "2026-08-21" }, good],
        streak: { current: 1, best: 1, lastDay: "2026-08-20" },
        range: {},
        rangeHistory: [],
        achievements: ["first-note"],
      }),
    );
    const state = getState();
    expect(state.sessions).toEqual([good]);
    expect(state.achievements).toEqual(["first-note"]);
  });

  it("repairs a corrupt record arriving over sync, not just a stored one", async () => {
    const { getState, mergeRemoteProgress } = await withStoredRecord(
      JSON.stringify({
        xp: 0,
        sessions: [],
        streak: { current: 0, best: 0, lastDay: null },
        range: {},
        rangeHistory: [],
        achievements: [],
      }),
    );
    // A second device sends a session shape this app never wrote.
    const merged = mergeRemoteProgress({
      xp: 90,
      sessions: [{ id: "r0", kind: "song", day: "2026-08-19", sec: 120 }],
      streak: { current: 2, best: 2, lastDay: "2026-08-19" },
      range: { low: "C3", high: "A4" },
      rangeHistory: [{ lowMidi: "C3", highMidi: "A4", testedAt: "x" }],
      achievements: ["first-note", 7],
    });

    expect(() => merged.sessions.map((s) => TYPE_META[s.type].tone)).not.toThrow();
    expect(merged.sessions).toEqual([]);
    expect(merged.rangeHistory).toEqual([]);
    expect(merged.achievements).toEqual(["first-note"]);
    expect(getState()).toEqual(merged);
  });

  it("leaves the stored bytes alone, then heals them on the next real save", async () => {
    const { logSession, getStored } = await withStoredRecord(CORRUPT);

    // Reading must not rewrite: the stored bytes are the only copy the singer
    // has, and a later migration may understand them better than this one does.
    expect(getStored()).toBe(CORRUPT);

    logSession({ type: "breath", durationSec: 60 });
    const healed = JSON.parse(getStored()!);
    expect(healed.sessions).toHaveLength(1);
    expect(healed.sessions[0].type).toBe("breath");
    expect(healed.range).toEqual({});
  });

  it("survives a record that is not an object at all", async () => {
    const { getState } = await withStoredRecord('"not a progress state"');
    const state = getState();
    expect(state.xp).toBe(0);
    expect(state.sessions).toEqual([]);
    expect(state.streak).toEqual({ current: 0, best: 0, lastDay: null });
  });
});

describe("the shape module and the render table agree on activity types", () => {
  /**
   * The production crash was a disagreement between two lists of activity
   * types: one the store would accept, one the table could render. They are now
   * one list — `ActivityType` is derived from `ACTIVITY_TYPES` — and this is the
   * runtime half of that guarantee.
   */
  it("TYPE_META has an entry for every activity type the store accepts", async () => {
    const { ACTIVITY_TYPES } = await import("./progress");
    for (const type of ACTIVITY_TYPES) {
      expect(TYPE_META[type]).toBeDefined();
    }
    expect(Object.keys(TYPE_META).sort()).toEqual([...ACTIVITY_TYPES].sort());
  });
});

describe("sanitizeProgress", () => {
  it("leaves a healthy state untouched — the merge relies on that", async () => {
    const { sanitizeProgress } = await import("./progress-shape");
    const healthy = sanitizeProgress({
      xp: 310,
      sessions: [
        {
          id: "a",
          type: "warmup",
          date: "2026-08-20T09:00:00.000Z",
          day: "2026-08-20",
          durationSec: 300,
          xp: 50,
          score: 91,
          detail: "Lip trills",
        },
      ],
      streak: { current: 3, best: 5, lastDay: "2026-08-20" },
      range: { lowMidi: 48, highMidi: 72, voiceTypeLabel: "Baritone", testedAt: "t" },
      rangeHistory: [{ lowMidi: 48, highMidi: 72, testedAt: "t" }],
      achievements: ["first-note", "warmed-up"],
    });
    expect(sanitizeProgress(healthy)).toEqual(healthy);
    expect(healthy.sessions).toHaveLength(1);
    expect(healthy.range.lowMidi).toBe(48);
  });

  it("coerces numbers that would otherwise spread NaN through every total", async () => {
    const { sanitizeProgress } = await import("./progress-shape");
    const state = sanitizeProgress({
      xp: Number.NaN,
      sessions: [
        {
          id: "a",
          type: "ear",
          date: "2026-08-20T09:00:00.000Z",
          day: "2026-08-20",
          durationSec: "300",
          xp: Number.POSITIVE_INFINITY,
        },
      ],
      streak: { current: 4, best: 1, lastDay: "nope" },
    });
    expect(state.xp).toBe(0);
    expect(state.sessions[0].durationSec).toBe(0);
    expect(state.sessions[0].xp).toBe(0);
    expect(state.sessions.reduce((a, s) => a + s.durationSec, 0)).toBe(0);
    // A best that trails the current run is arithmetic that cannot be true.
    expect(state.streak).toEqual({ current: 4, best: 4, lastDay: null });
  });

  it("fills a missing timestamp with a time that cannot forge an achievement", async () => {
    const { sanitizeProgress } = await import("./progress-shape");
    const [session] = sanitizeProgress({
      sessions: [
        { id: "a", type: "breath", day: "2026-08-20", durationSec: 60, xp: 10 },
      ],
    }).sessions;
    const hour = new Date(session.date).getHours();
    expect(Number.isNaN(hour)).toBe(false);
    // "night owl" is 0-5 and "early bird" is 5-8; noon is clear of both.
    expect(hour).toBe(12);
  });
});

describe("an XP total the ladder has no rung for", () => {
  /**
   * XP is clamped at the floor but used to have no ceiling, so seeding a large
   * enough number made the level card render "-999,999,999,853,600 to next":
   * the countdown subtracts the total from the last rung's threshold, and past
   * that rung the difference goes negative. localStorage is one way in; the
   * JSON import path is the one that does not need devtools.
   */
  const ABSURD = [
    ["a hand-edited localStorage record", 1e15],
    ["the largest integer JSON can round-trip", Number.MAX_SAFE_INTEGER],
  ] as const;

  it.each(ABSURD)("holds %s at the ceiling", async (_label, xp) => {
    const { sanitizeProgress, MAX_XP } = await import("./progress-shape");
    expect(sanitizeProgress({ xp }).xp).toBe(MAX_XP);
  });

  it.each(ABSURD)("caps the level card rather than counting down from %s", async (_label, xp) => {
    const { levelForXp } = await import("./progress");
    const lvl = levelForXp(xp);
    expect(lvl.level).toBe(60);
    expect(lvl.toNext).toBe(0);
    expect(lvl.progress).toBe(1);
    // The card prints `intoLevel / (intoLevel + toNext)`, so intoLevel has to
    // stay inside the level's own span or the denominator stops meaning one.
    expect(lvl.intoLevel).toBe(xpThresholdFor(60) - xpThresholdFor(59));
  });

  it("floors a negative total instead of running the bar backwards", async () => {
    const { sanitizeProgress } = await import("./progress-shape");
    const { levelForXp } = await import("./progress");
    expect(sanitizeProgress({ xp: -5_000 }).xp).toBe(0);
    const lvl = levelForXp(-5_000);
    expect(lvl).toMatchObject({ level: 1, intoLevel: 0, progress: 0 });
    expect(lvl.toNext).toBe(xpThresholdFor(1));
  });

  it("treats a numeric string as no XP, not as NaN", async () => {
    const { sanitizeProgress } = await import("./progress-shape");
    const { levelForXp } = await import("./progress");
    // A backup edited in a text editor quotes its numbers easily enough.
    expect(sanitizeProgress({ xp: "500" }).xp).toBe(0);
    const lvl = levelForXp("500" as unknown as number);
    expect(Number.isNaN(lvl.progress)).toBe(false);
    expect(lvl).toMatchObject({ level: 1, intoLevel: 0, progress: 0 });
  });

  it("leaves a total a singer could actually earn exactly where it was", async () => {
    const { sanitizeProgress } = await import("./progress-shape");
    const { levelForXp } = await import("./progress");
    expect(sanitizeProgress({ xp: 4_310 }).xp).toBe(4_310);
    const lvl = levelForXp(4_310);
    // Level 10 spans 3,600..4,400, so the countdown is the plain subtraction
    // it always was.
    expect(lvl).toMatchObject({ level: 10, intoLevel: 710, toNext: 90 });
  });
});

/** The ladder's own curve, restated so the cases above assert against a
 *  number rather than against lib/progress.ts's private copy of it. */
function xpThresholdFor(level: number): number {
  return 40 * level * (level + 1);
}

describe("identities are strict, labels are not", () => {
  it("keeps a session whose detail is empty but drops one with an empty id", async () => {
    const { sanitizeProgress, checkProgress } = await import("./progress-shape");
    const base = {
      type: "recording" as const,
      date: "2026-08-20T09:00:00.000Z",
      day: "2026-08-20",
      durationSec: 30,
      xp: 5,
    };
    // An untitled recorder take really does produce detail: "".
    const state = sanitizeProgress({
      sessions: [
        { ...base, id: "keep", detail: "" },
        { ...base, id: "", detail: "dropped" },
      ],
    });
    expect(state.sessions.map((s) => s.id)).toEqual(["keep"]);
    expect(state.sessions[0].detail).toBe("");

    // And the accept path agrees: an empty label is not a reason to refuse a
    // whole backup, an empty id is.
    expect(checkProgress(state)).toBeNull();
    expect(
      checkProgress({ ...state, sessions: [{ ...base, id: "", detail: "" }] }),
    ).toEqual({ reason: "A session in the payload is malformed.", overCap: false });
  });
});

describe("a record written by the first release still loads", () => {
  /**
   * The genuine v1 shape, from the scaffold commit: no `rangeHistory` key at
   * all (it arrived with Pro analytics) and no `notes` on a session. This is
   * the only schema evolution this store has ever had, and it is additive.
   *
   * It matters because sanitizeProgress runs before migrate and fills a missing
   * `rangeHistory` with `[]` — erasing the difference between "key absent" and
   * "key present but empty". migrate keys off emptiness rather than presence,
   * so the seed still happens; this pins that, because a singer who took the
   * range test before Pro shipped would otherwise open the chart to nothing.
   */
  const V1 = JSON.stringify({
    xp: 150,
    sessions: [
      {
        id: "1730000000000-123456",
        type: "warmup",
        date: "2026-05-01T09:00:00.000Z",
        day: "2026-05-01",
        durationSec: 300,
        score: 88,
        detail: "Lip trills",
        xp: 55,
      },
    ],
    streak: { current: 1, best: 4, lastDay: "2026-05-01" },
    range: {
      lowMidi: 45,
      highMidi: 69,
      voiceType: "baritone",
      voiceTypeLabel: "Baritone",
      testedAt: "2026-05-01T09:10:00.000Z",
    },
    achievements: ["first-note", "warmed-up"],
  });

  it("keeps every session, score and label the old release wrote", async () => {
    const { getState } = await withStoredRecord(V1);
    const state = getState();
    expect(state.xp).toBe(150);
    expect(state.sessions).toHaveLength(1);
    expect(state.sessions[0]).toMatchObject({
      type: "warmup",
      detail: "Lip trills",
      score: 88,
      durationSec: 300,
      xp: 55,
    });
    expect(state.achievements).toEqual(["first-note", "warmed-up"]);
    expect(state.streak).toEqual({ current: 1, best: 4, lastDay: "2026-05-01" });
  });

  it("seeds the range chart from the one measurement v1 kept", async () => {
    const { getState } = await withStoredRecord(V1);
    expect(getState().rangeHistory).toEqual([
      {
        lowMidi: 45,
        highMidi: 69,
        voiceTypeLabel: "Baritone",
        testedAt: "2026-05-01T09:10:00.000Z",
      },
    ]);
  });

  it("does not re-seed once a real history exists", async () => {
    const { getState } = await withStoredRecord(
      JSON.stringify({
        ...JSON.parse(V1),
        rangeHistory: [
          { lowMidi: 47, highMidi: 70, testedAt: "2026-06-01T09:00:00.000Z" },
        ],
      }),
    );
    expect(getState().rangeHistory).toHaveLength(1);
    expect(getState().rangeHistory[0].testedAt).toBe("2026-06-01T09:00:00.000Z");
  });
});
