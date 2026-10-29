import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/** Every .tsx under a lane folder, tests excluded. */
function files(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return files(path);
    return path.endsWith(".tsx") && !path.includes(".test.") ? [path] : [];
  });
}

describe("Tailwind arbitrary values", () => {
  it("contain no spaces, which split one class into several invalid ones", () => {
    const bad: string[] = [];
    for (const dir of ["components/tools", "components/studio", "components/range", "components/songs", "components/recorder", "components/progress", "components/programs", "components/analyze"]) {
      for (const file of files(dir)) {
        const text = readFileSync(file, "utf8");
        for (const m of text.matchAll(/[a-z]-\[[^\]"`\s]*\s[^\]"`]*\]/g)) bad.push(`${file}: ${m[0]}`);
      }
    }
    expect(bad).toEqual([]);
  });
});
