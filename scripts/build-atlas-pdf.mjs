/**
 * Render The Voice Atlas to public/the-voice-atlas.pdf.
 *
 * Usage: node scripts/build-atlas-pdf.mjs
 *
 * Same machinery as build-book-pdf.mjs (two-pass render so the contents page
 * carries real page numbers; tagged + outline for reader bookmarks), but the
 * chapters come from scripts/compile-atlas.mjs — intro markdown plus generated
 * singer entries — and the contents page is deliberately thorough: every
 * chapter row is followed by the full roster of singers it covers, because the
 * contents double as the book's free index.
 */
import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { chromium } from "playwright";
import { ATLAS_SUBTITLE, ATLAS_TITLE, buildAtlas } from "./compile-atlas.mjs";

const OUT = "public/the-voice-atlas.pdf";

const { chapters, problems } = buildAtlas();
if (problems.length) {
  console.error(`refusing to render with ${problems.length} compile problems`);
  for (const p of problems) console.error(`  - ${p}`);
  process.exit(1);
}

const esc = (s) =>
  String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/** Same subset the in-app renderer supports. */
function mdToHtml(md) {
  const lines = md.split("\n");
  const out = [];
  let para = [];
  let list = null;
  const inline = (t) =>
    esc(t)
      .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
      .replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, "<em>$1</em>")
      .replace(/`([^`]+)`/g, "<code>$1</code>");
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

function entryHtml(e) {
  const pills = [
    e.voiceType,
    e.belt ? `full voice to ${e.belt}` : null,
    e.whistle ? "whistle register" : null,
  ]
    .filter(Boolean)
    .map((p) => `<span class="pill">${esc(p)}</span>`)
    .join("");
  const sources =
    e.lowSource || e.highSource
      ? `<p class="e-src">${[
          e.lowSource ? `low ${esc(e.low)} in “${esc(e.lowSource)}”` : null,
          e.highSource ? `high ${esc(e.high)} in “${esc(e.highSource)}”` : null,
        ]
          .filter(Boolean)
          .join(" · ")}</p>`
      : "";
  return `<section class="entry">
    <p class="e-head"><strong>${esc(e.name)}</strong><span class="e-range">${esc(e.low)}–${esc(e.high)} · ${esc(e.span)}</span></p>
    <p class="e-meta">${pills}${esc(e.country)} · prominent since ${e.activeFrom} · known for “${esc(e.signatureSong)}”</p>
    ${sources}
    <p class="e-blurb">${esc(e.blurb)}</p>
    ${e.technique ? `<p class="e-tech">${esc(e.technique)}</p>` : ""}
  </section>`;
}

/** Parts in reading order, each with the chapters under it. */
const parts = [];
for (const chapter of chapters) {
  if (parts.at(-1)?.name !== chapter.part) parts.push({ name: chapter.part, chapters: [] });
  parts.at(-1).chapters.push(chapter);
}

const partId = (i) => `part-${i + 1}`;
const chapterId = (order) => `ch-${order}`;

let lastPart = "";
let partIndex = -1;
const body = chapters
  .map((c) => {
    let partOpener = "";
    if (c.part !== lastPart) {
      lastPart = c.part;
      partIndex += 1;
      partOpener = `<section class="part" id="${partId(partIndex)}"><p class="part-label">Part</p><h1>${esc(c.part)}</h1></section>`;
    }
    const entries = c.entries.length
      ? `<div class="entries">${c.entries.map(entryHtml).join("\n")}</div>`
      : "";
    return `${partOpener}<section class="chapter" id="${chapterId(c.order)}">
      <p class="ch-num">Chapter ${esc(String(c.order))}<a class="back" href="#contents">Contents</a></p>
      <h1>${esc(c.title)}</h1>
      ${mdToHtml(c.body)}
      ${entries}
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
        .map((c) => {
          const roster = c.entries.length
            ? `<p class="c-roster">${c.entries.map((e) => esc(e.name)).join(" · ")}</p>`
            : "";
          return `<li class="c-row">
            <a href="#${chapterId(c.order)}">
              <span class="c-n">${esc(String(c.order))}</span>
              <span class="c-t">${esc(c.title)}</span>
              <span class="c-dots"></span>
              ${num(chapterId(c.order))}
            </a>
            ${roster}
          </li>`;
        })
        .join("\n");
      return `<li class="c-part">
          <a href="#${partId(i)}"><span class="c-t">${esc(part.name)}</span><span class="c-dots"></span>${num(partId(i))}</a>
        </li>
        ${chapterRows}`;
    })
    .join("\n");

  return `<nav class="contents" id="contents">
    <p class="c-label">Contents</p>
    <h1>${esc(ATLAS_TITLE)}</h1>
    <p class="c-hint">Every line below is a link — tap a chapter to jump straight to it, and
    the names under each chapter are the voices it covers. Every chapter has a link back here.</p>
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
          display: flex; flex-direction: column; justify-content: center;
          border-top: 1pt solid #ddd4c4; padding-top: 6mm; }
  .part-label { font-family: ui-monospace, Menlo, monospace; font-size: 8pt; letter-spacing: .22em;
                text-transform: uppercase; color: #9d3f33; margin: 0 0 4mm; }
  .part h1 { font-size: 22pt; margin: 0; letter-spacing: -.02em; }
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
  .c-dots { flex: 1 1 auto; align-self: center; height: 0;
            border-bottom: .5pt dotted #c9bda0; margin: 0 1.5mm; }
  .pg { flex: 0 0 9mm; text-align: right; font-family: ui-monospace, Menlo, monospace;
        font-size: 8.5pt; font-variant-numeric: tabular-nums; color: #5c564d; }
  .c-roster { margin: .8mm 0 1.8mm 7mm; font-size: 7.5pt; line-height: 1.5; color: #8a8272; }

  .chapter h1 { font-size: 17pt; margin: 0 0 6mm; letter-spacing: -.015em; line-height: 1.15; }
  h2 { font-size: 12pt; margin: 8mm 0 2mm; letter-spacing: -.01em; }
  h3, h4 { font-size: 11pt; margin: 6mm 0 2mm; }
  p { margin: 0 0 3.5mm; color: #3a3833; }
  ul { margin: 0 0 3.5mm; padding-left: 5mm; }
  li { margin: 0 0 1.6mm; color: #3a3833; }
  strong { color: #20201d; }
  code { font-family: ui-monospace, Menlo, monospace; font-size: 9.5pt; }

  /* Singer entries */
  .entries { margin-top: 6mm; }
  .entry { border-top: .5pt solid #ddd4c4; padding-top: 3mm; margin-top: 3mm;
           page-break-inside: avoid; }
  .e-head { display: flex; justify-content: space-between; align-items: baseline;
            gap: 3mm; margin: 0 0 1mm; font-size: 11pt; }
  .e-range { font-family: ui-monospace, Menlo, monospace; font-size: 8.5pt; color: #5c564d;
             white-space: nowrap; }
  .e-meta { font-size: 8.5pt; color: #8a8272; margin: 0 0 1.5mm; }
  .pill { display: inline-block; border: .5pt solid #c9bda0; border-radius: 3mm;
          padding: 0 2mm; margin-right: 1.5mm; font-family: ui-monospace, Menlo, monospace;
          font-size: 7.5pt; color: #5c564d; }
  .e-src { font-family: ui-monospace, Menlo, monospace; font-size: 7.5pt;
           text-transform: uppercase; letter-spacing: .08em; color: #8a8272; margin: 0 0 1.5mm; }
  .e-blurb { font-style: italic; color: #5c564d; font-size: 9.5pt; margin: 0 0 1.5mm; }
  .e-tech { font-size: 9.5pt; margin: 0; }
  .note { page-break-before: always; color: #5c564d; font-size: 9.5pt; }
`;

