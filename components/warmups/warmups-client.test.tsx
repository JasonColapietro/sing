import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { FreeCap } from "@/lib/free-cap";
import { DEFAULT_PROGRESS, type ProgressState } from "@/lib/progress-shape";
import { routineById } from "./routines";

const state = vi.hoisted(() => ({
  cap: { isPro: false, usedSec: 0, leftSec: 300, capped: false, capSec: 300 } as FreeCap,
  pro: false,
  ready: true,
  progress: null as ProgressState | null,
}));

vi.mock("@/lib/progress", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/progress")>();
  return {
    ...actual,
    useProgress: () => state.progress ?? actual.useProgress(),
  };
});

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
  state.progress = null;
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

describe("the first card a newcomer sees", () => {
  it("does not offer a path to continue to someone who has never sung a warmup", () => {
    const html = renderToStaticMarkup(<WarmupsClient />);
    expect(html).toContain("Start here");
    expect(html).not.toContain("Continue your path");
    // Its start opens one endless ladder; the card says so, and where the
    // sets that end on their own are.
    expect(html).toContain("it keeps going until you press End");
  });

  it("keeps 'Continue your path' for a singer with warmups behind them", () => {
    state.progress = {
      ...DEFAULT_PROGRESS,
      sessions: [
        { id: "s1", type: "warmup", date: "2026-09-01T09:00:00.000Z", day: "2026-09-01", durationSec: 120, score: 70, detail: "First hum", xp: 20 },
      ],
    };
    const html = renderToStaticMarkup(<WarmupsClient />);
    expect(html).toContain("Continue your path");
    expect(html).not.toContain("it keeps going until you press End");
  });

  it("claims only that the audio stays on the device", () => {
    const html = renderToStaticMarkup(<WarmupsClient />);
    expect(html).toContain("your audio never leaves this device");
    expect(html).not.toContain("nothing leaves this device");
  });
});
