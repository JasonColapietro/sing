import type { Metadata } from "next";
import { DEFAULT_OG_IMAGE } from "@/lib/og";
import Link from "next/link";
import {
  BOOK_CONTENTS,
  BOOK_PARTS,
  BOOK_SUBTITLE,
  BOOK_TITLE,
  BOOK_WORDS,
} from "@/lib/book-data";
import { AUTHOR_ALIAS, AUTHOR_NAME, AUTHOR_NODE } from "@/lib/author";
import { SITE_URL } from "@/lib/site";
import { BookCta } from "@/components/book/cta";
import { Card, PageShell, SectionLabel, Stat } from "@/components/ui";

const DESCRIPTION = `${BOOK_TITLE} — a ${BOOK_CONTENTS.length}-chapter guide to how the voice works, reading your own measurements, a twelve-week program and choosing repertoire. Included with Suede Sing Pro.`;

export const metadata: Metadata = {
  title: BOOK_TITLE,
  description: DESCRIPTION,
  alternates: { canonical: `${SITE_URL}/book` },
  openGraph: {
    title: BOOK_TITLE,
    description: DESCRIPTION,
    type: "book",
    images: [DEFAULT_OG_IMAGE],
  },
};

export default function BookPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Book",
    name: BOOK_TITLE,
    description: DESCRIPTION,
    url: `${SITE_URL}/book`,
    numberOfPages: BOOK_CONTENTS.length,
    inLanguage: "en",
    isAccessibleForFree: false,
    // Was an Organization named "Suede Sing" — the product name, not the
    // publisher entity and not a person. A paid book needs a named human
    // author, and the byline below is its on-page counterpart.
    author: AUTHOR_NODE,
    // Joins the estate graph the singer pages already use, so a consumer that
    // lands on the book can resolve the publisher and the site around it.
    publisher: { "@id": "https://suedeai.ai/#organization" },
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
      kicker="Included with Pro · first chapter free"
      title={BOOK_TITLE}
      subtitle={BOOK_SUBTITLE}
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="space-y-6">
        <Card>
          <div className="flex flex-wrap gap-8">
            <Stat label="Chapters" value={BOOK_CONTENTS.length} tone="amber" />
            <Stat
              label="Words"
              value={BOOK_WORDS.toLocaleString("en-US")}
              tone="ink"
            />
            <Stat label="Parts" value={BOOK_PARTS.length} tone="cool" />
          </div>
          <p className="mt-5 text-sm text-mut">
            Written by{" "}
            <a
              href="https://jasoncolapietro.com"
              rel="author"
              className="text-amber-ink hover:underline"
            >
              {AUTHOR_NAME}
            </a>{" "}
            ({AUTHOR_ALIAS}). Published by Suede Labs.
          </p>
          <p className="mt-5 max-w-2xl text-mut">
            Twenty-three chapters on how the voice works, how to read the
            numbers your own sessions produce, a twelve-week program built from
            the rooms you already have, and how to pick songs that fit the voice
            you have today. Written for the reading you do between sessions.
          </p>
          <p className="mt-3 max-w-2xl text-sm text-mut">
            The contents below are free, and so is the first chapter — read it
            before you decide whether the writing is worth a subscription. Pro
            unlocks the other {BOOK_CONTENTS.filter((c) => !c.free).length} and
            the PDF.
          </p>
          <div className="mt-5">
            <BookCta />
          </div>
        </Card>

        {BOOK_PARTS.map((part, i) => (
          <Card key={part.part}>
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
                      <span className="flex flex-wrap items-baseline gap-x-3 text-sm font-medium text-ink">
                        {c.title}
                        {c.free && (
                          <span className="rounded-full border border-amber/50 px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.12em] text-amber-ink">
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
          </Card>
        ))}

        <Card>
          <SectionLabel>The other book</SectionLabel>
          <p className="mt-3 max-w-2xl text-sm text-mut">
            Pro includes two books. <em>The Voice Atlas</em> is the reference —
            the range, tone and technique of every voice in the singer library,
            with the songs where the extreme notes happened.{" "}
            <Link href="/atlas" className="text-amber-ink hover:underline">
              Its full contents are free
            </Link>
            .
          </p>
        </Card>

        <p className="max-w-2xl text-xs text-dim">
          This book is about practice, not medicine. Nothing here diagnoses or
          treats anything. If singing hurts, if you are hoarse and it will not
          clear, or if you ever see blood, that is a question for a doctor or a
          speech-language pathologist — there is no waiting period, and you do
          not need to be sure it is serious before you go.
        </p>
      </div>
    </PageShell>
  );
}
