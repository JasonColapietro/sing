/**
 * How a singer's range bar is drawn, shared by the /singers directory chart
 * and the static genre and voice-type hub charts so the two read the same way.
 *
 * beltMidi is the catalog's cited full-voice ceiling. A null means no ceiling
 * is cited, not that the voice stays in full voice to the top: many of those
 * entries describe falsetto or head voice in their own technique text (Al
 * Green, Curtis Mayfield, Johnny Mathis). Those bars are drawn dashed and
 * unfilled instead of solid, the same "unknown, not inferred" reading the
 * singer pages give a missing ceiling.
 *
 * No hooks here: the server-rendered hub chart and the client directory both
 * import it.
 */

import { midiToLabel } from "@/lib/audio/notes";

type BarSinger = { lowMidi: number; highMidi: number; beltMidi: number | null };

/**
 * The bar's marks in words, for the row's accessible name. The bar itself is
 * aria-hidden, so without these a screen reader hears none of what the key
 * explains. Same wording as the key.
 */
export function rangeBarWords(s: BarSinger & { whistle: boolean }): string[] {
  return [
    s.beltMidi != null
      ? `full voice to ${midiToLabel(s.beltMidi)}`
      : "no full-voice ceiling cited",
    ...(s.whistle ? ["whistle register listed"] : []),
  ];
}

/** Share of the bar (0-100) up to the cited full-voice ceiling, or null when none is cited. */
export function fullVoicePct(s: BarSinger): number | null {
  if (s.beltMidi == null) return null;
  return ((s.beltMidi - s.lowMidi + 1) / (s.highMidi - s.lowMidi + 1)) * 100;
}

const WITH_CEILING =
  "rounded-full bg-cool/30 transition-colors group-hover:bg-cool/45";
const NO_CEILING =
  "rounded-full border border-dashed border-cool/70 bg-cool/15 transition-colors group-hover:bg-cool/30";

/** Classes for the whole-span bar; the caller adds `absolute` and its inset. */
export function spanBarClass(s: BarSinger): string {
  return s.beltMidi == null ? NO_CEILING : WITH_CEILING;
}

/** The solid full-voice portion, drawn inside the span bar only when a ceiling is cited. */
export const FULL_VOICE_FILL_CLASS =
  "absolute inset-y-0 left-0 rounded-full bg-cool/70 transition-colors group-hover:bg-cool";

/** The whistle-register dot at the top of a bar. */
export const WHISTLE_DOT_CLASS =
  "absolute right-0 top-1/2 h-2.5 w-2.5 -translate-y-1/2 translate-x-1/2 rounded-full border border-cool bg-bg";

/**
 * Key items for the range bars, as siblings for the caller's flex row (the
 * directory appends its "you" swatch after them). Items for a mark the chart
 * does not draw can be left out.
 */
export function RangeBarKey({
  noCeiling = true,
  whistle = true,
}: {
  noCeiling?: boolean;
  whistle?: boolean;
}) {
  return (
    <>
      <span className="flex items-center gap-1.5">
        <span aria-hidden="true" className="h-2 w-6 rounded-full bg-cool/70" />{" "}
        full voice, up to the cited ceiling
      </span>
      <span className="flex items-center gap-1.5">
        <span aria-hidden="true" className="h-2 w-6 rounded-full bg-cool/30" />{" "}
        above it: falsetto · head · whistle
      </span>
      {noCeiling && (
        <span className="flex items-center gap-1.5">
          <span
            aria-hidden="true"
            className="h-2 w-6 rounded-full border border-dashed border-cool/70 bg-cool/15"
          />{" "}
          no full-voice ceiling cited
        </span>
      )}
      {whistle && (
        <span className="flex items-center gap-1.5">
          <span
            aria-hidden="true"
            className="h-2.5 w-2.5 rounded-full border border-cool bg-bg"
          />{" "}
          whistle register listed
        </span>
      )}
    </>
  );
}
