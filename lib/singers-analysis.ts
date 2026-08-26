import { midiToLabel } from "@/lib/audio/notes";
import {
  SINGERS,
  pluralVoice,
  type Singer,
  type VoiceKind,
} from "@/lib/singers";

/**
 * Facts derived from the dataset itself — no new claims about anybody.
 *
 * Every singer page needs to say something a reader cannot get from the four
 * numbers in its header, or it is 357 pages of the same sentence with the notes
 * swapped. Rather than write 357 paragraphs (and risk inventing things about
 * real people), each page asks this module what is genuinely notable about that
 * singer relative to the other 356, and prints only the observations that
 * actually apply. Different singers trip different rules, so the pages differ
 * in substance and not just in digits.
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

export interface Observation {
  /** Stable id, so a page can dedupe or a test can assert coverage. */
  id: string;
  text: string;
  /** Higher sorts first. */
  weight: number;
}

function span(s: Singer): number {
  return s.highMidi - s.lowMidi;
}

function median(ns: number[]): number {
  const a = [...ns].sort((x, y) => x - y);
  const m = Math.floor(a.length / 2);
  return a.length % 2 ? a[m] : (a[m - 1] + a[m]) / 2;
}

const ALL_SPANS = SINGERS.map(span);
const MEDIAN_SPAN = median(ALL_SPANS);

