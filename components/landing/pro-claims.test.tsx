import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

// The homepage reads server-only modules; under vitest there is no
// react-server condition to resolve the package's empty export.
vi.mock("server-only", () => ({}));

import Home from "@/app/page";
import { StartingPaths } from "./paths";

/**
 * Pro's accuracy chart is one tally per note with no time axis, only the
 * range is charted over time, and the free coach shows the first two steps
 * of the same plan: the copy sells the rest of the plan as a benefit, never
 * the gating rule and never a trend the free plan already draws.
 */
const OVERCLAIM = /accuracy trends?|accuracy over time|week over week|range growth|(?:suggests practice|rebuilds itself) around your weak notes/i;

/** Markup with React's escapes undone, to match copy as a singer reads it. */
const read = (html: string) => html.replace(/&#x27;/g, "'").replace(/&quot;/g, '"').replace(/&amp;/g, "&");

describe("the homepage sells Pro for what Pro adds", () => {
  const home = read(renderToStaticMarkup(<Home />));

  it("names the per-note chart and the range over months, in /pro's words", () => {
    expect(home).toContain("A per-note accuracy chart, and your range charted over months");
    expect(home).not.toMatch(OVERCLAIM);
  });

  it("lists each teaser perk once, leading with no daily limit, and prints the price once in the body", () => {
    const teaser = home.slice(home.indexOf("Know what to sing tomorrow"), home.indexOf("See everything Pro adds"));
    expect(teaser).toContain("No daily limit on guided practice");
    expect(teaser.indexOf("No daily limit")).toBeLessThan(teaser.indexOf("full daily plan"));
    for (const perk of ["daily limit", "daily plan", "per-note accuracy", "Pitch analysis", "Both books"]) {
      expect(teaser.split(perk).length - 1).toBe(1);
    }
    expect(home.split("$79").length - 1).toBe(1);
  });

  it("sells the coach's plan as a benefit, and keeps the gating rule to the /pro table", () => {
    expect(home).toContain("The coach&#x27;s full daily plan: every step, built from your own scores.".replace("&#x27;", "'"));
    expect(home).not.toMatch(/first two steps/i);
  });

  it("says the same in the 'If you already sing' path", () => {
    const paths = read(renderToStaticMarkup(<StartingPaths />));
    expect(paths).toContain(
      "Then let Pro keep score: a per-note accuracy chart, your range tests charted over months, and every step of the coach's daily plan.",
    );
    expect(paths).not.toMatch(/first two steps/i);
    expect(paths).not.toMatch(OVERCLAIM);
  });
});
