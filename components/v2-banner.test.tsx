import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";

// The homepage reads server-only modules; under vitest there is no
// react-server condition to resolve the package's empty export.
vi.mock("server-only", () => ({}));

import Home from "@/app/page";
import { PROGRESS_STORAGE_KEY } from "@/lib/progress";
import V2Banner, { bannerWanted } from "./v2-banner";

const SEEN_KEY = "suede-sing:v4-0-banner:v1";
/** The 3.1 card's dismiss key, which must no longer hide the 4.0 card. */
const OLD_SEEN_KEY = "suede-sing:v3-1-banner:v1";
const ROOT = fileURLToPath(new URL("..", import.meta.url));

interface Storage {
  getItem(key: string): string | null;
}

function storageOf(stored: Record<string, string>): Storage {
  return { getItem: (key) => stored[key] ?? null };
}

/** Storage that refuses every read, as a locked-down private window can. */
const BLOCKED: Storage = {
  getItem: () => {
    throw new Error("SecurityError");
  },
};

/**
 * Runs the banner's pre-paint script against a fake localStorage and reports
 * whether it hid the banner. This script is what a phone visitor actually
 * experiences on a full page load: it decides before first paint whether the
 * card is there at all.
 */
function hiddenBeforePaint(html: string, storage: Storage): boolean {
  const script = html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
  expect(script, "pre-paint script rendered").toBeTruthy();
  const banner = { hidden: false };
  new Function("localStorage", "document", script ?? "")(storage, {
    getElementById: (id: string) => (id === "v2-banner" ? banner : null),
  });
  return banner.hidden;
}

describe("4.0 release banner", () => {
  const html = renderToStaticMarkup(<V2Banner />);

  it("keeps the crawlable /changelog link in the server HTML", () => {
    expect(html).toContain('id="v2-banner"');
    expect(html).toContain('href="/changelog"');
  });

  it("leads with the v4.0 lockup as its heading, and names 4.0 to assistive tech", () => {
    expect(html).toMatch(/<h2[^>]*><span class="sr-only">Suede Sing <\/span>v4\.0<\/h2>/);
    expect(html).toContain('aria-label="Suede Sing 4.0 announcement"');
    expect(html).toContain('aria-label="Dismiss the 4.0 announcement"');
    expect(html).toContain("See what&#x27;s new");
  });

  /**
   * For 4.0 the card goes to every visitor, not only returning singers, so a
   * missing progress record must not hide it. These are the states a full
   * page load can arrive in.
   */
  it("shows for a first-time visitor with no practice record", () => {
    expect(hiddenBeforePaint(html, storageOf({}))).toBe(false);
  });

  it("shows for a returning singer who has not dismissed it", () => {
    expect(hiddenBeforePaint(html, storageOf({ [PROGRESS_STORAGE_KEY]: "{}" }))).toBe(false);
  });

  it("shows again for a singer who dismissed the 3.1 card", () => {
    expect(
      hiddenBeforePaint(html, storageOf({ [PROGRESS_STORAGE_KEY]: "{}", [OLD_SEEN_KEY]: "2026-10-01" })),
    ).toBe(false);
  });

  it("stays hidden for anyone who dismissed it, with or without a practice record", () => {
    expect(hiddenBeforePaint(html, storageOf({ [SEEN_KEY]: "2026-10-24" }))).toBe(true);
    expect(
      hiddenBeforePaint(html, storageOf({ [PROGRESS_STORAGE_KEY]: "{}", [SEEN_KEY]: "2026-10-24" })),
    ).toBe(true);
  });

  it("shows when storage refuses the read, rather than flickering", () => {
    expect(hiddenBeforePaint(html, BLOCKED)).toBe(false);
  });

  /**
   * After hydration, and on a client-side navigation to the homepage where the
   * inline script never runs, bannerWanted() decides instead. If the two
   * disagreed, the card would appear or vanish after first paint: a flash, and
   * a layout shift under the hero.
   */
  describe("the client-side decision agrees with the pre-paint script", () => {
    afterEach(() => {
      vi.unstubAllGlobals();
    });

    it.each([
      ["a first-time visitor", storageOf({})],
      ["a returning singer", storageOf({ [PROGRESS_STORAGE_KEY]: "{}" })],
      ["a singer who dismissed the 3.1 card", storageOf({ [PROGRESS_STORAGE_KEY]: "{}", [OLD_SEEN_KEY]: "2026-10-01" })],
      ["a first-time visitor who dismissed it", storageOf({ [SEEN_KEY]: "2026-10-24" })],
      [
        "a returning singer who dismissed it",
        storageOf({ [PROGRESS_STORAGE_KEY]: "{}", [SEEN_KEY]: "2026-10-24" }),
      ],
      ["a browser that blocks storage", BLOCKED],
    ])("for %s", (_who, storage) => {
      vi.stubGlobal("window", { localStorage: storage });
      expect(bannerWanted()).toBe(!hiddenBeforePaint(html, storage));
    });
  });
});

