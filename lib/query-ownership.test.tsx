/**
 * Binds `lib/query-ownership.ts` to the pages it records decisions about.
 *
 * Assertions run against `renderToStaticMarkup` output, which is the HTML a
 * crawler sees, for the same reason `lib/internal-linking.test.tsx` does: a
 * scope line or a cross-link that only appears after hydration does not exist as
 * far as this work is concerned.
 *
 * Cross-links are also checked in each page's own source. Several of these pages
 * render `RoomRailBand`, which links every room from every room, so a
 * rendered-HTML check alone would pass no matter what the page itself said.
 * Proven non-vacuous: each assertion below was watched failing with the fix
 * reverted, one at a time.
 */
import { readFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import AnalyzePage, { metadata as analyzeMetadata } from "@/app/analyze/page";
import AtlasPage, { metadata as atlasMetadata } from "@/app/atlas/page";
import RangePage, { metadata as rangeMetadata } from "@/app/range/page";
import RecorderPage, { metadata as recorderMetadata } from "@/app/recorder/page";
import SingersPage, { metadata as singersMetadata } from "@/app/singers/page";
import ToolsPage, { metadata as toolsMetadata } from "@/app/tools/page";
import VoicePage, { metadata as voiceMetadata } from "@/app/voice/page";
import { QUERY_OWNERSHIP } from "@/lib/query-ownership";

const PAGES: Record<string, { render: () => string; description: string; title: string; file: string }> = {
  "/analyze": page(AnalyzePage, analyzeMetadata, "app/analyze/page.tsx"),
  "/atlas": page(AtlasPage, atlasMetadata, "app/atlas/page.tsx"),
  "/range": page(RangePage, rangeMetadata, "app/range/page.tsx"),
  "/recorder": page(RecorderPage, recorderMetadata, "app/recorder/page.tsx"),
  "/singers": page(SingersPage, singersMetadata, "app/singers/page.tsx"),
  "/tools": page(ToolsPage, toolsMetadata, "app/tools/page.tsx"),
  "/voice": page(VoicePage, voiceMetadata, "app/voice/page.tsx"),
};

type AnyMetadata = { title?: unknown; description?: unknown };

function page(Component: () => React.ReactNode, metadata: AnyMetadata, file: string) {
  const title = metadata.title;
  return {
    render: () => renderToStaticMarkup(<Component />),
    description: String(metadata.description ?? ""),
    title:
      typeof title === "string"
        ? title
        : String((title as { absolute?: string } | undefined)?.absolute ?? ""),
    file,
  };
}

/** Rendered HTML with tags stripped, so a sentence broken across elements by
 *  JSX whitespace is still one sentence to match against. */
function visibleText(href: string): string {
  const entry = PAGES[href];
  expect(entry, `${href} must be covered by this test`).toBeTruthy();
  return entry
    .render()
    .replace(/<(?:script|style)\b[\s\S]*?<\/(?:script|style)>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&#x27;|&apos;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ");
}

describe("every page in the query-ownership register is covered and renders", () => {
  it("renders real content for each recorded page", () => {
    for (const cluster of QUERY_OWNERSHIP) {
      for (const { href } of cluster.pages) {
        expect(visibleText(href).length, href).toBeGreaterThan(500);
      }
    }
  });
});

describe("a differentiated page tells the reader which question it answers", () => {
  it("prints the scope line recorded for it", () => {
    for (const cluster of QUERY_OWNERSHIP) {
      if (cluster.decision !== "differentiate") continue;
      for (const { href, scopeLine } of cluster.pages) {
        expect(
          visibleText(href),
          `${href} must print the scope line recorded in the register`,
        ).toContain(scopeLine);
      }
    }
  });
});

describe("a differentiated split is navigable in both directions", () => {
  it("links the anchor to every sibling and every sibling back to the anchor", () => {
    for (const cluster of QUERY_OWNERSHIP) {
      if (cluster.decision !== "differentiate") continue;
      const [anchor, ...rest] = cluster.pages;

      for (const sibling of rest) {
        for (const [from, to] of [
          [anchor.href, sibling.href],
          [sibling.href, anchor.href],
        ]) {
          // The path as a string literal, not `href="..."`: /tools builds its
          // two room cards from an array, so the link is authored as
          // `href: "/recorder"` and only becomes an attribute on render.
          const source = readFileSync(PAGES[from].file, "utf8");
          expect(source, `${from} must name ${to} in its own copy`).toContain(`"${to}"`);
          expect(PAGES[from].render(), `${from} must render its link to ${to}`).toContain(
            `href="${to}"`,
          );
        }
      }
    }
  });
});

describe("a differentiated pair carries metadata that cannot be swapped", () => {
  it("gives each page its own distinguishing phrase and denies it to its siblings", () => {
    for (const cluster of QUERY_OWNERSHIP) {
      for (const owned of cluster.pages) {
        expect(
          PAGES[owned.href].description,
          `${owned.href} must carry "${owned.descriptionMark}"`,
        ).toContain(owned.descriptionMark);

        for (const sibling of cluster.pages) {
          if (sibling.href === owned.href) continue;
          expect(PAGES[sibling.href].title, `${sibling.href} shares a title with ${owned.href}`)
            .not.toEqual(PAGES[owned.href].title);
          expect(
            PAGES[sibling.href].description,
            `${sibling.href} shares a description with ${owned.href}`,
          ).not.toEqual(PAGES[owned.href].description);
          expect(
            PAGES[sibling.href].description,
            `"${owned.descriptionMark}" is what separates ${owned.href} from ${sibling.href}`,
          ).not.toContain(owned.descriptionMark);
        }
      }
    }
  });
});

describe("a consolidated URL keeps answering", () => {
  it("carries a permanent redirect and leaves the sitemap", async () => {
    const consolidations = QUERY_OWNERSHIP.filter((c) => c.decision === "consolidate");
    if (consolidations.length === 0) return;

    const { default: nextConfig } = await import("@/next.config");
    const redirects = (await nextConfig.redirects?.()) ?? [];
    const { default: sitemap } = await import("@/app/sitemap");
    const urls = new Set(sitemap().map((entry) => String(entry.url)));

    for (const cluster of consolidations) {
      expect(cluster.retired, `${cluster.id} must name the retired URL`).toBeTruthy();
      const retired = cluster.retired!;
      const redirect = redirects.find((entry) => entry.source === retired);
      expect(redirect, `${retired} needs a redirect in next.config.ts`).toBeTruthy();
      expect(redirect!.permanent, `${retired} must be a 308`).toBe(true);
      expect(redirect!.destination).toBe(cluster.pages[0].href);
      for (const url of urls) {
        expect(url.endsWith(retired), `${retired} redirects and must leave the sitemap`).toBe(false);
      }
    }
  });
});
