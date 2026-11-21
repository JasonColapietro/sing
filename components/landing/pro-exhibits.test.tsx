import { readFileSync } from "node:fs";
import { join } from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import Home from "@/app/page";
import { BOOKS } from "@/lib/pro-inventory";
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

/** The element that directly wraps the first anchor with this label. */
function wrapperOf(html: string, label: string): string {
  const at = html.indexOf(`>${label}</a>`);
  expect(at, `no link labelled "${label}"`).toBeGreaterThan(-1);
  const anchorStart = html.lastIndexOf("<a", at);
  const wrapperStart = html.lastIndexOf("<", anchorStart - 1);
  return html.slice(wrapperStart, anchorStart);
}

describe("the homepage teaser shows what Pro adds", () => {
  const exhibits = renderToStaticMarkup(<ProExhibits />);

  it("labels the drawn takes as a sample", () => {
    expect(exhibits).toContain(TAKE_SAMPLE_LABEL);
    expect(text(exhibits)).toContain("The pitch line of each take, and two takes overlaid.");
  });

  it("prints each book's chapters and words from the inventory, linked to the book", () => {
    expect(BOOKS).toHaveLength(2);
    for (const book of BOOKS) {
      expect(text(exhibits)).toContain(`${book.chapters} chapters ${book.words.toLocaleString("en-US")} words`);
      const link = anchors(exhibits).find((a) => a.href === book.href);
      expect(link?.label).toBe(book.title);
    }
  });

  it("states no price and makes no promise the repo cannot keep", () => {
    expect(exhibits).not.toMatch(/\$\d/);
    expect(exhibits).not.toMatch(/guarantee|refund|limited|% off|rated|reviews?\b|singers trust/i);
  });

  it("sends a free visitor to /pro's showcase, behind the not-pro marker", () => {
    const link = anchors(exhibits).find((a) => a.label === "See Pro on a sample voice");
    expect(link?.href).toBe("/pro#showcase");
    expect(wrapperOf(exhibits, "See Pro on a sample voice")).toContain('data-prepaint-plan="not-pro"');
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
