import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { relatedLinkPrefetch } from "@/components/guide";
import { SING_GLOSSARY_TERMS } from "@/lib/glossary";
import { TOOL_GUIDES } from "@/lib/guides";

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

  /**
   * Round 12 fixed the files listed above, and the homepage hero, every atlas
   * chapter's "← Contents", /learn, /book, /glossary and the range result
   * kept fetching the directory or the atlas, because the list named only
   * singer and atlas pages. So every page and component is read here.
   *
   * A literal path under /singers counts too: a hub, the records ranking
   * (59 KB on scroll of /singers) or a named profile (/singers/olivia-rodrigo,
   * 45 KB on scroll of /singers/methodology). The methodology article is the
   * one ordinary page under /singers, so links to it keep Next's default.
   */
  it("no link to /singers, /atlas, a hub or a singer profile prefetches, anywhere in app/ or components/", () => {
    const walk = (dir: string): string[] =>
      readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
        const p = path.join(dir, e.name);
        if (e.isDirectory()) return walk(p);
        return e.name.endsWith(".tsx") && !e.name.endsWith(".test.tsx") ? [p] : [];
      });
    const literalUnderSingers = /href="\/singers\/(?!methodology["#?])/;
    const offenders = ["app", "components"]
      .flatMap((d) => walk(path.join(process.cwd(), d)))
      .flatMap((file) =>
        openingTags(readFileSync(file, "utf8"))
          .filter((tag) => HEAVY_TARGET.test(tag) || literalUnderSingers.test(tag))
          .filter((tag) => !/prefetch=\{false\}/.test(tag))
          .map((tag) => `${path.relative(process.cwd(), file)}: ${tag.replace(/\s+/g, " ").slice(0, 80)}`),
      );
    expect(offenders, "add prefetch={false}").toEqual([]);
  });

  it("app/atlas/[slug]/page.tsx try-it link, which is /singers on most chapters", () => {
    // The href is a variable (SINGERS_CHART), so the scan cannot see it.
    const src = readFileSync(path.join(process.cwd(), "app/atlas/[slug]/page.tsx"), "utf8");
    expect(src).toMatch(/const SINGERS_CHART = \{ href: "\/singers"/);
    const tryIt = openingTags(src).filter((tag) => /href=\{tryIt\.next\.href\}/.test(tag));
    expect(tryIt).toHaveLength(1);
    expect(tryIt[0], "add prefetch={false}").toMatch(/prefetch=\{false\}/);
  });

  it("app/page.tsx Famous ranges card, built from FEATURES", () => {
    const src = readFileSync(path.join(process.cwd(), "app/page.tsx"), "utf8");
    expect(src).toMatch(/href: "\/singers",[^}]*?prefetch: false,\s*\}/);
    const cards = openingTags(src).filter((tag) => /href=\{href\}/.test(tag));
    expect(cards).toHaveLength(1);
    expect(cards[0], "pass prefetch={prefetch}").toMatch(/prefetch=\{prefetch\}/);
  });

  it("app/glossary/page.tsx term link to /singers", () => {
    // The href is a variable, so the scan cannot see it.
    const src = readFileSync(path.join(process.cwd(), "app/glossary/page.tsx"), "utf8");
    const term = openingTags(src).filter((tag) => /href=\{entry\.href === "\/range"/.test(tag));
    expect(term).toHaveLength(1);
    expect(term[0]).toMatch(/prefetch=\{entry\.href === "\/singers" \? false : undefined\}/);
    // The flag names /singers alone, so a term pointing at /atlas, a hub or a
    // profile would prefetch it: widen the flag before adding one.
    const heavyHrefs = new Set(
      SING_GLOSSARY_TERMS.map((e) => e.href).filter((h) => /^\/(?:singers|atlas)(?:[/?#]|$)/.test(h)),
    );
    expect([...heavyHrefs]).toEqual(["/singers"]);
  });

  it("app/changelog/page.tsx story links ('Browse the singers')", () => {
    // Built from each story's links, so the scan cannot see the /singers one;
    // scrolling /changelog fetched the 235 KB directory.
    const src = readFileSync(path.join(process.cwd(), "app/changelog/page.tsx"), "utf8");
    expect(src).toMatch(/\{ href: "\/singers", text: "Browse the singers" \}/);
    expect(src).not.toMatch(/href: "\/atlas"/);
    const links = openingTags(src).filter((tag) => /href=\{l\.href\}/.test(tag));
    expect(links).toHaveLength(1);
    expect(links[0], "add prefetch={l.href === \"/singers\" ? false : undefined}").toMatch(
      /prefetch=\{l\.href === "\/singers" \? false : undefined\}/,
    );
  });

  it("components/pro/unlock-stack.tsx book title link (The Voice Atlas on /pro)", () => {
    // BookContents is handed href="/atlas", so the scan cannot see the Link
    // it renders; scrolling /pro fetched the 339 KB atlas contents.
    const src = readFileSync(path.join(process.cwd(), "components/pro/unlock-stack.tsx"), "utf8");
    expect(src).toMatch(/<BookContents[^>]*href="\/atlas"/);
    const titles = openingTags(src).filter((tag) => /href=\{href\}/.test(tag));
    expect(titles).toHaveLength(1);
    expect(titles[0], "add prefetch={href === \"/atlas\" ? false : undefined}").toMatch(
      /prefetch=\{href === "\/atlas" \? false : undefined\}/,
    );
    // For a Pro owner every chapter row of both books is a link: about 1 MB
    // of chapter payloads fetched as the list scrolls past.
    const rows = openingTags(src).filter((tag) => /href=\{`\$\{href\}\/\$\{entry\.slug\}`\}/.test(tag));
    expect(rows).toHaveLength(1);
    expect(rows[0], "add prefetch={owned ? false : undefined}").toMatch(/prefetch=\{owned \? false : undefined\}/);
  });

  it("components/discover/room-rail.tsx Famous ranges card", () => {
    // Built from ROOMS, so the scan cannot see the /singers entry.
    const src = readFileSync(path.join(process.cwd(), "components/discover/room-rail.tsx"), "utf8");
    expect(src).toMatch(/\{ href: "\/singers",[^}]*?prefetch: false \}/);
    const cards = openingTags(src).filter((tag) => /href=\{href === "\/range"/.test(tag));
    expect(cards).toHaveLength(1);
    expect(cards[0], "pass prefetch={prefetch}").toMatch(/prefetch=\{prefetch\}/);
  });

  it("components/range/result-view.tsx famous-company rows", () => {
    // Seven singer pages, each named by a function call the scan cannot see.
    const src = readFileSync(path.join(process.cwd(), "components/range/result-view.tsx"), "utf8");
    const rows = openingTags(src).filter((tag) => /href=\{singerCompareHref\(f\.slug\)\}/.test(tag));
    expect(rows).toHaveLength(1);
    expect(rows[0], "add prefetch={false}").toMatch(/prefetch=\{false\}/);
  });

  it("components/guide.tsx related cards (the /range guide links /singers)", () => {
    const src = readFileSync(path.join(process.cwd(), "components/guide.tsx"), "utf8");
    const cards = openingTags(src).filter((tag) => /href=\{link\.href\}/.test(tag));
    expect(cards).toHaveLength(1);
    expect(cards[0]).toMatch(/prefetch=\{relatedLinkPrefetch\(link\.href\)\}/);

    const related = TOOL_GUIDES.flatMap((g) => g.related.map((l) => l.href));
    expect(related).toContain("/singers");
    for (const href of ["/singers", "/atlas", "/singers/voice-type/tenor", "/singers/adele#you-vs", "/singers?q=a"]) {
      expect(relatedLinkPrefetch(href), href).toBe(false);
    }
    // An article or a room is not a chart: Next's default stands.
    for (const href of ["/atlas/vocal-range-by-voice-type", "/studio", "/singersongwriter"]) {
      expect(relatedLinkPrefetch(href), href).toBeUndefined();
    }
  });

  it("lets a LinkButton opt out of prefetch", () => {
    const ui = readFileSync(path.join(process.cwd(), "components/ui.tsx"), "utf8");
    expect(ui).toMatch(/<Link href=\{href\} prefetch=\{prefetch\}/);
  });
});
