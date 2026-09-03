import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { DEFAULT_PROGRESS, type VocalRange } from "@/lib/progress-shape";
import { POP_SONGS } from "@/lib/pop-songs";

const state = vi.hoisted(() => ({ range: {} as VocalRange, pro: false, ready: true }));
vi.mock("@/lib/progress", () => ({
  useProgress: () => ({ ...DEFAULT_PROGRESS, range: state.range }),
}));
vi.mock("@/lib/pro", () => ({
  useIsPro: () => state.pro,
  useProReady: () => state.ready,
}));

import { CanYouSingVerdict } from "./verdict";

const song = POP_SONGS.find((s) => s.slug === "espresso")!;
const render = () => renderToStaticMarkup(<CanYouSingVerdict song={song} />);

describe("song comparison to first practice", () => {
  beforeEach(() => {
    state.range = {};
    state.pro = false;
    state.ready = true;
  });

  it("keeps the range test first with no personal recommendation or upsell before a complete range", () => {
    for (const range of [{}, { lowMidi: 50 }, { highMidi: 72 }]) {
      state.range = range;
      const html = render();
      expect(html).toContain('href="/range"');
      expect(html).toContain("Find your range free");
      expect(html).not.toContain("Your first practice");
      expect(html).not.toContain('href="/pro');
    }
  });

  it.each([
    ["fits", { lowMidi: 52, highMidi: 72 }, "/songs?song=", "public-domain", "practice history"],
    ["high", { lowMidi: 48, highMidi: 64 }, "/warmups?exercise=ng-siren-fifth", "Ng siren to the fifth", "Head-voice builder"],
    ["low", { lowMidi: 58, highMidi: 76 }, "/warmups?exercise=descending-five", "Descending five", "daily plan"],
    ["wide", { lowMidi: 60, highMidi: 73 }, "/warmups?exercise=humming-thirds", "Humming thirds", "range tests over time"],
  ] as const)("gives %s a specific free step before a relevant optional Pro path", (_verdict, range, href, exercise, benefit) => {
    state.range = range;
    const html = render();
    expect(html).toContain('aria-label="Your first practice"');
    expect(html).toContain(`href="${href}`);
    expect(html).toContain(exercise);
    expect(html).toContain(benefit);
    expect(html).toContain('href="/pro#plans"');
    expect(html.indexOf(`href="${href}`)).toBeLessThan(html.indexOf('href="/pro#plans"'));
    expect(html).toContain("commonly cited studio-version range");
    expect(html).toContain("not a judgment of your voice");
    expect(html).not.toContain("Extend it with warmups");
    expect(html).not.toContain("extending your range is the move");
  });

  it("offers a comfortable single-note practice when the saved range cannot hold a ladder", () => {
    state.range = { lowMidi: 60, highMidi: 64 };
    const html = render();
    expect(html).toContain('href="/studio"');
    expect(html).not.toContain('href="/warmups?exercise=');
    expect(html).toContain("comfortable note");
    expect(html).toContain("no key change");
  });

  it.each(["member", "loading"])("keeps free practice available without an upsell for %s entitlement", (mode) => {
    state.range = { lowMidi: 52, highMidi: 72 };
    state.pro = mode === "member";
    state.ready = mode !== "loading";
    const html = render();
    expect(html).toContain('href="/songs?song=');
    expect(html).not.toContain('href="/pro');
  });
});
