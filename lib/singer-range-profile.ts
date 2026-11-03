import { midiToFreq, midiToLabel, midiToOctave } from "@/lib/audio/notes";
import { POP_SONGS, popFit, type PopSong } from "@/lib/pop-songs";
import {
  SINGERS,
  VOICE_KINDS,
  joinNames,
  pluralVoice,
  rangeLabel,
  rangeOverlap,
  relatedSingers,
  spanOctaves,
  type Singer,
  type VoiceKind,
} from "@/lib/singers";
import { REFERENCE_BANDS, sharesHigh, sharesLow } from "@/lib/singers-analysis";

/**
 * The "what is <singer>'s vocal range?" explainer each profile carries, built
 * only from the catalog's numeric fields and the shared reference tables: the
 * piano keys the span covers, the pitch of each endpoint, how the span lines
 * up with the textbook voice-type bands and with the singer's own catalog
 * group, the catalog songs that fit inside it, and the profiles nearest on
 * the keyboard. Nothing here adds a claim about a person the dataset does not
 * already make; every sentence is arithmetic on lowMidi, highMidi, voiceType
 * and the whistle flag.
 */

const MIDDLE_C = 60;
/** A0 and C8: an 88-key piano's first and last keys. */
const PIANO_LOW = 21;
const PIANO_HIGH = 108;

const span = (s: Pick<Singer, "lowMidi" | "highMidi">) => s.highMidi - s.lowMidi;

function semis(n: number): string {
  return `${n} ${n === 1 ? "semitone" : "semitones"}`;
}

function isBlackKey(midi: number): boolean {
  return [1, 3, 6, 8, 10].includes(((midi % 12) + 12) % 12);
}

function hz(midi: number): string {
  return midiToFreq(midi).toFixed(1);
}

function median(ns: number[]): number {
  const a = [...ns].sort((x, y) => x - y);
  const m = Math.floor(a.length / 2);
  return a.length % 2 ? a[m] : (a[m - 1] + a[m]) / 2;
}

/** A median note: a note name when whole, "between X and Y" when it falls between two. */
function medianNote(value: number): string {
  return Number.isInteger(value)
    ? midiToLabel(value)
    : `between ${midiToLabel(Math.floor(value))} and ${midiToLabel(Math.ceil(value))}`;
}

/** "11 semitones below middle C (C4)" / "is middle C itself". */
function againstMiddleC(midi: number): string {
  const delta = midi - MIDDLE_C;
  if (delta === 0) return "is middle C itself";
  const where = delta > 0 ? "above" : "below";
  const octaves = Math.abs(delta) >= 12 ? `, about ${(Math.abs(delta) / 12).toFixed(1)} octaves,` : "";
  return `sits ${semis(Math.abs(delta))}${octaves} ${where} middle C (C4)`;
}

export interface KeyboardFacts {
  keys: number;
  whiteKeys: number;
  blackKeys: number;
  /** 88-key piano key numbers (A0 = 1), or null when an endpoint is off the keyboard. */
  pianoKeys: { low: number; high: number } | null;
  octaves: number[];
  centerMidi: number;
  frequencyRatio: number;
}

export function keyboardFacts(s: Singer): KeyboardFacts {
  const notes = Array.from({ length: span(s) + 1 }, (_, i) => s.lowMidi + i);
  const black = notes.filter(isBlackKey).length;
  const octaves: number[] = [];
  for (let o = midiToOctave(s.lowMidi); o <= midiToOctave(s.highMidi); o += 1) octaves.push(o);
  return {
    keys: notes.length,
    whiteKeys: notes.length - black,
    blackKeys: black,
    pianoKeys:
      s.lowMidi >= PIANO_LOW && s.highMidi <= PIANO_HIGH
        ? { low: s.lowMidi - PIANO_LOW + 1, high: s.highMidi - PIANO_LOW + 1 }
        : null,
    octaves,
    centerMidi: Math.floor((s.lowMidi + s.highMidi) / 2),
    frequencyRatio: midiToFreq(s.highMidi) / midiToFreq(s.lowMidi),
  };
}

/** "3, 4 and 5" */
function listNumbers(ns: number[]): string {
  return joinNames(ns.map(String));
}

