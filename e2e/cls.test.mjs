import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";
import { runInNewContext } from "node:vm";
import { describe, expect, it } from "vitest";
import { shouldShowWeekInReview, weekInReview } from "@/lib/weekly-report";
import { isCapped } from "@/lib/free-cap";
import { localDay } from "@/lib/progress";
import { sanitizeProgress } from "@/lib/progress-shape";
import { dayNeedsPro, isRestDay, programById, programReadings, programToday, reconcileProgress, reviveProgress } from "@/lib/programs";
import { prepaintState } from "@/lib/prepaint";
import { PREPAINT_CONFIG } from "@/lib/prepaint-config";
import { TEMPLATE_SITEMAP } from "./lib/audit-fixtures.mjs";

const runFile = fileURLToPath(new URL("./cls.mjs", import.meta.url));
const exec = promisify(execFile);

/** Run the real measurement/reporting CLI with controlled browser readings. */
async function runCls(mode, viewport = "mobile-375", extra = []) {
  const browserModule = `
    export default { chromium: { launch: async () => {
      console.log("BROWSER_LAUNCHED");
      return {
        newContext: async () => ({
          addInitScript: async (script) => {
            if (typeof script === "string" && script.includes("cls-returning-seed")) {
              console.log("SEEDED_RETURNING");
              console.log("SEED:" + Buffer.from(script).toString("base64"));
            }
          },
          newPage: async () => {
            let inserted = false;
            return {
            goto: async (url) => { console.log("GOTO " + new URL(url).pathname + new URL(url).search); ${mode === "error" ? 'throw new Error("Navigation failed in CLS regression");' : "return {};"} },
            waitForTimeout: async () => {},
            evaluate: async (fn, arg) => {
              // The check that a --state seed showed on the page.
              if (fn.toString().includes("querySelector")) return ${mode !== "unproven"};
              if (fn.toString().includes("...window.__cls")) return { value: ${["high", "stale"].includes(mode) ? "0.2" : mode === "invalid" ? "NaN" : "0"}, shifts: [] };
              if (fn.toString().includes("createElement")) inserted = true;
              if (fn.toString().includes("window.__cls.value")) {
                const baseline = ${["high", "stale"].includes(mode) ? "0.2" : "0"};
                globalThis.window = { __cls: { value: baseline + (inserted && ${!["dead", "stale"].includes(mode)} ? 0.1 : 0) } };
                return fn(arg);
              }
            },
            close: async () => {},
          }; },
          close: async () => {},
        }),
        close: async () => {},
      };
    } } };
  `;
  const hook = `
    import { registerHooks } from "node:module";
    globalThis.fetch = async () => { ${mode === "sitemap-error" ? 'throw new Error("Sitemap unavailable in CLS regression");' : `return { ok: true, text: async () => ${JSON.stringify(TEMPLATE_SITEMAP)} };`} };
    const browserUrl = ${JSON.stringify(`data:text/javascript,${encodeURIComponent(browserModule)}`)};
    registerHooks({ resolve(specifier, context, next) {
      return specifier === "playwright" ? { url: browserUrl, shortCircuit: true } : next(specifier, context);
    } });
  `;
  try {
    const result = await exec(process.execPath, [
      "--import", `data:text/javascript,${encodeURIComponent(hook)}`,
      runFile, "http://127.0.0.1:1", `--viewport=${viewport}`, ...extra,
    ], { timeout: 10_000 });
    return { code: 0, ...result };
  } catch (error) {
    if (typeof error.code !== "number") throw error;
    return { code: error.code, stdout: error.stdout, stderr: error.stderr };
  }
}

