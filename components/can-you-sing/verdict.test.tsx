import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { ComponentProps } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { DEFAULT_PROGRESS, MAX_SESSIONS, type VocalRange } from "@/lib/progress-shape";
import { POP_SONGS } from "@/lib/pop-songs";

const state = vi.hoisted(() => ({ range: {} as VocalRange, pro: false, ready: true }));
vi.mock("@/lib/progress", () => ({
  useProgress: () => ({ ...DEFAULT_PROGRESS, range: state.range }),
}));
/*
 * next/link renders the same <a> a plain anchor does, so the client-router
 * links are marked here to tell the two apart in static markup.
 */
vi.mock("next/link", () => ({
  default: ({ href, prefetch, children, ...rest }: ComponentProps<"a"> & { prefetch?: boolean }) => (
    <a data-client-router="" data-prefetch={String(prefetch)} href={String(href)} {...rest}>
      {children}
    </a>
  ),
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
    expect(html).toContain("commonly cited lead-vocal range");
    expect(html).not.toContain("studio-version");
    expect(html).toContain("not a judgment of your voice");
    expect(html).not.toContain("Extend it with warmups");
    expect(html).not.toContain("extending your range is the move");
    // Pro keeps the latest MAX_SESSIONS sessions, not a "full" history, and
    // range retests are weeks apart, not the next day.
    expect(html).not.toContain("full practice history");
    expect(html).not.toContain("another day");
  });

  it("states the Pro history limit /pro states, and the weeks-apart retest rule", () => {
    state.range = { lowMidi: 52, highMidi: 72 };
    expect(render()).toContain(`your latest ${MAX_SESSIONS} sessions instead of the last 20`);
    state.range = { lowMidi: 60, highMidi: 73 };
    expect(render()).toContain("Retest after a few weeks of practice");
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
    // Both ends on the limits: both are named, and no shift can centre it.
    state.range = { lowMidi: 55, highMidi: 69 };
    html = render();
    expect(html).toContain("its top note is your tested ceiling");
    expect(html).toContain("its lowest note is your tested floor");
    expect(html).toContain("expect both ends of this song to be work");
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
    // A range exactly as wide as the song: the minimum shift is the centred
    // one, and it parks the other end on the opposite limit too.
    state.range = { lowMidi: 51, highMidi: 65 };
    html = render();
    expect(html).toContain("Dropping the key by 4 would bring it inside, with the top note on that ceiling.");
    expect(html).toContain("That also puts its lowest note on your tested floor");
    // Low side: 4 below the floor of B3–D5 (59–74), one semitone of slack.
    // Raising by 4 leaves the top one under the ceiling; "centring" (raise
    // by 5) would put the top on the ceiling, so it is not offered.
    state.range = { lowMidi: 59, highMidi: 74 };
    html = render();
    expect(html).toContain("Raising the key by 4 would bring it inside, with the bottom note on that floor. That also puts its top note one semitone under your tested ceiling, so expect both ends of the song to be work.");
    expect(html).not.toContain("centres it");
  });

  it("names the ceiling when the advised shift puts a song as wide as the range on both limits", () => {
    // Creep B2–B4 (47–71) against C3–C5 (48–72): raising by 1 puts the bottom
    // on the floor and the top on the ceiling.
    const creep = POP_SONGS.find((s) => s.slug === "creep")!;
    expect([creep.lowMidi, creep.highMidi]).toEqual([47, 71]);
    state.range = { lowMidi: 48, highMidi: 72 };
    const html = renderToStaticMarkup(<CanYouSingVerdict song={creep} />);
    expect(html).toContain("Raising the key by 1 would bring it inside, with the bottom note on that floor.");
    expect(html).toContain("That also puts its top note on your tested ceiling");
  });

  it("quotes the title in every saved-range sentence, since several are styled lowercase", () => {
    const vampire = POP_SONGS.find((s) => s.slug === "vampire")!;
    expect(vampire.title).toBe("vampire");
    state.range = { lowMidi: 57, highMidi: 64 };
    const html = renderToStaticMarkup(<CanYouSingVerdict song={vampire} />);
    expect(html).toContain("“vampire” spans more semitones than your tested range covers");
  });

  it("names the octave a lower voice can sing a higher voice's song in", () => {
    // Espresso G3–A4 (55–69) against F2–C4 (41–60): 9 above the ceiling as written; G2–A3 an octave down is inside.
    state.range = { lowMidi: 41, highMidi: 60 };
    const html = render();
    expect(html).toContain("Sung an octave lower in the written key, it runs G2–A3, inside your tested range.");
    expect(html).toContain('href="/songs?song=');
    expect(html).not.toContain("ng-siren-fifth");
    expect(html).not.toContain("Head-voice builder");
  });

  it("names the octave a higher voice can sing a lower voice's song in, and the limit it lands on", () => {
    // Espresso G3–A4 (55–69) against F#4–A5 (66–81): 11 below the floor as
    // written; G4–A5 an octave up is inside, with its top on the ceiling.
    state.range = { lowMidi: 66, highMidi: 81 };
    const html = render();
    expect(html).toContain("The low end of “Espresso” is 11 semitones below your tested floor");
    // G4 is also one semitone above the F#4 floor.
    expect(html).toContain("Sung an octave higher in the written key, it runs G4–A5, inside your tested range. A range test finds your limits, not your comfortable band, so expect the top and bottom of it to be work.");
    expect(html).not.toContain("descending-five");
  });

  it("names a move of an octave or more as the octave, not as a key change", () => {
    for (const s of POP_SONGS) {
      // The last three are the range test's extremes: two octaves away, and
      // wide enough that a song inside it centres an octave up.
      for (const [lowMidi, highMidi] of [[40, 64], [41, 65], [45, 67], [53, 77], [57, 81], [60, 84], [33, 50], [72, 93], [55, 94]]) {
        state.range = { lowMidi, highMidi };
        const html = renderToStaticMarkup(<CanYouSingVerdict song={s} />);
        expect(html, `${s.slug} ${lowMidi}–${highMidi}`).not.toMatch(/(?:dropping|raising) (?:the key|it) by (?:1[2-9]|[2-9]\d)\b/i);
      }
    }
    // vampire F3–E5 against E2–E4: the minimum shift is the octave, said once.
    const vampire = POP_SONGS.find((s) => s.slug === "vampire")!;
    state.range = { lowMidi: 40, highMidi: 64 };
    let html = renderToStaticMarkup(<CanYouSingVerdict song={vampire} />);
    expect(html).toContain("The top of “vampire” is 12 semitones above your tested ceiling of E4. Sung an octave lower in the written key, it runs F2–E4, inside your tested range.");
    expect(html).not.toContain("both ends of the song");
    // Creep B2–B4 (47–71) against C4–C6 (60–84): 13 under the floor is the
    // octave and one more semitone.
    const creep = POP_SONGS.find((s) => s.slug === "creep")!;
    state.range = { lowMidi: 60, highMidi: 84 };
    html = renderToStaticMarkup(<CanYouSingVerdict song={creep} />);
    expect(html).toContain("The low end of “Creep” is 13 semitones below your tested floor of C4. Singing it an octave higher and raising the key by 1 more would bring it inside, with the bottom note on that floor");
    // Two octaves away is two octaves, not a key change of twelve more.
    const hallelujah = POP_SONGS.find((s) => s.slug === "hallelujah")!;
    state.range = { lowMidi: 72, highMidi: 91 };
    html = renderToStaticMarkup(<CanYouSingVerdict song={hallelujah} />);
    expect(html).toContain("is 24 semitones below your tested floor of C5. Singing it two octaves higher would bring it inside, with the bottom note on that floor.");
    // A song already inside a very wide range centres an octave up.
    state.range = { lowMidi: 55, highMidi: 92 };
    html = renderToStaticMarkup(<CanYouSingVerdict song={song} />);
    expect(html).toContain("so expect the bottom of this song to be work. Singing it an octave higher centres it in your range.");
  });

  it("spells the saved range in the song's key, beside the song's own notes", () => {
    // Someone You Loved is in Db major (Eb3–Bb4): a saved D#3–A#4 is the
    // same two notes, and the card spells them the way the song does.
    const syl = POP_SONGS.find((s) => s.slug === "someone-you-loved")!;
    expect(syl.key).toBe("Db major");
    state.range = { lowMidi: syl.lowMidi, highMidi: syl.highMidi };
    let html = renderToStaticMarkup(<CanYouSingVerdict song={syl} />);
    expect(html).toContain(`Your saved range: Eb3–Bb4. Song as written: Eb3–Bb4.`);
    expect(html).not.toMatch(/[A-G]#\d/);
    // An octave down: the ceiling named is Bb3, the note the octave lands on.
    state.range = { lowMidi: syl.lowMidi - 12, highMidi: syl.highMidi - 12 };
    html = renderToStaticMarkup(<CanYouSingVerdict song={syl} />);
    expect(html).toContain("above your tested ceiling of Bb3.");
    expect(html).toContain("it runs Eb2–Bb3");
  });

  it("says nothing about the octave when the other octave does not fit either", () => {
    // Espresso G3–A4 (55–69) against C3–F4 (48–65): G2 an octave down is under the floor.
    state.range = { lowMidi: 48, highMidi: 65 };
    const html = render();
    expect(html).not.toContain("Sung an octave");
    expect(html).toContain('href="/warmups?exercise=');
  });

  it("marks the range-test pitch as the saved-range slot until hydration, and not the answer", () => {
    // The server render (and the hydration pass) carries the marker the
    // pre-paint CSS sizes; the personal answer, drawn after hydration, has none.
    expect(render()).toContain('data-prepaint-slot="song-verdict"');
    state.range = { lowMidi: 52, highMidi: 72 };
    expect(render()).not.toContain("data-prepaint-slot");
  });

  it("gives both header labels one width, so the swap after hydration moves nothing", () => {
    const action = () => renderToStaticMarkup(<CanYouSingAction song={song} />);
    const width = (html: string) => /class="[^"]*\b(min-w-\[[^\]]+\])/.exec(html)?.[1];
    state.range = {};
    const before = width(action());
    state.range = { lowMidi: 52, highMidi: 72 };
    expect(before).toBeDefined();
    expect(width(action())).toBe(before);
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

  it("jumps down to the answer with a plain anchor, so a second tap still scrolls there", () => {
    // next/link makes no navigation once the address ends in #fit: from the
    // top of the page, a second "See how it fits your range ↓" did nothing.
    // The browser's own jump scrolls every time and moves the Tab starting
    // point; jumpInPage keeps Back working after it.
    const action = () => renderToStaticMarkup(<CanYouSingAction song={song} />);
    state.range = { lowMidi: 52, highMidi: 72 };
    expect(action()).toMatch(/^<a href="#fit"/);
    expect(action()).not.toContain("data-client-router");
    const src = readFileSync(join(__dirname, "verdict.tsx"), "utf8");
    expect(src).toMatch(/href="#fit"\s+fullLoad\s+onClick=\{jumpInPage\}/);
    // The range test is another page, so it stays on the client router.
    state.range = {};
    expect(action()).toContain("data-client-router");
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
