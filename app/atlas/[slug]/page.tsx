import type { Metadata } from "next";
import { chapterKeywords } from "@/lib/keywords";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ATLAS, ATLAS_CONTENTS, ATLAS_TITLE } from "@/lib/atlas-data";
import { AUTHOR_NAME } from "@/lib/author";
import { freeLessonsReading } from "@/lib/lesson-readings";
import { Markdown } from "@/lib/markdown";
import { firstFit } from "@/lib/meta-fit";
import { withCanonicalOpenGraph } from "@/lib/og";
import { chapterJsonLd } from "@/lib/page-jsonld";
import { PRICING, formatPrice } from "@/lib/pro-shared";
import { pageRobots } from "@/lib/robots-meta";
import { SITE_URL, rangeTestHref } from "@/lib/site";
import { AtlasChapterNav, AtlasChapterReader } from "@/components/atlas/reader";
import { AtlasEntryCard } from "@/components/atlas/entry";
import { LessonList } from "@/components/learn/lesson-list";
import { FreeOnly } from "@/components/pro/gate";
import { Card, LinkButton, PageShell, SectionLabel } from "@/components/ui";

interface Params {
  slug: string;
}

/**
 * Search titles for free chapters whose own title is not the phrase people
 * search for. The H1 stays the chapter title; only the <title> names the
 * topic, and the chapter title stays inside it.
 */
const SEARCH_TITLES: Record<string, string> = {
  "notes-octaves-and-the-keyboard": "Scientific Pitch Notation: Notes, Octaves and the Keyboard",
};

/**
 * What each free chapter asks the reader to go and do. The chapter prose says
 * "take your own range test" but the markdown renderer cannot link, so this is
 * the button: a reader who arrived from search can measure their own voice
 * before being asked to pay for anything. A free chapter with no entry falls
 * back to DEFAULT_TRY_IT.
 */
interface TryIt {
  label: string;
  line: string;
  /** The reference page that sits next to this chapter. */
  next: { href: string; label: string };
}

const SINGERS_CHART = { href: "/singers", label: "Famous singers' vocal ranges" };

const DEFAULT_TRY_IT: TryIt = {
  label: "Find my vocal range",
  line: "The free range test takes about two minutes in your browser and reports your lowest and highest notes in the same notation this book uses.",
  next: SINGERS_CHART,
};

const TRY_IT: Record<string, TryIt> = {
  "how-to-read-an-entry": {
    label: "Get your own two numbers",
    line: "The range test measures your lowest and highest notes in one session, in the same notation as every entry.",
    next: SINGERS_CHART,
  },
  "notes-octaves-and-the-keyboard": {
    label: "Get your own two numbers",
    line: "Take the range test and read your result on the same ruler as the atlas.",
    next: SINGERS_CHART,
  },
  "voice-types-in-the-wild": {
    label: "Get a voice-type estimate from one session",
    line: "The range test gives your range for that session and an estimate of the voice type it suggests: a starting shelf, not a verdict.",
    next: { href: "/atlas/vocal-range-by-voice-type", label: "Vocal range by voice type" },
  },
};

const RANGE_TEST_HREF = rangeTestHref();

export const dynamicParams = false;

export function generateStaticParams(): Params[] {
  return ATLAS_CONTENTS.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { slug } = await params;
  const c = ATLAS_CONTENTS.find((x) => x.slug === slug);
  if (!c) return {};
  return withCanonicalOpenGraph({
    // The book's name when it fits, a shorter tail when it doesn't, so a
    // chapter title never reaches search as a bare phrase identical to its H1.
    title: SEARCH_TITLES[c.slug]
      ? { absolute: SEARCH_TITLES[c.slug] }
      : firstFit([`${c.title} · ${ATLAS_TITLE}`, `${c.title} · Voice Atlas`, c.title]),
    keywords: chapterKeywords(c.title, "atlas"),
    description: c.summary,
    alternates: { canonical: `${SITE_URL}/atlas/${c.slug}` },
    // Gated chapters have nothing for an index to rank — list them but keep
    // them out of results. The free sample chapter is real content and ranks.
    robots: pageRobots(c.free),
  });
}

