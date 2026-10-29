import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

const pro = vi.hoisted(() => ({ active: false }));
const cloud = vi.hoisted(() => ({ paused: false }));

// FreeOnly renders nothing until the entitlement cache has been read, which
// never happens under renderToStaticMarkup; these stand in for a browser
// whose cache says free (or, for the last case, Pro).
vi.mock("@/lib/pro", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/pro")>()),
  useIsPro: () => pro.active,
  useProReady: () => true,
}));

// An erase on this browser pauses cloud sync until the singer resumes it.
vi.mock("@/lib/progress-cloud", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/progress-cloud")>()),
  useProgressCloudState: () => ({
    paused: cloud.paused,
    generation: "initial",
    resetGeneration: "initial",
  }),
}));

import { DataControls, FreshStart } from "./progress-client";

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

  it("fills only one start: the studio, or nothing when a program's card leads", () => {
    const studio = (h: string) => h.match(/<a[^>]*href="\/studio"[^>]*>/)?.[0] ?? "";
    expect(studio(html)).toContain("bg-rec");
    const running = renderToStaticMarkup(<FreshStart programRunning />);
    expect(running).toContain("Open the studio");
    expect(studio(running)).not.toContain("bg-rec");
    expect(running).not.toContain("bg-rec");
  });

  it("puts a running program's card ahead of the empty state on a fresh record", () => {
    const src = readFileSync(fileURLToPath(new URL("./progress-client.tsx", import.meta.url)), "utf8");
    const card = src.indexOf("{isFresh && activeProgram && !programPaywalled && <ProgramEntryCard");
    const fresh = src.indexOf("{isFresh && <FreshStart programRunning=");
    expect(card).toBeGreaterThan(-1);
    expect(fresh).toBeGreaterThan(card);
    expect(src).toContain("{!isFresh && activeProgram && !programPaywalled && <ProgramEntryCard");
  });

  it("points a singer with a backup file to the import, below the start buttons", () => {
    expect(html).toMatch(/<a href="#your-data"[^>]*>Import it under Your data<\/a>/);
    expect(html.indexOf("#your-data")).toBeGreaterThan(html.indexOf("Try a warmup"));
  });

  it("links to a section that exists", () => {
    const src = readFileSync(fileURLToPath(new URL("./progress-client.tsx", import.meta.url)), "utf8");
    expect(src).toMatch(/<section id="your-data"[^>]*aria-label="Data controls"/);
  });

  // Clearing a browser takes Pro with it, so a Pro owner whose record is in
  // the cloud lands here reading as free. Every Pro link on the page sold
  // Pro again at /pro#buy; restoring the key is what brings the record back.
  it("offers a Pro owner on a cleared browser the key unlock, after the import pointer", () => {
    expect(html).toMatch(/<a[^>]*href="\/pro#restore"[^>]*>Unlock it in this browser<\/a>/);
    expect(html.indexOf("/pro#restore")).toBeGreaterThan(html.indexOf("#your-data"));
    expect(html).toContain("your synced sessions, streak and range come back here");
  });
});

describe("the backup card for a browser that reads as free", () => {
  it("puts the way back to Pro next to the nudge that sells it", () => {
    pro.active = false;
    const html = renderToStaticMarkup(<DataControls />);
    const nudge = html.indexOf('href="/pro#buy"');
    const restore = html.search(/<a[^>]*href="\/pro#restore"[^>]*>Unlock it in this browser<\/a>/);
    expect(nudge).toBeGreaterThan(-1);
    expect(restore).toBeGreaterThan(nudge);
    expect(html).toContain("your synced record merges into this one");
  });

  it("shows neither line to Pro", () => {
    pro.active = true;
    try {
      expect(renderToStaticMarkup(<FreshStart />)).not.toContain("/pro#restore");
      expect(renderToStaticMarkup(<DataControls />)).not.toContain("/pro#restore");
    } finally {
      pro.active = false;
    }
  });

  it("does not promise the record comes back while sync is paused here", () => {
    // After an erase on this browser, auto-sync merges nothing until the
    // singer presses Resume (lib/sync.ts captureProgressCloudGeneration), so
    // "comes back here" and "merges into this one" would not be true.
    cloud.paused = true;
    try {
      const fresh = renderToStaticMarkup(<FreshStart />);
      expect(fresh).toContain("Import it under Your data");
      expect(fresh).not.toContain("/pro#restore");
      expect(renderToStaticMarkup(<DataControls />)).not.toContain("/pro#restore");
    } finally {
      cloud.paused = false;
    }
  });
});
