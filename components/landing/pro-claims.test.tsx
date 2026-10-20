import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

// The homepage reads server-only modules; under vitest there is no
// react-server condition to resolve the package's empty export.
vi.mock("server-only", () => ({}));

import Home from "@/app/page";
import { StartingPaths } from "./paths";

/**
 * The free plan already charts the average score by week ("Score trend — by
 * week" on /progress). Pro's accuracy chart is one tally per note with no
 * time axis (components/progress/pro-charts.tsx), and its range chart plots
 * tests about six weeks apart. Round 11 took "accuracy as a trend" out of
 * /studio, /songs, the warmup summaries, /pro and llms.txt; restoring the
 * original homepage brought it back in the Pro teaser and the second path.
 *
 * The coach is the same: the free plan is built the same way and shows its
 * first two steps, usually led by the weak-note siren (lib/pro.ts PRO_PERKS
 * "coach"), so what Pro adds is the rest of the plan, not planning around
 * weak notes.
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

  it("sells the rest of the coach's plan, not the plan the free card already shows", () => {
    expect(home).toContain("The whole daily practice plan, not just the first two steps the free plan shows");
  });

  it("says the same in the 'If you already sing' path", () => {
    const paths = read(renderToStaticMarkup(<StartingPaths />));
    expect(paths).toContain(
      "Pro adds a per-note accuracy chart, charts your range tests over months, and opens the coach's whole daily plan, not just its first two steps.",
    );
    expect(paths).not.toMatch(OVERCLAIM);
  });
});
