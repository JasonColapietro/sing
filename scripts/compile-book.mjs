/**
 * Compile content/book/*.md into lib/book-data.ts.
 *
 * Usage: node scripts/compile-book.mjs content/book
 *
 * Chapters are markdown with frontmatter. The body is kept as markdown and
 * rendered at request time; only the metadata is needed to build the contents
 * page, so the free tier never has to download a word of a gated body.
 */
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const SRC = process.argv[2] ?? "content/book";

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

/**
 * Which chapters render in full, for free, on their own page.
 *
 * Same rule the atlas uses: a prospect who has never read a sentence of the
 * prose is being asked to buy writing quality sight unseen. Chapter one is the
 * three-part model the whole book runs on, so it samples the book without
 * giving away the program. Widening this set is a pricing decision, not a
 * content edit, which is why it lives here rather than in the frontmatter.
 */
const FREE_CHAPTER_ORDERS = new Set([1]);

const chapters = [];
const problems = [];

for (const file of readdirSync(SRC).filter((f) => f.endsWith(".md")).sort()) {
  const raw = readFileSync(join(SRC, file), "utf8");
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
  const words = body.split(/\s+/).filter(Boolean).length;
  if (words < 600) problems.push(`${file}: only ${words} words`);
  if (/^#\s/m.test(body)) problems.push(`${file}: body contains an H1; title comes from frontmatter`);

  chapters.push({
    slug: file.replace(/^\d+-/, "").replace(/\.md$/, ""),
    order,
    title: meta.title,
    part: meta.part,
    summary: meta.summary ?? "",
    free: FREE_CHAPTER_ORDERS.has(order),
    words,
    body,
  });
}

chapters.sort((a, b) => a.order - b.order);

const seen = new Set();
for (const c of chapters) {
  if (seen.has(c.order)) problems.push(`duplicate order ${c.order} (${c.slug})`);
  seen.add(c.order);
}

const header = `/**
 * GENERATED FILE — edit content/book/*.md and re-run scripts/compile-book.mjs.
 *
 * "The Measured Voice", the book included with Suede Sing Pro. Chapter bodies
 * live here but are only ever sent to a verified subscriber: the reader fetches
 * them through /api/book, which checks the subscription with Stripe first. The
 * exception is a chapter flagged \`free\`, which renders server-side on its own
 * page and never touches that route.
 */

export interface BookChapter {
  slug: string;
  order: number;
  title: string;
  part: string;
  summary: string;
  /** Renders in full on /book/[slug] instead of going through the gate. */
  free: boolean;
  words: number;
  /** Markdown. Served only to verified subscribers unless \`free\`. */
  body: string;
}

export const BOOK_TITLE = "The Measured Voice";
export const BOOK_SUBTITLE =
  "A practical guide to building a voice you can measure — included with Suede Sing Pro.";

export const BOOK: BookChapter[] = `;

const contents = chapters.map((c) => {
  const rest = { ...c };
  delete rest.body;
  return rest;
});

const footer = `

/**
 * Metadata only — safe to import from a client component. Importing BOOK there
 * would ship every chapter body to every visitor, which is the one thing the
 * /api/book gate exists to prevent.
 */
export type BookContentsEntry = Omit<BookChapter, "body">;

export const BOOK_CONTENTS: BookContentsEntry[] = ${JSON.stringify(contents, null, 2)};

/** Parts in reading order, each with its chapters. */
export const BOOK_PARTS: Array<{ part: string; chapters: BookContentsEntry[] }> =
  BOOK_CONTENTS.reduce<Array<{ part: string; chapters: BookContentsEntry[] }>>(
    (acc, c) => {
      const last = acc[acc.length - 1];
      if (last && last.part === c.part) last.chapters.push(c);
      else acc.push({ part: c.part, chapters: [c] });
      return acc;
    },
    [],
  );

export const BOOK_WORDS = ${chapters.reduce((n, c) => n + c.words, 0)};
`;

writeFileSync(
  new URL("../lib/book-data.ts", import.meta.url),
  header + JSON.stringify(chapters, null, 2) + ";\n" + footer,
);

const total = chapters.reduce((n, c) => n + c.words, 0);
console.log(`wrote ${chapters.length} chapters, ${total} words`);
if (problems.length) {
  console.log(`\n${problems.length} problems:`);
  for (const p of problems) console.log(`  - ${p}`);
  process.exitCode = 1;
}
