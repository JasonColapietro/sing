import type { Metadata } from "next";
import Link from "next/link";
import { ATLAS_CONTENTS } from "@/lib/atlas-data";
import { AUTHOR_NODE } from "@/lib/author";
import { GLOSSARY, GLOSSARY_TERMS, roomLabel, termId } from "@/lib/glossary";
import { SITE_URL } from "@/lib/site";
import { Card, PageShell, SectionLabel } from "@/components/ui";

const TITLE = "Singing Terms Glossary — Passaggio, Cents, Tessitura";
const DESCRIPTION = `What ${GLOSSARY_TERMS.length} singing terms actually mean, in one sentence each: passaggio, tessitura, cents, chest and head voice, falsetto, whistle register, vocal fry, the singer's formant and the rest of the vocabulary Suede Sing uses. Free, with the room in the app where each word shows up.`;

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: `${SITE_URL}/glossary` },
  openGraph: { title: TITLE, description: DESCRIPTION, type: "article" },
};

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
    publisher: { "@id": "https://suedeai.ai/#organization" },
    isPartOf: { "@id": `${SITE_URL}/#website` },
    hasDefinedTerm: GLOSSARY_TERMS.map((entry) => ({
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

  return (
    <PageShell
      kicker="Free reference"
      title="A glossary for singers"
      subtitle="Every term this app uses, defined in one sentence, with the room where you can go and see it."
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="space-y-6">
        <Card>
          <p className="max-w-3xl text-mut">
            Vocal teaching runs on borrowed words. Half of them arrived from
            three different traditions that never agreed with each other, and
            the rest describe a sensation rather than a mechanism. This page
            takes the {GLOSSARY_TERMS.length} that turn up in this app — on the
            range result, in the studio readout, across the singer pages — and
            gives each one a single sentence, plus the place it shows up so the
            definition has somewhere to land.
          </p>
          <p className="mt-3 max-w-3xl text-sm text-mut">
            Definitions only. No exercise is prescribed here — the{" "}
            <Link href="/warmups" className="text-amber-ink hover:underline">
              warmups
            </Link>{" "}
            and the{" "}
            <Link href="/range" className="text-amber-ink hover:underline">
              range test
            </Link>{" "}
            do that part, and none of this is medical advice.
          </p>
          <nav aria-label="Sections" className="mt-5 flex flex-wrap gap-2">
            {GLOSSARY.map((section) => (
              <a
                key={section.heading}
                href={`#${termId(section.heading)}`}
                className="rounded-full border border-line px-3 py-1.5 text-sm text-mut transition-colors hover:border-amber/50 hover:text-amber-ink"
              >
                {section.heading}
              </a>
            ))}
          </nav>
        </Card>

        {GLOSSARY.map((section) => (
          <Card key={section.heading}>
            <h2 id={termId(section.heading)} className="scroll-mt-20 text-xl">
              {section.heading}
            </h2>
            <p className="mt-2 max-w-3xl text-sm text-mut">{section.blurb}</p>
            <dl className="mt-5 divide-y divide-line/50">
              {section.entries.map((entry) => (
                <div
                  key={entry.term}
                  id={termId(entry.term)}
                  className="scroll-mt-20 py-4 first:pt-0 last:pb-0"
                >
                  <dt className="flex flex-wrap items-baseline gap-x-3">
                    <span className="font-display text-lg font-extrabold text-ink">
                      {entry.term}
                    </span>
                    {entry.aka && (
                      <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-dim">
                        also {entry.aka.join(" · ")}
                      </span>
                    )}
                  </dt>
                  <dd className="mt-1.5 max-w-3xl text-mut">
                    {entry.definition}
                  </dd>
                  <dd className="mt-1.5 max-w-3xl text-sm text-dim">
                    {entry.where}{" "}
                    <Link
                      href={entry.href}
                      className="text-amber-ink hover:underline"
                    >
                      Open {roomLabel(entry.href)} →
                    </Link>
                  </dd>
                </div>
              ))}
            </dl>
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
                  className="text-amber-ink hover:underline"
                >
                  {c.title}
                </Link>
                {c.summary && <span> — {c.summary}</span>}
              </li>
            ))}
          </ul>
          <p className="mt-4 max-w-3xl text-sm text-mut">
            <Link href="/book" className="text-amber-ink hover:underline">
              The Measured Voice
            </Link>{" "}
            takes the same ground from the other side — how the voice works,
            then how to read your own numbers — and its first chapter is free
            too.
          </p>
        </Card>
      </div>
    </PageShell>
  );
}
