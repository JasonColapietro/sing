import { rangeRetestDue, type ProgressState } from "@/lib/progress";

/**
 * What a room says about a stale range while a running program schedules the
 * next range test. A module of its own, with no lib/programs import, so the
 * /range pitch meter can say it without shipping every program and the song
 * catalog to the page the homepage's "Start singing" lands on. The program
 * itself is read in components/practice/program-range-probe.tsx, a chunk
 * loaded only for a singer whose saved range is stale.
 */

/** The running program's next scheduled range test, as the coach names it. */
export interface ProgramRangeTest {
  /** The program's name. */
  name: string;
  /** Its 1-based program day. */
  day: number;
  /** That day is today's, still to do. */
  today: boolean;
}

/**
 * What to say instead of "a retest is due" when the saved range is stale but
 * the running program schedules the next test: when that test falls, and that
 * one sung earlier does not count toward it. The /progress coach and the
 * /range pitch meter both say it, from here, so the two rooms never give
 * opposite instructions about the same measurement. The program's name ends
 * its sentence: "The Measured Voice: 12 weeks" has a colon of its own, and
 * leading with it reads as a heading.
 */
export function programRangeNote(rangeAgeDays: number, programRange: ProgramRangeTest): string {
  return programRange.today
    ? `Your range was last measured ${rangeAgeDays} days ago. Today's program day is day ${programRange.day} of ${programRange.name}. It takes your next range test after its warm-up, so take the test there.`
    : `Your range was last measured ${rangeAgeDays} days ago. Your next range test is on day ${programRange.day} of ${programRange.name}. Wait for that day: a test taken earlier does not count toward it.`;
}

/**
 * The note for a saved range old enough to retest while a running program
 * schedules the next test, or null: no program test to wait for, no saved
 * range (the range test is still the first step), or a range that is current
 * or undated (lib/progress rangeRetestDue). For a room that reads the clock
 * in an event handler, as the pitch meter does when its mic starts.
 */
export function staleRangeProgramNote(
  range: ProgressState["range"],
  programRange: ProgramRangeTest | null,
  nowMs: number,
): string | null {
  if (programRange === null || range.lowMidi === undefined || range.highMidi === undefined) return null;
  if (!rangeRetestDue(range, nowMs)) return null;
  const t = range.testedAt ? Date.parse(range.testedAt) : NaN;
  if (Number.isNaN(t)) return null;
  return programRangeNote(Math.floor((nowMs - t) / 86_400_000), programRange);
}
