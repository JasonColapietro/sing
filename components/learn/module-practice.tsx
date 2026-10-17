/**
 * The practice panel on a module or lesson page: where to practise, what sing
 * measures there (or that it measures nothing), how much this device has
 * logged, and the exercises, songs and chapters the lessons refer to.
 */
import Link from "next/link";
import { TOLERANCE_CENTS } from "@/components/songs/lib";
import { IN_TUNE_CENTS } from "@/lib/audio/notes";
import {
  MODULE_PRACTICE,
  RANGE_WARM_UP,
  ROOM_LABELS,
  companionHref,
  companionLabel,
  isGuidedPractice,
  moduleMaterial,
  practiceMatch,
  warmsUpFirst,
  type Companion,
} from "@/lib/lesson-practice";
import { FREE_DAILY_MINUTES } from "@/lib/practice-limits";
import { PracticeCount } from "@/components/learn/practice-count";
import { Card, LinkButton, SectionLabel } from "@/components/ui";

/**
 * What each measurement means, in a singer's words. Only measurements the
 * contract reports as implemented appear here; the test holds this list to it.
 */
export const MEASUREMENT_WORDS: Record<string, string> = {
  rangeExtremes: "the lowest and highest clear notes the range test heard you hold in one session",
  sustainSeconds:
    "how long one sustain lasts, in seconds. The timer reads loudness, so a steady hiss counts as well as a sung note",
  // The scoring window is not the definition of in tune: it passes a phrase
  // sung clearly flat (book chapter 9), and the studio's green zone is tighter.
  centsFromTarget: `how far each note sits from its target, in cents. Scoring counts a note as a hit anywhere within ${TOLERANCE_CENTS} cents, a wide window that still passes a clearly flat note; the studio's green zone, ±${IN_TUNE_CENTS} cents, is the in-tune goal`,
  inTuneHoldTime: `how long you hold a note within ${TOLERANCE_CENTS} cents of the target`,
  scorePercent: `the share of each note you held within ${TOLERANCE_CENTS} cents of the target`,
  ringRatio:
    "the share of your sound in the 2.8 to 3.2 kHz band. Compare it only with your own earlier takes; it says nothing about strain",
  cycleDose:
    "how many vocal fold cycles a session used. It measures load, and there is no published safe ceiling to compare it with",
};

/**
 * Said wherever a lesson sends someone into a room that draws on the free
 * daily allowance (warm-ups, ear training, breath, songs), so the limit is
 * never a surprise halfway through a free lesson. `full` adds which rooms
 * have no clock, for the practice panel where there is room to say it.
 */
export function GuidedCapNote({ full = false }: { full?: boolean }) {
  return (
    <p className="text-xs text-dim" data-guided-cap>
      Guided practice is {FREE_DAILY_MINUTES} free minutes a day;{" "}
      <Link href="/pro" className="underline hover:text-ink">
        Pro
      </Link>{" "}
      removes the limit.
      {full && " The pitch studio, range test, recorder and tools have no clock."}
    </p>
  );
}

/**
 * The buttons into a lesson's room. The range test comes after the warm-up
 * the lessons prescribe, because a cold voice under-reports at both ends and
 * the result replaces the saved range; the warm-up is guided practice, so the
 * allowance is said beside it. Every other room is one button.
 */
export function CompanionButtons({
  companion,
  size,
  full = false,
}: {
  companion: Companion;
  size: "md" | "lg";
  /** Passed to GuidedCapNote: also name the rooms that have no clock. */
  full?: boolean;
}) {
  if (warmsUpFirst(companion)) {
    return (
      <div className="flex flex-col items-start gap-2" data-warm-up-first>
        <div className="flex flex-wrap gap-3">
          <LinkButton href={RANGE_WARM_UP.href} size={size}>
            {RANGE_WARM_UP.label}
          </LinkButton>
          <LinkButton href={companionHref(companion)} size={size} variant="outline">
            Then take the range test once
          </LinkButton>
        </div>
        <p className="text-xs text-dim" data-guided-cap>
          The Morning reset is about four minutes of guided practice, out of
          the free plan&apos;s {FREE_DAILY_MINUTES} minutes a day;{" "}
          <Link href="/pro" className="underline hover:text-ink">
            Pro
          </Link>{" "}
          removes the limit. The range test itself has no clock.
        </p>
      </div>
    );
  }
  return (
    <div className="flex flex-col items-start gap-2">
      <LinkButton href={companionHref(companion)} size={size}>
        Open {companionLabel(companion)}
      </LinkButton>
      {isGuidedPractice(companion) && <GuidedCapNote full={full} />}
    </div>
  );
}

