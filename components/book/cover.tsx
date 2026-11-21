/**
 * What a cover can carry between its title and its author: a small wordless
 * drawing of a figure the book itself prints (lib/markdown-figures.tsx).
 * - "trace": the pitch trace of The Measured Voice's `pitch-trace` figure, a
 *   line that wobbles up into a target band and holds there.
 * - "keys": the keyboard strip The Voice Atlas draws a singer's span on
 *   (`strip`), an octave and a half with a span bracketed.
 * Shapes only, no labels and no data: the cover is hidden from assistive
 * tech, and nothing on it is a claim.
 */
export type CoverMotif = "trace" | "keys";

const TRACE_PATH = (() => {
  let d = "";
  for (let x = 2; x <= 94; x += 4) {
    const y = x < 40 ? 30 - ((x - 2) / 38) * 15 + 3 * Math.sin(x / 3.2) : 13 + 1.2 * Math.sin(x / 4);
    d += `${d ? " L" : "M"}${x} ${y.toFixed(1)}`;
  }
  return d;
})();

/** White keys of an octave and a half, C to G; black keys sit after these white-key indices. */
const WHITE_KEYS = 12;
const BLACK_AFTER = [0, 1, 3, 4, 5, 7, 8, 10];

function Motif({ kind }: { kind: CoverMotif }) {
  return (
    <svg viewBox="0 0 96 36" className="block w-full" fill="none">
      {kind === "trace" ? (
        <>
          <rect x="2" y="8" width="92" height="10" className="fill-ok" opacity="0.18" />
          <line x1="2" y1="13" x2="94" y2="13" className="stroke-ok" strokeWidth="0.75" strokeDasharray="2 3" />
          <path d={TRACE_PATH} className="stroke-cool" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
        </>
      ) : (
        <>
          <path d="M20 8 V4 H68 V8" className="stroke-amber-ink" strokeWidth="1.25" strokeLinecap="round" />
          {Array.from({ length: WHITE_KEYS }, (_, i) => (
            <rect
              key={i}
              x={i * 8 + 0.5}
              y="12"
              width="7"
              height="22"
              rx="1"
              className={i >= 2 && i <= 8 ? "fill-amber" : "fill-line"}
              opacity={i >= 2 && i <= 8 ? 0.55 : 0.7}
            />
          ))}
          {BLACK_AFTER.map((i) => (
            <rect key={i} x={i * 8 + 5.5} y="12" width="5" height="13" rx="1" className="fill-ink" opacity="0.8" />
          ))}
        </>
      )}
    </svg>
  );
}

/** A book as a drawn object: a 3:4 paper tile with a gold top rule, serif title, mono author and a darker spine edge. */
export function BookCover({
  title,
  author,
  kicker,
  motif,
  className,
}: {
  title: string;
  author: string;
  /** A short mono line above the title, e.g. "A singing book". */
  kicker?: string;
  /** One of the book's own figures, drawn small above the author line. */
  motif?: CoverMotif;
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
          <span
            className={`font-mono text-[8px] uppercase tracking-[0.16em] text-dim sm:text-[9px] ${
              // Beside a motif the narrow cover has no room for it; the wider one does.
              motif ? "hidden sm:block" : "block"
            }`}
          >
            {kicker}
          </span>
        )}
        <span
          className={`block font-display text-lg leading-tight text-ink sm:text-xl ${motif ? "sm:mt-2" : "mt-2"}`}
        >
          {title}
        </span>
      </span>
      <span className="block">
        {motif && (
          <span className="mb-2 block">
            <Motif kind={motif} />
          </span>
        )}
        <span className="block border-t border-line pt-2 font-mono text-[8px] uppercase tracking-[0.14em] text-mut sm:text-[9px]">
          {author}
        </span>
      </span>
    </div>
  );
}
