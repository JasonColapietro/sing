import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { APP_STORE_URL, PLAY_STORE_URL } from "@/lib/app-store";
import VoicePage, { metadata } from "./page";

const html = renderToStaticMarkup(<VoicePage />);

/** Every `twitter: { … }` object literal in a source file, braces matched. */
function twitterBlocks(src: string): string[] {
  const blocks: string[] = [];
  for (const m of src.matchAll(/twitter:\s*\{/g)) {
    let depth = 0;
    const start = m.index + m[0].length - 1;
    for (let i = start; i < src.length; i++) {
      if (src[i] === "{") depth++;
      else if (src[i] === "}" && --depth === 0) {
        blocks.push(src.slice(start, i + 1));
        break;
      }
    }
  }
  return blocks;
}

describe("/voice, the app download page", () => {
  it("puts both store buttons in the hero, ahead of the link away to the browser test", () => {
    const appStore = html.indexOf(`href="${APP_STORE_URL}"`);
    const play = html.indexOf(`href="${PLAY_STORE_URL}"`);
    const test = html.indexOf('href="/range?mode=range#start"');
    expect(appStore).toBeGreaterThan(-1);
    expect(play).toBeGreaterThan(-1);
    expect(appStore).toBeLessThan(test);
    expect(play).toBeLessThan(test);
    // The phone row is hidden where the desktop card already sits beside the hero.
    expect(html).toMatch(/<div class="[^"]*\blg:hidden\b[^"]*"><a[^>]*href="https:\/\/apps\.apple\.com/);
  });

  it("states the free plan as every other page does", () => {
    expect(html).toContain("warmups, ear training, breath and songs for 5 free minutes of guided practice a day");
    expect(html).toContain("recorder and tools with no daily clock");
    expect(html).not.toContain("adds its own practice tools, on-device recordings");
  });

  it("leaves twitter:image to the versioned file-convention card, with its alt and size", () => {
    // An explicit twitter.images switches off Next's copy of the og image, and
    // shipped a bare, unversioned URL with no twitter:image:alt.
    expect(metadata.twitter).toBeDefined();
    expect(metadata.twitter).not.toHaveProperty("images");
  });

  it("is not undone on another route: no app metadata hand-writes twitter.images", () => {
    // Next copies the file-convention og image into twitter:image only when
    // twitter.images is absent, so one hand-written array anywhere brings back
    // the bare, unversioned card with no alt text.
    const sources: string[] = [];
    const walk = (dir: string) => {
      for (const entry of readdirSync(dir, { withFileTypes: true })) {
        const path = join(dir, entry.name);
        if (entry.isDirectory()) walk(path);
        else if (/^(page|layout)\.tsx?$/.test(entry.name)) sources.push(path);
      }
    };
    walk(join(process.cwd(), "app"));
    expect(sources.length).toBeGreaterThan(10);
    let scanned = 0;
    for (const file of sources) {
      for (const block of twitterBlocks(readFileSync(file, "utf8"))) {
        scanned++;
        expect(block, file).not.toMatch(/\bimages\s*:/);
      }
    }
    // /, /voice, /range, /extension, /changelog and the voice-type table.
    expect(scanned).toBeGreaterThanOrEqual(6);
    // The scan sees through template-literal braces, as in the line it replaced.
    const old = "twitter: {\n  card: \"summary_large_image\",\n  images: [`${PAGE_URL}/opengraph-image`],\n},";
    expect(twitterBlocks(old).join("")).toMatch(/\bimages\s*:/);
  });
});