export function ModulePractice({
  moduleId,
  lessonId,
}: {
  moduleId: string;
  /** On a lesson page: the lesson, whose own room may differ from the module's. */
  lessonId?: string;
}) {
  const practice = MODULE_PRACTICE[moduleId];
  if (!practice) return null;
  const { basis, companion } = practice;
  const match = practiceMatch(companion);
  const material = moduleMaterial(moduleId);
  // A lesson practised somewhere else says so here, so the panel's room
  // and the page's first button never read as two answers to one question.
  const lessonRoom = lessonId ? practice.lessonCompanion?.[lessonId] : undefined;

  return (
    <Card>
      <div className="space-y-4" data-module-practice={moduleId}>
        <SectionLabel>Practice</SectionLabel>
        <div className="max-w-2xl space-y-2">
          <h2 className="text-xl">Where to practise</h2>
          {lessonRoom && (
            <p className="text-sm text-mut" data-lesson-room={lessonRoom.room}>
              You practise this lesson in {companionLabel(lessonRoom)}, the button
              at the top of the page; {companionLabel(companion)} below is for the
              module&apos;s self-check.
            </p>
          )}
          {basis.kind === "measured" ? (
            <p className="text-sm text-mut" data-proof-basis="measured">
              Suede Sing measures part of this: {MEASUREMENT_WORDS[basis.measurement]}. The
              number is evidence for the room&apos;s task, not a pass for the lesson;
              the self-check is still yours.
            </p>
          ) : (
            <p className="text-sm text-mut" data-proof-basis="self-check">
              Nothing in Suede Sing measures this, so the self-check is your ear and
              your recording. What it shows: {basis.showsInstead}
            </p>
          )}
          <div className="pt-1">
            <CompanionButtons companion={companion} size="md" full />
          </div>
          {match && <PracticeCount match={match} room={ROOM_LABELS[companion.room]} />}
        </div>

        {material.length > 0 && (
          <div>
            <h3 className="text-base">Practice material</h3>
            <p className="mt-1 max-w-prose text-sm text-mut">
              The exercises and songs play synthesized reference pitches: they
              supply the notes, not a recording of a singer demonstrating a
              technique. Record your takes in{" "}
              <Link href="/recorder" className="text-violet-ink hover:underline">
                the recorder
              </Link>
              .
            </p>
            <ul className="mt-3 space-y-2 text-sm">
              {material.map((item) => (
                <li key={`${item.kind}:${item.title}`} className="flex flex-wrap items-baseline gap-2">
                  <span className="font-mono text-xs uppercase text-dim">
                    {item.kind === "exercise"
                      ? "Warm-up"
                      : item.kind === "song"
                        ? "Song"
                        : item.kind === "book"
                          ? "Book"
                          : "Atlas"}
                  </span>
                  {item.kind === "song" && item.page && item.href ? (
                    // The song's name opens its page, which prints the range
                    // and key to choose from; "Sing it" opens it in the songbook.
                    // The hidden title tells a screen reader, which can list a
                    // page's links out of context, which song "Sing it" opens.
                    <>
                      <Link href={item.page} className="text-violet-ink hover:underline">
                        {item.title}
                      </Link>
                      <Link
                        href={item.href}
                        className="text-xs text-violet-ink hover:underline"
                        data-sing-song
                      >
                        Sing it<span className="sr-only">: {item.title}</span>
                      </Link>
                    </>
                  ) : item.href ? (
                    <Link href={item.href} className="text-violet-ink hover:underline">
                      {item.title}
                    </Link>
                  ) : (
                    <span className="text-ink">{item.title}</span>
                  )}
                  {item.pro && (
                    <span className="text-xs text-dim">
                      Part of{" "}
                      <Link href="/pro" className="underline hover:text-ink">
                        Suede Pro
                      </Link>
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </Card>
  );
}