export default async function AtlasChapterPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { slug } = await params;
  const chapter = ATLAS_CONTENTS.find((c) => c.slug === slug);
  if (!chapter) notFound();

  // The free sample renders on the server: indexable, no subscription round
  // trip. Everything else goes through the gated reader.
  const full = chapter.free ? ATLAS.find((c) => c.slug === slug) : undefined;
  const free = ATLAS_CONTENTS.filter((c) => c.free);
  const nextFree = free[free.indexOf(chapter) + 1];
  const tryIt = full ? (TRY_IT[chapter.slug] ?? DEFAULT_TRY_IT) : undefined;
  // Free lessons cite atlas chapters as reading, most of them locked. A
  // locked page is where that reading link lands, so it lists the way back,
  // as the book's locked chapters do.
  const lessons = freeLessonsReading(`atlas:${chapter.slug}`);

  return (
    <PageShell
      kicker={`${chapter.part} · Chapter ${chapter.order}`}
      title={chapter.title}
      subtitle={chapter.summary || undefined}
      actions={
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/atlas"
            prefetch={false}
            className="inline-flex min-h-11 items-center rounded-full border border-line px-4 py-2 text-sm text-mut transition-colors hover:border-line2 hover:text-ink"
          >
            ← Contents
          </Link>
        </div>
      }
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(chapterJsonLd({ section: "atlas", bookTitle: ATLAS_TITLE, ...chapter })) }}
      />
      {full ? (
        <div className="space-y-6">
          <Card>
            <div className="max-w-3xl">
              {/* The visible counterpart of the chapter's author markup. */}
              <p className="mb-4 text-sm text-mut">
                By{" "}
                <a
                  href="https://jasoncolapietro.com"
                  rel="author"
                  className="text-violet-ink underline decoration-violet/40 underline-offset-2 hover:decoration-violet"
                >
                  {AUTHOR_NAME}
                </a>{" "}
                · Chapter {chapter.order} of{" "}
                <Link href="/atlas" prefetch={false} className="text-violet-ink underline decoration-violet/40 underline-offset-2 hover:decoration-violet">
                  {ATLAS_TITLE}
                </Link>
              </p>
              <Markdown source={full.body} />
            </div>
          </Card>
          {full.entries.length > 0 && (
            <div className="space-y-4">
              {full.entries.map((e) => (
                <AtlasEntryCard key={e.slug} entry={e} />
              ))}
            </div>
          )}
          {/* Rendered on the server for everyone: the free chapters tell the
              reader to take the range test, and this is where they can. */}
          {tryIt && (
            <Card>
              <SectionLabel>Put your own numbers next to these</SectionLabel>
              <p className="mt-3 max-w-2xl text-sm text-mut">{tryIt.line}</p>
              <div className="mt-4 flex flex-wrap gap-3">
                <LinkButton href={RANGE_TEST_HREF} size="md">
                  {tryIt.label}
                </LinkButton>
                <LinkButton href={tryIt.next.href} prefetch={false} variant="outline" size="md">
                  {tryIt.next.label}
                </LinkButton>
              </div>
            </Card>
          )}
          {lessons.length > 0 && (
            <Card>
              <LessonList lessons={lessons} />
            </Card>
          )}
          {/* A subscriber reads the free chapters in order like any other —
              sell Pro only to someone who does not already have it. */}
          <FreeOnly>
            <Card>
              <p className="max-w-2xl text-sm text-mut">
                That was one of the {free.length} free chapters. The rest of the
                atlas (the remaining method chapters, every genre chapter with
                its entry notes, and the appendices) is included with Suede
                Pro, along with a PDF of the whole book.
              </p>
              {nextFree && (
                <p className="mt-2 max-w-2xl text-sm text-mut">
                  Also free:{" "}
                  <Link
                    href={`/atlas/${nextFree.slug}`}
                    className="text-violet-ink underline decoration-violet/40 underline-offset-2 hover:decoration-violet"
                  >
                    {nextFree.title}
                  </Link>
                  . {nextFree.summary}
                </p>
              )}
              <div className="mt-4">
                <LinkButton href="/pro#buy" size="md">
                  {`See what Pro includes, ${formatPrice(PRICING.lifetime.amount)} once`}
                </LinkButton>
              </div>
            </Card>
          </FreeOnly>
          <AtlasChapterNav slug={chapter.slug} />
        </div>
      ) : (
        <div className="space-y-6">
          <AtlasChapterReader chapter={chapter} />
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
