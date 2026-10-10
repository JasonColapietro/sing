import type { Metadata } from "next";
import { DEFAULT_OG_IMAGE, withCanonicalOpenGraph } from "@/lib/og";
import Link from "next/link";
import { ATLAS_CONTENTS } from "@/lib/atlas-data";
import { AUTHOR_NODE } from "@/lib/author";
import {
  roomLabel,
  SING_GLOSSARY,
  SING_GLOSSARY_TERMS,
  termId,
} from "@/lib/glossary";
import { ORG_PUBLISHER_NODE } from "@/lib/organization";
import { SITE_URL } from "@/lib/site";
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

/** The definition the opening paragraph quotes, so the answer is the page's own. */
const PASSAGGIO = SING_GLOSSARY_TERMS.find((entry) => entry.term === "Passaggio");

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
          <p className="max-w-3xl text-mut">
            Vocal teaching runs on borrowed words. Half of them arrived from
            three different traditions that never agreed with each other, and
            the rest describe a sensation rather than a mechanism. This page
            takes the {SING_GLOSSARY_TERMS.length} that turn up in this app — on the
            range result, in the studio readout, across the singer pages — and
            gives each one a single sentence, plus the place it shows up so the
            definition has somewhere to land.
          </p>
          <p className="mt-3 max-w-3xl text-sm text-mut">
            Definitions only. No exercise is prescribed here — the{" "}
            <Link href="/warmups" className="text-violet-ink hover:underline">
              warmups
            </Link>{" "}
            and the{" "}
            <Link href="/range" className="text-violet-ink hover:underline">
              range test
            </Link>{" "}
            do that part, and none of this is medical advice.
          </p>
          <nav aria-label="Sections" className="mt-5 flex flex-wrap gap-2">
            {SING_GLOSSARY.map((section) => (
              <a
                key={section.heading}
                href={`#${termId(section.heading)}`}
                className="rounded-full border border-line px-3 py-1.5 text-sm text-mut transition-colors hover:border-violet/50 hover:text-violet-ink"
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
              {section.entries.map((entry) => (
                <div
                  key={entry.term}
                  id={termId(entry.term)}
                  className="scroll-mt-20 py-4 first:pt-0 last:pb-0"
                >
                  <div className="flex flex-wrap items-baseline gap-x-3">
                    <h3 className="text-lg font-extrabold text-ink">
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
                      href={entry.href}
                      className="text-violet-ink hover:underline"
                    >
                      Open {roomLabel(entry.href)} →
                    </Link>
                  </p>
                </div>
              ))}
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
                  className="text-violet-ink hover:underline"
                >
                  {c.title}
                </Link>
                {c.summary && <span> — {c.summary}</span>}
              </li>
            ))}
          </ul>
          <p className="mt-4 max-w-3xl text-sm text-mut">
            <Link href="/book" className="text-violet-ink hover:underline">
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
