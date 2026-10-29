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
import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
import { buildContract } from "@/contracts/suede-vocal";
import sitemap from "@/app/sitemap";
import LearnPage from "@/app/learn/page";
import VoiceCoursePage from "@/app/learn/voice/page";
import LessonPage, {
  generateMetadata as lessonMetadata,
} from "@/app/learn/voice/[stage]/[module]/[lesson]/page";
import ModulePage from "@/app/learn/voice/[stage]/[module]/page";
import StagePage, { generateMetadata as stageMetadata } from "@/app/learn/voice/[stage]/page";
import { ALL_SONGS } from "@/components/songs/data";
import { TOLERANCE_CENTS } from "@/components/songs/lib";
import { EXERCISES, OCTAVE_SIREN_MIN_SEMIS, computeRootLadder } from "@/components/warmups/exercises";
import { routineById, routineSeconds, stepExercise } from "@/components/warmups/routines";
import { TOLERANCE_CENTS as WARMUP_TOLERANCE_CENTS } from "@/components/warmups/scoring";
import { MEASUREMENT_WORDS } from "@/components/learn/module-practice";
import { CAPPED_TYPES } from "@/lib/free-cap";
import { SING_GLOSSARY_TERMS, termId } from "@/lib/glossary";
import { LESSONS, type Lesson } from "@/lib/lesson-data";
import { MODULE_TERMS, courseModuleForTerm } from "@/lib/lesson-glossary";
import {
  GUIDED_ACTIVITY,
  MODULE_PRACTICE,
  RANGE_WARM_UP,
  ROOM_PATHS,
  companionHref,
  companionLabel,
  distinctPracticeMatch,
  isGuidedPractice,
  lessonCompanion,
  linksGuidedPractice,
  moduleMaterial,
  practiceMatch,
  warmsUpFirst,
  type Companion,
} from "@/lib/lesson-practice";
import { FREE_DAILY_MINUTES } from "@/lib/practice-limits";
import { SITE_URL } from "@/lib/site";
import { voiceCurriculum } from "@/lib/voice-curriculum";
import {
  COURSE,
  REVIEW_STEP_TITLE,
  TARGET_STEP_PREFIX,
  echoesObjective,
  lessonById,
  UNIVERSAL_LESSON_TEXT,
  VOICE_LEARN_PATH,
  coursePaths,
  lessonHref,
  notReadyAdvice,
  shownSteps,
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
  "breath-support-from-inhale": /\b(?:app|mic|microphone|sing|breath room)\b[^.]{0,60}\b(?:measures?|reads?|scores?|checks?|detects?|hears?|tracks?)\b[^.]{0,40}\b(?:support|lung|diaphragm|how (?:deep|much air))|\blung capacity\b|\bdiaphragm(?:atic)? (?:engagement|activation)\b/i,
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
    // The answer that leads the page and is its structured-data description.
    ["in short", lesson.explanation],
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

/** Every room a module's pages open: the module's own, then any lesson's. */
function companionsOf(moduleId: string): Companion[] {
  const p = MODULE_PRACTICE[moduleId];
  return [p.companion, ...Object.values(p.lessonCompanion ?? {}).filter((c): c is Companion => !!c)];
}

function hrefs(html: string): string[] {
  return [...html.matchAll(/href="([^"]+)"/g)].map((m) => m[1].replace(/&amp;/g, "&"));
}

/** The site's one referral for symptoms that need the folds looked at. */
const DOCTOR_REFERRAL = "a doctor who can examine the vocal folds, such as an ENT or laryngologist";
/** Referrals that cover clinicians who cannot look at the folds. */
const VAGUE_REFERRAL = /qualified clinician|clinical assessment/i;

describe("the lesson data", () => {
  // Staleness against content/lessons is lib/generated-data.test.ts.
  /**
   * "## In short" leads the lesson and is plain text, because the page prints
   * it as a paragraph and the structured data reuses it as the description. A
   * concept lesson exists to explain an idea, so it must have one; an exercise
   * or a self-check may lead with the practice instead.
   */
  it("requires an \"In short\" paragraph on concept lessons, first and as plain text", () => {
    const dir = mkdtempSync(join(tmpdir(), "lessons-"));
    try {
      cpSync("content/lessons", dir, { recursive: true });
      const path = (l: Lesson) => join(dir, l.stageSlug, l.moduleSlug, `${l.slug}.md`);
      const compile = (file: string, text: string) => {
        writeFileSync(file, text);
        return spawnSync(process.execPath, ["scripts/compile-lessons.mjs", dir, "--check"], { encoding: "utf8" })
          .stdout;
      };
      const SHORT = /## In short\n[\s\S]*?(?=## Steps)/;
      const answer = "## In short\n\nSpeakers put the reference into the microphone.\n\n";

      const concept = path(LESSONS.find((l) => l.type === "concept")!);
      const original = readFileSync(concept, "utf8");
      expect(original).toMatch(SHORT);
      const withShort = (section: string) => original.replace(SHORT, section);
      expect(compile(concept, withShort(answer))).not.toMatch(/In short/);
      expect(compile(concept, withShort(""))).toMatch(/a concept lesson needs "## In short"/);
      expect(
        compile(concept, withShort("").replace("## If it goes wrong", `${answer}## If it goes wrong`)),
      ).toMatch(/"## In short" must be the first section/);
      expect(compile(concept, withShort("## In short\n\n- a list item\n\n"))).toMatch(/one plain paragraph/);
      expect(compile(concept, withShort("## In short\n\n"))).toMatch(/"## In short" is empty/);
      writeFileSync(concept, original);

      const other = path(LESSONS.find((l) => l.type !== "concept" && !l.explanation)!);
      const plain = readFileSync(other, "utf8");
      expect(compile(other, plain)).not.toMatch(/In short/);
      expect(compile(other, plain.replace("## Steps", `${answer}## Steps`))).not.toMatch(/In short/);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
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
   * The objective is the page's subtitle and its search description, and the
   * module page lists the lesson by its catalog summary, so the two are one
   * sentence. Three were once authored apart, and one of those promised a
   * Stage 2 comparison no lesson asked for; the compile now refuses a drift.
   */
  it("states the catalog's summary as the lesson objective", () => {
    for (const lesson of LESSONS) {
      expect(lesson.objective, lesson.id).toBe(catalogLessons.get(lesson.id)!.lesson.summary);
    }
  });

  /**
   * A lesson that says stop for pain or hoarseness, or see a clinician, must
   * not tell the singer in the next breath to try again; the port's closing
   * "Repeat a smaller version on another fresh attempt" did exactly that.
   */
  it("never follows a stop-for-pain or see-a-clinician rule with a retry", () => {
    for (const lesson of LESSONS) {
      const { ifNotReady } = lesson.selfCheck;
      if (/\bpain\b|hoarse|clinician|pathologist|doctor|laryngologist/i.test(ifNotReady)) {
        expect(ifNotReady, lesson.id).not.toMatch(/Repeat a smaller version on another fresh attempt/);
      }
      // An exit that says move on and come back later is the last word; a
      // retry after it sends the singer straight back to the checkpoint.
      expect(ifNotReady, lesson.id).not.toMatch(/move on to the next module[^]*repeat a smaller version/i);
      if (lesson.moduleId === "v-l7-m4") {
        expect(ifNotReady, lesson.id).toMatch(/Do not try the effect again/);
      }
    }
  });

  /**
   * The effects and stop-plan modules ask the singer to copy a stop list. Every
   * list those pages print (the target step, When it goes wrong, If you're not
   * ready) names blood, and blood or a sudden loss of range goes to the doctor
   * now, never after waiting for symptoms to persist.
   */
  it("give the effects and stop-plan modules one stop list that sends blood to the doctor now", () => {
    const stopPlanLessons = LESSONS.filter((l) => l.moduleId === "v-l7-m4" || l.moduleId === "v-l7-m1");
    expect(stopPlanLessons.length).toBe(6);
    for (const lesson of stopPlanLessons) {
      const lists = [
        ...lesson.mistakes.map((m) => m.recovery),
        lesson.selfCheck.ifNotReady,
        ...lesson.steps.map((s) => s.body),
      ].filter((text) => /\bStop (for|on) pain\b|see a doctor|seeing a doctor/i.test(text));
      expect(lists.length, lesson.id).toBeGreaterThan(0);
      for (const text of lists) {
        expect(text, lesson.id).toMatch(/\bany blood\b/i);
        if (/doctor/i.test(text)) expect(text, lesson.id).toContain(DOCTOR_REFERRAL);
        expect(text, lesson.id).not.toMatch(/when symptoms persist/i);
      }
    }
  });

  /**
   * The belt and wobble modules stop for loss of range too. Their stop rules
   * must not send a sudden loss of range only to "another day": blood or a
   * sudden loss goes to the doctor now, in the binding referral wording, in
   * both When it goes wrong and If you're not ready.
   */
  it("send a sudden loss of range or any blood to the doctor in the belt and wobble stop rules", () => {
    const lessons = LESSONS.filter((l) => l.moduleId === "v-l5-m4" || l.moduleId === "v-l3-m5");
    expect(lessons.length).toBeGreaterThanOrEqual(6);
    for (const lesson of lessons) {
      const rules = [...lesson.mistakes.map((m) => m.recovery), lesson.selfCheck.ifNotReady].filter((text) =>
        /loss of range/i.test(text),
      );
      expect(rules.length, lesson.id).toBe(2);
      for (const text of rules) {
        expect(text, lesson.id).toMatch(/Any blood, or a sudden loss of range or voice, means seeing/);
        expect(text, lesson.id).toContain(DOCTOR_REFERRAL);
      }
    }
  });

  /**
   * A concept lesson's "Did it work?" asks about the task its "Hear the
   * distinction" step set, not material from elsewhere in the module, and its
   * review step still restates that check so the page drops the repeat.
   */
  it("ask Did it work? about the task the concept lesson set", () => {
    const set: Record<string, RegExp> = {
      "v-l2-m2-01": /breathy, a clicked and a balanced onset/,
      "v-l4-m1-01": /same reference note from silence twice/,
      "v-l4-m3-01": /lazy and then clear consonants/,
      "v-l5-m2-01": /plain and then shaded toward “aw”/,
      "v-l5-m4-01": /“hey” call up one semitone at a time/,
    };
    for (const [id, task] of Object.entries(set)) {
      const lesson = LESSONS.find((l) => l.id === id)!;
      const [first] = lesson.selfCheck.criteria;
      expect(first, id).toMatch(task);
      expect(first, id).not.toMatch(/five-note scale|Amazing Grace|three vowels|supplied short pattern|spoke and sang/);
      expect(lesson.selfCheck.shows, id).toContain(first);
      const said = [...lesson.selfCheck.criteria, ...lesson.steps.flatMap((s) => [s.look, s.listen])];
      for (const line of said) expect(line, id).not.toMatch(/three vowels|planned short hold/);
      expect(shownSteps(lesson).some((s) => s.title === REVIEW_STEP_TITLE), id).toBe(false);
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

  /**
   * The panel says "Suede Sing measures part of this" and then opens the
   * companion room, so the measurement must be one that room shows. Straw and
   * Lip Trill once named the breath room's sustain timer while its button
   * opened a pitch-scored warm-up.
   */
  it("names only a measurement the companion room takes", () => {
    const ROOM_MEASURES: Record<string, readonly string[]> = {
      warmups: ["scorePercent", "inTuneHoldTime", "centsFromTarget"],
      songs: ["scorePercent", "inTuneHoldTime", "centsFromTarget"],
      studio: ["centsFromTarget"],
      range: ["rangeExtremes"],
      breath: ["sustainSeconds", "loudnessSteadiness", "inhaleDetected", "inhaleSeconds"],
      analyze: ["phonationSeconds", "ringRatio", "cycleDose"],
    };
    for (const [id, { basis, companion }] of Object.entries(MODULE_PRACTICE)) {
      if (basis.kind !== "measured") continue;
      expect(ROOM_MEASURES[companion.room] ?? [], `${id} opens ${companion.room}`).toContain(
        basis.measurement,
      );
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

  /**
   * A lesson that names the warm-up's scoring window in its own words (Hold
   * It's self-check: a sag inside the window is yours to hear) names the
   * window the warm-up room scores against.
   */
  it("names the warm-up's scoring window as the warm-up room scores it", () => {
    const stated = LESSONS.flatMap((l) =>
      [...JSON.stringify(l).matchAll(/within (\d+) cents/g)].map((m) => [l.id, Number(m[1])] as const),
    );
    expect(stated.length).toBeGreaterThan(0);
    for (const [id, cents] of stated) expect(cents, id).toBe(WARMUP_TOLERANCE_CENTS);
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
      "breath-support-from-inhale": "The mic hears your inhale and measures your breath support.",
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
    for (const [id, companion] of Object.keys(MODULE_PRACTICE).flatMap((id) =>
      companionsOf(id).map((c) => [id, c] as const),
    )) {
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
    for (const id of Object.keys(MODULE_PRACTICE)) {
      for (const companion of companionsOf(id)) {
        if (companion.room === "warmups" && companion.param === "exercise") {
          expect(free.has(companion.value!), `${id} deep-links Pro exercise ${companion.value}`).toBe(true);
        }
      }
      for (const item of moduleMaterial(id)) {
        if (item.pro && (item.kind === "exercise" || item.kind === "song")) {
          expect(item.href, `${id} links Pro ${item.kind} ${item.title}`).toBeUndefined();
          expect(item.page, `${id} links Pro ${item.kind} ${item.title}`).toBeUndefined();
        }
        if (item.href?.startsWith("/warmups?exercise=")) {
          expect(free.has(item.href.split("=")[1]), `${id}: ${item.href}`).toBe(true);
        }
      }
    }
  });

  /**
   * A lesson tells you which song to choose from its practice panel, and the
   * panel prints the songbook's title. When a song is renamed ("Amazing Grace
   * (Verse 1 & 2)" became "(Opening Lines, Verses 1 & 2)"), a lesson still
   * naming the old one points at a row that isn't there.
   */
  it("names each song arrangement by the title the songbook shows", () => {
    const titles = new Set(ALL_SONGS.map((s) => s.title));
    const bases = new Set(ALL_SONGS.map((s) => s.title.split(" (")[0]));
    const escape = (t: string) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    for (const l of LESSONS) {
      const text = [l.objective, l.explanation, ...l.steps.map((s) => s.body), ...l.blocks.map((b) => b.instruction)].join("\n");
      for (const base of bases) {
        for (const [named] of text.matchAll(new RegExp(`${escape(base)} \\([^)]*\\)`, "g"))) {
          expect(titles.has(named), `${l.id} names "${named}"`).toBe(true);
        }
      }
    }
  });

  /**
   * /songs?song= canonicalises to /songs, so a lesson that links a song only
   * that way gives the song's own page, which prints the range a lesson asks
   * the singer to choose a key from, no link at all. The name opens the page;
   * "Sing it" beside it opens the songbook.
   */
  it("links each free song in the practice material to its own page, beside a link to sing it", async () => {
    const byTitle = new Map(ALL_SONGS.map((s) => [s.title, s]));
    let songs = 0;
    for (const id of Object.keys(MODULE_PRACTICE)) {
      for (const item of moduleMaterial(id)) {
        if (item.kind !== "song" || item.pro) continue;
        songs++;
        const song = byTitle.get(item.title)!;
        expect(item.page, `${id}: ${item.title}`).toBe(`/songs/${song.slug}`);
        expect(item.href, `${id}: ${item.title}`).toBe(`/songs?song=${song.slug}`);
      }
    }
    expect(songs).toBeGreaterThan(0);
    const stage = COURSE.find((s) => s.modules.some((m) => m.catalog.id === "v-l2-m4"))!;
    const mod = stage.modules.find((m) => m.catalog.id === "v-l2-m4")!;
    const html = renderToStaticMarkup(
      await ModulePage({ params: Promise.resolve({ stage: stage.slug!, module: mod.slug! }) }),
    );
    expect(html).toContain('href="/songs/amazing-grace"');
    expect(html).toMatch(/<a [^>]*data-sing-song[^>]*href="\/songs\?song=amazing-grace"[^>]*>Sing it</);
  });

  /**
   * The lesson page's first button opens the module's room. A book's contents
   * page is not somewhere to sing a phrase two ways and record it, and the
   * live analyzer is not the Pro "take analysis" of recorded takes.
   */
  it("sends every module to a room it can be practised in, named as the site names it", () => {
    for (const id of Object.keys(MODULE_PRACTICE)) {
      for (const companion of companionsOf(id)) {
        expect(["atlas", "glossary", "singers", "programs", "progress"], id).not.toContain(companion.room);
        expect(companionLabel(companion), id).not.toMatch(/take analysis/i);
      }
    }
    expect(companionLabel({ room: "analyze" })).toBe("the voice analyzer");
  });

  it("gives a lesson its own room only for a lesson of that module", () => {
    for (const [id, p] of Object.entries(MODULE_PRACTICE)) {
      for (const lessonId of Object.keys(p.lessonCompanion ?? {})) {
        expect(catalogLessons.get(lessonId)?.module.id, `${id}: ${lessonId}`).toBe(id);
        // The panel on such a lesson calls the module's room the one "for the
        // module's self-check", so the self-check itself keeps that room.
        expect(catalogLessons.get(lessonId)?.lesson.type, `${id}: ${lessonId}`).not.toBe("checkpoint");
      }
    }
  });

  /**
   * Set Up Your Space has the singer record a take with playback on and one
   * with it stopped, and compare them. The analyzer cannot record or play
   * back, and its voiced-time figure rises with a reference bleeding in.
   */
  it("sends the room-setup module to the recorder its lessons record in", () => {
    const p = MODULE_PRACTICE["v-l1-m1"];
    expect(p.companion.room).toBe("recorder");
    expect(p.basis.kind).toBe("selfCheck");
  });

  /**
   * A self-checked module's evidence is the singer's ear on a recording, and
   * the live analyzer cannot record or play one back. Chest, Head, Falsetto
   * sings a fuller and a lighter version in one take and judges the switch on
   * playback, so it practises in the recorder. The analyzer stays for the
   * modules whose evidence it measures (ring ratio, cycle dose).
   */
  it("never sends a self-checked module to the analyzer, which cannot record the take its self-check plays back", () => {
    for (const [id, p] of Object.entries(MODULE_PRACTICE)) {
      if (p.basis.kind !== "selfCheck") continue;
      for (const companion of companionsOf(id)) expect(companion.room, id).not.toBe("analyze");
    }
    expect(MODULE_PRACTICE["v-l3-m1"].companion.room).toBe("recorder");
  });

  /**
   * Twang and Ring keeps the analyzer for its ring band, but every step is
   * judged on a one-take baseline-and-bright recording the analyzer cannot
   * make. The steps name both rooms: what to watch in one, where to record in
   * the other. Mix, Not Shout opens the pitch studio, which cannot record the
   * climb its lessons play back or the self-check's evidence take, so all three
   * name the recorder too, as does the ornaments self-check, whose Ready when
   * is named on playback, and Hold It's opening lesson and self-check, which
   * compare the start and end of holds on playback from a room that cannot
   * record them.
   */
  it("has Twang and Ring's steps say what to watch in the analyzer and where the one-take comparison is recorded", () => {
    for (const l of LESSONS.filter((l) => l.moduleId === "v-l5-m3")) {
      const body = l.steps.map((s) => s.body).join("\n");
      expect(body, l.id).toContain("](/analyze)");
      expect(body, l.id).toContain("](/recorder)");
    }
    for (const id of ["v-l5-m4-01", "v-l5-m4-04", "v-l5-m4-07", "v-l6-m4-08", "v-l2-m3-01", "v-l2-m3-06"]) {
      const lesson = LESSONS.find((l) => l.id === id);
      expect(lesson, id).toBeDefined();
      expect(lesson!.steps.map((s) => s.body).join("\n"), id).toContain("](/recorder)");
    }
  });

  /**
   * The warm-up room, the pitch studio and the practice tools cannot record or
   * play back. A checkpoint whose Ready when is judged on playback but whose
   * button opens one of them must say where the evidence take is recorded, or
   * the singer cannot make the recording the pass condition is judged on.
   */
  it("names the recorder in every checkpoint judged on playback whose room cannot record", () => {
    const checked: string[] = [];
    for (const l of LESSONS.filter((l) => l.type === "checkpoint")) {
      const room = lessonCompanion(MODULE_PRACTICE[l.moduleId], l.id).room;
      if (room === "recorder" || room === "songs") continue;
      if (!/playback|play back/i.test(l.selfCheck.readyWhen)) continue;
      checked.push(l.id);
      expect(l.steps.map((s) => s.body).join("\n"), l.id).toContain("](/recorder)");
    }
    expect(checked.length).toBeGreaterThan(0);
  });

  /**
   * Every self-check's evidence step asks for "one uninterrupted attempt". Said
   * as "record" from a room that cannot record (the range test, the breath
   * room, the warm-up room, the pitch studio, the analyzer, the tools), it
   * must say where the recording is made, whatever the Ready when is judged
   * on. The range self-check's attempt is the test itself, which saves its own
   * result, so it asks for the test as the one attempt rather than a recording.
   */
  it("says where every evidence take is recorded when the lesson's room cannot record", () => {
    const checked: string[] = [];
    for (const l of LESSONS) {
      const room = lessonCompanion(MODULE_PRACTICE[l.moduleId], l.id).room;
      if (room === "recorder" || room === "songs") continue;
      // The step that asks for it names the recorder (Twang and Ring's does
      // so a sentence later, for the one take its comparison needs).
      const steps = l.steps.filter((s) => /record one uninterrupted attempt/.test(s.body));
      if (steps.length === 0) continue;
      checked.push(l.id);
      for (const s of steps) expect(s.body, l.id).toContain("](/recorder)");
    }
    // The five whose Ready when is judged live or by the room's own result,
    // which the playback rule above does not reach.
    for (const id of ["v-l1-m3-04", "v-l2-m1-06", "v-l5-m1-07", "v-l7-m1-08"]) expect(checked, id).toContain(id);
    // The passaggio checkpoint passes on naming a note, which the recorder
    // shows a free singer none of: the zone is marked in the pitch studio,
    // as Your Range does, after the recorded take.
    const passaggio = LESSONS.find((l) => l.id === "v-l5-m1-07")!;
    expect(passaggio.selfCheck.readyWhen).toMatch(/name the note/);
    const evidence = passaggio.steps.find((s) => /record one uninterrupted attempt/.test(s.body))!;
    expect(evidence.body).toMatch(/\]\(\/recorder\)[^]*\]\(\/studio\), which names the note as you sing it[^]*Mark a zone/);
    const range = LESSONS.find((l) => l.id === "v-l1-m2-04")!;
    expect(lessonCompanion(MODULE_PRACTICE[range.moduleId], range.id).room).toBe("range");
    const rangeBody = range.steps.map((s) => s.body).join("\n");
    expect(rangeBody).not.toMatch(/record one uninterrupted attempt/);
    expect(rangeBody).toContain("sing the test as one uninterrupted attempt, and keep its saved result");
    // A finished test becomes the saved range every warm-up and song is fitted
    // to, so a forced end is not kept "even when it does not pass": the page's
    // own If it goes wrong says discard it, and chapter 12 says Start over.
    expect(rangeBody).not.toMatch(/keep its saved result even when it does not pass/);
    expect(rangeBody).toMatch(/press Start over before the test finishes/);
    expect(range.selfCheck.ifNotReady).toMatch(/discard it/);
  });

  /**
   * The same holds for any lesson, of any type, whose steps judge the take on
   * a recording: "Judge the continuity from your recorded playback" or "compare
   * your sung entries with your recorded taps" needs a recording, so the steps
   * say where it is made.
   */
  it("says where the recording is made on every lesson judged on one from a room that cannot record", () => {
    const checked: string[] = [];
    for (const l of LESSONS) {
      const room = lessonCompanion(MODULE_PRACTICE[l.moduleId], l.id).room;
      if (room === "recorder" || room === "songs") continue;
      const steps = l.steps.map((s) => [s.body, s.look, s.listen].join("\n")).join("\n");
      if (!/recorded (?:playback|taps)/i.test(steps)) continue;
      checked.push(l.id);
      expect(steps, l.id).toMatch(/\]\(\/recorder\)|in the recorder/);
    }
    expect(checked.length).toBeGreaterThan(0);
  });

  /**
   * Your Range's first two lessons practise the slides in the recorder; only
   * the self-check takes the test. Every finished test replaces the saved
   * range, so repeating an exercise lesson must not repeat the test.
   */
  it("keeps the Your Range exercise lessons out of the range test", () => {
    for (const l of LESSONS.filter((l) => l.moduleId === "v-l1-m2")) {
      const room = lessonCompanion(MODULE_PRACTICE[l.moduleId], l.id).room;
      if (l.type === "checkpoint") expect(room, l.id).toBe("range");
      else expect(room, l.id).toBe("recorder");
    }
  });

  it("never sends the passaggio module to the range test, which shows no passaggio", () => {
    for (const [id, { basis, companion }] of Object.entries(MODULE_PRACTICE)) {
      if (basis.kind === "selfCheck" && basis.missing === "passaggioPitches") {
        expect(companion.room, id).not.toBe("range");
      }
    }
  });

  /**
   * A practice step can say "The reading X is listed there too", meaning the
   * practice panel. It names the module's first reading, so a reading added to
   * a module goes after it, and reordering a module's readings rewrites that
   * sentence in every one of its lessons.
   */
  it("names the module's first listed reading wherever a lesson points at the practice panel's reading", () => {
    let checked = 0;
    for (const lesson of LESSONS) {
      for (const step of lesson.steps) {
        const named = /The reading (.+?) is listed there too\./.exec(step.body)?.[1];
        if (named === undefined) continue;
        checked++;
        const readings = moduleMaterial(lesson.moduleId).filter((m) => m.kind === "book" || m.kind === "atlas");
        expect(readings[0]?.title, lesson.id).toBe(named);
      }
    }
    // A step that only pointed at the panel is dropped at compile time
    // (scripts/compile-lessons.mjs); the few that also give an instruction stay.
    expect(checked).toBeGreaterThan(0);
  });

  it("keeps range extension out of the range test, which its lessons save for a retest weeks apart", () => {
    // Every finished test replaces the saved range, and the practice counter
    // would log each one as practice of this module.
    expect(MODULE_PRACTICE["v-l7-m5"].companion.room).not.toBe("range");
  });

  /**
   * Below OCTAVE_SIREN_MIN_SEMIS the warm-up room fits the octave siren from
   * within two semitones of the measured floor (below it under an octave) to
   * on or within two of the measured ceiling, the extremes a cold range test
   * found; the range card and the coach stop offering it there. A lesson that
   * offers it names that threshold, as the result card's Span prints it, and
   * the fourth siren instead, slides a fourth where its own steps would slide
   * an octave, and never asks for the supplied siren's endpoints whatever the
   * range.
   */
  it("sends a range narrower than the octave siren's threshold to the fourth siren", () => {
    const span = `${Math.floor(OCTAVE_SIREN_MIN_SEMIS / 12)} octave + ${OCTAVE_SIREN_MIN_SEMIS % 12}`;
    const offering = LESSONS.filter((l) => MODULE_PRACTICE[l.moduleId]?.studies.includes("octave-siren"));
    expect(offering.length).toBeGreaterThan(0);
    for (const lesson of offering) {
      const text = lesson.steps.flatMap((s) => [s.body, s.look, s.listen]).join("\n");
      expect(text, lesson.id).not.toMatch(/supplied Octave siren, then/);
      if (!/choose Octave siren/.test(text)) continue;
      expect(text, lesson.id).toContain(`less than ${OCTAVE_SIREN_MIN_SEMIS} semitones (under ${span} on its Span)`);
      expect(text, lesson.id).toContain("choose Easy fourth siren");
      expect(text, lesson.id).toContain(
        "the room's octave glide starts within two semitones of the lowest note you measured, or below it, and tops out on or within two of the highest",
      );
      expect(text, lesson.id).toContain(
        `If your range test spanned less than ${OCTAVE_SIREN_MIN_SEMIS} semitones, slide a fourth rather than an octave`,
      );
      expect(text, lesson.id).not.toMatch(/before attempting the octave/);
    }
  });

  /**
   * On the Beat's first lesson teaches how a beat divides. Its phrases were
   * once Row Row Row and Ode to Joy, every note of both on a tap, so the
   * self-check passed without a single note placed between two taps, while
   * the module's name promised syncopation that no phrase had.
   */
  it("checks On the Beat's subdivisions on a phrase with notes between the taps", () => {
    const songs = MODULE_PRACTICE["v-l4-m2"].studies.flatMap((id) => ALL_SONGS.filter((s) => s.id === id));
    const between = songs.filter((s) => s.notes.some((n) => !Number.isInteger(n.startBeat)));
    expect(between.length).toBeGreaterThan(0);
    const lessons = LESSONS.filter((l) => l.moduleId === "v-l4-m2");
    const check = lessons.find((l) => l.type === "checkpoint")!;
    expect(between.some((s) => check.selfCheck.readyWhen.includes(s.title))).toBe(true);
    // Every lesson points at a phrase it can practise that on.
    for (const l of lessons) {
      const text = l.steps.map((s) => s.body).join("\n");
      expect(between.some((s) => text.includes(s.title)), l.id).toBe(true);
      expect(JSON.stringify(l), l.id).not.toMatch(/syncopat/i);
    }
    expect(modules.find((m) => m.id === "v-l4-m2")!.skill).not.toMatch(/syncopat/i);
  });

  it("describes the octave siren's narrow-range fit as the room builds it", () => {
    // The sentence above, against fitRootLadder: every glide starts no more
    // than two semitones above the measured low (from a span under 12, below
    // it) and tops out on the measured high or within two under it.
    const siren = EXERCISES.find((e) => e.id === "octave-siren")!;
    const low = 48;
    for (let semis = 1; semis < OCTAVE_SIREN_MIN_SEMIS; semis++) {
      const high = low + semis;
      const roots = computeRootLadder(siren, low, high);
      expect(roots[0] - low, `span ${semis}`).toBeLessThanOrEqual(2);
      const top = roots[roots.length - 1] + 12;
      expect(top, `span ${semis}`).toBeLessThanOrEqual(high);
      expect(top, `span ${semis}`).toBeGreaterThanOrEqual(high - 2);
    }
  });

  it("caps the attempts at a new top or bottom note, as chapter 17 does", () => {
    // "Three attempts at any note near your top, then move on": the one dose
    // rule the free range-extension lesson otherwise left out.
    const lesson = LESSONS.find((l) => l.id === "v-l7-m5-04")!;
    expect(lesson.steps.map((s) => s.body).join("\n")).toMatch(/three attempts at most today/);
    expect(lesson.selfCheck.ifNotReady).toMatch(/within three attempts today/);
    expect(lesson.mistakes.some((m) => /within three attempts today/.test(m.recovery))).toBe(true);
    expect(lesson.blocks.some((b) => /^Up to three attempts/.test(b.instruction))).toBe(true);
  });

  it("lists no reading for the rhythm module, which no chapter teaches", () => {
    // Weeks 11 and 12 is the program's song-and-retest chapter: it has no
    // counting, subdivision or swing, and listing it sent Stage 4 learners to
    // a Pro chapter that does not teach the module's skill.
    expect(MODULE_PRACTICE["v-l4-m2"].readings).toEqual([]);
  });

  it("files a module as self-reported in the catalog exactly when nothing here measures it", () => {
    // The catalog's proofMetric and the basis a lesson page states name the
    // same evidence, so the two never disagree about a module.
    for (const m of modules) {
      const { basis } = MODULE_PRACTICE[m.id];
      expect(m.proofMetric === "self_reported", `${m.id}: ${m.proofMetric}`).toBe(
        basis.kind === "selfCheck",
      );
    }
  });

  it("knows which rooms draw on the free daily allowance, as the cap counts them", () => {
    expect([...GUIDED_ACTIVITY].sort()).toEqual([...CAPPED_TYPES].sort());
    expect(isGuidedPractice({ room: "warmups" })).toBe(true);
    expect(isGuidedPractice({ room: "breath", param: "drill", value: "sustain" })).toBe(true);
    for (const room of ["studio", "range", "recorder", "analyze", "tools", "atlas"]) {
      expect(isGuidedPractice({ room }), room).toBe(false);
    }
    // The range test has no clock, but its buttons offer the warm-up first.
    expect(warmsUpFirst({ room: "range" })).toBe(true);
    expect(linksGuidedPractice({ room: "range" })).toBe(true);
    for (const room of ["studio", "recorder", "analyze", "tools"]) {
      expect(linksGuidedPractice({ room }), room).toBe(false);
    }
    expect(RANGE_WARM_UP.href).toBe("/warmups?routine=morning");
    expect(RANGE_WARM_UP.href).toBe(`/warmups?routine=${RANGE_WARM_UP.routine}`);
    expect(rooms.warmups.params).toContain("routine");
    // The note beside it says the Morning reset's four or so minutes come out
    // of the free allowance, which has to stay large enough to hold them.
    expect(FREE_DAILY_MINUTES).toBeGreaterThanOrEqual(4);
    // The button names the routine it opens, which is free, and the note's
    // "about four minutes" is that routine's length, as the lessons say.
    const morning = routineById(RANGE_WARM_UP.routine)!;
    expect(morning.pro).toBe(false);
    expect(RANGE_WARM_UP.label).toBe(`Warm up first: ${morning.name}`);
    expect(Math.round(routineSeconds(morning) / 60)).toBe(4);
    expect(routineSeconds(morning)).toBeLessThanOrEqual(FREE_DAILY_MINUTES * 60);
  });

  /**
   * The course and stage pages mark a module "Practised" only on evidence for
   * that module. One recording once marked eleven modules across Stages 3 to
   * 7, and one front-door pitch-meter session four more.
   */
  it("marks a module practised only on a session no other module shares", () => {
    const shared = new Set(["recorder", "studio", "analyze"]);
    for (const [id, { companion }] of Object.entries(MODULE_PRACTICE)) {
      if (shared.has(companion.room)) expect(distinctPracticeMatch(id), id).toBeUndefined();
    }
    // Two modules sing Deep River.
    expect(distinctPracticeMatch("v-l3-m4")).toBeUndefined();
    expect(distinctPracticeMatch("v-l6-m6")).toBeUndefined();
    // The range test, the sustain test and the one tools module are their own.
    expect(distinctPracticeMatch("v-l1-m2")).toEqual({ type: "range" });
    expect(distinctPracticeMatch("v-l1-m3")).toEqual({ type: "breath", detail: "Sustain test" });
    expect(distinctPracticeMatch("v-l4-m2")).toEqual({ type: "tools" });
    // A warm-up deep link names its exercise, so it is one module's.
    expect(distinctPracticeMatch("v-l2-m3")?.detail).toBeTruthy();
    // Unless Stage 1 sends every singer through it first: the Morning reset
    // before the range test logs each of its drills under the drill's title,
    // and Stage 6's three-note turn is scored on one of them.
    const morning = routineById(RANGE_WARM_UP.routine)!.steps.map((st) => stepExercise(st).id);
    expect(morning).toContain("morning-three-note");
    expect(MODULE_PRACTICE["v-l6-m1"].companion.value).toBe("morning-three-note");
    expect(distinctPracticeMatch("v-l6-m1")).toBeUndefined();
    for (const [id, { companion }] of Object.entries(MODULE_PRACTICE)) {
      if (companion.room === "warmups" && morning.includes(companion.value!)) {
        expect(distinctPracticeMatch(id), id).toBeUndefined();
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
      // Every lesson keeps the shared safety line and its stop-rules link,
      // the health and effects lessons most of all: their steps point at it.
      expect(html.includes("data-voice-safety"), l.id).toBe(true);
      expect(html, l.id).toContain('href="/learn/voice#safety"');
      expect(html, l.id).toMatch(/\bblood\b/);
      // #259's conventions: American spelling and no em dashes in what a reader sees.
      const text = html.replace(/<[^>]+>/g, " ");
      expect(text, l.id).not.toMatch(/\b(?:practis|colour|centre|neighbour|recognis|judgement|theatre)/i);
      expect(text, l.id).not.toContain("—");
      if (l.type === "concept") expect(html, l.id).toContain("data-lesson-answer");
      for (const step of shownSteps(l)) expect(html).toContain(step.title.replace(/&/g, "&amp;"));
      // Hoarseness that will not clear needs the folds examined, so the
      // lessons name the doctor who can, as the book and guides do, and never
      // offer a speech-language pathologist as the alternative to one.
      expect(html, l.id).not.toMatch(
        /doctor or (?:a )?speech-language pathologist|seek an ENT or voice-specialized/,
      );
      // The safety note on every page names that doctor, so no line on the
      // same page may offer a vaguer referral beside it.
      expect(html, l.id).toContain(DOCTOR_REFERRAL);
      expect(html, l.id).not.toMatch(VAGUE_REFERRAL);
      for (const href of hrefs(html)) {
        expect(href, `${l.id} links ${href}`).not.toMatch(/sing\.suedeai\.ai|guitarhub\.org/);
        if (!href.startsWith("https://www.")) expect(href.startsWith("/"), `${l.id}: ${href}`).toBe(true);
      }
    }
  });

  /**
   * The port gave all 102 lessons the same frame, so a few lines were the same
   * on every page and outweighed what each lesson says of its own. They are
   * said once on the course page; a lesson page keeps only its own text.
   */
  it("leave the course-wide lines to the course page and keep each lesson's own", async () => {
    const shared = [...UNIVERSAL_LESSON_TEXT];
    expect(shared).toContain(
      "I kept missing or uncertain evidence as missing instead of awarding myself a measured pass.",
    );
    const escape = (t: string) => renderToStaticMarkup(<>{t}</>);
    for (const l of LESSONS) {
      const html = renderToStaticMarkup(
        await LessonPage({
          params: Promise.resolve({ stage: l.stageSlug, module: l.moduleSlug, lesson: l.slug }),
        }),
      );
      for (const line of shared) expect(html, `${l.id} repeats "${line}"`).not.toContain(escape(line));
      for (const c of l.selfCheck.criteria.filter((c) => !UNIVERSAL_LESSON_TEXT.has(c))) {
        expect(html, l.id).toContain(escape(c));
      }
      if (!UNIVERSAL_LESSON_TEXT.has(l.selfCheck.readyWhen)) {
        expect(html, l.id).toContain(escape(l.selfCheck.readyWhen));
      }
      // The advice is all on the page, each sentence once (a recovery is not repeated under it).
      for (const sentence of l.selfCheck.ifNotReady.split(/(?<=[.!?])\s+(?=[A-Z“"(])/)) {
        expect(html, l.id).toContain(escape(sentence));
        expect(html.split(escape(sentence)).length - 1, `${l.id} repeats "${sentence}"`).toBe(1);
      }
    }
    const course = renderToStaticMarkup(<VoiceCoursePage />);
    expect(course).toContain("data-course-rules");
    expect(course).toMatch(/Unless a self-check says otherwise, it is ready when you can\s+describe the result/);
    expect(course).toContain("never as a pass");
    // The disclosure the shared Listen line carried on every lesson.
    expect(course).toMatch(/Reference notes are piano notes, not recordings of a\s+singer/);
  });

  it("say a lesson's not-ready advice once, not again after its own recovery", () => {
    const l = LESSONS.find((x) => x.id === "v-l7-m1-01")!;
    const recovery = l.mistakes[0].recovery;
    expect(l.selfCheck.ifNotReady.startsWith(recovery)).toBe(true);
    expect(notReadyAdvice(l, [recovery])).toBe(
      "Leave it for today, and come back to a smaller version on another day once your speaking voice feels normal.",
    );
    expect(notReadyAdvice(l, [])).toBe(l.selfCheck.ifNotReady);
    const same = LESSONS.filter((x) => x.mistakes.some((m) => m.recovery === x.selfCheck.ifNotReady));
    expect(same.length).toBeGreaterThan(50);
    for (const x of same) expect(notReadyAdvice(x, x.mistakes.map((m) => m.recovery)), x.id).toBe("");
  });

  /**
   * The port printed a step's look/listen checks again, word for word, under
   * the next step, and headed every recovery with the same generic symptom
   * ("The target disappears when…") over a fix for something else.
   */
  it("print each step check once, and each recovery without the shared symptom", async () => {
    expect(
      UNIVERSAL_LESSON_TEXT.has("The target disappears when the range, volume, speed, or duration increases."),
    ).toBe(true);
    const escape = (t: string) => renderToStaticMarkup(<>{t}</>);
    for (const l of LESSONS) {
      const html = renderToStaticMarkup(
        await LessonPage({
          params: Promise.resolve({ stage: l.stageSlug, module: l.moduleSlug, lesson: l.slug }),
        }),
      );
      const start = html.indexOf('id="steps"');
      const steps = html.slice(start, html.indexOf("</section>", start));
      const checks = [...steps.matchAll(/<dd class="inline text-mut">([\s\S]*?)<\/dd>/g)].map((m) => m[1]);
      expect(checks.length, `${l.id} repeats a step check`).toBe(new Set(checks).size);
      for (const step of shownSteps(l)) {
        for (const check of [step.look, step.listen]) {
          if (!UNIVERSAL_LESSON_TEXT.has(check)) expect(checks, l.id).toContain(escape(check));
        }
      }
      for (const mk of l.mistakes) {
        if (!UNIVERSAL_LESSON_TEXT.has(mk.recovery)) expect(html, l.id).toContain(escape(mk.recovery));
      }
    }
  });

  it("leave out a review step only when it restates the self-check", () => {
    const l = LESSONS[0];
    const review = l.steps.find((s) => s.title === REVIEW_STEP_TITLE)!;
    expect(shownSteps(l)).not.toContain(review);
    const own = { ...review, body: "Play both takes back to back and name the one that sounds easier." };
    const rewritten: Lesson = { ...l, steps: l.steps.map((s) => (s === review ? own : s)) };
    expect(shownSteps(rewritten)).toContain(own);
  });

  /**
   * The port's "Name the target: <module skill>" step mostly restated the
   * objective the page prints under its heading; such a step is left out,
   * one that says something of its own stays, and no check is lost with it.
   */
  it("leave out a target step that only repeats the objective", () => {
    let dropped = 0;
    for (const l of LESSONS) {
      const shown = shownSteps(l);
      for (const s of shown) {
        expect(echoesObjective(s, l) ? "" : s.body.trim(), `${l.id}: ${s.title}`).not.toBe(l.objective.trim());
        // No shown target step prints a body the objective starts with.
        if (s.title.startsWith(TARGET_STEP_PREFIX) && !echoesObjective(s, l)) {
          expect(l.objective.trim().startsWith(s.body.trim()), `${l.id}: ${s.title}`).toBe(false);
        }
      }
      dropped += l.steps.length - shown.length;
      const kept = new Set(shown.flatMap((s) => [s.look, s.listen]));
      for (const s of l.steps.filter((x) => x.title.startsWith(TARGET_STEP_PREFIX) && !shown.includes(x))) {
        for (const check of [s.look, s.listen]) {
          if (!UNIVERSAL_LESSON_TEXT.has(check)) expect(kept.has(check), `${l.id} loses "${check}"`).toBe(true);
        }
      }
    }
    expect(dropped).toBeGreaterThan(0);
    const l = LESSONS.find((x) => x.steps.some((s) => s.title.startsWith(TARGET_STEP_PREFIX) && s.body === x.objective))!;
    const target = l.steps.find((s) => s.title.startsWith(TARGET_STEP_PREFIX))!;
    expect(shownSteps(l)).not.toContain(target);
    const own = { ...target, body: "Aim for the same easy start on every note of the pattern." };
    const rewritten: Lesson = { ...l, steps: l.steps.map((s) => (s === target ? own : s)) };
    expect(shownSteps(rewritten)).toContain(own);
    // A step that repeats the objective but carries a check no other step
    // prints stays, so the check is not lost (the page omits its body).
    const checked = { ...target, look: "Your shoulders stay level through the last note." };
    const withCheck: Lesson = { ...l, steps: l.steps.map((s) => (s === target ? checked : s)) };
    expect(echoesObjective(checked, withCheck)).toBe(true);
    expect(shownSteps(withCheck)).toContain(checked);
  });

  /**
   * Self-check objectives add a trailing sentence ("This is a listening and
   * reflection check.", "Judged by ear: ..."), so their target step repeats
   * only the first sentence. That repeat is hidden; a step with its own
   * Look/Listen check stays, printed without the repeated body.
   */
  it("hide a target step body that repeats the objective's first sentence", async () => {
    const escape = (t: string) => renderToStaticMarkup(<>{t}</>);
    for (const id of ["v-l3-m2-07", "v-l5-m2-07", "v-l7-m1-08", "v-l7-m6-08"]) {
      const l = lessonById(id)!;
      const target = l.steps.find((s) => s.title.startsWith(TARGET_STEP_PREFIX))!;
      expect(echoesObjective(target, l), id).toBe(true);
      const shown = shownSteps(l);
      const html = renderToStaticMarkup(
        await LessonPage({
          params: Promise.resolve({ stage: l.stageSlug, module: l.moduleSlug, lesson: l.slug }),
        }),
      );
      if (shown.includes(target)) expect(html, id).toContain(target.title.replace(/&/g, "&amp;"));
      // The subtitle prints the objective; no step repeats its first sentence.
      expect(html, id).toContain(escape(l.objective.trim()));
      expect(html, id).not.toContain(`>${escape(target.body.trim())}</p>`);
    }
    const l = lessonById("v-l3-m2-07")!;
    const target = l.steps.find((s) => s.title.startsWith(TARGET_STEP_PREFIX))!;
    expect(echoesObjective({ ...target, body: "Three vowels" }, l)).toBe(false);
    expect(echoesObjective({ ...target, body: "Three vowels, both directions. Rest a minute between takes." }, l)).toBe(false);
  });

  it("put the practise button before the steps, with the daily allowance where it applies", async () => {
    const at = (html: string, href: string) => html.indexOf(`href="${href.replace(/&/g, "&amp;")}"`);
    for (const l of LESSONS) {
      const html = renderToStaticMarkup(
        await LessonPage({
          params: Promise.resolve({ stage: l.stageSlug, module: l.moduleSlug, lesson: l.slug }),
        }),
      );
      const practice = MODULE_PRACTICE[l.moduleId];
      const companion = lessonCompanion(practice, l.id);
      const steps = html.indexOf('id="steps"');
      const button = at(html, companionHref(companion));
      expect(button, l.id).toBeGreaterThan(-1);
      expect(button, l.id).toBeLessThan(steps);
      // A range test is offered after the warm-up the lessons prescribe.
      if (warmsUpFirst(companion)) {
        const warm = at(html, RANGE_WARM_UP.href);
        expect(warm, l.id).toBeGreaterThan(-1);
        expect(warm, l.id).toBeLessThan(button);
      }
      // The header and the practice panel each say so when they send the
      // singer to guided practice.
      expect(html.includes("data-guided-cap"), l.id).toBe(
        linksGuidedPractice(companion) || linksGuidedPractice(practice.companion),
      );
      expect(html, l.id).not.toMatch(/\bA (?:8|11|18)-minute/);
    }
  });

  it("title every lesson as a voice lesson unless the name alone fills the budget", async () => {
    for (const l of LESSONS) {
      const meta = await lessonMetadata({
        params: Promise.resolve({ stage: l.stageSlug, module: l.moduleSlug, lesson: l.slug }),
      });
      const t = meta.title;
      const text = typeof t === "string" ? t : t && "absolute" in t ? t.absolute : "";
      if (`${l.title} · Voice Lesson`.length <= 60) expect(text, l.id).toMatch(/Voice Lesson$/);
      else expect(text, l.id).toBe(l.title);
    }
  });

  it("describe each stage by its goal, not only its counts", async () => {
    for (const stage of COURSE) {
      if (!stage.slug) continue;
      const meta = await stageMetadata({ params: Promise.resolve({ stage: stage.slug }) });
      expect(String(meta.description).toLowerCase(), stage.catalog.id).toContain(
        stage.catalog.subtitle.toLowerCase(),
      );
    }
  });

  it("link each module page to the glossary terms it trains, and back", async () => {
    const published = new Set(SING_GLOSSARY_TERMS.map((e) => e.term));
    const seen = new Set<string>();
    for (const [id, terms] of Object.entries(MODULE_TERMS)) {
      expect(modules.some((m) => m.id === id), id).toBe(true);
      for (const term of terms) {
        expect(published.has(term), `${id}: ${term} is not in the glossary`).toBe(true);
        expect(seen.has(term), `${term} belongs to two modules`).toBe(false);
        seen.add(term);
      }
    }
    for (const stage of COURSE) {
      for (const mod of stage.modules) {
        const terms = MODULE_TERMS[mod.catalog.id] ?? [];
        if (!mod.slug || terms.length === 0) continue;
        const html = renderToStaticMarkup(
          await ModulePage({ params: Promise.resolve({ stage: stage.slug!, module: mod.slug }) }),
        );
        for (const term of terms) {
          expect(html, mod.catalog.id).toContain(`href="/glossary#${termId(term)}"`);
          expect(courseModuleForTerm(term)?.href).toBe(mod.href);
        }
      }
    }
  });

  /**
   * A cold voice under-reports at both ends, so the learn hub's first week
   * warms up before its range test, as every program day does.
   */
  it("warm up before the learn hub's day-one range test", () => {
    const html = renderToStaticMarkup(<LearnPage />);
    const week = html.slice(html.indexOf("A seven-day learn-to-sing plan"));
    const warm = week.indexOf('href="/warmups?routine=morning"');
    expect(warm).toBeGreaterThan(-1);
    expect(warm).toBeLessThan(week.indexOf('href="/range?mode=range#start"'));
  });

  /**
   * The Your Range lessons say a cold voice under-reports at both ends, so no
   * link on their pages reaches the range test before the warm-up does.
   */
  it("warm up before any range-test link on the Your Range lessons", async () => {
    const range = LESSONS.filter((l) => l.moduleId === "v-l1-m2");
    expect(range.length).toBeGreaterThan(0);
    for (const l of range) {
      const html = renderToStaticMarkup(
        await LessonPage({
          params: Promise.resolve({ stage: l.stageSlug, module: l.moduleSlug, lesson: l.slug }),
        }),
      );
      const warm = html.indexOf(`href="${RANGE_WARM_UP.href}"`);
      expect(warm, l.id).toBeGreaterThan(-1);
      expect(warm, l.id).toBeLessThan(html.indexOf(`href="${companionHref({ room: "range" })}"`));
    }
  });

  /**
   * A lesson practised outside its module's room opens that room first, and
   * the practice panel further down says why it then offers the module's.
   */
  it("explain the module's room on a lesson that practises somewhere else", async () => {
    for (const l of LESSONS) {
      const p = MODULE_PRACTICE[l.moduleId];
      if (!p.lessonCompanion) continue;
      const html = renderToStaticMarkup(
        await LessonPage({
          params: Promise.resolve({ stage: l.stageSlug, module: l.moduleSlug, lesson: l.slug }),
        }),
      );
      const own = p.lessonCompanion[l.id];
      if (own) {
        expect(html, l.id).toContain(`data-lesson-room="${own.room}"`);
        expect(html, l.id).toContain(`You practice this lesson in ${companionLabel(own)}`);
      } else {
        expect(html, l.id).not.toContain("data-lesson-room");
      }
    }
  });

  /**
   * Pain, hoarseness that will not clear, a lost range or blood all need the
   * folds examined, so the hub and the course page name the doctor who can,
   * as the lessons, book and guides do, and never a vaguer clinician.
   */
  it("send worrying symptoms to a doctor who can examine the vocal folds", () => {
    for (const [name, html] of [
      ["learn hub", renderToStaticMarkup(<LearnPage />)],
      ["voice course", renderToStaticMarkup(<VoiceCoursePage />)],
    ]) {
      expect(html, name).toContain(DOCTOR_REFERRAL);
      expect(html, name).not.toMatch(VAGUE_REFERRAL);
    }
  });

  it("are linked from the learn hub by pages that exist", () => {
    const html = renderToStaticMarkup(<LearnPage />);
    const published = new Set([VOICE_LEARN_PATH, ...Object.values(coursePaths()).flat()]);
    const links = hrefs(html).filter((h) => h.startsWith(VOICE_LEARN_PATH));
    expect(links.length).toBeGreaterThan(1);
    for (const href of links) expect(published.has(href.split("#")[0]), href).toBe(true);
  });

  it("say sing measures a module only when the contract says it can", async () => {
    for (const stage of COURSE) {
      for (const mod of stage.modules) {
        if (!mod.slug) continue;
        const html = renderToStaticMarkup(
          await ModulePage({ params: Promise.resolve({ stage: stage.slug!, module: mod.slug }) }),
        );
        const { basis, companion } = MODULE_PRACTICE[mod.catalog.id];
        const kind = basis.kind;
        expect(html).toContain(`data-proof-basis="${kind === "measured" ? "measured" : "self-check"}"`);
        if (kind !== "measured") expect(html).not.toContain("Suede Sing measures part of this");
        // Sent into a room with a daily allowance, or to the warm-up before
        // a range test, the page says so.
        expect(html.includes("data-guided-cap"), mod.catalog.id).toBe(linksGuidedPractice(companion));
        if (warmsUpFirst(companion)) {
          const warm = html.indexOf(`href="${RANGE_WARM_UP.href}"`);
          expect(warm, mod.catalog.id).toBeGreaterThan(-1);
          expect(warm, mod.catalog.id).toBeLessThan(html.indexOf(`href="${companionHref(companion)}"`));
        }
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
