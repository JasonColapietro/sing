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

import { CanYouSingAction, CanYouSingVerdict } from "./verdict";

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
      expect(html).toContain(`href="/range?mode=range&amp;check=${song.slug}#start"`);
      expect(html).toContain(`See if “${song.title}” fits my voice`);
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
    expect(html).toContain("free for 5 minutes a day");
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
    // The pitch studio has no daily clock, so it is not described as having one.
    expect(html).not.toContain("minutes a day");
  });

  it("sends a retest back to this song's verdict too", () => {
    state.range = { lowMidi: 52, highMidi: 72 };
    expect(render()).toContain(`href="/range?mode=range&amp;check=${song.slug}#start"`);
  });

  it("does not call a song whose top note is the tested ceiling a plain fit", () => {
    // Espresso is G3–A4.
    state.range = { lowMidi: 50, highMidi: 69 };
    let html = render();
    expect(html).toContain("its top note is your tested ceiling");
    expect(html).toContain("not your comfortable band");
    expect(html).not.toContain("of headroom");
    // Centring G3–A4 in D3–A4 drops it round(59.5 - 62) = 2.
    expect(html).toContain("Dropping the key by 2 centres it in your range.");
    state.range = { lowMidi: 50, highMidi: 70 };
    html = render();
    expect(html).toContain("one semitone under your tested ceiling");
    state.range = { lowMidi: 52, highMidi: 72 };
    html = render();
    expect(html).toContain("leaves you 3 semitones of headroom");
    expect(html).not.toContain("comfortable band");
    expect(html).not.toContain("centres it");
  });

  it("treats the tested floor as a limit too", () => {
    // Espresso G3–A4 (55–69) against G3–D5 (55–74): bottom on the floor,
    // 5 semitones of headroom; centring raises it round(64.5 - 62) = 3.
    state.range = { lowMidi: 55, highMidi: 74 };
    let html = render();
    expect(html).toContain("its lowest note is your tested floor");
    expect(html).toContain("expect the bottom of this song to be work");
    expect(html).toContain("Raising the key by 3 centres it in your range.");
    expect(html).not.toContain("of headroom");
    state.range = { lowMidi: 54, highMidi: 74 };
    html = render();
    expect(html).toContain("one semitone above your tested floor");
    // Both ends on the limits: the top is named, and no shift can centre it.
    state.range = { lowMidi: 55, highMidi: 69 };
    html = render();
    expect(html).toContain("its top note is your tested ceiling");
    expect(html).not.toContain("centres it");
    // Three semitones of slack in all: any shift leaves an end within one
    // semitone of a limit, so no move is suggested.
    state.range = { lowMidi: 54, highMidi: 71 };
    html = render();
    expect(html).toContain("one semitone above your tested floor");
    expect(html).not.toContain("centres it");
  });

  it("names the shift that centres a song, not only the one that parks it on a limit", () => {
    // Espresso G3–A4 (55–69) against A2–F4 (45–65): 4 above the ceiling;
    // centring drops it by round(55 - 62) = 7.
    state.range = { lowMidi: 45, highMidi: 65 };
    let html = render();
    expect(html).toContain("Dropping the key by 4 would bring it inside, with the top note on that ceiling; dropping it by 7 centres it in your range.");
    // A range exactly as wide as the song: the minimum shift is the centred one.
    state.range = { lowMidi: 51, highMidi: 65 };
    html = render();
    expect(html).toContain("Dropping the key by 4 would bring it inside, with the top note on that ceiling.");
    // Low side: 4 below the floor of B3–D5 (59–74); centring raises it by round(66.5 - 62) = 5.
    state.range = { lowMidi: 59, highMidi: 74 };
    html = render();
    expect(html).toContain("Raising the key by 4 would bring it inside, with the bottom note on that floor; raising it by 5 centres it in your range.");
  });

  it("puts the page's action in reach before the verdict card: the test, or the way down to the answer", () => {
    const action = () => renderToStaticMarkup(<CanYouSingAction song={song} />);
    state.range = {};
    expect(action()).toContain(`href="/range?mode=range&amp;check=${song.slug}#start"`);
    expect(action()).toContain("Test my range for this song");
    state.range = { lowMidi: 52, highMidi: 72 };
    expect(action()).toContain('href="#fit"');
    expect(action()).not.toContain("/range?");
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
