import type { BlogPost } from "./types";
import { POSTS as ALL } from "./posts";

export type { BlogPost } from "./types";

export const BLOG_PATH = "/guides";
/** Where the column lived until 2026-11-16; next.config.ts redirects it here. */
export const LEGACY_BLOG_PATH = "/blog";
export const BLOG_NAME = "Singing Guides";
/** The column's byline name, kept as the index kicker. */
export const BLOG_KICKER = "The Singer's Column";

/** Newest first. */
export const POSTS: readonly BlogPost[] = [...ALL].sort((a, b) =>
  b.published === a.published ? a.slug.localeCompare(b.slug) : b.published.localeCompare(a.published),
);

export function postBySlug(slug: string): BlogPost | undefined {
  return POSTS.find((p) => p.slug === slug);
}

export function postPath(post: Pick<BlogPost, "slug">): string {
  return `${BLOG_PATH}/${post.slug}`;
}

/** Up to `n` other posts, same category first. */
export function relatedPosts(post: BlogPost, n = 3): BlogPost[] {
  const others = POSTS.filter((p) => p.slug !== post.slug);
  return [
    ...others.filter((p) => p.category === post.category),
    ...others.filter((p) => p.category !== post.category),
  ].slice(0, n);
}

/** The latest content date across the column, for the index's lastmod. */
export function latestPostDate(): string | undefined {
  return POSTS.map((p) => p.updated).sort().at(-1);
}