const documentHtml = (pages) => `<!doctype html><html lang="en"><head><meta charset="utf-8">
<title>${esc(ATLAS_TITLE)}</title><style>${styles}</style></head><body>
  <section class="cover">
    <p class="kicker">Included with Suede Pro</p>
    <h1>${esc(ATLAS_TITLE)}</h1>
    <p class="sub">${esc(ATLAS_SUBTITLE)}</p>
    <p class="mark">Suede Sing</p>
  </section>
  ${contentsHtml(pages)}
  ${body}
  <section class="note">
    <h2>A note on the figures</h2>
    <p>Every range in this book is a commonly cited figure — compiled from recordings and
    public discussion, not lab measurements — and the extreme notes are one-off recorded
    moments rather than anyone's everyday voice. The technique notes describe how voices
    sound on record.</p>
    <p>And a note on practice: nothing here is medicine. If singing hurts, if you are
    hoarse and it will not clear, or if you ever see blood, that is a question for a
    doctor or a speech-language pathologist — there is no waiting period, and you do not
    need to be sure it is serious before you go.</p>
  </section>
</body></html>`;

const PDF_OPTIONS = {
  format: "A5",
  printBackground: true,
  displayHeaderFooter: true,
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

/** Printed page number of every part and chapter opener, read back from pass one. */
function locateOpeners(pdfPath) {
  const text = execFileSync("pdftotext", [pdfPath, "-"], {
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024,
  });
  const pageTexts = text.split("\f");
  const found = new Map();

  const firstPage = (test) => {
    const i = pageTexts.findIndex(test);
    return i === -1 ? null : i + 1;
  };

  parts.forEach((part, i) => {
    const name = part.name.toUpperCase();
    const at = firstPage(
      (t) => t.includes("PART") && t.toUpperCase().includes(name),
    );
    if (at) found.set(partId(i), at);
  });

  for (const c of chapters) {
    const label = new RegExp(`CHAPTER\\s+${c.order}\\b`);
    const at = firstPage((t) => label.test(t));
    if (at) found.set(chapterId(c.order), at);
  }

  const missing = [
    ...parts.map((_, i) => partId(i)),
    ...chapters.map((c) => chapterId(c.order)),
  ].filter((id) => !found.has(id));
  if (missing.length > 0) {
    console.warn(
      `warning: no page found for ${missing.length} opener(s): ${missing.join(", ")}`,
    );
  }
  return found;
}

// Pass one: placeholder page numbers, only so the contents can be measured.
const scratch = mkdtempSync(join(tmpdir(), "atlas-pdf-"));
const probe = join(scratch, "probe.pdf");
await render(documentHtml(null), probe);
const pages = locateOpeners(probe);

// Pass two: the real thing.
await render(documentHtml(pages), OUT);
await browser.close();

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

const words = chapters.reduce((n, c) => n + c.words, 0);
const entryCount = chapters.reduce((n, c) => n + c.entries.length, 0);
console.log(
  `wrote ${OUT} — ${chapters.length} chapters, ${entryCount} entries, ${words} words, ${finalPages} pages`,
);
writeFileSync(
  "public/the-voice-atlas.txt",
  `${ATLAS_TITLE}\n${ATLAS_SUBTITLE}\n\n${chapters.length} chapters, ${words} words.\n`,
);
