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
// Not public/ — the PDF is a paid benefit, served only through /api/book/pdf
// after a Stripe check. Writing it back into public/ would republish the whole
// book at a world-readable URL.
const OUT = "content/pdfs/the-measured-voice.pdf";

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
  return crossLink(
    esc(t)
      .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
      .replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, "<em>$1</em>")
      .replace(/`([^`]+)`/g, "<code>$1</code>"),
  );
}

const WORD_NUMBERS = {
  one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8,
  nine: 9, ten: 10, eleven: 11, twelve: 12, thirteen: 13, fourteen: 14,
  fifteen: 15, sixteen: 16, seventeen: 17, eighteen: 18, nineteen: 19,
  twenty: 20, "twenty-one": 21, "twenty-two": 22, "twenty-three": 23,
};

/**
 * Turns prose references — "chapter four takes this apart properly" — into
 * links to that chapter. The book cross-references itself constantly, and in a
 * PDF those are dead ends unless something makes them jump.
 *
 * Deliberately conservative: it only fires on a chapter word or digit that
 * resolves to a chapter this book actually has, so "chapter and verse" or a
 * reference to a chapter number beyond the end is left as plain text. The
 * matched text is preserved exactly, including its original capitalisation.
 */
function crossLink(html) {
  return html.replace(
    /\b(chapters?)\s+((?:twenty-)?[a-z]+|\d{1,2})\b/gi,
    (whole, word, ref) => {
      const key = ref.toLowerCase();
      const n = /^\d+$/.test(key) ? Number(key) : WORD_NUMBERS[key];
      if (!n || !chapterOrders.has(n)) return whole;
      return `<a class="xref" href="#${chapterId(n)}">${word} ${ref}</a>`;
    },
  );
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

/** Chapter numbers that exist, so cross-links can refuse to invent one. */
const chapterOrders = new Set(chapters.map((c) => Number(c.meta.order)));

const ROMAN = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"];

/**
 * A part opener that earns its page: the roman numeral, the part name, and the
 * chapters underneath it as links. The old version was a title floating in
 * three-quarters of an empty page.
 */
function partOpenerHtml(part, i, pages) {
  const rows = part.chapters
    .map(({ meta }) => {
      const n = pages?.get(chapterId(meta.order));
      return `<li><a href="#${chapterId(meta.order)}">
        <span class="p-n">${esc(String(meta.order))}</span>
        <span class="p-t">${esc(meta.title)}</span>
        <span class="p-dots"></span>
        <span class="pg">${n ?? "00"}</span>
      </a></li>`;
    })
    .join("\n");
  return `<section class="part" id="${partId(i)}">
    <div class="part-head">
      <span class="part-num">${ROMAN[i] ?? i + 1}</span>
      <div>
        <p class="part-label">Part</p>
        <h1>${esc(part.name)}</h1>
      </div>
    </div>
    <ol class="part-list">${rows}</ol>
    <a class="part-back" href="#contents">Contents</a>
  </section>`;
}

/** The chapter body, with the openers and the end-of-chapter jump. */
function bodyHtml(pages) {
  let lastPart = "";
  let partIndex = -1;
  return chapters
    .map(({ meta, body }, i) => {
      let opener = "";
      if (meta.part !== lastPart) {
        lastPart = meta.part;
        partIndex += 1;
        opener = partOpenerHtml(parts[partIndex], partIndex, pages);
      }
      const next = chapters[i + 1];
      const tail = next
        ? `<p class="ch-next"><a href="#${chapterId(next.meta.order)}">
             <span class="nx-label">Next</span>
             <span class="nx-title">${esc(next.meta.title)}</span>
             <span class="nx-arrow">→</span>
           </a></p>`
        : `<p class="ch-next"><a href="#colophon">
             <span class="nx-label">End of the last chapter</span>
             <span class="nx-title">Colophon</span>
             <span class="nx-arrow">→</span>
           </a></p>`;
      return `${opener}<section class="chapter" id="${chapterId(meta.order)}">
        <p class="ch-num"><span>Chapter ${esc(String(meta.order))}</span><a class="back" href="#contents">Contents</a></p>
        <div class="ch-head">
          <span class="ch-big">${esc(String(meta.order))}</span>
          <h1>${esc(meta.title)}</h1>
        </div>
        ${mdToHtml(body)}
        ${tail}
      </section>`;
    })
    .join("\n");
}

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
    Every chapter links back here, to the next chapter, and to any chapter its
    text mentions.</p>
    <ol class="c-list">${rows}</ol>
  </nav>`;
}

