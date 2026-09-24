/**
 * Holds the voice lessons to what sing can measure, and to the links sing can
 * honour. Modelled on programme-exit-tests.test.tsx, which applies the same
 * discipline to the book's twelve-week programme.
 *
 * The lessons were written for GuitarHub against an idea of this app, and the
 * suede-vocal contract exists because some of their promises (a strain-free
 * verdict, a vibrato rate, a passaggio from a range scan, a held harmony
 * against a lead) rest on measurements no Suede surface takes. Now that sing
 * hosts the lessons, a claim like that would be sing promising something about
 * itself that isn't true. So:
 *
 *   - every module's basis is looked up in the contract: `measured` must be a
 *     `measurable: "yes"` row and `selfCheck` must name a row that isn't;
 *   - every unsupported claim the contract lists has a pattern here, and no
 *     text that promises something (title, outcome, objective, a step's
 *     title and checks, criteria, "what this shows") may match one. The "what this does not
 *     show" field is exempt: naming the limit is the point of it;
 *   - every link goes to a room and parameter the contract publishes, stays
 *     relative, and never deep-links a Pro exercise from these free pages.
 */
import { spawnSync } from "node:child_process";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
import { buildContract } from "@/contracts/suede-vocal";
import sitemap from "@/app/sitemap";
import VoiceCoursePage from "@/app/learn/voice/page";
import LessonPage from "@/app/learn/voice/[stage]/[module]/[lesson]/page";
import ModulePage from "@/app/learn/voice/[stage]/[module]/page";
import StagePage from "@/app/learn/voice/[stage]/page";
import { TOLERANCE_CENTS } from "@/components/songs/lib";
import { EXERCISES } from "@/components/warmups/exercises";
import { MEASUREMENT_WORDS } from "@/components/learn/module-practice";
import { LESSONS, type Lesson } from "@/lib/lesson-data";
import {
  MODULE_PRACTICE,
  ROOM_PATHS,
  companionHref,
  moduleMaterial,
  practiceMatch,
} from "@/lib/lesson-practice";
import { SITE_URL } from "@/lib/site";
import { voiceCurriculum } from "@/lib/voice-curriculum";
import {
  COURSE,
  VOICE_LEARN_PATH,
  coursePaths,
  lessonHref,
} from "@/lib/voice-lessons";

const contract = buildContract();
const measurements = contract.measurement as unknown as Record<string, { measurable: string }>;
const rooms = contract.deepLinks.rooms as Record<string, { path: string; params: string[] }>;
const modules = voiceCurriculum.curriculum.levels.flatMap((l) => l.modules);
const catalogLessons = new Map(
  modules.flatMap((m) => m.lessons.map((l) => [l.id, { lesson: l, module: m }] as const)),
);

/**
 * One pattern per claim in the contract's `unsupportedClaims`. Each matches the
 * claim made as a promise; a new contract entry without a pattern fails below.
 */
const CLAIM_PATTERNS: Record<string, RegExp> = {
  "flow-consistency": /\b(?:air)?flow\b[^.]{0,40}\b(?:steady|steadiness|consistent|consistency|even)\b|\b(?:steady|consistent|even)\s+(?:air)?flow\b/i,
  "pitch-steadiness-in-breath-room": /\bbreath room\b[^.]{0,80}\b(?:pitch|cents|in tune)\b|\b(?:pitch|cents)\b[^.]{0,80}\bbreath room\b/i,
  "personal-passaggio-from-range-scan": /\bpassaggio\b[^.]{0,80}\b(?:range (?:scan|test)|scan)\b|\b(?:range (?:scan|test)|scan)\b[^.]{0,80}\bpassaggio\b/i,
  "strain-free-verdict": /\bstrain[- ]free\b|\b(?:no|without|free (?:of|from)|absence of)\s+strain\b/i,
  "vibrato-rate-on-cue": /\bvibrato (?:rate|speed)\b|\bhertz\b|\b\d+\s?Hz\b|\bfive[- ]to[- ]seven\b/i,
  "held-harmony-against-a-lead": /\bheld harmony\b|\bharmony\b[^.]{0,40}\b(?:against|over|with) (?:the |a )?lead\b|\bthe harmony (?:keeps|holds|stays)\b/i,
};

