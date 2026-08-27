/**
 * Compile content/atlas/*.md + data/singers/*.json into lib/atlas-data.ts.
 *
 * Usage: node scripts/compile-atlas.mjs
 *
 * The Voice Atlas is the second book: method chapters up front, then genre
 * chapters whose bodies are an intro essay followed by structured singer
 * entries generated from the same batches that build the singer pages. Chapter
 * metadata (and each chapter's roster of singers) is free and feeds the
 * contents page; intro bodies and entry prose are served only through the
 * subscription gate, except the chapters in FREE_CHAPTER_ORDERS, which render
 * in full on their own pages as the book's free sample.
 *
 * Run scripts/compile-singers.mjs first — it owns validation of the batches.
 * This script trusts them and only re-derives what it needs.
 */
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const CONTENT = "content/atlas";
const DATA = "data/singers";

export const ATLAS_TITLE = "The Voice Atlas";
export const ATLAS_SUBTITLE =
  "Who sings what, how it sounds, and how to borrow it — the range, tone and technique of every voice in the library.";

/* ---------------------------------------------------------------- singers */

const LETTER_PC = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };

export function labelToMidi(label) {
  const m = /^([A-Ga-g])([#b♯♭]?)(-?\d)$/.exec(String(label).trim());
  if (!m) return null;
  let pc = LETTER_PC[m[1].toUpperCase()];
  if (m[2] === "#" || m[2] === "♯") pc += 1;
  if (m[2] === "b" || m[2] === "♭") pc -= 1;
  return (parseInt(m[3], 10) + 1) * 12 + pc;
}

function slugify(name) {
  return name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/['’.]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Which chapter each curated batch file belongs to. */
const FILE_GROUPS = {
  "country.json": "country",
  "gospel-acapella.json": "gospel",
  "grunge-alt.json": "grunge-alt",
  "indie-songwriter.json": "folk",
  "jazz-standards.json": "jazz",
  "kpop-jpop-global.json": "global-pop",
  "latin.json": "latin",
  "metal.json": "metal",
  "musical-theatre.json": "musical-theatre",
  "opera.json": "opera",
  "pop-men.json": "pop-men",
  "pop-women-classic.json": "pop-women-classic",
  "pop-women-modern.json": "pop-women-modern",
  "reggae-afro-world.json": "afro",
  "rock-men-classic.json": "rock-men",
  "rock-women.json": "rock-women",
  "soul-men.json": "soul-men",
  "soul-women.json": "soul-women",
  // The 2026-08 expansion batches. Mostly chapter-homogeneous; the handful
  // of entries that belong elsewhere are re-homed in ASSIGN below.
  "country-2.json": "country",
  "global-2.json": "global-pop",
  "rnb-women-2.json": "rnb-modern",
  "rock-legends.json": "rock-men",
};

/** The gap batches are grab-bags, so every singer in them is placed by hand. */
const ASSIGN = {
  // gap-1
  "elvis-presley": "rock-men",
  "axl-rose": "rock-men",
  "roy-orbison": "rock-men",
  "rod-stewart": "rock-men",
  "jon-bon-jovi": "rock-men",
  bono: "rock-men",
  sting: "rock-men",
  "phil-collins": "rock-men",
  "little-richard": "rock-men",
  "matt-bellamy": "rock-men",
  "brendon-urie": "pop-men",
  "billie-joe-armstrong": "grunge-alt",
  "tina-turner": "rock-women",
  "avril-lavigne": "rock-women",
  // gap-2
  "ray-charles": "soul-men",
  "lionel-richie": "soul-men",
  "john-legend": "soul-men",
  "teddy-swims": "rnb-modern",
  "alicia-keys": "soul-women",
  sza: "rnb-modern",
  "sam-smith": "pop-men",
  "adam-lambert": "pop-men",
  "lewis-capaldi": "pop-men",
  "benson-boone": "pop-men",
  lizzo: "pop-women-modern",
  "sabrina-carpenter": "pop-women-modern",
  "chappell-roan": "pop-women-modern",
  lorde: "pop-women-modern",
  // gap-3
  "dusty-springfield": "soul-women",
  "judy-garland": "musical-theatre",
  "aulii-cravalho": "musical-theatre",
  "tom-jones": "pop-men",
  "mario-lanza": "opera",
  "martina-mcbride": "country",
  "leann-rimes": "country",
  "lata-mangeshkar": "global-pop",
  "arijit-singh": "global-pop",
  // gap-4
  "britney-spears": "pop-women-modern",
  "selena-gomez": "pop-women-modern",
  halsey: "pop-women-modern",
  "camila-cabello": "pop-women-modern",
  "tate-mcrae": "pop-women-modern",
  "gracie-abrams": "pop-women-modern",
  "charli-xcx": "pop-women-modern",
  "ellie-goulding": "pop-women-modern",
  "tori-kelly": "pop-women-modern",
  "loren-allred": "musical-theatre",
  faouzia: "pop-women-modern",
  "renee-rapp": "pop-women-modern",
  kehlani: "rnb-modern",
  "doja-cat": "pop-women-modern",
  // gap-5
  zayn: "pop-men",
  "troye-sivan": "pop-men",
  "conan-gray": "pop-men",
  "patrick-stump": "grunge-alt",
  "damiano-david": "rock-men",
  morrissey: "grunge-alt",
  "dave-gahan": "grunge-alt",
  "robert-smith": "grunge-alt",
  "ian-curtis": "grunge-alt",
  "peter-gabriel": "rock-men",
  "joe-cocker": "rock-men",
  "till-lindemann": "metal",
  "alex-warren": "pop-men",
  "myles-smith": "pop-men",
  sombr: "pop-men",
  "gigi-perez": "folk",
  "dimash-kudaibergen": "global-pop",
  // gap-6
  "frank-ocean": "rnb-modern",
  her: "rnb-modern",
  "summer-walker": "rnb-modern",
  giveon: "rnb-modern",
  "daniel-caesar": "rnb-modern",
  "steve-lacy": "rnb-modern",
  miguel: "rnb-modern",
  "chris-brown": "rnb-modern",
  "t-pain": "rnb-modern",
  "andra-day": "soul-women",
  yebba: "soul-women",
  "anderson-paak": "rnb-modern",
  "leon-bridges": "soul-men",
  "samara-joy": "jazz",
  laufey: "jazz",
  "musiq-soulchild": "soul-men",
  // gap-7
  "morgan-wallen": "country",
  "luke-combs": "country",
  "zach-bryan": "country",
  "jelly-roll": "country",
  "noah-kahan": "folk",
  // gap-8
  "christian-nodal": "latin",
  "peso-pluma": "latin",
  "kali-uchis": "latin",
  "omar-apollo": "latin",
  "enrique-iglesias": "latin",
  rema: "afro",
  "ayra-starr": "afro",
  tyla: "afro",
  "fujii-kaze": "global-pop",
  "juan-diego-florez": "opera",
  stromae: "global-pop",
  // rock-legends.json exceptions
  "neil-diamond": "pop-men",
  "barry-manilow": "pop-men",
  "brian-wilson": "pop-men",
  "christopher-cross": "pop-men",
  "daryl-hall": "soul-men",
  "michael-mcdonald": "soul-men",
  // rnb-women-2.json exceptions
  "janet-jackson": "pop-women-classic",
  monica: "soul-women",
  fantasia: "soul-women",
  "macy-gray": "soul-women",
  indiaarie: "soul-women",
  // global-2.json exceptions — the Latin lane
  "julio-iglesias": "latin",
  "cristian-castro": "latin",
  "luis-fonsi": "latin",
  maluma: "latin",
  "rauw-alejandro": "latin",
  ozuna: "latin",
  "angela-aguilar": "latin",
  "carin-leon": "latin",
  "alejandro-fernandez": "latin",
  "jenni-rivera": "latin",
};

/** Build every chapter from the markdown + batches. Shared with the PDF script. */
export function buildAtlas() {
const problems = [];
const seen = new Map(); // slug -> entry with group

for (const file of readdirSync(DATA).filter((f) => f.endsWith(".json")).sort()) {
  const rows = JSON.parse(readFileSync(join(DATA, file), "utf8"));
  for (const r of rows) {
    const slug = slugify(r.name);
    if (seen.has(slug)) continue; // compile-singers.mjs keeps the first too
    const lowMidi = labelToMidi(r.lowNote);
    const highMidi = labelToMidi(r.highNote);
    if (lowMidi == null || highMidi == null) continue; // compile-singers reports it
    const group = FILE_GROUPS[file] ?? ASSIGN[slug];
    if (!group) {
      problems.push(`${file} → ${r.name}: no chapter assignment for "${slug}"`);
      continue;
    }
    seen.set(slug, {
      slug,
      name: r.name.trim(),
      voiceType: r.voiceType,
      country: String(r.country ?? "").trim() || "—",
      activeFrom: Number(r.activeFrom),
      low: String(r.lowNote),
      high: String(r.highNote),
      lowMidi,
      highMidi,
      belt: r.beltNote == null ? null : String(r.beltNote),
      whistle: r.whistle === true,
      signatureSong: String(r.signatureSong ?? "").trim(),
      lowSource: r.lowSource ? String(r.lowSource).trim() : null,
      highSource: r.highSource ? String(r.highSource).trim() : null,
      blurb: String(r.blurb ?? "").trim(),
      technique: r.technique ? String(r.technique).trim() : null,
      group,
    });
  }
}

const singers = [...seen.values()];
const byGroup = new Map();
for (const s of singers) {
  if (!byGroup.has(s.group)) byGroup.set(s.group, []);
  byGroup.get(s.group).push(s);
}
for (const list of byGroup.values()) {
  list.sort((a, b) => a.activeFrom - b.activeFrom || a.name.localeCompare(b.name));
}

/* --------------------------------------------------------------- chapters */

function parseFrontmatter(raw, file) {
  const m = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/.exec(raw);
  if (!m) throw new Error(`${file}: missing frontmatter`);
  const meta = {};
  for (const line of m[1].split("\n")) {
    const kv = /^(\w+):\s*(.*)$/.exec(line.trim());
    if (!kv) continue;
    let v = kv[2].trim();
    if (v.startsWith('"') && v.endsWith('"')) v = v.slice(1, -1);
    meta[kv[1]] = v;
  }
  return { meta, body: m[2].trim() };
}

const wordCount = (t) => t.split(/\s+/).filter(Boolean).length;
const spanText = (semis) => {
  const oct = Math.floor(semis / 12);
  const rem = semis % 12;
  if (oct === 0) return `${rem} semitones`;
  return rem > 0 ? `${oct} octaves + ${rem}` : `${oct} octaves`;
};

/** Generated markdown for the records appendix. */
function recordsMarkdown() {
  const withSong = (note, src) => (src ? `**${note}** in *${src}*` : `**${note}**`);
  const bySpan = [...singers].sort(
    (a, b) => b.highMidi - b.lowMidi - (a.highMidi - a.lowMidi),
  );
  const byLow = [...singers].sort((a, b) => a.lowMidi - b.lowMidi);
  const byHigh = [...singers].sort((a, b) => b.highMidi - a.highMidi);
  const byBelt = singers
    .filter((s) => s.belt != null)
    .sort((a, b) => labelToMidi(b.belt) - labelToMidi(a.belt));
  const whistlers = singers
    .filter((s) => s.whistle)
    .sort((a, b) => b.highMidi - a.highMidi);

  const rows = [];
  rows.push("## The deepest floors");
  for (const s of byLow.slice(0, 12))
    rows.push(`- **${s.name}** — ${withSong(s.low, s.lowSource)}, from a cited ${s.low}–${s.high}`);
  rows.push("");
  rows.push("## The highest ceilings");
  for (const s of byHigh.slice(0, 12))
    rows.push(
      `- **${s.name}** — ${withSong(s.high, s.highSource)}${s.whistle ? " (whistle register)" : ""}, from a cited ${s.low}–${s.high}`,
    );
  rows.push("");
  rows.push("## The widest spans");
  for (const s of bySpan.slice(0, 12))
    rows.push(
      `- **${s.name}** — ${s.low}–${s.high}, ${spanText(s.highMidi - s.lowMidi)}`,
    );
  rows.push("");
  rows.push("## The highest full-voice ceilings");
  rows.push(
    "Belted or full-voice tops, as distinct from falsetto, head voice or whistle — for many readers the most meaningful list on this page.",
  );
  for (const s of byBelt.slice(0, 12))
    rows.push(`- **${s.name}** — full voice cited to **${s.belt}** (range ${s.low}–${s.high})`);
  rows.push("");
  rows.push("## The whistle club");
  rows.push(
    "Voices in the library with a documented whistle register. The flag is rare on purpose.",
  );
  for (const s of whistlers)
    rows.push(`- **${s.name}** — cited to ${withSong(s.high, s.highSource)}`);
  return rows.join("\n");
}

/** Generated markdown for the voice-type appendix. */
function voiceTypesMarkdown() {
  const ORDER = [
    "Bass",
    "Bass-baritone",
    "Baritone",
    "Tenor",
    "Countertenor",
    "Contralto",
    "Mezzo-soprano",
    "Soprano",
  ];
  const rows = [];
  for (const type of ORDER) {
    const list = singers
      .filter((s) => s.voiceType === type)
      .sort((a, b) => a.name.localeCompare(b.name));
    if (!list.length) continue;
    rows.push(`## ${type}s`);
    for (const s of list) rows.push(`- **${s.name}** — \`${s.low}–${s.high}\``);
    rows.push("");
  }
  return rows.join("\n");
}

/**
 * Which chapters render in full, for free, on their own page.
 *
 * Chapter 1 teaches the entry format, but the two after it define the
 * vocabulary every free surface already prints — scientific pitch notation and
 * the voice-type labels. Gating the definitions of words the product uses on
 * its free pages costs more than it earns, so the literacy chapters sample the
 * book. Widening this set is a pricing decision, not a content edit, which is
 * why it lives here rather than in the frontmatter.
 */
const FREE_CHAPTER_ORDERS = new Set([1, 2, 3]);

const chapters = [];
for (const file of readdirSync(CONTENT).filter((f) => f.endsWith(".md")).sort()) {
  const raw = readFileSync(join(CONTENT, file), "utf8");
  let parsed;
  try {
    parsed = parseFrontmatter(raw, file);
  } catch (e) {
    problems.push(e.message);
    continue;
  }
  const { meta, body } = parsed;
  const order = Number(meta.order);
  if (!meta.title || !meta.part || !Number.isInteger(order)) {
    problems.push(`${file}: needs title, part and integer order`);
    continue;
  }
  if (/^#\s/m.test(body)) problems.push(`${file}: body contains an H1`);

  let entries = [];
  let fullBody = body;
  if (meta.group) {
    entries = byGroup.get(meta.group) ?? [];
    if (!entries.length) problems.push(`${file}: group "${meta.group}" has no singers`);
    byGroup.delete(meta.group);
  } else if (meta.appendix === "records") {
    fullBody = `${body}\n\n${recordsMarkdown()}`;
  } else if (meta.appendix === "voice-types") {
    fullBody = `${body}\n\n${voiceTypesMarkdown()}`;
  } else {
    const words = wordCount(body);
    if (words < 600) problems.push(`${file}: only ${words} words`);
  }
  if (meta.group && wordCount(body) < 180) {
    problems.push(`${file}: intro is only ${wordCount(body)} words`);
  }

  const entryWords = entries.reduce(
    (n, s) => n + wordCount(s.blurb) + (s.technique ? wordCount(s.technique) : 0),
    0,
  );

  chapters.push({
    slug: file.replace(/^\d+-/, "").replace(/\.md$/, ""),
    order,
    title: meta.title,
    part: meta.part,
    summary: meta.summary ?? "",
    free: FREE_CHAPTER_ORDERS.has(order),
    words: wordCount(fullBody) + entryWords,
    body: fullBody,
    entries: entries.map((s) => {
      const e = { ...s, span: spanText(s.highMidi - s.lowMidi) };
      delete e.group;
      delete e.lowMidi;
      delete e.highMidi;
      return e;
    }),
  });
}

for (const [group, list] of byGroup) {
  problems.push(`no chapter claims group "${group}" (${list.length} singers stranded)`);
}

chapters.sort((a, b) => a.order - b.order);
const orders = new Set();
for (const c of chapters) {
  if (orders.has(c.order)) problems.push(`duplicate order ${c.order} (${c.slug})`);
  orders.add(c.order);
}

return { chapters, problems };
}

/* ----------------------------------------------------------------- output */

const isMain =
  process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;

if (isMain) {
const { chapters, problems } = buildAtlas();

const contents = chapters.map((c) => {
  const meta = { ...c };
  delete meta.body;
  delete meta.entries;
  return {
    ...meta,
    singers: c.entries.map((e) => ({
      slug: e.slug,
      name: e.name,
      voiceType: e.voiceType,
      low: e.low,
      high: e.high,
    })),
  };
});

const out = `/**
 * GENERATED FILE — edit content/atlas/*.md and data/singers/*.json, then run
 * scripts/compile-singers.mjs and scripts/compile-atlas.mjs.
 *
 * "The Voice Atlas", the second book included with Suede Sing Pro. Chapter
 * bodies and entry prose are served only through /api/book (which verifies the
 * subscription with Stripe), except the chapters flagged \`free\`, which render
 * server-side on their own pages; the contents metadata — including each
 * chapter's roster of singers — is free, and every roster name already has a
 * free page at /singers/[slug].
 */

export interface AtlasEntry {
  slug: string;
  name: string;
  voiceType: string;
  country: string;
  activeFrom: number;
  low: string;
  high: string;
  span: string;
  belt: string | null;
  whistle: boolean;
  signatureSong: string;
  lowSource: string | null;
  highSource: string | null;
  blurb: string;
  technique: string | null;
}

export interface AtlasChapter {
  slug: string;
  order: number;
  title: string;
  part: string;
  summary: string;
  free: boolean;
  words: number;
  /** Markdown. Gated behind /api/book unless \`free\`. */
  body: string;
  /** Structured singer entries for genre chapters. Gated with the body. */
  entries: AtlasEntry[];
}

export const ATLAS_TITLE = "The Voice Atlas";
export const ATLAS_SUBTITLE =
  "Who sings what, how it sounds, and how to borrow it — the range, tone and technique of every voice in the library.";

export const ATLAS: AtlasChapter[] = ${JSON.stringify(chapters, null, 2)};

export interface AtlasRosterRow {
  slug: string;
  name: string;
  voiceType: string;
  low: string;
  high: string;
}

export type AtlasContentsEntry = Omit<AtlasChapter, "body" | "entries"> & {
  singers: AtlasRosterRow[];
};

/**
 * Metadata only — safe to import from a client component. Importing ATLAS
 * there would ship the whole book to every visitor.
 */
export const ATLAS_CONTENTS: AtlasContentsEntry[] = ${JSON.stringify(contents, null, 2)};

/** Parts in reading order, each with its chapters. */
export const ATLAS_PARTS: Array<{ part: string; chapters: AtlasContentsEntry[] }> =
  ATLAS_CONTENTS.reduce<Array<{ part: string; chapters: AtlasContentsEntry[] }>>(
    (acc, c) => {
      const last = acc[acc.length - 1];
      if (last && last.part === c.part) last.chapters.push(c);
      else acc.push({ part: c.part, chapters: [c] });
      return acc;
    },
    [],
  );

export const ATLAS_WORDS = ${chapters.reduce((n, c) => n + c.words, 0)};
`;

writeFileSync(new URL("../lib/atlas-data.ts", import.meta.url), out);

const totalEntries = chapters.reduce((n, c) => n + c.entries.length, 0);
console.log(
  `wrote ${chapters.length} chapters, ${totalEntries} singer entries, ${chapters.reduce((n, c) => n + c.words, 0)} words`,
);
if (problems.length) {
  console.log(`\n${problems.length} problems:`);
  for (const p of problems) console.log(`  - ${p}`);
  process.exitCode = 1;
}
}
