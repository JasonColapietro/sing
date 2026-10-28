import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { FreeCap } from "@/lib/free-cap";

const state = vi.hoisted(() => ({
  cap: { isPro: false, usedSec: 0, leftSec: 300, capped: false, capSec: 300 } as FreeCap,
  ready: true,
}));

vi.mock("@/lib/free-cap", async (importOriginal) => ({
  ...await importOriginal<typeof import("@/lib/free-cap")>(),
  useFreeCap: () => state.cap,
}));

vi.mock("@/lib/pro", async (importOriginal) => ({
  ...await importOriginal<typeof import("@/lib/pro")>(),
  useProReady: () => state.ready,
}));

import { EMPTY_BREATH_BESTS } from "./store";
import { BreathStudio, drillTried } from "./breath-studio";

const FREE: FreeCap = { isPro: false, usedSec: 0, leftSec: 300, capped: false, capSec: 300 };
const PRO: FreeCap = { isPro: true, usedSec: 0, leftSec: Number.POSITIVE_INFINITY, capped: false, capSec: 300 };

/** The recommendation card, which sits above the "Breath sets" grid. */
function startCard(html: string): string {
  return html.slice(0, html.indexOf("Breath sets"));
}

beforeEach(() => {
  state.cap = FREE;
  state.ready = true;
});

describe("the breath room's first set", () => {
  it("recommends the quick set to a fresh free singer, the one that reaches its sustain score", () => {
    const html = renderToStaticMarkup(<BreathStudio />);
    expect(startCard(html)).toContain("Quick breath");
    expect(startCard(html)).not.toContain("Daily breath");
  });

  it("keeps the daily set for Pro, who has no daily limit", () => {
    state.cap = PRO;
    const html = renderToStaticMarkup(<BreathStudio />);
    expect(startCard(html)).toContain("Daily breath");
  });
});

describe("the breath sets lede", () => {
  it("tells a free singer which set fits in the free minutes", () => {
    const html = renderToStaticMarkup(<BreathStudio />);
    expect(html).toContain("Free guided practice is 5 minutes a day: the quick set fits");
  });

  it("names no limit to Pro, or before the plan is known", () => {
    state.cap = PRO;
    expect(renderToStaticMarkup(<BreathStudio />)).not.toContain("Free guided practice is");
    state.cap = FREE;
    state.ready = false;
    expect(renderToStaticMarkup(<BreathStudio />)).not.toContain("Free guided practice is");
  });
});

describe("a drill with a best but no star", () => {
  // Quick breath, finished: one minute of box (1 star), Farinelli to 8
  // (1 star), a 7-second sustain (no star: the first is at 10 seconds).
  const afterQuick = { sustainSec: 7, boxMinutes: 1, farinelliCap: 8, cueReps: 0 };

  it("counts as tried, by its best rather than its stars", () => {
    expect(drillTried("sustain", afterQuick)).toBe(true);
    expect(drillTried("cue", afterQuick)).toBe(false);
    expect(drillTried("box", EMPTY_BREATH_BESTS)).toBe(false);
  });
});

describe("the breath room on a deep link's first load", () => {
  // The server HTML, and every render until the room has read its address:
  // the front page behind the deep-link marker, then the screen-tall block
  // that takes its place when the pre-paint script found a link the room
  // will open (/breath?drill=box), so the drill opens over a page that
  // never painted the front page (components/prepaint.tsx).
  it("keeps the heading, holds the whole front page behind the marker, and ends on the slot", () => {
    const html = renderToStaticMarkup(<BreathStudio />);
    const marker = html.indexOf('<div data-prepaint-deeplink="breath">');
    expect(marker).toBeGreaterThan(html.indexOf("Breathing exercises for singers</h1>"));
    for (const part of ['id="free-cap"', "Free guided practice today", "Quick breath", "Breath sets", "Your breath path", "Why breath work"]) {
      expect(html.indexOf(part), part).toBeGreaterThan(marker);
    }
    expect(html).toMatch(
      /Why breath work[\s\S]*<\/div><div aria-hidden="true" class="min-h-screen" data-prepaint-slot="deeplink-breath"><\/div><\/main>$/,
    );
  });
});
