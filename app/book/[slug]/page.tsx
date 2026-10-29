import type { Metadata } from "next";
import { chapterKeywords } from "@/lib/keywords";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BOOK, BOOK_CONTENTS, BOOK_TITLE } from "@/lib/book-data";
import { RANGE_WARM_UP } from "@/lib/lesson-practice";
import { freeLessonsReading } from "@/lib/lesson-readings";
import { Markdown } from "@/lib/markdown";
import { FREE_DAILY_MINUTES } from "@/lib/practice-limits";
import { exitTestFor, PROGRAMME_PART } from "@/lib/programme-exit-tests";
import { firstFit } from "@/lib/meta-fit";
import { withCanonicalOpenGraph } from "@/lib/og";
import { chapterJsonLd } from "@/lib/page-jsonld";
import { PRICING, formatPrice } from "@/lib/pro-shared";
import { pageRobots } from "@/lib/robots-meta";
import { SITE_URL, rangeTestHref } from "@/lib/site";
import { AuthorByline } from "@/components/book/byline";
import { BookProgramNote } from "@/components/book/program-link";
import { ChapterNav, ChapterReader } from "@/components/book/reader";
import { LessonList } from "@/components/learn/lesson-list";
import { FreeOnly } from "@/components/pro/gate";
import { Card, LinkButton, PageShell, SectionLabel } from "@/components/ui";

interface Params {
  slug: string;
}

/**
 * The room each free chapter's "Try this" sends the reader to. The chapter
 * says what to do in its own "Try this" section; this is the header button, so
 * a reader who arrived from search can do it before being asked to pay for
 * anything. Keyed by slug, so a chapter without an entry shows nothing.
 */
const TRY_IT: Record<string, { href: string; label: string; warmUpFirst?: boolean }> = {
  "what-your-voice-is": {
    href: "/studio",
    label: "Try it in the pitch studio",
  },
  "reading-the-range-test": {
    href: rangeTestHref(),
    label: "Take the range test honestly",
    // The warm-up button comes before the test wherever the page offers it,
    // and opens the Morning reset the Your Range lessons and /learn's Day 1
    // name: a cold voice under-reports at both ends, and every finished test
    // replaces the saved range.
    warmUpFirst: true,
  },
  "when-numbers-lie": {
    href: "/studio",
    label: "Check your room in the pitch studio",
  },
};

/** Said beside the warm-up button: the warm-up is capped, the test is not. */
function WarmUpCapNote() {
  return (
    <p className="text-xs text-dim">
      The Morning reset is about four minutes of guided practice, out of the
      free plan&apos;s {FREE_DAILY_MINUTES} minutes a day; Pro removes the limit.
      The range test itself has no clock.
    </p>
  );
}

export const dynamicParams = false;

export function generateStaticParams(): Params[] {
  return BOOK_CONTENTS.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { slug } = await params;
  const c = BOOK_CONTENTS.find((x) => x.slug === slug);
  if (!c) return {};
  // A literary chapter title ("When the numbers lie to you") matches nothing a
  // singer types, so a chapter can carry search wording for the title tag. The
  // H1 and the structured data keep the chapter's own title.
  const name = c.searchTitle || c.title;
  return withCanonicalOpenGraph({
    // The book's name when it fits, a shorter tail when it doesn't, so a
    // chapter title never reaches search as a bare phrase identical to its H1.
    title: firstFit([`${name} · ${BOOK_TITLE}`, `${name} · Singing Book`, name]),
    keywords: chapterKeywords(name, "book"),
    description: c.summary,
    alternates: { canonical: `${SITE_URL}/book/${c.slug}` },
    // A gated body has nothing here for an index to rank — list the chapter but
    // keep it out of results. The free chapters are real content and rank.
    robots: pageRobots(c.free),
  });
}

