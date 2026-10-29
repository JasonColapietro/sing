import { midiToLabel } from "@/lib/audio/notes";

/** The axis every mini bar shares, C2 to C6, so bars in one list compare. */
const AXIS_LOW = 36;
const AXIS_HIGH = 84;

function pct(midi: number): number {
  const clamped = Math.min(AXIS_HIGH, Math.max(AXIS_LOW, midi));
  return ((clamped - AXIS_LOW) / (AXIS_HIGH - AXIS_LOW)) * 100;
}

/**
 * A singer's reported span as a small teal bar on a fixed C2-C6 axis, for
 * lists and cards where the full keyboard strip would be too tall: the
 * homepage voices, the directory tiles, the similar-voice chips. Teal, like
 * every reference range on the site; violet is reserved for the visitor's own
 * measured voice. Decorative: the row's text carries the notes, so the bar
 * is aria-hidden unless a label is passed. One tone only: no full-voice
 * split, because these lists have no key for one and reviewed profiles
 * withhold the catalog ceiling on their own pages.
 */
export function RangeMini({
  low,
  high,
  label,
  className,
}: {
  low: number;
  high: number;
  /** An accessible name, when the bar is the only range the row shows. */
  label?: string;
  className?: string;
}) {
  const left = pct(low);
  const right = pct(high + 1);
  const name = label ?? `${midiToLabel(low)} to ${midiToLabel(high)}`;
  return (
    <span
      role={label ? "img" : undefined}
      aria-label={label ? name : undefined}
      aria-hidden={label ? undefined : true}
      className={["relative block h-2 w-full overflow-hidden rounded-full bg-panel2", className]
        .filter(Boolean)
        .join(" ")}
    >
      <span
        className="absolute inset-y-0 rounded-full bg-cool/30"
        style={{ left: `${left}%`, width: `${Math.max(2, right - left)}%` }}
      />
    </span>
  );
}
