import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { FreeCap } from "@/lib/free-cap";
import { routineById } from "./routines";

const state = vi.hoisted(() => ({
  cap: { isPro: false, usedSec: 0, leftSec: 300, capped: false, capSec: 300 } as FreeCap,
  pro: false,
  ready: true,
}));

vi.mock("@/lib/free-cap", async (importOriginal) => ({
  ...await importOriginal<typeof import("@/lib/free-cap")>(),
  useFreeCap: () => state.cap,
}));

vi.mock("@/lib/pro", async (importOriginal) => ({
  ...await importOriginal<typeof import("@/lib/pro")>(),
  useIsPro: () => state.pro,
  useProReady: () => state.ready,
}));

import { WarmupsClient } from "./warmups-client";

const morning = routineById("morning")!;
const daily = routineById("daily")!;

/** The "Today's warmup" card's title: the h2 right after its kicker. */
function todaysWarmup(html: string): string | undefined {
  const at = html.indexOf("Today&#x27;s warmup");
  return html.slice(at).match(/<h2[^>]*>([^<]*)<\/h2>/)?.[1];
}

beforeEach(() => {
  state.cap = { isPro: false, usedSec: 0, leftSec: 300, capped: false, capSec: 300 };
  state.pro = false;
  state.ready = true;
});

describe("today's warmup on the free plan", () => {
  it("recommends a set that finishes inside the free minutes, and says so", () => {
    const html = renderToStaticMarkup(<WarmupsClient />);
    expect(todaysWarmup(html)).toBe(morning.name);
    expect(html).toContain("Fits in today&#x27;s 5 free minutes.");
  });

  it("names the time left when part of the allowance is used", () => {
    state.cap = { isPro: false, usedSec: 30, leftSec: 270, capped: false, capSec: 300 };
    const html = renderToStaticMarkup(<WarmupsClient />);
    expect(todaysWarmup(html)).toBe(morning.name);
    expect(html).toContain("Fits in the 4:30 of free practice left today.");
  });

  it("names no free minutes before the entitlement is read", () => {
    // The prerender: a Pro singer sees this HTML until hydration.
    state.ready = false;
    const html = renderToStaticMarkup(<WarmupsClient />);
    expect(todaysWarmup(html)).toBe(morning.name);
    expect(html).not.toContain("free minutes");
    expect(html).not.toContain("free practice left");
  });

  it("keeps the full recommendation on Pro", () => {
    state.pro = true;
    state.cap = { isPro: true, usedSec: 0, leftSec: Number.POSITIVE_INFINITY, capped: false, capSec: 300 };
    const html = renderToStaticMarkup(<WarmupsClient />);
    expect(todaysWarmup(html)).toBe(daily.name);
    expect(html).not.toContain("free minutes");
  });
});

describe("the warmups mic gate", () => {
  it("describes a ladder that climbs and comes back down", () => {
    const html = renderToStaticMarkup(<WarmupsClient />);
    expect(html).toContain('id="warmup-gate"');
    expect(html).not.toContain("The key climbs a semitone every rep");
    expect(html).toContain("most exercises climb and");
  });
});
