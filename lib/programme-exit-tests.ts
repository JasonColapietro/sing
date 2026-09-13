/**
 * An exit test for each phase of the twelve-week programme, and the blocker to
 * name when the phase does not pass.
 *
 * This is borrowed, deliberately, from the other half of the product. GuitarHub
 * runs a four-stage practice loop in which every stage states one condition that
 * has to be true before the next stage starts, and it argues at length — on
 * `/log`, `/method` and `/guitar-practice-schedule` — that a streak is the wrong
 * scoreboard, because a streak goes up on a session that changed nothing and
 * resets on a week off that changed a great deal. A number that always moves
 * feels like evidence and is not.
 *
 * The twelve-week programme here had neither half of that. Its chapters say what
 * to practise for a fortnight and then the fortnight ends, so the only thing
 * telling a singer whether weeks 3 and 4 worked was the calendar. Meanwhile the
 * progress page counts days in a row. The calendar and the streak are both
 * measures of attendance.
 *
 * So each phase now states a condition a recording can settle, names the one
 * measurement that settles it, names the room the evidence is produced in, and
 * names what it still does not prove. None of that replaces the streak, which is
 * a product decision and not this module's to take; it gives a singer a second
 * number that can fail.
 *
 * Every `measurement` here is a key of `contracts/suede-vocal.ts`'s measurement
 * registry that the registry reports as `measurable: "yes"`, and every `room` is
 * a key of its `deepLinks.rooms`. Both are asserted in
 * `programme-exit-tests.test.tsx`, so an exit test cannot come to rest on
 * something this app does not measure, and a renamed room or withdrawn
 * measurement fails here rather than sending a singer nowhere. That is the same
 * discipline the contract already imposes on GuitarHub's lesson claims, applied
 * in the direction nobody had applied it.
 */
import { BOOK_CONTENTS } from "@/lib/book-data";

export interface ProgrammeExitTest {
  /** A chapter slug in `BOOK_CONTENTS`, and the phase it teaches. */
  chapter: string;
  /** One condition, worded so a saved measurement settles it rather than a mood. */
  test: string;
  /** A measurement key the suede-vocal contract reports as implemented. */
  measurement: string;
  /** A room key in the contract's `deepLinks.rooms`, that room's path, and its name. */
  room: string;
  roomPath: string;
  /** What a singer calls the room. The contract carries routes, not prose. */
  roomLabel: string;
  /**
   * What it is when the test does not pass. Named, because "it still is not
   * working" sends a singer back through the whole fortnight, and a named
   * blocker sends them at one thing.
   */
  blocker: string;
  /** The honest limit of the evidence, in the contract's own terms. */
  doesNotProve: string;
}

/**
 * Keyed by chapter slug. The programme's opening chapter is deliberately absent:
 * it explains how the twelve weeks are shaped and asks nothing of the voice, so
 * there is nothing for a recording to settle.
 */
export const PROGRAMME_EXIT_TESTS: Record<string, ProgrammeExitTest> = {
  "weeks-1-2-baseline": {
    chapter: "weeks-1-2-baseline",
    test: "A saved range test, and a sustain you can repeat within a second or two of the same length on two different days.",
    measurement: "sustainSeconds",
    room: "breath",
    roomPath: "/breath",
    roomLabel: "the breath room",
    blocker: "No baseline. A single sustain is a mood reading; two on separate days is a number you can be measured against in week twelve.",
    doesNotProve:
      "Nothing about breath support. The sustain timer is gated on loudness and never reads pitch, so a steady hiss and a steady note score the same.",
  },
  "weeks-3-4-middle": {
    chapter: "weeks-3-4-middle",
    test: "Five notes in the middle of your range, landed and held inside the tolerance window, one after another without a retry.",
    measurement: "inTuneHoldTime",
    room: "studio",
    roomPath: "/studio",
    roomLabel: "the pitch studio",
    blocker: "The onset, not the note. A singer who arrives under the pitch and corrects has a landing problem, which is a different fortnight's work from a holding problem.",
    doesNotProve:
      "That the tone is good. Time inside the window is a pitch measurement and says nothing about weight, vowel or resonance.",
  },
  "weeks-5-6-passaggio": {
    chapter: "weeks-5-6-passaggio",
    test: "The notes spanning your voice type's published passaggio zone, sung in order and each landed inside tolerance — no note in the zone dropped or skipped.",
    measurement: "centsFromTarget",
    room: "warmups",
    roomPath: "/warmups",
    roomLabel: "the warm-up room",
    blocker: "The crossing, not the notes. If each note passes alone and the run through them does not, the fault is in the gear change rather than in any one pitch.",
    doesNotProve:
      "That the crossing was smooth, or that it was made on the mechanism you intended. Nothing here classifies register, and no number scores the absence of a crack.",
  },
  "weeks-7-8-top": {
    chapter: "weeks-7-8-top",
    test: "A range test on two different days that reaches the same top note, without either attempt being one you had to push for.",
    measurement: "rangeExtremes",
    room: "range",
    roomPath: "/range",
    roomLabel: "the range test",
    blocker: "A one-day ceiling. A high note that appears once and not again was a good day, and building the next fortnight on it is how a singer ends up straining.",
    doesNotProve:
      "A usable top. A scan records the extreme reached by pushing; a working range trims the edges, and the two are different numbers.",
  },
  "weeks-9-10-bottom": {
    chapter: "weeks-9-10-bottom",
    test: "A phrase held for longer than your week-one sustain, at the bottom of your comfortable range rather than the middle.",
    measurement: "sustainSeconds",
    room: "breath",
    roomPath: "/breath",
    roomLabel: "the breath room",
    blocker: "Volume, not length. Low notes are quiet, and a sustain that ends early at the bottom often ended because the level fell under the gate rather than because the breath ran out.",
    doesNotProve:
      "That the low note is usable in a song. A held tone in a quiet room is not the same as a low line under a band.",
  },
  "weeks-11-12-songs": {
    chapter: "weeks-11-12-songs",
    test: "One song through, start to finish, no restarts, at a score you would be willing to show someone — and a second pass of the same song on another day that does not collapse.",
    measurement: "scorePercent",
    room: "songs",
    roomPath: "/songs",
    roomLabel: "the songbook",
    blocker: "Best of eight. A score kept from the best of many attempts is a ceiling; what twelve weeks has to move is the floor, which is the take you get on the first attempt.",
    doesNotProve:
      "A performance. The score is in-tolerance hold time over possible hold time, which rewards accuracy and is indifferent to phrasing, diction and everything an audience hears.",
  },
};

/** The exit test for a chapter, or undefined for a chapter that sets no condition. */
export function exitTestFor(slug: string): ProgrammeExitTest | undefined {
  return PROGRAMME_EXIT_TESTS[slug];
}

/**
 * The programme's practice phases: every chapter in the twelve-week part except
 * the one that only explains the shape. Derived rather than listed, so a new
 * phase chapter arrives here without an exit test and fails the suite instead of
 * shipping a fortnight with no way to tell whether it worked.
 */
export const PROGRAMME_PART = "The twelve-week program";

export function programmePhaseChapters(): string[] {
  return BOOK_CONTENTS.filter(
    (chapter) => chapter.part === PROGRAMME_PART && chapter.slug !== "how-the-program-works",
  ).map((chapter) => chapter.slug);
}