/** Every piece of lesson text that promises something, labelled for the failure message. */
function promisingText(lesson: Lesson): Array<[string, string]> {
  const { lesson: cat, module } = catalogLessons.get(lesson.id)!;
  return [
    ["catalog title", cat.title],
    ["catalog summary", cat.summary],
    ["module outcome", module.promise],
    ["module skill", module.skill],
    ["objective", lesson.objective],
    // A step's body is an instruction ("hold with steady airflow"), which is
    // practice, not a promise, so only its title and its checks are read.
    ...lesson.steps.flatMap((s): Array<[string, string]> => [
      [`step "${s.title}"`, s.title],
      [`step "${s.title}" look`, s.look],
      [`step "${s.title}" listen`, s.listen],
    ]),
    ...lesson.selfCheck.criteria.map((c): [string, string] => ["criterion", c]),
    ["ready when", lesson.selfCheck.readyWhen],
    ["what this shows", lesson.selfCheck.shows],
  ];
}

function hrefs(html: string): string[] {
  return [...html.matchAll(/href="([^"]+)"/g)].map((m) => m[1].replace(/&amp;/g, "&"));
}

describe("the lesson data", () => {
  it("is compiled from content/lessons and not stale", () => {
    const run = spawnSync(process.execPath, ["scripts/compile-lessons.mjs", "--check"], {
      encoding: "utf8",
    });
    expect(run.status, run.stdout + run.stderr).toBe(0);
  });

  it("keys every lesson to the catalog, with the catalog's title, type and length", () => {
    expect(LESSONS.length).toBeGreaterThan(0);
    for (const lesson of LESSONS) {
      const entry = catalogLessons.get(lesson.id);
      expect(entry, `${lesson.id} is not in the catalog`).toBeTruthy();
      expect(lesson.moduleId).toBe(entry!.module.id);
      expect(lesson.title).toBe(entry!.lesson.title);
      expect(lesson.type).toBe(entry!.lesson.type);
      expect(lesson.minutes).toBe(entry!.lesson.minutes);
      expect(lesson.blocks.reduce((n, b) => n + b.seconds, 0)).toBe(lesson.minutes * 60);
    }
  });

  /**
   * The objective is the page's subtitle and its search description, so it has
   * to say what the catalog says. Three lessons were authored on GuitarHub with
   * a different objective from their catalog summary, and neither text is
   * wrong, so they are named rather than rewritten.
   */
  it("states the catalog's summary as the lesson objective", () => {
    const authoredApart = new Set(["v-l1-m3-02", "v-l3-m5-07", "v-l6-m5-01"]);
    for (const lesson of LESSONS) {
      if (authoredApart.has(lesson.id)) continue;
      expect(lesson.objective, lesson.id).toBe(catalogLessons.get(lesson.id)!.lesson.summary);
    }
  });

  it("serves every lesson in the catalog, and publishes where each one lives", async () => {
    expect(LESSONS.map((l) => l.id).sort()).toEqual([...catalogLessons.keys()].sort());
    const { default: urls } = await import("@/contracts/suede-voice-lesson-urls.json");
    for (const lesson of LESSONS) {
      expect((urls.lessons as Record<string, string>)[lesson.id]).toBe(lessonHref(lesson));
    }
    expect(Object.keys(urls.modules)).toHaveLength(modules.length);
    expect(Object.keys(urls.stages)).toHaveLength(voiceCurriculum.curriculum.levels.length);
  });

  it("gives every lesson a unique URL", () => {
    const urls = LESSONS.map(lessonHref);
    expect(new Set(urls).size).toBe(urls.length);
    for (const url of urls) expect(url).toMatch(/^\/learn\/voice\/[a-z0-9-]+\/[a-z0-9-]+\/[a-z0-9-]+$/);
  });

  it("ports whole modules, so no module page lists a lesson it can't open", () => {
    for (const stage of COURSE) {
      for (const mod of stage.modules) {
        const ported = mod.lessons.filter((l) => l.body).length;
        expect([0, mod.lessons.length], mod.catalog.id).toContain(ported);
      }
    }
  });

  it("carries no GuitarHub panel wording", () => {
    for (const lesson of LESSONS) {
      const text = JSON.stringify(lesson);
      expect(text, lesson.id).not.toMatch(/Practice material|no separate purchase|GuitarHub|Guitar track|native study/);
    }
  });
});

