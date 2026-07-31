/**
 * Render the book to public/the-measured-voice.pdf.
 *
 * Usage: node scripts/build-book-pdf.mjs
 *
 * Playwright is a dev-only dependency of this script, not of the app — the PDF
 * is built when the text changes and committed, so no runtime dependency and no
 * serverless PDF rendering. Run it after scripts/compile-book.mjs.
 */
import { readFileSync, readdirSync, writeFileSync } from "node:fs";
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

let lastPart = "";
const body = chapters
  .map(({ meta, body }) => {
    const partOpener =
      meta.part !== lastPart
        ? ((lastPart = meta.part),
          `<section class="part"><p class="part-label">Part</p><h1>${esc(meta.part)}</h1></section>`)
        : "";
    return `${partOpener}<section class="chapter">
      <p class="ch-num">Chapter ${esc(String(meta.order))}</p>
      <h1>${esc(meta.title)}</h1>
      ${mdToHtml(body)}
    </section>`;
  })
  .join("\n");

const html = `<!doctype html><html><head><meta charset="utf-8"><style>
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
            text-transform: uppercase; color: #8a8272; margin: 0 0 3mm; }
  .chapter h1 { font-size: 17pt; margin: 0 0 6mm; letter-spacing: -.015em; line-height: 1.15; }
  h2 { font-size: 12pt; margin: 8mm 0 2mm; letter-spacing: -.01em; }
  h3, h4 { font-size: 11pt; margin: 6mm 0 2mm; }
  p { margin: 0 0 3.5mm; color: #3a3833; }
  ul { margin: 0 0 3.5mm; padding-left: 5mm; }
  li { margin: 0 0 1.6mm; color: #3a3833; }
  strong { color: #20201d; }
  code { font-family: ui-monospace, Menlo, monospace; font-size: 9.5pt; }
  .note { page-break-before: always; color: #5c564d; font-size: 9.5pt; }
</style></head><body>
  <section class="cover">
    <p class="kicker">Included with Suede Pro</p>
    <h1>${esc(TITLE)}</h1>
    <p class="sub">${esc(SUBTITLE)}</p>
    <p class="mark">Suede Sing</p>
  </section>
  ${body}
  <section class="note">
    <h2>A note on what this book is not</h2>
    <p>This is a book about practice, not medicine. Nothing in it diagnoses or treats
    anything. If singing hurts, if you are hoarse and it will not clear, or if you ever
    see blood, that is a question for a doctor or a speech-language pathologist. There is
    no waiting period, and you do not need to be sure it is serious before you go.</p>
  </section>
</body></html>`;

const browser = await chromium.launch();
const page = await browser.newPage();
await page.setContent(html, { waitUntil: "load" });
await page.pdf({
  path: OUT,
  format: "A5",
  printBackground: true,
  displayHeaderFooter: true,
  headerTemplate: "<span></span>",
  footerTemplate:
    '<div style="width:100%;font-size:7pt;color:#8a8272;font-family:Helvetica,Arial,sans-serif;text-align:center;"><span class="pageNumber"></span></div>',
  margin: { top: "18mm", bottom: "16mm", left: "16mm", right: "16mm" },
});
await browser.close();

const words = chapters.reduce(
  (n, c) => n + c.body.split(/\s+/).filter(Boolean).length,
  0,
);
console.log(`wrote ${OUT} — ${chapters.length} chapters, ${words} words`);
writeFileSync(
  "public/the-measured-voice.txt",
  `${TITLE}\n${SUBTITLE}\n\n${chapters.length} chapters, ${words} words.\n`,
);
