import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  DEFAULT_OG_IMAGE,
  OG_CARD_RENDER_REVISION,
  OG_CARD_VERSION,
  OG_IMAGE_ALT,
  OG_IMAGE_SIZE,
  OG_IMAGE_TAGLINE,
  OG_LOCALE,
  OG_SITE_NAME,
  ogCardVersion,
  withCanonicalOpenGraph,
} from "@/lib/og";
import { FREE_DAILY_MINUTES } from "@/lib/practice-limits";

const APP_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "app");

function pageFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry);
    if (statSync(full).isDirectory()) {
      out.push(...pageFiles(full));
    } else if (entry === "page.tsx") {
      out.push(full);
    }
  }
  return out;
}

/** Does this route segment ship its own file-convention card? */
function hasOwnCard(pageFile: string): boolean {
  const dir = path.dirname(pageFile);
  return readdirSync(dir).some((f) => f.startsWith("opengraph-image"));
}

describe("share cards", () => {
  /**
   * The regression that produced lib/og.ts.
   *
   * Next resolves metadata per segment and replaces `openGraph` wholesale at
   * the deepest segment that declares one, so a page that sets `openGraph` for
   * a page-specific title drops the root card unless it either names an image
   * itself or has an `opengraph-image` file beside it. Eight pages reached
   * production sharing with no image at all before this test existed, and
   * nothing in the type system or the build says a word about it.
   *
   * Asserted over the file text rather than by importing each page's metadata:
   * a page module pulls in its whole component tree, and the failure this
   * guards is a property of the source, not of the rendered route.
   */
  it("every page that declares openGraph also resolves to an image", () => {
    const offenders = pageFiles(APP_DIR).filter((file) => {
      const src = readFileSync(file, "utf8");
      if (!/^\s*openGraph:/m.test(src)) return false;
      if (/images:/.test(src)) return false;
      return !hasOwnCard(file);
    });

    expect(
      offenders.map((f) => path.relative(APP_DIR, f)),
      "these pages override openGraph and will share with no image — spread DEFAULT_OG_IMAGE into their openGraph block",
    ).toEqual([]);
  });

  it("the shared descriptor matches what the root card actually renders", () => {
    // Drift here is silent: Facebook and X read the declared width/height and
    // lay out the card before fetching the file.
    expect(DEFAULT_OG_IMAGE.width).toBe(OG_IMAGE_SIZE.width);
    expect(DEFAULT_OG_IMAGE.height).toBe(OG_IMAGE_SIZE.height);
    expect(DEFAULT_OG_IMAGE.alt).toBe(OG_IMAGE_ALT);
    expect(DEFAULT_OG_IMAGE.type).toBe("image/png");
    // 1200x630 is the size both platforms crop against; a smaller card is
    // downgraded to a thumbnail rather than a large summary image.
    expect(OG_IMAGE_SIZE).toEqual({ width: 1200, height: 630 });
  });

  it("states the free-plan boundary instead of calling the whole studio free", () => {
    // Guided practice is metered (FREE_DAILY_MINUTES a day), so neither the
    // alt nor the card's fine print may describe the product as simply free.
    for (const text of [OG_IMAGE_ALT, OG_IMAGE_TAGLINE]) {
      expect(text).not.toMatch(/free (?:browser )?vocal studio|· Free$/i);
      expect(text).toMatch(/pitch meter/i);
      expect(text).toMatch(/range test/i);
      expect(text).toContain(`${FREE_DAILY_MINUTES} free min`);
    }
  });

  it("points at an absolute URL, since crawlers do not resolve relative ones", () => {
    expect(DEFAULT_OG_IMAGE.url).toMatch(/^https:\/\//);
    expect(new URL(DEFAULT_OG_IMAGE.url).pathname).toBe("/opengraph-image");
  });

  /**
   * Scrapers cache a preview by URL, so a card whose words change at a fixed
   * URL keeps showing the old words. The version is read off the card's text:
   * the card that said "· Free" and the one that states the daily limit must
   * not share a URL.
   */
  it("versions the card URL by what the card says", () => {
    expect(new URL(DEFAULT_OG_IMAGE.url).searchParams.get("v")).toBe(OG_CARD_VERSION);
    expect(OG_CARD_VERSION).toBe(
      ogCardVersion(`${OG_CARD_RENDER_REVISION}|${OG_IMAGE_ALT}|${OG_IMAGE_TAGLINE}`),
    );
    expect(OG_CARD_VERSION).toMatch(/^[0-9a-z]+$/);

    const previousCard =
      "The vocal studio in your browser|Live pitch · Range test · Warmups · Ear training · Free";
    expect(ogCardVersion(previousCard)).not.toBe(OG_CARD_VERSION);
    // Same words, same URL: the version is stable across builds.
    expect(ogCardVersion(previousCard)).toBe(ogCardVersion(previousCard));
  });

  /**
   * #229 repainted the card from dark to paper and kept every word, so a URL
   * read off the words alone stayed at ?v=1cpiwld, where scrapers had cached
   * the dark picture. The render revision moves it.
   */
  it("moves the card URL when the picture changes and the words do not", () => {
    const wordsOnly = ogCardVersion(`${OG_IMAGE_ALT}|${OG_IMAGE_TAGLINE}`);
    expect(OG_CARD_VERSION).not.toBe(wordsOnly);
    expect(OG_CARD_RENDER_REVISION).toMatch(/^\d{4}-\d{2}-\d{2}/);
    expect(
      ogCardVersion(`${OG_CARD_RENDER_REVISION}-next|${OG_IMAGE_ALT}|${OG_IMAGE_TAGLINE}`),
    ).not.toBe(OG_CARD_VERSION);
  });

  /**
   * The version is read off the alt and the tagline, but the card's headline
   * is written in app/opengraph-image.tsx. A headline edited there alone would
   * change the picture under an unchanged URL, and the alt would stop
   * describing it. So every line of text the card draws has to appear in the
   * versioned text: change the card's words, and the alt (and with it the URL)
   * has to change too.
   */
  it("versions every line of text the card draws", () => {
    const src = readFileSync(path.join(APP_DIR, "opengraph-image.tsx"), "utf8");
    expect(src).toContain("{OG_IMAGE_TAGLINE}");
    const drawn = [...src.matchAll(/\{`([^`$]+)`\}/g)].map((m) => m[1]);
    expect(drawn.length).toBeGreaterThan(0);
    const versioned = `${OG_IMAGE_ALT}|${OG_IMAGE_TAGLINE}`.toLowerCase();
    for (const line of drawn) {
      expect(versioned, `card text "${line}" is not in the alt or tagline`).toContain(
        line.toLowerCase(),
      );
    }
  });
});

describe("withCanonicalOpenGraph", () => {
  it("names the site and locale, which the root cannot supply once a route declares openGraph", () => {
    const meta = withCanonicalOpenGraph({
      title: "Breath",
      description: "A description.",
      alternates: { canonical: "https://sing.suedeai.ai/breath" },
    });
    expect(meta.openGraph).toMatchObject({
      siteName: OG_SITE_NAME,
      locale: OG_LOCALE,
      url: "https://sing.suedeai.ai/breath",
      images: [DEFAULT_OG_IMAGE],
    });
  });

  it("lets a route's own openGraph fields win, except the canonical URL", () => {
    const meta = withCanonicalOpenGraph({
      title: "Song",
      alternates: { canonical: "https://sing.suedeai.ai/songs/x" },
      openGraph: { type: "article", siteName: "Other", url: "https://elsewhere.example/" },
    });
    expect(meta.openGraph).toMatchObject({
      type: "article",
      siteName: "Other",
      url: "https://sing.suedeai.ai/songs/x",
    });
  });
});
