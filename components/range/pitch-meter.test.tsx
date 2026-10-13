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
vi.mock("@/lib/pro", () => ({ useIsPro: () => false, useProReady: () => true }));
vi.mock("@/components/audio/audio-setup", () => ({ AudioSetup: () => null }));

import { LastRun, PitchMeter } from "./pitch-meter";

describe("the pitch meter after Stop mic", () => {
  it("opens cold on the first-visit gate, with no run to report", () => {
    const html = renderToStaticMarkup(<PitchMeter onTryRange={() => {}} />);
    expect(html).toContain("Start singing");
    expect(html).not.toContain("Held so far");
  });

  it("keeps the notes held and says what the run saved", () => {
    const html = renderToStaticMarkup(<LastRun low={47} high={61} lastLog={{ xpGained: 8 }} onTryRange={() => {}} />);
    // "So far", not "your last run": Sing again keeps the notes of earlier
    // runs, the same running measurement the live readout shows.
    expect(html).toContain("You have held B2 to C#4 so far.");
    expect(html).not.toContain("last run");
    expect(html).toContain("+8 XP, saved to your progress.");
    // Explored enough for the guided test to sharpen it.
    expect(html).toContain("Take the 2-minute range test");
    expect(html).toContain('href="/warmups"');
  });

  it("never claims a save for a run under the floor", () => {
    const html = renderToStaticMarkup(<LastRun low={57} high={59} lastLog={null} onTryRange={() => {}} />);
    expect(html).toContain("Not saved yet");
    expect(html).not.toContain("XP");
    expect(html).toContain("Next, the 2-minute range test");
    expect(html).toContain('href="/warmups"');
  });

  it("offers the range test to a singer who sang the one note the gate asks for", () => {
    // The stop scroll puts the Pitch | Range test tabs under the header, so
    // the card itself is the only next step on screen.
    const html = renderToStaticMarkup(<LastRun low={57} high={57} lastLog={{ xpGained: 5 }} onTryRange={() => {}} />);
    // One note reads as one note, not "A3 to A3".
    expect(html).toContain("You have held A3 so far.");
    expect(html).not.toContain("A3 to A3");
    expect(html).toContain("Next, the 2-minute range test walks you down to your lowest note");
    expect(html).toContain("Take the 2-minute range test");
    expect(html).toContain('href="/warmups"');
  });

  it("never explains a range test the card has no button for", () => {
    const html = renderToStaticMarkup(<LastRun low={57} high={57} lastLog={null} />);
    expect(html).not.toContain("Take the 2-minute range test");
    expect(html).not.toContain("Next, the 2-minute range test");
    // Still a next step.
    expect(html).toContain('href="/warmups"');
  });

  it("does not explain the range test to a singer who already explored a span", () => {
    const html = renderToStaticMarkup(<LastRun low={47} high={61} lastLog={null} onTryRange={() => {}} />);
    expect(html).toContain("Take the 2-minute range test");
    expect(html).not.toContain("Next, the 2-minute range test");
  });

  it("points a singer with a recent saved range at practice, not a retest", () => {
    // The book spaces range tests weeks apart, and their warmups and songs
    // already fit the saved range.
    const html = renderToStaticMarkup(<LastRun low={47} high={61} lastLog={null} retestDue={false} onTryRange={() => {}} />);
    expect(html).toContain("You have held B2 to C#4 so far.");
    expect(html).not.toContain("range test");
    expect(html).not.toContain("Take the 2-minute range test");
    expect(html).toContain('href="/warmups"');
    expect(html).toContain('href="/songs"');
    expect(html).toContain("Retest weeks apart");
  });

  it("reads whether a retest is due when the mic starts, not during render", () => {
    const src = readFileSync(new URL("./pitch-meter.tsx", import.meta.url), "utf8");
    const begin = src.slice(src.indexOf("const begin = async"), src.indexOf("const reset = () =>"));
    expect(begin).toContain("setRetestDue(rangeRetestDue(range, Date.now()));");
    // Both prompts follow it: the live panel and the stopped card.
    expect(src).toContain("retestDue={retestDue}");
    expect(src).toMatch(/explored && low !== null && high !== null && !retestDue && saved &&/);
    // A singer whose saved range is due a retest already has a result, so the
    // live panel says the retest is due rather than offering a first one.
    expect(src).toContain("is six weeks old or more, so a retest is due");
  });

  it("clears the last save on every new start that opens the mic", () => {
    // A singer who saved a 50 s run, sang again for 20 s and stopped must not
    // be told the second run earned the first one's XP.
    const src = readFileSync(new URL("./pitch-meter.tsx", import.meta.url), "utf8");
    const begin = src.slice(src.indexOf("const begin = async"), src.indexOf("const reset = () =>"));
    // Only once the mic is on: a start that fails leaves the save standing.
    expect(begin).toContain("if (await start()) setLastLog(null);");
    // The notes carry on across starts (only Reset clears them), which is
    // why the stopped card says "so far" rather than "your last run".
    expect(begin).not.toMatch(/setLow\(|setHigh\(/);
    expect(src).toContain('setLastLog(logSession({ type: "pitch"');
  });

  it("brings the stopped view on screen after a stop, and only after a stop", () => {
    // Stop mic is at the foot of the tall live view; without this a phone is
    // left scrolled past the summary it just produced.
    const src = readFileSync(new URL("./pitch-meter.tsx", import.meta.url), "utf8");
    expect(src).toMatch(/if \(was && !listening\) stoppedRef\.current\?\.scrollIntoView\(\{ block: "start" \}\);/);
    expect(src).toContain("const wasListeningRef = useRef(false);");
    const stopped = src.slice(src.indexOf("if (!listening) {"));
    expect(stopped).toMatch(/^if \(!listening\) \{\s*return \(\s*<div ref=\{stoppedRef\}>/);
  });
});