describe("CLS measurement CLI gate", () => {
  it("fails before browser launch when generated-template discovery fails", async () => {
    const result = await runCls("sitemap-error");
    expect(result.code).toBe(2);
    expect(result.stderr).toContain("Sitemap unavailable in CLS regression");
    expect(result.stdout).not.toContain("BROWSER_LAUNCHED");
  });

  it("fails rather than certifying routes that never loaded", async () => {
    const result = await runCls("error");
    expect(result.stdout).toContain("Navigation failed in CLS regression");
    expect(result.code).toBe(2);
  });

  it("fails when zero CLS comes from a dead observer", async () => {
    const result = await runCls("dead");
    expect(result.stdout).toContain("observer never saw the synthetic shift");
    expect(result.code).toBe(2);
  });

  it("does not let an earlier organic shift hide a dead synthetic probe", async () => {
    const result = await runCls("stale");
    expect(result.code).toBe(2);
    expect(result.stdout).toContain("observer never saw the synthetic shift");
  });

  it("rejects non-finite measurements instead of treating them as below threshold", async () => {
    expect((await runCls("invalid")).code).toBe(2);
  });

  it("rejects an unknown viewport before launching a browser", async () => {
    const result = await runCls("good", "not-a-viewport");
    expect(result.code).toBe(2);
    expect(result.stderr).toContain("no viewport matched");
    expect(result.stdout).not.toContain("BROWSER_LAUNCHED");
  });

  it("passes a measured zero when the observer proves it can see shifts", async () => {
    expect((await runCls("good")).code).toBe(0);
  });

  it("keeps a real above-threshold score distinct from a rig failure", async () => {
    expect((await runCls("high")).code).toBe(1);
  });

  it("measures as a returning singer only when asked", async () => {
    // The prerender is the newcomer's layout, so a page that depends on
    // progress shifts at hydration only for a singer with a record.
    const returning = await runCls("good", "mobile-375", ["--returning"]);
    expect(returning.code).toBe(0);
    expect(returning.stdout).toContain("SEEDED_RETURNING");
    expect(returning.stdout).toContain("as a returning singer");
    const fresh = await runCls("good");
    expect(fresh.stdout).not.toContain("SEEDED_RETURNING");
  });

  it("keeps the weekly report card out of a returning run, Mondays included", async () => {
    // Yesterday is last week on a Monday, and the seed runs after a clear on
    // every load, so without a seen key the report would open over every page.
    const { stdout } = await runCls("good", "mobile-375", ["--returning"]);
    const seed = Buffer.from(/^SEED:(.+)$/m.exec(stdout)[1], "base64").toString();
    // The clear and the seed share one init script, clear first, since
    // Playwright does not order separate init scripts.
    expect(seed.indexOf("localStorage.clear()")).toBeGreaterThanOrEqual(0);
    expect(seed.indexOf("localStorage.clear()")).toBeLessThan(seed.indexOf("cls-returning-seed"));
    for (const now of [new Date(2026, 9, 12, 9), new Date(2026, 9, 14, 21), new Date(2026, 9, 18, 23, 30)]) {
      const store = new Map([["suede-sing:progress:v1", "stale"]]);
      class FixedDate extends Date {
        constructor(...args) {
          super(...(args.length ? args : [now.getTime()]));
        }
      }
      runInNewContext(seed, {
        Date: FixedDate,
        JSON,
        String,
        localStorage: { clear: () => store.clear(), setItem: (k, v) => store.set(k, String(v)) },
      });
      const progress = JSON.parse(store.get("suede-sing:progress:v1"));
      expect(progress.sessions).toHaveLength(1);
      const report = weekInReview(progress.sessions, now);
      expect(shouldShowWeekInReview(report, store.get("suede-sing:weekly-report-seen:v1") ?? null)).toBe(false);
    }
  });

  it("restricts a run to the routes named, and refuses a name it does not know", async () => {
    const some = await runCls("good", "mobile-375", ["--route=warmups,programs"]);
    expect(some.code).toBe(0);
    expect([...some.stdout.matchAll(/^GOTO (.+)$/gm)].map((m) => m[1])).toEqual(["/warmups", "/programs"]);
    const unknown = await runCls("good", "mobile-375", ["--route=warmups,nowhere"]);
    expect(unknown.code).toBe(2);
    expect(unknown.stderr).toContain("unknown route filter: nowhere");
    expect(unknown.stdout).not.toContain("BROWSER_LAUNCHED");
  });

  it("measures a program's own view, the deep link the list used to stand in for", async () => {
    const all = await runCls("good");
    const gotos = [...all.stdout.matchAll(/^GOTO (.+)$/gm)].map((m) => m[1]);
    expect(gotos).toContain("/programs");
    expect(gotos).toContain("/programs?program=measured-voice-12w");
    expect(gotos).toContain("/programs?program=foundations-2w");
    const some = await runCls("good", "mobile-375", ["--state=program", "--route=program-detail,program-foundations"]);
    expect(some.code).toBe(0);
    expect([...some.stdout.matchAll(/^GOTO (.+)$/gm)].map((m) => m[1])).toEqual([
      "/programs?program=measured-voice-12w",
      "/programs?program=foundations-2w",
    ]);
  });

  it("measures the state-only deep links only when a route names them", async () => {
    // The other programs' own views and the saved-range pages belong to the
    // states that need them; a plain run's page count stays as it was.
    const all = await runCls("good");
    const gotos = [...all.stdout.matchAll(/^GOTO (.+)$/gm)].map((m) => m[1]);
    // (/singers/adele is also the fixture sitemap's singer-detail template.)
    for (const path of ["/programs?program=high-notes-6w", "/singers/celine-dion", "/can-you-sing/someone-like-you"]) {
      expect(gotos).not.toContain(path);
    }
    const some = await runCls("good", "mobile-375", ["--state=saved-range", "--route=singer-adele,singer-celine-dion,song-someone-like-you"]);
    expect(some.code).toBe(0);
    expect([...some.stdout.matchAll(/^GOTO (.+)$/gm)].map((m) => m[1])).toEqual([
      "/singers/adele",
      "/singers/celine-dion",
      "/can-you-sing/someone-like-you",
    ]);
    const finished = await runCls("good", "mobile-375", ["--state=finished-high-notes", "--route=programs,program-high-notes"]);
    expect(finished.code).toBe(0);
    expect([...finished.stdout.matchAll(/^GOTO (.+)$/gm)].map((m) => m[1])).toEqual(["/programs", "/programs?program=high-notes-6w"]);
  });

  it("refuses an unknown state before launching a browser", async () => {
    const result = await runCls("good", "mobile-375", ["--state=nope"]);
    expect(result.code).toBe(2);
    expect(result.stderr).toContain("unknown --state=nope");
    expect(result.stdout).not.toContain("BROWSER_LAUNCHED");
  });

  it("fails rather than passing a state its seed never produced on the page", async () => {
    const result = await runCls("unproven", "mobile-375", ["--state=capped", "--route=warmups"]);
    expect(result.code).toBe(2);
    expect(result.stdout).toContain("the capped seed did not take");
  });

  /**
   * Each state's seed, run as the browser runs it at three local times
   * (a Monday morning, a Wednesday night, a Sunday just before midnight),
   * read back through the app's own rules: it is the state it names, the
   * weekly report stays shut, and the pre-paint script (lib/prepaint.ts)
   * reads the same state, which is the thing CI is measuring.
   */
  const STATE_EXPECTATIONS = {
    capped: { blocks: ["capped"], capped: true, program: null, prepaint: { plan: "capped", program: null } },
    program: { blocks: ["program"], capped: false, program: { id: "foundations-2w", status: "todo", index: 1 }, prepaint: { plan: "free", program: "todo" } },
    "program-capped": { blocks: ["program", "capped"], capped: true, program: { id: "foundations-2w", status: "todo", index: 1 }, prepaint: { plan: "capped", program: "todo waits" } },
    "rest-day": { blocks: ["rest-day"], capped: false, program: { id: "mix-4w", status: "done-today", index: 6 }, prepaint: { plan: "free", program: "done rest next-locked" } },
    finished: { blocks: ["finished"], capped: false, program: { id: "measured-voice-12w", status: "finished", index: 83, readings: [0, 10, 41, 59, 66, 77] }, prepaint: { plan: "free", program: "finished book" } },
    // Each finished program's card is sized by its own token (app/globals.css
    // --finished-slot), so each has a seed with every check-in read.
    "finished-high-notes": { blocks: ["finished-high-notes"], capped: false, program: { id: "high-notes-6w", status: "finished", index: 41, readings: [0, 13, 27, 41] }, prepaint: { plan: "free", program: "finished high-notes-6w" } },
    "finished-mix": { blocks: ["finished-mix"], capped: false, program: { id: "mix-4w", status: "finished", index: 27, readings: [0, 27] }, prepaint: { plan: "free", program: "finished mix-4w" } },
    "finished-foundations": { blocks: ["finished-foundations"], capped: false, program: { id: "foundations-2w", status: "finished", index: 13, readings: [0, 13] }, prepaint: { plan: "free", program: "finished foundations-2w" } },
    "finished-recovery": { blocks: ["finished-recovery"], capped: false, program: { id: "recovery-week", status: "finished", index: 6, readings: [] }, prepaint: { plan: "free", program: "finished recovery-week" } },
    "finished-vibrato": { blocks: ["finished-vibrato"], capped: false, program: { id: "vibrato-3w", status: "finished", index: 20, readings: [] }, prepaint: { plan: "free", program: "finished vibrato-3w" } },
    // A2–F4, the range the singer and song pages compare with once it hydrates.
    "saved-range": { blocks: ["saved-range"], capped: false, program: null, range: { lowMidi: 45, highMidi: 65 }, prepaint: { plan: "free", program: null } },
  };

  for (const [name, expected] of Object.entries(STATE_EXPECTATIONS)) {
    it(`seeds the ${name} state as a returning singer`, async () => {
      const { stdout, code } = await runCls("good", "mobile-375", [`--state=${name}`, "--route=warmups"]);
      expect(code).toBe(0);
      expect(stdout).toContain(`as a returning singer, state ${name}`);
      const seed = Buffer.from(/^SEED:(.+)$/m.exec(stdout)[1], "base64").toString();
      expect(seed.indexOf("localStorage.clear()")).toBeLessThan(seed.indexOf("cls-returning-seed"));
      for (const block of expected.blocks) expect(seed).toContain(`cls-state:${block}`);
      for (const now of [new Date(2026, 9, 12, 9), new Date(2026, 9, 14, 21), new Date(2026, 9, 18, 23, 30)]) {
        const store = new Map();
        class FixedDate extends Date {
          constructor(...args) {
            super(...(args.length ? args : [now.getTime()]));
          }
        }
        runInNewContext(seed, {
          Date: FixedDate,
          JSON,
          String,
          localStorage: { clear: () => store.clear(), setItem: (k, v) => store.set(k, String(v)), getItem: (k) => store.get(k) ?? null },
        });
        const today = localDay(now);
        const progress = sanitizeProgress(JSON.parse(store.get("suede-sing:progress:v1")));
        expect(progress.sessions.length).toBeGreaterThan(0);
        expect(isCapped(progress, false, today)).toBe(expected.capped);
        expect(shouldShowWeekInReview(weekInReview(progress.sessions, now), store.get("suede-sing:weekly-report-seen:v1") ?? null)).toBe(false);
        if (expected.range) expect(progress.range).toEqual(expected.range);

        const stored = store.has("suede-sing:program:v1") ? reviveProgress(JSON.parse(store.get("suede-sing:program:v1"))) : null;
        if (expected.program === null) {
          expect(stored).toBeNull();
        } else {
          const program = programById(stored?.programId);
          expect(program?.id).toBe(expected.program.id);
          const view = programToday(program, reconcileProgress(program, stored, progress.sessions, today), today);
          expect(view).toMatchObject({ status: expected.program.status, index: expected.program.index });
          if (name === "rest-day") {
            expect(isRestDay(program.days[view.index])).toBe(true);
            expect(dayNeedsPro(program, view.index + 1)).toBe(true);
          }
          if (expected.program.readings) {
            // Every check-in day keeps its readings, so the card shows all its
            // rows with nothing "not logged" (a day without a range test has
            // no range key; one without a sustain test has no seconds key).
            const readings = programReadings(program, stored, progress.sessions, progress.rangeHistory);
            expect(readings.map((r) => r.index)).toEqual(expected.program.readings);
            for (const r of readings) {
              if ("range" in r) expect(r.range, `day ${r.index + 1}`).not.toBeNull();
              if ("sustainSec" in r) expect(r.sustainSec, `day ${r.index + 1}`).not.toBeNull();
              expect("range" in r || "sustainSec" in r, `day ${r.index + 1}`).toBe(true);
            }
          }
        }

        const prepaint = prepaintState({ getItem: (k) => store.get(k) ?? null }, now, PREPAINT_CONFIG);
        expect({ plan: prepaint.plan, program: prepaint.program }).toEqual(expected.prepaint);
        // Every seed is a returning singer's, with a saved range.
        expect(prepaint.range).toBe(true);
      }
    });
  }
});
