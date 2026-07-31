import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BOOK_CONTENTS, BOOK_TITLE } from "@/lib/book-data";
import { SITE_URL } from "@/lib/site";
import { ChapterReader } from "@/components/book/reader";
import { PageShell } from "@/components/ui";

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
  return {
    title: `${c.title} · ${BOOK_TITLE}`,
    description: c.summary,
    alternates: { canonical: `${SITE_URL}/book/${c.slug}` },
    // The body is subscriber-only, so there is nothing here for an index to
    // rank — list the chapter but keep it out of results.
    robots: { index: false, follow: true },
  };
}

export default async function ChapterPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { slug } = await params;
  const chapter = BOOK_CONTENTS.find((c) => c.slug === slug);
  if (!chapter) notFound();

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
      <ChapterReader chapter={chapter} />
    </PageShell>
  );
}
