import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { withCanonicalOpenGraph } from "@/lib/og";
import { SITE_URL } from "@/lib/site";
import { MODULE_PRACTICE, practiceMatch } from "@/lib/lesson-practice";
import { COURSE, VOICE_LEARN_PATH, findStage } from "@/lib/voice-lessons";
import { CourseBreadcrumbs } from "@/components/learn/breadcrumbs";
import { PracticedMark } from "@/components/learn/practice-count";
import { VoiceSafetyNote } from "@/components/learn/safety-note";
import { Card, PageShell } from "@/components/ui";

interface Params {
  stage: string;
}

export const dynamicParams = false;

export function generateStaticParams(): Params[] {
  return COURSE.flatMap((s) => (s.slug ? [{ stage: s.slug }] : []));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { stage: slug } = await params;
  const stage = findStage(slug);
  if (!stage) return {};
  const { catalog } = stage;
  return withCanonicalOpenGraph({
    title: `Stage ${catalog.stage}: ${catalog.name} · Voice Lessons`,
    description: `${catalog.subtitle}. ${catalog.modules.length} modules of short, free singing lessons, each with a self-check and a room to practise in.`,
    alternates: { canonical: `${SITE_URL}${stage.href}` },
  });
}

export default async function StagePage({ params }: { params: Promise<Params> }) {
  const { stage: slug } = await params;
  const stage = findStage(slug);
  if (!stage) notFound();
  const { catalog } = stage;
  const index = COURSE.indexOf(stage);
  const previous = COURSE[index - 1];
  const next = COURSE[index + 1];

  return (
    <PageShell
      kicker={`Voice lessons · Stage ${catalog.stage} of ${COURSE.length}`}
      title={catalog.name}
      subtitle={catalog.subtitle}
    >
      <CourseBreadcrumbs trail={[{ href: VOICE_LEARN_PATH, label: "Voice lessons" }]} current={catalog.name} />
      <div className="space-y-6">
        {stage.modules.map((module) => {
          const practice = MODULE_PRACTICE[module.catalog.id];
          const match = practice ? practiceMatch(practice.companion) : undefined;
          return (
            <Card key={module.catalog.id}>
              <div data-course-module={module.catalog.id} className="max-w-3xl">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h2 className="text-xl">
                    {module.href ? (
                      <Link href={module.href} className="hover:text-violet-ink">
                        {module.catalog.name}
                      </Link>
                    ) : (
                      module.catalog.name
                    )}
                  </h2>
                  {match && <PracticedMark match={match} />}
                </div>
                <p className="mt-2 text-sm text-mut">
                  Outcome: I {module.catalog.promise}
                </p>
                <ol className="mt-3 space-y-1 text-sm">
                  {module.lessons.map((lesson) => (
                    <li key={lesson.catalog.id} className="flex gap-2">
                      <span className="font-mono text-xs text-dim">
                        {lesson.catalog.minutes} min
                      </span>
                      {lesson.href ? (
                        <Link href={lesson.href} className="text-violet-ink hover:underline">
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
        <nav aria-label="Stages" className="flex flex-wrap justify-between gap-3 text-sm">
          {previous?.href ? (
            <Link href={previous.href} className="inline-block py-0.5 text-violet-ink hover:underline">
              ← Stage {previous.catalog.stage}: {previous.catalog.name}
            </Link>
          ) : (
            <span />
          )}
          {next?.href && (
            <Link href={next.href} className="inline-block py-0.5 text-violet-ink hover:underline">
              Stage {next.catalog.stage}: {next.catalog.name} →
            </Link>
          )}
        </nav>
        <VoiceSafetyNote />
      </div>
    </PageShell>
  );
}
