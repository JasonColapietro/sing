import type { Metadata } from "next";
import { DEFAULT_OG_IMAGE, withCanonicalOpenGraph } from "@/lib/og";
import Link from "next/link";
import { Fragment } from "react";
import {
  BOOK_CONTENTS,
  BOOK_PARTS,
  BOOK_TITLE,
  BOOK_WORDS,
} from "@/lib/book-data";
import { AUTHOR_NAME, AUTHOR_NODE } from "@/lib/author";
import { ORG_PUBLISHER_NODE } from "@/lib/organization";
import { PROGRAMME_PART } from "@/lib/programme-exit-tests";
import { SITE_URL } from "@/lib/site";
import { AuthorByline } from "@/components/book/byline";
import { BookCover } from "@/components/book/cover";
import { BookCta } from "@/components/book/cta";
import { PullQuote } from "@/components/book/pull-quote";
import { SafetyLine } from "@/components/learn/safety-note";
import { BookProgramNote } from "@/components/book/program-link";
import { Card, PageShell, SectionLabel, Stat } from "@/components/ui";
import { routeKeywords } from "@/lib/keywords";

const DESCRIPTION = `${BOOK_TITLE}: a ${BOOK_CONTENTS.length}-chapter singing book on how the voice works, reading your measurements, a twelve-week program and song choice. Included with Pro.`;

/** The search-facing title: the book's name plus the term people search for. */
const PAGE_TITLE = `${BOOK_TITLE}: A Singing Book`;

/** Chapters readable without Pro, counted from the contents rather than stated. */
const FREE_COUNT = BOOK_CONTENTS.filter((c) => c.free).length;

export const metadata: Metadata = withCanonicalOpenGraph({
  keywords: routeKeywords("/book"),
  title: PAGE_TITLE,
  description: DESCRIPTION,
  alternates: { canonical: `${SITE_URL}/book` },
  openGraph: {
    title: PAGE_TITLE,
    description: DESCRIPTION,
    type: "book",
    images: [DEFAULT_OG_IMAGE],
  },
});

export default function BookPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Book",
    name: BOOK_TITLE,
    description: DESCRIPTION,
    url: `${SITE_URL}/book`,
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
    hasPart: BOOK_CONTENTS.filter((c) => c.free).map((c) => ({
      "@type": "Chapter",
      name: c.title,
      url: `${SITE_URL}/book/${c.slug}`,
      isAccessibleForFree: true,
    })),
  };

  return (
    <PageShell
      kicker={`Included with Pro · ${FREE_COUNT} chapters free`}
      title={`${BOOK_TITLE}: a singing book on how your voice works and how to train it`}
      subtitle={`${BOOK_TITLE} is a ${BOOK_CONTENTS.length}-chapter singing book by ${AUTHOR_NAME}: how the voice works, how to read the numbers your own practice produces, a twelve-week program, and how to choose songs that fit. The contents and ${FREE_COUNT} chapters are free; the rest comes with Suede Pro.`}
      // In the header, not at the foot of the first card: on a phone the card's
      // stats and paragraphs pushed "Read a free chapter" a screen and a half
      // below the subtitle that promises it.
      actions={
        <div className="flex items-end gap-5 lg:max-w-sm lg:flex-col lg:items-start">
          <BookCover title={BOOK_TITLE} author={AUTHOR_NAME} kicker="A singing book" />
          <BookCta />
        </div>
      }
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="space-y-6">
        <Card>
          <div className="flex flex-wrap gap-8">
            <Stat label="Chapters" value={BOOK_CONTENTS.length} tone="ink" />
            <Stat
              label="Words"
              value={BOOK_WORDS.toLocaleString("en-US")}
              tone="ink"
            />
            <Stat label="Parts" value={BOOK_PARTS.length} tone="cool" />
          </div>
          <AuthorByline className="mt-5">. Published by Suede AI.</AuthorByline>
          <p className="mt-5 max-w-2xl text-mut">
            Twenty-three chapters on how the voice works, how to read the
            numbers your own sessions produce, a twelve-week program built from
            the rooms you already have, and how to pick songs that fit the voice
            you have today. Written for the reading you do between sessions.
          </p>
          <p className="mt-3 max-w-2xl text-sm text-mut">
            The contents below are free, and so are {FREE_COUNT} chapters. Read
            them before you decide whether the writing is worth paying for. Pro
            unlocks the other {BOOK_CONTENTS.filter((c) => !c.free).length} and
            the PDF.
          </p>
        </Card>

        {BOOK_PARTS.map((part, i) => (
          <Fragment key={part.part}>
          {/* One sentence from chapter 7 between the first two parts,
              verbatim: it must still be in content/book/07-*.md. */}
          {i === 1 && (
            <PullQuote
              quote="No test hands you your tessitura; you find it by feel."
              emphasis="feel"
              byline="Chapter 7 · Your range is not one number"
            />
          )}
          <Card>
            <SectionLabel>
              Part {["one", "two", "three", "four", "five"][i] ?? i + 1}
            </SectionLabel>
            <h2 className="mt-3 text-xl">{part.part}</h2>
            <ol className="mt-4 divide-y divide-line/50">
              {part.chapters.map((c) => (
                <li key={c.slug}>
                  <Link
                    href={`/book/${c.slug}`}
                    className="grid grid-cols-[2rem_minmax(0,1fr)] gap-3 rounded-xl px-2 py-3 transition-colors hover:bg-panel"
                  >
                    <span className="tabular font-mono text-xs text-dim">
                      {String(c.order).padStart(2, "0")}
                    </span>
                    <span className="min-w-0">
                      <span className="flex items-baseline gap-x-3 text-sm font-medium text-ink">
                        {c.title}
                        {c.free && (
                          <span className="shrink-0 rounded-full border border-violet/50 px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.12em] text-violet-ink">
                            free
                          </span>
                        )}
                      </span>
                      {c.summary && (
                        <span className="mt-0.5 block text-sm text-mut">
                          {c.summary}
                        </span>
                      )}
                    </span>
                  </Link>
                </li>
              ))}
            </ol>
            {/* The plan this part describes, run day by day in the app. */}
            {part.part === PROGRAMME_PART && (
              <BookProgramNote scope="plan" className="mt-4 max-w-2xl text-sm text-mut" />
            )}
          </Card>
          </Fragment>
        ))}

        <Card>
          <SectionLabel>The other book</SectionLabel>
          <p className="mt-3 max-w-2xl text-sm text-mut">
            Pro includes two books. <em>The Voice Atlas</em> is the reference:
            the range, tone and technique of every voice in the singer library,
            with the songs where the extreme notes happened.{" "}
            <Link href="/atlas" prefetch={false} className="text-violet-ink underline decoration-violet/40 underline-offset-2 hover:decoration-violet">
              Its contents page and first three chapters are free
            </Link>
            .
          </p>
        </Card>

        {/* The contents end on a next step: the header's pair again. */}
        <BookCta />

        <SafetyLine />
      </div>
    </PageShell>
  );
}
