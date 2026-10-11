import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

const location = vi.hoisted(() => ({ search: "" }));

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(location.search),
}));
vi.mock("./pitch-meter", () => ({
  PitchMeter: () => <div data-tool="pitch">Pitch meter</div>,
}));
vi.mock("./range-test", () => ({
  RangeTest: () => <div data-tool="range">Start free range test</div>,
}));

import { VoiceTest, voiceTestModeUrl } from "./voice-test";

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
