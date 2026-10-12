import type { Metadata } from "next";
import { chapterKeywords } from "@/lib/keywords";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AUTHOR_NAME } from "@/lib/author";
import { BOOK, BOOK_CONTENTS, BOOK_TITLE } from "@/lib/book-data";
import { MODULE_PRACTICE } from "@/lib/lesson-practice";
import { Markdown } from "@/lib/markdown";
import { FREE_DAILY_MINUTES } from "@/lib/practice-limits";
import { exitTestFor, PROGRAMME_PART } from "@/lib/programme-exit-tests";
import { firstFit } from "@/lib/meta-fit";
import { withCanonicalOpenGraph } from "@/lib/og";
import { chapterJsonLd } from "@/lib/page-jsonld";
import { pageRobots } from "@/lib/robots-meta";
import { SITE_URL } from "@/lib/site";
import { COURSE } from "@/lib/voice-lessons";
import { BookProgramNote } from "@/components/book/program-link";
import { ChapterNav, ChapterReader } from "@/components/book/reader";
import { FreeOnly } from "@/components/pro/gate";
import { Card, LinkButton, PageShell, SectionLabel } from "@/components/ui";

interface Params {
  slug: string;
}

/**
 * The room each free chapter's "Try this" sends the reader to. The chapter
 * names the room in its prose; this is the button, so a reader who arrived from
 * search can do the exercise the chapter just prescribed before being asked to
 * pay for anything. Keyed by slug, so a chapter without an entry shows nothing.
 */
const TRY_IT: Record<
  string,
  { href: string; label: string; line: string; warmUpFirst?: boolean }
> = {
  "what-your-voice-is": {
    href: "/studio",
    label: "Try it in the pitch studio",
    line: "Hold one note on “ah”, then “ee”: the trace stays on one line while the sound changes.",
  },
  "reading-the-range-test": {
    href: "/range?mode=range",
    label: "Take the range test honestly",
    line: "Warm up first, stop at the first note that needs effort, and count only notes you can hold for two beats.",
    warmUpFirst: true,
  },
  "when-numbers-lie": {
    href: "/studio",
    label: "Check your room in the pitch studio",
    line: "Stay silent for fifteen seconds and watch the trace: any pitch it shows is your room, not your voice.",
  },
};

/**
 * Free voice-course modules that list this chapter as reading. The lessons
 * already link here; this is the way back, so a chapter is not the end of the
 * road for someone who found it first.
 */
function lessonsUsing(slug: string): Array<{ href: string; name: string; skill: string }> {
  const modules = COURSE.filter((s) => s.catalog.access === "free").flatMap((s) => s.modules);
  return Object.entries(MODULE_PRACTICE)
    .filter(([, practice]) => practice.readings.includes(slug))
    .flatMap(([id]) => {
      const m = modules.find((x) => x.catalog.id === id);
      return m?.href ? [{ href: m.href, name: m.catalog.name, skill: m.catalog.skill }] : [];
    });
}

/**
 * Exit-test rooms (keys of the contract's `deepLinks.rooms`) that run guided
 * practice, which the free plan caps at FREE_DAILY_MINUTES a day. The studio
 * and the range test have no clock. Mirrors CAPPED_TYPES in lib/free-cap.ts,
 * a client module this server page cannot read values from.
 */
