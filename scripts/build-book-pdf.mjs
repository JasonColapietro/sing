/**
 * Render the book to public/the-measured-voice.pdf.
 *
 * Usage: node scripts/build-book-pdf.mjs
 *
 * Playwright is a dev-only dependency of this script, not of the app — the PDF
 * is built when the text changes and committed, so no runtime dependency and no
 * serverless PDF rendering. Run it after scripts/compile-book.mjs.
 *
 * The PDF is navigable three ways, and all three survive the print:
 *   - a contents page whose rows are internal links to each chapter
 *   - a "Contents" link on every chapter opener, to get back
 *   - tagged + outline, which turns the headings into PDF bookmarks (the
 *     sidebar a reader shows on the left)
 *
 * Contents page numbers force a two-pass render: Chromium cannot count pages
 * from inside the document, so pass one prints with placeholder numbers, the
 * real page of each chapter is read back out of that PDF's text, and pass two
 * prints again with the numbers filled in. The placeholder is the same width
 * as any real number and the row count never changes, so pagination is
 * identical between the passes and the numbers land where they were measured.
 */
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { chromium } from "playwright";

const SRC = "content/book";
const OUT = "public/the-measured-voice.pdf";

const TITLE = "The Measured Voice";
const SUBTITLE = "Building a voice you can measure";