function ordinal(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

function plural(n: number, one: string, many = one + "s"): string {
  return `${n} ${n === 1 ? one : many}`;
}

/** Singers sharing an exact extreme note, for the "who else reaches this" lists. */
export function sharesLow(s: Singer): Singer[] {
  return SINGERS.filter((o) => o.slug !== s.slug && o.lowMidi === s.lowMidi);
}

export function sharesHigh(s: Singer): Singer[] {
  return SINGERS.filter((o) => o.slug !== s.slug && o.highMidi === s.highMidi);
}

/** Everyone in the same voice category, widest span first. */
export function peers(s: Singer): Singer[] {
  return SINGERS.filter((o) => o.voiceType === s.voiceType).sort(
    (a, b) => span(b) - span(a),
  );
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

const GENRE_COUNTS = (() => {
  const m = new Map<string, number>();
  for (const s of SINGERS) for (const g of s.genres) m.set(g, (m.get(g) ?? 0) + 1);
  return m;
})();

const COUNTRY_COUNTS = (() => {
  const m = new Map<string, number>();
  for (const s of SINGERS) m.set(s.country, (m.get(s.country) ?? 0) + 1);
  return m;
})();

/** Share of `list` strictly below `value`, 0..1. */
function shareBelow(list: number[], value: number): number {
  return list.filter((n) => n < value).length / list.length;
}

export function observationsFor(s: Singer): Observation[] {
  const out: Observation[] = [];
  const sp = span(s);
  const band = REFERENCE_BANDS[s.voiceType];
  const group = peers(s);
  const type = s.voiceType.toLowerCase();
  const typeName = group.length === 1 ? type : pluralVoice(type);

  // Position within the singer's own category, which is what actually
  // distinguishes one tenor from the other 126.
  const groupLows = group.map((o) => o.lowMidi);
  const groupHighs = group.map((o) => o.highMidi);
  const groupSpans = group.map(span);
  const lowPct = shareBelow(groupLows, s.lowMidi);
  const highPct = shareBelow(groupHighs, s.highMidi);
  const spanPct = shareBelow(groupSpans, sp);
  const rankInGroup = group.findIndex((o) => o.slug === s.slug) + 1;

  // --- Extremes of the whole library (rare, so heavily weighted) -------------
  const lowerLows = SINGERS.filter((o) => o.lowMidi < s.lowMidi).length;
  const higherHighs = SINGERS.filter((o) => o.highMidi > s.highMidi).length;
  if (lowerLows === 0) {
    out.push({
      id: "lowest-in-library",
      weight: 100,
      text: `No singer here is cited lower: ${midiToLabel(s.lowMidi)} is the floor of every voice in this library.`,
    });
  } else if (lowerLows <= 10) {
    out.push({
      id: "rare-low",
      weight: 78,
      text: `Only ${plural(lowerLows, "singer here is", "singers here are")} cited below ${midiToLabel(s.lowMidi)}.`,
    });
  }
  if (higherHighs === 0) {
    out.push({
      id: "highest-in-library",
      weight: 100,
      text: `Nothing here is cited higher: ${midiToLabel(s.highMidi)} is the ceiling of every voice in this library.`,
    });
  } else if (higherHighs <= 10) {
    out.push({
      id: "rare-high",
      weight: 78,
      text: `Only ${plural(higherHighs, "singer here reaches", "singers here reach")} above ${midiToLabel(s.highMidi)}.`,
    });
  }

  // --- Placement within the category ---------------------------------------
  if (group.length >= 10) {
    if (lowPct <= 0.1) {
      const beaten = Math.round(lowPct * group.length);
      out.push({
        id: "low-deep-for-type",
        weight: 85,
        text: `${midiToLabel(s.lowMidi)} is a deep floor for a ${type} — ${beaten === 0 ? `lower than every other ${type} in this library` : `lower than all but ${beaten} of the ${group.length} ${typeName} here`}.`,
      });
    } else if (lowPct >= 0.9) {
      out.push({
        id: "low-high-for-type",
        weight: 70,
        text: `The bottom of this range is unusually high for a ${type}: ${Math.round(lowPct * 100)}% of the ${group.length} ${typeName} here are cited lower than ${midiToLabel(s.lowMidi)}.`,
      });
    }

    if (highPct >= 0.9) {
      out.push({
        id: "high-tall-for-type",
        weight: 85,
        text: `The top note beats ${Math.round(highPct * 100)}% of the ${group.length} ${typeName} in this library${s.whistle ? ", and sits in whistle register" : ""}.`,
      });
    } else if (highPct <= 0.1) {
      const stopLower = Math.round(highPct * group.length);
      out.push({
        id: "high-low-for-type",
        weight: 65,
        text: `The ceiling is modest for a ${type} — ${stopLower === 0 ? `no other ${type} here stops lower` : `only ${stopLower} of the ${group.length} ${typeName} here stop lower`}.`,
      });
    }

    if (rankInGroup <= 3) {
      out.push({
        id: "widest-in-type",
        weight: 90,
        text:
          rankInGroup === 1
            ? `It is the widest cited span of any of the ${group.length} ${typeName} in this library.`
            : `It is the ${ordinal(rankInGroup)} widest cited span of the ${group.length} ${typeName} here.`,
      });
    } else if (spanPct <= 0.1) {
      const narrower = Math.round(spanPct * group.length);
      out.push({
        id: "narrowest-in-type",
        weight: 62,
        text:
          narrower === 0
            ? `No other ${type} in this library works a narrower cited span.`
            : `Only ${narrower} of the ${group.length} ${typeName} here work a narrower cited span.`,
      });
    }
  }

  // --- Span against the whole library --------------------------------------
  const diff = sp - MEDIAN_SPAN;
  if (Math.abs(diff) >= 8) {
    out.push({
      id: "span-vs-median",
      weight: 50,
      text:
        diff > 0
          ? `The span runs ${plural(diff, "semitone")} past the median voice in this library (${MEDIAN_SPAN} semitones).`
          : `The span is ${plural(-diff, "semitone")} short of the library median (${MEDIAN_SPAN} semitones) — a compact working range.`,
    });
  }

  // --- Conventional band, only when genuinely far outside -------------------
  const belowBand = band.low - s.lowMidi;
  const aboveBand = s.highMidi - band.high;
  if (belowBand >= 9) {
    out.push({
      id: "low-below-band",
      weight: 58,
      text: `That floor is a full ${plural(belowBand, "semitone")} beneath where a ${type}'s range conventionally starts (${midiToLabel(band.low)}).`,
    });
  }
  if (aboveBand >= 9) {
    out.push({
      id: "high-above-band",
      weight: 58,
      text: `The ceiling clears the conventional ${type} top of ${midiToLabel(band.high)} by ${plural(aboveBand, "semitone")}.`,
    });
  }
  if (belowBand <= 0 && aboveBand <= 0 && sp >= 20) {
    out.push({
      id: "inside-band",
      weight: 44,
      text: `Both extremes stay inside the conventional ${type} band (${midiToLabel(band.low)}–${midiToLabel(band.high)}) — a textbook placement rather than an outlier.`,
    });
  }

  // --- Registers -----------------------------------------------------------
  if (s.beltMidi != null) {
    const headRoom = s.highMidi - s.beltMidi;
    const headShare = Math.round((headRoom / sp) * 100);
    if (headRoom >= 10) {
      out.push({
        id: "big-upper-register",
        weight: 72,
        text: `${plural(headRoom, "semitone")} — ${headShare}% of the whole span — sit above the cited full-voice ceiling, so much of this range is head voice, falsetto or whistle rather than chest.`,
      });
    } else if (headRoom <= 4) {
      out.push({
        id: "chest-dominant",
        weight: 68,
        text: `Full voice is cited to within ${plural(headRoom, "semitone")} of the top note, so this reads as a chest-dominant voice rather than one that flips into a lighter register.`,
      });
    } else {
      out.push({
        id: "mixed-register",
        weight: 40,
        text: `Roughly ${headShare}% of the span sits above the cited full-voice ceiling of ${midiToLabel(s.beltMidi)}.`,
      });
    }
  } else if (sp >= 24) {
    out.push({
      id: "no-ceiling-cited",
      weight: 36,
      text: `No separate full-voice ceiling is cited, so the figures describe a range worked largely in full voice across its ${plural(sp, "semitone")}.`,
    });
  }

  // --- Middle C as a landmark ---------------------------------------------
  if (s.lowMidi < 60 && s.highMidi > 60) {
    const below = 60 - s.lowMidi;
    const above = s.highMidi - 60;
    if (Math.abs(below - above) >= 10) {
      out.push({
        id: "middle-c-balance",
        weight: 34,
        text:
          below > above
            ? `The range sits mostly under middle C — ${plural(below, "semitone")} below it against ${above} above.`
            : `The weight of the range is above middle C: ${plural(above, "semitone")} up there against ${below} below.`,
      });
    }
  }

  // --- Company in the library ---------------------------------------------
  const rareGenre = s.genres
    .map((g) => ({ g, n: GENRE_COUNTS.get(g) ?? 0 }))
    .filter((x) => x.n >= 2 && x.n <= 12)
    .sort((a, b) => a.n - b.n)[0];
  if (rareGenre) {
    out.push({
      id: "rare-genre",
      weight: 32,
      text: `One of only ${rareGenre.n} ${rareGenre.g} voices in this library.`,
    });
  }

  const countryCount = COUNTRY_COUNTS.get(s.country) ?? 0;
  if (countryCount >= 2 && countryCount <= 8) {
    out.push({
      id: "rare-country",
      weight: 28,
      text: `One of ${plural(countryCount, "singer")} from ${s.country} charted here.`,
    });
  }

  const earlier = SINGERS.filter((o) => o.activeFrom < s.activeFrom).length;
  if (earlier <= 12) {
    out.push({
      id: "early-era",
      weight: 46,
      text: `Prominent from ${s.activeFrom}, earlier than all but ${plural(earlier, "voice")} in this library.`,
    });
  } else if (earlier >= SINGERS.length - 12) {
    out.push({
      id: "recent-era",
      weight: 42,
      text: `One of the most recent arrivals here, prominent from ${s.activeFrom}.`,
    });
  }

  // Roughly half the library shares an exact range with somebody, because
  // cited figures are quoted in whole note names — a coarse lattice that 357
  // voices cannot help but collide on. Say so rather than let the chart imply
  // a precision the sources do not have.
  const twins = SINGERS.filter(
    (o) => o.slug !== s.slug && o.lowMidi === s.lowMidi && o.highMidi === s.highMidi,
  );
  if (twins.length) {
    out.push({
      id: "identical-range",
      weight: 48,
      text: `${plural(twins.length, "other voice here carries", "other voices here carry")} the identical cited range — at the resolution these figures are quoted in, those voices are indistinguishable on the chart.`,
    });
  }

  // Nearest neighbour by both endpoints: always available, always a different
  // name, and a genuinely useful "if you can sing this, try that" pointer.
  const nearest = SINGERS.filter((o) => o.slug !== s.slug)
    .map((o) => ({
      o,
      d: Math.abs(o.lowMidi - s.lowMidi) + Math.abs(o.highMidi - s.highMidi),
    }))
    .sort((a, b) => a.d - b.d)[0];
  if (nearest && nearest.d > 0 && nearest.d <= 4) {
    out.push({
      id: "nearest-neighbour",
      weight: 30,
      text: `The closest range in the library belongs to ${nearest.o.name} (${midiToLabel(nearest.o.lowMidi)}–${midiToLabel(nearest.o.highMidi)}), within ${plural(nearest.d, "semitone")} at both ends.`,
    });
  }

  // Floor rule: an ordinal that is always computable, so no page is left with
  // nothing to say beyond its own four numbers.
  out.push({
    id: "low-rank-library",
    weight: 12,
    text: `Ranked by bottom note, it is the ${ordinal(lowerLows + 1)} lowest voice in this library; by top note, the ${ordinal(higherHighs + 1)} highest.`,
  });

  const lowMates = sharesLow(s);
  const highMates = sharesHigh(s);
  if (lowMates.length >= 1 && lowMates.length <= 6) {
    out.push({
      id: "shares-low",
      weight: 26,
      text: `${plural(lowMates.length, "other voice here bottoms", "other voices here bottom")} out on the same ${midiToLabel(s.lowMidi)}.`,
    });
  }
  if (highMates.length >= 1 && highMates.length <= 6) {
    out.push({
      id: "shares-high",
      weight: 24,
      text: `${plural(highMates.length, "other voice here is", "other voices here are")} cited to the same ${midiToLabel(s.highMidi)} ceiling.`,
    });
  }

  return out.sort((a, b) => b.weight - a.weight);
}

/* ------------------------------------------------------------- group stats --- */

export interface GroupStats {
  count: number;
  medianSpanSemitones: number;
  lowest: Singer;
  highest: Singer;
  widest: Singer;
  narrowest: Singer;
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
  return {
    count: list.length,
    medianSpanSemitones: median(list.map(span)),
    lowest: byLow[0],
    highest: byHigh[0],
    widest: bySpan[0],
    narrowest: bySpan[bySpan.length - 1],
    topVoiceType: top ? { type: top[0], count: top[1] } : null,
    eraFrom: Math.min(...years),
    eraTo: Math.max(...years),
  };
}
