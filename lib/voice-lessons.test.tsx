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
import { EXERCISES } from "@/components/warmups/exercises";
import { MEASUREMENT_WORDS } from "@/components/learn/module-practice";
import { CAPPED_TYPES } from "@/lib/free-cap";
import { SING_GLOSSARY_TERMS, termId } from "@/lib/glossary";
import { LESSONS, type Lesson } from "@/lib/lesson-data";
import { MODULE_TERMS, courseModuleForTerm } from "@/lib/lesson-glossary";
import {
  GUIDED_ACTIVITY,
  MODULE_PRACTICE,
  ROOM_PATHS,
  companionHref,
  companionLabel,
  isGuidedPractice,
  moduleMaterial,
  practiceMatch,
} from "@/lib/lesson-practice";
import { SITE_URL } from "@/lib/site";
import { voiceCurriculum } from "@/lib/voice-curriculum";
import {
  COURSE,
  REVIEW_STEP_TITLE,
  UNIVERSAL_LESSON_TEXT,
  VOICE_LEARN_PATH,
  coursePaths,
  lessonHref,
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
      if (/\bpain\b|hoarse|clinician|pathologist/i.test(ifNotReady)) {
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
   * The lesson page's first button opens the module's room. A book's contents
   * page is not somewhere to sing a phrase two ways and record it, and the
   * live analyzer is not the Pro "take analysis" of recorded takes.
   */
  it("sends every module to a room it can be practised in, named as the site names it", () => {
    for (const [id, { companion }] of Object.entries(MODULE_PRACTICE)) {
      expect(["atlas", "glossary", "singers", "programs", "progress"], id).not.toContain(companion.room);
      expect(companionLabel(companion), id).not.toMatch(/take analysis/i);
    }
    expect(companionLabel({ room: "analyze" })).toBe("the voice analyzer");
  });

  it("never sends the passaggio module to the range test, which shows no passaggio", () => {
    for (const [id, { basis, companion }] of Object.entries(MODULE_PRACTICE)) {
      if (basis.kind === "selfCheck" && basis.missing === "passaggioPitches") {
        expect(companion.room, id).not.toBe("range");
      }
    }
  });

  it("knows which rooms draw on the free daily allowance, as the cap counts them", () => {
    expect([...GUIDED_ACTIVITY].sort()).toEqual([...CAPPED_TYPES].sort());
    expect(isGuidedPractice({ room: "warmups" })).toBe(true);
    expect(isGuidedPractice({ room: "breath", param: "drill", value: "sustain" })).toBe(true);
    for (const room of ["studio", "range", "recorder", "analyze", "tools", "atlas"]) {
      expect(isGuidedPractice({ room }), room).toBe(false);
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
      if (l.type === "concept") expect(html, l.id).toContain("data-lesson-answer");
      for (const step of shownSteps(l)) expect(html).toContain(step.title.replace(/&/g, "&amp;"));
      // Hoarseness that will not clear needs the folds examined, so the
      // lessons name the doctor who can, as the book and guides do, and never
      // offer a speech-language pathologist as the alternative to one.
      expect(html, l.id).not.toMatch(
        /doctor or (?:a )?speech-language pathologist|seek an ENT or voice-specialized/,
      );
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
      expect(html, l.id).toContain(escape(l.selfCheck.ifNotReady));
    }
    const course = renderToStaticMarkup(<VoiceCoursePage />);
    expect(course).toContain("data-course-rules");
    expect(course).toMatch(/Unless a self-check says otherwise, it is ready when you can\s+describe the result/);
    expect(course).toContain("never as a pass");
    // The disclosure the shared Listen line carried on every lesson.
    expect(course).toMatch(/Reference notes are synthesized pitches, not recordings of a\s+singer/);
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

  it("put the practise button before the steps, with the daily allowance where it applies", async () => {
    for (const l of LESSONS) {
      const html = renderToStaticMarkup(
        await LessonPage({
          params: Promise.resolve({ stage: l.stageSlug, module: l.moduleSlug, lesson: l.slug }),
        }),
      );
      const { companion } = MODULE_PRACTICE[l.moduleId];
      const button = html.indexOf(`href="${companionHref(companion).replace(/&/g, "&amp;")}"`);
      expect(button, l.id).toBeGreaterThan(-1);
      expect(button, l.id).toBeLessThan(html.indexOf('id="steps"'));
      expect(html.includes("data-guided-cap"), l.id).toBe(isGuidedPractice(companion));
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

  it("are linked from the learn hub by pages that exist", () => {
    const html = renderToStaticMarkup(<LearnPage />);
    const published = new Set([VOICE_LEARN_PATH, ...Object.values(coursePaths()).flat()]);
    const links = hrefs(html).filter((h) => h.startsWith(VOICE_LEARN_PATH));
    expect(links.length).toBeGreaterThan(1);
    for (const href of links) expect(published.has(href), href).toBe(true);
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
        // Sent into a room with a daily allowance, the page says so.
        expect(html.includes("data-guided-cap"), mod.catalog.id).toBe(isGuidedPractice(companion));
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
