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

import { VoiceTest, mountScroll, switchVoiceTestMode, voiceTestModeUrl, type BeforeSwap } from "./voice-test";
import { returnSongSlugFromSearch } from "./result-view";
import { rangeTestHref, type RangeTestLink } from "@/lib/site";

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
    // that tab reveals sat below the fold until the page scrolled.
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

  // The page just before the swap at 1280px, where the prerendered tool ends
  // at 765: the fragment's #start, a reader 400px down the result, and one
  // down in the guide, whom Chrome restored 317px short (4173 - 317).
  const atStart: BeforeSwap = { scrollY: 173, toolBottom: 765 };
  const inTool: BeforeSwap = { scrollY: 573, toolBottom: 765 };
  const belowTool: BeforeSwap = { scrollY: 3854, toolBottom: 765 };

  it("lines #start up again once the live tool replaces the prerendered one", () => {
    // A direct load of /range?mode=range#start at 768px and up left the tabs
    // 5px under the header, and a returning singer's saved card pushed them
    // and their Retake test above the screen (scrollY 490).
    expect(mountScroll("#start", "navigate", atStart)).toBe("start");
    // Any other landing is left where the browser put it.
    expect(mountScroll("", "navigate", inTool)).toBeNull();
    expect(mountScroll("#voice", "navigate", inTool)).toBeNull();
  });

  it("keeps a reloading reader's place instead", () => {
    // Lining up snapped a reader 400px down the result back to the tabs
    // (573 -> 173), and the swap alone carried them on to 890.
    expect(mountScroll("#start", "reload", inTool)).toEqual({ restore: 573 });
    // Down in the guide Chrome restored against the guide, 317px short, and
    // the swap's shift is what lands them (3854 -> 4171).
    expect(mountScroll("#start", "reload", belowTool)).toBeNull();
    // Past the prerendered tool it cannot be told which restore happened, so
    // the browser keeps it, from the tool's bottom edge on.
    expect(mountScroll("#start", "reload", { scrollY: 873, toolBottom: 765 })).toBeNull();
    expect(mountScroll("#start", "reload", { scrollY: 765, toolBottom: 765 })).toBeNull();
    // A reader at the top is put back at the top.
    expect(mountScroll("#start", "reload", { scrollY: 0, toolBottom: 765 })).toEqual({ restore: 0 });
  });

  /** How each load treats the scroll as the live tool replaces the fallback. */
  it.each<[string, NavigationTimingType | undefined, "start" | "restore"]>([
    ["an arrival", "navigate", "start"],
    ["a prerendered arrival", "prerender", "start"],
    // Without Navigation Timing it is an arrival, as before the check.
    ["a browser without Navigation Timing", undefined, "start"],
    // These bring back the reader's own position, whatever the hash.
    ["a reload", "reload", "restore"],
    ["a document Back or Forward", "back_forward", "restore"],
  ])("%s (%s) gives %s", (_, type, kind) => {
    for (const hash of ["#start", "", "#voice", "#start-singing"]) {
      const scroll = mountScroll(hash, type, inTool);
      if (kind === "restore") expect(scroll).toEqual({ restore: 573 });
      else expect(scroll).toBe(hash === "#start" ? "start" : null);
      // Below the tool only an arrival at #start moves.
      expect(mountScroll(hash, type, belowTool)).toBe(kind === "start" && hash === "#start" ? "start" : null);
      // A client-side mount replaced nothing: the router scrolls a link to
      // #start, and Back is the browser's.
      expect(mountScroll(hash, type, null)).toBeNull();
    }
  });

  it("renders live tabs that are not inert, so only the fallback reads as replaced", () => {
    // readBeforeSwap looks for #start's disabled tabs; the fallback test
    // above shows the prerender has them.
    for (const search of ["", "?mode=range"]) {
      location.search = search;
      const html = renderToStaticMarkup(<VoiceTest />);
      expect(html).toMatch(/<button[^>]*role="tab"/);
      expect(html).not.toMatch(/<button[^>]*role="tab"[^>]*disabled/);
    }
  });

  /**
   * rangeTestHref (lib/site.ts) is how every page links here. Each link it
   * builds has to open the tool it asks for, on the #start anchor above, and
   * keep the song or singer the result reads.
   */
  it.each<[RangeTestLink, string, string]>([
    [{}, "/range?mode=range#start", "range"],
    [{ mode: "pitch" }, "/range#start", "pitch"],
    [{ compare: "adele" }, "/range?compare=adele#start", "range"],
    [{ compare: "adele", mode: "pitch" }, "/range?mode=pitch&compare=adele#start", "pitch"],
    [{ check: "espresso" }, "/range?mode=range&check=espresso#start", "range"],
  ])("rangeTestHref(%o) is %s and opens the %s tool", (link, href, tool) => {
    expect(rangeTestHref(link)).toBe(href);
    const url = new URL(href, "https://sing.example");
    expect(url.pathname).toBe("/range");
    expect(url.hash).toBe("#start");
    location.search = url.search;
    const html = renderToStaticMarkup(<VoiceTest />);
    expect(html).toContain(`data-tool="${tool}"`);
    expect(html).toMatch(/<div[^>]*id="start"[^>]*role="tablist"/);
    if (link.compare) expect(url.searchParams.get("compare")).toBe(link.compare);
    if (link.check) expect(returnSongSlugFromSearch(url.search)).toBe(link.check);
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
