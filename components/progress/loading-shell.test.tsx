/**
 * Loading-shell reservation guard.
 *
 * The dashboard on /progress is client-only, so the server ships a shell and
 * hydration swaps in something several times taller. Measured on production on
 * 2026-08-21, that swap was the page's entire CLS — 0.4011, against Google's
 * 0.25 "poor" threshold — because it threw the room rail and the footer out of
 * the viewport in one frame. What fixes it is the shell reserving a viewport,
 * so everything below it starts under the fold and the swap moves nothing
 * anyone can see.
 *
 * That reservation is one class on one otherwise-empty wrapper, which is
 * exactly the sort of thing a later tidy-up deletes as decoration. This is the
 * guard: it asserts the reservation survives, in the server pass, which is the
 * pass that paints before hydration.
 */
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { DashboardSkeleton } from "./progress-client";

describe("progress loading shell", () => {
  const html = renderToStaticMarkup(<DashboardSkeleton />);

  it("reserves a full viewport so nothing below it paints inside the fold", () => {
    expect(html).toContain("min-h-[100dvh]");
  });

  it("reserves in viewport units, not a pixel height copied off one screen", () => {
    // A px reservation would be right on the screen it was measured on and
    // wrong everywhere else, and would rot as the dashboard changes height.
    expect(html).not.toMatch(/min-h-\[\d+px\]/);
  });

  it("still tells a screen reader the dashboard is loading", () => {
    // The visible copy became a skeleton, so the announcement has to be
    // carried deliberately rather than read off the placeholder blocks.
    expect(html).toContain("Loading your progress…");
    expect(html).toContain('role="status"');
  });
});
