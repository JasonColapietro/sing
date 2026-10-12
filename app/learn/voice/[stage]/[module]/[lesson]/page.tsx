import type { Metadata } from "next";
import { lessonKeywords } from "@/lib/keywords";
import Link from "next/link";
import { notFound } from "next/navigation";
import { LESSON_REFERENCES, LESSONS } from "@/lib/lesson-data";
import { Markdown } from "@/lib/markdown";
import { ORG_PUBLISHER_NODE } from "@/lib/organization";
import {
  MODULE_PRACTICE,
  companionHref,
  companionLabel,
  isGuidedPractice,
} from "@/lib/lesson-practice";
import { MAX_TITLE, MAX_TITLE_BODY } from "@/lib/meta-fit";
import { withCanonicalOpenGraph } from "@/lib/og";
import { SITE_URL } from "@/lib/site";
import {
  UNIVERSAL_LESSON_TEXT,
  VOICE_LEARN_PATH,
  findLesson,
  lessonById,
  lessonHref,
  neighbours,
  shownSteps,
} from "@/lib/voice-lessons";
import { CourseBreadcrumbs } from "@/components/learn/breadcrumbs";
import { GuidedCapNote, ModulePractice } from "@/components/learn/module-practice";
import { VoiceSafetyNote } from "@/components/learn/safety-note";
import { Card, LinkButton, PageShell, SectionLabel } from "@/components/ui";

interface Params {
  stage: string;
  module: string;
  lesson: string;
}

export const dynamicParams = false;

export function generateStaticParams(): Params[] {
  return LESSONS.map((l) => ({ stage: l.stageSlug, module: l.moduleSlug, lesson: l.slug }));
}

/** What the description calls each lesson type, in running text. */
const DESCRIPTION_KIND: Record<string, string> = {
  concept: "lesson",
  exercise: "exercise",
  song: "song lesson",
  checkpoint: "self-check",
};

type Found = NonNullable<ReturnType<typeof findLesson>>;

/** "An 8-minute", "An 11-minute", "A 5-minute": the article follows the spoken number. */
function minuteArticle(minutes: number): "A" | "An" {
  return /^(?:8\d*|11|18)$/.test(String(minutes)) ? "An" : "A";
}

/**
 * The objective, then what and where the lesson is. Shown under the h1 and used
 * as the search snippet, so the first thing a reader and a crawler meet is the
 * same answer. Many objectives are one short line ("Three ways to attack the
 * same note."), which on their own say nothing about the page.
 */
function lessonAnswer({ stage, module, lesson }: Found): string {
  const body = lesson.body;
  return `${body.objective} ${minuteArticle(body.minutes)} ${body.minutes}-minute ${DESCRIPTION_KIND[body.type] ?? "lesson"} from ${module.catalog.name}, Stage ${stage.catalog.stage} of the free Suede Sing voice course.`;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { stage, module, lesson } = await params;
  const found = findLesson(stage, module, lesson);
  if (!found) return {};
  const { body } = found.lesson;
  const moduleName = found.module.catalog.name;
  // fitTitle() alone sheds the whole tail, which left 94 of 102 lessons in
  // search as a bare phrase ("Drift Correction") with nothing saying it is a
  // singing lesson. Keep "Voice Lesson" whenever the budget allows: with the
  // site name if it fits, else without it, since saying what the page is
  // matters more in a result than saying whose it is. Only a title too long
  // for even that falls back to the bare name, which keeps the site name.
  const withModule = `${body.title} · ${moduleName} Voice Lesson`;
  const short = `${body.title} · Voice Lesson`;
  const templated = [withModule, short].find((t) => t.length <= MAX_TITLE_BODY);
  return withCanonicalOpenGraph({
    title: templated ?? (short.length <= MAX_TITLE ? { absolute: short } : body.title),
    // The objective leads, as the catalog wrote it. Most objectives are one
    // short line (64 of 102 under 100 characters), so the second sentence says
    // what and where the page is, from the same fields the kicker shows;
    // fitDescription drops it whole when the objective needs the room.
    description: lessonAnswer(found),
    keywords: lessonKeywords({ name: body.title, group: found.module.catalog.name }),
    alternates: { canonical: `${SITE_URL}${lessonHref(body)}` },
  });
}

const TYPE_LABEL: Record<string, string> = {
  concept: "Concept",
  exercise: "Exercise",
  song: "Song",
  checkpoint: "Self-check",
};