/** The piano section: where each endpoint sits, what it sounds like, how many keys it covers. */
export function keyboardParagraphs(s: Singer): string[] {
  const k = keyboardFacts(s);
  const low = midiToLabel(s.lowMidi);
  const high = midiToLabel(s.highMidi);
  const out: string[] = [];

  out.push(
    k.pianoKeys
      ? `On a standard 88-key piano, ${s.name}’s reported range runs from key ${k.pianoKeys.low} (${low}) to key ${k.pianoKeys.high} (${high}). That is ${k.keys} keys in all: ${k.whiteKeys} white and ${k.blackKeys} black.`
      : `${s.name}’s reported range runs from ${low} to ${high}, past the edge of a standard 88-key piano. It covers ${k.keys} chromatic notes: ${k.whiteKeys} on white keys and ${k.blackKeys} on black keys.`,
  );

  const lowSide = s.lowMidi - MIDDLE_C;
  const highSide = s.highMidi - MIDDLE_C;
  if (lowSide < 0 && highSide > 0) {
    out.push(
      `The lowest note, ${low}, ${againstMiddleC(s.lowMidi)}. The highest, ${high}, ${againstMiddleC(s.highMidi).replace(" (C4)", "")}, so the span crosses middle C.`,
    );
  } else if (highSide <= 0) {
    out.push(
      `The whole span sits at or below middle C. The lowest note, ${low}, ${againstMiddleC(s.lowMidi)}, and the top note, ${high}, ${againstMiddleC(s.highMidi)}.`,
    );
  } else {
    out.push(
      `The whole span sits at or above middle C. The lowest note, ${low}, ${againstMiddleC(s.lowMidi)}, and the top note, ${high}, ${againstMiddleC(s.highMidi)}.`,
    );
  }

  out.push(
    `In pitch, ${low} is about ${hz(s.lowMidi)} Hz and ${high} is about ${hz(s.highMidi)} Hz. The top note vibrates ${k.frequencyRatio.toFixed(1)} times as fast as the bottom one across the ${spanOctaves(span(s))}-octave span, and the note halfway through it is ${midiToLabel(k.centerMidi)}.`,
  );

  const octaveLine =
    k.octaves.length === 1
      ? `The span stays inside octave ${k.octaves[0]}, from ${midiToLabel(k.octaves[0] * 12 + 12)} up.`
      : `The span touches ${k.octaves.length} keyboard octaves, numbered ${listNumbers(k.octaves)}.`;
  out.push(
    s.whistle
      ? `${octaveLine} The catalog also lists a whistle register for ${s.name}, the highest register a voice can reach.`
      : octaveLine,
  );
  return out;
}

export interface BandCoverage {
  full: VoiceKind[];
  partial: Array<{ type: VoiceKind; semitones: number }>;
}

/** Which of the eight textbook voice-type bands the reported span covers. */
export function bandCoverage(s: Singer): BandCoverage {
  const full: VoiceKind[] = [];
  const partial: BandCoverage["partial"] = [];
  const byLow = [...VOICE_KINDS].sort((a, b) => REFERENCE_BANDS[a].low - REFERENCE_BANDS[b].low);
  for (const type of byLow) {
    const band = REFERENCE_BANDS[type];
    if (band.low >= s.lowMidi && band.high <= s.highMidi) full.push(type);
    else {
      const shared = rangeOverlap(s.lowMidi, s.highMidi, band.low, band.high);
      if (shared > 0) partial.push({ type, semitones: shared });
    }
  }
  return { full, partial };
}

/** "tenor (C3–C5)", or "tenor (C3–C5, 20 of 24 semitones)" with a partial overlap. */
function bandName(type: VoiceKind, shared?: number): string {
  const band = REFERENCE_BANDS[type];
  const notes = `${midiToLabel(band.low)}–${midiToLabel(band.high)}`;
  return `${type.toLowerCase()} (${shared === undefined ? notes : `${notes}, ${shared} of ${band.high - band.low} semitones`})`;
}

/**
 * The voice-type section. `labelSettled` is false where a reviewed correction
 * disputes the catalog label: the group comparison reads that label as the
 * singer's type, so it is left out and only the label-free band read stays.
 */
