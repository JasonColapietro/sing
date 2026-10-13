import "server-only";

import { midiToLabel } from "@/lib/audio/notes";
import { ogCardVersion } from "@/lib/og";
import { singerReviewLabel } from "@/lib/singer-evidence";
import { describeSpan, type Singer } from "@/lib/singers";
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
