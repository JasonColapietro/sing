import { describe, expect, it } from "vitest";

import { VOICE_TYPES } from "@/lib/audio/notes";
import {
  parseVoiceCurriculum,
  voiceCurriculum,
  voiceLessonHref,
} from "@/lib/voice-curriculum";

const levels = voiceCurriculum.curriculum.levels;
const modules = levels.flatMap((level) => level.modules);
const lessons = modules.flatMap((module) => module.lessons);

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
