import type { Song, SongNote } from "./data";
import type { Achievement, SessionLog, VocalRange } from "@/lib/progress";

export const LOOPS = 4;
export const COUNT_IN_BEATS = 4;
export const TOLERANCE_CENTS = 50;
export const MIN_VOLUME = 0.006;

export const TEMPOS = [0.5, 0.75, 1, 1.25] as const;
export type Tempo = (typeof TEMPOS)[number];

export const MAX_TRANSPOSE = 12;
export const MIN_TRANSPOSE = -12;

/** Total length of one phrase loop, in beats. */
export function songTotalBeats(song: Song): number {
  return song.notes.reduce((m, n) => Math.max(m, n.startBeat + n.durBeats), 0);
}

/** [lowest, highest] midi in the song's notes, before transposition. */
export function songNoteRange(song: Song): [number, number] {
  const midis = song.notes.map((n) => n.midi);
  return [Math.min(...midis), Math.max(...midis)];
}

export interface Difficulty {
  label: "Easy" | "Medium" | "Hard";
  rangeSemis: number;
  leaps: number;
}

/** Difficulty from pitch range span plus count of leaps of a major third or more. */
export function computeDifficulty(song: Song): Difficulty {
  const midis = song.notes.map((n) => n.midi);
  const [lo, hi] = songNoteRange(song);
  const rangeSemis = hi - lo;
  let leaps = 0;
  for (let i = 1; i < midis.length; i++) {
    if (Math.abs(midis[i] - midis[i - 1]) >= 4) leaps++;
  }
  const score = rangeSemis + leaps * 3;
  const label = score <= 5 ? "Easy" : score <= 9 ? "Medium" : "Hard";
  return { label, rangeSemis, leaps };
}

/** Seconds per beat at a given bpm and tempo multiplier. */
export function secPerBeat(bpm: number, tempo: number): number {
  return 60 / (bpm * tempo);
}

/** ~seconds for one loop through the phrase, at 1x tempo. */
export function phraseSeconds(song: Song): number {
  return songTotalBeats(song) * secPerBeat(song.bpm, 1);
}

export function clampTranspose(n: number): number {
  return Math.min(MAX_TRANSPOSE, Math.max(MIN_TRANSPOSE, n));
}

/**
 * Semitone shift that centers the song's note range inside the singer's
 * saved vocal range. Returns null if no range is saved yet.
 */
export function fitTransposeToRange(song: Song, range: VocalRange): number | null {
  if (range.lowMidi === undefined || range.highMidi === undefined) return null;
  const [lo, hi] = songNoteRange(song);
  const songCenter = (lo + hi) / 2;
  const rangeCenter = (range.lowMidi + range.highMidi) / 2;
  return clampTranspose(Math.round(rangeCenter - songCenter));
}

export function transposedNotes(song: Song, transpose: number): SongNote[] {
  if (transpose === 0) return song.notes;
  return song.notes.map((n) => ({ ...n, midi: n.midi + transpose }));
}

/** Best (highest) previously logged score for this song, if any. */
export function bestScoreForSong(sessions: SessionLog[], title: string): number | undefined {
  let best: number | undefined;
  for (const s of sessions) {
    if (s.type === "song" && s.detail === title && s.score !== undefined) {
      best = best === undefined ? s.score : Math.max(best, s.score);
    }
  }
  return best;
}

/** Note index active at a given beat position within one loop, or -1. */
export function noteIndexAtBeat(notes: SongNote[], beat: number): number {
  for (let i = 0; i < notes.length; i++) {
    const n = notes[i];
    if (beat >= n.startBeat && beat < n.startBeat + n.durBeats) return i;
  }
  return -1;
}

/**
 * Signed cents from a sung frequency's midi-float to a target midi. When
 * octaveAgnostic, the distance folds to the nearest octave of the target.
 */
export function foldedCents(midiFloat: number, targetMidi: number, octaveAgnostic: boolean): number {
  let d = midiFloat - targetMidi;
  if (octaveAgnostic) {
    d = ((d % 12) + 12) % 12;
    if (d > 6) d -= 12;
  }
  return d * 100;
}

export interface HardestNote {
  index: number;
  midi: number;
  lyric: string;
  ratio: number;
}

/** Notes with the lowest hit ratio, worst first, capped to a handful. */
export function hardestNotes(notes: SongNote[], ratios: number[], max = 3): HardestNote[] {
  return notes
    .map((n, i) => ({ index: i, midi: n.midi, lyric: n.lyric, ratio: ratios[i] ?? 0 }))
    .filter((n) => n.ratio < 0.75)
    .sort((a, b) => a.ratio - b.ratio)
    .slice(0, max);
}

export function formatMinSec(totalSec: number): string {
  const s = Math.max(0, Math.round(totalSec));
  return `0:${String(s).padStart(2, "0")}`;
}

export interface SessionSummaryData {
  song: Song;
  /** Overall score 0..100, or undefined when practiced in listen mode (no mic). */
  score: number | undefined;
  perLoopScores: number[];
  hardest: HardestNote[];
  xpGained: number;
  newAchievements: Achievement[];
  listenMode: boolean;
}