describe("what a module says sing measures", () => {
  it("covers every module in the catalog", () => {
    expect(Object.keys(MODULE_PRACTICE).sort()).toEqual(modules.map((m) => m.id).sort());
  });

  /** The load-bearing one: a lesson may only promise proof a "yes" row supplies. */
  it("rests a measured module only on a measurement this app implements", () => {
    for (const [id, practice] of Object.entries(MODULE_PRACTICE)) {
      const { basis } = practice;
      if (basis.kind === "measured") {
        const row = measurements[basis.measurement];
        expect(row, `${id} rests on unknown measurement ${basis.measurement}`).toBeTruthy();
        expect(row.measurable, `${id} rests on ${basis.measurement}`).toBe("yes");
        expect(MEASUREMENT_WORDS[basis.measurement], `${id}: no wording for ${basis.measurement}`).toBeTruthy();
      } else {
        const row = measurements[basis.missing];
        expect(row, `${id} names unknown measurement ${basis.missing}`).toBeTruthy();
        expect(row.measurable, `${id} calls ${basis.missing} missing`).not.toBe("yes");
        expect(basis.showsInstead.length).toBeGreaterThan(40);
      }
    }
  });

  it("only describes measurements the contract reports as implemented", () => {
    for (const key of Object.keys(MEASUREMENT_WORDS)) {
      expect(measurements[key]?.measurable, key).toBe("yes");
    }
  });

  it("states the tolerance sing scores against, not GuitarHub's", () => {
    for (const key of ["centsFromTarget", "inTuneHoldTime", "scorePercent"]) {
      expect(MEASUREMENT_WORDS[key]).toContain(`${TOLERANCE_CENTS} cents`);
    }
    expect(contract.knownDivergences.pitchToleranceCents.surfaces.singWeb).toBe(TOLERANCE_CENTS);
  });
});

describe("the lessons make no claim sing can't keep", () => {
  it("has a pattern for every unsupported claim in the contract", () => {
    expect(Object.keys(CLAIM_PATTERNS).sort()).toEqual(
      Object.keys(contract.unsupportedClaims).sort(),
    );
  });

  /**
   * A sentence that names the claim after a negation ("Nothing measures
   * vibrato rate yet") is stating the limit, not making the promise. A
   * negation that is part of the claim itself ("without strain") comes at or
   * after the match, so it still counts.
   */
  const NEGATION = /\b(?:not|no|nothing|never|cannot|can't|doesn't|isn't|aren't)\b/i;

  it("catches each claim as a promise and lets its disclaimer through", () => {
    const promises: Record<string, string> = {
      "flow-consistency": "Your airflow stays steady for twelve seconds.",
      "pitch-steadiness-in-breath-room": "The breath room reads how steady your pitch stays.",
      "personal-passaggio-from-range-scan": "Your range scan gives both passaggio pitches.",
      "strain-free-verdict": "Hold the belt for six seconds without strain.",
      "vibrato-rate-on-cue": "Switch to a vibrato rate of 5 Hz on cue.",
      "held-harmony-against-a-lead": "Sing a held harmony against the lead.",
    };
    for (const [claim, text] of Object.entries(promises)) {
      const m = CLAIM_PATTERNS[claim].exec(text);
      expect(m, claim).toBeTruthy();
      expect(NEGATION.test(text.slice(0, m!.index)), claim).toBe(false);
    }
    // GuitarHub's wording for the performance module, before it was reworded here.
    expect(CLAIM_PATTERNS["held-harmony-against-a-lead"].test("On playback, the harmony keeps its own contour.")).toBe(true);
    const disclaimer = "Nothing measures vibrato rate yet, so this one is your ear.";
    const m = CLAIM_PATTERNS["vibrato-rate-on-cue"].exec(disclaimer);
    expect(NEGATION.test(disclaimer.slice(0, m!.index))).toBe(true);
  });

  it("promises none of them in a ported lesson", () => {
    const hits: string[] = [];
    for (const lesson of LESSONS) {
      for (const [field, text] of promisingText(lesson)) {
        for (const sentence of text.split(/(?<=[.!?])\s+/)) {
          for (const [claim, pattern] of Object.entries(CLAIM_PATTERNS)) {
            const m = pattern.exec(sentence);
            if (m && !NEGATION.test(sentence.slice(0, m.index))) {
              hits.push(`${lesson.id} ${field}: ${claim} ("${m[0]}")`);
            }
          }
        }
      }
    }
    expect(hits).toEqual([]);
  });

  /**
   * Every voice self-check is a self-report: none produces a measured pass.
   * "Checkpoint" reads as a gate, so a ported lesson uses "Self-Check" instead.
   */
  it("calls a self-report a self-check, not a checkpoint", () => {
    for (const lesson of LESSONS) {
      expect(lesson.title, lesson.id).not.toMatch(/^Checkpoint\b/);
    }
  });
});

