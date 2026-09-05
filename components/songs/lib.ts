import type { LyricLine, SessionMode, Song, SongNote, SongSection } from "./types";
import type { Achievement, SessionLog, VocalRange } from "@/lib/progress";

export const COUNT_IN_BEATS = 4;
export const TOLERANCE_CENTS = 50;
export const MIN_VOLUME = 0.006;

/**
 * Playback rate multiplier. Continuous rather than a four-value tuple: the
 * tempo control is a slider now, and auto-tempo nudges the rate one step at a
 * time, which a literal union cannot express. Always pass rates through
 * `snapTempo` so every stored or displayed rate sits on the grid.
 */
export type Tempo = number;

export const TEMPO_MIN = 0.25;
export const TEMPO_MAX = 1.25;
export const TEMPO_STEP = 0.05;

/** Clamp into [TEMPO_MIN, TEMPO_MAX] and round onto the TEMPO_STEP grid. */
export function snapTempo(rate: number): number {
  const clamped = Math.min(TEMPO_MAX, Math.max(TEMPO_MIN, rate));
  // Re-round after the multiply: 0.05 grids land on values like
  // 0.35000000000000003 in binary floating point, which then prints wrong.
  return Math.round((Math.round(clamped / TEMPO_STEP) * TEMPO_STEP) * 100) / 100;
}

/** A rate as a percentage of the written tempo, e.g. "85%". */
export function formatTempoPct(rate: number): string {
  return `${Math.round(rate * 100)}%`;
}

/**
 * Loop scores that move the tempo when the singer leaves it on Auto.
 *
 * Our product decision, not anyone's published number: 85 is a loop sung
 * cleanly enough that the next one should be harder, and at or below 60 the
 * singer is fighting the take rather than learning it.
 */
export const AUTO_TEMPO_UP_SCORE = 85;
export const AUTO_TEMPO_DOWN_SCORE = 60;

/**
 * The next rate after a loop: one step up at or above the up score, one step
 * down at or below the down score, hold in between. Snapped, so it also
 * refuses to walk past the bounds.
 */
export function autoTempoStep(current: number, lastLoopScore: number): number {
  if (lastLoopScore >= AUTO_TEMPO_UP_SCORE) return snapTempo(current + TEMPO_STEP);
  if (lastLoopScore <= AUTO_TEMPO_DOWN_SCORE) return snapTempo(current - TEMPO_STEP);
  return snapTempo(current);
}

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
  /** Range span in semitones plus a leap-density term. Exposed for debugging. */
  score: number;
}

/** A jump of a major third or more, which is where intonation starts to cost. */
const LEAP_SEMIS = 4;
/** How much an all-leaps melody adds on top of its range span. */
const LEAP_WEIGHT = 12;
export const DIFFICULTY_EASY_MAX = 9;
export const DIFFICULTY_MEDIUM_MAX = 13;

/**
 * Difficulty from range span plus how *densely* the melody leaps.
 *
 * Density rather than a raw leap count, because a count scales with length:
 * counting leaps rated every full arrangement harder than the phrase cut from
 * the same melody, which is backwards — the notes are no harder to sing, there
 * are just more of them. Amazing Grace and its full verse now score alike.
 *
 * The thresholds were recalibrated against the whole songbook. The previous
 * scale (`span + leaps * 3`, Easy ≤ 5, Medium ≤ 9) was set when the book held
 * six short phrases; across the current catalog it labelled 20 of 27 songs
 * "Hard", including Frère Jacques, whose melody spans four semitones. A filter
 * that answers "Hard" for almost everything cannot help anyone choose a song.
 */
