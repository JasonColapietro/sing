/**
 * The two pieces of chapter markdown the PDF builders share with the in-app
 * renderer (lib/markdown.tsx) beyond paragraphs and lists: pipe tables and
 * `::figure` lines. Figures come from the same registry the site uses
 * (lib/markdown-figures.tsx), rendered to static SVG, so the printed book
 * shows the drawing the reader sees on screen.
 */
import { createJiti } from "jiti";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const jiti = createJiti(import.meta.url, {
  alias: { "@/": ROOT },
  jsx: { runtime: "automatic" },
});
const { MARKDOWN_FIGURES, parseFigureLine } = await jiti.import("../lib/markdown-figures.tsx");
const { renderToStaticMarkup } = await jiti.import("react-dom/server");
const { createElement, Fragment } = await jiti.import("react");

const TABLE_SEP = /^\|?(\s*:?-{3,}:?\s*\|)+\s*(:?-{3,}:?\s*)?\|?$/;
const cells = (l) => l.trim().replace(/^\|/, "").replace(/\|$/, "").split("|").map((c) => c.trim());

export const isTableLine = (line) => line.startsWith("|");

/** Rows of a pipe table (raw lines) to HTML; `inline` formats each cell. */
export function tableHtml(rows, inline) {
  const hasHead = rows.length > 1 && TABLE_SEP.test(rows[1]);
  const head = hasHead ? cells(rows[0]) : null;
  const body = rows.slice(hasHead ? 2 : 0).map(cells);
  const thead = head
    ? `<thead><tr>${head.map((c) => `<th scope="col">${inline(c)}</th>`).join("")}</tr></thead>`
    : "";
  const tbody = body
    .map(
      (r) =>
        `<tr>${r.map((c, i) => (i === 0 ? `<th scope="row">${inline(c)}</th>` : `<td>${inline(c)}</td>`)).join("")}</tr>`,
    )
    .join("");
  return `<table class="md-table">${thead}<tbody>${tbody}</tbody></table>`;
}

/**
 * A `::figure` line to HTML, or null when the line is not one. An unknown id
 * fails the build: the site renders nothing for it, and a test catches it
 * there, but a paid PDF should not quietly lose a figure either.
 */
export function figureHtml(line, inline) {
  const fig = parseFigureLine(line);
  if (!fig) return null;
  const draw = MARKDOWN_FIGURES[fig.id];
  const node = draw?.(fig.args);
  if (!node) throw new Error(`Unknown or unreadable figure: ${line}`);
  const svg = renderToStaticMarkup(createElement(Fragment, null, node));
  const caption = fig.caption ? `<figcaption>${inline(fig.caption)}</figcaption>` : "";
  return `<figure class="md-figure"><div class="md-figure-art">${svg}</div>${caption}</figure>`;
}

/** Print styles for both, appended to each builder's stylesheet. */
export const MARKDOWN_PDF_STYLES = `
  :root { --font-mono: ui-monospace, Menlo, "Liberation Mono", monospace; }
  .md-table { width: 100%; border-collapse: collapse; margin: 1mm 0 4.5mm; font-size: 9.5pt;
              line-height: 1.4; page-break-inside: avoid; }
  .md-table th, .md-table td { text-align: left; vertical-align: top; padding: 1.4mm 3mm 1.4mm 0;
                               border-bottom: .4pt solid #efe6d5; color: #3a3833; }
  .md-table thead th { font-family: ui-monospace, Menlo, monospace; font-size: 7.5pt; font-weight: normal;
                       letter-spacing: .14em; text-transform: uppercase; color: #6b6455;
                       border-bottom: .6pt solid #c9bda0; }
  .md-table tbody th { font-weight: 600; color: #20201d; }
  .md-figure { margin: 2mm 0 5mm; border: .5pt solid #d6cbb7; border-radius: 3mm; overflow: hidden;
               page-break-inside: avoid; background: #fffaf2; }
  .md-figure-art { padding: 3mm; }
  .md-figure-art svg { display: block; width: 100%; height: auto; max-height: 52mm; }
  .md-figure figcaption { border-top: .5pt solid #d6cbb7; padding: 2mm 3mm; font-size: 8.5pt;
                          line-height: 1.4; color: #5c564d; }
`;
