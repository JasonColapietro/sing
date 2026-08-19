/**
 * Internal-linking guard.
 *
 * Google discovered 284 `/singers/*` pages but never crawled them: the site
 * used to emit no crawlable path into that inventory. The fix is hub-and-spoke
 * internal linking — the /singers hub links to every singer, every singer page
 * links to related singers and back to the hubs, and the footer links every hub
 * from every page. This test asserts those links exist in the *server-rendered
 * HTML*, not merely in the data, because the regression that reopens the hole is
 * exactly a link that renders only after client-side hydration (invisible to a
 * crawler). Each component is rendered with renderToStaticMarkup — the server
 * pass a crawler sees — and the raw HTML string is inspected.
 *
 * Assertions are on the claim (a real <a href> reaches the target), scanned per
 * rendered page, never on a concatenation. Proven non-vacuous: see the PR body
 * for the reintroduce-the-defect / watch-it-fail runs.
 */
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

// Nav is a client component and calls usePathname, which has no request to read
// outside Next's server runtime. Only that one export is replaced; `notFound`
// (used by the singer page rendered below) stays real.
vi.mock("next/navigation", async (importOriginal) => ({
  ...(await importOriginal<typeof import("next/navigation")>()),
  usePathname: () => "/",
}));

import SingerPage from "@/app/singers/[slug]/page";
import Nav, { NAV_GROUPS, PROGRESS_LINK } from "@/components/nav";
import SiteFooter from "@/components/site-footer";
import { SingersDirectory } from "@/components/singers/directory";
import { APP_STORE_URL } from "@/lib/app-store";
import {
  HUB_GENRES,
  SINGERS,
  VOICE_KINDS,
  genreSlug,
  relatedSingers,
  voiceTypeSlug,
} from "@/lib/singers";

/** Slugs targeted by `<a href="/singers/<slug>">` in a rendered HTML string. */
function singerLinkSlugs(html: string): string[] {
  return [...html.matchAll(/href="\/singers\/([a-z0-9-]+)"/g)].map((m) => m[1]);
}

/** A spread sample across the whole library, plus the first and last entry. */
function sampleSingers() {
  const out = [SINGERS[0], SINGERS[SINGERS.length - 1]];
  for (let i = 0; i < SINGERS.length; i += 20) out.push(SINGERS[i]);
  return [...new Set(out)];
}

describe("/singers hub is a crawlable index", () => {
  const html = renderToStaticMarkup(<SingersDirectory />);

  it("server-renders a real <a> link to every singer (not JS-only)", () => {
    const linked = new Set(singerLinkSlugs(html));
    const missing = SINGERS.filter((s) => !linked.has(s.slug)).map((s) => s.slug);
    // Every singer must have a raw-HTML anchor. If the directory ever regresses
    // to rendering rows only after mount, `linked` collapses toward empty and
    // this names the singers that fell out of the crawl path.
    expect(missing).toEqual([]);
    expect(linked.size).toBe(SINGERS.length);
  });
});

describe("every singer page is a spoke, never a dead end", () => {
  it("data: every singer has >= 2 related singers to link to", () => {
    const starved = SINGERS.filter((s) => relatedSingers(s).length < 2).map(
      (s) => s.slug,
    );
    expect(starved).toEqual([]);
  });

  it("render: sampled singer pages link to >= 2 other singers + back to the hub", async () => {
    for (const s of sampleSingers()) {
      const el = await SingerPage({ params: Promise.resolve({ slug: s.slug }) });
      const pageHtml = renderToStaticMarkup(el);

      const others = new Set(
        singerLinkSlugs(pageHtml).filter((slug) => slug !== s.slug),
      );
      expect(
        others.size,
        `${s.slug} links to only ${others.size} other singer(s)`,
      ).toBeGreaterThanOrEqual(2);

      // Back to the hub, and up to the taxonomy hubs the crawler should follow.
      expect(pageHtml, `${s.slug} missing back-to-hub link`).toContain(
        'href="/singers"',
      );
      expect(pageHtml, `${s.slug} missing voice-type hub link`).toMatch(
        /href="\/singers\/voice-type\//,
      );
    }
  });
});

describe("footer wires every hub into every page", () => {
  const html = renderToStaticMarkup(<SiteFooter />);

  it("links the reference hubs", () => {
    for (const href of [
      "/singers",
      "/singers/records",
      "/atlas",
      // Both books, symmetrically: /book was the one long-form surface with no
      // sitewide inbound link in server-rendered HTML.
      "/book",
      "/glossary",
      "/songs",
    ]) {
      expect(html, `footer missing ${href}`).toContain(`href="${href}"`);
    }
  });

  it("links every practice room the sitemap asks Google to index", () => {
    for (const href of [
      "/studio",
      "/warmups",
      "/range",
      "/breath",
      "/ear-training",
      "/recorder",
      "/analyze",
      "/tools",
      "/progress",
    ]) {
      expect(html, `footer missing ${href}`).toContain(`href="${href}"`);
    }
  });

  it("links every voice-type hub", () => {
    for (const v of VOICE_KINDS) {
      expect(html, `footer missing voice-type ${v}`).toContain(
        `href="/singers/voice-type/${voiceTypeSlug(v)}"`,
      );
    }
  });

  it("links every genre hub", () => {
    expect(HUB_GENRES.length).toBeGreaterThan(0);
    for (const g of HUB_GENRES) {
      expect(html, `footer missing genre ${g}`).toContain(
        `href="/singers/genre/${genreSlug(g)}"`,
      );
    }
  });
});

describe("the header ships every destination as a real anchor", () => {
  // Menus are closed in this pass — no state, no effects, no portal — so this
  // is exactly the HTML a crawler is served.
  const html = renderToStaticMarkup(<Nav />);
  const hrefs = new Set(
    [...html.matchAll(/href="([^"]+)"/g)].map((m) => m[1]),
  );
  const destinations = [
    ...NAV_GROUPS.flatMap((g) => g.items.map((i) => i.href)),
    PROGRESS_LINK.href,
  ];

  it("covers the whole room list, plus Progress and both apps", () => {
    // Guards the shape of the IA, not just its rendering: a group silently
    // losing an item would otherwise pass the loop below.
    expect(destinations.sort()).toEqual(
      [
        "/analyze",
        "/atlas",
        "/book",
        "/breath",
        "/ear-training",
        "/extension",
        "/glossary",
        "/progress",
        "/range",
        "/recorder",
        "/singers",
        "/songs",
        "/studio",
        "/tools",
        "/warmups",
        APP_STORE_URL,
      ].sort(),
    );
  });

  it("server-renders each one with its menu closed (not JS-only)", () => {
    // The regression this exists to catch: someone rebuilds the group menus so
    // their contents mount on click, or move into a portal. Every href inside
    // Practice / Perform / Library / Apps then disappears from the crawlable
    // HTML of every page on the site while the UI still looks correct.
    const missing = destinations.filter((href) => !hrefs.has(href));
    expect(missing).toEqual([]);
  });

  it("keeps each group a disclosure button, not a hover-only menu", () => {
    for (const g of NAV_GROUPS) {
      expect(html, `group ${g.id} missing its disclosure wiring`).toContain(
        `aria-controls="nav-group-${g.id}"`,
      );
      expect(html, `group ${g.id} menu not in the markup`).toContain(
        `id="nav-group-${g.id}"`,
      );
    }
    expect(html).toContain('aria-expanded="false"');
  });
});
