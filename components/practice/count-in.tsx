"use client";

/**
 * The count-in, drawn.
 *
 * The wait between the reference and the scored window used to be silent and
 * blank, which is what made its length feel arbitrary — a singer cannot tell a
 * deliberate two-beat breath from the app having stalled. Yousician answers
 * that with a numeral: the beat you are on, big enough to read from arm's
 * length, over dots that show how many are left.
 *
 * Amber, because that is the playhead's colour and this is the same clock.
 *
 * Presentational only — the shell's `aria-live` region belongs to the stage
 * word in the player, and a screen reader reciting "1, 2" over it would bury
 * the one announcement that matters ("Sing").
 */
export function CountIn({
  beats,
  beat,
}: {
  /** How many count-in beats this exercise has. */
  beats: number;
  /** The beat sounding now, 1-based; 0 before the first one lands. */
  beat: number;
}) {
  return (
    <div className="flex items-center gap-3" aria-hidden="true">
      <span className="tabular w-[1.1em] font-mono text-[clamp(1.75rem,4vw,2.5rem)] leading-none font-bold text-[var(--s-amber)]">
        {beat > 0 ? beat : ""}
      </span>
      <span className="flex items-center gap-2">
        {Array.from({ length: beats }, (_, i) => (
          <span
            key={i}
            className="relative inline-block h-2.5 w-2.5 rounded-full bg-[var(--s-line2)]"
          >
            {/* Scale + opacity rather than a background swap: the dot lands on
                the beat, and both are compositor-only properties. */}
            <span
              className={`absolute inset-0 rounded-full bg-[var(--s-amber)] transition-[opacity,transform] duration-150 ease-out ${
                i < beat ? "scale-100 opacity-100" : "scale-50 opacity-0"
              }`}
            />
          </span>
        ))}
      </span>
    </div>
  );
}
