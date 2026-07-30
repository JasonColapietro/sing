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

/**
 * Whether a "wider than N% of the library" line is worth printing. At the
 * extremes the rounded percentile states something false — the narrowest
 * singers tie rather than being beaten by nobody, and the widest is not wider
 * than himself — so those pages get no comparison line rather than a wrong one.
 */
export function hasUsefulPercentile(s: Singer): boolean {
  const p = spanPercentile(s);
  return p > 0 && p < 100;
}

/* ------------------------------------------------------------------ hubs --- */

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

/** Genres with enough singers to make a page worth having on its own. */
export const HUB_GENRE_MINIMUM = 8;

export const HUB_GENRES: string[] = (() => {
  const counts = new Map<string, number>();
  for (const s of SINGERS) {
    for (const g of s.genres) counts.set(g, (counts.get(g) ?? 0) + 1);
  }
  return [...counts.entries()]
    .filter(([, n]) => n >= HUB_GENRE_MINIMUM)
    .map(([g]) => g)
    .sort();
})();

export function genreFromSlug(slug: string): string | undefined {
  return HUB_GENRES.find((g) => genreSlug(g) === slug);
}

export function singersByVoiceType(v: VoiceKind): Singer[] {
  return SINGERS.filter((s) => s.voiceType === v).sort((a, b) =>
    a.name.localeCompare(b.name),
  );
}

export function singersByGenre(g: string): Singer[] {
  return SINGERS.filter((s) => s.genres.includes(g)).sort((a, b) =>
    a.name.localeCompare(b.name),
  );
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
