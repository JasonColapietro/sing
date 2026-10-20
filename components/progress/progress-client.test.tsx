import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";

const hydration = vi.hoisted(() => ({ done: false }));
vi.mock("@/components/prepaint", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/components/prepaint")>()),
  useHydrated: () => hydration.done,
}));

import { ProgressClient } from "./progress-client";

const SOURCE = readFileSync(fileURLToPath(new URL("./progress-client.tsx", import.meta.url)), "utf8");

afterEach(() => {
  hydration.done = false;
});

/**
 * Back to /progress used to land thousands of pixels below where the singer
 * left (the coach card's 1,507px came back as 7,146px on a phone). The
 * browser restored the position against the viewport-tall skeleton, and
 * Chrome's scroll anchoring then carried it down by the dashboard's extra
 * height when the dashboard swapped in. Only hydration needs the skeleton.
 */
describe("the progress dashboard's first render", () => {
  it("is the skeleton while the server HTML is hydrated", () => {
    const html = renderToStaticMarkup(<ProgressClient />);
    expect(html).toContain("Loading your progress…");
    expect(html).not.toContain('id="your-data"');
  });

  it("is the dashboard itself on a client-side arrival, so Back has the real page to restore against", () => {
    hydration.done = true;
    const html = renderToStaticMarkup(<ProgressClient />);
    expect(html).not.toContain("Loading your progress…");
    // The target of /progress#your-data, and of the sign-in page's link, is
    // there on the first pass for the router's own scroll to find.
    expect(html).toContain('id="your-data"');
  });

  it("scrolls a fresh load's #fragment into view once the dashboard is in, and only a fresh load", () => {
    // The server HTML has no #your-data, so the browser's own jump stays at
    // the top; a reload or Back keeps the position the browser restores.
    expect(SOURCE).toMatch(/useState\(\(\) => !mounted\)/);
    expect(SOURCE).toMatch(/entry\.type !== "navigate"/);
    expect(SOURCE).toMatch(/document\.getElementById\(id\)\?\.scrollIntoView\(\)/);
  });
});

describe("erasing browser progress", () => {
  it("moves focus to the erased note (or the field) instead of dropping it on <body>", () => {
    // The erase clears the confirmation, which disables the focused button.
    expect(SOURCE).toMatch(/\(erasedNoteRef\.current \?\? confirmRef\.current\)\?\.focus\(\)/);
    expect(SOURCE).toMatch(/ref=\{erasedNoteRef\}\s+tabIndex=\{-1\}/);
    expect(SOURCE).toMatch(/ref=\{confirmRef\}\s+id="erase-confirm"/);
  });
});
