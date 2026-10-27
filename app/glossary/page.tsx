import type { Metadata } from "next";
import { DEFAULT_OG_IMAGE, withCanonicalOpenGraph } from "@/lib/og";
import Link from "next/link";
import { ATLAS_CONTENTS } from "@/lib/atlas-data";
import { AUTHOR_NAME, AUTHOR_NODE } from "@/lib/author";
import { BOOK_CONTENTS } from "@/lib/book-data";
import {
  roomLabel,
  SING_GLOSSARY,
  SING_GLOSSARY_TERMS,
  termId,
} from "@/lib/glossary";
import { courseModuleForTerm } from "@/lib/lesson-glossary";
import { ORG_PUBLISHER_NODE } from "@/lib/organization";
import { FREE_DAILY_MINUTES } from "@/lib/practice-limits";
import { SITE_URL, rangeTestHref } from "@/lib/site";
import { EXERCISES } from "@/components/warmups/exercises";
import { Card, PageShell, SectionLabel } from "@/components/ui";
import { routeKeywords } from "@/lib/keywords";

const TITLE = "Singing Terms Glossary: Passaggio, Tessitura";
const DESCRIPTION = `What ${SING_GLOSSARY_TERMS.length} singing terms mean, one sentence each: passaggio, tessitura, cents, chest and head voice, falsetto, vocal fry and more. Free.`;

export const metadata: Metadata = withCanonicalOpenGraph({
  keywords: routeKeywords("/glossary"),
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: `${SITE_URL}/glossary` },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    type: "article",
    images: [DEFAULT_OG_IMAGE],
  },
});

/**
 * Where "the range test" links land: the test tab, at the #start anchor
 * voice-test.tsx carries, so a phone lands on the start button rather than the
 * intro above it (the guides and song pages link the test the same way).
 */
const RANGE_TEST_HREF = rangeTestHref();

/** The definition the opening paragraph quotes, so the answer is the page's own. */
const PASSAGGIO = SING_GLOSSARY_TERMS.find((entry) => entry.term === "Passaggio");

/**
 * The free warmup an entry names, resolved by id. Only the free catalogue is
 * searched, so a Pro-pack id can never put a locked drill behind "Try it".
 */
function drillFor(id: string | undefined) {
  return id ? EXERCISES.find((exercise) => exercise.id === id) : undefined;
}

