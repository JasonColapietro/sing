import type { Metadata } from "next";
import Link from "next/link";
import { DEFAULT_OG_IMAGE, withCanonicalOpenGraph } from "@/lib/og";
import { ORG_PUBLISHER_NODE } from "@/lib/organization";
import { SITE_URL } from "@/lib/site";
import { distinctPracticeMatch } from "@/lib/lesson-practice";
import { FREE_DAILY_MINUTES } from "@/lib/practice-limits";
import {
  CATALOG_LESSON_COUNT,
  COURSE,
  PORTED_LESSON_COUNT,
  VOICE_LEARN_PATH,
} from "@/lib/voice-lessons";
import { PracticedMark } from "@/components/learn/practice-count";
import { Card, LinkButton, PageShell, SectionLabel } from "@/components/ui";
import { VoiceSafetyNote } from "@/components/learn/safety-note";
import { ReferenceFigure, STAGE_FIGURES } from "@/components/learn/reference-figure";
import { CourseBreadcrumbs } from "@/components/learn/breadcrumbs";
import { routeKeywords } from "@/lib/keywords";

const TITLE = "Free Voice Lessons: Seven-Stage Singing Course";
const DESCRIPTION = `Free voice lessons: a seven-stage singing course of ${CATALOG_LESSON_COUNT} short lessons, from finding your range to registers, agility and style, each with a self-check.`;

export const metadata: Metadata = withCanonicalOpenGraph({
  keywords: routeKeywords("/learn/voice"),
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: `${SITE_URL}${VOICE_LEARN_PATH}` },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    type: "website",
    images: [DEFAULT_OG_IMAGE],
  },
});

