import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import LearnPage, { metadata } from "@/app/learn/page";
import sitemap from "@/app/sitemap";
import SiteFooter from "@/components/site-footer";
import { VOICE_TYPES } from "@/lib/audio/notes";
import { SITE_URL } from "@/lib/site";
import {
  parseVoiceCurriculum,
  voiceCurriculum,
  voiceLessonHref,
} from "@/lib/voice-curriculum";

const levels = voiceCurriculum.curriculum.levels;
const modules = levels.flatMap((level) => level.modules);
const lessons = modules.flatMap((module) => module.lessons);
const pageHtml = renderToStaticMarkup(<LearnPage />);

function attributeValues(html: string, attribute: string): string[] {
  return [...html.matchAll(new RegExp(`${attribute}="([^"]+)"`, "g"))].map(
    (match) => match[1],
  );
}

function openingTagsWithAttribute(
  html: string,
  tagName: string,
  attribute: string,
): string[] {
  return [
    ...html.matchAll(
      new RegExp(
        `<${tagName}\\b[^>]*\\b${attribute}="[^"]+"[^>]*>`,
        "g",
      ),
    ),
  ].map((match) => match[0]);
}

describe("the Sing-owned voice curriculum contract", () => {
  it("publishes the decided ownership, classifier, and migration policy", () => {
    expect(voiceCurriculum).toMatchObject({
      contract: "suede-voice-curriculum",
      version: 1,
      ownership: {
        catalogRepository: "JasonColapietro/sing",
        discoveryUrl: "https://sing.suedeai.ai/learn",
        lessonBaseUrl: "https://guitarhub.org/learn/voice",
        decisionDate: "2026-09-14",
        decidedBy: "Jason Colapietro (delegated decision)",
      },
      policies: {
        classifierLabels: [
          "bass",
          "baritone",
          "tenor",
          "contralto",
          "mezzo",
          "soprano",
        ],
        importedSessionCompletion: "historyOnly",
      },
      migration: {
        phase: "discovery",
        redirectsEnabled: false,
        requiredEvidence: [
          "lessonBodies",
          "identity",
          "entitlements",
          "progress",
          "urlParity",
          "vocalReview",
          "deviceAudio",
        ],
      },
    });
  });

  it("carries all seven stages, 34 modules, and 102 unique published lesson previews", () => {
    expect(levels).toHaveLength(7);
    expect(modules).toHaveLength(34);
    expect(lessons).toHaveLength(102);
    expect(new Set(lessons.map(({ id }) => id)).size).toBe(102);
  });

  it("binds the automatic range classifier to exactly the six allowed labels", () => {
    expect(VOICE_TYPES.map(({ id }) => id)).toEqual(
      voiceCurriculum.policies.classifierLabels,
    );
  });

  it("builds current-host URLs only for lessons in the owned catalog", () => {
    expect(voiceLessonHref("v-l1-m1-01")).toBe(
      "https://guitarhub.org/learn/voice/v-l1-m1-01",
    );
    expect(() => voiceLessonHref("made-up-lesson")).toThrow(
      /unknown voice lesson id/i,
    );
  });

  it("rejects a level with no modules before the page can consume it", () => {
    const [firstLevel, ...rest] = levels;
    const levelWithoutModules = {
      id: firstLevel.id,
      name: firstLevel.name,
      subtitle: firstLevel.subtitle,
      access: firstLevel.access,
      moduleCount: firstLevel.moduleCount,
      lessonCount: firstLevel.lessonCount,
      stage: firstLevel.stage,
    };
    const candidate = {
      ...voiceCurriculum,
      curriculum: {
        ...voiceCurriculum.curriculum,
        levels: [levelWithoutModules, ...rest],
      },
    };

    expect(() => parseVoiceCurriculum(candidate)).toThrow(
      /invalid voice curriculum contract/i,
    );
  });

  it("rejects an access value the page cannot label", () => {
    const candidate = {
      ...voiceCurriculum,
      curriculum: {
        ...voiceCurriculum.curriculum,
        levels: [{ ...levels[0], access: "trial" }, ...levels.slice(1)],
      },
    };

    expect(() => parseVoiceCurriculum(candidate)).toThrow(
      /invalid voice curriculum contract/i,
    );
  });

  it("rejects a nonnumeric lesson duration before rendering it", () => {
    const firstLevel = levels[0];
    const firstModule = firstLevel.modules[0];
    const firstLesson = firstModule.lessons[0];
    const candidate = {
      ...voiceCurriculum,
      curriculum: {
        ...voiceCurriculum.curriculum,
        levels: [
          {
            ...firstLevel,
            modules: [
              {
                ...firstModule,
                lessons: [
                  { ...firstLesson, minutes: "four" },
                  ...firstModule.lessons.slice(1),
                ],
              },
              ...firstLevel.modules.slice(1),
            ],
          },
          ...levels.slice(1),
        ],
      },
    };

    expect(() => parseVoiceCurriculum(candidate)).toThrow(
      /invalid voice curriculum contract/i,
    );
  });
});

