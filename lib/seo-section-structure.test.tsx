import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import AtlasPage from "@/app/atlas/page";
import VocalRangeByVoiceTypePage from "@/app/atlas/vocal-range-by-voice-type/page";
import ExtensionPage from "@/app/extension/page";
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
    ["/extension", renderToStaticMarkup(<ExtensionPage />)],
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

/**
 * The FAQ blocks these two pages render used to be description lists. A <dt>
 * is styled like a heading and counts as none, so a page could declare eleven
 * Question nodes in its FAQPage markup and carry zero visible headings for
 * them, leaving every answer inside one undifferentiated passage — 1,176
 * words on the atlas page, against the 375-word ceiling the cohort above
 * holds to.
 *
 * The atlas page is in this cohort rather than the word-count one: its "The
 * short answer" section runs 409 words around the voice-type table, which
 * predates this and is a separate editorial question.
 *
 * Proven non-vacuous: reverting either block to <dl>/<dt>/<dd> fails both
 * assertions below, checked by doing it.
 */
describe("declared questions have visible headings to match", () => {
  const pages: Array<[string, string]> = [
    [
      "/atlas/vocal-range-by-voice-type",
      renderToStaticMarkup(<VocalRangeByVoiceTypePage />),
    ],
    ["/extension", renderToStaticMarkup(<ExtensionPage />)],
  ];

  /** Character entities decoded, case and whitespace flattened. */
  function normalize(value: string) {
    return value
      .replace(/&#x27;|&#39;|&apos;/gi, "'")
      .replace(/&quot;/gi, '"')
      .replace(/&nbsp;/gi, " ")
      .replace(/&amp;/gi, "&")
      .replace(/&rsquo;/gi, "'")
      .replace(/&mdash;/gi, "\u2014")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .toLowerCase();
  }

  function faqQuestions(html: string) {
    const raw = html.match(
      /<script type="application\/ld\+json">([\s\S]*?)<\/script>/,
    )?.[1];
    if (!raw) throw new Error("page emitted no JSON-LD");
    const decoded = raw
      .replace(/&quot;/g, '"')
      .replace(/&#x27;/g, "'")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">");
    const parsed = JSON.parse(decoded) as {
      "@graph": Array<Record<string, unknown>>;
    };
    const faq = parsed["@graph"].find((n) => n["@type"] === "FAQPage") as
      | { mainEntity: Array<{ name: string }> }
      | undefined;
    if (!faq) throw new Error("page emitted no FAQPage");
    return faq.mainEntity.map((q) => q.name);
  }

  for (const [url, html] of pages) {
    it(`renders one heading per FAQPage question on ${url}`, () => {
      const questions = faqQuestions(html);
      expect(questions.length).toBeGreaterThan(0);

      const headings = [
        ...html.matchAll(/<(h[1-6])\b[^>]*>([\s\S]*?)<\/\1>/gi),
      ].map((m) => normalize(m[2]));

      const unheaded = questions.filter((q) => !headings.includes(normalize(q)));
      expect(unheaded, `questions with no heading on ${url}`).toEqual([]);
    });

    it(`does not hide those questions in a description list on ${url}`, () => {
      expect(html).not.toContain("<dt");
    });
  }
});