export default async function LessonPage({ params }: { params: Promise<Params> }) {
  const { stage: s, module: m, lesson: l } = await params;
  const found = findLesson(s, m, l);
  if (!found) notFound();
  const { stage, module } = found;
  const lesson = found.lesson.body;
  const { previous, next } = neighbours(lesson.id);
  const prerequisites = lesson.prerequisites.flatMap((id) => {
    const p = lessonById(id);
    return p ? [p] : [];
  });
  const references = LESSON_REFERENCES.filter((r) => lesson.references.includes(r.id));
  const url = `${SITE_URL}${lessonHref(lesson)}`;
  const practice = MODULE_PRACTICE[module.catalog.id];
  // The course-wide lines (UNIVERSAL_LESSON_TEXT) are stated once on
  // /learn/voice; here they would bury what this lesson says of its own.
  const own = (text: string) => !UNIVERSAL_LESSON_TEXT.has(text);
  const steps = shownSteps(lesson);
  // The port repeats a step's look/listen checks word for word under the next
  // step; print each check once, under the first step that sets it.
  const printedChecks = new Set<string>();
  const stepChecks = steps.map((step) => {
    const fresh = (text: string) => own(text) && !printedChecks.has(text);
    const checks = {
      look: fresh(step.look) ? step.look : "",
      listen: fresh(step.listen) ? step.listen : "",
    };
    printedChecks.add(step.look).add(step.listen);
    return checks;
  });
  const mistakes = lesson.mistakes.filter((mk) => own(mk.recovery));
  const criteria = lesson.selfCheck.criteria.filter(own);

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "LearningResource",
        "@id": `${url}#lesson`,
        name: lesson.title,
        description: lesson.explanation || lesson.objective,
        url,
        learningResourceType: TYPE_LABEL[lesson.type] ?? lesson.type,
        timeRequired: `PT${lesson.minutes}M`,
        isAccessibleForFree: true,
        inLanguage: "en",
        isPartOf: { "@id": `${SITE_URL}${VOICE_LEARN_PATH}#course` },
        // The node itself, not a bare @id: nothing else in this document
        // defines the publisher, so a pointer resolved to no name or logo.
        publisher: ORG_PUBLISHER_NODE,
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Learn to sing", item: `${SITE_URL}/learn` },
          { "@type": "ListItem", position: 2, name: "Voice lessons", item: `${SITE_URL}${VOICE_LEARN_PATH}` },
          { "@type": "ListItem", position: 3, name: stage.catalog.name, item: `${SITE_URL}${stage.href}` },
          { "@type": "ListItem", position: 4, name: module.catalog.name, item: `${SITE_URL}${module.href}` },
          { "@type": "ListItem", position: 5, name: lesson.title, item: url },
        ],
      },
    ],
  };

  return (
    <PageShell
      kicker={`Stage ${stage.catalog.stage} · ${module.catalog.name} · ${TYPE_LABEL[lesson.type] ?? lesson.type} · ${lesson.minutes} min`}
      title={lesson.title}
      subtitle={lessonAnswer(found)}
      actions={
        practice ? (
          // The room first, for a reader who came to sing: the panel further
          // down says what the room measures.
          <div className="flex flex-col items-start gap-2">
            <LinkButton href={companionHref(practice.companion)} size="lg">
              Open {companionLabel(practice.companion)}
            </LinkButton>
            {isGuidedPractice(practice.companion) && <GuidedCapNote />}
          </div>
        ) : undefined
      }
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <CourseBreadcrumbs
        trail={[
          { href: VOICE_LEARN_PATH, label: "Voice lessons" },
          { href: stage.href ?? VOICE_LEARN_PATH, label: stage.catalog.name },
          { href: module.href ?? VOICE_LEARN_PATH, label: module.catalog.name },
        ]}
        current={lesson.title}
      />
      <div className="space-y-6" data-lesson={lesson.id}>
        {lesson.explanation && (
          <Card>
            <div className="max-w-2xl">
              <SectionLabel>In short</SectionLabel>
              <p data-lesson-answer className="mt-3 text-ink/85">
                {lesson.explanation}
              </p>
            </div>
          </Card>
        )}

        {prerequisites.length > 0 && (
          <p className="text-sm text-mut">
            Builds on{" "}
            {prerequisites.map((p, i) => (
              <span key={p.id}>
                {i > 0 && ", "}
                <Link href={lessonHref(p)} className="text-violet-ink hover:underline">
                  {p.title}
                </Link>
              </span>
            ))}
            .
          </p>
        )}

        <Card>
          <section aria-labelledby="steps" className="max-w-2xl">
            <SectionLabel>Steps</SectionLabel>
            <h2 id="steps" className="mt-3 text-2xl">
              How to practise it
            </h2>
            <ol className="mt-4 space-y-6">
              {steps.map((step, i) => (
                <li key={step.title}>
                  <h3 className="text-lg">
                    <span className="mr-2 font-mono text-sm text-dim">{i + 1}.</span>
                    {step.title}
                  </h3>
                  <Markdown source={step.body} />
                  {(stepChecks[i].look || stepChecks[i].listen) && (
                    <dl className="mt-3 space-y-1 text-sm">
                      {stepChecks[i].look && (
                        <div>
                          <dt className="inline font-medium text-ink">Look: </dt>
                          <dd className="inline text-mut">{stepChecks[i].look}</dd>
                        </div>
                      )}
                      {stepChecks[i].listen && (
                        <div>
                          <dt className="inline font-medium text-ink">Listen: </dt>
                          <dd className="inline text-mut">{stepChecks[i].listen}</dd>
                        </div>
                      )}
                    </dl>
                  )}
                </li>
              ))}
            </ol>
          </section>
        </Card>

        <ModulePractice moduleId={module.catalog.id} />

        <Card>
          <section aria-labelledby="blocks" className="max-w-2xl">
            <h2 id="blocks" className="text-xl">
              Practice blocks
            </h2>
            <p className="mt-1 text-sm text-mut">
              A guide to the {lesson.minutes} minutes, rests and review included.
              Pause or repeat any block.
            </p>
            <ol className="mt-3 space-y-2 text-sm">
              {lesson.blocks.map((b) => (
                <li key={b.instruction} className="flex gap-3">
                  <span className="w-12 shrink-0 font-mono text-dim">{b.seconds} s</span>
                  <span className="text-mut">{b.instruction}</span>
                </li>
              ))}
            </ol>
          </section>
        </Card>

        {mistakes.length > 0 && (
          <Card>
            <section aria-labelledby="recover" className="max-w-2xl">
              <h2 id="recover" className="text-xl">
                If it goes wrong
              </h2>
              <ul className="mt-3 space-y-3 text-sm">
                {/*
                  The port gave every lesson the same generic symptom; its
                  recovery names its own ("If …", "Stop …"), so the shared
                  observation is left out rather than printed over an
                  answer to something else.
                */}
                {mistakes.map((mk) => (
                  <li key={mk.recovery}>
                    {own(mk.observation) && <p className="text-ink">{mk.observation}</p>}
                    <p className="text-mut">{mk.recovery}</p>
                  </li>
                ))}
              </ul>
            </section>
          </Card>
        )}

        <Card>
          <section aria-labelledby="self-check" className="max-w-2xl" data-self-check>
            <h2 id="self-check" className="text-xl">
              Self-check
            </h2>
            {criteria.length > 0 && (
              <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-mut">
                {criteria.map((c) => (
                  <li key={c}>{c}</li>
                ))}
              </ul>
            )}
            <dl className="mt-4 space-y-2 text-sm">
              {own(lesson.selfCheck.readyWhen) && (
                <div>
                  <dt className="font-medium text-ink">Ready when</dt>
                  <dd className="text-mut">{lesson.selfCheck.readyWhen}</dd>
                </div>
              )}
              <div>
                <dt className="font-medium text-ink">If you&apos;re not ready</dt>
                <dd className="text-mut">{lesson.selfCheck.ifNotReady}</dd>
              </div>
              <div>
                <dt className="font-medium text-ink">What this shows</dt>
                <dd className="text-mut">{lesson.selfCheck.shows}</dd>
              </div>
              <div>
                <dt className="font-medium text-ink">What this does not show</dt>
                <dd className="text-mut" data-does-not-show>
                  {lesson.selfCheck.doesNotShow}
                </dd>
              </div>
            </dl>
          </section>
        </Card>

        <nav aria-label="Lessons" className="flex flex-wrap justify-between gap-3 text-sm">
          {previous ? (
            <Link href={lessonHref(previous)} className="inline-block py-0.5 text-violet-ink hover:underline">
              ← {previous.title}
            </Link>
          ) : (
            <span />
          )}
          {next && (
            <Link href={lessonHref(next)} className="inline-block py-0.5 text-violet-ink hover:underline">
              {next.title} →
            </Link>
          )}
        </nav>

        {references.length > 0 && (
          <p className="max-w-3xl text-xs text-dim">
            Sources:{" "}
            {references.map((r, i) => (
              <span key={r.id}>
                {i > 0 && "; "}
                <a href={r.url} className="underline hover:text-ink" rel="noopener">
                  {r.title}
                </a>
                {" "}({r.supports.replace(/\.$/, "")})
              </span>
            ))}
            .
          </p>
        )}
        <VoiceSafetyNote />
      </div>
    </PageShell>
  );
}
