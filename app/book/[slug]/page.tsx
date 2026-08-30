import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BOOK, BOOK_CONTENTS, BOOK_TITLE } from "@/lib/book-data";
import { Markdown } from "@/lib/markdown";
import { withCanonicalOpenGraph } from "@/lib/og";
import { SITE_URL } from "@/lib/site";
import { ChapterNav, ChapterReader } from "@/components/book/reader";
import { FreeOnly } from "@/components/pro/gate";
import { Card, LinkButton, PageShell } from "@/components/ui";

interface Params {
  slug: string;
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
  return withCanonicalOpenGraph({
    title: `${c.title} · ${BOOK_TITLE}`,
    description: c.summary,
    alternates: { canonical: `${SITE_URL}/book/${c.slug}` },
    // A gated body has nothing here for an index to rank — list the chapter but
    // keep it out of results. The free chapter is real content and ranks.
    robots: c.free ? undefined : { index: false, follow: true },
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

  // The free chapter renders on the server: indexable, no subscription round
  // trip. Everything else goes through the gated reader.
  const full = chapter.free ? BOOK.find((c) => c.slug === slug) : undefined;
  const next = BOOK_CONTENTS[BOOK_CONTENTS.indexOf(chapter) + 1];
  const gated = BOOK_CONTENTS.filter((c) => !c.free).length;

  return (
    <PageShell
      kicker={`${chapter.part} · Chapter ${chapter.order}`}
      title={chapter.title}
      subtitle={chapter.summary || undefined}
      actions={
        <Link
          href="/book"
          className="rounded-full border border-line px-4 py-2 text-sm text-mut transition-colors hover:border-line2 hover:text-ink"
        >
          ← Contents
        </Link>
      }
    >
      {full ? (
        <div className="space-y-6">
          <Card>
            <article className="max-w-2xl">
              <Markdown source={full.body} />
            </article>
          </Card>
          {/* A subscriber arrives here from "Start reading" — sell Pro only to
              someone who does not already have it. */}
          <FreeOnly>
            <Card>
              <p className="max-w-2xl text-sm text-mut">
                That was the free chapter. The other {gated} — the rest of how
                the voice works, how to read the numbers your own sessions
                produce, the twelve-week program, and choosing songs that fit
                the voice you have today — come with Suede Pro, along with a PDF
                of the whole book.
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
        <ChapterReader chapter={chapter} />
      )}
    </PageShell>
  );
}
