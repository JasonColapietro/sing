import type { Metadata } from "next";
import { DEFAULT_OG_IMAGE, withCanonicalOpenGraph } from "@/lib/og";
import Link from "next/link";
import {
  ATLAS_CONTENTS,
  ATLAS_PARTS,
  ATLAS_SUBTITLE,
  ATLAS_TITLE,
  ATLAS_WORDS,
} from "@/lib/atlas-data";
import { AUTHOR_ALIAS, AUTHOR_NAME, AUTHOR_NODE } from "@/lib/author";
import { ORG_PUBLISHER_NODE } from "@/lib/organization";
import { SITE_URL } from "@/lib/site";
import { AtlasCta } from "@/components/atlas/cta";
import { Card, PageShell, SectionLabel, Stat } from "@/components/ui";

const DESCRIPTION =
  "What is a famous singer's vocal range, really? The Voice Atlas answers it voice by voice: cited ranges with the songs where the extreme notes happened, tonal quality decoded in plain language, and how to borrow each technique safely. The full contents — every chapter and every singer covered — is free.";

export const metadata: Metadata = withCanonicalOpenGraph({
  title: `${ATLAS_TITLE} — Famous Singers' Vocal Ranges, Tone and Technique`,
  description: DESCRIPTION,
  alternates: { canonical: `${SITE_URL}/atlas` },
  openGraph: {
    title: `${ATLAS_TITLE} — Famous Singers' Vocal Ranges, Tone and Technique`,
    description: DESCRIPTION,
    type: "book",
    images: [DEFAULT_OG_IMAGE],
  },
});

const PART_WORDS = [
  "one",
  "two",
  "three",
  "four",
  "five",
  "six",
  "seven",
  "eight",
  "nine",
  "ten",
];

const MAX_SINGERS_PER_CHAPTER_SECTION = 24;
type AtlasSinger = (typeof ATLAS_CONTENTS)[number]["singers"][number];