/**
 * The cover. The bars are the same pitch-trace motif the site uses on its share
 * cards — a voice settling onto a target note — so the book looks like it came
 * from the same place as the app.
 */
const TRACE = [30, 44, 38, 54, 48, 60, 56, 66, 62, 72, 69, 76, 74, 79, 78, 80, 80, 80];

const coverHtml = () => `<section class="cover">
  <p class="kicker">Included with Suede Pro</p>
  <h1>${esc(TITLE)}</h1>
  <p class="sub">${esc(SUBTITLE)}</p>
  <div class="trace">
    ${TRACE.map(
      (h, i) =>
        `<span class="bar${i >= TRACE.length - 4 ? " lit" : ""}" style="height:${h}%"></span>`,
    ).join("")}
  </div>
  <p class="mark">Suede Sing<span class="dot">·</span>sing.suedeai.ai</p>
</section>`;

const styles = `
  @page { size: A5; margin: 18mm 16mm; }
  * { box-sizing: border-box; }
  body { margin: 0; font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
         color: #20201d; font-size: 10.5pt; line-height: 1.62; }
  .cover { height: 92vh; display: flex; flex-direction: column;
           page-break-after: always; border-top: 2.5pt solid #9d3f33; padding-top: 9mm; }
  .cover .kicker { font-family: ui-monospace, Menlo, monospace; font-size: 8pt;
                   letter-spacing: .22em; text-transform: uppercase; color: #9d3f33; margin: 0 0 22mm; }
  .cover h1 { font-size: 34pt; line-height: 1.0; margin: 0; letter-spacing: -.025em; }
  .cover p.sub { color: #5c564d; font-size: 12.5pt; margin: 7mm 0 0; }
  /* The pitch-trace motif from the site's share cards: a voice wandering, then
     settling onto the target for the last four readings. */
  .trace { margin-top: auto; display: flex; align-items: flex-end; gap: 1.6mm; height: 34mm; }
  .trace .bar { flex: 1 1 auto; border-radius: 1mm; background: #b6c9c4; }
  .trace .bar.lit { background: #9d3f33; }
  .cover .mark { margin-top: 8mm; font-family: ui-monospace, Menlo, monospace;
                 font-size: 8pt; letter-spacing: .18em; text-transform: uppercase; color: #8a8272; }
  .cover .mark .dot { margin: 0 2mm; color: #c9bda0; }

  /* Part opener: numeral, name, and the chapters under it as links. */
  .part { page-break-before: always; page-break-after: always;
          border-top: 1pt solid #ddd4c4; padding-top: 7mm;
          display: flex; flex-direction: column; height: 88vh; }
  .part-head { display: flex; align-items: flex-start; gap: 6mm; margin-bottom: 10mm; }
  .part-num { font-family: ui-monospace, Menlo, monospace; font-size: 30pt; line-height: .9;
              color: #e4d9c6; letter-spacing: -.02em; }
  .part-label { font-family: ui-monospace, Menlo, monospace; font-size: 8pt; letter-spacing: .22em;
                text-transform: uppercase; color: #9d3f33; margin: 0 0 3mm; }
  .part h1 { font-size: 22pt; margin: 0; letter-spacing: -.02em; line-height: 1.1; }
  .part-list { list-style: none; margin: 0; padding: 0; }
  .part-list a { color: inherit; text-decoration: none; display: flex; align-items: baseline; gap: 2mm; }
  .part-list li { font-size: 10pt; padding: 1.4mm 0; border-bottom: .4pt solid #efe6d5; }
  .p-n { flex: 0 0 7mm; font-family: ui-monospace, Menlo, monospace; font-size: 8.5pt; color: #8a8272; }
  .p-t { flex: 0 1 auto; }
  .p-dots { flex: 1 1 auto; align-self: center; height: 0;
            border-bottom: .5pt dotted #c9bda0; margin: 0 1.5mm; }
  .part-back { margin-top: auto; font-family: ui-monospace, Menlo, monospace; font-size: 8pt;
               letter-spacing: .18em; text-transform: uppercase; color: #9d3f33; text-decoration: none; }
  .chapter { page-break-before: always; }
  .ch-num { font-family: ui-monospace, Menlo, monospace; font-size: 8pt; letter-spacing: .18em;
            text-transform: uppercase; color: #8a8272; margin: 0 0 4mm; padding-bottom: 2.5mm;
            border-bottom: .5pt solid #efe6d5;
            display: flex; justify-content: space-between; align-items: baseline; }
  .ch-num .back { color: #9d3f33; text-decoration: none; letter-spacing: .18em; }
  /* Display numeral beside the title, set in the pale sand so it reads as
     ornament rather than as a word competing with the heading. */
  .ch-head { display: flex; align-items: flex-start; gap: 4mm; margin-bottom: 7mm; }
  .ch-big { font-family: ui-monospace, Menlo, monospace; font-size: 26pt; line-height: .82;
            color: #e4d9c6; letter-spacing: -.03em; flex: 0 0 auto; }
  /* Cross-references to other chapters, e.g. "chapter four takes this apart". */
  .xref { color: #9d3f33; text-decoration: none;
          border-bottom: .4pt solid rgba(157,63,51,.32); }
  /* End-of-chapter jump to the next one. */
  .ch-next { margin: 9mm 0 0; padding-top: 3mm; border-top: .5pt solid #efe6d5;
             page-break-inside: avoid; }
  .ch-next a { color: inherit; text-decoration: none; display: flex; align-items: baseline; gap: 2.5mm; }
  .nx-label { font-family: ui-monospace, Menlo, monospace; font-size: 7.5pt; letter-spacing: .18em;
              text-transform: uppercase; color: #8a8272; flex: 0 0 auto; }
  .nx-title { flex: 1 1 auto; color: #9d3f33; font-size: 10pt; }
  .nx-arrow { color: #9d3f33; flex: 0 0 auto; }

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
  .chapter h1 { font-size: 17pt; margin: 0; letter-spacing: -.015em; line-height: 1.15;
                align-self: center; }
  /* Headings stay with the text they introduce, and no line strands alone at
     the top or bottom of a page. */
  h2 { font-size: 12pt; margin: 8mm 0 2mm; letter-spacing: -.01em;
       page-break-after: avoid; break-after: avoid; }
  h3, h4 { font-size: 11pt; margin: 6mm 0 2mm; page-break-after: avoid; break-after: avoid; }
  p { margin: 0 0 3.5mm; color: #3a3833; orphans: 2; widows: 2; }
  /* The chapter's opening paragraph, set slightly larger as a lead-in. */
  .ch-head + p { font-size: 11.5pt; line-height: 1.55; color: #2c2a26; }
  ul { margin: 0 0 3.5mm; padding-left: 5mm; }
  li { margin: 0 0 1.6mm; color: #3a3833; orphans: 2; widows: 2; }
  strong { color: #20201d; }
  code { font-family: ui-monospace, Menlo, monospace; font-size: 9.5pt; }
  .note { page-break-before: always; color: #5c564d; font-size: 9.5pt; }

  /* Colophon */
  .colophon { page-break-before: always; border-top: 1pt solid #ddd4c4; padding-top: 7mm;
              display: flex; flex-direction: column; height: 86vh; }
  .colophon h2 { font-size: 15pt; margin: 0 0 4mm; }
  .colophon p { font-size: 9.5pt; color: #5c564d; max-width: 92%; }
  .colo-meta { margin-top: auto; font-family: ui-monospace, Menlo, monospace; font-size: 8pt;
               letter-spacing: .14em; text-transform: uppercase; color: #8a8272;
               border-top: .5pt solid #efe6d5; padding-top: 3mm; }
  .colo-meta a { color: #9d3f33; text-decoration: none; }
`;

