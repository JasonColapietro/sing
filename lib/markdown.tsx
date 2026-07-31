import type { ReactNode } from "react";

/**
 * Minimal markdown renderer for the book — headings, paragraphs, lists,
 * blockquotes, bold/italic and inline code.
 *
 * The book is the only markdown in the app and it is written in-house, so a
 * parser dependency would be more surface than the job needs. Output is React
 * elements, never a dangerouslySetInnerHTML string, so a stray angle bracket in
 * a chapter can't become markup.
 */

type Inline = ReactNode;

/** Bold, italic and code, applied in that order so `**a *b* **` nests. */
function renderInline(text: string, keyPrefix: string): Inline[] {
  const out: Inline[] = [];
  const re = /(\*\*[^*]+\*\*|(?<!\*)\*[^*]+\*(?!\*)|`[^`]+`)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let i = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index));
    const tok = m[0];
    const key = `${keyPrefix}-i${i++}`;
    if (tok.startsWith("**")) {
      out.push(
        <strong key={key} className="font-semibold text-ink">
          {tok.slice(2, -2)}
        </strong>,
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

export function Markdown({ source }: { source: string }) {
  const lines = source.replace(/\r\n/g, "\n").split("\n");
  const blocks: ReactNode[] = [];
  let para: string[] = [];
  let list: string[] | null = null;
  let quote: string[] | null = null;
  let k = 0;

  const flushPara = () => {
    if (!para.length) return;
    const text = para.join(" ").trim();
    para = [];
    if (text) {
      blocks.push(
        <p key={`p${k++}`} className="mt-4 leading-relaxed text-mut">
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
          <li key={idx} className="flex gap-3 leading-relaxed text-mut">
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
        className="mt-5 border-l-2 border-amber/50 pl-4 text-mut italic"
      >
        {renderInline(text, `q${k}`)}
      </blockquote>,
    );
  };
  const flushAll = () => {
    flushPara();
    flushList();
    flushQuote();
  };

  for (const raw of lines) {
    const line = raw.trimEnd();

    if (!line.trim()) {
      flushAll();
      continue;
    }
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