export function voiceTypeParagraphs(s: Singer, labelSettled: boolean, all: Singer[] = SINGERS): string[] {
  const out: string[] = [];
  if (labelSettled) {
    const group = all.filter((o) => o.voiceType === s.voiceType);
    const type = s.voiceType.toLowerCase();
    const plural = group.length === 1 ? type : pluralVoice(type);
    const floor = median(group.map((o) => o.lowMidi));
    const ceiling = median(group.map((o) => o.highMidi));
    const compare = (value: number, typical: number, end: string): string => {
      const d = value - typical;
      if (d === 0) return `${end === "floor" ? `${s.name}’s floor` : "the ceiling"} matches it`;
      const size = Number.isInteger(d) ? semis(Math.abs(d)) : `${Math.abs(d)} semitones`;
      return `${end === "floor" ? `${s.name}’s floor` : "the ceiling"} is ${size} ${d > 0 ? "higher" : "lower"}`;
    };
    out.push(
      `Across the ${group.length} ${plural} in this catalog, the typical (median) reported floor is ${medianNote(floor)} and the typical ceiling is ${medianNote(ceiling)}. ${compare(s.lowMidi, floor, "floor")}, and ${compare(s.highMidi, ceiling, "ceiling")}.`,
    );
  }
  const { full, partial } = bandCoverage(s);
  const partialText = partial.map((p) => bandName(p.type, p.semitones));
  if (full.length) {
    out.push(
      `Measured against the eight textbook voice-type bands, the reported span fully covers the ${joinNames(full.map((type) => bandName(type)))} ${full.length === 1 ? "band" : "bands"}.${partialText.length ? ` It also reaches part of the ${joinNames(partialText)} ${partialText.length === 1 ? "band" : "bands"}.` : ""}`,
    );
  } else {
    const closest = [...partial].sort((a, b) => b.semitones - a.semitones)[0];
    out.push(
      closest
        ? `None of the eight textbook voice-type bands fits entirely inside the reported span. The closest is the ${bandName(closest.type, closest.semitones)} band.`
        : `The reported span sits outside all eight textbook voice-type bands.`,
    );
  }
  return out;
}

/**
 * Profiles nearest on the keyboard: the catalog ordered by reported floor,
 * then ceiling, then name, and the `count` entries around this one, taken
 * outward one step at a time (one below, one above, two below, ...). When one
 * side of the order runs out the walk continues on the other, so the list
 * never shrinks at either end and every profile stays linked from other
 * profiles' lists. Slugs in `exclude` are skipped and the walk goes one step
 * further instead. With nothing excluded this is the plain window of `count`
 * around the profile.
 */
export function keyboardNeighbors(
  s: Singer,
  count = 6,
  all: Singer[] = SINGERS,
  exclude: ReadonlySet<string> = new Set(),
): Singer[] {
  const order = [...all].sort(
    (a, b) => a.lowMidi - b.lowMidi || a.highMidi - b.highMidi || a.name.localeCompare(b.name),
  );
  const at = order.findIndex((o) => o.slug === s.slug);
  if (at < 0) return [];
  const picked = new Set<number>();
  for (let step = 1; picked.size < count && (at - step >= 0 || at + step < order.length); step++) {
    for (const i of [at - step, at + step]) {
      if (picked.size >= count || i < 0 || i >= order.length) continue;
      if (exclude.has(order[i].slug)) continue;
      picked.add(i);
    }
  }
  return [...picked].sort((a, b) => a - b).map((i) => order[i]);
}

/**
 * The "Nearest reported floors" row as the page renders it: the keyboard
 * neighbors with the similar-voice cards above it left out, so the row adds
 * new links rather than repeating the cards.
 */
export function pageNeighbors(s: Singer): Singer[] {
  return keyboardNeighbors(s, 6, SINGERS, new Set(relatedSingers(s).map((o) => o.slug)));
}

/**
 * The "Also listed from <floor>" and "Also listed up to <ceiling>" chips.
 * allLow and allHigh are every other profile sharing the exact floor or
 * ceiling, which the page counts in full. The chips show the closest of them:
 * a shared floor sorted by how near the ceiling is, a shared ceiling by how
 * near the floor is, then by name. Profiles already linked by the
 * similar-voice cards or the keyboard neighbors are left out, so the chips add
 * new links rather than repeat ones. Alphabetical order used to hand most of
 * the catalog's chip links to the few names that sort first.
 */
