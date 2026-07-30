import { midiToLabel } from "@/lib/audio/notes";
import { SINGERS } from "@/lib/singers-data";

export type { Singer, VoiceKind } from "@/lib/singers-data";
export { SINGERS } from "@/lib/singers-data";

import type { Singer, VoiceKind } from "@/lib/singers-data";

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

export function singerBySlug(slug: string): Singer | undefined {
  return SINGERS.find((s) => s.slug === slug);
}

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
export function rangeLabel(s: Pick<Singer, "lowMidi" | "highMidi">): string {
  return `${midiToLabel(s.lowMidi)}–${midiToLabel(s.highMidi)}`;
}

export interface SingerRecords {
  widest: Singer;
  lowest: Singer;
  highest: Singer;
}

export function computeRecords(list: Singer[] = SINGERS): SingerRecords {
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

/**
 * Singers most comparable to `s`: same voice type first, then nearest
 * range-center, so the "similar voices" links stay musically meaningful.
 */
export function relatedSingers(s: Singer, count = 6): Singer[] {
  const center = (s.lowMidi + s.highMidi) / 2;
  return SINGERS.filter((o) => o.slug !== s.slug)
    .map((o) => ({
      o,
      score:
        (o.voiceType === s.voiceType ? 0 : 24) +
        Math.abs((o.lowMidi + o.highMidi) / 2 - center),
    }))
    .sort((a, b) => a.score - b.score)
    .slice(0, count)
    .map((x) => x.o);
}

/** Percent (0–100) of the library whose cited span is narrower than this singer's. */
export function spanPercentile(s: Singer): number {
  const span = s.highMidi - s.lowMidi;
  const narrower = SINGERS.filter(
    (o) => o.highMidi - o.lowMidi < span,
  ).length;
  return Math.round((narrower / SINGERS.length) * 100);
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
