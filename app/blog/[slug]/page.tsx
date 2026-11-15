import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArticleBody } from "@/components/blog/article-body";
import { Card, LinkButton, SectionLabel } from "@/components/ui";
import { AUTHOR_NAME, AUTHOR_NODE } from "@/lib/author";
import { BLOG_NAME, BLOG_PATH, POSTS, postBySlug, postPath, relatedPosts } from "@/lib/blog";
import { blogPostKeywords } from "@/lib/keywords";
import { DEFAULT_OG_IMAGE, withCanonicalOpenGraph } from "@/lib/og";
import { ORG_ID, ORG_PUBLISHER_NODE } from "@/lib/organization";
import { SITE_URL } from "@/lib/site";

interface Params {
  slug: string;
}

export const dynamicParams = false;

export function generateStaticParams(): Params[] {
  return POSTS.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await params;
  const post = postBySlug(slug);
  if (!post) return {};
  return withCanonicalOpenGraph({
    title: post.seoTitle,
    description: post.description,
    keywords: blogPostKeywords(post),
    alternates: { canonical: `${SITE_URL}${postPath(post)}` },
    openGraph: {
      type: "article",
      images: [DEFAULT_OG_IMAGE],
      publishedTime: post.published,
      modifiedTime: post.updated,
      authors: [AUTHOR_NAME],
      section: post.category,
    },
  });
}

function formatDate(iso: string): string {
  return new Date(`${iso}T12:00:00Z`).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
}

export default async function BlogPostPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const post = postBySlug(slug);
  if (!post) notFound();

  const url = `${SITE_URL}${postPath(post)}`;
  const more = relatedPosts(post);

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      ORG_PUBLISHER_NODE,
      AUTHOR_NODE,
      {
        "@type": "BlogPosting",
        "@id": `${url}#article`,
        mainEntityOfPage: { "@type": "WebPage", "@id": `${url}#webpage`, url },
        headline: post.title,
        description: post.description,
        abstract: post.answer,
        keywords: post.keywords.join(", "),
        articleSection: post.category,
        datePublished: post.published,
        dateModified: post.updated,
        inLanguage: "en",
        image: DEFAULT_OG_IMAGE.url,
        author: { "@id": AUTHOR_NODE["@id"] },
        publisher: { "@id": ORG_ID },
        isPartOf: { "@type": "Blog", "@id": `${SITE_URL}${BLOG_PATH}#blog`, name: BLOG_NAME },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Suede Sing", item: SITE_URL },
          { "@type": "ListItem", position: 2, name: BLOG_NAME, item: `${SITE_URL}${BLOG_PATH}` },
          { "@type": "ListItem", position: 3, name: post.title, item: url },
        ],
      },
      {
        "@type": "FAQPage",
        "@id": `${url}#faq`,
        mainEntity: post.faq.map((f) => ({
          "@type": "Question",
          name: f.q,
          acceptedAnswer: { "@type": "Answer", text: f.a },
        })),
      },
    ],
  };

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <nav aria-label="Breadcrumb" className="mb-6 text-sm text-mut">
        <ol className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <li>
            <Link href={BLOG_PATH} className="inline-flex min-h-6 items-center hover:text-ink">
              {BLOG_NAME}
            </Link>
          </li>
          <li className="flex items-center gap-2">
            <span aria-hidden="true">/</span>
            <span>{post.category}</span>
          </li>
        </ol>
      </nav>

      <article className="mx-auto max-w-[44rem]">
        <header>
          <SectionLabel className="mb-3">{post.category}</SectionLabel>
          <h1 className="text-4xl sm:text-5xl">{post.title}</h1>
          <p className="mt-4 font-mono text-meta text-dim">
            By{" "}
            <a href="https://suedeai.ai/founder" rel="author" className="underline underline-offset-2 hover:text-ink">
              {AUTHOR_NAME}
            </a>{" "}
            · <time dateTime={post.updated}>Updated {formatDate(post.updated)}</time> · {post.readMinutes} min read
          </p>
        </header>

        <div className="mt-8 rounded-2xl border border-amber/50 bg-panel p-5">
          <p className="font-mono text-label uppercase tracking-[0.14em] text-amber-ink">The short answer</p>
          <p className="mt-2 text-[1.0625rem] leading-[1.7] text-ink">{post.answer}</p>
        </div>

        <ArticleBody post={post} />

        <section aria-labelledby="faq-heading" className="mt-12">
          <h2 id="faq-heading" className="text-2xl">
            Frequently asked questions
          </h2>
          <dl className="mt-4 divide-y divide-line border-y border-line">
            {post.faq.map((f) => (
              <div key={f.q} className="py-4">
                <dt className="font-semibold text-ink">{f.q}</dt>
                <dd className="mt-1.5 leading-relaxed text-mut">{f.a}</dd>
              </div>
            ))}
          </dl>
        </section>

        <Card className="mt-12">
          <h2 className="text-2xl">{post.cta.label}</h2>
          <p className="mt-2 text-mut">{post.cta.pitch}</p>
          <div className="mt-4">
            <LinkButton href={post.cta.href}>{post.cta.label}</LinkButton>
          </div>
        </Card>

        <section aria-labelledby="related-heading" className="mt-12">
          <h2 id="related-heading" className="text-2xl">
            Practice it on Suede
          </h2>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {post.related.map((l) => (
              <li key={l.href} className="rounded-xl border border-line bg-panel p-4">
                {l.href.startsWith("http") ? (
                  <a href={l.href} className="font-semibold text-ink underline-offset-4 hover:underline">
                    {l.label}
                  </a>
                ) : (
                  <Link href={l.href} prefetch={false} className="font-semibold text-ink underline-offset-4 hover:underline">
                    {l.label}
                  </Link>
                )}
                <p className="mt-1 text-sm leading-relaxed text-mut">{l.blurb}</p>
              </li>
            ))}
          </ul>
        </section>
      </article>

      {more.length > 0 && (
        <section aria-labelledby="more-heading" className="mx-auto mt-16 max-w-[44rem]">
          <h2 id="more-heading" className="text-2xl">
            More from {BLOG_NAME}
          </h2>
          <ul className="mt-4 space-y-3">
            {more.map((p) => (
              <li key={p.slug}>
                <Link href={postPath(p)} prefetch={false} className="block rounded-xl border border-line bg-panel p-4 hover:border-line2">
                  <span className="font-mono text-label uppercase tracking-[0.12em] text-dim">{p.category}</span>
                  <span className="mt-1 block text-lg text-ink">{p.title}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}
