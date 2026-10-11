import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { TEMPLATE_SITEMAP } from "./lib/audit-fixtures.mjs";

const runFile = fileURLToPath(new URL("./run.mjs", import.meta.url));
const exec = promisify(execFile);

/** Exercise the actual CLI without depending on an installed browser. */
async function runAudit(route, failNavigation = false, failDiscovery = false) {
  const browserModule = `
    export default { chromium: { launch: async () => {
      console.log("BROWSER_LAUNCHED");
      return {
        newContext: async () => ({
          addInitScript: async () => {},
          newPage: async () => ({
            on: () => {},
            goto: async () => { ${failNavigation ? 'throw new Error("Navigation failed in audit regression");' : "return {};"} },
            close: async () => {},
          }),
          close: async () => {},
        }),
        close: async () => {},
      };
    } } };
  `;
  const hook = `
    import { registerHooks } from "node:module";
    globalThis.fetch = async () => { ${failDiscovery ? 'throw new Error("Sitemap unavailable in audit regression");' : `return { ok: true, text: async () => ${JSON.stringify(TEMPLATE_SITEMAP)} };`} };
    const browserUrl = ${JSON.stringify(`data:text/javascript,${encodeURIComponent(browserModule)}`)};
    registerHooks({ resolve(specifier, context, next) {
      return specifier === "playwright" ? { url: browserUrl, shortCircuit: true } : next(specifier, context);
    } });
  `;
  try {
    const result = await exec(process.execPath, [
      "--import", `data:text/javascript,${encodeURIComponent(hook)}`,
      runFile, "http://127.0.0.1:1", "--only=semantics", "--viewport=mobile-375", `--route=${route}`,
    ], { timeout: 10_000 });
    return { code: 0, ...result };
  } catch (error) {
    if (typeof error.code !== "number") throw error;
    return { code: error.code, stdout: error.stdout, stderr: error.stderr };
  }
}

describe("UI audit CLI gate", () => {
  it("fails before browser launch when generated-template discovery fails", async () => {
    const result = await runAudit("home", false, true);
    expect(result.code).toBe(2);
    expect(result.stderr).toContain("Sitemap unavailable in audit regression");
    expect(result.stdout).not.toContain("BROWSER_LAUNCHED");
  });

  it("fails when a route cannot be audited even if there are zero findings", async () => {
    const result = await runAudit("home", true);
    expect(result.stdout).toContain("Navigation failed in audit regression");
    expect(result.stdout).toContain("0 distinct findings");
    expect(result.code).toBe(2);
  });

  it.each(["not-a-route", "home,not-a-route"])("rejects unknown route filter %s before launching a browser", async (route) => {
    const result = await runAudit(route);
    expect(result.code).toBe(2);
    expect(result.stderr).toContain("unknown route filter: not-a-route");
    expect(result.stdout).not.toContain("BROWSER_LAUNCHED");
  });
});
