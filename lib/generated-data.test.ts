import { spawnSync } from "node:child_process";
import { describe, expect, it } from "vitest";

/**
 * lib/*-data.ts are committed compiler outputs. Each compiler's `--check`
 * exits 1, naming the first differing line, when its sources moved without
 * it being re-run.
 */
describe("the generated data", () => {
  it.each(["compile-singers.mjs", "compile-atlas.mjs", "compile-book.mjs", "compile-lessons.mjs"])(
    "%s --check finds its output in sync with its sources",
    (script) => {
      const run = spawnSync(process.execPath, [`scripts/${script}`, "--check"], { encoding: "utf8" });
      expect(run.status, run.stdout + run.stderr).toBe(0);
    },
  );
});
