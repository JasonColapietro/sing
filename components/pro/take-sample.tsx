import { DIM } from "@/lib/chart-colors";

/**
 * A drawn example of Pro's take analysis: two takes as overlaid pitch lines.
 *
 * Public surface: `TakeSample({ className? })` and `TAKE_SAMPLE_LABEL`.
 *
 * It is a drawing, not anyone's recording, so it always prints the visible
 * "Sample takes" label above the lines; do not hide or restyle that label
 * away. A server component with no hooks and no data imports, so the landing
 * page, /pro and the recorder's locked panel can all render it. Fixed
 * 640x150 viewBox at full width: its height follows its width, so it causes
 * no layout shift.
 */
export const TAKE_SAMPLE_LABEL = "Sample takes";

export function TakeSample({ className = "" }: { className?: string }) {
  return (
    <figure className={className}>
      <figcaption className="mb-2 font-mono text-[11px] uppercase tracking-[0.14em] text-dim">
        {TAKE_SAMPLE_LABEL}
      </figcaption>
      <svg
        viewBox="0 0 640 150"
        className="block w-full"
        role="img"
        aria-label="Two sample takes drawn as overlaid pitch lines"
      >
        <line x1="16" y1="35" x2="624" y2="35" stroke="#ddd4c4" strokeWidth="1" />
        <line x1="16" y1="75" x2="624" y2="75" stroke="#ddd4c4" strokeWidth="1" />
        <line x1="16" y1="115" x2="624" y2="115" stroke="#ddd4c4" strokeWidth="1" />
        <path
          d="M16 108 C 70 106, 96 70, 150 66 S 240 96, 296 92 S 380 40, 440 38 S 540 74, 624 44"
          fill="none"
          stroke="#c9bda0"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <path
          d="M16 96 C 64 98, 100 58, 158 56 S 250 84, 308 80 S 388 32, 452 32 S 552 64, 624 36"
          fill="none"
          stroke="#c59642"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <text x="16" y="88" className="font-mono" fontSize="9" letterSpacing="0.1em" fill={DIM}>
          TAKE 3
        </text>
        <text x="16" y="122" className="font-mono" fontSize="9" letterSpacing="0.1em" fill={DIM}>
          TAKE 7
        </text>
      </svg>
    </figure>
  );
}
