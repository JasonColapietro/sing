/**
 * Room-rail crawl guard.
 *
 * PR #60 folded the header from thirteen tabs to ten, and /recorder and
 * /analyze lost theirs. Their only remaining in-page entry was two text links
 * at the bottom of /tools, added as a crawl path rather than as something a
 * singer would find. The rail is what puts them back in front of someone who
 * is already practising, so the thing worth guarding is that it renders real
 * anchors in the *server* pass — the regression that quietly reopens the hole
 * is a rail that only appears after hydration, which no crawler and no
 * no-JS visitor ever sees.
 *
 * Mirrors lib/internal-linking.test.tsx: assertions run against the raw HTML
 * string from renderToStaticMarkup, never against the ROOMS data on its own,
 * because the data being right is not the failure mode.
 */
import { readdirSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ROOMS, RoomRail, RoomRailBand } from "./room-rail";

/**
 * Paths targeted by a real `<a href>` in a rendered HTML string.
 *
 * Anchored to the opening `<a` tag on purpose. A bare /href="..."/ also matches
 * `data-href="..."`, which made an earlier version of this guard pass against a
 * rail whose links had been downgraded to spans - the exact defect it is here
 * to catch.
 */
function linkedHrefs(html: string): string[] {
  return [...html.matchAll(/<a\b[^>]*?\shref="(\/[a-z0-9-]*)"/g)].map((m) => m[1]);
}

const appDir = fileURLToPath(new URL("../../app", import.meta.url));

describe("ROOMS points only at rooms that exist", () => {
  it("has a page.tsx behind every href", () => {
    const routes = new Set(
      readdirSync(appDir, { withFileTypes: true })
        .filter((e) => e.isDirectory() && !e.name.startsWith("("))
        .map((e) => `/${e.name}`),
    );
    const dead = ROOMS.filter((r) => !routes.has(r.href)).map((r) => r.href);
    // A rail is worse than no rail if it links somewhere that 404s, and the
    // Alto/Contralto bug proved this repo can ship exactly that.
    expect(dead).toEqual([]);
  });

  it("keeps every href backed by a real page file", () => {
    const missing = ROOMS.filter(
      (r) => !existsSync(`${appDir}${r.href}/page.tsx`),
    ).map((r) => r.href);
    expect(missing).toEqual([]);
  });

  it("names each room once", () => {
    expect(new Set(ROOMS.map((r) => r.href)).size).toBe(ROOMS.length);
    expect(new Set(ROOMS.map((r) => r.label)).size).toBe(ROOMS.length);
  });
});

describe("the rail server-renders real anchors", () => {
  it("surfaces the two tabless rooms by default", () => {
    const html = renderToStaticMarkup(<RoomRail />);
    const hrefs = linkedHrefs(html);
    // The entire reason the rail exists. If either falls out of the default
    // window, the rooms that lost their header tab are hidden again.
    expect(hrefs).toContain("/recorder");
    expect(hrefs).toContain("/analyze");
  });

  it("still reaches them from inside the rooms that crowd them out", () => {
    for (const current of ["/studio", "/warmups"]) {
      const hrefs = linkedHrefs(
        renderToStaticMarkup(<RoomRail current={current} />),
      );
      expect(hrefs).toContain("/recorder");
      expect(hrefs).toContain("/analyze");
    }
  });

  it("never links the room you are already in", () => {
    for (const room of ROOMS) {
      const html = renderToStaticMarkup(
        <RoomRail current={room.href} limit={ROOMS.length} />,
      );
      expect(linkedHrefs(html)).not.toContain(room.href);
    }
  });

  it("renders through the band wrapper the rooms actually use", () => {
    // The pages import RoomRailBand, not RoomRail, so the wrapper is the path
    // that has to stay crawlable.
    const hrefs = linkedHrefs(
      renderToStaticMarkup(<RoomRailBand current="/studio" />),
    );
    expect(hrefs).toContain("/recorder");
    expect(hrefs.length).toBeGreaterThan(0);
  });

  it("labels each link with the room name, not a bare icon", () => {
    const html = renderToStaticMarkup(<RoomRail limit={ROOMS.length} />);
    for (const room of ROOMS) expect(html).toContain(room.label);
  });
});