function SingerLinks({ singers }: { singers: AtlasSinger[] }) {
  return (
    <ul className="grid grid-cols-1 gap-x-6 pl-2 sm:grid-cols-2 lg:grid-cols-3">
      {singers.map((s) => (
        <li key={s.slug}>
          <Link
            href={`/singers/${s.slug}`}
            className="flex items-baseline justify-between gap-3 rounded-lg px-2 py-1 text-sm transition-colors hover:bg-panel"
          >
            <span className="min-w-0 truncate text-mut">{s.name}</span>
            <span className="tabular shrink-0 font-mono text-[11px] text-dim">
              {s.low}–{s.high}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

function ChapterSingerIndex({
  chapterSlug,
  singers,
}: {
  chapterSlug: string;
  singers: AtlasSinger[];
}) {
  if (singers.length <= MAX_SINGERS_PER_CHAPTER_SECTION) {
    return (
      <div className="mt-2">
        <SingerLinks singers={singers} />
      </div>
    );
  }

  const groups = Array.from(
    { length: Math.ceil(singers.length / MAX_SINGERS_PER_CHAPTER_SECTION) },
    (_, index) =>
      singers.slice(
        index * MAX_SINGERS_PER_CHAPTER_SECTION,
        (index + 1) * MAX_SINGERS_PER_CHAPTER_SECTION,
      ),
  );

  return (
    <div className="mt-2">
      {groups.map((group, index) => {
        const headingId = `${chapterSlug}-singers-${index + 1}`;
        return (
          <section
            key={headingId}
            aria-labelledby={headingId}
            className="mt-4 first:mt-0"
          >
            <h4
              id={headingId}
              className="pl-2 font-mono text-[10px] uppercase tracking-[0.14em] text-dim"
            >
              Singers {group[0].name} through {group[group.length - 1].name}
            </h4>
            <div className="mt-1">
              <SingerLinks singers={group} />
            </div>
          </section>
        );
      })}
    </div>
  );
}

export default function AtlasPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Book",
    name: ATLAS_TITLE,
    description: DESCRIPTION,
    url: `${SITE_URL}/atlas`,
    numberOfPages: ATLAS_CONTENTS.length,
    inLanguage: "en",
    isAccessibleForFree: false,
    // Was an Organization named "Suede Sing" — the product name, not the
    // publisher entity and not a person. A paid book needs a named human
    // author, and the byline below is its on-page counterpart.
    author: AUTHOR_NODE,
    // Joins the estate graph the singer pages already use, so a consumer that
    // lands on the book can resolve the publisher and the site around it.
    publisher: ORG_PUBLISHER_NODE,
    isPartOf: { "@id": `${SITE_URL}/#website` },
    hasPart: ATLAS_CONTENTS.filter((c) => c.free).map((c) => ({
      "@type": "Chapter",
      name: c.title,
      url: `${SITE_URL}/atlas/${c.slug}`,
      isAccessibleForFree: true,
    })),
  };

  return (
    <PageShell
      kicker="Included with Pro · first 3 chapters free"
      title={ATLAS_TITLE}
      subtitle={ATLAS_SUBTITLE}
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="space-y-6">
        <Card>
          <div className="flex flex-wrap gap-8">
            <Stat label="Chapters" value={ATLAS_CONTENTS.length} tone="violet" />
            <Stat
              label="Words"
              value={ATLAS_WORDS.toLocaleString("en-US")}
              tone="ink"
            />
            <Stat label="Parts" value={ATLAS_PARTS.length} tone="cool" />
          </div>
          <p className="mt-5 text-sm text-mut">
            Written by{" "}
            <a
              href="https://jasoncolapietro.com"
              rel="author"
              className="text-violet-ink hover:underline"
            >
              {AUTHOR_NAME}
            </a>{" "}
            ({AUTHOR_ALIAS}). Published by Suede Labs.
          </p>
          <p className="mt-5 max-w-3xl text-mut">
            One book for the question every singer eventually types into a
            search bar: <em>what is their vocal range — and how do they do
            that?</em> Six method chapters teach you to read a range claim,
            decode tonal quality, and borrow technique without hurting
            yourself. The genre chapters then work through the library voice by
            voice — cited range, where the extreme notes happened on record,
            what the voice sounds like, and what to practice if you want some
            of it. Two generated appendices collect the records and shelve
            every voice by type.
          </p>
          <p className="mt-3 max-w-3xl text-sm text-mut">
            The contents below list every chapter and every singer covered —
            free, along with the first three chapters and each singer&rsquo;s{" "}
            <Link href="/singers" className="text-violet-ink hover:underline">
              range page
            </Link>
            . Pro unlocks the chapter text, the entry notes and the PDF, and
            the{" "}
            <Link href="/range" className="text-violet-ink hover:underline">
              range test
            </Link>{" "}
            gives you your own numbers to read it with.
          </p>
          <div className="mt-5">
            <AtlasCta />
          </div>
        </Card>

        {ATLAS_PARTS.map((part, i) => (
          <Card key={part.part}>
            <SectionLabel>Part {PART_WORDS[i] ?? i + 1}</SectionLabel>
            <h2 className="mt-3 text-xl">{part.part}</h2>
            <ol className="mt-4 divide-y divide-line/50">
              {part.chapters.map((c) => (
                <li key={c.slug} className="py-3">
                  <Link
                    href={`/atlas/${c.slug}`}
                    className="grid grid-cols-[2rem_minmax(0,1fr)] gap-3 rounded-xl px-2 py-1 transition-colors hover:bg-panel"
                  >
                    <span className="tabular font-mono text-xs text-dim">
                      {String(c.order).padStart(2, "0")}
                    </span>
                    <span className="min-w-0">
                      <h3 className="flex flex-wrap items-baseline gap-x-3 text-sm font-medium text-ink">
                        {c.title}
                        {c.free && (
                          <span className="rounded-full border border-violet/50 px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.12em] text-violet-ink">
                            free
                          </span>
                        )}
                      </h3>
                      {c.summary && (
                        <span className="mt-0.5 block text-sm text-mut">
                          {c.summary}
                        </span>
                      )}
                    </span>
                  </Link>
                  {c.singers.length > 0 && (
                    <ChapterSingerIndex
                      chapterSlug={c.slug}
                      singers={c.singers}
                    />
                  )}
                </li>
              ))}
            </ol>
          </Card>
        ))}

        <Card>
          <SectionLabel>The other book</SectionLabel>
          <p className="mt-3 max-w-2xl text-sm text-mut">
            Pro includes two books. <em>The Measured Voice</em> is the training
            manual — how the voice works, how to read your own measurements,
            and a twelve-week program.{" "}
            <Link href="/book" className="text-violet-ink hover:underline">
              Its contents are free too
            </Link>
            .
          </p>
        </Card>

        <p className="max-w-3xl text-xs text-dim">
          Ranges are commonly cited figures compiled from recordings and public
          discussion, not lab measurements, and the extremes are one-off
          recorded moments rather than anyone&rsquo;s everyday voice. The
          technique notes describe how voices sound on record — nothing here is
          medical advice, and a voice that hurts, stays hoarse, or loses easy
          notes is a question for a doctor or speech-language pathologist, not
          a practice plan.
        </p>
      </div>
    </PageShell>
  );
}
