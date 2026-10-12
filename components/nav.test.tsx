import { readFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";

const route = vi.hoisted(() => ({ pathname: "/learn" }));
vi.mock("next/navigation", () => ({ usePathname: () => route.pathname }));
vi.mock("@/lib/use-account-auth", () => ({
  useAccountAuth: () => ({ isLoaded: false, isSignedIn: false }),
}));

import Nav, { streakChipState } from "./nav";

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

/** The <nav> landmarks Nav renders closed: the header row and the phone tab bar. */
const LANDMARKS = ["Main", "Tabs"] as const;

function landmark(html: string, label: string): string {
  return html.match(new RegExp(`<nav aria-label="${label}"[^>]*>(.*?)</nav>`))?.[1] ?? "";
}

describe("main navigation current location", () => {
  it.each([
    // Sing's link lands on the range page's start button (#start); it is
    // still current on /range itself and inside the rooms it owns.
    ["/", "/", "page"],
    ["/range", "/range#start", "page"],
    ["/learn/voice", "/warmups", "location"],
    ["/glossary/tessitura", "/warmups", "location"],
    ["/singers/olivia-rodrigo", "/songs", "location"],
    ["/recorder", "/range#start", "location"],
  ])("announces %s through the correct link in each navigation landmark", (pathname, href, current) => {
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

  it("does not claim an unrelated prefix is a current destination", () => {
    route.pathname = "/learning";
    expect(renderToStaticMarkup(<Nav />)).not.toContain("aria-current=");
  });

  it("gives every desktop tab a 44px touch target", () => {
    const html = renderToStaticMarkup(<Nav />);
    const main = html.match(/<nav aria-label="Main"[^>]*>(.*?)<\/nav>/)?.[1] ?? "";
    const links = main.match(/<a\b[^>]*>/g) ?? [];
    expect(links).toHaveLength(5);
    for (const link of links) expect(link).toContain("min-h-11");
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
