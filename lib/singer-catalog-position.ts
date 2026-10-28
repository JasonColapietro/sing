import { midiToLabel } from "@/lib/audio/notes";
import { SINGERS, pluralVoice, type Singer } from "@/lib/singers";
import { REFERENCE_BANDS } from "@/lib/singers-analysis";

/** Where one singer's span sits among the others, from the catalog's numeric fields alone. */

export interface PositionFact {
  id: string;
  label: string;
  text: string;
}

const span = (s: Singer) => s.highMidi - s.lowMidi;

function median(ns: number[]): number {
  const a = [...ns].sort((x, y) => x - y);
  const m = Math.floor(a.length / 2);
  return a.length % 2 ? a[m] : (a[m - 1] + a[m]) / 2;
}

/** 1 = widest. Ties share the better rank, so equal spans never outrank each other. */
function spanRank(s: Singer, list: Singer[]): number {
  return list.filter((o) => span(o) > span(s)).length + 1;
}

function semis(n: number): string {
  return `${n} ${n === 1 ? "semitone" : "semitones"}`;
}

/** "matches the band's bottom note" / "sits 3 semitones below the band's top note". */
function againstBand(delta: number, end: "bottom" | "top"): string {
  if (delta === 0) return `matches the band's ${end} note`;
  return `sits ${semis(Math.abs(delta))} ${delta > 0 ? "above" : "below"} the band's ${end} note`;
}

export interface SpanHistogram {
  /** Semitones per bin. */
  binSize: number;
  /** Each bin's lowest span (inclusive) and how many singers fall in it. */
  bins: Array<{ from: number; count: number }>;
  /** Index into `bins` of the bin holding this singer's span. */
  singerBin: number;
  /** The catalog's median span in semitones. */
  median: number;
}

/** The catalog's span widths in 2-semitone bins, for the figure under the position facts. */
export function catalogSpanHistogram(s: Singer, all: Singer[] = SINGERS): SpanHistogram {
  const binSize = 2;
  const spans = all.map(span);
  const lo = Math.floor(Math.min(...spans) / binSize) * binSize;
  const hi = Math.floor(Math.max(...spans) / binSize) * binSize;
  const bins: SpanHistogram["bins"] = [];
  for (let from = lo; from <= hi; from += binSize) bins.push({ from, count: 0 });
  for (const sp of spans) bins[Math.floor((sp - lo) / binSize)].count += 1;
  return {
    binSize,
    bins,
    singerBin: Math.floor((span(s) - lo) / binSize),
    median: median(spans),
  };
}

export function catalogPositionFor(
  s: Singer,
  all: Singer[] = SINGERS,
): PositionFact[] {
  const facts: PositionFact[] = [];
  const type = s.voiceType.toLowerCase();
  const sameType = all.filter((o) => o.voiceType === s.voiceType);
  const sp = span(s);

  facts.push({
    id: "library-rank",
    label: "Span, whole catalog",
    text: `${semis(sp)} wide: number ${spanRank(s, all)} of ${all.length} by reported span. The catalog median is ${semis(median(all.map(span)))}.`,
  });

  const typeMedian = median(sameType.map(span));
  facts.push({
    id: "type-rank",
    label: `Span, ${type} group`,
    text: `Number ${spanRank(s, sameType)} of ${sameType.length} catalog ${sameType.length === 1 ? type : pluralVoice(type)}; that group's median span is ${semis(typeMedian)}, and this span is ${
      sp === typeMedian
        ? "the same as that median"
        : `${semis(Math.abs(sp - typeMedian))} ${sp > typeMedian ? "wider" : "narrower"} than that median`
    }.`,
  });

  const genre = s.genres[0];
  if (genre) {
    const sameGenre = all.filter((o) => o.genres.includes(genre));
    if (sameGenre.length >= 5) {
      facts.push({
        id: "genre-rank",
        label: `Span, ${genre}`,
        text: `Number ${spanRank(s, sameGenre)} of ${sameGenre.length} catalog singers tagged ${genre} (median ${semis(median(sameGenre.map(span)))}).`,
      });
    }
  }

  const band = REFERENCE_BANDS[s.voiceType];
  facts.push({
    id: "band",
    label: "Against the textbook band",
    text: `The conventional ${type} band runs ${midiToLabel(band.low)} to ${midiToLabel(band.high)}. The reported floor ${againstBand(s.lowMidi - band.low, "bottom")}, and the reported ceiling ${againstBand(s.highMidi - band.high, "top")}.`,
  });

  if (s.beltMidi !== null && s.beltMidi < s.highMidi) {
    facts.push({
      id: "belt",
      label: "Full-voice ceiling",
      text: `The catalog lists a highest full or belted note of ${midiToLabel(s.beltMidi)}, ${semis(s.highMidi - s.beltMidi)} below the reported ceiling.`,
    });
  }

  facts.push({
    id: "catalog-fields",
    label: "Catalog entry",
    text: `Filed under ${s.country}, prominent from ${s.activeFrom}, signature song listed as ${s.signatureSong}.`,
  });

  return facts;
}
