import type { Metadata } from "next";
import { lessonKeywords } from "@/lib/keywords";
import Link from "next/link";
import { notFound } from "next/navigation";
import { LESSON_REFERENCES, LESSONS } from "@/lib/lesson-data";
import { Markdown } from "@/lib/markdown";
import { ORG_PUBLISHER_NODE } from "@/lib/organization";
import { MODULE_PRACTICE, lessonCompanion } from "@/lib/lesson-practice";
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
  notReadyAdvice,
  echoesObjective,
  shownSteps,
} from "@/lib/voice-lessons";
import { CourseBreadcrumbs } from "@/components/learn/breadcrumbs";
import { CompanionButtons, ModulePractice } from "@/components/learn/module-practice";
import { SafetyLine } from "@/components/learn/safety-note";
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

/** The search snippet: the objective, then what and where the lesson is (the subtitle shows the objective alone). */
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
  // Keep "Voice Lesson" whenever the budget allows; only an over-long name drops it.
  const withModule = `${body.title} · ${moduleName} Voice Lesson`;
  const short = `${body.title} · Voice Lesson`;
  const templated = [withModule, short].find((t) => t.length <= MAX_TITLE_BODY);
  return withCanonicalOpenGraph({
    title: templated ?? (short.length <= MAX_TITLE ? { absolute: short } : body.title),
    description: lessonAnswer(found),
    keywords: lessonKeywords({ name: body.title, group: found.module.catalog.name }),
    alternates: { canonical: `${SITE_URL}${lessonHref(body)}` },
  });
}

/** What each of the port's four blocks is, for the timing line: nouns, read as "45 s setup". */
const BLOCK_ROLES = ["setup", "isolation", "practice", "review"];

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
  // The room this lesson's own steps send the singer to, which for an
  // exercise practised in the recorder is not the module's range test.
  const companion = practice ? lessonCompanion(practice, lesson.id) : undefined;
  // Course-wide lines (UNIVERSAL_LESSON_TEXT) are said once on /learn/voice.
  const own = (text: string) => !UNIVERSAL_LESSON_TEXT.has(text);
  const steps = shownSteps(lesson);
  // Print each look/listen check once, under the first step that sets it.
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
  // The compiler blanks the port's template blocks; four timings then read as one line.
  const ownBlocks = lesson.blocks.some((b) => b.instruction);
  const { shows, doesNotShow } = lesson.selfCheck;
  // Said once: a sentence already printed as a recovery above is not repeated here.
  const ifNotReady = notReadyAdvice(lesson, mistakes.map((mk) => mk.recovery));

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
      subtitle={lesson.objective}
      actions={
        companion ? (
          // The room first; the practice panel below carries the one cap note.
          <CompanionButtons companion={companion} size="lg" capNote={false} />
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
                <Link href={lessonHref(p)} className="text-violet-ink underline decoration-violet/40 underline-offset-2 hover:decoration-violet">
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
              How to practice it
            </h2>
            <ol className="mt-4 space-y-6">
              {steps.map((step, i) => (
                <li key={step.title}>
                  <h3 className="text-lg">
                    <span className="mr-2 font-mono text-sm text-dim">{i + 1}.</span>
                    {step.title}
                  </h3>
                  {!echoesObjective(step, lesson) && <Markdown source={step.body} />}
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

        <ModulePractice moduleId={module.catalog.id} lessonId={lesson.id} />

        <Card>
          <section aria-labelledby="blocks" className="max-w-2xl">
            <h2 id="blocks" className="text-xl">
              {lesson.minutes} minutes, {lesson.blocks.length} blocks
            </h2>
            <p className="mt-1 text-sm text-mut">
              Rests and review included. Pause or repeat any block.
            </p>
            {ownBlocks ? (
              <ol className="mt-3 space-y-2 text-sm">
                {lesson.blocks.map((b, i) => (
                  <li key={`${i}-${b.instruction}`} className="flex gap-3">
                    <span className="w-12 shrink-0 font-mono text-dim">{b.seconds} s</span>
                    <span className="text-mut">{b.instruction || BLOCK_ROLES[i] || "practice"}</span>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="mt-3 font-mono text-sm text-mut" data-block-line>
                {lesson.minutes} min:{" "}
                {lesson.blocks
                  .map((b, i) => `${b.seconds} s ${BLOCK_ROLES[i] ?? "practice"}`)
                  .join(" · ")}
              </p>
            )}
          </section>
        </Card>

        {mistakes.length > 0 && (
          <Card>
            <section aria-labelledby="recover" className="max-w-2xl">
              <h2 id="recover" className="text-xl">
                When it goes wrong
              </h2>
              <ul className="mt-3 space-y-3 text-sm">
                {/* The shared generic symptom is left out; each recovery names its own. */}
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
              Did it work? Judge by ear
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
              {ifNotReady && (
                <div>
                  <dt className="font-medium text-ink">If you&apos;re not ready</dt>
                  <dd className="text-mut">{ifNotReady}</dd>
                </div>
              )}
              {/* Often the first criterion restated; printed only when it says more. */}
              {shows && !criteria.includes(shows) && (
                <div>
                  <dt className="font-medium text-ink">What this shows</dt>
                  <dd className="text-mut">{shows}</dd>
                </div>
              )}
              {doesNotShow && (
                <div>
                  <dt className="font-medium text-ink">What this does not show</dt>
                  <dd className="text-mut" data-does-not-show>
                    {doesNotShow}
                  </dd>
                </div>
              )}
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
        {/* On every lesson, the stop-plan lessons included: their steps point here. */}
        <SafetyLine />
      </div>
    </PageShell>
  );
}
