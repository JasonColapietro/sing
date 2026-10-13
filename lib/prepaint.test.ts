import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { describe, expect, it } from "vitest";
import { CAPPED_TYPES, isCapped } from "./free-cap";
import { PROGRESS_STORAGE_KEY, localDay } from "./progress";
import { PRO_STORAGE_KEY } from "./pro";
import { PROGRAM_STORAGE_KEY } from "@/components/programs/store";
import { liveStreak } from "@/components/account/save-state";
import { programDayNeedsPro } from "@/components/practice/program-day";
import { DEFAULT_PROGRESS, sanitizeProgress, type ProgressState, type SessionLog } from "./progress-shape";
import {
  addDays,
  dayNeedsPro,
  isRestDay,
  programById,
  programToday,
  reconcileProgress,
  reviveProgress,
} from "./programs";
import { PREPAINT_CAPPED_TYPES, PREPAINT_KEYS, prepaintState } from "./prepaint";
import { PREPAINT_CONFIG, PREPAINT_SCRIPT } from "./prepaint-config";

/** Noon local time, so "today" and "yesterday" never straddle a midnight. */
const NOW = new Date(2026, 9, 14, 12, 0, 0);
const TODAY = localDay(NOW);
const ago = (n: number) => {
  const d = new Date(NOW);
  d.setDate(d.getDate() - n);
  return localDay(d);
};

function storageOf(stored: Record<string, unknown>) {
  return {
    getItem: (key: string) => (key in stored ? (typeof stored[key] === "string" ? (stored[key] as string) : JSON.stringify(stored[key])) : null),
  };
}

function session(type: SessionLog["type"], durationSec: number, day = TODAY): SessionLog {
  return { id: `${type}-${durationSec}-${day}`, type, date: `${day}T10:00:00.000Z`, day, durationSec, xp: 4 };
}

function progress(...sessions: SessionLog[]): ProgressState {
  return { ...DEFAULT_PROGRESS, sessions };
}

const state = (stored: Record<string, unknown>) => prepaintState(storageOf(stored), NOW, PREPAINT_CONFIG);

describe("pre-paint state: what it reads", () => {
  it("reads the same storage keys as the stores that own them", () => {
    expect(PREPAINT_KEYS).toEqual({
      progress: PROGRESS_STORAGE_KEY,
      pro: PRO_STORAGE_KEY,
      program: PROGRAM_STORAGE_KEY,
    });
  });

  it("counts the same activities as the free cap", () => {
    expect([...PREPAINT_CAPPED_TYPES].sort()).toEqual([...CAPPED_TYPES].sort());
  });
});