function parse(raw) {
  const m = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/.exec(raw);
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

const esc = (s) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/** Same subset the in-app renderer supports. */
function mdToHtml(md) {
  const lines = md.split("\n");
  const out = [];
  let para = [];
  let list = null;
  const flushP = () => {
    if (para.length) {
      out.push(`<p>${inline(para.join(" "))}</p>`);
      para = [];
    }
  };
  const flushL = () => {
    if (list) {
      out.push(`<ul>${list.map((i) => `<li>${inline(i)}</li>`).join("")}</ul>`);
      list = null;
    }
  };
  for (const raw of lines) {
    const line = raw.trim();
    if (!line) {
      flushP();
      flushL();
      continue;
    }
    const h = /^(#{2,4})\s+(.*)$/.exec(line);
    if (h) {
      flushP();
      flushL();
      const d = h[1].length;
      out.push(`<h${d}>${inline(h[2])}</h${d}>`);
      continue;
    }
    const b = /^[-*]\s+(.*)$/.exec(line);
    if (b) {
      flushP();
      (list ??= []).push(b[1]);
      continue;
    }
    flushL();
    para.push(line);
  }
  flushP();
  flushL();
  return out.join("\n");
}

function inline(t) {
  return esc(t)
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, "<em>$1</em>")
    .replace(/`([^`]+)`/g, "<code>$1</code>");
}

const chapters = readdirSync(SRC)
  .filter((f) => f.endsWith(".md"))
  .sort()
  .map((f) => parse(readFileSync(join(SRC, f), "utf8")))
  .sort((a, b) => Number(a.meta.order) - Number(b.meta.order));

/** Parts in reading order, each with the chapters under it. */
const parts = [];
for (const chapter of chapters) {
  const part = chapter.meta.part;
  if (parts.at(-1)?.name !== part) parts.push({ name: part, chapters: [] });
  parts.at(-1).chapters.push(chapter);
}

const partId = (i) => `part-${i + 1}`;
const chapterId = (order) => `ch-${order}`;

let lastPart = "";
let partIndex = -1;
const body = chapters
  .map(({ meta, body }) => {
    let partOpener = "";
    if (meta.part !== lastPart) {
      lastPart = meta.part;
      partIndex += 1;
      partOpener = `<section class="part" id="${partId(partIndex)}"><p class="part-label">Part</p><h1>${esc(meta.part)}</h1></section>`;
    }
    return `${partOpener}<section class="chapter" id="${chapterId(meta.order)}">
      <p class="ch-num">Chapter ${esc(String(meta.order))}<a class="back" href="#contents">Contents</a></p>
      <h1>${esc(meta.title)}</h1>
      ${mdToHtml(body)}
    </section>`;
  })
  .join("\n");

/**
 * The contents page. `pages` maps an anchor id to its printed page number;
 * pass one has none yet and prints a fixed-width placeholder instead, which is
 * what keeps both passes paginating identically.
 */
function contentsHtml(pages) {
  const num = (id) => {
    const n = pages?.get(id);
    return `<span class="pg">${n ?? "00"}</span>`;
  };
  const rows = parts
    .map((part, i) => {
      const chapterRows = part.chapters
        .map(
          ({ meta }) => `<li class="c-row">
            <a href="#${chapterId(meta.order)}">
              <span class="c-n">${esc(String(meta.order))}</span>
              <span class="c-t">${esc(meta.title)}</span>
              <span class="c-dots"></span>
              ${num(chapterId(meta.order))}
            </a>
          </li>`,
        )
        .join("\n");
      return `<li class="c-part">
          <a href="#${partId(i)}"><span class="c-t">${esc(part.name)}</span><span class="c-dots"></span>${num(partId(i))}</a>
        </li>
        ${chapterRows}`;
    })
    .join("\n");

  return `<nav class="contents" id="contents">
    <p class="c-label">Contents</p>
    <h1>The Measured Voice</h1>
    <p class="c-hint">Every line below is a link — tap a chapter to jump straight to it.
    Every chapter has a link back here.</p>
    <ol class="c-list">${rows}</ol>
  </nav>`;
}

const styles = `
  @page { size: A5; margin: 18mm 16mm; }
  * { box-sizing: border-box; }
  body { margin: 0; font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
         color: #20201d; font-size: 10.5pt; line-height: 1.62; }
  .cover { height: 88vh; display: flex; flex-direction: column; justify-content: center;
           page-break-after: always; border-top: 2pt solid #9d3f33; padding-top: 8mm; }
  .cover .kicker { font-family: ui-monospace, Menlo, monospace; font-size: 8pt;
                   letter-spacing: .22em; text-transform: uppercase; color: #9d3f33; margin: 0 0 10mm; }
  .cover h1 { font-size: 30pt; line-height: 1.02; margin: 0; letter-spacing: -.02em; }
  .cover p.sub { color: #5c564d; font-size: 12pt; margin: 6mm 0 0; }
  .cover .mark { margin-top: auto; font-family: ui-monospace, Menlo, monospace;
                 font-size: 8pt; letter-spacing: .18em; text-transform: uppercase; color: #8a8272; }
  .part { page-break-before: always; page-break-after: always; height: 70vh;
          display: flex; flex-direction: column; justify-content: center; }
  .part-label { font-family: ui-monospace, Menlo, monospace; font-size: 8pt; letter-spacing: .22em;
                text-transform: uppercase; color: #9d3f33; margin: 0 0 4mm; }
  .part h1 { font-size: 22pt; margin: 0; letter-spacing: -.02em; }
  .part { border-top: 1pt solid #ddd4c4; padding-top: 6mm; }
  .chapter { page-break-before: always; }
  .ch-num { font-family: ui-monospace, Menlo, monospace; font-size: 8pt; letter-spacing: .18em;
            text-transform: uppercase; color: #8a8272; margin: 0 0 3mm;
            display: flex; justify-content: space-between; align-items: baseline; }
  .ch-num .back { color: #9d3f33; text-decoration: none; letter-spacing: .18em; }

  /* Contents */
  .contents { page-break-after: always; border-top: 1pt solid #ddd4c4; padding-top: 6mm; }
  .c-label { font-family: ui-monospace, Menlo, monospace; font-size: 8pt; letter-spacing: .22em;
             text-transform: uppercase; color: #9d3f33; margin: 0 0 4mm; }
  .contents h1 { font-size: 20pt; margin: 0; letter-spacing: -.02em; }
  .c-hint { color: #8a8272; font-size: 8.5pt; margin: 3mm 0 7mm; }
  .c-list { list-style: none; margin: 0; padding: 0; }
  .c-list a { color: inherit; text-decoration: none; display: flex; align-items: baseline; gap: 2mm; }
  .c-part { margin: 5mm 0 2mm; font-family: ui-monospace, Menlo, monospace; font-size: 8pt;
            letter-spacing: .18em; text-transform: uppercase; color: #9d3f33; }
  .c-part:first-child { margin-top: 0; }
  .c-row { font-size: 10pt; padding: .9mm 0; }
  .c-n { flex: 0 0 7mm; font-family: ui-monospace, Menlo, monospace; font-size: 8.5pt;
         color: #8a8272; }
  .c-t { flex: 0 1 auto; }
  /* Dot leaders: the flexible middle, so the page number always sits flush right. */
  .c-dots { flex: 1 1 auto; align-self: center; height: 0;
            border-bottom: .5pt dotted #c9bda0; margin: 0 1.5mm; }
  /* Fixed width + tabular figures: "7" and "118" occupy the same box, so
     filling in the real numbers in pass two cannot reflow the page. */
  .pg { flex: 0 0 9mm; text-align: right; font-family: ui-monospace, Menlo, monospace;
        font-size: 8.5pt; font-variant-numeric: tabular-nums; color: #5c564d; }
  .chapter h1 { font-size: 17pt; margin: 0 0 6mm; letter-spacing: -.015em; line-height: 1.15; }
  h2 { font-size: 12pt; margin: 8mm 0 2mm; letter-spacing: -.01em; }
  h3, h4 { font-size: 11pt; margin: 6mm 0 2mm; }
  p { margin: 0 0 3.5mm; color: #3a3833; }
  ul { margin: 0 0 3.5mm; padding-left: 5mm; }
  li { margin: 0 0 1.6mm; color: #3a3833; }
  strong { color: #20201d; }
  code { font-family: ui-monospace, Menlo, monospace; font-size: 9.5pt; }
  .note { page-break-before: always; color: #5c564d; font-size: 9.5pt; }
`;

const documentHtml = (pages) => `<!doctype html><html lang="en"><head><meta charset="utf-8">
<title>${esc(TITLE)}</title><style>${styles}</style></head><body>
  <section class="cover">
    <p class="kicker">Included with Suede Pro</p>
    <h1>${esc(TITLE)}</h1>
    <p class="sub">${esc(SUBTITLE)}</p>
    <p class="mark">Suede Sing</p>
  </section>
  ${contentsHtml(pages)}
  ${body}
  <section class="note">
    <h2>A note on what this book is not</h2>
    <p>This is a book about practice, not medicine. Nothing in it diagnoses or treats
    anything. If singing hurts, if you are hoarse and it will not clear, or if you ever
    see blood, that is a question for a doctor or a speech-language pathologist. There is
    no waiting period, and you do not need to be sure it is serious before you go.</p>
  </section>
</body></html>`;

const PDF_OPTIONS = {
  format: "A5",
  printBackground: true,
  displayHeaderFooter: true,
  // tagged is what makes outline (the reader's bookmark sidebar) possible.
  tagged: true,
  outline: true,
  headerTemplate: "<span></span>",
  footerTemplate:
    '<div style="width:100%;font-size:7pt;color:#8a8272;font-family:Helvetica,Arial,sans-serif;text-align:center;"><span class="pageNumber"></span></div>',
  margin: { top: "18mm", bottom: "16mm", left: "16mm", right: "16mm" },
};

const browser = await chromium.launch();
const page = await browser.newPage();

async function render(html, path) {
  await page.setContent(html, { waitUntil: "load" });
  await page.pdf({ ...PDF_OPTIONS, path });
}

/**
 * Printed page number of every part and chapter opener, read back out of a
 * rendered PDF. Openers always start a page, and the mono labels print
 * uppercase, so "PART" / "CHAPTER 9" identify an opener page without matching
 * prose that happens to mention a chapter.
 */
function locateOpeners(pdfPath) {
  const text = execFileSync("pdftotext", [pdfPath, "-"], { encoding: "utf8" });
  const pageTexts = text.split("\f");
  const found = new Map();

  const firstPage = (test) => {
    const i = pageTexts.findIndex(test);
    return i === -1 ? null : i + 1; // printed numbers are 1-based
  };

  parts.forEach((part, i) => {
    const name = part.name.toUpperCase();
    const at = firstPage(
      (t) => t.includes("PART") && t.toUpperCase().includes(name),
    );
    if (at) found.set(partId(i), at);
  });

  for (const { meta } of chapters) {
    const label = new RegExp(`CHAPTER\\s+${meta.order}\\b`);
    const at = firstPage((t) => label.test(t));
    if (at) found.set(chapterId(meta.order), at);
  }

  const missing = [...parts.map((_, i) => partId(i)), ...chapters.map((c) => chapterId(c.meta.order))]
    .filter((id) => !found.has(id));
  if (missing.length > 0) {
    console.warn(
      `warning: no page found for ${missing.length} opener(s): ${missing.join(", ")}`,
    );
  }
  return found;
}

// Pass one: placeholder page numbers, only so the contents can be measured.
const scratch = mkdtempSync(join(tmpdir(), "book-pdf-"));
const probe = join(scratch, "probe.pdf");
await render(documentHtml(null), probe);
const pages = locateOpeners(probe);

// Pass two: the real thing.
await render(documentHtml(pages), OUT);
await browser.close();

// The numbers are only trustworthy if pass two paginates exactly like pass one.
const pageCount = (p) =>
  Number(
    /Pages:\s+(\d+)/.exec(execFileSync("pdfinfo", [p], { encoding: "utf8" }))?.[1],
  );
const [probePages, finalPages] = [pageCount(probe), pageCount(OUT)];
rmSync(scratch, { recursive: true, force: true });
if (probePages !== finalPages) {
  throw new Error(
    `Pagination shifted between passes (${probePages} → ${finalPages}); contents page numbers would be wrong.`,
  );
}

const words = chapters.reduce(
  (n, c) => n + c.body.split(/\s+/).filter(Boolean).length,
  0,
);
console.log(
  `wrote ${OUT} — ${chapters.length} chapters, ${words} words, ${finalPages} pages`,
);
writeFileSync(
  "public/the-measured-voice.txt",
  `${TITLE}\n${SUBTITLE}\n\n${chapters.length} chapters, ${words} words.\n`,
);
