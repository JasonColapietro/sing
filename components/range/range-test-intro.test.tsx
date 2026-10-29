import { readFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/audio/use-pitch", () => ({
  usePitch: () => ({
    frame: { freq: null, note: null, volume: 0 },
    latest: { current: null },
    listening: false,
    error: null,
    start: async () => true,
    stop: () => {},
  }),
}));
vi.mock("@/lib/pro", () => ({ useIsPro: () => false, useProReady: () => true, getProState: () => ({ isPro: false }) }));
vi.mock("@/components/audio/audio-setup", () => ({ AudioSetup: () => null }));

import { RangeTest } from "./range-test";

describe("the range test's intro", () => {
  it("puts Start free range test above the example figure, on a phone's first screen", () => {
    const html = renderToStaticMarkup(<RangeTest embedded />);
    const button = html.indexOf(">Start free range test<");
    const figure = html.indexOf("What the test draws for you");
    expect(button).toBeGreaterThan(-1);
    expect(figure).toBeGreaterThan(button);
  });

  it("says Recovery week's reason to leave the test above its start button, client-side only, without blocking it", () => {
    // The server HTML has no note: the program is read after hydration.
    const html = renderToStaticMarkup(<RangeTest embedded />);
    expect(html).not.toContain("data-recovery-range-note");
    const src = readFileSync(new URL("./range-test.tsx", import.meta.url), "utf8");
    // The pitch meter's own probe and the coach's own words.
    expect(src).toContain("hydrated && stage === \"intro\" && programStored() ? (");
    expect(src).toContain("onRecovering={onRecovering}");
    expect(src).toContain("recoveryRangeNote(savedRange, recovery.name, recovery.at) ?? recoveryRangeLine(recovery.name)");
    const note = src.indexOf("data-recovery-range-note");
    const start = src.indexOf("Start free range test", note);
    expect(note).toBeGreaterThan(-1);
    expect(start).toBeGreaterThan(note);
    // The button stays live: nothing disables it on the note.
    expect(src.slice(note, start)).not.toContain("disabled");
  });
});
