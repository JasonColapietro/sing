import { spawnSync } from "node:child_process";
import { expect, it } from "vitest";

// Published prose about real people: a batch edit that adds a hedge, a health
// claim or a biography fails `npm test` instead of shipping.
it("the technique paragraphs in data/singers pass scripts/audit-technique.mjs", () => {
  const run = spawnSync(process.execPath, ["scripts/audit-technique.mjs", "data/singers"], { encoding: "utf8" });
  expect(run.status, run.stdout + run.stderr).toBe(0);
});