export default async function ChapterPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { slug } = await params;
  const chapter = BOOK_CONTENTS.find((c) => c.slug === slug);
  if (!chapter) notFound();

  // A free chapter renders on the server: indexable, no entitlement round
  // trip. Everything else goes through the gated reader.
  const full = chapter.free ? BOOK.find((c) => c.slug === slug) : undefined;
  const next = BOOK_CONTENTS[BOOK_CONTENTS.indexOf(chapter) + 1];
  const gated = BOOK_CONTENTS.filter((c) => !c.free).length;
  const freeCount = BOOK_CONTENTS.length - gated;
  const tryIt = full ? TRY_IT[chapter.slug] : undefined;
  // Gated chapters list them too: a locked page is where a free lesson's
  // reading link lands, and "pay or go back" is not a next step.
  const lessons = freeLessonsReading(chapter.slug);
  /** The other chapters anyone can read, so the free sample is not one page. */
  const otherFree = BOOK_CONTENTS.filter((c) => c.free && c.slug !== chapter.slug);
  /**
   * Shown whether or not the body is gated, and on purpose. The chapter is the
   * paid thing; the condition that tells a singer the fortnight is finished is
   * not, and a programme phase whose exit test sat behind the paywall would
   * leave the calendar as the only free way to judge progress.
   */
  const exit = exitTestFor(chapter.slug);
  /**
   * The phase chapters are all gated, so the reader places this card: below
   * the chapter for a reader who has the text, on top when the page is locked.
   */
  const exitCard = exit && (
    <Card>
      <div className="max-w-2xl space-y-3">
        <p className="text-sm font-medium text-ink">Move on when: {exit.test}</p>
        <p className="text-sm text-mut">
          The evidence comes from{" "}
          <Link
            href={exit.room === "range" ? rangeTestHref() : exit.roomPath}
            className="text-violet-ink underline decoration-violet/40 underline-offset-2 hover:decoration-violet"
          >
            {exit.roomLabel}
          </Link>
          , which is where this app measures it.
        </p>
        <p className="text-sm text-mut">
          When it does not pass, the blocker is usually this one. {exit.blocker}
        </p>
        <p className="text-sm text-mut">What passing does not prove: {exit.doesNotProve}</p>
        {/* The one place the page states the free cap for the program. */}
        <BookProgramNote scope="fortnight" className="text-sm text-mut" />
      </div>
    </Card>
  );

  return (
    <PageShell
      kicker={`${chapter.part} · Chapter ${chapter.order}`}
      title={chapter.title}
      subtitle={chapter.summary || undefined}
      actions={
        <div className="flex flex-col items-start gap-2">
          <div className="flex flex-wrap items-center gap-2">
            {tryIt?.warmUpFirst && (
              <LinkButton href={RANGE_WARM_UP.href} size="md">
                {RANGE_WARM_UP.label}
              </LinkButton>
            )}
            {tryIt && (
              <LinkButton href={tryIt.href} size="md" variant={tryIt.warmUpFirst ? "outline" : "violet"}>
                {tryIt.label}
              </LinkButton>
            )}
          </div>
          {tryIt?.warmUpFirst && <WarmUpCapNote />}
        </div>
      }
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(chapterJsonLd({ section: "book", bookTitle: BOOK_TITLE, ...chapter })) }}
      />
      {/* The chapter that explains the plan's shape sets no exit test, so its
          bridge to the in-app program stands on its own. */}
      {!exit && chapter.part === PROGRAMME_PART && (
        <Card>
          <BookProgramNote scope="plan" className="max-w-2xl text-sm text-mut" />
        </Card>
      )}
      {full ? (
        <div className="space-y-6">
          <Card>
            <article className="max-w-2xl">
              {/* The visible counterpart of the chapter's author markup. */}
              <AuthorByline lead="By">
                {" "}
                · Chapter {chapter.order} of{" "}
                <Link href="/book" className="text-violet-ink underline decoration-violet/40 underline-offset-2 hover:decoration-violet">
                  {BOOK_TITLE}
                </Link>
              </AuthorByline>
              <Markdown source={full.body} />
            </article>
          </Card>
          {exitCard}
          {lessons.length > 0 && (
            <Card>
              <LessonList lessons={lessons} />
            </Card>
          )}
          {/* Server-rendered for everyone, so the free chapters link one another
              in the HTML a crawler reads, not only after entitlement resolves. */}
          {otherFree.length > 0 && (
            <Card>
              <SectionLabel>The other free chapters</SectionLabel>
              <ul className="mt-3 space-y-2">
                {otherFree.map((c) => (
                  <li key={c.slug} className="text-sm text-mut">
                    <Link href={`/book/${c.slug}`} className="text-violet-ink underline decoration-violet/40 underline-offset-2 hover:decoration-violet">
                      {c.title}
                    </Link>
                    {c.summary && <span>: {c.summary}</span>}
                  </li>
                ))}
              </ul>
            </Card>
          )}
          {/* A subscriber arrives here from "Start reading" — sell Pro only to
              someone who does not already have it. */}
          <FreeOnly>
            <Card>
              <p className="max-w-2xl text-sm text-mut">
                That was one of {freeCount} free chapters. The remaining {gated}{" "}
                (the rest of how the voice works, how to read the numbers your
                own sessions produce, the twelve-week program, and choosing songs
                that fit the voice you have today) come with Suede Pro, along
                with a PDF of the whole book.
              </p>
              {next && (
                <p className="mt-2 max-w-2xl text-sm text-mut">
                  Next up:{" "}
                  <Link
                    href={`/book/${next.slug}`}
                    className="text-violet-ink underline decoration-violet/40 underline-offset-2 hover:decoration-violet"
                  >
                    {next.title}
                  </Link>
                  . {next.summary}
                </p>
              )}
              <div className="mt-4">
                <LinkButton href="/pro#buy" size="md">
                  {`See what Pro includes, ${formatPrice(PRICING.lifetime.amount)} once`}
                </LinkButton>
              </div>
            </Card>
          </FreeOnly>
          <ChapterNav slug={chapter.slug} />
        </div>
      ) : (
        <div className="space-y-6">
          <ChapterReader chapter={chapter} aside={exitCard || undefined} />
          {lessons.length > 0 && (
            <Card>
              <LessonList lessons={lessons} />
            </Card>
          )}
        </div>
      )}
    </PageShell>
  );
}