export default function GlossaryPage() {
  const setId = `${SITE_URL}/glossary#glossary`;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "DefinedTermSet",
    "@id": setId,
    name: "Suede Sing singing glossary",
    description: DESCRIPTION,
    url: `${SITE_URL}/glossary`,
    inLanguage: "en",
    author: AUTHOR_NODE,
    publisher: ORG_PUBLISHER_NODE,
    isPartOf: { "@id": `${SITE_URL}/#website` },
    hasDefinedTerm: SING_GLOSSARY_TERMS.map((entry) => ({
      "@type": "DefinedTerm",
      "@id": `${SITE_URL}/glossary#${termId(entry.term)}`,
      name: entry.term,
      description: entry.definition,
      url: `${SITE_URL}/glossary#${termId(entry.term)}`,
      ...(entry.aka ? { alternateName: entry.aka } : {}),
      inDefinedTermSet: { "@id": setId },
    })),
  };

  // The atlas chapters that teach notation and the voice-type labels are free,
  // so the glossary can hand a reader the long version without a paywall.
  const freeChapters = ATLAS_CONTENTS.filter((c) => c.free);
  // The Measured Voice samples chapters across the book (not only its first),
  // so each free one is listed and linked rather than summed up as "the first".
  const freeBookChapters = BOOK_CONTENTS.filter((c) => c.free);

  return (
    <PageShell
      kicker="Free reference"
      title="Singing terms glossary: what each vocal term means"
      subtitle={`What ${SING_GLOSSARY_TERMS.length} singing terms mean, one sentence each, with the room where you can see each one at work.${
        PASSAGGIO
          ? ` Passaggio, for example, is ${PASSAGGIO.definition.charAt(0).toLowerCase()}${PASSAGGIO.definition.slice(1)}`
          : ""
      }`}
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="space-y-6">
        <Card>
          {/* The visible counterpart of the DefinedTermSet's author node. */}
          <p className="mb-3 text-sm text-mut">
            By{" "}
            <a
              href={AUTHOR_NODE.url}
              rel="author"
              className="text-violet-ink underline decoration-violet/40 underline-offset-2 hover:decoration-violet"
            >
              {AUTHOR_NAME}
            </a>
          </p>
          <p className="max-w-3xl text-mut">
            Vocal teaching runs on borrowed words. Half of them arrived from
            three different traditions that never agreed with each other, and
            the rest describe a sensation rather than a mechanism. This page
            takes the {SING_GLOSSARY_TERMS.length} that turn up in this app (on the
            range result, in the studio readout, across the singer pages) and
            gives each one a single sentence, plus the place it shows up so the
            definition has somewhere to land.
          </p>
          <p className="mt-3 max-w-3xl text-sm text-mut">
            Definitions only. The exercises live in the{" "}
            <Link href="/warmups" className="text-violet-ink underline decoration-violet/40 underline-offset-2 hover:decoration-violet">
              warmups
            </Link>{" "}
            and the{" "}
            <Link href={RANGE_TEST_HREF} className="text-violet-ink underline decoration-violet/40 underline-offset-2 hover:decoration-violet">
              range test
            </Link>
            ; where a free warmup or breath drill trains a term, its entry
            links straight to it. None of this is medical advice. Warmups,
            ear training, breath drills and song practice share the free
            plan&apos;s{" "}
            {FREE_DAILY_MINUTES} minutes of guided practice a day; the other
            rooms linked here have no daily limit.
          </p>
          <nav aria-label="Sections" className="mt-5 flex flex-wrap gap-2">
            {SING_GLOSSARY.map((section) => (
              <a
                key={section.heading}
                href={`#${termId(section.heading)}`}
                className="inline-flex min-h-11 items-center rounded-full border border-line px-3 py-1.5 text-sm text-mut transition-colors hover:border-violet/50 hover:text-violet-ink"
              >
                {section.heading}
              </a>
            ))}
          </nav>
        </Card>

        {SING_GLOSSARY.map((section) => (
          <Card key={section.heading}>
            <h2 id={termId(section.heading)} className="scroll-mt-20 text-xl">
              {section.heading}
            </h2>
            <p className="mt-2 max-w-3xl text-sm text-mut">{section.blurb}</p>
            <div className="mt-5 divide-y divide-line/50">
              {section.entries.map((entry) => {
                const drill = drillFor(entry.drill);
                const lessons = courseModuleForTerm(entry.term);
                return (
                  <div
                    key={entry.term}
                    id={termId(entry.term)}
                    className="scroll-mt-20 py-4 first:pt-0 last:pb-0"
                  >
                    <div className="flex flex-wrap items-baseline gap-x-3">
                      <h3 className="text-lg text-ink">
                        {entry.term}
                      </h3>
                      {entry.aka && (
                        <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-dim">
                          also {entry.aka.join(" · ")}
                        </span>
                      )}
                    </div>
                    <p className="mt-1.5 max-w-3xl text-mut">
                      {entry.definition}
                    </p>
                    <p className="mt-1.5 max-w-3xl text-sm text-dim">
                      {entry.where}{" "}
                      <Link
                        href={entry.href === "/range" ? RANGE_TEST_HREF : entry.href}
                        prefetch={entry.href === "/singers" ? false : undefined}
                        className="text-violet-ink underline decoration-violet/40 underline-offset-2 hover:decoration-violet"
                      >
                        Open {roomLabel(entry.href)}{"\u00a0→"}
                      </Link>
                      {drill && (
                        <>
                          {" · "}
                          <Link
                            href={`/warmups?exercise=${drill.id}`}
                            className="text-violet-ink underline decoration-violet/40 underline-offset-2 hover:decoration-violet"
                          >
                            Try it: {drill.title}{"\u00a0→"}
                          </Link>
                        </>
                      )}
                      {entry.tryIt && (
                        <>
                          {" · "}
                          <Link
                            href={entry.tryIt.href}
                            className="text-violet-ink underline decoration-violet/40 underline-offset-2 hover:decoration-violet"
                          >
                            Try it: {entry.tryIt.label}{"\u00a0→"}
                          </Link>
                        </>
                      )}
                      {lessons && (
                        <>
                          {" · "}
                          <Link
                            href={lessons.href}
                            className="text-violet-ink underline decoration-violet/40 underline-offset-2 hover:decoration-violet"
                          >
                            Free lessons: {lessons.name}{"\u00a0→"}
                          </Link>
                        </>
                      )}
                    </p>
                  </div>
                );
              })}
            </div>
          </Card>
        ))}

        <Card>
          <SectionLabel>The long version</SectionLabel>
          <p className="mt-3 max-w-3xl text-sm text-mut">
            A sentence is enough to read a page; it is not enough to change how
            you sing. The Voice Atlas takes the vocabulary above a chapter at a
            time, and its first {freeChapters.length} are free to read:
          </p>
          <ul className="mt-4 space-y-2">
            {freeChapters.map((c) => (
              <li key={c.slug} className="max-w-3xl text-sm text-mut">
                <Link
                  href={`/atlas/${c.slug}`}
                  className="text-violet-ink underline decoration-violet/40 underline-offset-2 hover:decoration-violet"
                >
                  {c.title}
                </Link>
                {c.summary && <span>: {c.summary}</span>}
              </li>
            ))}
          </ul>
          <p className="mt-4 max-w-3xl text-sm text-mut">
            <Link href="/book" className="text-violet-ink underline decoration-violet/40 underline-offset-2 hover:decoration-violet">
              The Measured Voice
            </Link>{" "}
            takes the same ground from the other side (how the voice works,
            then how to read your own numbers) and {freeBookChapters.length} of
            its chapters are free to read:
          </p>
          <ul className="mt-4 space-y-2">
            {freeBookChapters.map((c) => (
              <li key={c.slug} className="max-w-3xl text-sm text-mut">
                <Link
                  href={`/book/${c.slug}`}
                  className="text-violet-ink underline decoration-violet/40 underline-offset-2 hover:decoration-violet"
                >
                  {c.title}
                </Link>
                {c.summary && <span>: {c.summary}</span>}
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </PageShell>
  );
}