describe("pre-paint state: the free plan", () => {
  const cases: [string, ProgressState, boolean][] = [
    ["a newcomer", progress(), false],
    ["under the cap", progress(session("warmup", 120), session("pitch", 900)), false],
    ["one second short", progress(session("warmup", 299)), false],
    ["exactly at the cap", progress(session("warmup", 200), session("song", 100)), true],
    ["over it across rooms", progress(session("ear", 200), session("breath", 330)), true],
    ["over it yesterday only", progress(session("warmup", 900, ago(1))), false],
    ["over it in uncapped rooms", progress(session("range", 600), session("tools", 600)), false],
  ];

  for (const [name, record, capped] of cases) {
    it(`agrees with the room's cap for ${name}`, () => {
      expect(isCapped(record, false, TODAY)).toBe(capped);
      expect(state({ [PROGRESS_STORAGE_KEY]: record }).plan).toBe(capped ? "capped" : "free");
      // Pro is never capped, and never shown the free line.
      expect(state({ [PROGRESS_STORAGE_KEY]: record, [PRO_STORAGE_KEY]: { active: true } }).plan).toBe("pro");
    });
  }

  it("prints the minutes left the way the allowance line does", () => {
    expect(state({}).freeLeft).toBe("5:00");
    expect(state({ [PROGRESS_STORAGE_KEY]: progress(session("warmup", 100), session("ear", 30.4)) }).freeLeft).toBe("2:50");
    expect(state({ [PROGRESS_STORAGE_KEY]: progress(session("warmup", 400)) }).freeLeft).toBe("0:00");
  });

  it("names the streak only while it is live, as the cap wall does", () => {
    for (const [streak, expected] of [
      [{ current: 4, best: 4, lastDay: TODAY }, ", now 4 days"],
      [{ current: 4, best: 9, lastDay: ago(1) }, ", now 4 days"],
      [{ current: 4, best: 9, lastDay: ago(2) }, ""],
      [{ current: 1, best: 1, lastDay: TODAY }, ""],
    ] as const) {
      const live = liveStreak({ current: streak.current, lastDay: streak.lastDay }, NOW);
      expect(live > 1 ? `, now ${live} days` : "").toBe(expected);
      expect(state({ [PROGRESS_STORAGE_KEY]: { ...progress(), streak } }).streakClause).toBe(expected);
    }
  });

  it("treats unreadable storage as a newcomer's, never as an error", () => {
    const blocked = { getItem: () => { throw new Error("SecurityError"); } };
    expect(prepaintState(blocked, NOW, PREPAINT_CONFIG)).toEqual({ plan: "free", program: null, freeLeft: "5:00", streakClause: "", range: false });
    expect(state({ [PROGRESS_STORAGE_KEY]: "{not json", [PRO_STORAGE_KEY]: "[]" }).plan).toBe("free");
  });
});

describe("pre-paint state: a saved range", () => {
  it("is saved exactly when both ends survive the record's repair, as the pages compare against it", () => {
    for (const [range, saved] of [
      [{ lowMidi: 45, highMidi: 65 }, true],
      [{ lowMidi: 45.5, highMidi: 65, voiceType: "baritone" }, true],
      [{}, false],
      [{ lowMidi: 45 }, false],
      [{ highMidi: 65 }, false],
      [{ lowMidi: "45", highMidi: 65 }, false],
      [{ lowMidi: null, highMidi: 65 }, false],
      [null, false],
    ] as const) {
      const record = { ...progress(), range };
      // lib/progress-shape.ts sanitizeProgress is what useProgress returns.
      const repaired = sanitizeProgress(JSON.parse(JSON.stringify(record))).range;
      expect(repaired.lowMidi !== undefined && repaired.highMidi !== undefined, JSON.stringify(range)).toBe(saved);
      expect(state({ [PROGRESS_STORAGE_KEY]: record }).range, JSON.stringify(range)).toBe(saved);
    }
    expect(state({}).range).toBe(false);
    expect(state({ [PROGRESS_STORAGE_KEY]: "{not json" }).range).toBe(false);
  });
});

/**
 * The program card the pages will show, worked out the way they work it out:
 * reviveProgress, reconcileProgress over a log with nothing in it (so only
 * rest days complete themselves), programToday, then the cards' paywall and
 * cap rules.
 */
function expectedTokens(raw: unknown, opts: { isPro?: boolean; capped?: boolean } = {}): string | null {
  const stored = reviveProgress(raw);
  const program = programById(stored?.programId);
  if (!stored || !program) return null;
  const reconciled = reconcileProgress(program, stored, [], TODAY);
  const view = programToday(program, reconciled, TODAY);
  const tokens: string[] = [];
  if (view.status === "finished") {
    tokens.push("finished");
    // The finished card's size is the program's own; the book's is "book".
    tokens.push(program.chapters ? "book" : program.id);
  } else if (view.status === "done-today") {
    tokens.push("done");
    if (isRestDay(program.days[view.index])) tokens.push("rest");
    const next = program.days[view.index + 1];
    if (!opts.isPro && next && !isRestDay(next) && dayNeedsPro(program, view.index + 1)) tokens.push("next-locked");
  } else {
    tokens.push("todo");
    if (programDayNeedsPro({ program, view }, Boolean(opts.isPro))) tokens.push("locked");
    else if (opts.capped) tokens.push("waits");
  }
  return tokens.join(" ");
}

