import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { SUITES, annotationBody, commandArgv } from "./suite.mjs";

describe("the CI browser suites", () => {
  it("name only scripts that exist", () => {
    for (const [suite, commands] of Object.entries(SUITES)) {
      for (const command of commands) {
        expect(existsSync(command.script), `${suite}: ${command.script}`).toBe(true);
      }
    }
  });

  it("are exactly the matrix in .github/workflows/ci.yml", () => {
    const yml = readFileSync(".github/workflows/ci.yml", "utf8");
    const matrix = /suite:\s*\[([^\]]+)\]/.exec(yml);
    expect(matrix).toBeTruthy();
    expect(matrix[1].split(",").map((s) => s.trim()).sort()).toEqual(Object.keys(SUITES).sort());
  });

  // Each full-route phone pass takes about 240 s and every other run under
  // 40 s (CI run 40798206122), so two in one shard would set the PR's wall.
  it("put the two full-route layout-shift passes in different shards", () => {
    const full = (c) => c.script === "e2e/cls.mjs" && !c.args.some((a) => a.startsWith("--route="));
    const shards = Object.entries(SUITES).filter(([, commands]) => commands.some(full));
    expect(shards.map(([name, commands]) => [name, commands.filter(full).length])).toEqual([
      ["layout-shift", 1],
      ["layout-shift-returning", 1],
    ]);
  });

  // Each command's log and JSON land under its label, so two with one label
  // would overwrite each other's evidence.
  it("give every command of a suite its own label", () => {
    for (const commands of Object.values(SUITES)) {
      const labels = commands.map((c) => c.label);
      expect(new Set(labels).size).toBe(labels.length);
    }
  });

  it("pass the base URL first and the browser build only to scripts that take it", () => {
    const options = { baseUrl: "http://127.0.0.1:3100", executablePath: "/opt/chromium" };
    const [withBrowser, without] = SUITES.journeys;
    expect(commandArgv(withBrowser, options)).toEqual([
      "e2e/checkout-recovery.mjs",
      "http://127.0.0.1:3100",
      "--executable=/opt/chromium",
    ]);
    expect(commandArgv(without, options)).toEqual(["scripts/audit-share-cards.mjs", "http://127.0.0.1:3100"]);
    expect(commandArgv(withBrowser, { ...options, executablePath: null })).toEqual([
      "e2e/checkout-recovery.mjs",
      "http://127.0.0.1:3100",
    ]);
  });

  it("annotates a failure with its FAIL lines first, then the tail", () => {
    const log = ["ok 1", "FAIL: the case", "  detail 100%", "ok 2", "the end\r"].join("\n") + "\n";
    const body = annotationBody(log);
    expect(body.startsWith("FAIL: the case%0A  detail 100%25%0A")).toBe(true);
    expect(body).toContain("...%0A");
    expect(body.endsWith("the end%0D%0A")).toBe(true);
    expect(body).not.toContain("\n");
  });
});
