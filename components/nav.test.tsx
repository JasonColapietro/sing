import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";

const route = vi.hoisted(() => ({ pathname: "/learn" }));
vi.mock("next/navigation", () => ({ usePathname: () => route.pathname }));
vi.mock("@/lib/use-account-auth", () => ({
  useAccountAuth: () => ({ isLoaded: false, isSignedIn: false }),
}));
/** The record the header reads; null renders the fresh default. */
const record = vi.hoisted(() => ({ value: null as null | Partial<ProgressState> }));
vi.mock("@/lib/progress", async (importOriginal) => {
  const mod = await importOriginal<typeof import("@/lib/progress")>();
  const { DEFAULT_PROGRESS } = await import("@/lib/progress-shape");
  return {
    ...mod,
    useProgress: (): ProgressState => ({ ...DEFAULT_PROGRESS, ...record.value }),
  };
});

import Nav, { LINKS, streakChipState } from "./nav";
import { localDay, type ProgressState } from "@/lib/progress";

const ROOT = fileURLToPath(new URL("..", import.meta.url));

const originalTz = process.env.TZ;
afterEach(() => {
  if (originalTz === undefined) delete process.env.TZ;
  else process.env.TZ = originalTz;
});

describe("practice streak calendar days", () => {
  it("keeps yesterday's streak alive after a short daylight-saving day", () => {
    process.env.TZ = "America/New_York";
    expect(streakChipState({ current: 7, lastDay: "2026-03-08" }, new Date(2026, 2, 9, 0, 30))).toBe("at-risk");
  });

  it("keeps yesterday distinct from today and older days after a long daylight-saving day", () => {
    process.env.TZ = "America/New_York";
    expect(streakChipState({ current: 7, lastDay: "2026-10-31" }, new Date(2026, 10, 1, 23, 30))).toBe("at-risk");
    expect(streakChipState({ current: 7, lastDay: "2026-10-30" }, new Date(2026, 10, 1, 23, 30))).toBe("none");
  });
});

/** The header row is the only navigation landmark until the mobile drawer opens. */
const LANDMARKS = ["Main"] as const;

function landmark(html: string, label: string): string {
  return html.match(new RegExp(`<nav aria-label="${label}"[^>]*>(.*?)</nav>`))?.[1] ?? "";
}

describe("main navigation current location", () => {
  it.each([
    ["/range", "/range?mode=range#start", "page"],
    ["/programs/first-fortnight", "/warmups", "location"],
    ["/learn", "/learn", "page"],
    ["/learn/voice", "/learn", "location"],
    ["/glossary/tessitura", "/learn", "location"],
    ["/singers/olivia-rodrigo", "/singers", "location"],
    ["/recorder", "/tools", "location"],
    ["/analyze", "/tools", "location"],
  ])("announces %s through the correct navigation link", (pathname, href, current) => {
    route.pathname = pathname;
    const html = renderToStaticMarkup(<Nav />);
    for (const label of LANDMARKS) {
      const nav = landmark(html, label);
      expect(nav, `${label} landmark rendered`).not.toBe("");
      const links = nav.match(/<a\b[^>]*aria-current="[^"]+"[^>]*>/g) ?? [];
      expect(links, label).toHaveLength(1);
      expect(links[0], label).toContain(`href="${href}"`);
      expect(links[0], label).toContain(`aria-current="${current}"`);
    }
    // Nothing outside the landmarks (logo, Pro pill, LV chip) claims to be current.
    const total = html.match(/aria-current=/g) ?? [];
    expect(total).toHaveLength(LANDMARKS.length);
  });

  /**
   * Range opens the guided test at its start button. The mobile drawer
   * renders only once opened, so its link is checked here in the data it
   * maps (`target ?? href`), and in
   * e2e/navigation.mjs by a real tap.
   */
  it("sends the Range tab and mobile room link to the guided test", () => {
    const routed = LINKS.filter((l) => l.href === "/range");
    expect(routed.map((l) => l.label)).toEqual(["Range"]);
    for (const l of routed) expect(l.target, l.label).toBe("/range?mode=range#start");
  });

  it("does not claim an unrelated prefix is a current destination", () => {
    route.pathname = "/learning";
    expect(renderToStaticMarkup(<Nav />)).not.toContain("aria-current=");
  });

  it("gives every desktop tab a 44px touch target", () => {
    const html = renderToStaticMarkup(<Nav />);
    const main = html.match(/<nav aria-label="Main"[^>]*>(.*?)<\/nav>/)?.[1] ?? "";
    const links = main.match(/<a\b[^>]*>/g) ?? [];
    expect(links).toHaveLength(10);
    for (const link of links) expect(link).toContain("min-h-11");
    expect([...main.matchAll(/<a\b[^>]*>(.*?)<\/a>/g)].map((link) => link[1])).toEqual([
      "Studio", "Warmups", "Range", "Singers", "Ear", "Breath", "Songs", "Tools", "Learn", "Progress",
    ]);
  });

  it("leaves a focused tab's ring room inside the scrolling row", () => {
    // overflow-x-auto clips both axes; the 44px tabs filled the row, so the
    // ring (2px wide, 2px out) lost its top and bottom. The padding is the
    // ring's room and the equal negative margin keeps the tabs in place.
    const row = renderToStaticMarkup(<Nav />).match(/<nav aria-label="Main" class="([^"]*)"/)?.[1] ?? "";
    expect(row.split(" ")).toEqual(expect.arrayContaining(["overflow-x-auto", "p-1", "-m-1"]));
  });

  it("does not prefetch the /singers directory from the Singers tab", () => {
    // The row is on screen from 640px up, so a prefetching tab fetched the
    // 230 KB directory on every page (lib/singer-link-prefetch.test.ts checks
    // that both nav lists pass the flag through).
    expect(LINKS.filter((l) => l.prefetch === false).map((l) => l.href)).toEqual(["/singers"]);
  });
});

