/**
 * The v2 campaign mark: a pitch trace that dips once, rises, and settles on a
 * note. Drawn in --color-cool because that is the colour of the live trace —
 * the singer's own voice made visible — and the one accent violet's one-meaning
 * rule leaves unclaimed. Shared by the announcement banner and /changelog so
 * the two read as one campaign; when the banner retires, cool goes back to
 * being the instrument's colour.
 *
 * pathLength={1} normalises the dash so .animate-v2trace (globals.css) can
 * draw the line in without knowing its true length. The terminal dot is the
 * note the phrase lands on; it stays static — one moving thing is the budget.
 */
export default function V2TraceGlyph({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 20 12"
      width="20"
      height="12"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      <path
        d="M1.5 9 C3.5 11, 5 10.5, 7 7.5 C9 4.5, 11 2.6, 13.5 3.1 C14.9 3.4, 15.9 3.6, 16.5 3.6"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        pathLength={1}
        className="animate-v2trace"
      />
      <circle cx="18.3" cy="3.6" r="1.4" fill="currentColor" />
    </svg>
  );
}