const documentHtml = (pages) => `<!doctype html><html lang="en"><head><meta charset="utf-8">
<title>${esc(TITLE)}</title><style>${styles}</style></head><body>
  ${coverHtml()}
  ${contentsHtml(pages)}
  ${bodyHtml(pages)}
  <section class="note">
    <h2>A note on what this book is not</h2>
    <p>This is a book about practice, not medicine. Nothing in it diagnoses or treats
    anything. If singing hurts, if you are hoarse and it will not clear, or if you ever
    see blood, that is a question for a doctor or a speech-language pathologist. There is
    no waiting period, and you do not need to be sure it is serious before you go.</p>
  </section>
  <section class="colophon" id="colophon">
    <h2>Colophon</h2>
    <p>${esc(TITLE)} — ${esc(SUBTITLE)}. Written for Suede Sing, the browser vocal
    studio, and included with a Suede Pro subscription. ${chapters.length} chapters
    in ${parts.length} parts.</p>
    <p>Set in Helvetica Neue with monospace labels, and typeset from the same
    source text the app reads, so the book and the in-app chapters can never
    disagree. Every contents row, part list, cross-reference and chapter footer
    in this file is a live link.</p>
    <p class="colo-meta">
      Suede Sing · <a href="https://sing.suedeai.ai">sing.suedeai.ai</a> ·
      <a href="#contents">Contents</a>
    </p>
  </section>
</body></html>`;

