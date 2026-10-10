/**
 * Answer-first shape and claim discipline for the tool guides.
 *
 * Each practice room renders one of these under the tool: an H2, a direct
 * answer, then everything else. Answer engines lift that pair, so the H2 is a
 * question a person would ask and the answer resolves it in two or three
 * sentences. The WebPage node is named from `pageName`, so a guide whose H2 is
 * a question must carry a page name or the page would be named after a
 * question.
 */
import { describe, expect, it } from "vitest";
import * as guides from "./guides";
import { TOOL_GUIDES } from "./guides";
import { guideJsonLd, type GuideContent } from "@/components/guide";

const exported = Object.entries(guides).filter(
  (entry): entry is [string, GuideContent] => entry[0].endsWith("_GUIDE"),
);

const sentences = (text: string) => text.split(/(?<=[.!?])\s+/).filter(Boolean);
const words = (text: string) => text.split(/\s+/).filter(Boolean).length;

describe("TOOL_GUIDES", () => {
  it("lists every exported guide exactly once", () => {
    expect(exported.length).toBeGreaterThan(5);
    expect(new Set(TOOL_GUIDES)).toEqual(new Set(exported.map(([, g]) => g)));
    expect(TOOL_GUIDES).toHaveLength(exported.length);
  });

  it("gives each guide its own route", () => {
    const paths = TOOL_GUIDES.map((g) => g.path);
    expect(new Set(paths).size).toBe(paths.length);
  });
});

describe.each(TOOL_GUIDES.map((g) => [g.path, g] as const))("%s guide", (_, guide) => {
  it("asks a question in its H2", () => {
    expect(guide.heading.endsWith("?")).toBe(true);
    expect(guide.heading.split("?")).toHaveLength(2);
  });

  it("names the WebPage after the page, not the question", () => {
    expect(guide.pageName).toBeTruthy();
    expect(guide.pageName).not.toMatch(/\?$/);
    const page = guideJsonLd(guide)["@graph"].find((n) => n["@type"] === "WebPage");
    expect(page?.name).toBe(guide.pageName);
  });

  it("answers first, briefly", () => {
    const answer = sentences(guide.answer);
    expect(answer.length).toBeGreaterThanOrEqual(1);
    expect(answer.length).toBeLessThanOrEqual(3);
    expect(words(answer[0])).toBeLessThanOrEqual(40);
    expect(words(guide.answer)).toBeLessThanOrEqual(70);
  });

  it("phrases every FAQ entry as a question", () => {
    for (const item of guide.faq) expect(item.q.endsWith("?")).toBe(true);
  });

  /**
   * The repo's evidence rules: no superlatives or exclusivity claims, no
   * perceptual thresholds or durations stated as fact without a source, no
   * accuracy promises. Each pattern is a phrase these guides used to contain.
   */
  it("makes no unsourced superlative, threshold or accuracy claim", () => {
    const copy = JSON.stringify(guide);
    for (const banned of [
      /\bthe fastest\b/i,
      /\bthe only reliable\b/i,
      /\bsingle most useful\b/i,
      /\bcheapest injury prevention\b/i,
      /inaudible to most listeners/i,
      /audible to most listeners/i,
      /\bmore accurately\b/i,
      /covers essentially all repertoire/i,
      /several times faster/i,
      /directly produces better/i,
      /what every professional does/i,
      /studies show/i,
      /\bunlimited\b/i,
    ]) {
      expect(copy, String(banned)).not.toMatch(banned);
    }
  });
});

describe("range guide", () => {
  it("keeps range a session measurement and voice type an estimate", () => {
    const copy = JSON.stringify(guides.RANGE_GUIDE);
    expect(guides.RANGE_GUIDE.answer).toMatch(/in that session/);
    expect(guides.RANGE_GUIDE.answer).toMatch(/an estimate of the voice type/);
    expect(copy).toContain("Is my vocal range the same as my voice type?");
  });
});

describe("analyze guide", () => {
  it("states the cycle-dose arithmetic correctly", () => {
    // Cycles = frequency x voiced seconds. A4 = 440 Hz, A2 = 110 Hz.
    const body = guides.ANALYZE_GUIDE.body.join(" ");
    expect(body).toContain(`${(440 * 3600).toLocaleString("en-US")} cycles`);
    expect(body).toContain(`${(110 * 3600).toLocaleString("en-US")}`);
    expect(body).toMatch(/four times/);
  });
});
