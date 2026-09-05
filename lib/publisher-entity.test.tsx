/**
 * One publisher, spelled one way, readable on the page that names it.
 *
 * Two defects sat behind this file. The first: three pages wrote the
 * Organization out by hand under the identical `@id`, and two of them called
 * it "Suede Labs" while the third called it "Suede Labs AI". A consumer that
 * resolved the entity from the home page held a different name than one that
 * resolved it from /voice, for the same node. The second: every other page
 * pointed `publisher` at that `@id` without ever defining it, so a crawler
 * reading a singer page or a tool room on its own — the ordinary case, since
 * nothing fetches suedeai.ai to expand a fragment — got a pointer where a
 * publisher name and logo should have been. That covered the singer and atlas
 * templates, roughly 670 sitemap URLs.
 *
 * Proven non-vacuous, each by doing it:
 *   - changing ORG_NAME to "Suede Labs" fails the literal check below;
 *   - dropping any page's node back to `{ "@id": ORG_ID }` fails the
 *     per-page check;
 *   - giving one page a node with a different name fails both.
 */
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import AtlasPage from "@/app/atlas/page";
import VocalRangeByVoiceTypePage from "@/app/atlas/vocal-range-by-voice-type/page";
import BookPage from "@/app/book/page";
import CanYouSingHub from "@/app/can-you-sing/page";
import ExtensionPage from "@/app/extension/page";
import GlossaryPage from "@/app/glossary/page";
import Home from "@/app/page";
import ProPage from "@/app/pro/page";
import RecorderPage from "@/app/recorder/page";
import SingersPage from "@/app/singers/page";
import SongsPage from "@/app/songs/page";
import ToolsPage from "@/app/tools/page";
import VoicePage from "@/app/voice/page";
import { ORG_ID, ORG_NAME, ORG_PUBLISHER_NODE } from "./organization";

/**
 * The literal, written out rather than imported, so that renaming the constant
 * is a test failure rather than a silent rename of the estate's publisher.
 * "Suede Labs AI" is what suedeai.ai's own canonical node carries.
 */
const CANONICAL_NAME = "Suede Labs AI";

const ROUTES: Array<[string, string]> = [
  ["/", renderToStaticMarkup(<Home />)],
  ["/atlas", renderToStaticMarkup(<AtlasPage />)],
  [
    "/atlas/vocal-range-by-voice-type",
    renderToStaticMarkup(<VocalRangeByVoiceTypePage />),
  ],
  ["/book", renderToStaticMarkup(<BookPage />)],
  ["/can-you-sing", renderToStaticMarkup(<CanYouSingHub />)],
  ["/extension", renderToStaticMarkup(<ExtensionPage />)],
  ["/glossary", renderToStaticMarkup(<GlossaryPage />)],
  ["/pro", renderToStaticMarkup(<ProPage />)],
  ["/recorder", renderToStaticMarkup(<RecorderPage />)],
  ["/singers", renderToStaticMarkup(<SingersPage />)],
  ["/songs", renderToStaticMarkup(<SongsPage />)],
  ["/tools", renderToStaticMarkup(<ToolsPage />)],
  ["/voice", renderToStaticMarkup(<VoicePage />)],
];

/** Every ld+json payload in a rendered page, decoded and parsed. */
function structuredData(html: string) {
  return [
    ...html.matchAll(
      /<script type="application\/ld\+json">([\s\S]*?)<\/script>/g,
    ),
  ].map((match) =>
    JSON.parse(
      match[1]
        .replace(/&quot;/g, '"')
        .replace(/&#x27;/g, "'")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&amp;/g, "&"),
    ),
  );
}

/** Flattens a payload to the nodes it declares, @graph or single node. */
function nodesOf(payload: unknown): Array<Record<string, unknown>> {
  const value = payload as Record<string, unknown>;
  const graph = value["@graph"];
  const top = Array.isArray(graph)
    ? (graph as Array<Record<string, unknown>>)
    : [value];

  // publisher and author are attached inline on the pages that emit a single
  // Book or DefinedTermSet rather than a graph, so walk one level in.
  return top.flatMap((node) => [
    node,
    ...Object.values(node).filter(
      (child): child is Record<string, unknown> =>
        typeof child === "object" && child !== null && !Array.isArray(child),
    ),
  ]);
}

describe("the publisher entity", () => {
  it("is named the same thing the canonical node on suedeai.ai is named", () => {
    expect(ORG_NAME).toBe(CANONICAL_NAME);
    expect(ORG_PUBLISHER_NODE.name).toBe(CANONICAL_NAME);
    expect(ORG_PUBLISHER_NODE["@id"]).toBe(ORG_ID);
    // A publisher with no logo is why the minimal node exists at all.
    expect(ORG_PUBLISHER_NODE.logo).toMatch(/^https:\/\//);
  });

  for (const [url, html] of ROUTES) {
    it(`resolves to a named Organization on ${url}`, () => {
      const nodes = structuredData(html).flatMap(nodesOf);
      const orgs = nodes.filter(
        (node) =>
          node["@type"] === "Organization" && node["@id"] === ORG_ID,
      );

      expect(
        orgs.length,
        `${url} points publisher at ${ORG_ID} but defines no such node`,
      ).toBeGreaterThan(0);

      const wrongName = orgs
        .map((node) => node.name)
        .filter((name) => name !== CANONICAL_NAME);
      expect(
        wrongName,
        `${url} gives ${ORG_ID} a name the rest of the estate does not use`,
      ).toEqual([]);
    });
  }
});
