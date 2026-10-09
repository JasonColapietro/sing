import { midiToLabel } from "@/lib/audio/notes";
import { SINGERS, type Singer } from "@/lib/singers";
import { REFERENCE_BANDS } from "@/lib/singers-analysis";

/**
 * Where one singer's reported span sits among the others, computed only from
 * the catalog's own numeric fields. Nothing here is biography: every sentence
 * is arithmetic over `lowMidi`, `highMidi`, `voiceType`, `genres` and the
 * catalog's own `beltMidi`, `country` and `activeFrom` fields, so it varies
 * from page to page without asserting anything the catalog does not hold.
 */

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

function against(delta: number, above: string, below: string): string {
  if (delta === 0) return "exactly on";
  return `${semis(Math.abs(delta))} ${delta > 0 ? above : below}`;
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
    text: `Number ${spanRank(s, sameType)} of ${sameType.length} catalog ${type}${sameType.length === 1 ? "" : "s"}; that group's median span is ${semis(typeMedian)}, so this span is ${against(sp - typeMedian, "wider", "narrower")} it.`,
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
    text: `The conventional ${type} band runs ${midiToLabel(band.low)} to ${midiToLabel(band.high)}. The reported floor sits ${against(s.lowMidi - band.low, "above", "below")} it and the reported ceiling ${against(s.highMidi - band.high, "above", "below")} it.`,
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
