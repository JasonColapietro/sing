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

import { BreathStudio } from "./breath-studio";

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
