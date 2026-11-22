import { readFileSync } from "node:fs";
import { join } from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import Home from "@/app/page";
import { BOOKS, PRO_SHOWCASE_HREF } from "@/lib/pro-inventory";
import { TAKE_SAMPLE_LABEL } from "@/components/pro/take-sample";
import { HeroSplit } from "./hero-split";
import { ProExhibits } from "./pro-exhibits";
import { PRO_TEASER_ID } from "./pro-teaser-link";

const read = (html: string) => html.replace(/&#x27;/g, "'").replace(/&quot;/g, '"').replace(/&amp;/g, "&");
const text = (html: string) => read(html.replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ");

/** Every anchor as [opening tag, href, visible text]. */
function anchors(html: string) {
  return [...html.matchAll(/(<a\b[^>]*href="([^"]*)"[^>]*>)([\s\S]*?)<\/a>/g)].map((m) => ({
    tag: m[1],
    href: m[2],
    label: text(m[3]).trim(),
  }));
}

describe("the homepage teaser shows what Pro adds", () => {
  const exhibits = renderToStaticMarkup(<ProExhibits />);

  it("labels the drawn takes as a sample", () => {
    expect(exhibits).toContain(TAKE_SAMPLE_LABEL);
    expect(text(exhibits)).toContain("The pitch line of each take, and two takes overlaid.");
  });

  it("leaves the books to the teaser's list: no cover cards, and nothing to tab through", () => {
    // Two cover cards stood here for one revision. The teaser's list already
    // gives both books' chapters and words, the titles wrapped badly in half
    // a column, and on a phone the cards pushed the room directory down a
    // screen. /pro's showcase draws the covers.
    for (const book of BOOKS) expect(text(exhibits)).not.toContain(book.title);
    expect(exhibits).not.toMatch(/<a\b|<button\b|<ul\b/);
    expect(exhibits.match(/<svg/g)).toHaveLength(1);
  });

  it("states no price and makes no promise the repo cannot keep", () => {
    expect(exhibits).not.toMatch(/\$\d/);
    expect(exhibits).not.toMatch(/guarantee|refund|limited|% off|rated|reviews?\b|singers trust/i);
  });

  it("sends the teaser's one look-first link to /pro's showcase", () => {
    // "See Pro on a sample voice" was a third link under the exhibits; the
    // teaser's existing secondary button now goes where it went.
    const home = renderToStaticMarkup(<Home />);
    expect(home).not.toContain("See Pro on a sample voice");
    const links = anchors(home).filter((a) => a.label === "See everything Pro adds");
    expect(links).toHaveLength(1);
    expect(links[0].href).toBe(PRO_SHOWCASE_HREF);
    expect(PRO_SHOWCASE_HREF).toBe("/pro#showcase");
  });

  it("top-aligns the teaser's two columns", () => {
    const home = renderToStaticMarkup(<Home />);
    const teaser = home.slice(home.indexOf(`id="${PRO_TEASER_ID}"`));
    expect(teaser.slice(0, teaser.indexOf("<h2"))).toContain("grid items-start gap-8 lg:grid-cols-2");
  });

  it("imports no book contents, charts, progress store or singer table", () => {
    for (const file of ["pro-exhibits.tsx", "pro-teaser-link.tsx"]) {
      const src = readFileSync(join(process.cwd(), "components/landing", file), "utf8");
      expect(src, file).not.toMatch(/from "@\/lib\/(progress|book-data|atlas-data|singers)[^"]*"/);
      expect(src, file).not.toMatch(/from "@\/components\/progress\//);
      expect(src, file).not.toContain('"use client"');
    }
  });
});

describe("the homepage's route to the Pro teaser", () => {
  const home = renderToStaticMarkup(<Home />);
  const hero = renderToStaticMarkup(<HeroSplit />);

  it("puts the teaser straight after the starting paths, above the room grid", () => {
    const paths = home.indexOf("Start where you are");
    const teaser = home.indexOf(`id="${PRO_TEASER_ID}"`);
    const grid = home.indexOf("Open any room and sing");
    expect(paths).toBeGreaterThan(-1);
    expect(teaser).toBeGreaterThan(paths);
    expect(grid).toBeGreaterThan(teaser);
    expect(home.split(`id="${PRO_TEASER_ID}"`).length - 1).toBe(1);
    // The exhibits sit inside the teaser, before the grid.
    expect(home.indexOf(TAKE_SAMPLE_LABEL)).toBeGreaterThan(teaser);
    expect(home.indexOf(TAKE_SAMPLE_LABEL)).toBeLessThan(grid);
  });

  it("keeps the hero's two actions first and as its only buttons", () => {
    const links = anchors(hero).filter((a) => !a.href.startsWith("http") && a.href !== "/changelog");
    expect(links.map((a) => a.label)).toEqual(["Start singing", "Find my vocal range", "See what Pro adds to this"]);
    // The Pro link is text, not a button: no fill, no border.
    expect(links[2].tag).not.toMatch(/\bbg-|\bborder\b|rounded-/);
    expect(links[2].tag).toContain("min-h-11");
  });

  it("offers the quiet link twice, unpriced, hidden from a Pro browser before first paint", () => {
    const quiet = anchors(home).filter((a) => a.label === "See what Pro adds to this");
    expect(quiet).toHaveLength(2);
    for (const link of quiet) expect(link.href).toBe(`#${PRO_TEASER_ID}`);
    const marked = [...home.matchAll(/<p class="mt-[12]" data-prepaint-plan="not-pro"><a href="#pro"/g)];
    expect(marked).toHaveLength(2);
  });

  it("still asks for the purchase once: one priced button, landing on the buy card", () => {
    const priced = anchors(home).filter((a) => /\$\d/.test(a.label));
    expect(priced).toHaveLength(1);
    expect(priced[0].href).toBe("/pro#buy");
    // Every other Pro link on the page is a look, not an ask.
    const pro = anchors(home).filter((a) => /^\/pro(?:[#?]|$)/.test(a.href)).map((a) => a.href);
    expect([...new Set(pro)].sort()).toEqual(["/pro", "/pro#buy", "/pro#showcase"]);
  });
});