export function computeDifficulty(song: Song): Difficulty {
  const midis = song.notes.map((n) => n.midi);
  const [lo, hi] = songNoteRange(song);
  const rangeSemis = hi - lo;
  let leaps = 0;
  for (let i = 1; i < midis.length; i++) {
    if (Math.abs(midis[i] - midis[i - 1]) >= LEAP_SEMIS) leaps++;
  }
  const intervals = Math.max(1, midis.length - 1);
  const score = rangeSemis + Math.round((leaps / intervals) * LEAP_WEIGHT);
  const label =
    score <= DIFFICULTY_EASY_MAX
      ? "Easy"
      : score <= DIFFICULTY_MEDIUM_MAX
        ? "Medium"
        : "Hard";
  return { label, rangeSemis, leaps, score };
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

/**
 * m:ss. The minute used to be hardcoded to "0:", which was invisible while
 * every song was a single sub-minute phrase and wrong the moment a full
 * multi-section arrangement ran long — 96 seconds printed as "0:96".
 */
export function formatMinSec(totalSec: number): string {
  const s = Math.max(0, Math.round(totalSec));
  const min = Math.floor(s / 60);
  return `${min}:${String(s % 60).padStart(2, "0")}`;
}

/** How cleanly a single note was held, once its window has passed. */
export type Judgment = "perfect" | "great" | "good" | "miss";

export const JUDGMENTS: Judgment[] = ["perfect", "great", "good", "miss"];

/** Hit-ratio floor for each judgment, checked best-first. */
export const JUDGMENT_THRESHOLDS: Array<[Judgment, number]> = [
  ["perfect", 0.9],
  ["great", 0.7],
  ["good", 0.4],
  ["miss", 0],
];

export function judgeRatio(ratio: number): Judgment {
  for (const [judgment, floor] of JUDGMENT_THRESHOLDS) {
    if (ratio >= floor) return judgment;
  }
  return "miss";
}

export type JudgmentTally = Record<Judgment, number>;

export function emptyTally(): JudgmentTally {
  return { perfect: 0, great: 0, good: 0, miss: 0 };
}

// ---------------------------------------------------------------------------
// Performance-mode scoring
//
// The rungs, the streak length and the point values below are our product
// decisions — they are tuned so a clean phrase feels like it is climbing
// without letting one lucky bar carry a whole song. Points are always derived
// from the judgments of a run and are never stored: nothing here touches
// lib/progress or the SessionLog shape.
// ---------------------------------------------------------------------------

export const MULTIPLIER_RUNGS = [3, 3.5, 4, 4.5, 5] as const;

/** How many consecutive strong notes it takes to climb one rung. */
export const MULTIPLIER_STREAK = 4;

export interface MultiplierState {
  multiplier: number;
  streak: number;
}

export const INITIAL_MULTIPLIER: MultiplierState = { multiplier: 3, streak: 0 };

function rungIndex(multiplier: number): number {
  const i = (MULTIPLIER_RUNGS as readonly number[]).indexOf(multiplier);
  return i === -1 ? 0 : i;
}

/**
 * Advance the multiplier for one judged note: perfect and great extend the
 * streak and climb a rung every MULTIPLIER_STREAK in a row, good holds the
 * rung but resets the streak, a miss drops a rung and resets.
 */
export function multiplierStep(state: MultiplierState, judgment: Judgment): MultiplierState {
  const index = rungIndex(state.multiplier);
  if (judgment === "perfect" || judgment === "great") {
    const streak = state.streak + 1;
    const climb = streak % MULTIPLIER_STREAK === 0;
    const next = climb ? Math.min(MULTIPLIER_RUNGS.length - 1, index + 1) : index;
    return { multiplier: MULTIPLIER_RUNGS[next], streak };
  }
  if (judgment === "good") {
    return { multiplier: MULTIPLIER_RUNGS[index], streak: 0 };
  }
  return { multiplier: MULTIPLIER_RUNGS[Math.max(0, index - 1)], streak: 0 };
}

/** Base points per note before the multiplier. Our own values. */
export const JUDGMENT_POINTS: Record<Judgment, number> = {
  perfect: 100,
  great: 70,
  good: 40,
  miss: 0,
};

export function pointsFor(judgment: Judgment, multiplier: number): number {
  return Math.round(JUDGMENT_POINTS[judgment] * multiplier);
}

export interface SessionSummaryData {
  song: Song;
  /** Which mode the run was sung in. */
  mode: SessionMode;
  /** Overall score 0..100, or undefined when practiced in listen mode (no mic). */
  score: number | undefined;
  perLoopScores: number[];
  hardest: HardestNote[];
  xpGained: number;
  newAchievements: Achievement[];
  listenMode: boolean;
  /** Longest unbroken run of non-miss notes. */
  maxCombo: number;
  /** How many notes landed in each judgment band, summed over every loop. */
  judgments: JudgmentTally;
  /** Per-section scores, for songs that have sections. */
  sectionScores: Array<{ label: string; score: number }>;
  /** The settings the session was actually sung at, for the result card. */
  transpose: number;
  /**
   * The rate the song *ended* on. With Auto tempo the rate moves between
   * loops, so this is the last one sung, not the one the session started at.
   */
  tempo: number;
  loops: number;
  /** Derived performance-mode totals; 0 for a rehearsal. */
  points: number;
  topMultiplier: number;
}

// ---------------------------------------------------------------------------
// Structure: lyric lines and sections
// ---------------------------------------------------------------------------

/**
 * Group the flat note array into printed lyric lines.
 *
 * Syllables join into a word until one of them ends the word (`wordEnd`
 * absent or true), so "Twin" + "kle" prints as "Twinkle" while "star" stands
 * alone. Notes with no `line` fall on line 0, which is what makes a
 * single-phrase song need no annotation.
 */
export function lyricLines(notes: SongNote[]): LyricLine[] {
  const byLine = new Map<number, number[]>();
  notes.forEach((n, i) => {
    const key = n.line ?? 0;
    const bucket = byLine.get(key);
    if (bucket) bucket.push(i);
    else byLine.set(key, [i]);
  });

  return [...byLine.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([, noteIndices], index) => {
      const words: string[] = [];
      let current = "";
      for (const i of noteIndices) {
        const n = notes[i];
        current += n.lyric;
        if (n.wordEnd !== false) {
          words.push(current);
          current = "";
        }
      }
      if (current) words.push(current);

      const starts = noteIndices.map((i) => notes[i].startBeat);
      const ends = noteIndices.map((i) => notes[i].startBeat + notes[i].durBeats);
      return {
        index,
        noteIndices,
        startBeat: Math.min(...starts),
        endBeat: Math.max(...ends),
        text: words.join(" "),
      };
    });
}

/** The lyric line active at a beat position, or the next one up if between lines. */
export function lyricLineAtBeat(lines: LyricLine[], beat: number): number {
  for (let i = 0; i < lines.length; i++) {
    if (beat < lines[i].endBeat) return i;
  }
  return Math.max(0, lines.length - 1);
}

/** The section containing a beat position, or null when the song has no sections. */
export function sectionAtBeat(song: Song, beat: number): SongSection | null {
  if (!song.sections) return null;
  return (
    song.sections.find((s) => beat >= s.startBeat && beat < s.endBeat) ?? null
  );
}

// ---------------------------------------------------------------------------
// Browsing helpers
// ---------------------------------------------------------------------------

/** How many times through this song runs by default. */
export function loopsFor(song: Song): number {
  return Math.max(1, song.defaultLoops);
}

/** Seconds for a full default session: every loop, at 1x tempo. */
export function sessionSeconds(song: Song): number {
  return phraseSeconds(song) * loopsFor(song);
}

export type RangeVerdict = "fits" | "high" | "low" | "wide" | "unknown";

export interface RangeFit {
  verdict: RangeVerdict;
  /** Semitones the song sits above (+) or below (-) a comfortable placement. */
  offsetSemis: number;
  /** Transposition that would make it fit, or null with no saved range. */
  suggestedTranspose: number | null;
}

/**
 * Whether a song sits inside the singer's saved range as written.
 *
 * "wide" means the melody spans more than the voice does, so no
 * transposition fixes it — the useful signal is that it will be a stretch at
 * one end whatever key it is in.
 */
export function rangeFit(song: Song, range: VocalRange, transpose = 0): RangeFit {
  if (range.lowMidi === undefined || range.highMidi === undefined) {
    return { verdict: "unknown", offsetSemis: 0, suggestedTranspose: null };
  }
  const [rawLo, rawHi] = songNoteRange(song);
  const lo = rawLo + transpose;
  const hi = rawHi + transpose;
  const suggested = fitTransposeToRange(song, range);

  if (hi - lo > range.highMidi - range.lowMidi) {
    return { verdict: "wide", offsetSemis: 0, suggestedTranspose: suggested };
  }
  if (hi > range.highMidi) {
    return { verdict: "high", offsetSemis: hi - range.highMidi, suggestedTranspose: suggested };
  }
  if (lo < range.lowMidi) {
    return { verdict: "low", offsetSemis: lo - range.lowMidi, suggestedTranspose: suggested };
  }
  return { verdict: "fits", offsetSemis: 0, suggestedTranspose: suggested };
}

/**
 * How many of the given songs sit inside the range as written.
 *
 * Takes the list rather than reading the catalog, because the only honest
 * number to quote is one counted over the songs that singer can actually
 * open: the free set counted for a subscriber understates the book they paid
 * for, and the full set counted for a free reader advertises access they hit
 * a paywall on the moment they click through. Callers pass the same
 * entitlement-aware list the songbook itself browses.
 */
export function countSongsFitting(songs: readonly Song[], range: VocalRange): number {
  let n = 0;
  for (const song of songs) {
    if (rangeFit(song, range).verdict === "fits") n++;
  }
  return n;
}
