import type { Metadata } from "next";
import Link from "next/link";
import { PageShell } from "@/components/ui";
import { BLOG_NAME, BLOG_PATH, POSTS, latestPostDate, postPath } from "@/lib/blog";
import { routeKeywords } from "@/lib/keywords";
import { DEFAULT_OG_IMAGE, withCanonicalOpenGraph } from "@/lib/og";
import { ORG_ID, ORG_PUBLISHER_NODE } from "@/lib/organization";
import { SITE_URL } from "@/lib/site";

const TITLE = "Singing Tips Blog: The Singer's Column";
const DESCRIPTION =
  "Singing tips that end in practice: high notes, singing in tune, mixed voice, vibrato, belting and vocal health, each with drills you can try with live pitch feedback.";

export const metadata: Metadata = withCanonicalOpenGraph({
  keywords: routeKeywords(BLOG_PATH),
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: `${SITE_URL}${BLOG_PATH}` },
  openGraph: { title: TITLE, description: DESCRIPTION, type: "website", images: [DEFAULT_OG_IMAGE] },
});

export default function BlogIndexPage() {
  const url = `${SITE_URL}${BLOG_PATH}`;
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      ORG_PUBLISHER_NODE,
      {
        "@type": "Blog",
        "@id": `${url}#blog`,
        url,
        name: BLOG_NAME,
        description: DESCRIPTION,
        inLanguage: "en",
        publisher: { "@id": ORG_ID },
        ...(latestPostDate() ? { dateModified: latestPostDate() } : {}),
        blogPost: POSTS.map((p) => ({
          "@type": "BlogPosting",
          "@id": `${SITE_URL}${postPath(p)}#article`,
          headline: p.title,
          url: `${SITE_URL}${postPath(p)}`,
          datePublished: p.published,
          dateModified: p.updated,
        })),
      },
    ],
  };

  return (
    <PageShell
      kicker={BLOG_NAME}
      title="Singing tips that end in practice"
      subtitle="Long-form answers to the questions singers ask most, from how to hit high notes to why your voice cracks. Every article ends in a drill you can run here with live pitch feedback."
    >
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <h2 className="sr-only">Articles</h2>
      <ul className="grid gap-4 sm:grid-cols-2">
        {POSTS.map((p) => (
          <li key={p.slug}>
            <Link
              href={postPath(p)}
              className="flex h-full flex-col rounded-2xl border border-line bg-panel p-5 transition-colors hover:border-line2"
            >
              <span className="font-mono text-label uppercase tracking-[0.12em] text-dim">
                {p.category} · {p.readMinutes} min
              </span>
              <span className="mt-2 font-display text-2xl leading-tight text-ink">{p.title}</span>
              <span className="mt-2 text-sm leading-relaxed text-mut">{p.description}</span>
            </Link>
          </li>
        ))}
      </ul>
    </PageShell>
  );
}