function record(programId: string, startedAgo: number, done: [index: number, daysAgo: number][]) {
  return {
    programId,
    startedDay: ago(startedAgo),
    startedAt: `${ago(startedAgo)}T08:00:00.000Z`,
    done: done.map(([index, d]) => ({ index, day: ago(d), manual: true })),
  };
}

/** The Measured Voice's days 43 to 84, done on an earlier pass (lib/programs.ts repeatFortnight). */
function repeatedLater() {
  return Array.from({ length: 84 - 42 }, (_, k) => ({ index: 42 + k, day: ago(150 - k) }));
}

/**
 * A finished run of The Measured Voice gone back to weeks 5 and 6, with
 * `done` days done: days 1 to 28 long ago, the rest one a day up to
 * `lastAgo` days ago.
 */
function repeating(done: number, lastAgo = 1) {
  const base = record("measured-voice-12w", 200, Array.from({ length: Math.min(done, 28) }, (_, i) => [i, 200 - i] as [number, number]));
  const again = Array.from({ length: Math.max(0, done - 28) }, (_, k) => ({
    index: 28 + k,
    day: ago(lastAgo + (done - 28 - 1 - k)),
    manual: true,
  }));
  return { ...base, done: [...base.done, ...again], until: 42, later: repeatedLater() };
}

