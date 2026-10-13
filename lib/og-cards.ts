import "server-only";

import { midiToLabel } from "@/lib/audio/notes";
import { ogCardVersion } from "@/lib/og";
import { singerReviewLabel } from "@/lib/singer-evidence";
import {
  SINGERS,
  describeSpan,
  pluralVoice,
  recordHolders,
  singersByGenre,
  singersByVoiceType,
  spanOctaves,
  type Singer,
  type VoiceKind,
} from "@/lib/singers";
import { statsFor } from "@/lib/singers-analysis";
import { HUB_OG_CARD_REVISION } from "@/components/singers/og-card";
import { isProSong } from "@/components/songs/data";
import {
  computeDifficulty,
  lyricLines,
  songNoteRange,
} from "@/components/songs/lib";
import type { Song } from "@/components/songs/types";

/**
 * Words and shapes the per-page share cards draw, and the version each card's
 * URL carries.
 *
 * Next stamps a file-convention card's URL with a hash of the card's source
 * file, not of the data it draws, so every singer card shared one URL and
 * every song card another. Round 8 corrected Alex Warren's range (A2–F#4 →
 * G2–A4) and three songbook eras, and the new pictures shipped at the URLs
 * share scrapers had already cached the old ones under. The cards'
 * generateImageMetadata puts the version below into the path
 * (/singers/<slug>/opengraph-image/<version>), so the URL moves exactly when
 * what the card says moves. Same idea as OG_CARD_VERSION for the sitewide card.
 *
 * The genre, voice-type and records hub cards take the same treatment: round 3
 * took Vitas off the Opera card's top row and round 5 refitted the
 * Singer-Songwriter title, and both pictures shipped at the URL they had had
 * since September.
 */

export interface SingerCardText {
  name: string;
  notes: string;
  span: string;
  status: string;
}

/** Every line of text the singer card draws; the keyboard band follows `notes`. */
export function singerCardText(s: Singer): SingerCardText {
  const semis = s.highMidi - s.lowMidi;
  return {
    name: s.name,
    notes: `${midiToLabel(s.lowMidi)} — ${midiToLabel(s.highMidi)}`,
    span: `${describeSpan(semis)} · ${semis} semitones`,
    status: `${singerReviewLabel(s.slug)} · Not a training target`,
  };
}

export function singerCardVersion(s: Singer): string {
  const t = singerCardText(s);
  return ogCardVersion([t.name, t.notes, t.span, t.status].join("|"));
}

export interface SongCardText {
  pro: boolean;
  kicker: string;
  title: string;
  facts: string;
  firstLine: string;
  notes: string;
  footer: string;
}

/** Every line of text the song card draws; the contour is the song's notes. */
export function songCardText(song: Song): SongCardText {
  const pro = isProSong(song.id);
  const [lo, hi] = songNoteRange(song);
  const { label: difficulty, rangeSemis } = computeDifficulty(song);
  return {
    pro,
    kicker: pro ? "PRO SONGBOOK" : "PUBLIC DOMAIN · FREE TO SING",
    title: song.title,
    facts: `${song.genre} · ${song.era} · ${song.bpm} bpm · ${song.beatsPerBar}/bar · ${difficulty}`,
    firstLine: lyricLines(song.notes)[0]?.text ?? "",
    notes: `${midiToLabel(lo)} — ${midiToLabel(hi)}`,
    footer: `${rangeSemis} semitones · ${song.notes.length} notes · suede sing`,
  };
}

export function songCardVersion(song: Song): string {
  const contour = song.notes.map((n) => [n.midi, n.startBeat, n.durBeats]);
  return ogCardVersion(JSON.stringify([songCardText(song), contour]));
}

/* ------------------------------------------------------------- hub cards --- */

/** Everything the hub card (components/singers/og-card.tsx) draws. */
export interface HubCardProps {
  kicker: string;
  title: string;
  stat: string;
  /** Up to five ranges, drawn as stacked bars on a shared axis. */
  rows: Singer[];
  /** Where the bars sit: octave Cs either side, which no singer need reach. */
  axisLow: number;
  axisHigh: number;
  /** The span the card claims, taken from the group itself, never the axis. */
  caption: string;
}

const spanOf = (s: Singer) => s.highMidi - s.lowMidi;

/** Widest spans read best on a card: they show the group's reach. */
function widestFive(list: readonly Singer[]): Singer[] {
  return [...list].sort((a, b) => spanOf(b) - spanOf(a)).slice(0, 5);
}

function octaveAxis(low: number, high: number) {
  return {
    axisLow: Math.floor(low / 12) * 12,
    axisHigh: Math.ceil(high / 12) * 12,
  };
}

/** The genre hub's card, or undefined for a genre with no singers. */
export function genreCardProps(g: string): HubCardProps | undefined {
  const list = singersByGenre(g);
  const stats = statsFor(list);
  if (!stats) return undefined;
  const low = stats.lowest.lowMidi;
  const high = stats.highest.highMidi;
  return {
    kicker: "Genre",
    title: `${g} vocal ranges`,
    stat: `Median span ${spanOctaves(stats.medianSpanSemitones)} octaves`,
    rows: widestFive(list),
    ...octaveAxis(low, high),
    // The genre hub's own "Range covered" tile.
    caption: `Range covered ${midiToLabel(low)}–${midiToLabel(high)}`,
  };
}

/** The voice-type hub's card, or undefined for a type with no singers. */
export function voiceTypeCardProps(v: VoiceKind): HubCardProps | undefined {
  const list = singersByVoiceType(v);
  const stats = statsFor(list);
  if (!stats) return undefined;
  const low = stats.lowest.lowMidi;
  const high = stats.highest.highMidi;
  return {
    kicker: "Voice type",
    title: `Famous ${pluralVoice(v.toLowerCase())}`,
    stat: `Cited ranges · median ${spanOctaves(stats.medianSpanSemitones)} octaves`,
    rows: widestFive(list),
    ...octaveAxis(low, high),
    caption: `Range covered ${midiToLabel(low)}–${midiToLabel(high)}`,
  };
}

/** The records page's card: the five widest voices, and the catalog's ends. */
export function recordsCardProps(): HubCardProps {
  const rows = widestFive(SINGERS);
  const holders = recordHolders(SINGERS);
  return {
    kicker: "Extremes",
    title: "Reported catalog extremes",
    stat: `The widest voices in the library — up to ${spanOctaves(spanOf(rows[0]))} octaves`,
    rows,
    ...octaveAxis(
      Math.min(...rows.map((s) => s.lowMidi)),
      Math.max(...rows.map((s) => s.highMidi)),
    ),
    // The records page's "lowest listed endpoint" and highest, not the axis.
    caption: `Catalog extremes ${midiToLabel(holders.lowest[0].lowMidi)}–${midiToLabel(holders.highest[0].highMidi)}`,
  };
}

/**
 * The hub card's URL version: every word and bar it draws, plus the layout's
 * revision, since a layout fix (round 5's title size) changes the picture
 * without changing a word.
 */
export function hubCardVersion(
  props: HubCardProps,
  revision: string = HUB_OG_CARD_REVISION,
): string {
  return ogCardVersion(
    JSON.stringify([
      revision,
      props.kicker,
      props.title,
      props.stat,
      props.rows.map((r) => [r.name, r.lowMidi, r.highMidi]),
      props.axisLow,
      props.axisHigh,
      props.caption,
    ]),
  );
}
