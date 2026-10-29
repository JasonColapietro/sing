import type { Metadata } from "next";
import { lessonKeywords } from "@/lib/keywords";
import Link from "next/link";
import { notFound } from "next/navigation";
import { moduleTerms } from "@/lib/lesson-glossary";
import { firstFit } from "@/lib/meta-fit";
import { withCanonicalOpenGraph } from "@/lib/og";
import { webPageJsonLd } from "@/lib/page-jsonld";
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
import { SafetyLine } from "@/components/learn/safety-note";
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

type Found = NonNullable<ReturnType<typeof findModule>>;

// The stage number is dropped first when the budget is short: the module name
// is the distinct part, and the bare name is still unique across the course.
function moduleTitle({ stage, module }: Found): string {
  const { name } = module.catalog;
  return firstFit([
    `${name} · Stage ${stage.catalog.stage} Voice Lessons`,
    `${name} · Voice Lessons`,
    name,
  ]);
}

function moduleDescription({ module }: Found): string {
  const { catalog } = module;
  return `${catalog.name}: ${catalog.lessons.length} short, free voice lessons on ${lowerFirst(catalog.skill)}, each ending in a self-check you judge by ear.`;
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
    title: moduleTitle(found),
    keywords: lessonKeywords({ name: catalog.name, skill: catalog.skill }),
    description: moduleDescription(found),
    alternates: { canonical: `${SITE_URL}${found.module.href}` },
  });
}

export default async function ModulePage({ params }: { params: Promise<Params> }) {
  const { stage: stageSlug, module: moduleSlug } = await params;
  const found = findModule(stageSlug, moduleSlug);
  if (!found) notFound();
  const { stage, module } = found;
  const { previous, next } = moduleNeighbours(module);
  const terms = moduleTerms(module.catalog.id);
  const stageHref = stage.href ?? VOICE_LEARN_PATH;
  const href = module.href ?? stageHref;
  // The same trail the CourseBreadcrumbs nav renders, and the same names the
  // lesson pages give it.
  const jsonLd = webPageJsonLd({
    type: "CollectionPage",
    path: href,
    name: module.catalog.name,
    description: moduleDescription(found),
    breadcrumbs: [
      { name: "Learn to sing", path: "/learn" },
      { name: "Voice lessons", path: VOICE_LEARN_PATH },
      { name: stage.catalog.name, path: stageHref },
      { name: module.catalog.name, path: href },
    ],
  });

  return (
    <PageShell
      kicker={`Stage ${stage.catalog.stage} · ${stage.catalog.name} · ${module.lessons.length} lessons · ${moduleMinutes(module)} min`}
      title={`${module.catalog.name}: voice lessons on ${lowerFirst(module.catalog.skill)}`}
      subtitle={`By the end you can say: I ${module.catalog.promise}`}
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
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
            <p className="sr-only" data-module-outcome>
              I {module.catalog.promise}
            </p>
            <h2 className="text-xl">Lessons</h2>
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
            {terms.length > 0 && (
              <p className="mt-6 text-sm text-mut" data-module-terms>
                Terms used here:{" "}
                {terms.map((t, i) => (
                  <span key={t.term}>
                    {i > 0 && ", "}
                    <Link href={t.href} className="text-violet-ink underline decoration-violet/40 underline-offset-2 hover:decoration-violet">
                      {t.term}
                    </Link>
                  </span>
                ))}
                , defined in the glossary.
              </p>
            )}
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
        <SafetyLine />
      </div>
    </PageShell>
  );
}