describe("pre-paint state: the running program", () => {
  const records: [string, unknown][] = [
    ["no program", null],
    ["a day still to do", record("foundations-2w", 1, [[0, 1]])],
    ["day 1, started today", record("foundations-2w", 0, [])],
    ["a day done today", record("foundations-2w", 1, [[0, 1], [1, 0]])],
    ["a rest day reached today", record("foundations-2w", 6, [[0, 6], [1, 5], [2, 4], [3, 3], [4, 2], [5, 1]])],
    ["a rest day ending a Pro program's free week", record("mix-4w", 6, [[0, 6], [1, 5], [2, 4], [3, 3], [4, 2], [5, 1]])],
    ["a rest day marked done today", record("mix-4w", 6, [0, 1, 2, 3, 4, 5, 6].map((i) => [i, 6 - i] as [number, number]))],
    ["a Pro day past the free week", record("mix-4w", 7, [0, 1, 2, 3, 4, 5, 6].map((i) => [i, 7 - i] as [number, number]))],
    ["the last day done", record("foundations-2w", 13, Array.from({ length: 14 }, (_, i) => [i, 13 - i] as [number, number]))],
    ["two rest days in a row reached", record("mix-4w", 3, [[0, 3], [1, 2], [2, 1]])],
    ["an unknown program", { ...record("foundations-2w", 1, []), programId: "nope" }],
    ["a record with no start day", { programId: "foundations-2w", done: [] }],
    ["a broken done list", { ...record("foundations-2w", 3, [[0, 3]]), done: [{ index: 0, day: ago(3) }, { index: 5, day: ago(1) }] }],
    ["a done list out of order", { ...record("foundations-2w", 3, []), done: [{ index: 0, day: ago(1) }, { index: 1, day: ago(2) }] }],
    ["the book's program finished", record("measured-voice-12w", 84, Array.from({ length: 84 }, (_, i) => [i, 84 - i] as [number, number]))],
    ["a finished run singing weeks 5 and 6 again", repeating(28)],
    ["a finished run that has sung weeks 5 and 6 again", repeating(42)],
    ["a repeated fortnight's day done today", repeating(31, 0)],
    ["a repeated fortnight with a broken later list", { ...repeating(42), later: repeatedLater().slice(1) }],
    ["a repeated fortnight with a later day out of place", { ...repeating(42), later: repeatedLater().map((d, k) => (k === 5 ? { ...d, index: 3 } : d)) }],
  ];

  for (const [name, raw] of records) {
    it(`matches the card for ${name}`, () => {
      const stored = raw === null ? {} : { [PROGRAM_STORAGE_KEY]: raw };
      expect(state(stored).program).toBe(expectedTokens(raw));
      expect(state({ ...stored, [PRO_STORAGE_KEY]: { active: true } }).program).toBe(expectedTokens(raw, { isPro: true }));
      const capped = { ...stored, [PROGRESS_STORAGE_KEY]: progress(session("warmup", 330)) };
      expect(state(capped).program).toBe(expectedTokens(raw, { capped: true }));
    });
  }

  it("reads a repeated fortnight the way the card does", () => {
    const at = (raw: unknown) => state({ [PROGRAM_STORAGE_KEY]: raw, [PRO_STORAGE_KEY]: { active: true } }).program;
    expect(at(repeating(28))).toBe("todo");
    expect(at(repeating(42))).toBe("finished book");
    expect(at(repeating(31, 0))).toMatch(/^done\b/);
    // A later list the record cannot vouch for is dropped: the run carries on to day 84.
    expect(at({ ...repeating(42), later: repeatedLater().slice(1) })).toBe("todo");
  });

  it("names the finished program, whose card's height is its own", () => {
    const finished = (id: string) => {
      const n = programById(id)!.days.length;
      return record(id, n, Array.from({ length: n }, (_, i) => [i, n - i] as [number, number]));
    };
    const at = (raw: unknown) => state({ [PROGRAM_STORAGE_KEY]: raw, [PRO_STORAGE_KEY]: { active: true } }).program;
    expect(at(finished("high-notes-6w"))).toBe("finished high-notes-6w");
    expect(at(finished("foundations-2w"))).toBe("finished foundations-2w");
    expect(at(finished("recovery-week"))).toBe("finished recovery-week");
    // The CI seed's state is unchanged.
    expect(at(finished("measured-voice-12w"))).toBe("finished book");
  });

  it("covers the states the CI layout-shift run seeds", () => {
    expect(state({ [PROGRAM_STORAGE_KEY]: record("foundations-2w", 1, [[0, 1]]) }).program).toBe("todo");
    expect(state({ [PROGRAM_STORAGE_KEY]: record("mix-4w", 6, [0, 1, 2, 3, 4, 5, 6].map((i) => [i, 6 - i] as [number, number])) }).program).toBe("done rest next-locked");
  });

  it("says no program on another program's own view, where today's card does not show", () => {
    // components/programs/programs-client.tsx shows today's card on a
    // program's view only when it is the running program.
    const stored = { [PROGRAM_STORAGE_KEY]: record("foundations-2w", 1, [[0, 1]]) };
    const at = (pathname: string, search = "") => prepaintState(storageOf(stored), NOW, PREPAINT_CONFIG, { pathname, search }).program;
    expect(at("/programs")).toBe("todo");
    expect(at("/programs", "?program=foundations-2w")).toBe("todo");
    expect(at("/programs", "?program=measured-voice-12w")).toBeNull();
    expect(at("/programs", "?utm_source=book&program=measured-voice-12w")).toBeNull();
    // An unknown id lands on the list, today's card and all.
    expect(at("/programs", "?program=nope")).toBe("todo");
    // The page the deep link is served from, opened by its own path.
    expect(at("/programs/measured-voice-12w")).toBeNull();
    expect(at("/programs/foundations-2w")).toBe("todo");
    // Only /programs reads the parameter.
    expect(at("/warmups", "?program=measured-voice-12w")).toBe("todo");
    expect(prepaintState(storageOf({}), NOW, PREPAINT_CONFIG, { pathname: "/programs", search: "?program=mix-4w" }).program).toBeNull();
  });

  it("lists every program, its length, its rest days and its finished card's token", () => {
    for (const [id, [pro, length, rest, finished]] of Object.entries(PREPAINT_CONFIG.programs)) {
      const program = programById(id)!;
      expect(pro === 1).toBe(program.pro);
      expect(finished).toBe(program.chapters ? "book" : id);
      // Never one of the status tokens it sits beside.
      expect(["todo", "done", "finished", "rest", "locked", "next-locked", "waits"]).not.toContain(finished);
      expect(length).toBe(program.days.length);
      expect(rest.every((i) => isRestDay(program.days[i]))).toBe(true);
      expect(program.days.filter(isRestDay)).toHaveLength(rest.length);
    }
    expect(addDays(TODAY, 0)).toBe(TODAY);
  });
});