/**
 * The header's logo and Pro links prefetch / and /pro from every page, and
 * the router preloads a prefetched route's own stylesheet with it. The Pro
 * visual's CSS module was the only one, so every other page logged "preloaded
 * using link preload but not used". Shared rules live in app/globals.css.
 */
describe("route stylesheets the header's prefetch would preload", () => {
  function cssModules(dir: string): string[] {
    return readdirSync(join(ROOT, dir), { withFileTypes: true }).flatMap((entry) => {
      const path = join(dir, entry.name);
      if (entry.isDirectory()) return cssModules(path);
      return entry.name.endsWith(".module.css") ? [path] : [];
    });
  }

  it("there are none: no CSS module in app/ or components/", () => {
    expect([...cssModules("app"), ...cssModules("components")]).toEqual([]);
    // The Pro visual's animation is in the shared sheet instead.
    expect(readFileSync(join(ROOT, "app/globals.css"), "utf8")).toContain(".pro-visual-bar {");
  });
});

/**
 * At 1280px the header row is at its max-w-6xl plateau: the ten tabs need
 * 739px and leave the progress pill about 120px with an account control
 * beside it. "LV 6 · 1230 XP · 12d · today?" took 250px and pushed Learn and
 * Progress behind the Menu button on a returning singer's first result.
 */
describe("the header progress pill", () => {
  afterEach(() => {
    record.value = null;
  });

  /** The pill: the one /progress link outside the tab row. */
  function pill(): string {
    const html = renderToStaticMarkup(<Nav />).replace(/<nav aria-label="Main".*?<\/nav>/g, "");
    return html.match(/<a\b[^>]*href="\/progress"[^>]*>(.*?)<\/a>/)?.[1] ?? "";
  }
  const shown = (inner: string) =>
    inner.replace(/<span class="sr-only">[^<]*<\/span>/g, "").replace(/<[^>]+>/g, "");

  it("shows only the level and the streak, at any count", () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    record.value = {
      xp: 12345,
      streak: { current: 123, best: 123, lastDay: localDay(yesterday) },
    };
    const inner = pill();
    expect(shown(inner)).toBe("LV 18" + "123d");
    // A screen reader still hears the XP and that today is not banked yet.
    expect(inner).toContain(", 12345 XP");
    expect(inner).toContain("123 day streak, at risk — nothing practiced today");
  });

  it("shows the level alone to a fresh visitor", () => {
    expect(shown(pill())).toBe("LV 1");
  });
});

/**
 * The nav renders on every page, so any module it imports statically ships to
 * every visitor. A static @clerk/nextjs import in the nav, the auth hook or
 * the save prompt put about 42 KB (gzipped) of Clerk on every page of a build
 * where accounts are off and no account control can render. Clerk belongs
 * only in the lazily loaded account modules and in clerk-shell.tsx with its
 * auth bridge. The layout reaches Clerk only through clerk-shell, so a build
 * with accounts off swaps in clerk-shell-off.tsx (next.config.ts) and ships
 * none of it.
 */
describe("Clerk stays out of the shared client bundle", () => {
  it.each([
    "./nav.tsx",
    "./account/save-state.ts",
    "./account/save-prompt.tsx",
    "./account/clerk-shell-off.tsx",
    "../lib/use-account-auth.ts",
    "../app/layout.tsx",
  ])("%s has no static Clerk import", (file) => {
    const source = readFileSync(new URL(file, import.meta.url), "utf8");
    expect(source).not.toMatch(/^import[^;]*from\s+["']@clerk\/nextjs["']/m);
  });
});
