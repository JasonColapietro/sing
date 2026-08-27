// Fails if any serif-styled quotation on the book carousel is not word-for-word
// in the chapter it credits. Run after editing slides.html:
//   node marketing/social/assets/carousel-book/verify-quotes.mjs
//
// The point is narrow and worth automating: a condensed sentence set inside
// quotation marks is a misquotation of Jason's own book, and it is the kind of
// error that survives every visual review because the slide looks right.
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.join(here, "..", "..", "..", "..");

const chapter = readFileSync(
  path.join(repo, "content/book/01-what-your-voice-is.md"),
  "utf8",
);
const slides = readFileSync(path.join(here, "slides.html"), "utf8");

const ENTITIES = {
  "&mdash;": "—", "&ldquo;": "“", "&rdquo;": "”",
  "&rsquo;": "’", "&amp;": "&", "&nbsp;": " ",
};

function plain(s) {
  return s
    .replace(/<br\s*\/?>/gi, " ") // a line break is a space, not a join
    .replace(/<[^>]+>/g, "")
    .replace(/&[a-z]+;/gi, (m) => ENTITIES[m] ?? m)
    .replace(/\s+/g, " ")
    .trim();
}

const body = plain(chapter);
// Any element whose class list contains "quote" — including "quote small".
const quotes = [...slides.matchAll(/<div class="quote[^"]*"[^>]*>([\s\S]*?)<\/div>/g)]
  .map((m) => plain(m[1]));

if (quotes.length === 0) throw new Error("no quotes found — did the markup change?");

let bad = 0;
for (const q of quotes) {
  const hit = body.includes(q);
  if (!hit) bad++;
  console.log(`${hit ? "verbatim " : "MISQUOTED"}  ${q.slice(0, 70)}${q.length > 70 ? "…" : ""}`);
}

console.log(`\n${quotes.length} quotations checked, ${bad} not found in the chapter.`);
if (bad > 0) process.exit(1);
