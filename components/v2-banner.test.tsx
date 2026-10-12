import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { PROGRESS_STORAGE_KEY } from "@/lib/progress";

const nav = vi.hoisted(() => ({ pathname: "/" }));
vi.mock("next/navigation", () => ({ usePathname: () => nav.pathname }));

import V2Banner from "./v2-banner";

const SEEN_KEY = "suede-sing:v3-1-banner:v1";

/**
 * Runs the banner's pre-paint script against a fake localStorage and reports
 * whether it hid the banner. This script is what a phone visitor actually
 * experiences: it decides before first paint whether the band pushes the
 * page's primary button down.
 */
function hiddenBeforePaint(html: string, stored: Record<string, string>): boolean {
  const script = html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
  expect(script, "pre-paint script rendered").toBeTruthy();
  const banner = { hidden: false };
  new Function("localStorage", "document", script ?? "")(
    { getItem: (key: string) => stored[key] ?? null },
    { getElementById: (id: string) => (id === "v2-banner" ? banner : null) },
  );
  return banner.hidden;
}

describe("3.1 release banner", () => {
  const html = renderToStaticMarkup(<V2Banner />);

  it("keeps the crawlable /changelog link in the server HTML", () => {
    expect(html).toContain('id="v2-banner"');
    expect(html).toContain('href="/changelog"');
  });

  it("hides before paint for a first-time visitor with no practice record", () => {
    expect(hiddenBeforePaint(html, {})).toBe(true);
  });

  it("shows for a returning singer who has not dismissed it", () => {
    expect(hiddenBeforePaint(html, { [PROGRESS_STORAGE_KEY]: "{}" })).toBe(false);
  });

  it("stays hidden for a returning singer who dismissed it", () => {
    expect(
      hiddenBeforePaint(html, { [PROGRESS_STORAGE_KEY]: "{}", [SEEN_KEY]: "2026-10-01" }),
    ).toBe(true);
  });

  it("stays off /pro, where it would sit above the price", () => {
    nav.pathname = "/pro";
    try {
      expect(renderToStaticMarkup(<V2Banner />)).toBe("");
    } finally {
      nav.pathname = "/";
    }
  });
});
