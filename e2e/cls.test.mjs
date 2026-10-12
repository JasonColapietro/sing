import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";
import { runInNewContext } from "node:vm";
import { describe, expect, it } from "vitest";
import { shouldShowWeekInReview, weekInReview } from "@/lib/weekly-report";
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
            goto: async () => { ${mode === "error" ? 'throw new Error("Navigation failed in CLS regression");' : "return {};"} },
            waitForTimeout: async () => {},
            evaluate: async (fn, arg) => {
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
});
