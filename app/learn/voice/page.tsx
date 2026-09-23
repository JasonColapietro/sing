import type { Metadata } from "next";
import Link from "next/link";
import { DEFAULT_OG_IMAGE, withCanonicalOpenGraph } from "@/lib/og";
import { ORG_PUBLISHER_NODE } from "@/lib/organization";
import { SITE_URL } from "@/lib/site";
import { practiceMatch, MODULE_PRACTICE } from "@/lib/lesson-practice";
import {
  CATALOG_LESSON_COUNT,
  COURSE,
  PORTED_LESSON_COUNT,
  VOICE_LEARN_PATH,
} from "@/lib/voice-lessons";
import { PracticedMark } from "@/components/learn/practice-count";
import { Card, LinkButton, PageShell, SectionLabel } from "@/components/ui";
import { VoiceSafetyNote } from "@/components/learn/safety-note";

const TITLE = "Voice Lessons: A Free Seven-Stage Singing Course";
const DESCRIPTION = `A free singing course in seven stages and ${CATALOG_LESSON_COUNT} short lessons, from setting up your room and finding your range to registers, agility and style. Each lesson sends you to the Suede Sing room where you practise it.`;

export const metadata: Metadata = withCanonicalOpenGraph({
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
      title="Voice lessons, one small skill at a time"
      subtitle={`Seven stages, ${COURSE.reduce((n, s) => n + s.modules.length, 0)} modules and ${CATALOG_LESSON_COUNT} short lessons. Each lesson tells you what to practise, what to listen for, and which Suede Sing room to do it in.`}
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
      <div className="space-y-8">
        <Card>
          <SectionLabel>How it works</SectionLabel>
          <h2 className="mt-3 text-2xl">Lessons teach, rooms measure</h2>
          <p className="mt-3 max-w-3xl text-mut">
            Every lesson ends in a self-check: your own listening judgement,
            written down. Where a Suede Sing room can measure part of the work,
            such as pitch against a target, a sustain or your range, the lesson
            links to it and says what the number does and doesn&apos;t tell
            you. Where nothing can measure it, such as strain, vibrato rate or
            a register break, the lesson says so rather than pretending.
          </p>
          {PORTED_LESSON_COUNT < CATALOG_LESSON_COUNT && (
            <p className="mt-3 max-w-3xl text-sm text-dim" data-ported-lessons={PORTED_LESSON_COUNT}>
              {PORTED_LESSON_COUNT} of {CATALOG_LESSON_COUNT} lessons are published
              here so far. The rest are listed and will link as they arrive.
            </p>
          )}
        </Card>

        {COURSE.map((stage) => (
          <section
            key={stage.catalog.id}
            aria-labelledby={`stage-${stage.catalog.stage}`}
            data-course-stage={stage.catalog.id}
            className="space-y-4"
          >
            <div className="max-w-3xl">
              <SectionLabel>Stage {stage.catalog.stage}</SectionLabel>
              <h2 id={`stage-${stage.catalog.stage}`} className="mt-3 text-2xl">
                {stage.href ? (
                  <Link href={stage.href} className="hover:text-violet-ink">
                    {stage.catalog.name}
                  </Link>
                ) : (
                  stage.catalog.name
                )}
              </h2>
              <p className="mt-2 text-mut">{stage.catalog.subtitle}</p>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {stage.modules.map((module) => {
                const practice = MODULE_PRACTICE[module.catalog.id];
                const match = practice ? practiceMatch(practice.companion) : undefined;
                return (
                  <Card key={module.catalog.id}>
                    <div data-course-module={module.catalog.id}>
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <h3 className="text-lg">
                          {module.href ? (
                            <Link href={module.href} className="hover:text-violet-ink">
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
                            <span className="font-mono text-xs text-dim">
                              {lesson.catalog.minutes} min
                            </span>
                            {lesson.href ? (
                              <Link
                                href={lesson.href}
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
