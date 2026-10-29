import type { ReactNode } from "react";
import Link from "next/link";
import { MARKDOWN_FIGURES, parseFigureLine } from "@/lib/markdown-figures";

/**
 * Minimal markdown renderer for the books and lessons: headings, paragraphs,
 * lists, blockquotes, pipe tables, `::figure` lines, bold/italic, inline code
 * and internal links.
 *
 * Tables are the GitHub subset: a header row, a `|---|` separator, body rows,
 * no alignment and no multi-line cells; the first column is a row header.
 * `::figure <id> [key=value…] | caption` places a figure from
 * lib/markdown-figures.tsx; an unknown id renders nothing (and fails
 * lib/book-pages.test.tsx), so a typo never prints a raw directive. The two PDF
 * builders mirror both.
 *
 * The book is the only markdown in the app and it is written in-house, so a
 * parser dependency would be more surface than the job needs. Output is React
 * elements, never a dangerouslySetInnerHTML string, so a stray angle bracket in
 * a chapter can't become markup.
 */

type Inline = ReactNode;

/**
 * `[label](/path)` — a site-relative path only. A "Try this" that names a room
 * should be one tap from it, but a chapter has no business sending a reader off
 * the site, so anything else (`https://…`, a protocol-relative `//host`) stays
 * literal text rather than becoming a link.
 */
const LINK = /^\[([^\]]+)\]\((\/(?!\/)[^)\s]*)\)$/;

/** Bold, italic, code and internal links, in that order so `**a *b* **` nests. */
function renderInline(text: string, keyPrefix: string): Inline[] {
  const out: Inline[] = [];
  const re =
    /(\*\*[^*]+\*\*|(?<!\*)\*[^*]+\*(?!\*)|`[^`]+`|\[[^\]]+\]\(\/(?!\/)[^)\s]*\))/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let i = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index));
    const tok = m[0];
    const key = `${keyPrefix}-i${i++}`;
    if (tok.startsWith("**")) {
      out.push(
        <strong key={key} className="font-semibold">
          {tok.slice(2, -2)}
        </strong>,
      );
    } else if (tok.startsWith("[")) {
      const [, label, href] = LINK.exec(tok)!;
      out.push(
        <Link
          key={key}
          href={href}
          className="text-violet-ink underline decoration-violet/50 underline-offset-4 hover:decoration-violet"
        >
          {label}
        </Link>,
      );
    } else if (tok.startsWith("`")) {
      out.push(
        <code
          key={key}
          className="rounded bg-panel2 px-1 py-0.5 font-mono text-[0.9em]"
        >
          {tok.slice(1, -1)}
        </code>,
      );
    } else {
      out.push(
        <em key={key} className="italic">
          {tok.slice(1, -1)}
        </em>,
      );
    }
    last = m.index + tok.length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

const TABLE_SEP = /^\|?(\s*:?-{3,}:?\s*\|)+\s*(:?-{3,}:?\s*)?\|?$/;
const cells = (l: string) =>
  l.trim().replace(/^\|/, "").replace(/\|$/, "").split("|").map((c) => c.trim());

