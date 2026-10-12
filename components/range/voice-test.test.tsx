import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

const location = vi.hoisted(() => ({ search: "", suspend: false }));

vi.mock("next/navigation", () => ({
  // `suspend` stands in for the static prerender, where useSearchParams
  // bails the boundary out to client rendering and the HTML is the fallback.
  useSearchParams: () => {
    if (location.suspend) throw new Promise(() => {});
    return new URLSearchParams(location.search);
  },
}));
vi.mock("./pitch-meter", () => ({
  PitchMeter: () => <div data-tool="pitch">Pitch meter</div>,
}));
vi.mock("./range-test", () => ({
  RangeTest: () => <div data-tool="range">Start free range test</div>,
}));

import { VoiceTest, switchVoiceTestMode, voiceTestModeUrl } from "./voice-test";

describe("voice-tool deep links", () => {
  it.each([
    ["", "pitch"],
    ["?mode=pitch", "pitch"],
    ["?mode=range", "range"],
    ["?compare=bruno-mars", "range"],
    ["?mode=range&compare=bruno-mars", "range"],
    ["?mode=pitch&compare=bruno-mars", "pitch"],
    ["?mode=unknown", "pitch"],
    ["?compare=", "pitch"],
  ])("opens %s in the promised %s tool", (search, expected) => {
    location.search = search;
    const html = renderToStaticMarkup(<VoiceTest />);
    expect(html).toContain(`data-tool="${expected}"`);
    expect(html).not.toContain(`data-tool="${expected === "pitch" ? "range" : "pitch"}"`);
  });

  it("anchors #start on the mode tabs so start links land on the tool", () => {
    for (const search of ["", "?mode=range"]) {
      location.search = search;
      const html = renderToStaticMarkup(<VoiceTest />);
      expect(html).toMatch(/<div[^>]*id="start"[^>]*role="tablist"/);
    }
  });

  it("prerenders the pitch meter's card as the fallback, so hydration does not grow the box", () => {
    // A one-line "Loading voice tools…" here was ~400px shorter than the
    // meter, and the swap shifted the page (CLS 0.17 at 375px, e2e/cls.mjs).
    location.search = "";
    location.suspend = true;
    try {
      const html = renderToStaticMarkup(<VoiceTest />);
      // The fallback's tabs are inert until the live tree replaces it.
      expect(html).toMatch(/<button[^>]*role="tab"[^>]*disabled/);
      expect(html).toContain('data-tool="pitch"');
      expect(html).not.toContain("Loading voice tools");
      expect(html).toMatch(/<div[^>]*id="start"[^>]*role="tablist"/);
    } finally {
      location.suspend = false;
    }
  });

  it("brings the range test's start button into view when the tab opens it", () => {
    // The intro says "Choose Range test to start"; at 375px the start button
    // that tab reveals sat under the bottom tab bar until the page scrolled.
    const change = vi.fn();
    const scroll = vi.fn();
    switchVoiceTestMode("pitch", "range", change, scroll);
    expect(change).toHaveBeenCalledWith("range");
    expect(scroll).toHaveBeenCalledTimes(1);

    // Re-tapping the open tab, or going back to pitch, leaves the page alone.
    switchVoiceTestMode("range", "range", change, scroll);
    switchVoiceTestMode("range", "pitch", change, scroll);
    expect(change).toHaveBeenLastCalledWith("pitch");
    expect(scroll).toHaveBeenCalledTimes(1);
  });

  it("keeps the singer comparison when switching to pitch and back", () => {
    const pitch = voiceTestModeUrl("https://sing.example/range?compare=bruno-mars#voice", "pitch");
    expect(pitch.searchParams.get("mode")).toBe("pitch");
    expect(pitch.searchParams.get("compare")).toBe("bruno-mars");
    expect(pitch.hash).toBe("#voice");

    const range = voiceTestModeUrl(pitch.href, "range");
    expect(range.searchParams.get("mode")).toBe("range");
    expect(range.searchParams.get("compare")).toBe("bruno-mars");
  });
});