describe("/learn curriculum discovery", () => {
  it("server-renders one section per stage and one outcome per module", () => {
    const renderedLevelIds = attributeValues(pageHtml, "data-curriculum-level");
    const renderedModuleIds = attributeValues(pageHtml, "data-curriculum-module");
    const renderedOutcomes = attributeValues(pageHtml, "data-module-outcome");

    expect(renderedLevelIds).toEqual(levels.map(({ id }) => id));
    expect(renderedModuleIds).toEqual(modules.map(({ id }) => id));
    expect(renderedOutcomes).toHaveLength(34);
    for (const outcome of modules.map(({ promise }) => promise)) {
      expect(pageHtml).toContain(outcome);
    }
  });

  it("renders all 102 actual lesson links exactly once", () => {
    const lessonHrefs = attributeValues(pageHtml, "data-lesson-href");

    expect(lessonHrefs).toHaveLength(102);
    expect(new Set(lessonHrefs).size).toBe(102);
    expect(new Set(lessonHrefs)).toEqual(
      new Set(lessons.map(({ id }) => voiceLessonHref(id))),
    );
  });

  it("reports published lesson records rather than extrapolated lesson totals", () => {
    const rendered = openingTagsWithAttribute(
      pageHtml,
      "section",
      "data-curriculum-level",
    ).map((tag) => [
      attributeValues(tag, "data-curriculum-level")[0],
      Number(attributeValues(tag, "data-published-lessons")[0]),
    ]);

    expect(rendered).toEqual(
      levels.map((level) => [
        level.id,
        level.modules.reduce(
          (count, module) => count + module.lessons.length,
          0,
        ),
      ]),
    );
    expect(pageHtml).toMatch(/102 published lesson links/i);
    expect(pageHtml).not.toMatch(/237 complete lessons/i);
  });

  it("labels access from each level rather than from lesson position", () => {
    const rendered = openingTagsWithAttribute(
      pageHtml,
      "section",
      "data-curriculum-level",
    ).map((tag) => [
      attributeValues(tag, "data-curriculum-level")[0],
      attributeValues(tag, "data-access")[0],
    ]);

    expect(rendered).toEqual(levels.map(({ id, access }) => [id, access]));
    expect(rendered.filter(([, access]) => access === "free")).toHaveLength(2);
    expect(rendered.filter(([, access]) => access === "paid")).toHaveLength(5);
  });

  it("uses valid native disclosures with a visible browser indicator", () => {
    const summaries = [...pageHtml.matchAll(
      /<summary\b([^>]*)>([\s\S]*?)<\/summary>/g,
    )];

    expect(summaries).toHaveLength(34);
    for (const [, attributes, contents] of summaries) {
      expect(attributes).not.toMatch(/(?:list-none|marker:content-none)/);
      expect(contents).not.toMatch(/<(?:div|h[1-6]|p)\b/);
    }
  });

  it("states the temporary host, retained access boundary, and vocal-safety limits", () => {
    expect(pageHtml).toMatch(/GuitarHub[^<]*temporar/i);
    expect(pageHtml).toMatch(/access[^<]*(?:remain|stay)[^<]*GuitarHub/i);
    expect(pageHtml).toMatch(/comfortable range and volume/i);
    expect(pageHtml).toMatch(/stop[^<]*(?:pain|hoarseness)/i);
    expect(pageHtml).toMatch(/pitch readings do not assess vocal health/i);
  });

  it("links learners back to Sing practice rooms", () => {
    for (const href of ["/range", "/warmups", "/breath", "/ear-training"]) {
      expect(pageHtml).toContain(`href="${href}"`);
    }
  });

  it("owns its canonical, appears once in the sitemap, and has a footer link", () => {
    expect(metadata.alternates?.canonical).toBe(`${SITE_URL}/learn`);
    expect(
      sitemap().filter(({ url }) => url === `${SITE_URL}/learn`),
    ).toHaveLength(1);

    const footerHtml = renderToStaticMarkup(<SiteFooter />);
    expect(footerHtml).toMatch(/href="\/learn"[^>]*>Voice curriculum</);
  });
});