export function Markdown({ source }: { source: string }) {
  const lines = source.replace(/\r\n/g, "\n").split("\n");
  const blocks: ReactNode[] = [];
  let para: string[] = [];
  let list: string[] | null = null;
  let quote: string[] | null = null;
  let table: string[] | null = null;
  let k = 0;

  const flushPara = () => {
    if (!para.length) return;
    const text = para.join(" ").trim();
    para = [];
    if (text) {
      blocks.push(
        <p key={`p${k++}`} className="mt-5 text-[1.0625rem] leading-[1.7] text-ink/85">
          {renderInline(text, `p${k}`)}
        </p>,
      );
    }
  };
  const flushList = () => {
    if (!list) return;
    const items = list;
    list = null;
    blocks.push(
      <ul key={`u${k++}`} className="mt-4 space-y-2">
        {items.map((it, idx) => (
          <li key={idx} className="flex gap-3 text-[1.0625rem] leading-[1.7] text-ink/85">
            <span aria-hidden="true" className="text-amber-ink">
              ·
            </span>
            <span>{renderInline(it, `u${k}-${idx}`)}</span>
          </li>
        ))}
      </ul>,
    );
  };
  const flushQuote = () => {
    if (!quote) return;
    const text = quote.join(" ").trim();
    quote = null;
    blocks.push(
      <blockquote
        key={`q${k++}`}
        className="mt-6 border-l-2 border-line2 pl-5 text-[1.0625rem] leading-[1.7] text-mut italic"
      >
        {renderInline(text, `q${k}`)}
      </blockquote>,
    );
  };
  const flushTable = () => {
    if (!table) return;
    const rows = table;
    table = null;
    const hasHead = rows.length > 1 && TABLE_SEP.test(rows[1].trim());
    const head = hasHead ? cells(rows[0]) : null;
    const body = rows.slice(hasHead ? 2 : 0).map(cells);
    const key = k++;
    blocks.push(
      <div key={`t${key}`} className="mt-6 overflow-x-auto">
        <table className="w-full border-collapse text-left text-[0.975rem] leading-snug">
          {head && (
            <thead>
              <tr>
                {head.map((c, i) => (
                  <th
                    key={i}
                    scope="col"
                    className="border-b border-line2 py-2 pr-4 font-mono text-[11px] font-normal uppercase tracking-[0.12em] text-dim"
                  >
                    {renderInline(c, `t${key}-h${i}`)}
                  </th>
                ))}
              </tr>
            </thead>
          )}
          <tbody>
            {body.map((r, ri) => (
              <tr key={ri} className="border-b border-line/60 align-top">
                {r.map((c, ci) =>
                  ci === 0 ? (
                    <th key={ci} scope="row" className="py-2 pr-4 font-medium text-ink">
                      {renderInline(c, `t${key}-${ri}-${ci}`)}
                    </th>
                  ) : (
                    <td key={ci} className="py-2 pr-4 text-ink/85">
                      {renderInline(c, `t${key}-${ri}-${ci}`)}
                    </td>
                  ),
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>,
    );
  };
  const flushAll = () => {
    flushPara();
    flushList();
    flushQuote();
    flushTable();
  };

  for (const raw of lines) {
    const line = raw.trimEnd();

    if (!line.trim()) {
      flushAll();
      continue;
    }
    const fig = parseFigureLine(line);
    if (fig) {
      flushAll();
      const drawn = MARKDOWN_FIGURES[fig.id]?.(fig.args);
      if (drawn) {
        const key = k++;
        blocks.push(
          <figure key={`f${key}`} className="mt-8 overflow-hidden rounded-2xl border border-line bg-panel">
            {/* Visible overflow: a keyboard strip centres its end labels on the end keys. */}
            <div className="p-4 [&_svg]:overflow-visible">{drawn}</div>
            {fig.caption && (
              <figcaption className="border-t border-line px-4 py-2.5 text-sm leading-snug text-mut">
                {renderInline(fig.caption, `f${key}`)}
              </figcaption>
            )}
          </figure>,
        );
      }
      continue;
    }
    if (line.trimStart().startsWith("|")) {
      flushPara();
      flushList();
      flushQuote();
      (table ??= []).push(line);
      continue;
    }
    flushTable();
    const heading = /^(#{2,4})\s+(.*)$/.exec(line);
    if (heading) {
      flushAll();
      const depth = heading[1].length;
      const text = heading[2];
      const cls =
        depth === 2
          ? "mt-10 text-2xl"
          : depth === 3
            ? "mt-8 text-xl"
            : "mt-6 text-lg";
      blocks.push(
        depth === 2 ? (
          <h2 key={`h${k++}`} className={cls}>
            {text}
          </h2>
        ) : depth === 3 ? (
          <h3 key={`h${k++}`} className={cls}>
            {text}
          </h3>
        ) : (
          <h4 key={`h${k++}`} className={cls}>
            {text}
          </h4>
        ),
      );
      continue;
    }
    const bullet = /^[-*]\s+(.*)$/.exec(line);
    if (bullet) {
      flushPara();
      flushQuote();
      (list ??= []).push(bullet[1]);
      continue;
    }
    const bq = /^>\s?(.*)$/.exec(line);
    if (bq) {
      flushPara();
      flushList();
      (quote ??= []).push(bq[1]);
      continue;
    }
    if (/^(---|\*\*\*)$/.test(line.trim())) {
      flushAll();
      blocks.push(<hr key={`r${k++}`} className="mt-8 border-line" />);
      continue;
    }
    flushList();
    flushQuote();
    para.push(line.trim());
  }
  flushAll();

  return <>{blocks}</>;
}
