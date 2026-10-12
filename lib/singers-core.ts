import { midiToLabel } from "@/lib/audio/notes";
import type { VoiceKind } from "@/lib/singers-data";

export type { VoiceKind } from "@/lib/singers-data";

/**
 * Data-free singer helpers.
 *
 * Client components must import from here (and take their rows from
 * `@/lib/singers-lite`), never from `@/lib/singers` — that module imports the
 * full SINGERS array, whose blurbs, technique paragraphs and source notes are
 * hundreds of kilobytes the browser never renders. Everything in this file is
 * pure: no import chain reaches `SINGERS`, so pulling one helper into a
 * client bundle costs bytes for that helper alone.
 */

/** Voice categories in low-to-high tessitura order, for filters and grouping. */
export const VOICE_KINDS: VoiceKind[] = [
  "Bass",
  "Bass-baritone",
  "Baritone",
  "Tenor",
  "Countertenor",
  "Contralto",
  "Mezzo-soprano",
  "Soprano",
];

/** "3 octaves + 2" style description of a semitone span. */
export function describeSpan(semitones: number): string {
  const oct = Math.floor(semitones / 12);
  const rem = semitones % 12;
  if (oct === 0) return `${rem} semitone${rem === 1 ? "" : "s"}`;
  const base = `${oct} octave${oct === 1 ? "" : "s"}`;
  return rem > 0 ? `${base} + ${rem}` : base;
}

/** Decimal octave count, e.g. "3.7". */
export function spanOctaves(semitones: number): string {
  return (semitones / 12).toFixed(1);
}

/** "F2–D6" readout. */
export function rangeLabel(s: { lowMidi: number; highMidi: number }): string {
  return `${midiToLabel(s.lowMidi)}–${midiToLabel(s.highMidi)}`;
}

export interface Records<T> {
  widest: T;
  lowest: T;
  highest: T;
}

/**
 * Record holders of `list`. The caller supplies the list — the server wrapper
 * in lib/singers defaults it to SINGERS; client code passes SINGERS_LITE.
 */
export function computeRecords<T extends { lowMidi: number; highMidi: number }>(
  list: T[],
): Records<T> {
  let widest = list[0];
  let lowest = list[0];
  let highest = list[0];
  for (const s of list) {
    if (s.highMidi - s.lowMidi > widest.highMidi - widest.lowMidi) widest = s;
    if (s.lowMidi < lowest.lowMidi) lowest = s;
    if (s.highMidi > highest.highMidi) highest = s;
  }
  return { widest, lowest, highest };
}

export interface RecordHolders<T> {
  widest: T[];
  lowest: T[];
  highest: T[];
}

/**
 * Every holder of each record in `list`, in list order.
 *
 * computeRecords keeps one singer per record, and on a tie that is simply
 * whoever comes first in the list, which for an alphabetical catalog means
 * the alphabetically first name. Two singers sharing the widest span (or the
 * lowest or highest note) is a fact about the data, so any sentence that names
 * a record holder must name all of them; this is the helper for that.
 */
export function recordHolders<T extends { lowMidi: number; highMidi: number }>(
  list: readonly T[],
): RecordHolders<T> {
  if (!list.length) return { widest: [], lowest: [], highest: [] };
  const sp = (s: T) => s.highMidi - s.lowMidi;
  const maxSpan = Math.max(...list.map(sp));
  const minLow = Math.min(...list.map((s) => s.lowMidi));
  const maxHigh = Math.max(...list.map((s) => s.highMidi));
  return {
    widest: list.filter((s) => sp(s) === maxSpan),
    lowest: list.filter((s) => s.lowMidi === minLow),
    highest: list.filter((s) => s.highMidi === maxHigh),
  };
}

/** "A", "A and B", "A, B and C". */
export function joinNames(names: readonly string[]): string {
  if (names.length <= 1) return names.join("");
  return `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`;
}

/**
 * Splits a list into the fewest groups of at most `max`, as even as possible,
 * so no group ends up holding one name. Fixed slices of `max` gave a 97-singer
 * hub a last group of one ("Singers Zara Larsson through Zara Larsson"); this
 * gives 20/20/19/19/19, and 25 gives 13/12.
 */
export function balancedChunks<T>(list: readonly T[], max: number): T[][] {
  const count = Math.ceil(list.length / Math.max(1, max));
  if (count <= 1) return list.length ? [[...list]] : [];
  const base = Math.floor(list.length / count);
  const extra = list.length % count;
  const groups: T[][] = [];
  let start = 0;
  for (let index = 0; index < count; index++) {
    const size = base + (index < extra ? 1 : 0);
    groups.push(list.slice(start, start + size));
    start += size;
  }
  return groups;
}

/** Semitones of overlap between two ranges (0 if disjoint). */
export function rangeOverlap(
  aLow: number,
  aHigh: number,
  bLow: number,
  bHigh: number,
): number {
  return Math.max(0, Math.min(aHigh, bHigh) - Math.max(aLow, bLow));
}

/* ------------------------------------------------------------------ slugs --- */

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function voiceTypeSlug(v: VoiceKind): string {
  return slugify(v);
}

export function genreSlug(g: string): string {
  return slugify(g);
}

export function voiceTypeFromSlug(slug: string): VoiceKind | undefined {
  return VOICE_KINDS.find((v) => voiceTypeSlug(v) === slug);
}

/**
 * The plural of a voice category.
 *
 * Every label pluralises by adding "s" except one: "bass" needs "es", and
 * `${"bass"}s` renders the category as "basss". That typo was live in eight
 * places — the /singers/voice-type/bass H1, its meta description, its JSON-LD
 * name and breadcrumb, its OG image, and the "All basss" links on the singer
 * and genre pages — which is what one-off string concatenation buys you across
 * a route family. Pluralise through here, never with a template suffix.
 */
export function pluralVoice(v: VoiceKind | string): string {
  return /s$/i.test(v) ? `${v}es` : `${v}s`;
}
