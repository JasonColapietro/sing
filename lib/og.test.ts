import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { DEFAULT_OG_IMAGE, OG_IMAGE_ALT, OG_IMAGE_SIZE } from "@/lib/og";

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

  it("points at an absolute URL, since crawlers do not resolve relative ones", () => {
    expect(DEFAULT_OG_IMAGE.url).toMatch(/^https:\/\//);
    expect(DEFAULT_OG_IMAGE.url.endsWith("/opengraph-image")).toBe(true);
  });
});
