import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Every opening <Link …> or <LinkButton …> tag in a source file, read up to
 * the `>` that closes it outside any `{…}` expression.
 */
function openingTags(src: string): string[] {
  const tags: string[] = [];
  const start = /<(Link|LinkButton)\b/g;
  for (let m = start.exec(src); m; m = start.exec(src)) {
    let depth = 0;
    let i = m.index + m[0].length;
    for (; i < src.length; i++) {
      const c = src[i];
      if (c === "{") depth++;
      else if (c === "}") depth--;
      else if (c === ">" && depth === 0) break;
    }
    tags.push(src.slice(m.index, i + 1));
  }
  return tags;
}

/** A link into a hub (whose payload is its whole chart) or a singer profile. */
const HEAVY_TARGET = /href=\{`\/singers\/(voice-type\/|genre\/|\$\{)/;

/**
 * Rounds 1-2 turned prefetch off on /singers, the hub charts, the records
 * page and /atlas: a visible next/link fetches its target's payload in the
 * background. The singer page template and the voice-type reference were
 * missed, and scrolling /singers/adele made 53 background requests, about
 * 2 MB decoded, mostly whole hub charts nobody opened.
 */
describe("singer and hub pages do not prefetch other hubs and profiles", () => {
  const files = [
    "app/singers/[slug]/page.tsx",
    "app/atlas/vocal-range-by-voice-type/page.tsx",
    "app/singers/voice-type/[type]/page.tsx",
    "app/singers/genre/[genre]/page.tsx",
  ];

  it.each(files)("%s", (file) => {
    const src = readFileSync(path.join(process.cwd(), file), "utf8");
    const heavy = openingTags(src).filter((tag) => HEAVY_TARGET.test(tag));
    expect(heavy.length).toBeGreaterThan(0);
    const prefetching = heavy.filter((tag) => !/prefetch=\{false\}/.test(tag));
    expect(prefetching, "add prefetch={false}").toEqual([]);
  });

  it("lets a LinkButton opt out of prefetch", () => {
    const ui = readFileSync(path.join(process.cwd(), "components/ui.tsx"), "utf8");
    expect(ui).toMatch(/<Link href=\{href\} prefetch=\{prefetch\}/);
  });
});