describe("links from the lessons", () => {
  it("restates the contract's room paths exactly", () => {
    expect(ROOM_PATHS).toEqual(
      Object.fromEntries(Object.entries(rooms).map(([k, r]) => [k, r.path])),
    );
  });

  it("uses only rooms and parameters the contract publishes", () => {
    for (const [id, { companion }] of Object.entries(MODULE_PRACTICE)) {
      const room = rooms[companion.room];
      expect(room, `${id} names unknown room ${companion.room}`).toBeTruthy();
      if (companion.param) {
        expect(room.params, `${id}: ${companion.room} does not parse ?${companion.param}=`).toContain(
          companion.param,
        );
      }
      expect(companionHref(companion).startsWith(room.path)).toBe(true);
    }
  });

  it("never deep-links a Pro exercise", () => {
    const free = new Set(EXERCISES.map((e) => e.id));
    for (const [id, { companion }] of Object.entries(MODULE_PRACTICE)) {
      if (companion.room === "warmups" && companion.param === "exercise") {
        expect(free.has(companion.value!), `${id} deep-links Pro exercise ${companion.value}`).toBe(true);
      }
      for (const item of moduleMaterial(id)) {
        if (item.pro && (item.kind === "exercise" || item.kind === "song")) {
          expect(item.href, `${id} links Pro ${item.kind} ${item.title}`).toBeUndefined();
        }
        if (item.href?.startsWith("/warmups?exercise=")) {
          expect(free.has(item.href.split("=")[1]), `${id}: ${item.href}`).toBe(true);
        }
      }
    }
  });

  it("matches practice sessions for every room that logs one", () => {
    for (const [id, { companion }] of Object.entries(MODULE_PRACTICE)) {
      const match = practiceMatch(companion);
      if (companion.room === "atlas") expect(match).toBeUndefined();
      else expect(match, id).toBeTruthy();
      if (companion.param === "exercise" || companion.room === "songs") {
        expect(match?.detail, `${id} matches no exercise or song title`).toBeTruthy();
      }
    }
  });
});

describe("the pages", () => {
  const lesson = LESSONS[0];
  const params = { stage: lesson.stageSlug, module: lesson.moduleSlug, lesson: lesson.slug };

  it("render every lesson section, relative links and the stated limit", async () => {
    for (const l of LESSONS) {
      const html = renderToStaticMarkup(
        await LessonPage({
          params: Promise.resolve({ stage: l.stageSlug, module: l.moduleSlug, lesson: l.slug }),
        }),
      );
      expect(html, l.id).toContain("What this does not show");
      expect(html, l.id).toContain("data-voice-safety");
      for (const step of l.steps) expect(html).toContain(step.title.replace(/&/g, "&amp;"));
      for (const href of hrefs(html)) {
        expect(href, `${l.id} links ${href}`).not.toMatch(/sing\.suedeai\.ai|guitarhub\.org/);
        if (!href.startsWith("https://www.")) expect(href.startsWith("/"), `${l.id}: ${href}`).toBe(true);
      }
    }
  });

  it("say sing measures a module only when the contract says it can", async () => {
    for (const stage of COURSE) {
      for (const mod of stage.modules) {
        if (!mod.slug) continue;
        const html = renderToStaticMarkup(
          await ModulePage({ params: Promise.resolve({ stage: stage.slug!, module: mod.slug }) }),
        );
        const kind = MODULE_PRACTICE[mod.catalog.id].basis.kind;
        expect(html).toContain(`data-proof-basis="${kind === "measured" ? "measured" : "self-check"}"`);
        if (kind !== "measured") expect(html).not.toContain("Suede Sing measures part of this");
      }
    }
  });

  it("list the whole catalog on the course page and link only ported lessons", () => {
    const html = renderToStaticMarkup(<VoiceCoursePage />);
    for (const m of modules) expect(html).toContain(`data-course-module="${m.id}"`);
    const linked = [...html.matchAll(/data-lesson-id="([^"]+)"/g)].map((m) => m[1]);
    expect(linked.sort()).toEqual(LESSONS.map((l) => l.id).sort());
  });

  it("render a stage page", async () => {
    const html = renderToStaticMarkup(await StagePage({ params: Promise.resolve({ stage: params.stage }) }));
    expect(html).toContain(`href="${VOICE_LEARN_PATH}"`);
  });

  it("are all in the sitemap, and nothing unported is", () => {
    const urls = new Set(sitemap().map((e) => e.url));
    const { stages, modules: mods, lessons } = coursePaths();
    for (const path of [VOICE_LEARN_PATH, ...stages, ...mods, ...lessons]) {
      expect(urls.has(`${SITE_URL}${path}`), path).toBe(true);
    }
    const listed = [...urls].filter((u) => u.startsWith(`${SITE_URL}${VOICE_LEARN_PATH}/`));
    expect(listed.length).toBe(stages.length + mods.length + lessons.length);
  });
});
