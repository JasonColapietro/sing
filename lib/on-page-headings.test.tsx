/**
 * The first screen of every content and hub page, on every URL its template
 * generates: exactly one server-rendered <h1>, carrying the page's primary
 * term, followed by an opening paragraph that answers the page's question.
 *
 * Other guards check the <title> (keyword-title-alignment, route-metadata) or
 * one hand-picked example per template (singer-page-search-intent,
 * vocal-range-page). This one walks generateStaticParams for each template, so
 * a heading that reads well on the example and badly on the other 600 pages, or
 * a param that renders two h1s, fails here.
 */
import { renderToStaticMarkup } from "react-dom/server";
import type { Metadata } from "next";
import type { ReactElement } from "react";
import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { findLesson, findModule, findStage } from "@/lib/voice-lessons";
import { ATLAS_CONTENTS } from "@/lib/atlas-data";
import { BOOK_CONTENTS } from "@/lib/book-data";
import { popSongBySlug } from "@/lib/pop-songs";
import { genreFromSlug, voiceTypeFromSlug } from "@/lib/singers";
import { SINGERS } from "@/lib/singers";
import { songBySlug } from "@/components/songs/data";

type Params = Record<string, string>;
type PageModule = {
  default: (p: { params: Promise<Params> }) => ReactElement | Promise<ReactElement>;
  metadata?: Metadata;
  generateMetadata?: (p: { params: Promise<Params> }) => Promise<Metadata>;
  generateStaticParams?: () => Params[];
};

/** Lowercase, apostrophes dropped, punctuation flattened ("Singers'" = "singers"). */
function norm(text: string): string {
  return text
    .toLowerCase()
    .replace(/&#x27;|&#39;|['’‘]/g, "")
    .replace(/&amp;/g, "&")
    .replace(/[^\p{L}\p{N}&#]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function text(html: string): string {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/&#x27;|&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}

function shippedTitle(meta: Metadata): string {
  const t = meta.title as unknown;
  if (typeof t === "string") return t;
  return (t as { absolute?: string } | undefined)?.absolute ?? "";
}

interface Template {
  dir: string;
  /** Phrases the h1 must contain (normalized), for one set of params. */
  terms: (p: Params) => string[];
  /**
   * The h1 is a fixed name (a lesson or chapter title, or a singer heading the
   * singer tests pin) and the <title> falls back to that same text when a long
   * name leaves no budget for anything after it.
   */
  titleMayMatch?: boolean;
}

const TEMPLATES: Template[] = [
  { dir: "learn", terms: () => ["learn to sing"] },
  { dir: "learn/voice", terms: () => ["free voice lessons"] },
  {
    dir: "learn/voice/[stage]",
    terms: (p) => [findStage(p.stage)!.catalog.name, "voice course"],
  },
  {
    dir: "learn/voice/[stage]/[module]",
    terms: (p) => [findModule(p.stage, p.module)!.module.catalog.name, "voice lessons"],
  },
  {
    dir: "learn/voice/[stage]/[module]/[lesson]",
    terms: (p) => [findLesson(p.stage, p.module, p.lesson)!.lesson.body.title],
    titleMayMatch: true,
  },
  { dir: "glossary", terms: () => ["singing terms glossary"] },
  { dir: "book", terms: () => ["singing book", "the measured voice"] },
  {
    dir: "book/[slug]",
    terms: (p) => [BOOK_CONTENTS.find((c) => c.slug === p.slug)!.title],
    titleMayMatch: true,
  },
  { dir: "atlas", terms: () => ["voice atlas", "how famous singers sing"] },
  {
    dir: "atlas/[slug]",
    terms: (p) => [ATLAS_CONTENTS.find((c) => c.slug === p.slug)!.title],
    titleMayMatch: true,
  },
  { dir: "atlas/vocal-range-by-voice-type", terms: () => ["vocal range by voice type"] },
  { dir: "singers", terms: () => ["famous singers vocal ranges"] },
  {
    dir: "singers/genre/[genre]",
    terms: (p) => {
      const g = genreFromSlug(p.genre)!;
      return [g === "Singer-Songwriter" ? "singer songwriters vocal ranges" : `${g} singers vocal ranges`];
    },
  },
  {
    dir: "singers/voice-type/[type]",
    terms: (p) => {
      const v = voiceTypeFromSlug(p.type)!;
      return v === "Contralto" ? ["contralto singers", "contralto vocal range"] : [`${v} vocal range`, `${v} singers`];
    },
  },
  { dir: "singers/records", terms: () => ["widest vocal range"] },
  { dir: "singers/methodology", terms: () => ["why singer vocal ranges differ"] },
  {
    // Noindexed pending review, but the heading still has to answer the query.
    dir: "singers/[slug]",
    terms: (p) => [SINGERS.find((s) => s.slug === p.slug)!.name, "vocal range"],
    titleMayMatch: true,
  },
  { dir: "can-you-sing", terms: () => ["can i sing this song", "vocal ranges"] },
  {
    dir: "can-you-sing/[slug]",
    terms: (p) => [`can you sing ${popSongBySlug(p.slug)!.title}`, "vocal range"],
  },
  {
    dir: "songs/[slug]",
    terms: (p) => [`sing ${songBySlug(p.slug)!.title}`, "lyrics", "vocal range"],
  },
];

describe("one h1 with the primary term, and an answer under it", () => {
  it.each(TEMPLATES)(
    "$dir, on every generated URL",
    async ({ dir, terms, titleMayMatch }) => {
      const mod = (await import(`@/app/${dir}/page`)) as PageModule;
      const paramsList = mod.generateStaticParams ? mod.generateStaticParams() : [{}];
      expect(paramsList.length).toBeGreaterThan(0);

      for (const params of paramsList) {
        const where = `${dir} ${JSON.stringify(params)}`;
        const html = renderToStaticMarkup(await mod.default({ params: Promise.resolve(params) }));

        const h1s = [...html.matchAll(/<h1\b[^>]*>([\s\S]*?)<\/h1>/gi)].map((m) => text(m[1]));
        expect(h1s, `${where}: h1 count`).toHaveLength(1);
        const h1 = h1s[0];
        for (const term of terms(params)) {
          expect(norm(h1), `${where}: h1 "${h1}" lacks "${term}"`).toContain(norm(term));
        }

        // A human headline, not the title tag pasted in again.
        const meta =
          mod.metadata ?? (await mod.generateMetadata!({ params: Promise.resolve(params) }));
        const title = shippedTitle(meta).replace(/\s*[·|]\s*Suede Sing$/, "");
        if (!titleMayMatch) expect(norm(h1), `${where}: h1 repeats the title`).not.toBe(norm(title));

        // The first paragraph after the h1 is a real sentence that answers.
        const afterH1 = html.slice(html.search(/<h1\b/i));
        const opening = text(afterH1.match(/<p\b[^>]*>([\s\S]*?)<\/p>/i)?.[1] ?? "");
        expect(opening.length, `${where}: opening "${opening}"`).toBeGreaterThanOrEqual(30);
        // A quoted title keeps its own styling ("vampire"); anything else is a
        // sentence and starts with a capital, which the self-check objectives
        // ("compared a quiet recording…") once did not.
        if (!/^[“"]/.test(opening)) {
          expect(opening, `${where}: opening starts lowercase`).toMatch(/^[(]?[\p{Lu}\p{N}]/u);
        }
        expect(opening, `${where}: opening is not a full sentence`).toMatch(/[.?!)”]$/);
      }
    },
    120_000,
  );
});
