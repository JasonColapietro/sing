/**
 * The practice panel on a module or lesson page: where to practise, what sing
 * measures there (or that it measures nothing), how much this device has
 * logged, and the exercises, songs and chapters the lessons refer to.
 */
import Link from "next/link";
import { TOLERANCE_CENTS } from "@/components/songs/lib";
import {
  MODULE_PRACTICE,
  ROOM_LABELS,
  companionHref,
  companionLabel,
  moduleMaterial,
  practiceMatch,
} from "@/lib/lesson-practice";
import { PracticeCount } from "@/components/learn/practice-count";
import { Card, LinkButton, SectionLabel } from "@/components/ui";

/**
 * What each measurement means, in a singer's words. Only measurements the
 * contract reports as implemented appear here; the test holds this list to it.
 */
export const MEASUREMENT_WORDS: Record<string, string> = {
  phonationSeconds:
    "how long your voice sounded, in seconds of confidently voiced time",
  rangeExtremes: "your lowest and highest comfortable notes",
  sustainSeconds:
    "how long one sustain lasts, in seconds. The timer reads loudness, so a steady hiss counts as well as a sung note",
  centsFromTarget: `how far each note sits from its target, in cents. A note counts as in tune within ${TOLERANCE_CENTS} cents`,
  inTuneHoldTime: `how long you hold a note within ${TOLERANCE_CENTS} cents of the target`,
  scorePercent: `the share of each note you held within ${TOLERANCE_CENTS} cents of the target`,
  ringRatio:
    "the share of your sound in the 2.8 to 3.2 kHz band. Compare it only with your own earlier takes; it says nothing about strain",
  cycleDose:
    "how many vocal fold cycles a session used. It measures load, and there is no published safe ceiling to compare it with",
};

export function ModulePractice({ moduleId }: { moduleId: string }) {
  const practice = MODULE_PRACTICE[moduleId];
  if (!practice) return null;
  const { basis, companion } = practice;
  const match = practiceMatch(companion);
  const material = moduleMaterial(moduleId);

  return (
    <Card>
      <div className="space-y-4" data-module-practice={moduleId}>
        <SectionLabel>Practice</SectionLabel>
        <div className="max-w-2xl space-y-2">
          <h2 className="text-xl">Where to practise</h2>
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
            <LinkButton href={companionHref(companion)} size="md">
              Practise in {companionLabel(companion)}
            </LinkButton>
          </div>
          {match && <PracticeCount match={match} room={ROOM_LABELS[companion.room]} />}
        </div>

        {material.length > 0 && (
          <div>
            <h3 className="text-base">Practice material</h3>
            <p className="mt-1 text-sm text-mut">
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
                  {item.href ? (
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
