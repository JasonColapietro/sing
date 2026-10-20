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

/**
 * A link into a hub (whose payload is its whole chart), a singer profile, the
 * /singers directory or the /atlas index.
 */
const HEAVY_TARGET = /href=(?:\{`\/singers\/(?:voice-type\/|genre\/|\$\{)|"\/(?:singers|atlas)")/;

/**
 * Rounds 1-2 turned prefetch off on /singers, the hub charts, the records
 * page and /atlas: a visible next/link fetches its target's payload in the
 * background. The singer page template and the voice-type reference were
 * missed, and scrolling /singers/adele made 53 background requests, about
 * 2 MB decoded, mostly whole hub charts nobody opened.
 *
 * Literal links to /singers (the 230 KB directory) and /atlas (332 KB) count
 * too; round 11's byline link to /atlas fetched it on every load of the
 * voice-type reference. The intro lines on /singers and /atlas, which point
 * each at the other, fetched the other's whole payload the same way.
 */
describe("singer and hub pages do not prefetch other hubs and profiles", () => {
  const files = [
    "app/singers/[slug]/page.tsx",
    "app/atlas/vocal-range-by-voice-type/page.tsx",
    "app/singers/voice-type/[type]/page.tsx",
    "app/singers/genre/[genre]/page.tsx",
    "app/singers/records/page.tsx",
    "app/singers/methodology/page.tsx",
    "app/singers/page.tsx",
    "app/atlas/page.tsx",
  ];

  it.each(files)("%s", (file) => {
    const src = readFileSync(path.join(process.cwd(), file), "utf8");
    const heavy = openingTags(src).filter((tag) => HEAVY_TARGET.test(tag));
    expect(heavy.length).toBeGreaterThan(0);
    const prefetching = heavy.filter((tag) => !/prefetch=\{false\}/.test(tag));
    expect(prefetching, "add prefetch={false}").toEqual([]);
  });

  it("app/singers/[slug]/page.tsx breadcrumb back to /singers", () => {
    // The crumb's href is a variable, so HEAVY_TARGET cannot see it; with
    // only "← All singers" fixed, the crumb still fetched /singers at load.
    const src = readFileSync(path.join(process.cwd(), "app/singers/[slug]/page.tsx"), "utf8");
    expect(src).toMatch(/href: "\/singers", url:/);
    const crumbs = openingTags(src).filter((tag) => /href=\{breadcrumb\.href\}/.test(tag));
    expect(crumbs).toHaveLength(1);
    expect(crumbs[0], "add prefetch={false}").toMatch(/prefetch=\{false\}/);
  });

  it("components/nav.tsx Singers tab, in the header row and the drawer", () => {
    // The header row is on screen at 640px and wider and its links are built
    // from LINKS, so HEAVY_TARGET cannot see them: the Singers tab fetched
    // the directory on every page. LINKS carries the flag, and every Link
    // the list renders must pass it on.
    const src = readFileSync(path.join(process.cwd(), "components/nav.tsx"), "utf8");
    expect(src).toMatch(/\{ href: "\/singers", label: "Singers", prefetch: false \}/);
    const fromList = openingTags(src).filter((tag) => /href=\{l\.target \?\? l\.href\}/.test(tag));
    expect(fromList).toHaveLength(2);
    for (const tag of fromList) expect(tag, "pass prefetch={l.prefetch}").toMatch(/prefetch=\{l\.prefetch\}/);
    // No literal link to the directory or the atlas elsewhere in the nav.
    expect(openingTags(src).filter((tag) => HEAVY_TARGET.test(tag))).toEqual([]);
  });

  it("lets a LinkButton opt out of prefetch", () => {
    const ui = readFileSync(path.join(process.cwd(), "components/ui.tsx"), "utf8");
    expect(ui).toMatch(/<Link href=\{href\} prefetch=\{prefetch\}/);
  });
});
