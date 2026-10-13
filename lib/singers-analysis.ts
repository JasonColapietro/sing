import {
  SINGERS,
  recordHolders,
  type Singer,
  type VoiceKind,
} from "@/lib/singers";

/**
 * Facts derived from the dataset itself — no new claims about anybody: who
 * shares an extreme note, which singers best illustrate a voice category, and
 * summary stats for a hub's list of singers.
 */

/** Conventional classical range for each category, for "sits below/above the band" reads. */
export const REFERENCE_BANDS: Record<VoiceKind, { low: number; high: number }> = {
  Bass: { low: 40, high: 64 }, // E2–E4
  "Bass-baritone": { low: 42, high: 66 }, // F#2–F#4
  Baritone: { low: 45, high: 69 }, // A2–A4
  Tenor: { low: 48, high: 72 }, // C3–C5
  Countertenor: { low: 55, high: 79 }, // G3–G5
  Contralto: { low: 53, high: 77 }, // F3–F5
  "Mezzo-soprano": { low: 57, high: 81 }, // A3–A5
  Soprano: { low: 60, high: 84 }, // C4–C6
};

function span(s: Singer): number {
  return s.highMidi - s.lowMidi;
}

function median(ns: number[]): number {
  const a = [...ns].sort((x, y) => x - y);
  const m = Math.floor(a.length / 2);
  return a.length % 2 ? a[m] : (a[m - 1] + a[m]) / 2;
}

/** Singers sharing an exact extreme note, for the "who else reaches this" lists. */
export function sharesLow(s: Singer): Singer[] {
  return SINGERS.filter((o) => o.slug !== s.slug && o.lowMidi === s.lowMidi);
}

export function sharesHigh(s: Singer): Singer[] {
  return SINGERS.filter((o) => o.slug !== s.slug && o.highMidi === s.highMidi);
}

/**
 * The singers who best *illustrate* a category, for a "typical range" table.
 *
 * Deliberately not "the most famous" — the library holds no popularity signal,
 * so any such ordering would be someone's opinion smuggled in as data, and it
 * would go stale the moment taste moved. This ranks by how close a voice sits
 * to the conventional band for its own type at both ends, which is what a
 * "typical range" column is actually asking: show me a textbook one of these.
 *
 * A useful side effect is that the outliers stay out. The widest and highest
 * voices are the memorable ones, so ranking on fame would illustrate the
 * typical-range row with exactly the singers who defy it.
 *
 * Ties break on name, so the choice is stable between builds.
 */
export function representativeSingers(v: VoiceKind, count = 3): Singer[] {
  const band = REFERENCE_BANDS[v];
  return SINGERS.filter((s) => s.voiceType === v)
    .map((s) => ({
      s,
      d: Math.abs(s.lowMidi - band.low) + Math.abs(s.highMidi - band.high),
    }))
    .sort((a, b) => a.d - b.d || a.s.name.localeCompare(b.s.name))
    .slice(0, count)
    .map((x) => x.s);
}

/* ------------------------------------------------------------- group stats --- */

export interface GroupStats {
  count: number;
  medianSpanSemitones: number;
  lowest: Singer;
  highest: Singer;
  widest: Singer;
  narrowest: Singer;
  /**
   * Every singer tied for each extreme, in list order (alphabetical for the
   * hub lists). The single fields above each pick one member of the tie; any
   * sentence that names a record holder should name the whole tie, or it
   * reports an alphabetical accident as the sole holder.
   */
  lowestAll: Singer[];
  highestAll: Singer[];
  widestAll: Singer[];
  narrowestAll: Singer[];
  /** Most common voice category in the group, with its share. */
  topVoiceType: { type: VoiceKind; count: number } | null;
  /** Decade ranges of prominence, oldest first. */
  eraFrom: number;
  eraTo: number;
}

export function statsFor(list: Singer[]): GroupStats | null {
  if (!list.length) return null;
  const byLow = [...list].sort((a, b) => a.lowMidi - b.lowMidi);
  const byHigh = [...list].sort((a, b) => b.highMidi - a.highMidi);
  const bySpan = [...list].sort((a, b) => span(b) - span(a));
  const counts = new Map<VoiceKind, number>();
  for (const s of list) counts.set(s.voiceType, (counts.get(s.voiceType) ?? 0) + 1);
  const top = [...counts.entries()].sort((a, b) => b[1] - a[1])[0];
  const years = list.map((s) => s.activeFrom);
  const holders = recordHolders(list);
  const minSpan = Math.min(...list.map(span));
  const narrowestAll = list.filter((s) => span(s) === minSpan);
  return {
    count: list.length,
    medianSpanSemitones: median(list.map(span)),
    lowest: byLow[0],
    highest: byHigh[0],
    widest: bySpan[0],
    narrowest: bySpan[bySpan.length - 1],
    lowestAll: holders.lowest,
    highestAll: holders.highest,
    widestAll: holders.widest,
    narrowestAll,
    topVoiceType: top ? { type: top[0], count: top[1] } : null,
    eraFrom: Math.min(...years),
    eraTo: Math.max(...years),
  };
}
