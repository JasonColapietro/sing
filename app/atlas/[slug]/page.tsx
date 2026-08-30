import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ATLAS, ATLAS_CONTENTS, ATLAS_TITLE } from "@/lib/atlas-data";
import { Markdown } from "@/lib/markdown";
import { withCanonicalOpenGraph } from "@/lib/og";
import { SITE_URL } from "@/lib/site";
import { AtlasChapterNav, AtlasChapterReader } from "@/components/atlas/reader";
import { AtlasEntryCard } from "@/components/atlas/entry";
import { FreeOnly } from "@/components/pro/gate";
import { Card, LinkButton, PageShell } from "@/components/ui";

interface Params {
  slug: string;
}

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
    title: `${c.title} · ${ATLAS_TITLE}`,
    description: c.summary,
    alternates: { canonical: `${SITE_URL}/atlas/${c.slug}` },
    // Gated chapters have nothing for an index to rank — list them but keep
    // them out of results. The free sample chapter is real content and ranks.
    robots: c.free ? undefined : { index: false, follow: true },
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

  return (
    <PageShell
      kicker={`${chapter.part} · Chapter ${chapter.order}`}
      title={chapter.title}
      subtitle={chapter.summary || undefined}
      actions={
        <Link
          href="/atlas"
          className="rounded-full border border-line px-4 py-2 text-sm text-mut transition-colors hover:border-line2 hover:text-ink"
        >
          ← Contents
        </Link>
      }
    >
      {full ? (
        <div className="space-y-6">
          <Card>
            <div className="max-w-3xl">
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
          {/* A subscriber reads the free chapters in order like any other —
              sell Pro only to someone who does not already have it. */}
          <FreeOnly>
            <Card>
              <p className="max-w-2xl text-sm text-mut">
                That was one of the {free.length} free chapters. The rest of the
                atlas — the remaining method chapters, every genre chapter with
                its entry notes, and the appendices — is included with Suede
                Pro, along with a PDF of the whole book.
              </p>
              {nextFree && (
                <p className="mt-2 max-w-2xl text-sm text-mut">
                  Also free:{" "}
                  <Link
                    href={`/atlas/${nextFree.slug}`}
                    className="text-violet-ink hover:underline"
                  >
                    {nextFree.title}
                  </Link>
                  . {nextFree.summary}
                </p>
              )}
              <div className="mt-4 flex flex-wrap gap-3">
                <LinkButton href="/pro" size="md">
                  See what Pro includes
                </LinkButton>
                <LinkButton href="/atlas" variant="outline" size="md">
                  Back to contents
                </LinkButton>
              </div>
            </Card>
          </FreeOnly>
          <AtlasChapterNav slug={chapter.slug} />
        </div>
      ) : (
        <AtlasChapterReader chapter={chapter} />
      )}
    </PageShell>
  );
}
