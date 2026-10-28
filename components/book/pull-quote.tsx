/** A sentence from a chapter, set large: gold open-quote, serif quote with one italic word, mono byline. */
export function PullQuote({
  quote,
  emphasis,
  byline,
  href,
}: {
  quote: string;
  /** The one word in `quote` set in italic. */
  emphasis: string;
  byline: string;
  /** The chapter the sentence comes from. */
  href?: string;
}) {
  const at = quote.indexOf(emphasis);
  const body =
    at < 0 ? (
      quote
    ) : (
      <>
        {quote.slice(0, at)}
        <em>{emphasis}</em>
        {quote.slice(at + emphasis.length)}
      </>
    );
  return (
    <figure className="relative mx-auto max-w-2xl px-2 py-6 sm:py-10">
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -left-1 -top-4 select-none font-display text-[96px] leading-none text-amber sm:-left-6"
      >
        “
      </span>
      <blockquote className="relative font-display text-2xl leading-snug text-ink sm:text-3xl">
        {body}
      </blockquote>
      <figcaption className="mt-4 font-mono text-[11px] uppercase tracking-[0.14em] text-dim">
        {href ? (
          <a href={href} className="hover:text-ink">
            {byline}
          </a>
        ) : (
          byline
        )}
      </figcaption>
    </figure>
  );
}
