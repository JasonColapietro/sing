/**
 * Compile content/lessons/<stage>/<module>/<lesson>.md into lib/lesson-data.ts.
 *
 * Usage: node scripts/compile-lessons.mjs [content/lessons] [--check]
 *
 * `--check` writes nothing and fails when lib/lesson-data.ts is stale
 * (lib/voice-lessons.test.tsx runs it). A lesson has fixed sections (steps
 * with Look/Listen lines, recoveries, timed blocks, a self-check, and for a
 * concept lesson a leading "## In short" of at most IN_SHORT_MAX_WORDS);
 * a missing one fails the compile. Directory names are the URL slugs, kept
 * fixed; identity is the frontmatter `id` from contracts/suede-voice-curriculum.json.
 *
 * Sentences the port repeats on more than half the lessons (step bodies,
 * block instructions, the self-check's ifNotReady / shows / doesNotShow) are
 * dropped here; /learn/voice states them once as the course rules.
 */
import { readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const CHECK = process.argv.includes("--check");
const SRC = process.argv.slice(2).find((a) => !a.startsWith("--")) ?? "content/lessons";
const catalog = JSON.parse(
  readFileSync(new URL("../contracts/suede-voice-curriculum.json", import.meta.url), "utf8"),
).curriculum;

const problems = [];
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
/** "In short" is the page's answer and its search description; longer than this it is an essay. */
const IN_SHORT_MAX_WORDS = 80;

function parseFrontmatter(raw, file) {
  const m = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/.exec(raw);
  if (!m) throw new Error(`${file}: missing frontmatter`);
  const meta = {};
  for (const line of m[1].split("\n")) {
    const kv = /^(\w+):\s*(.*)$/.exec(line.trim());
    if (!kv) continue;
    meta[kv[1]] = JSON.parse(kv[2]);
  }
  return { meta, body: m[2] };
}

/** `## Heading` → its lines, in order. */
function sections(body, file) {
  const out = new Map();
  let current = null;
  for (const line of body.split("\n")) {
    const h = /^## (.+)$/.exec(line);
    if (h) {
      current = h[1].trim();
      if (out.has(current)) throw new Error(`${file}: duplicate section "${current}"`);
      out.set(current, []);
    } else if (current) {
      out.get(current).push(line);
    } else if (line.trim()) {
      throw new Error(`${file}: text before the first section`);
    }
  }
  return out;
}

const bullets = (lines) =>
  lines.filter((l) => l.startsWith("- ")).map((l) => l.slice(2).trim());

/** `Label: text` paragraphs, e.g. "Ready when: …". */
function labelled(lines, label, file) {
  const hit = lines.find((l) => l.startsWith(`${label}: `));
  if (!hit) throw new Error(`${file}: self-check has no "${label}:"`);
  return hit.slice(label.length + 2).trim();
}

function parseSteps(lines, file) {
  const steps = [];
  let step = null;
  for (const line of lines) {
    const h = /^### (.+)$/.exec(line);
    if (h) {
      step = { title: h[1].trim(), body: [], look: "", listen: "" };
      steps.push(step);
    } else if (!step) {
      if (line.trim()) throw new Error(`${file}: step text before a step heading`);
    } else if (line.startsWith("- Look: ")) {
      step.look = line.slice(8).trim();
    } else if (line.startsWith("- Listen: ")) {
      step.listen = line.slice(10).trim();
    } else if (line.trim()) {
      step.body.push(line.trim());
    }
  }
  for (const s of steps) {
    if (!s.body.length || !s.look || !s.listen) {
      throw new Error(`${file}: step "${s.title}" needs a body, a Look and a Listen line`);
    }
    s.body = s.body.join("\n\n");
  }
  return steps;
}

function parseLesson(raw, file) {
  const { meta, body } = parseFrontmatter(raw, file);
  const s = sections(body, file);
  const need = (name) => {
    if (!s.has(name)) throw new Error(`${file}: missing "## ${name}"`);
    return s.get(name);
  };
  const expected = ["In short", "Steps", "If it goes wrong", "Practice blocks", "Self-check"];
  const unknown = [...s.keys()].filter((k) => !expected.includes(k));
  if (unknown.length) throw new Error(`${file}: unknown section(s) ${unknown.join(", ")}`);
  const short = s.get("In short");
  if (short) {
    if ([...s.keys()][0] !== "In short") throw new Error(`${file}: "## In short" must be the first section`);
    // One plain paragraph: it is also the structured-data description.
    if (short.some((l) => /^\s*(?:#|[-*] |\d+\. )|\]\(|\*\*|`/.test(l))) {
      throw new Error(`${file}: "## In short" is one plain paragraph, with no headings, lists, links or emphasis`);
    }
    if (!short.some((l) => l.trim())) throw new Error(`${file}: "## In short" is empty`);
    const words = short.join(" ").split(/\s+/).filter(Boolean).length;
    if (words > IN_SHORT_MAX_WORDS) {
      throw new Error(`${file}: "## In short" is ${words} words; the cap is ${IN_SHORT_MAX_WORDS}`);
    }
  }

  const mistakes = bullets(need("If it goes wrong")).map((b) => {
    const [observation, recovery] = b.split(" => ");
    if (!observation || !recovery) throw new Error(`${file}: a recovery needs "observation => recovery"`);
    return { observation: observation.trim(), recovery: recovery.trim() };
  });
  const blocks = bullets(need("Practice blocks")).map((b) => {
    const m = /^(\d+)s: (.+)$/.exec(b);
    if (!m) throw new Error(`${file}: a practice block needs "<seconds>s: instruction"`);
    return { seconds: Number(m[1]), instruction: m[2].trim() };
  });
  const check = need("Self-check");

  return {
    meta,
    explanation: (short ?? []).map((l) => l.trim()).filter(Boolean).join(" "),
    steps: parseSteps(need("Steps"), file),
    mistakes,
    blocks,
    selfCheck: {
      criteria: bullets(check),
      readyWhen: labelled(check, "Ready when", file),
      ifNotReady: labelled(check, "If not ready", file),
      shows: labelled(check, "What this shows", file),
      doesNotShow: labelled(check, "What this does not show", file),
    },
  };
}

const catalogLessons = new Map();
for (const level of catalog.levels) {
  for (const mod of level.modules) {
    mod.lessons.forEach((lesson, index) =>
      catalogLessons.set(lesson.id, { level, module: mod, lesson, index }),
    );
  }
}

const dirs = (p) => readdirSync(p).filter((d) => statSync(join(p, d)).isDirectory()).sort();
const lessons = [];
const stageSlugs = new Map();
const moduleSlugs = new Map();

for (const stageSlug of dirs(SRC)) {
  for (const moduleSlug of dirs(join(SRC, stageSlug))) {
    const dir = join(SRC, stageSlug, moduleSlug);
    for (const name of readdirSync(dir).filter((f) => f.endsWith(".md")).sort()) {
      const file = join(dir, name);
      const slug = name.replace(/\.md$/, "");
      let parsed;
      try {
        parsed = parseLesson(readFileSync(file, "utf8"), file);
      } catch (e) {
        problems.push(e.message);
        continue;
      }
      const { meta } = parsed;
      const entry = catalogLessons.get(meta.id);
      if (!entry) {
        problems.push(`${file}: ${meta.id} is not a lesson in the catalog`);
        continue;
      }
      const { level, module, lesson, index } = entry;
      for (const s of [stageSlug, moduleSlug, slug]) {
        if (!SLUG.test(s)) problems.push(`${file}: "${s}" is not a URL slug`);
      }
      if (meta.module !== module.id || meta.stage !== level.id) {
        problems.push(`${file}: filed as ${meta.stage}/${meta.module}, catalog says ${level.id}/${module.id}`);
      }
      // The module list and the lesson's objective are one catalog sentence.
      for (const [key, catalogKey] of [
        ["title", "title"],
        ["type", "type"],
        ["minutes", "minutes"],
        ["objective", "summary"],
      ]) {
        if (meta[key] !== lesson[catalogKey]) {
          problems.push(`${file}: ${key} ${JSON.stringify(meta[key])} differs from the catalog's ${JSON.stringify(lesson[catalogKey])}`);
        }
      }
      // One directory per stage and per module, in both directions.
      if ((stageSlugs.get(level.id) ?? stageSlug) !== stageSlug) problems.push(`${file}: ${level.id} is split across directories`);
      if ((moduleSlugs.get(module.id) ?? moduleSlug) !== moduleSlug) problems.push(`${file}: ${module.id} is split across directories`);
      stageSlugs.set(level.id, stageSlug);
      moduleSlugs.set(module.id, moduleSlug);

      const seconds = parsed.blocks.reduce((n, b) => n + b.seconds, 0);
      if (seconds !== lesson.minutes * 60) {
        problems.push(`${file}: practice blocks add up to ${seconds}s, the lesson is ${lesson.minutes} min`);
      }
      if (!parsed.steps.length) problems.push(`${file}: no steps`);
      if (!parsed.selfCheck.criteria.length) problems.push(`${file}: no self-check criteria`);
      // A concept lesson answers its title in words before any steps.
      if (meta.type === "concept" && !parsed.explanation) {
        problems.push(`${file}: a concept lesson needs "## In short"`);
      }

      lessons.push({
        id: meta.id,
        stageId: level.id,
        moduleId: module.id,
        stageSlug,
        moduleSlug,
        slug,
        order: [level.stage, level.modules.indexOf(module), index],
        title: meta.title,
        type: meta.type,
        minutes: meta.minutes,
        objective: meta.objective,
        explanation: parsed.explanation,
        prerequisites: meta.prerequisites ? meta.prerequisites.split(",") : [],
        references: meta.references ? meta.references.split(",") : [],
        steps: parsed.steps,
        mistakes: parsed.mistakes,
        blocks: parsed.blocks,
        selfCheck: parsed.selfCheck,
      });
    }
  }
}

const seen = new Set();
for (const l of lessons) {
  if (seen.has(l.id)) problems.push(`${l.id} appears twice`);
  seen.add(l.id);
}
const cmp = (a, b) => a.order[0] - b.order[0] || a.order[1] - b.order[1] || a.order[2] - b.order[2];
lessons.sort(cmp);
for (const l of lessons) {
  for (const p of l.prerequisites) {
    if (!catalogLessons.has(p)) problems.push(`${l.id}: prerequisite ${p} is not in the catalog`);
  }
  delete l.order;
}

/** Sentences, split after a terminal mark before a capital or an opening quote. */
const sentences = (text) => text.split(/(?<=[.!?])\s+(?=[A-Z“"(])/).filter(Boolean);

/** The port's block template with the lesson's own title and target blanked, so each counts as one line. */
function blockShape(instruction, title) {
  return instruction
    .replaceAll(`“${title}”`, "“TITLE”")
    .replace(/^Isolate the .+ target in short, comfortable examples\.$/, "Isolate the TARGET target in short, comfortable examples.");
}

/**
 * Lines repeated word for word on more than half the lessons are scaffolding
 * from the port, not the lesson; drop them from the fields the page prints
 * whole. A block whose instruction was the template keeps its seconds and an
 * empty instruction, and the page draws the four as one timing line.
 */
function dropSharedLines(all) {
  const counts = new Map();
  const tally = (lines) => {
    for (const line of new Set(lines)) counts.set(line, (counts.get(line) ?? 0) + 1);
  };
  for (const l of all) {
    tally([
      ...l.steps.flatMap((s) => s.body.split("\n\n").flatMap(sentences)),
      ...l.blocks.map((b) => blockShape(b.instruction, l.title)),
      ...sentences(l.selfCheck.ifNotReady),
      ...sentences(l.selfCheck.shows),
      ...sentences(l.selfCheck.doesNotShow),
    ]);
  }
  const shared = (line) => (counts.get(line) ?? 0) > all.length / 2;
  const keep = (text) =>
    text
      .split("\n\n")
      .map((p) => sentences(p).filter((x) => !shared(x)).join(" "))
      .filter(Boolean)
      .join("\n\n");
  for (const l of all) {
    l.steps = l.steps.map((s) => ({ ...s, body: keep(s.body) })).filter((s) => s.body);
    l.blocks = l.blocks.map((b) => ({
      seconds: b.seconds,
      instruction: shared(blockShape(b.instruction, l.title)) ? "" : b.instruction,
    }));
    l.selfCheck = {
      ...l.selfCheck,
      ifNotReady: keep(l.selfCheck.ifNotReady),
      shows: keep(l.selfCheck.shows),
      doesNotShow: keep(l.selfCheck.doesNotShow),
    };
  }
}
dropSharedLines(lessons);

const references = JSON.parse(readFileSync(join(SRC, "references.json"), "utf8"));
const referenceIds = new Set(references.map((r) => r.id));
for (const l of lessons) {
  for (const r of l.references) {
    if (!referenceIds.has(r)) problems.push(`${l.id}: unknown reference ${r}`);
  }
}

const out = `/**
 * GENERATED FILE — edit the markdown under content/lessons and re-run scripts/compile-lessons.mjs.
 *
 * The voice curriculum's lesson bodies, keyed to the lesson IDs in
 * contracts/suede-voice-curriculum.json. Lines the port repeated on most
 * lessons are dropped at compile time; /learn/voice states them once.
 */

export interface LessonStep {
  title: string;
  /** Markdown paragraphs. */
  body: string;
  /** What to check with your eyes. */
  look: string;
  /** What to check by ear. */
  listen: string;
}

export interface Lesson {
  /** The catalog ID, e.g. "v-l1-m1-01". */
  id: string;
  stageId: string;
  moduleId: string;
  /** URL segments: /learn/voice/<stageSlug>/<moduleSlug>/<slug>. */
  stageSlug: string;
  moduleSlug: string;
  slug: string;
  title: string;
  type: string;
  minutes: number;
  objective: string;
  /** Plain answer to the title, from "## In short"; empty until one is written. */
  explanation: string;
  /** Lesson IDs. */
  prerequisites: string[];
  /** IDs in LESSON_REFERENCES. */
  references: string[];
  steps: LessonStep[];
  mistakes: Array<{ observation: string; recovery: string }>;
  /** Timed blocks that add up to \`minutes\`; an empty instruction is the port's template, drawn as timing only. */
  blocks: Array<{ seconds: number; instruction: string }>;
  selfCheck: {
    criteria: string[];
    readyWhen: string;
    ifNotReady: string;
    /** May be empty once the shared lines are dropped. */
    shows: string;
    doesNotShow: string;
  };
}

export interface LessonReference {
  id: string;
  title: string;
  url: string;
  supports: string;
}

export const LESSON_REFERENCES: LessonReference[] = ${JSON.stringify(references, null, 2)};

/** In catalog order. */
export const LESSONS: Lesson[] = ${JSON.stringify(lessons, null, 2)};
`;

/** Where every catalog ID lives on sing; GuitarHub vendors this and redirects from it. */
const byId = (entries) => Object.fromEntries(entries.sort(([a], [b]) => a.localeCompare(b)));
const urls = {
  contract: "suede-voice-lesson-urls",
  version: 1,
  note:
    "Generated by scripts/compile-lessons.mjs from content/lessons. Do not hand-edit. " +
    "Paths are relative to origin. A catalog ID missing here has no page on sing yet.",
  origin: "https://sing.suedeai.ai",
  course: "/learn/voice",
  stages: byId([...stageSlugs].map(([id, slug]) => [id, `/learn/voice/${slug}`])),
  modules: byId(
    lessons
      .filter((l, i, all) => all.findIndex((x) => x.moduleId === l.moduleId) === i)
      .map((l) => [l.moduleId, `/learn/voice/${l.stageSlug}/${l.moduleSlug}`]),
  ),
  lessons: byId(lessons.map((l) => [l.id, `/learn/voice/${l.stageSlug}/${l.moduleSlug}/${l.slug}`])),
};

const outputs = [
  [new URL("../lib/lesson-data.ts", import.meta.url), out],
  [new URL("../contracts/suede-voice-lesson-urls.json", import.meta.url), JSON.stringify(urls, null, 2) + "\n"],
];
for (const [target, text] of outputs) {
  const name = target.pathname.split("/").slice(-2).join("/");
  if (CHECK) {
    let current = "";
    try {
      current = readFileSync(target, "utf8");
    } catch {
      // Missing counts as stale.
    }
    if (current !== text) problems.push(`${name} is stale: run node scripts/compile-lessons.mjs`);
  } else if (!problems.length) {
    writeFileSync(target, text);
  }
}
if (!CHECK && problems.length) {
  // Leave the last good output in place.
  console.log("not writing lib/lesson-data.ts or the URL map: the lessons failed validation");
} else {
  console.log(
    `${CHECK ? "checked" : "wrote"} lib/lesson-data.ts and contracts/suede-voice-lesson-urls.json: ${lessons.length} of ${catalogLessons.size} lessons`,
  );
}
if (problems.length) {
  console.log(`\n${problems.length} problems:`);
  for (const p of problems) console.log(`  - ${p}`);
  process.exitCode = 1;
}
