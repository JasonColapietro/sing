import { readFileSync } from "node:fs";
import { join } from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { DEFAULT_PROGRESS, type VocalRange } from "@/lib/progress-shape";

const state = vi.hoisted(() => ({ range: {} as VocalRange }));
vi.mock("@/lib/progress", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/progress")>()),
  useProgress: () => ({ ...DEFAULT_PROGRESS, range: state.range }),
}));
vi.mock("@/lib/pro", () => ({
  useIsPro: () => false,
  useProReady: () => true,
}));

import { singerCompareHref } from "@/components/range/result-view";
import { SingerRangeAction, type SingerRangeActionKind } from "./singer-actions";

const adele = { slug: "adele", name: "Adele", lowMidi: 53, highMidi: 77 };
const action = (kind: SingerRangeActionKind = "test") =>
  renderToStaticMarkup(<SingerRangeAction s={adele} kind={kind} />);

/** The button's class list, where its reserved width lives. */
const classOf = (html: string) => /class="([^"]*)"/.exec(html)?.[1].split(" ") ?? [];

/**
 * A singer back from a range test started on a singer page met "Test my
 * range →" again at the top of the page, with the comparison a screen and a
 * half down. Round 8 fixed the same return path for /can-you-sing (#fit).
 */
describe("the singer page's way back from the range test", () => {
  beforeEach(() => {
    state.range = {};
  });

  it("starts the test, told which singer to come back to, until a range is saved", () => {
    for (const range of [{}, { lowMidi: 50 }, { highMidi: 72 }]) {
      state.range = range;
      const html = action();
      expect(html).toContain('href="/range?compare=adele#start"');
      expect(html).toContain("Test my range →");
    }
  });

  it("points a singer with a saved range at the comparison, not back into the test", () => {
    state.range = { lowMidi: 45, highMidi: 65 };
    const html = action();
    expect(html).toContain('href="#you-vs"');
    expect(html).toContain("See the overlap ↓");
    expect(html).not.toContain("/range?");
    state.range = { lowMidi: 45, highMidi: 65 };
    expect(action("compare")).toContain("See how your range compares ↓");
  });

  it("holds both labels of a pair at one width, so the swap cannot move the page", () => {
    // The saved-range label replaces the server's after hydration, beside
    // "← All singers". "See how your range compares ↓" beside a "Test my
    // range →" server button wrapped that row on every phone width and
    // shifted the page 52px for every returning singer. Each pair shares a
    // min-width wide enough for both of its labels.
    for (const kind of ["test", "compare"] as const) {
      state.range = {};
      const before = classOf(action(kind)).filter((c) => c.startsWith("min-w-"));
      state.range = { lowMidi: 45, highMidi: 65 };
      const after = classOf(action(kind)).filter((c) => c.startsWith("min-w-"));
      expect(before, kind).toHaveLength(1);
      expect(after, kind).toEqual(before);
    }
    state.range = {};
    expect(action("compare")).toContain("Compare my range — free test →");
    expect(action("test")).toContain("Test my range →");
  });

  it("lands the range result's singer links on the comparison", () => {
    expect(singerCompareHref("adele")).toBe("/singers/adele#you-vs");
    // The fragment needs its target: renaming the wrapper would quietly drop
    // the singer back on the H1.
    const singerPage = readFileSync(
      join(__dirname, "../../app/singers/[slug]/page.tsx"),
      "utf8",
    );
    expect(singerPage).toMatch(/<div id="you-vs"[^>]*>\s*<CompareWithMe/);
    const result = readFileSync(join(__dirname, "../range/result-view.tsx"), "utf8");
    expect(result).not.toMatch(/href=\{`\/singers\/\$\{/);
  });
});