const PDF_OPTIONS = {
  format: "A5",
  printBackground: true,
  displayHeaderFooter: true,
  // tagged is what makes outline (the reader's bookmark sidebar) possible.
  tagged: true,
  outline: true,
  // Chromium prints one header for every page — it has no notion of a running
  // chapter title — so the header carries the book, and the footer the page.
  headerTemplate:
    '<div style="width:100%;padding:0 16mm;font-size:6.5pt;letter-spacing:.18em;text-transform:uppercase;color:#c9bda0;font-family:Menlo,monospace;text-align:right;">The Measured Voice</div>',
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

  // A part title long enough to wrap arrives from pdftotext with a newline in
  // the middle of it, so the comparison has to ignore how the line broke.
  const flat = (s) => s.toUpperCase().replace(/\s+/g, " ");

  parts.forEach((part, i) => {
    const name = flat(part.name);
    const at = firstPage((t) => t.includes("PART") && flat(t).includes(name));
    if (at) found.set(partId(i), at);
  });

  for (const { meta } of chapters) {
    const label = new RegExp(`CHAPTER\\s+${meta.order}\\b`);
    const at = firstPage((t) => label.test(t));
    if (at) found.set(chapterId(meta.order), at);
  }

  const missing = [...parts.map((_, i) => partId(i)), ...chapters.map((c) => chapterId(c.meta.order))]
    .filter((id) => !found.has(id));
  // An opener that can't be located prints "00" in the contents — a broken
  // page number in a paid book, arriving silently. A layout change caused
  // exactly that once (a part title started wrapping), so this fails the build
  // rather than warning into a log nobody reads.
  if (missing.length > 0) {
    throw new Error(
      `No printed page found for ${missing.length} opener(s): ${missing.join(", ")}. ` +
        `The contents would show "00" for these.`,
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
