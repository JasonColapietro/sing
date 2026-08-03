/**
 * Render The Voice Atlas to content/pdfs/the-voice-atlas.pdf.
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
import { ATLAS_SUBTITLE, ATLAS_TITLE, buildAtlas, labelToMidi } from "./compile-atlas.mjs";

// Not public/ — a paid benefit, served only through /api/book/pdf after a
// Stripe check. Writing it into public/ would republish the whole book.
const OUT = "content/pdfs/the-voice-atlas.pdf";

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

/**
 * The range bar: every entry's span drawn on one fixed axis, so two singers
 * three pages apart are still comparable by eye. This is a book about vocal
 * ranges that, until now, only ever stated them as text.
 *
 * The axis is C1-C8 — wide enough for every voice in the library, including
 * the whistle tops, and the octave ticks give the eye something to measure
 * against. A belt note, where one is recorded, marks where full voice stops
 * and the lighter registers above it begin.
 */
const AXIS_LOW = 24; // C1
const AXIS_HIGH = 108; // C8
const axisPct = (midi) => ((midi - AXIS_LOW) / (AXIS_HIGH - AXIS_LOW)) * 100;

function rangeBarHtml(e) {
  // Derived from the printed note labels, not from midi fields: the compiled
  // atlas entry carries `low`/`high` as labels only. Reading a field that
  // isn't there yields NaN, which CSS silently drops — an invisible bar with
  // no error anywhere.
  const lowMidi = labelToMidi(e.low);
  const highMidi = labelToMidi(e.high);
  if (lowMidi == null || highMidi == null) {
    throw new Error(
      `Unreadable range for ${e.name}: ${e.low}–${e.high}. A bar drawn from an ` +
        `unparseable note is invisible rather than wrong, so this stops the build.`,
    );
  }

  const left = axisPct(lowMidi);
  const width = axisPct(highMidi + 1) - left;
  const beltMidi = e.belt ? labelToMidi(e.belt) : null;
  // Only meaningful when the belt sits inside the drawn span.
  const belt =
    beltMidi != null && beltMidi > lowMidi && beltMidi < highMidi
      ? `<span class="rb-belt" style="left:${axisPct(beltMidi)}%"></span>`
      : "";
  const ticks = [36, 48, 60, 72, 84, 96]
    .map((m) => `<span class="rb-tick" style="left:${axisPct(m)}%"></span>`)
    .join("");
  return `<div class="rb" role="img" aria-label="Range ${esc(e.low)} to ${esc(e.high)}">
    ${ticks}
    <span class="rb-span" style="left:${left}%;width:${width}%"></span>
    ${belt}
  </div>`;
}

/**
 * The axis key, printed once above each chapter's entries. It does two jobs:
 * says what the bars mean, and labels the octave ticks so a reader can read an
 * approximate pitch straight off a bar instead of only comparing shapes.
 */
