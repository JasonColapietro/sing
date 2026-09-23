/**
 * Port GuitarHub's voice lesson bodies into content/lessons/*.md.
 *
 * Usage: node scripts/port-voice-lessons.mjs --from=/path/to/suede-guitar-hub [--stage=1]
 *
 * A one-way port, run once per stage batch. Afterwards the markdown in
 * content/lessons is the source and this script only documents where it came
 * from: `lib/learning/data/voice-instruction.json` in
 * JasonColapietro/suede-guitar-hub (#47), keyed by the catalog's lesson IDs in
 * contracts/suede-voice-curriculum.json. Re-running overwrites the markdown, so
 * don't run it after a lesson has been edited here.
 *
 * The text is copied, not rewritten. The only changes are the substitutions in
 * `UI_SUBSTITUTIONS`: GuitarHub renders a lesson inside its own practice panel,
 * with a per-lesson recorder and a saved self-check, and sentences that point at
 * that panel would point at nothing on sing. Each one is swapped for the
 * equivalent on a sing lesson page, where the practice material links into
 * sing's own rooms, songs and book. Every substitution must match at least
 * once, so a GuitarHub copy edit can't silently leave a stale phrase behind.
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const arg = (name) =>
  process.argv.find((a) => a.startsWith(`--${name}=`))?.slice(name.length + 3);

const FROM = arg("from");
if (!FROM) {
  console.error("usage: node scripts/port-voice-lessons.mjs --from=/path/to/suede-guitar-hub [--stage=N]");
  process.exit(2);
}
const ONLY_STAGE = arg("stage") ? Number(arg("stage")) : null;

const source = JSON.parse(
  readFileSync(join(FROM, "lib/learning/data/voice-instruction.json"), "utf8"),
);
const catalog = JSON.parse(
  readFileSync(join(ROOT, "contracts/suede-voice-curriculum.json"), "utf8"),
).curriculum;

/** Lowercase, ASCII, hyphenated. Used once, at port time; the slugs are then fixed. */
export function slugify(text) {
  return text
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * GuitarHub-panel phrases and their sing equivalents. `[pattern, replacement]`,
 * applied to every string in order.
 */
const UI_SUBSTITUTIONS = [
  [/^Use your included practice material$/, "Use the practice material"],
  [/Open Practice material and (choose|read) /g, "Open the practice material on this page and $1 "],
  [/Choose (.+?) in Practice material/g, "Choose $1 in the practice material on this page"],
  [/Open your included Practice material\./g, "Open the practice material."],
  // Readings on sing are book or atlas chapters, and most of them are part of
  // Suede Pro. The practice material marks which; this sentence must not
  // promise that no purchase is needed.
  [/The reading (.+?) is included here; no separate purchase is needed\./g, "The reading $1 is listed there too."],
  [/The study or chapter is open in this lesson\./g, "The exercise, song or chapter is open."],
  // GuitarHub keeps one take per lesson. sing's recorder is its own room.
  [/ Saving a new take replaces this lesson’s previous recording\./g, " Record your takes in the recorder."],
  [/; saving a new take replaces this lesson’s previous recording\./g, "; record your takes in the recorder."],
  [/Saving a self-check records your reflection, not an automatic vocal score\./g, "A self-check is your own reflection, not an automatic vocal score."],
  [/ Completion records your own practice reflection\./g, " Completion is your own practice reflection."],
  [/ Completion is recorded, while access remains available\./g, ""],
  // sing has no guitar track to share a ladder with.
  [/ The same ladder the Guitar track climbs\./g, ""],
  [/This native study supplies/g, "This study supplies"],
  // GuitarHub shows the study as fixed notation. sing's rooms draw your pitch
  // against the targets, so "not a trace of your voice" would be false here.
  [/; the displayed notes are reference targets, not a trace of your voice\./g, "; the displayed notes are the targets to aim for."],
  [/; the reference display does not track your singing\./g, "; judge it by ear, not by the display."],
];
const substitutionHits = UI_SUBSTITUTIONS.map(() => 0);

function adaptUi(text) {
  let out = text;
  UI_SUBSTITUTIONS.forEach(([pattern, replacement], i) => {
    const next = out.replace(pattern, replacement);
    if (next !== out) substitutionHits[i] += 1;
    out = next;
  });
  if (/Practice material|GuitarHub|Guitar track|no separate purchase/.test(out)) {
    throw new Error(`unported GuitarHub phrase left in: ${out}`);
  }
  return out;
}

/** One line of frontmatter. Values are JSON strings, so quotes and colons survive. */
const fm = (key, value) => `${key}: ${JSON.stringify(value)}`;

function lessonMarkdown(lesson, source) {
  const { level, module } = source;
  // sing's catalog may retitle a lesson (a "Checkpoint:" that measures nothing
  // became a "Self-Check:"). The body quotes its own title, so it follows.
  const retitle = (text) =>
    lesson.title === source.lesson.title ? text : text.split(lesson.title).join(source.lesson.title);
  const adapt = (text) => adaptUi(retitle(text));
  const entry = source;
  const lines = [
    "---",
    fm("id", lesson.id),
    fm("module", module.id),
    fm("stage", level.id),
    fm("title", entry.lesson.title),
    fm("type", entry.lesson.type),
    fm("minutes", entry.lesson.minutes),
    fm("objective", adapt(lesson.objective)),
    fm("prerequisites", lesson.prerequisiteLessonIds.join(",")),
    fm("references", lesson.referenceIds.join(",")),
    fm("source", "suede-guitar-hub lib/learning/data/voice-instruction.json (#47)"),
    "---",
    "",
    "## Steps",
    "",
  ];
  for (const step of lesson.steps) {
    lines.push(`### ${adapt(step.title)}`, "", adapt(step.action), "");
    lines.push(`- Look: ${adapt(step.lookCheck)}`);
    lines.push(`- Listen: ${adapt(step.listenCheck)}`, "");
  }
  lines.push("## If it goes wrong", "");
  for (const m of lesson.mistakeRecovery) {
    lines.push(`- ${adapt(m.observation)} => ${adapt(m.recovery)}`);
  }
  lines.push("", "## Practice blocks", "");
  for (const s of lesson.practiceSegments) {
    lines.push(`- ${s.seconds}s: ${adapt(s.instruction)}`);
  }
  const a = lesson.selfAssessment;
  lines.push("", "## Self-check", "");
  for (const c of a.criteria) lines.push(`- ${adapt(c)}`);
  lines.push(
    "",
    `Ready when: ${adapt(a.readyWhen)}`,
    "",
    `If not ready: ${adapt(a.ifNotReady)}`,
    "",
    `What this shows: ${adapt(a.proves)}`,
    "",
    `What this does not show: ${adapt(a.doesNotProve)}`,
    "",
  );
  return lines.join("\n");
}

const index = new Map();
for (const level of catalog.levels) {
  for (const mod of level.modules) {
    for (const lesson of mod.lessons) index.set(lesson.id, { level, module: mod, lesson });
  }
}

let written = 0;
for (const lesson of source.lessons) {
  const entry = index.get(lesson.id);
  if (!entry) throw new Error(`${lesson.id} is not in the catalog`);
  if (ONLY_STAGE !== null && entry.level.stage !== ONLY_STAGE) continue;
  const dir = join(
    ROOT,
    "content/lessons",
    slugify(entry.level.name),
    slugify(entry.module.name),
  );
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, `${slugify(entry.lesson.title)}.md`), lessonMarkdown(lesson, entry));
  written += 1;
}

// The two external sources the lessons cite, copied as they are.
writeFileSync(
  join(ROOT, "content/lessons/references.json"),
  JSON.stringify(source.references, null, 2) + "\n",
);

console.log(`ported ${written} lessons`);
if (ONLY_STAGE === null) {
  const unused = UI_SUBSTITUTIONS.filter((_, i) => substitutionHits[i] === 0);
  if (unused.length) {
    console.error(`substitutions that matched nothing:\n${unused.map(([p]) => `  ${p}`).join("\n")}`);
    process.exitCode = 1;
  }
}
