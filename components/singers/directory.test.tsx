import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import SingersPage from "@/app/singers/page";
import { RETURN_SCOPES, pickReturnAnchor, readReturnTarget, withReturnTarget } from "./directory";

/**
 * Back to /singers brings the tapped link into view. The tap is kept on the
 * page's own history entry, so it is there whichever document handles the
 * Back: the one that recorded it, or a fresh load after the singer page was
 * reloaded (a popstate timestamp missed that case and landed in the footer).
 */
describe("the tap a Back returns to", () => {
  const next = { __NA: true, __PRIVATE_NEXTJS_INTERNALS_TREE: { tree: ["singers"] } };
  const target = { href: "/singers/annie-lennox", scope: "#singer-directory-results" } as const;

  it("is written into the entry beside Next's own state, and read back", () => {
    const state = withReturnTarget(next, target);
    expect(state.__NA).toBe(true);
    expect(state.__PRIVATE_NEXTJS_INTERNALS_TREE).toEqual(next.__PRIVATE_NEXTJS_INTERNALS_TREE);
    // History states are structured clones.
    expect(readReturnTarget(structuredClone(state))).toEqual(target);
  });

  it("is cleared without touching the rest of the entry", () => {
    const cleared = withReturnTarget(withReturnTarget(next, target), null);
    expect(cleared).toEqual(next);
    expect(readReturnTarget(cleared)).toBeNull();
  });

  it("keeps the height a link was left at, for a visitor who left by another link", () => {
    const left = { ...target, top: 82 };
    expect(readReturnTarget(structuredClone(withReturnTarget(next, left)))).toEqual(left);
    // A tapped link has no height to keep (it is centred), and a bad one is dropped.
    expect(readReturnTarget(withReturnTarget(next, target))).not.toHaveProperty("top");
    expect(readReturnTarget({ singersReturn: { ...target, top: "82" } })).not.toHaveProperty("top");
    expect(readReturnTarget({ singersReturn: { ...target, top: Number.NaN } })).not.toHaveProperty("top");
  });

  it("is absent on an entry nobody tapped from, or one written by something else", () => {
    expect(readReturnTarget(null)).toBeNull();
    expect(readReturnTarget(next)).toBeNull();
    expect(readReturnTarget({ singersReturn: { href: "/singers/adele", scope: "main" } })).toBeNull();
    expect(readReturnTarget({ singersReturn: { href: "https://example.com/", scope: target.scope } })).toBeNull();
  });
});

describe("/singers links below the chart", () => {
  it("each sit in a list Back can find them in again", () => {
    // Everything after the chart's slot moves when the chart mounts, so a
    // link there that no return scope covers came back to the footer: the
    // genre hubs, the records button and the methodology link did.
    const html = renderToStaticMarkup(<SingersPage />);
    const slot = html.indexOf('<div aria-hidden="true" class="min-h-screen"></div>');
    expect(slot, "the chart's server slot").toBeGreaterThan(-1);
    const below = html.slice(slot);
    const covered = /<section\b[^>]*data-singer-(?:search-priority|crawl-index|return)="[^"]*"[^>]*>[\s\S]*?<\/section>/g;
    const sections = below.match(covered) ?? [];
    for (const name of ['data-singer-return="browse"', 'data-singer-return="method"']) {
      expect(sections.some((sec) => sec.includes(name)), name).toBe(true);
      expect(RETURN_SCOPES, name).toContain(`[${name}]`);
    }
    const uncovered = below.replace(covered, "").match(/href="\/singers\/[^"]*"/g) ?? [];
    expect(uncovered).toEqual([]);
    // Non-vacuous: the covered sections hold the links that used to be lost.
    const all = sections.join("");
    expect(all).toContain('href="/singers/records"');
    expect(all).toContain('href="/singers/methodology"');
    expect(all).toMatch(/href="\/singers\/genre\/[^"]+"/);
  });
});

/**
 * Leaving from deep in the chart by a header tab, the menu or a footer link
 * came back 1,500px (1280 wide) to 3,300px (375 wide) further down, for the
 * same reason a tapped row used to. The list link on screen when the visitor
 * left is put back at the same height.
 */
describe("the link a departure by another link holds the view by", () => {
  const rows = "#singer-directory-results" as const;
  const link = (href: string, top: number, height = 40, scope: (typeof RETURN_SCOPES)[number] = rows) => ({
    href,
    scope,
    top,
    height,
  });

  it("is the first list link on screen below the header", () => {
    const anchor = pickReturnAnchor(
      [link("/singers/adele", -300), link("/singers/aretha-franklin", 40), link("/singers/ariana-grande", 82.4), link("/singers/bjork", 140)],
      72,
      667,
    );
    // 40px is under the 72px header; the next one down is the anchor.
    expect(anchor).toEqual({ href: "/singers/ariana-grande", scope: rows, top: 82 });
  });

  it("skips links laid out with no box (a collapsed list)", () => {
    expect(pickReturnAnchor([link("/singers/adele", 100, 0), link("/singers/bjork", 150)], 72, 667)?.href).toBe("/singers/bjork");
  });

  it("is none when no list is on screen: above the chart the browser's position holds", () => {
    expect(pickReturnAnchor([link("/singers/adele", 900), link("/singers/bjork", 1400)], 72, 667)).toBeNull();
    expect(pickReturnAnchor([], 72, 667)).toBeNull();
  });
});
