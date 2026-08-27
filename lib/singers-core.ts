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
