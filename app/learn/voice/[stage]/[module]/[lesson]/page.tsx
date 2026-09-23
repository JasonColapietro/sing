import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { LESSON_REFERENCES, LESSONS } from "@/lib/lesson-data";
import { Markdown } from "@/lib/markdown";
import { ORG_PUBLISHER_NODE } from "@/lib/organization";
import { withCanonicalOpenGraph } from "@/lib/og";
import { SITE_URL } from "@/lib/site";
import {
  VOICE_LEARN_PATH,
  findLesson,
  lessonById,
  lessonHref,
  neighbours,
} from "@/lib/voice-lessons";
import { CourseBreadcrumbs } from "@/components/learn/breadcrumbs";
import { ModulePractice } from "@/components/learn/module-practice";
import { VoiceSafetyNote } from "@/components/learn/safety-note";
import { Card, PageShell, SectionLabel } from "@/components/ui";

interface Params {
  stage: string;
  module: string;
  lesson: string;
}

export const dynamicParams = false;

export function generateStaticParams(): Params[] {
  return LESSONS.map((l) => ({ stage: l.stageSlug, module: l.moduleSlug, lesson: l.slug }));
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
  return withCanonicalOpenGraph({
    title: `${body.title} · ${found.module.catalog.name} Voice Lesson`,
    description: body.objective,
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

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "LearningResource",
        "@id": `${url}#lesson`,
        name: lesson.title,
        description: lesson.objective,
        url,
        learningResourceType: TYPE_LABEL[lesson.type] ?? lesson.type,
        timeRequired: `PT${lesson.minutes}M`,
        isAccessibleForFree: true,
        inLanguage: "en",
        isPartOf: { "@id": `${SITE_URL}${VOICE_LEARN_PATH}#course` },
        publisher: { "@id": ORG_PUBLISHER_NODE["@id"] },
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
      subtitle={lesson.objective}
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
              {lesson.steps.map((step, i) => (
                <li key={step.title}>
                  <h3 className="text-lg">
                    <span className="mr-2 font-mono text-sm text-dim">{i + 1}.</span>
                    {step.title}
                  </h3>
                  <Markdown source={step.body} />
                  <dl className="mt-3 space-y-1 text-sm">
                    <div>
                      <dt className="inline font-medium text-ink">Look: </dt>
                      <dd className="inline text-mut">{step.look}</dd>
                    </div>
                    <div>
                      <dt className="inline font-medium text-ink">Listen: </dt>
                      <dd className="inline text-mut">{step.listen}</dd>
                    </div>
                  </dl>
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

        <Card>
          <section aria-labelledby="recover" className="max-w-2xl">
            <h2 id="recover" className="text-xl">
              If it goes wrong
            </h2>
            <ul className="mt-3 space-y-3 text-sm">
              {lesson.mistakes.map((mk) => (
                <li key={mk.observation}>
                  <p className="text-ink">{mk.observation}</p>
                  <p className="text-mut">{mk.recovery}</p>
                </li>
              ))}
            </ul>
          </section>
        </Card>

        <Card>
          <section aria-labelledby="self-check" className="max-w-2xl" data-self-check>
            <h2 id="self-check" className="text-xl">
              Self-check
            </h2>
            <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-mut">
              {lesson.selfCheck.criteria.map((c) => (
                <li key={c}>{c}</li>
              ))}
            </ul>
            <dl className="mt-4 space-y-2 text-sm">
              <div>
                <dt className="font-medium text-ink">Ready when</dt>
                <dd className="text-mut">{lesson.selfCheck.readyWhen}</dd>
              </div>
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
            <Link href={lessonHref(previous)} className="text-violet-ink hover:underline">
              ← {previous.title}
            </Link>
          ) : (
            <span />
          )}
          {next && (
            <Link href={lessonHref(next)} className="text-violet-ink hover:underline">
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
