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
// next/link, marked, so a plain anchor (a program's view needs one) can be
// told from a router link.
vi.mock("next/link", () => ({
  default: ({ href, children, ...rest }: { href: string; children: React.ReactNode }) => (
    <a data-next-link="" href={href} {...rest}>
      {children}
    </a>
  ),
}));

import { LastRun, PitchMeter } from "./pitch-meter";
import { recoveryRangeNote } from "@/components/practice/program-range-note";

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
    expect(begin).toContain("const now = Date.now();");
    expect(begin).toContain("setMicStartedAt(now);");
    expect(begin).toContain("setRetestDue(rangeRetestDue(range, now));");
    // Both prompts follow it, less a retest a running program schedules: the
    // live panel and the stopped card.
    expect(src).toContain("const offerRetest = retestDue && programNote === null;");
    expect(src).toContain("retestDue={offerRetest}");
    expect(src).toMatch(/explored && low !== null && high !== null && !offerRetest && \(saved \|\| programNote !== null\) &&/);
    // The retest panel only when the test is offered, or as a first result
    // with nothing the program says in its place.
    expect(src).toMatch(/explored && low !== null && high !== null && \(offerRetest \|\| \(!saved && programNote === null\)\) &&/);
    // A singer whose saved range is due a retest already has a result, so the
    // live panel says the retest is due rather than offering a first one.
    expect(src).toContain("is six weeks old or more, so a retest is due");
  });

  it("leaves a stale range's retest to a running program that schedules one", () => {
    // The /progress coach tells this singer to wait for the program's day; the
    // meter used to call a retest due and lead with the test button.
    const note =
      "Your range was last measured 50 days ago. Your next range test is on day 14 of Foundations in 2 weeks. Wait for that day: a test taken earlier does not count toward it.";
    const html = renderToStaticMarkup(
      <LastRun low={47} high={61} lastLog={null} retestDue={false} programNote={note} onTryRange={() => {}} />,
    );
    expect(html).toContain(note);
    expect(html).not.toContain("Take the 2-minute range test");
    expect(html).not.toContain("retest is due");
    expect(html).toContain('href="/warmups"');
    expect(html).toContain('href="/songs"');
    expect(html).not.toContain("today’s plan");
    // Both views read it from the coach's own builder, so the words match,
    // timed from the instant the mic started.
    const src = readFileSync(new URL("./pitch-meter.tsx", import.meta.url), "utf8");
    expect(src).toContain("staleRangeProgramNote(range, programRange, micStartedAt)");
    expect(src).toContain("programNote={programNote}");
    expect(src).toContain("so far. ${programNote}");
  });

  it("sends a singer whose program tests the range today to that day's plan", () => {
    // "Take the test there" needs a there: the program's own view, as a
    // plain document load (lib/program-ids.ts programViewHref).
    const note =
      "Your range was last measured 50 days ago. Today's program day is day 14 of Foundations in 2 weeks. It takes your next range test after its warm-up, so take the test there.";
    const html = renderToStaticMarkup(
      <LastRun
        low={47}
        high={61}
        lastLog={null}
        retestDue={false}
        programNote={note}
        programDayHref="/programs?program=foundations-2w"
        onTryRange={() => {}}
      />,
    );
    expect(html).toContain(note.replace("'", "&#x27;"));
    expect(html).not.toContain("Take the 2-minute range test");
    const plan = /<a\b[^>]*href="\/programs\?program=foundations-2w"[^>]*>Open today’s plan<\/a>/.exec(html);
    expect(plan?.[0]).toBeDefined();
    expect(plan?.[0]).not.toContain("data-next-link");
    expect(html).toContain('href="/warmups"');
    expect(html).toContain('href="/songs"');
  });

  it("reads the running program from its own chunk, only for a stale saved range or none with a program kept", () => {
    // lib/programs carries every program and the song catalog; this page's
    // cold traffic has no program and never needs them.
    const src = readFileSync(new URL("./pitch-meter.tsx", import.meta.url), "utf8");
    expect(src).not.toMatch(/from "@\/lib\/programs"|from "@\/components\/programs\/use-program"|from "@\/components\/practice\/program-day"/);
    // Still its own chunk, loaded so a failed fetch (offline) waits for the
    // connection in a Suspense boundary of its own rather than throwing in
    // render (./retry-when-online.test.ts).
    expect(src).toContain('retryWhenOnline(() => import("@/components/practice/program-range-probe"))');
    expect(src).toContain("{ loading: () => null }");
    // Only for a stale saved range, or for no saved range with a program
    // record in this browser (Recovery week may be running), read at mic
    // start from the store's key alone.
    expect(src).toContain("const readsProgram = staleSaved || unmeasuredInProgram;");
    expect(src).toContain("const unmeasuredInProgram = micStartedAt !== null && !rangeSaved && programKept;");
    expect(src).toMatch(/const probe = readsProgram \? \(\s*<ProgramRangeProbe /);
    const begin = src.slice(src.indexOf("const begin = async"), src.indexOf("const reset = () =>"));
    expect(begin).toContain("setProgramKept(programStored());");
    expect(src).toContain("window.localStorage.getItem(PREPAINT_KEYS.program)");
    const note = readFileSync(new URL("../practice/program-range-note.ts", import.meta.url), "utf8");
    expect(note).not.toMatch(/from "@\/lib\/programs"/);
  });

  it("leaves the range test out during Recovery week, in the /progress coach's words", () => {
    // Recovery week is for a voice that feels tired; the coach says to leave
    // the test until the week is over, and the meter used to call a retest
    // due and lead with the test button.
    const DAY = 86_400_000;
    const now = Date.parse("2026-10-13T12:00:00Z");
    const stale = { lowMidi: 48, highMidi: 67, testedAt: new Date(now - 60 * DAY).toISOString() };
    for (const range of [stale, {}]) {
      const note = recoveryRangeNote(range, "Recovery week", now)!;
      expect(note).toContain("Recovery week is for a voice that feels tired, so leave the range test until the week is over");
      const html = renderToStaticMarkup(
        <LastRun low={57} high={64} lastLog={null} retestDue={false} programNote={note} onTryRange={() => {}} />,
      ).replace(/&#x27;/g, "'");
      expect(html).toContain(note);
      expect(html).not.toContain("Take the 2-minute range test");
      expect(html).not.toContain("retest is due");
      expect(html).toContain('href="/warmups"');
      expect(html).toContain('href="/songs"');
      expect(html).not.toContain("today’s plan");
    }
    // Both views read it from the coach's own builder, timed from the instant
    // the mic started, ahead of the program's scheduled test, which Recovery
    // week never has.
    const src = readFileSync(new URL("./pitch-meter.tsx", import.meta.url), "utf8");
    expect(src).toContain("recoveryRangeNote(range, recovering, micStartedAt)");
    expect(src).toMatch(/recovering !== null\s*\?\s*recoveryRangeNote\(range, recovering, micStartedAt\)\s*:\s*staleSaved\s*\?\s*staleRangeProgramNote\(/);
    expect(src).toContain("onRecovering={setRecovering}");
    const probe = readFileSync(new URL("../practice/program-range-probe.tsx", import.meta.url), "utf8");
    expect(probe).toContain("const recovering = active ? recoveryWeekOf(active) : null;");
    expect(probe).toContain("onRecovering?.(recovering);");
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
