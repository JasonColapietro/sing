import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { FreshStart } from "./progress-client";

/**
 * A cleared browser renders /progress empty, and the backup card told its
 * singer to restore there. Import JSON sits at the foot of an eight-screen
 * page, so the empty state points to it, under the start buttons.
 */
describe("the empty progress page", () => {
  const html = renderToStaticMarkup(<FreshStart />);

  it("keeps the three ways to start first", () => {
    expect(html).toContain("Nothing logged yet");
    const start = html.indexOf("Open the studio");
    expect(start).toBeGreaterThan(-1);
    expect(html.indexOf("Find your range")).toBeGreaterThan(start);
    expect(html.indexOf("Try a warmup")).toBeGreaterThan(start);
  });

  it("points a singer with a backup file to the import, below the start buttons", () => {
    expect(html).toMatch(/<a href="#your-data"[^>]*>Import it under Your data<\/a>/);
    expect(html.indexOf("#your-data")).toBeGreaterThan(html.indexOf("Try a warmup"));
  });

  it("links to a section that exists", () => {
    const src = readFileSync(fileURLToPath(new URL("./progress-client.tsx", import.meta.url)), "utf8");
    expect(src).toMatch(/<section id="your-data"[^>]*aria-label="Data controls"/);
  });
});
