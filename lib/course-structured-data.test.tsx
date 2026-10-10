/**
 * Structured data on the voice course's stage and module pages.
 *
 * Lesson pages always emitted a BreadcrumbList for the trail they render, but
 * the 7 stage and 34 module pages above them, every one indexable and in the
 * sitemap, rendered the same visible breadcrumb nav with no structured data
 * at all. These checks keep the markup tied to what a reader sees: the list
 * names the same pages, in the same order, as the nav.
 */
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import StagePage from "@/app/learn/voice/[stage]/page";
import ModulePage from "@/app/learn/voice/[stage]/[module]/page";
import LessonPage from "@/app/learn/voice/[stage]/[module]/[lesson]/page";
import { ORG_NAME } from "@/lib/organization";
import { SITE_URL } from "@/lib/site";
import { COURSE } from "@/lib/voice-lessons";
import { LESSONS } from "@/lib/lesson-data";

type Node = Record<string, unknown>;

function decode(s: string): string {
  return s
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&");
}

function nodes(html: string): Node[] {
  const out: Node[] = [];
  const walk = (v: unknown) => {
    if (Array.isArray(v)) v.forEach(walk);
    else if (v && typeof v === "object") {
      out.push(v as Node);
      Object.values(v).forEach(walk);
    }
  };
  for (const m of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
    walk(JSON.parse(decode(m[1])));
  }
  return out;
}

/** The hrefs of the visible breadcrumb nav, plus the current page. */
function visibleTrail(html: string): string[] {
  const nav = html.match(/<nav aria-label="Breadcrumb"[\s\S]*?<\/nav>/)?.[0] ?? "";
  return [...nav.matchAll(/href="([^"]+)"/g)].map((m) => m[1]);
}

function breadcrumbItems(html: string): string[] {
  const list = nodes(html).find((n) => n["@type"] === "BreadcrumbList");
  expect(list, "BreadcrumbList").toBeDefined();
  return (list!.itemListElement as Node[]).map((i) => String(i.item));
}

const stages = COURSE.filter((s) => s.slug);
const modules = stages.flatMap((s) => s.modules.filter((m) => m.slug).map((m) => ({ s, m })));

describe("voice course stage pages", () => {
  it.each(stages.map((s) => [s.slug!, s] as const))("%s marks up its visible trail", async (slug, stage) => {
    const html = renderToStaticMarkup(await StagePage({ params: Promise.resolve({ stage: slug }) }));
    const items = breadcrumbItems(html);
    expect(items.slice(0, -1)).toEqual(visibleTrail(html).map((h) => `${SITE_URL}${h}`));
    expect(items.at(-1)).toBe(`${SITE_URL}${stage.href}`);
    const page = nodes(html).find((n) => n["@type"] === "CollectionPage");
    expect(page?.url).toBe(`${SITE_URL}${stage.href}`);
  });
});

describe("voice course module pages", () => {
  it.each(modules.map(({ s, m }) => [`${s.slug}/${m.slug}`, s, m] as const))(
    "%s marks up its visible trail",
    async (_, stage, module) => {
      const html = renderToStaticMarkup(
        await ModulePage({ params: Promise.resolve({ stage: stage.slug!, module: module.slug! }) }),
      );
      const items = breadcrumbItems(html);
      expect(items.slice(0, -1)).toEqual(visibleTrail(html).map((h) => `${SITE_URL}${h}`));
      expect(items.at(-1)).toBe(`${SITE_URL}${module.href}`);
    },
  );
});

describe("voice course lesson pages", () => {
  it("define the publisher they name, rather than pointing at an undefined @id", async () => {
    const l = LESSONS[0];
    const html = renderToStaticMarkup(
      await LessonPage({
        params: Promise.resolve({ stage: l.stageSlug, module: l.moduleSlug, lesson: l.slug }),
      }),
    );
    const resource = nodes(html).find((n) => n["@type"] === "LearningResource");
    expect((resource?.publisher as Node | undefined)?.name).toBe(ORG_NAME);
  });
});