const GUIDED_ROOMS: ReadonlySet<string> = new Set(["warmups", "breath", "earTraining", "songs"]);

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
  const lessons = lessonsUsing(chapter.slug);
  /** The other chapters anyone can read, so the free sample is not one page. */
  const otherFree = BOOK_CONTENTS.filter((c) => c.free && c.slug !== chapter.slug);
  /**
   * Shown whether or not the body is gated, and on purpose. The chapter is the
   * paid thing; the condition that tells a singer the fortnight is finished is
   * not, and a programme phase whose exit test sat behind the paywall would
   * leave the calendar as the only free way to judge progress.
   */
  const exit = exitTestFor(chapter.slug);

  return (
    <PageShell
      kicker={`${chapter.part} · Chapter ${chapter.order}`}
      title={chapter.title}
      subtitle={chapter.summary || undefined}
      actions={
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/book"
            className="inline-flex min-h-11 items-center rounded-full border border-line px-4 py-2 text-sm text-mut transition-colors hover:border-line2 hover:text-ink"
          >
            ← Contents
          </Link>
          {tryIt && (
            <LinkButton href={tryIt.href} size="md">
              {tryIt.label}
            </LinkButton>
          )}
        </div>
      }
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(chapterJsonLd({ section: "book", bookTitle: BOOK_TITLE, ...chapter })) }}
      />
      {exit && (
        <Card>
          <div className="max-w-2xl space-y-3">
            <p className="text-sm font-medium text-ink">
              Move on when: {exit.test}
            </p>
            <p className="text-sm text-mut">
              The evidence comes from{" "}
              <Link href={exit.room === "range" ? "/range?mode=range" : exit.roomPath} className="text-violet-ink hover:underline">
                {exit.roomLabel}
              </Link>
              , which is where this app measures it.
              {GUIDED_ROOMS.has(exit.room) &&
                ` Time there counts toward the free plan's ${FREE_DAILY_MINUTES} guided minutes a day; Pro removes the limit.`}
            </p>
            <p className="text-sm text-mut">
              When it does not pass, the blocker is usually this one. {exit.blocker}
            </p>
            <p className="text-sm text-mut">
              What passing does not prove: {exit.doesNotProve}
            </p>
            <BookProgramNote scope="fortnight" className="text-sm text-mut" />
          </div>
        </Card>
      )}
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
              <p className="text-sm text-mut">
                By{" "}
                <a
                  href="https://jasoncolapietro.com"
                  rel="author"
                  className="text-violet-ink hover:underline"
                >
                  {AUTHOR_NAME}
                </a>{" "}
                · Chapter {chapter.order} of{" "}
                <Link href="/book" className="text-violet-ink hover:underline">
                  {BOOK_TITLE}
                </Link>
              </p>
              <Markdown source={full.body} />
            </article>
          </Card>
          {(tryIt || lessons.length > 0) && (
            <Card>
              {tryIt && (
                <>
                  <SectionLabel>Try this now</SectionLabel>
                  <p className="mt-3 max-w-2xl text-sm text-mut">{tryIt.line}</p>
                  <div className="mt-4 flex flex-wrap gap-3">
                    <LinkButton href={tryIt.href} size="md">
                      {tryIt.label}
                    </LinkButton>
                    {tryIt.warmUpFirst && (
                      <LinkButton href="/warmups" variant="outline" size="md">
                        Warm up first
                      </LinkButton>
                    )}
                  </div>
                  {tryIt.warmUpFirst && (
                    <p className="mt-3 max-w-2xl text-xs text-dim">
                      Warmups are guided practice, which the free plan gives{" "}
                      {FREE_DAILY_MINUTES} minutes a day; Pro removes the limit.
                      The range test itself has no clock.
                    </p>
                  )}
                </>
              )}
              {lessons.length > 0 && (
                <div className={tryIt ? "mt-6 border-t border-line pt-5" : undefined}>
                  <LessonList lessons={lessons} />
                </div>
              )}
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
                    <Link href={`/book/${c.slug}`} className="text-violet-ink hover:underline">
                      {c.title}
                    </Link>
                    {c.summary && <span> — {c.summary}</span>}
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
                — the rest of how the voice works, how to read the numbers your
                own sessions produce, the twelve-week program, and choosing songs
                that fit the voice you have today — come with Suede Pro, along
                with a PDF of the whole book.
              </p>
              {next && (
                <p className="mt-2 max-w-2xl text-sm text-mut">
                  Next up:{" "}
                  <Link
                    href={`/book/${next.slug}`}
                    className="text-violet-ink hover:underline"
                  >
                    {next.title}
                  </Link>
                  . {next.summary}
                </p>
              )}
              <div className="mt-4 flex flex-wrap gap-3">
                <LinkButton href="/pro" size="md">
                  See what Pro includes
                </LinkButton>
                <LinkButton href="/book" variant="outline" size="md">
                  Back to contents
                </LinkButton>
              </div>
            </Card>
          </FreeOnly>
          <ChapterNav slug={chapter.slug} />
        </div>
      ) : (
        <div className="space-y-6">
          <ChapterReader chapter={chapter} />
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

function LessonList({ lessons }: { lessons: ReturnType<typeof lessonsUsing> }) {
  return (
    <>
      <SectionLabel>Free lessons that use this chapter</SectionLabel>
      <ul className="mt-3 space-y-2">
        {lessons.map((l) => (
          <li key={l.href} className="text-sm text-mut">
            <Link href={l.href} className="text-violet-ink hover:underline">
              {l.name}
            </Link>{" "}
            — {l.skill}
          </li>
        ))}
      </ul>
    </>
  );
}