export function endpointMates(s: Singer): {
  allLow: Singer[];
  allHigh: Singer[];
  lowMates: Singer[];
  highMates: Singer[];
} {
  const allLow = sharesLow(s);
  const allHigh = sharesHigh(s);
  const shown = new Set([...relatedSingers(s), ...pageNeighbors(s)].map((o) => o.slug));
  const closest = (mates: Singer[], gap: (o: Singer) => number) =>
    mates
      .filter((o) => !shown.has(o.slug))
      .sort((a, b) => gap(a) - gap(b) || a.name.localeCompare(b.name));
  // Up to eight chips across the two sub-rows: four each, or all eight in one
  // row when the other has none to show. A voice sharing both the floor and
  // the ceiling leads both sorts, so it is shown once, in the floor row.
  const lowAvail = closest(allLow, (o) => Math.abs(o.highMidi - s.highMidi));
  const highAvail = closest(allHigh, (o) => Math.abs(o.lowMidi - s.lowMidi));
  let lowMates = lowAvail.slice(0, 4);
  const inLow = new Set(lowMates.map((o) => o.slug));
  const highLeft = highAvail.filter((o) => !inLow.has(o.slug));
  if (highLeft.length === 0) lowMates = lowAvail.slice(0, 8);
  const highMates = highLeft.slice(0, lowMates.length ? 4 : 8);
  return { allLow, allHigh, lowMates, highMates };
}

/** Catalog songs (not this artist's own) that sit inside the reported span as written, widest first. */
export function songsInRange(s: Singer, limit = 5, songs: readonly PopSong[] = POP_SONGS): PopSong[] {
  return otherArtistSongs(s, songs)
    .filter((song) => popFit(song, s).verdict === "fits")
    .sort((a, b) => span(b) - span(a) || a.title.localeCompare(b.title))
    .slice(0, limit);
}

/** Catalog songs by other artists: the set songsInRange picks from and songsInRangeCount counts. */
export function otherArtistSongs(s: Singer, songs: readonly PopSong[] = POP_SONGS): PopSong[] {
  return songs.filter((song) => !song.artistSlugs.includes(s.slug));
}

/**
 * How many catalog songs by other artists fit inside the span as written: the
 * same set songsInRange lists from, so "the widest of them" never skips one
 * the count included (Whitney Houston's own I Will Always Love You did).
 */
export function songsInRangeCount(s: Singer, songs: readonly PopSong[] = POP_SONGS): number {
  return otherArtistSongs(s, songs).filter((song) => popFit(song, s).verdict === "fits").length;
}

/**
 * The lead above the songs-in-range list. These are the /can-you-sing range
 * pages, which chart a popular song's key and range and hold no melody, so the
 * sentence names them as that and never as songs to sing in the app.
 */
export function songsInRangeLead(s: Singer, songs: readonly PopSong[] = POP_SONGS): string {
  const total = otherArtistSongs(s, songs).length;
  const count = songsInRangeCount(s, songs);
  const shown = songsInRange(s, undefined, songs).length;
  const pages = `popular songs by other artists on Suede Sing’s song-range pages`;
  const where = `${s.name}’s reported ${rangeLabel(s)} as written`;
  if (count === 1) return `1 of the ${total} ${pages} sits inside ${where}:`;
  const lead = count === total ? `All ${total} ${pages} sit inside ${where}.` : `${count} of the ${total} ${pages} sit inside ${where}.`;
  return `${lead} ${shown < count ? `The ${shown} widest:` : "Widest first:"}`;
}

/** Semitones two catalog ranges share. */
export function sharedSemitones(a: Singer, b: Singer): number {
  return rangeOverlap(a.lowMidi, a.highMidi, b.lowMidi, b.highMidi);
}

/**
 * The FAQ answer to "Who has a similar vocal range to X?", from the
 * similar-voice cards. It states relatedSingers' rule and no other: nearest
 * reported floor and ceiling first. The catalog label only breaks ties, so the
 * answer never says the matches share a voice type (since round 20 most
 * profiles' top three include another label).
 */
export function similarRangeAnswer(s: Singer): string {
  const top = relatedSingers(s).slice(0, 3);
  const names = joinNames(top.map((o) => `${o.name} (${rangeLabel(o)})`));
  return `The closest reported ranges to ${s.name}’s ${rangeLabel(s)} in this catalog belong to ${names}, ranked by how close their reported lowest and highest notes are to ${s.name}’s.`;
}

/**
 * Every singer profile a profile page links to: the similar-voice cards, the
 * shared-floor and shared-ceiling chips, and the keyboard neighbors. Mirrors
 * the page, so the inbound-link guard measures what is rendered.
 */
export function linkedSingerSlugs(s: Singer): string[] {
  const { lowMates, highMates } = endpointMates(s);
  return [
    ...relatedSingers(s),
    ...lowMates,
    ...highMates,
    ...pageNeighbors(s),
  ].map((o) => o.slug);
}
