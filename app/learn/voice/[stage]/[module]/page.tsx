import type { Metadata } from "next";
import { lessonKeywords } from "@/lib/keywords";
import Link from "next/link";
import { notFound } from "next/navigation";
import { withCanonicalOpenGraph } from "@/lib/og";
import { SITE_URL } from "@/lib/site";
import {
  COURSE,
  VOICE_LEARN_PATH,
  findModule,
  lowerFirst,
  moduleMinutes,
  moduleNeighbours,
} from "@/lib/voice-lessons";
import { CourseBreadcrumbs } from "@/components/learn/breadcrumbs";
import { ModulePractice } from "@/components/learn/module-practice";
import { VoiceSafetyNote } from "@/components/learn/safety-note";
import { Card, PageShell } from "@/components/ui";

interface Params {
  stage: string;
  module: string;
}

export const dynamicParams = false;

export function generateStaticParams(): Params[] {
  return COURSE.flatMap((s) =>
    s.modules.flatMap((m) => (s.slug && m.slug ? [{ stage: s.slug, module: m.slug }] : [])),
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { stage, module } = await params;
  const found = findModule(stage, module);
  if (!found) return {};
  const { catalog } = found.module;
  return withCanonicalOpenGraph({
    title: `${catalog.name} · Stage ${found.stage.catalog.stage} Voice Lessons`,
    keywords: lessonKeywords({ name: catalog.name, skill: catalog.skill }),
    description: `${catalog.name}: ${catalog.lessons.length} short, free voice lessons on ${lowerFirst(catalog.skill)}. The outcome: I ${catalog.promise}`,
    alternates: { canonical: `${SITE_URL}${found.module.href}` },
  });
}

export default async function ModulePage({ params }: { params: Promise<Params> }) {
  const { stage: stageSlug, module: moduleSlug } = await params;
  const found = findModule(stageSlug, moduleSlug);
  if (!found) notFound();
  const { stage, module } = found;
  const { previous, next } = moduleNeighbours(module);

  return (
    <PageShell
      kicker={`Stage ${stage.catalog.stage} · ${stage.catalog.name}`}
      title={`${module.catalog.name}: voice lessons on ${lowerFirst(module.catalog.skill)}`}
      subtitle={`${module.lessons.length} short, free lessons, ${moduleMinutes(module)} minutes in all, from stage ${stage.catalog.stage} of the voice course, ${stage.catalog.name}. Each one ends in a self-check you judge by ear.`}
    >
      <CourseBreadcrumbs
        trail={[
          { href: VOICE_LEARN_PATH, label: "Voice lessons" },
          { href: stage.href ?? VOICE_LEARN_PATH, label: stage.catalog.name },
        ]}
        current={module.catalog.name}
      />
      <div className="space-y-6">
        <Card>
          <div className="max-w-3xl">
            <h2 className="text-xl">What you&apos;ll be able to say</h2>
            <p className="mt-2 text-mut" data-module-outcome>
              I {module.catalog.promise}
            </p>
            <h2 className="mt-6 text-xl">Lessons</h2>
            <ol className="mt-3 space-y-3">
              {module.lessons.map((lesson, i) => (
                <li key={lesson.catalog.id} className="flex gap-3">
                  <span className="font-mono text-sm text-dim">{i + 1}.</span>
                  <div>
                    {lesson.href ? (
                      <Link href={lesson.href} className="text-violet-ink hover:underline">
                        {lesson.catalog.title}
                      </Link>
                    ) : (
                      <span className="text-mut">{lesson.catalog.title}</span>
                    )}
                    <p className="text-sm text-mut">
                      {lesson.catalog.minutes} min · {lesson.catalog.summary}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </Card>
        <ModulePractice moduleId={module.catalog.id} />
        <nav aria-label="Modules" className="flex flex-wrap justify-between gap-3 text-sm">
          {previous?.href ? (
            <Link href={previous.href} className="inline-block py-0.5 text-violet-ink hover:underline">
              ← {previous.catalog.name} lessons
            </Link>
          ) : (
            <span />
          )}
          {next?.href && (
            <Link href={next.href} className="inline-block py-0.5 text-violet-ink hover:underline">
              {next.catalog.name} lessons →
            </Link>
          )}
        </nav>
        <VoiceSafetyNote />
      </div>
    </PageShell>
  );
}
