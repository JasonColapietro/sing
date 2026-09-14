import type { Metadata } from "next";
import Link from "next/link";

import { Card, PageShell, SectionLabel } from "@/components/ui";
import { withCanonicalOpenGraph } from "@/lib/og";
import { SITE_URL } from "@/lib/site";
import {
  voiceCurriculum,
  voiceLessonHref,
} from "@/lib/voice-curriculum";

const DESCRIPTION =
  "Follow Suede Sing's seven-stage voice curriculum, then use the browser practice rooms to measure pitch, range, breath, and listening skills.";

export const metadata: Metadata = withCanonicalOpenGraph({
  title: "Voice Curriculum: Seven Stages of Singing Practice",
  description: DESCRIPTION,
  alternates: { canonical: `${SITE_URL}/learn` },
});

const levels = voiceCurriculum.curriculum.levels;
const moduleCount = levels.reduce(
  (total, level) => total + level.modules.length,
  0,
);
const lessonCount = levels.reduce(
  (total, level) =>
    total +
    level.modules.reduce(
      (levelTotal, module) => levelTotal + module.lessons.length,
      0,
    ),
  0,
);

const PRACTICE_ROOMS = [
  {
    href: "/range",
    label: "Range test",
    description: "Find your lowest and highest comfortable notes.",
  },
  {
    href: "/warmups",
    label: "Guided warmups",
    description: "Work through short, measured vocal warmups.",
  },
  {
    href: "/breath",
    label: "Breath training",
    description: "Time a sustain and track loudness steadiness.",
  },
  {
    href: "/ear-training",
    label: "Ear training",
    description: "Practice pitch matching, intervals, and melody recall.",
  },
] as const;

