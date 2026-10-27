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

vi.mock("server-only", () => ({}));
import SingerPage from "@/app/singers/[slug]/page";
import SingersPage from "@/app/singers/page";
import SiteFooter from "@/components/site-footer";
import { PRICING, formatPrice } from "@/lib/pro-shared";
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
  const html = renderToStaticMarkup(<SingersPage />);
  const catalogSlugs = new Set(SINGERS.map((singer) => singer.slug));

  it("server-renders a real <a> link to every singer (not JS-only)", () => {
    const linked = new Set(singerLinkSlugs(html).filter((slug) => catalogSlugs.has(slug)));
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

  it("links all five primary-Grunge profiles to the generated Grunge hub", async () => {
    const primaryGrungeSlugs = SINGERS.filter(
      (s) => s.genres[0] === "Grunge",
    ).map((s) => s.slug);

    expect(primaryGrungeSlugs).toEqual([
      "chris-cornell",
      "eddie-vedder",
      "kurt-cobain",
      "layne-staley",
      "scott-weiland",
    ]);

    for (const slug of primaryGrungeSlugs) {
      const el = await SingerPage({ params: Promise.resolve({ slug }) });
      expect(renderToStaticMarkup(el)).toContain(
        'href="/singers/genre/grunge"',
      );
    }
  });

  it("never points a primary-genre profile link at an ungenerated hub", () => {
    const generatedGenres = new Set(HUB_GENRES);
    const deadPrimaryGenres = SINGERS.filter(
      (s) => s.genres[0] && !generatedGenres.has(s.genres[0]),
    ).map((s) => `${s.slug}:${s.genres[0]}`);

    expect(deadPrimaryGenres).toEqual([]);
  });
});

describe("footer wires every hub into every page", () => {
  const html = renderToStaticMarkup(<SiteFooter />);

  it("links the reference hubs", () => {
    for (const href of [
      "/singers",
      "/singers/records",
      "/atlas",
      "/book",
      "/glossary",
    ]) {
      expect(html, `footer missing ${href}`).toContain(`href="${href}"`);
    }
  });

  /**
   * The money page's only sitewide inbound anchor was the header pill's
   * three-letter "Pro", which says nothing about what the page is.
   */
  it("links /pro with descriptive, priced anchor text", () => {
    const anchor = html.match(/<a[^>]*href="\/pro"[^>]*>([^<]*)<\/a>/);
    expect(anchor?.[1]).toBe(`Suede Pro vocal coach, ${formatPrice(PRICING.lifetime.amount)} once`);
  });

  /**
   * /ai-instructions is a static file behind a vercel.json rewrite. It used to
   * hang below the footer in an unstyled nav of its own on every page.
   */
  it("links the AI instructions page from the credits row", () => {
    expect(html).toContain('href="/ai-instructions"');
  });

  /**
   * Two live rooms were in no footer column, so neither had a site-wide inbound
   * link from anywhere on the site.
   */
  it("links every practice room, including the two that were missing", () => {
    for (const href of ["/breath", "/tools", "/studio", "/warmups", "/range?mode=range#start"]) {
      expect(html, `footer missing ${href}`).toContain(`href="${href}"`);
    }
  });

  /**
   * This suite only ever asserted root-relative hrefs, which is how the footer
   * came to carry absolute sibling-product links that nothing checked.
   *
   * The voice course was GuitarHub's and this footer linked out to it. sing now
   * hosts the lessons and GuitarHub redirects to them, so the footer links the
   * local course and must not send a reader back through the redirect.
   */
  it("links the voice course on sing, not its old home", () => {
    expect(html, "footer missing the voice course").toContain('href="/learn/voice"');
    expect(html).not.toContain("guitarhub.org/learn/voice");
    expect(html, "footer missing Suede AI").toContain('href="https://suedeai.ai"');
  });

  it("links sibling properties as plain anchors, not prefetched routes", () => {
    // next/link would treat an absolute URL as a local route to prefetch.
    expect(html).not.toContain('href="https://suedeai.ai" data-prefetch');
  });

  it("links the extension page — its only internal inbound link", () => {
    expect(html, "footer missing /extension").toContain('href="/extension"');
  });

  it("links the changelog — the durable path once the v2 banner retires", () => {
    expect(html, "footer missing /changelog").toContain('href="/changelog"');
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

  // Both pages resolved for months with no link to either from the header,
  // the footer, or /contact. A microphone app whose policy can only be found
  // by guessing the URL has a policy in name only.
  it("links the policy pages from every server-rendered page", () => {
    // The company policy and terms, which cover suedeai.ai and its
    // subdomains (Stripe purchases included). suedeai.org/voice/* covers only
    // the mobile app and calls "Suede Sing" one of its former names.
    for (const href of ["https://suedeai.org/privacy/", "https://suedeai.org/terms/"]) {
      expect(html, `footer missing ${href}`).toContain(`href="${href}"`);
    }
    expect(html).not.toContain('href="https://suedeai.org/voice/privacy/"');
    expect(html).not.toContain('href="https://suedeai.org/voice/terms/"');
  });
});

describe("/extension's onward links", () => {
  it("styles every 'Also from Suede AI' link as a link, not as body text", async () => {
    const { default: ExtensionPage } = await import("@/app/extension/page");
    const html = renderToStaticMarkup(<ExtensionPage />);
    const section = html.slice(html.indexOf("Also from Suede AI"));
    const anchors = section.match(/<a\b[^>]*>/g) ?? [];
    // The founder, Suede AI, /voice, /, the range test and /studio.
    expect(anchors.length).toBeGreaterThanOrEqual(6);
    for (const a of anchors) expect(a, a).toMatch(/class="[^"]*\bunderline\b/);
    expect(section).toContain('href="/voice"');
    expect(section).toContain('href="/studio"');
  });
});
