// Fails if any serif-styled quotation on any book carousel is not word-for-word
// in the chapter it credits.
//
//   node marketing/social/assets/verify-quotes.mjs
//
// Every carousel-*/slides.html that quotes a source declares it in its header
// comment as:   SOURCE: content/book/12-when-numbers-lie.md
// Carousels with no SOURCE line (e.g. carousel-range, which quotes nothing)
// are skipped.
//
// Why this exists: a draft slide once trimmed two words out of a sentence and
// dropped a trailing clause while still being set in serif under an open quote
// mark. That is a misquotation of Jason's own book, and it is exactly the error
// that survives visual review — the slide looks right, and nobody re-reads the
// chapter to check. The typographic rule the carousels follow is:
//
//   serif under a quote mark = verbatim
//   sans-serif               = editorial summary, never the author's words
//
// so this only checks the serif ones, which is the whole point: summary is
// allowed to compress, quotation is not.
import { readdirSync, readFileSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.join(here, "..", "..", "..");

const ENTITIES = {
  "&mdash;": "—", "&ldquo;": "“", "&rdquo;": "”",
  "&rsquo;": "’", "&lsquo;": "‘", "&amp;": "&", "&nbsp;": " ",
};

function plain(s) {
  return s
    .replace(/<br\s*\/?>/gi, " ") // a line break is a space, not a join
    .replace(/<[^>]+>/g, "")
    .replace(/&[a-z]+;/gi, (m) => ENTITIES[m] ?? m)
    .replace(/\s+/g, " ")
    .trim();
}

const dirs = readdirSync(here, { withFileTypes: true })
  .filter((d) => d.isDirectory() && d.name.startsWith("carousel-"))
  .map((d) => d.name)
  .sort();

let checked = 0;
let bad = 0;

for (const dir of dirs) {
  const file = path.join(here, dir, "slides.html");
  if (!existsSync(file)) continue;
  const slides = readFileSync(file, "utf8");

  const source = slides.match(/SOURCE:\s*(\S+)/)?.[1];
  if (!source) {
    console.log(`${dir}: no SOURCE declared — skipped (quotes nothing)`);
    continue;
  }

  const chapterPath = path.join(repo, source);
  if (!existsSync(chapterPath)) {
    console.log(`${dir}: MISSING SOURCE FILE ${source}`);
    bad++;
    continue;
  }
  const body = plain(readFileSync(chapterPath, "utf8"));

  // Any element whose class list contains "quote" — "quote", "quote small", …
  const quotes = [
    ...slides.matchAll(/<div class="quote[^"]*"[^>]*>([\s\S]*?)<\/div>/g),
  ].map((m) => plain(m[1]));

  console.log(`\n${dir}  ←  ${source}`);
  if (quotes.length === 0) {
    console.log("  no serif quotations found — did the markup change?");
    bad++;
    continue;
  }
  for (const q of quotes) {
    checked++;
    const hit = body.includes(q);
    if (!hit) bad++;
    console.log(`  ${hit ? "verbatim " : "MISQUOTED"}  ${q.slice(0, 66)}${q.length > 66 ? "…" : ""}`);
  }
}

console.log(`\n${checked} quotations checked across ${dirs.length} carousels, ${bad} problem(s).`);
process.exit(bad > 0 ? 1 : 0);