describe("the inline script", () => {
  /** Runs the script text as the browser would, against fake storage and a fake <html>. */
  function run(stored: Record<string, unknown> | "blocked", location = { pathname: "/", search: "" }) {
    const attrs: Record<string, string> = {};
    const window: Record<string, unknown> = {};
    const localStorage =
      stored === "blocked"
        ? { getItem: () => { throw new Error("SecurityError"); } }
        : storageOf(stored);
    class FixedDate extends Date {
      constructor(...args: ConstructorParameters<typeof Date> | []) {
        super(...((args.length ? args : [NOW.getTime()]) as ConstructorParameters<typeof Date>));
      }
    }
    runInNewContext(PREPAINT_SCRIPT, {
      localStorage,
      window,
      Date: FixedDate,
      JSON,
      Math,
      Array,
      Object,
      isFinite,
      isNaN,
      URLSearchParams,
      location,
      document: { documentElement: { setAttribute: (k: string, v: string) => (attrs[k] = v) } },
    });
    return { attrs, global: window.__singPrepaint };
  }

  it("marks <html> with the plan and the program", () => {
    const { attrs, global } = run({
      [PROGRESS_STORAGE_KEY]: progress(session("warmup", 330)),
      [PROGRAM_STORAGE_KEY]: record("foundations-2w", 1, [[0, 1]]),
    });
    expect(attrs).toEqual({ "data-sing-plan": "capped", "data-sing-program": "todo waits" });
    expect(global).toMatchObject({ plan: "capped", freeLeft: "0:00" });
  });

  it("leaves the program attribute off with no program", () => {
    expect(run({}).attrs).toEqual({ "data-sing-plan": "free" });
  });

  it("marks a saved range, and leaves it off without one", () => {
    expect(run({ [PROGRESS_STORAGE_KEY]: { ...progress(), range: { lowMidi: 45, highMidi: 65 } } }).attrs).toEqual({
      "data-sing-plan": "free",
      "data-sing-range": "saved",
    });
    expect(run({ [PROGRESS_STORAGE_KEY]: { ...progress(), range: { lowMidi: 45 } } }).attrs).toEqual({ "data-sing-plan": "free" });
  });

  it("reads the page's address, for a program's own view", () => {
    const stored = { [PROGRAM_STORAGE_KEY]: record("foundations-2w", 1, [[0, 1]]) };
    expect(run(stored, { pathname: "/programs", search: "?program=foundations-2w" }).attrs).toEqual({
      "data-sing-plan": "free",
      "data-sing-program": "todo",
    });
    expect(run(stored, { pathname: "/programs", search: "?program=measured-voice-12w" }).attrs).toEqual({
      "data-sing-plan": "free",
    });
  });

  it("swallows storage that throws, leaving the newcomer's layout", () => {
    expect(run("blocked").attrs).toEqual({ "data-sing-plan": "free" });
  });

  it("is in the root layout's head, ahead of the page", () => {
    const layout = readFileSync(new URL("../app/layout.tsx", import.meta.url), "utf8");
    expect(layout).toMatch(/<head>\s*\{[\s\S]*?\}\s*<script dangerouslySetInnerHTML=\{\{ __html: PREPAINT_SCRIPT \}\} \/>\s*<\/head>\s*<body/);
    expect(layout).toMatch(/<html[\s\S]*?suppressHydrationWarning[\s\S]*?>/);
  });
});
