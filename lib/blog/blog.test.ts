import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import sitemap from "@/app/sitemap";
import { MEDIA_LINE } from "@/components/blog/article-body";
import { labelToMidi } from "@/lib/audio/notes";
import { POSTS } from "@/lib/blog";
import { MAX_DESCRIPTION, MAX_TITLE_BODY } from "@/lib/meta-fit";
import { SITE_URL } from "@/lib/site";

/**
 * The Singer's Column contract. A post is data, so everything a reviewer would
 * check by eye is checked here: the SEO fields fit, every media directive
 * resolves, every internal link lands on a real page, and the article is long
 * enough to be worth ranking.
 */

const ROUTES = new Set(sitemap().map((e) => e.url.replace(SITE_URL, "") || "/"));
/** Real rooms that are noindexed or query-addressed, so not in the sitemap. */
const EXTRA_ROUTES = new Set(["/range", "/warmups", "/studio", "/pro"]);

function internalPath(href: string): string {
  return href.split("#")[0].split("?")[0] || "/";
}

function bodyLinks(body: string): string[] {
  return [...body.matchAll(/\]\((\/[^)\s]*)\)/g)].map((m) => m[1]);
}

const SIBLING_HOSTS = /^https:\/\/([a-z0-9-]+\.)?suedeai\.(ai|org)(\/|$)/;

describe("blog posts", () => {
  it("has at least eight posts with unique slugs, titles and primary keywords", () => {
    expect(POSTS.length).toBeGreaterThanOrEqual(8);
    for (const key of ["slug", "title", "seoTitle", "description", "primaryKeyword"] as const) {
      expect(new Set(POSTS.map((p) => p[key])).size, key).toBe(POSTS.length);
    }
  });

  it.each(POSTS.map((p) => [p.slug, p]))("%s meets the post contract", (_slug, post) => {
    expect(post.slug).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
    expect(post.seoTitle.length, "seoTitle").toBeLessThanOrEqual(MAX_TITLE_BODY);
    expect(post.description.length, "description").toBeGreaterThanOrEqual(70);
    expect(post.description.length, "description").toBeLessThanOrEqual(MAX_DESCRIPTION);
    expect(post.keywords[0]).toBe(post.primaryKeyword);
    expect(post.keywords.length).toBeGreaterThanOrEqual(3);
    expect(post.keywords.length).toBeLessThanOrEqual(9);
    for (const k of post.keywords) {
      expect(k, k).toBe(k.toLowerCase());
      expect(k, k).not.toMatch(/[,.:;!?"()']/);
      expect(k, k).not.toMatch(/suede|\bbest\b/);
    }
    // The primary keyword is in the H1 and the <title>, in some word order.
    const words = post.primaryKeyword.split(" ").filter((w) => w.length > 3);
    for (const w of words) {
      expect(post.title.toLowerCase(), `title has "${w}"`).toContain(w);
    }
    expect(post.published <= post.updated).toBe(true);
    expect(post.updated).toMatch(/^\d{4}-\d{2}-\d{2}$/);

    const wordCount = post.body.split(/\s+/).filter(Boolean).length;
    expect(wordCount, "body words").toBeGreaterThanOrEqual(1200);
    expect(post.readMinutes).toBe(Math.max(1, Math.round((wordCount + post.answer.split(/\s+/).length) / 230)));
    expect((post.body.match(/^## /gm) ?? []).length, "h2 sections").toBeGreaterThanOrEqual(4);
    expect(post.body, "no h1 in body").not.toMatch(/^# /m);

    // Media: every directive resolves, every asset is placed, and each post has both kinds.
    const directives = post.body
      .split("\n")
      .map((l) => MEDIA_LINE.exec(l.trim()))
      .filter((m): m is RegExpExecArray => m !== null);
    const used = new Set(directives.map((m) => `${m[1]}:${m[2]}`));
    for (const m of directives) {
      const pool = m[1] === "infographic" ? post.infographics : post.videos;
      expect(pool[m[2]], `${m[1]} ${m[2]}`).toBeDefined();
    }
    for (const key of Object.keys(post.infographics)) expect(used.has(`infographic:${key}`), key).toBe(true);
    for (const key of Object.keys(post.videos)) expect(used.has(`video:${key}`), key).toBe(true);
    expect(Object.keys(post.infographics).length, "infographics").toBeGreaterThanOrEqual(2);
    expect(Object.keys(post.videos).length, "videos").toBeGreaterThanOrEqual(1);
    for (const v of Object.values(post.videos)) expect(v.youtubeId).toMatch(/^[A-Za-z0-9_-]{11}$/);
    for (const g of Object.values(post.infographics)) {
      if (g.kind === "range") {
        for (const s of g.spans) {
          expect(labelToMidi(s.low), s.low).not.toBeNull();
          expect(labelToMidi(s.high), s.high).not.toBeNull();
          expect(labelToMidi(s.high)!, s.label).toBeGreaterThan(labelToMidi(s.low)!);
        }
      }
      if (g.kind === "compare") for (const r of g.rows) expect(r.cells.length, r.label).toBe(g.columns.length);
    }

    // Links: internal ones land on real pages; external ones stay in the Suede estate.
    const internal = [...bodyLinks(post.body), ...post.related.map((l) => l.href), post.cta.href].filter((h) =>
      h.startsWith("/"),
    );
    expect(internal.length, "internal links").toBeGreaterThanOrEqual(6);
    for (const h of internal) {
      const path = internalPath(h);
      expect(ROUTES.has(path) || EXTRA_ROUTES.has(path), h).toBe(true);
    }
    for (const l of post.related) {
      if (!l.href.startsWith("/")) expect(l.href, l.href).toMatch(SIBLING_HOSTS);
    }
    expect(post.related.length).toBeGreaterThanOrEqual(4);
    expect(post.faq.length).toBeGreaterThanOrEqual(4);
  });
});