export default function LearnPage() {
  return (
    <PageShell
      kicker="Learn"
      title="The Suede voice curriculum"
      subtitle="A seven-stage path from room setup and steady tone to repertoire, style, and performance."
    >
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.6fr)_minmax(17rem,0.8fr)]">
        <Card>
          <SectionLabel>How it works today</SectionLabel>
          <p className="mt-4 max-w-3xl leading-relaxed text-mut">
            Suede Sing owns this curriculum and gives you the browser rooms
            that can honestly measure parts of your practice. GuitarHub remains
            the temporary lesson host while lesson bodies, identity,
            entitlements, and progress are prepared for a safe move.
          </p>
          <p className="mt-3 max-w-3xl leading-relaxed text-mut">
            Your access and existing lesson progress remain on GuitarHub.
            Lesson links below open there, with the same account and purchase
            rules already attached to them. Nothing is redirected or
            transferred in this phase.
          </p>
        </Card>

        <Card>
          <SectionLabel>Complete path</SectionLabel>
          <dl className="mt-4 grid grid-cols-3 gap-3">
            {[
              ["Stages", levels.length],
              ["Modules", moduleCount],
              ["Published lessons", lessonCount],
            ].map(([label, value]) => (
              <div key={label} className="rounded-xl border border-line bg-panel2 p-3">
                <dt className="font-mono text-[10px] uppercase tracking-[0.12em] text-dim">
                  {label}
                </dt>
                <dd className="mt-1 text-2xl text-ink">{value}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-4 text-sm leading-relaxed text-mut">
            These {lessonCount} published lesson links are the real records in
            the catalog. GuitarHub holds their complete lesson bodies during
            the transition.
          </p>
        </Card>
      </div>

      <aside className="mt-6 rounded-2xl border border-warn/35 bg-warn/5 p-5">
        <h2 className="text-lg text-ink">Practice within a healthy boundary</h2>
        <p className="mt-2 max-w-4xl text-sm leading-relaxed text-mut">
          Stay in a comfortable range and volume, and stop for pain or
          hoarseness. Pitch readings do not assess vocal health, strain, or
          whether a technique is clinically safe. Advanced work still needs
          qualified human review.
        </p>
      </aside>

      <section className="mt-12" aria-labelledby="practice-rooms-title">
        <SectionLabel>Measure in Sing</SectionLabel>
        <h2 id="practice-rooms-title" className="mt-3 text-2xl sm:text-3xl">
          Bring each lesson into a practice room
        </h2>
        <ul className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {PRACTICE_ROOMS.map((room) => (
            <li key={room.href}>
              <Link
                href={room.href}
                className="block h-full rounded-2xl border border-line bg-panel p-4 transition-colors hover:border-violet/50"
              >
                <span className="font-medium text-ink">{room.label}</span>
                <span className="mt-1 block text-sm leading-relaxed text-mut">
                  {room.description}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <div className="mt-14 space-y-10">
        {levels.map((level) => (
          <section
            key={level.id}
            data-curriculum-level={level.id}
            data-access={level.access}
            data-published-lessons={level.modules.reduce(
              (count, module) => count + module.lessons.length,
              0,
            )}
            aria-labelledby={`${level.id}-title`}
          >
            <div className="flex flex-wrap items-start justify-between gap-4 border-b border-line pb-4">
              <div>
                <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-violet-ink">
                  Stage {level.stage}
                </p>
                <h2 id={`${level.id}-title`} className="mt-2 text-2xl sm:text-3xl">
                  {level.name}
                </h2>
                <p className="mt-2 max-w-2xl text-mut">{level.subtitle}</p>
              </div>
              <div className="text-right">
                <span className="inline-flex rounded-full border border-line bg-panel px-3 py-1 font-mono text-[11px] uppercase tracking-[0.12em] text-ink">
                  {level.access === "free" ? "Free" : "Paid on GuitarHub"}
                </span>
                <p className="mt-2 font-mono text-xs text-dim">
                  {level.modules.length} modules ·{" "}
                  {level.modules.reduce(
                    (count, module) => count + module.lessons.length,
                    0,
                  )}{" "}
                  published lessons
                </p>
              </div>
            </div>

            <div className="mt-4 space-y-3">
              {level.modules.map((module) => (
                <details
                  key={module.id}
                  data-curriculum-module={module.id}
                  className="group rounded-2xl border border-line bg-panel"
                >
                  <summary className="cursor-pointer px-5 py-4">
                    <span className="ml-2 inline-flex w-[calc(100%_-_1.5rem)] flex-wrap items-start justify-between gap-3 align-top">
                      <span>
                        <span className="block font-medium text-ink">
                          {module.name}
                        </span>
                        <span
                          data-module-outcome={module.id}
                          className="mt-1 block max-w-3xl text-sm leading-relaxed text-mut"
                        >
                          {module.promise}
                        </span>
                      </span>
                      <span className="font-mono text-xs text-dim">
                        {module.lessons.length} published lessons
                      </span>
                    </span>
                  </summary>
                  <div className="border-t border-line px-5 py-4">
                    <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.12em] text-dim">
                      Published lesson previews
                    </p>
                    <ol className="divide-y divide-line/60">
                      {module.lessons.map((lesson) => {
                        const href = voiceLessonHref(lesson.id);
                        return (
                          <li key={lesson.id} className="py-3">
                            <a
                              href={href}
                              data-lesson-href={href}
                              className="group/lesson block rounded-xl px-2 py-1 transition-colors hover:bg-panel2"
                            >
                              <span className="flex flex-wrap items-baseline justify-between gap-2">
                                <span className="font-medium text-ink group-hover/lesson:text-violet-ink">
                                  {lesson.title}
                                </span>
                                <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-dim">
                                  {lesson.type} · {lesson.minutes} min
                                </span>
                              </span>
                              <span className="mt-1 block text-sm leading-relaxed text-mut">
                                {lesson.summary}
                              </span>
                            </a>
                          </li>
                        );
                      })}
                    </ol>
                  </div>
                </details>
              ))}
            </div>
          </section>
        ))}
      </div>
    </PageShell>
  );
}