export default function VoiceCoursePage() {
  const firstLesson = COURSE.flatMap((s) => s.modules.flatMap((m) => m.lessons)).find(
    (l) => l.href,
  );
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Course",
        "@id": `${SITE_URL}${VOICE_LEARN_PATH}#course`,
        name: TITLE,
        description: DESCRIPTION,
        url: `${SITE_URL}${VOICE_LEARN_PATH}`,
        isAccessibleForFree: true,
        inLanguage: "en",
        provider: { "@id": ORG_PUBLISHER_NODE["@id"] },
        hasCourseInstance: { "@type": "CourseInstance", courseMode: "online" },
      },
      ORG_PUBLISHER_NODE,
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Suede Sing", item: `${SITE_URL}/` },
          { "@type": "ListItem", position: 2, name: "Learn to sing", item: `${SITE_URL}/learn` },
          {
            "@type": "ListItem",
            position: 3,
            name: "Voice lessons",
            item: `${SITE_URL}${VOICE_LEARN_PATH}`,
          },
        ],
      },
    ],
  };

  return (
    <PageShell
      kicker="Free voice course"
      title="Free voice lessons, one small skill at a time"
      subtitle={`A free singing course of ${CATALOG_LESSON_COUNT} short voice lessons in ${COURSE.length} stages and ${COURSE.reduce((n, s) => n + s.modules.length, 0)} modules, from finding your range to registers, agility and style. Each lesson tells you what to practice, what to listen for, and which Suede Sing room to do it in.`}
      actions={
        firstLesson?.href ? (
          <LinkButton href={firstLesson.href} size="lg">
            Start lesson one
          </LinkButton>
        ) : undefined
      }
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <CourseBreadcrumbs trail={[]} current="Voice lessons" />
      <div className="space-y-8">
        <Card>
          <SectionLabel>How it works</SectionLabel>
          <h2 className="mt-3 text-2xl">Lessons teach, rooms measure</h2>
          <p className="mt-3 max-w-3xl text-mut">
            Every lesson ends in a self-check: your own listening judgement,
            written down. Where a Suede Sing room can measure part of the work,
            such as pitch against a target, a sustain or your range, the lesson
            links to it and says what the number does and doesn&apos;t tell
            you. Where nothing can measure it, such as strain, vibrato on cue or
            a register break, the lesson says so rather than pretending.
          </p>
          <p className="mt-3 max-w-3xl text-mut" data-course-pacing>
            Take one module at a time: repeat its exercise lessons over several
            short sessions, and move on when the module&apos;s self-check still
            holds on a second day.
          </p>
          {/* Lines every lesson shared (UNIVERSAL_LESSON_TEXT and the compiler's filter), said once here. */}
          <div className="mt-5 max-w-3xl" data-course-rules>
            <h3 className="text-lg">The same rules in every lesson</h3>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-mut">
              <li>
                Before the first attempt, settle your posture, room and device,
                and decide where you will stop.
              </li>
              <li>
                Start from an easy, repeatable sound, and silence playback before
                you judge your own voice.
              </li>
              <li>
                Reference notes are synthesized pitches, not recordings of a
                singer showing you a technique.
              </li>
              <li>Note the key and setup you used, so the next comparison is fair.</li>
              <li>
                Say what will count as complete before you practise, and keep
                every attempt inside the range and duration you can repeat
                comfortably.
              </li>
              <li>
                After each take, compare it with the material and write one
                smaller correction for next time.
              </li>
              <li>Treat a missing or uncertain reading as missing, never as a pass.</li>
              <li>
                Every self-check is a self-report, not an automatic assessment:
                nothing here produces an automatic pitch, rhythm, register, tone
                or safety result.
              </li>
              <li>
                Unless a self-check says otherwise, it is ready when you can
                describe the result and choose one useful next attempt. Not
                ready? Repeat a smaller version on a fresh attempt rather than
                forcing the checkpoint, unless the lesson&apos;s own stop rule
                says otherwise.
              </li>
            </ul>
          </div>
          <p className="mt-5 max-w-3xl text-sm text-mut" data-guided-cap>
            Reading every lesson is free. Lessons that send you to warm-ups,
            breath, ear training or songs use the shared {FREE_DAILY_MINUTES}-minute
            daily allowance of guided practice, which{" "}
            <Link href="/pro" className="text-violet-ink underline underline-offset-4">
              Pro
            </Link>{" "}
            removes. The pitch studio, range test, recorder and tools have no
            clock.
          </p>
          {PORTED_LESSON_COUNT < CATALOG_LESSON_COUNT && (
            <p className="mt-3 max-w-3xl text-sm text-dim" data-ported-lessons={PORTED_LESSON_COUNT}>
              {PORTED_LESSON_COUNT} of {CATALOG_LESSON_COUNT} lessons are published
              here so far. The rest are listed and will link as they arrive.
            </p>
          )}
        </Card>

        {/*
          The course links don't prefetch: with seven stages, 34 modules and
          102 lessons, prefetching each one as it scrolled into view pulled
          about 860 KB of pages nobody had opened.
        */}
        {COURSE.map((stage) => (
          <section
            key={stage.catalog.id}
            aria-labelledby={`stage-${stage.catalog.stage}`}
            data-course-stage={stage.catalog.id}
            className="space-y-4"
          >
            <div className="flex max-w-3xl flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
              <div>
              <SectionLabel>Stage {stage.catalog.stage}</SectionLabel>
              <h2 id={`stage-${stage.catalog.stage}`} className="mt-3 text-2xl">
                {stage.href ? (
                  <Link href={stage.href} prefetch={false} className="hover:text-violet-ink">
                    {stage.catalog.name}
                  </Link>
                ) : (
                  stage.catalog.name
                )}
              </h2>
              <p className="mt-2 text-mut">{stage.catalog.subtitle}</p>
              </div>
              {STAGE_FIGURES[stage.catalog.id] && (
                // Above the stage label on a phone, scaled down; beside it from sm up.
                <ReferenceFigure
                  kind={STAGE_FIGURES[stage.catalog.id]}
                  className="order-first h-10 w-auto sm:order-none sm:mt-1 sm:h-12"
                />
              )}
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {stage.modules.map((module) => {
                // Only a room session no other module shares marks a module practised.
                const match = distinctPracticeMatch(module.catalog.id);
                return (
                  <Card key={module.catalog.id}>
                    <div data-course-module={module.catalog.id}>
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <h3 className="text-lg">
                          {module.href ? (
                            <Link href={module.href} prefetch={false} className="hover:text-violet-ink">
                              {module.catalog.name}
                            </Link>
                          ) : (
                            module.catalog.name
                          )}
                        </h3>
                        {match && <PracticedMark match={match} />}
                      </div>
                      <p className="mt-1 text-sm text-mut">{module.catalog.skill}</p>
                      <ol className="mt-3 space-y-1 text-sm">
                        {module.lessons.map((lesson) => (
                          <li key={lesson.catalog.id} className="flex gap-2">
                            <span className="shrink-0 whitespace-nowrap font-mono text-xs text-dim">
                              {lesson.catalog.minutes} min
                            </span>
                            {lesson.href ? (
                              <Link
                                href={lesson.href}
                                prefetch={false}
                                data-lesson-id={lesson.catalog.id}
                                className="text-violet-ink hover:underline"
                              >
                                {lesson.catalog.title}
                              </Link>
                            ) : (
                              <span className="text-mut">{lesson.catalog.title}</span>
                            )}
                          </li>
                        ))}
                      </ol>
                    </div>
                  </Card>
                );
              })}
            </div>
          </section>
        ))}

        <VoiceSafetyNote />
      </div>
    </PageShell>
  );
}
