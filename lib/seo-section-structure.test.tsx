import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import AtlasPage from "@/app/atlas/page";
import GlossaryPage from "@/app/glossary/page";
import ProPage from "@/app/pro/page";
import GenrePage from "@/app/singers/genre/[genre]/page";
import RecordsPage from "@/app/singers/records/page";
import VoiceTypePage from "@/app/singers/voice-type/[type]/page";

const MAX_SECTION_WORDS = 375;

function visibleWords(html: string) {
  const text = html
    .replace(/<(?:script|style)\b[\s\S]*?<\/(?:script|style)>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&(?:nbsp|amp|quot|apos|#x27|#39);/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
  return text ? text.split(/\s+/) : [];
}

function oversizedHeadingBlocks(html: string) {
  const headings = [...html.matchAll(/<(h[1-6])\b[^>]*>([\s\S]*?)<\/\1>/gi)];

  return headings.flatMap((heading, index) => {
    const start = html.indexOf(">", heading.index ?? 0) + 1;
    const end = headings[index + 1]?.index ?? html.length;
    const words = visibleWords(html.slice(start, end)).length;
    return words > MAX_SECTION_WORDS
      ? [{ heading: visibleWords(heading[2]).join(" "), words }]
      : [];
  });
}

async function renderedAffectedRoutes() {
  const genres = [
    "alternative",
    "country",
    "folk",
    "jazz",
    "pop",
    "randb",
    "rock",
    "singer-songwriter",
    "soul",
  ];
  const voiceTypes = ["baritone", "mezzo-soprano", "soprano", "tenor"];

  return [
    ["/atlas", renderToStaticMarkup(<AtlasPage />)],
    ["/glossary", renderToStaticMarkup(<GlossaryPage />)],
    ["/pro", renderToStaticMarkup(<ProPage />)],
    ["/singers/records", renderToStaticMarkup(<RecordsPage />)],
    ...await Promise.all(
      genres.map(async (genre) => [
        `/singers/genre/${genre}`,
        renderToStaticMarkup(
          await GenrePage({ params: Promise.resolve({ genre }) }),
        ),
      ]),
    ),
    ...await Promise.all(
      voiceTypes.map(async (type) => [
        `/singers/voice-type/${type}`,
        renderToStaticMarkup(
          await VoiceTypePage({ params: Promise.resolve({ type }) }),
        ),
      ]),
    ),
  ] as Array<[string, string]>;
}

describe("former-83 structural retrieval cohort", () => {
  it(
    "keeps every user-visible heading block at or below 375 words",
    async () => {
      const failures = (await renderedAffectedRoutes()).flatMap(([url, html]) =>
        oversizedHeadingBlocks(html).map((block) => ({ url, ...block })),
      );

      expect(failures).toEqual([]);
    },
    30_000,
  );

  it("gives the funding explanation after the plan table its own section", () => {
    const html = renderToStaticMarkup(<ProPage />);

    expect(html).toMatch(
      /<h2[^>]*>Pro is what keeps free free\.<\/h2>/,
    );
  });

  it("subdivides long Atlas chapter indexes into named singer groups", () => {
    const html = renderToStaticMarkup(<AtlasPage />);
    const classicRock = html.match(
      /<h3[^>]*>The classic rock men<\/h3>([\s\S]*?)(?=<h3|<\/ol>)/,
    )?.[1];

    expect(classicRock).toMatch(/<h4[^>]*>Singers [^<]+ through [^<]+<\/h4>/);
  });
});