/**
 * The placement rule. Above a page's content the banner's 131px pushed the
 * page's main button under a 375×667 phone's tab bar, and a list of paths to
 * hide it on kept missing pages (the song, can-you-sing, records, book and
 * extension pages after the rooms and /pro). So the rule is where it renders:
 * only the homepage renders it, and only after the hero's start buttons.
 */
describe("4.0 release banner placement", () => {
  const SCANNED = ["app", "components", "lib"];
  const SOURCE = /\.(?:tsx?|mjs|js)$/;
  const TEST = /\.test\.(?:tsx?|mjs)$/;
  /** A module specifier naming this component: an import, re-export or dynamic import. */
  const NAMES_BANNER = /["'][^"'\n]*\/v2-banner(?:\.tsx)?["']/;

  function sourceFiles(dir: string): string[] {
    return readdirSync(join(ROOT, dir), { withFileTypes: true }).flatMap((entry) => {
      const path = join(dir, entry.name);
      if (entry.isDirectory()) return sourceFiles(path);
      return SOURCE.test(entry.name) && !TEST.test(entry.name) ? [path] : [];
    });
  }

  it("is rendered by the homepage and by no other module", () => {
    const files = SCANNED.flatMap(sourceFiles);
    // Non-vacuous: the scan reaches the root layout, where the banner sat
    // above every page's content before.
    expect(files).toContain("app/layout.tsx");
    const importers = files.filter((file) =>
      NAMES_BANNER.test(readFileSync(join(ROOT, file), "utf8")),
    );
    expect(importers, "render V2Banner only below the homepage hero").toEqual(["app/page.tsx"]);
  });

  describe("on the homepage", () => {
    const home = renderToStaticMarkup(<Home />);
    const main = home.indexOf("<main");
    const heroEnd = home.indexOf("</section>", main);
    const banner = home.indexOf('id="v2-banner"');

    it("renders it once, with its /changelog link", () => {
      expect(banner).toBeGreaterThan(-1);
      expect(home.indexOf('id="v2-banner"', banner + 1)).toBe(-1);
      expect(home.slice(banner)).toContain('href="/changelog"');
    });

    it("puts it after the hero, its H1 and both start buttons", () => {
      expect(main).toBeGreaterThan(-1);
      for (const needle of ["<h1", ">Start singing<", ">Find my vocal range<"]) {
        const at = home.indexOf(needle);
        expect(at, needle).toBeGreaterThan(main);
        expect(at, `${needle} is in the hero`).toBeLessThan(heroEnd);
      }
      expect(banner, "the banner sits below the hero").toBeGreaterThan(heroEnd);
    });

    it("puts it directly after the hero, ahead of the next section", () => {
      const ownTag = home.lastIndexOf("<section", banner);
      expect(home.indexOf("<section", heroEnd)).toBe(ownTag);
    });

    it("keeps it in the page's column, with the gutters the hero text has", () => {
      // Full-bleed, its rounded corners met the screen edges and its text
      // started at 24px against the column's 88px at 1280px wide.
      const ownTag = home.lastIndexOf("<section", banner);
      const wrapper = home.slice(home.lastIndexOf("<div", ownTag), ownTag);
      const classes = wrapper.match(/^<div class="([^"]*)">$/)?.[1].split(" ") ?? [];
      expect(classes).toEqual(expect.arrayContaining(["mx-auto", "w-full", "max-w-6xl", "px-4", "sm:px-6"]));
    });
  });
});
