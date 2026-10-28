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

/** The recommendation card, which sits above the "Breath routines" grid. */
function startCard(html: string): string {
  return html.slice(0, html.indexOf("Breath routines"));
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
    expect(html).toContain("Free guided practice is 5 minutes a day: the quick one fits");
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