function axisKeyHtml() {
  const labels = [
    [36, "C2"],
    [48, "C3"],
    [60, "C4"],
    [72, "C5"],
    [84, "C6"],
    [96, "C7"],
  ]
    .map(
      ([m, label]) =>
        `<span class="ak-l" style="left:${axisPct(m)}%">${label}</span>`,
    )
    .join("");
  return `<div class="axis-key">
    <p class="ak-cap">Range bars below share one axis, C1 to C8.
      <span class="ak-belt-key"></span> marks the top of full voice.</p>
    <div class="ak-scale">${labels}</div>
  </div>`;
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
    ${rangeBarHtml(e)}
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

const ROMAN = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"];

/** A part opener that lists the chapters under it, as links. */
function partOpenerHtml(part, i, pages) {
  const rows = part.chapters
    .map((c) => {
      const n = pages?.get(chapterId(c.order));
      return `<li><a href="#${chapterId(c.order)}">
        <span class="p-n">${esc(String(c.order))}</span>
        <span class="p-t">${esc(c.title)}</span>
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

function bodyHtml(pages) {
  let lastPart = "";
  let partIndex = -1;
  return chapters
    .map((c, i) => {
      let opener = "";
      if (c.part !== lastPart) {
        lastPart = c.part;
        partIndex += 1;
        opener = partOpenerHtml(parts[partIndex], partIndex, pages);
      }
      const entries = c.entries.length
        ? `<div class="entries">${axisKeyHtml()}${c.entries.map(entryHtml).join("\n")}</div>`
        : "";
      const next = chapters[i + 1];
      const tail = next
        ? `<p class="ch-next"><a href="#${chapterId(next.order)}">
             <span class="nx-label">Next</span>
             <span class="nx-title">${esc(next.title)}</span>
             <span class="nx-arrow">\u2192</span>
           </a></p>`
        : `<p class="ch-next"><a href="#colophon">
             <span class="nx-label">End of the last chapter</span>
             <span class="nx-title">Colophon</span>
             <span class="nx-arrow">\u2192</span>
           </a></p>`;
      return `${opener}<section class="chapter" id="${chapterId(c.order)}">
        <p class="ch-num"><span>Chapter ${esc(String(c.order))}</span><a class="back" href="#contents">Contents</a></p>
        <div class="ch-head">
          <span class="ch-big">${esc(String(c.order))}</span>
          <h1>${esc(c.title)}</h1>
        </div>
        ${mdToHtml(c.body)}
        ${entries}
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
    the names under each chapter are the voices it covers. Every chapter links back here
    and on to the next one.</p>
    <ol class="c-list">${rows}</ol>
  </nav>`;
}

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
  /* A keyboard-span motif: the range bars this book is a catalogue of. */
  .trace { margin-top: auto; display: flex; flex-direction: column; gap: 2mm; }
  .trace .row { height: 4.6mm; background: #efe6d5; border-radius: 2.3mm; position: relative; }
  .trace .row span { position: absolute; top: 0; height: 100%; border-radius: 2.3mm;
                     background: #b6c9c4; }
  .trace .row.lit span { background: #9d3f33; }
  .cover .mark { margin-top: 8mm; font-family: ui-monospace, Menlo, monospace;
                 font-size: 8pt; letter-spacing: .18em; text-transform: uppercase; color: #8a8272; }
  .cover .mark .dot { margin: 0 2mm; color: #c9bda0; }

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
  .ch-head { display: flex; align-items: flex-start; gap: 4mm; margin-bottom: 7mm; }
  .ch-big { font-family: ui-monospace, Menlo, monospace; font-size: 26pt; line-height: .82;
            color: #e4d9c6; letter-spacing: -.03em; flex: 0 0 auto; }
  .ch-next { margin: 9mm 0 0; padding-top: 3mm; border-top: .5pt solid #efe6d5;
             page-break-inside: avoid; }
  .ch-next a { color: inherit; text-decoration: none; display: flex; align-items: baseline; gap: 2.5mm; }
  .nx-label { font-family: ui-monospace, Menlo, monospace; font-size: 7.5pt; letter-spacing: .18em;
              text-transform: uppercase; color: #8a8272; flex: 0 0 auto; }
  .nx-title { flex: 1 1 auto; color: #9d3f33; font-size: 10pt; }
  .nx-arrow { color: #9d3f33; flex: 0 0 auto; }

  /* Colophon */
  .colophon { page-break-before: always; border-top: 1pt solid #ddd4c4; padding-top: 7mm;
              display: flex; flex-direction: column; height: 86vh; }
  .colophon h2 { font-size: 15pt; margin: 0 0 4mm; }
  .colophon p { font-size: 9.5pt; color: #5c564d; max-width: 92%; }
  .colo-meta { margin-top: auto; font-family: ui-monospace, Menlo, monospace; font-size: 8pt;
               letter-spacing: .14em; text-transform: uppercase; color: #8a8272;
               border-top: .5pt solid #efe6d5; padding-top: 3mm; }
  .colo-meta a { color: #9d3f33; text-decoration: none; }

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

  .chapter h1 { align-self: center; font-size: 17pt; margin: 0; letter-spacing: -.015em; line-height: 1.15; }
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
  /* Range bar: one C1-C8 axis for the whole book, so spans are comparable by
     eye across chapters. Octave ticks sit under the track; the belt mark shows
     where full voice gives way to the lighter registers above it. */
  .rb { position: relative; height: 3.2mm; margin: 0 0 2mm;
        background: #f2ebde; border-radius: 1.6mm; }
  .rb-tick { position: absolute; top: 0; width: .3pt; height: 100%;
             background: #e0d5c0; }
  .rb-span { position: absolute; top: 0; height: 100%; border-radius: 1.6mm;
             background: #7ea39c; }
  .rb-belt { position: absolute; top: -.5mm; width: .9pt; height: calc(100% + 1mm);
             background: #9d3f33; border-radius: .45pt; }
  .axis-key { margin: 0 0 4mm; page-break-inside: avoid; page-break-after: avoid; }
  .ak-cap { font-size: 8pt; color: #8a8272; margin: 0 0 1.5mm; }
  .ak-belt-key { display: inline-block; width: .9pt; height: 2.6mm; background: #9d3f33;
                 vertical-align: -.3mm; margin: 0 .6mm; }
  .ak-scale { position: relative; height: 3.4mm; border-top: .4pt solid #e0d5c0; }
  .ak-l { position: absolute; top: .6mm; font-family: ui-monospace, Menlo, monospace;
          font-size: 6.5pt; color: #b0a695; }
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

/** A few real spans from the library, drawn as range bars on the cover. */
const COVER_RANGES = [[18, 62], [28, 74], [8, 96], [34, 70], [22, 58]];

const documentHtml = (pages) => `<!doctype html><html lang="en"><head><meta charset="utf-8">
<title>${esc(ATLAS_TITLE)}</title><style>${styles}</style></head><body>
  <section class="cover">
    <p class="kicker">Included with Suede Pro</p>
    <h1>${esc(ATLAS_TITLE)}</h1>
    <p class="sub">${esc(ATLAS_SUBTITLE)}</p>
    <div class="trace">
      ${COVER_RANGES.map(
        (r, i) =>
          `<div class="row${i === 2 ? " lit" : ""}"><span style="left:${r[0]}%;width:${r[1] - r[0]}%"></span></div>`,
      ).join("")}
    </div>
    <p class="mark">Suede Sing<span class="dot">\u00b7</span>sing.suedeai.ai</p>
  </section>
  ${contentsHtml(pages)}
  ${bodyHtml(pages)}
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
  <section class="colophon" id="colophon">
    <h2>Colophon</h2>
    <p>${esc(ATLAS_TITLE)} — ${esc(ATLAS_SUBTITLE)}. Written for Suede Sing, the browser
    vocal studio, and included with a Suede Pro subscription. ${chapters.length} chapters
    in ${parts.length} parts.</p>
    <p>Typeset from the same source the app reads, so the book and the in-app chapters
    can never disagree. Every contents row, part list and chapter footer in this file is
    a live link, and the contents double as the index — every singer covered is named
    there.</p>
    <p class="colo-meta">
      Suede Sing \u00b7 <a href="https://sing.suedeai.ai">sing.suedeai.ai</a> \u00b7
      <a href="#contents">Contents</a>
    </p>
  </section>
</body></html>`;

const PDF_OPTIONS = {
  format: "A5",
  printBackground: true,
  displayHeaderFooter: true,
  tagged: true,
  outline: true,
  headerTemplate:
    '<div style="width:100%;padding:0 16mm;font-size:6.5pt;letter-spacing:.18em;text-transform:uppercase;color:#c9bda0;font-family:Menlo,monospace;text-align:right;">The Voice Atlas</div>',
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

  // A part title long enough to wrap arrives from pdftotext with a newline in
  // the middle of it, so the comparison has to ignore how the line broke.
  const flat = (str) => str.toUpperCase().replace(/\s+/g, " ");

  parts.forEach((part, i) => {
    const name = flat(part.name);
    const at = firstPage((t) => t.includes("PART") && flat(t).includes(name));
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
  // "00" in the contents of a paid book, arriving silently, is not a warning.
  if (missing.length > 0) {
    throw new Error(
      `No printed page found for ${missing.length} opener(s): ${missing.join(", ")}. ` +
        `The contents would show "00" for these.`,
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
