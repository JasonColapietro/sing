/** A book as a drawn object: a 3:4 paper tile with a gold top rule, serif title, mono author and a darker spine edge. */
export function BookCover({
  title,
  author,
  kicker,
  className,
}: {
  title: string;
  author: string;
  /** A short mono line above the title, e.g. "A singing book". */
  kicker?: string;
  className?: string;
}) {
  return (
    <div
      aria-hidden="true"
      className={[
        "figure relative flex aspect-[3/4] w-28 shrink-0 flex-col justify-between overflow-hidden rounded-r-md rounded-l-sm border-l-2 border-line2 bg-panel px-3 pb-3 pt-4 sm:w-36",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <span className="absolute inset-x-0 top-0 h-1.5 bg-amber" />
      <span>
        {kicker && (
          <span className="block font-mono text-[8px] uppercase tracking-[0.16em] text-dim sm:text-[9px]">
            {kicker}
          </span>
        )}
        <span className="mt-2 block font-display text-lg leading-tight text-ink sm:text-xl">{title}</span>
      </span>
      <span className="block border-t border-line pt-2 font-mono text-[8px] uppercase tracking-[0.14em] text-mut sm:text-[9px]">
        {author}
      </span>
    </div>
  );
}
