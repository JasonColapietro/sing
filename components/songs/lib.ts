import type {
  GuidePass,
  LyricLine,
  SessionMode,
  Song,
  SongBand,
  SongNote,
  SongSection,
} from "./types";
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

// ---------------------------------------------------------------------------
// Bands: the songbook's five-rung browsing ladder
//
// Cut from computeDifficulty's score rather than its three labels: the ladder
// opens a rung at a time, and Easy/Medium/Hard cannot say where inside the
// book a singer has got to. The names are ours.
// ---------------------------------------------------------------------------

export const BAND_ORDER: readonly SongBand[] = ["first", "easy", "steady", "hard", "peak"];

export const BAND_LABEL: Record<SongBand, string> = {
  first: "First songs",
  easy: "Easy going",
  steady: "Steady",
  hard: "A stretch",
  peak: "Peak",
};

/**
 * Score ceiling for each band, checked in order; anything above the last one
 * is "peak". The middle two ceilings are the difficulty labels' own
 * thresholds, so a song can never read "Easy" on its card while sitting above
 * the easy band.
 */
const BAND_MAX_SCORE: Array<[SongBand, number]> = [
  ["first", 6],
  ["easy", DIFFICULTY_EASY_MAX],
  ["steady", DIFFICULTY_MEDIUM_MAX],
  ["hard", 17],
];

export function bandForSong(song: Song): SongBand {
  const { score } = computeDifficulty(song);
  for (const [band, max] of BAND_MAX_SCORE) {
    if (score <= max) return band;
  }
  return "peak";
}

/** How many mastered songs of a band open the band above it. */
export const BAND_UNLOCK_MASTERED = 2;

/**
 * Whether a band is open to sing. The first band always is; every later one
 * opens once BAND_UNLOCK_MASTERED songs of the band directly below it are
 * mastered. Counted over the songs passed in — the same entitlement-aware list
 * the songbook browses — so the ladder never counts a song behind the paywall.
 */
export function bandOpen(
  band: SongBand,
  masteredIds: ReadonlySet<string>,
  songs: readonly Song[],
): boolean {
  const index = BAND_ORDER.indexOf(band);
  if (index <= 0) return true;
  const below = BAND_ORDER[index - 1];
  let mastered = 0;
  for (const song of songs) {
    if (masteredIds.has(song.id) && bandForSong(song) === below) {
      mastered++;
      if (mastered >= BAND_UNLOCK_MASTERED) return true;
    }
  }
  return false;
}

/**
 * The recently-sung row: each recent play resolved against the songs passed
 * in (the entitlement-aware list the songbook browses), newest first, keeping
 * only songs in an open band or the one explicitly linked into this visit.
 * A link opens its song for the visit without opening the rest of its band.
 * Entitlement still applies because the song must be in the supplied catalog.
 */
export function startableRecents(
  recents: readonly { id: string; at: string }[],
  songs: readonly Song[],
  masteredIds: ReadonlySet<string>,
  limit = 6,
  visitUnlockedSongId?: string | null,
): Array<{ song: Song; at: string }> {
  const out: Array<{ song: Song; at: string }> = [];
  for (const r of recents) {
    if (out.length >= limit) break;
    const song = songs.find((s) => s.id === r.id);
    if (song && (song.id === visitUnlockedSongId || bandOpen(bandForSong(song), masteredIds, songs))) {
      out.push({ song, at: r.at });
    }
  }
  return out;
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

/** A key the singer picked, tagged with the song it was picked on. */
export interface PickedTranspose {
  songId: string;
  semis: number;
}

/**
 * The key a song is sung in. A key the singer picked on this song wins;
 * otherwise the song opens fitted to the saved range — the same placement
 * "Fit to my range" gives — or in its written key when no range is saved.
 * Tagged by song id because the player is not re-mounted between songs, so a
 * pick on one song must not carry into the next.
 */
export function songTranspose(
  song: Song,
  range: VocalRange,
  picked: PickedTranspose | null,
): number {
  if (picked && picked.songId === song.id) return picked.semis;
  return fitTransposeToRange(song, range) ?? 0;
}

/**
 * Whether scoring starts octave-agnostic. With a saved range the song is
 * already placed in the singer's own octave, so the exact octave is scored.
 * Without one it sits at its written pitch — most of this book is written at
 * treble pitch — and a lower voice singing it an octave down would otherwise
 * score zero on every note it sang in tune.
 */
export function defaultOctaveAgnostic(range: VocalRange): boolean {
  return range.lowMidi === undefined || range.highMidi === undefined;
}

/**
 * Key names as key signatures spell them, not the sharp spellings midiToName
 * gives single notes. Each tonic takes the name whose signature has fewer
 * accidentals. A major (or Mixolydian) tonic is Db, Eb, Ab or Bb, never C#,
 * D#, G# or A#; F# and Gb tie at six, and F# is the usual name. A minor or
 * Dorian tonic sits on a different signature: Scarborough Fair (D Dorian, the
 * book's one modal song, tagged "dorian") a semitone down is C# Dorian, five
 * sharps, where Db Dorian would take seven flats. A song tagged with neither
 * is read as major, which is what the rest of the book is.
 */
const MAJOR_KEY_NAMES = ["C", "Db", "D", "Eb", "E", "F", "F#", "G", "Ab", "A", "Bb", "B"] as const;
const MINOR_KEY_NAMES = ["C", "C#", "D", "Eb", "E", "F", "F#", "G", "G#", "A", "Bb", "B"] as const;
const MINOR_FAMILY_TAGS: readonly string[] = ["minor", "dorian", "aeolian"];

/** "C", or "Bb (-2)" for a song moved off its written key: the result card's key. */
export function songKeyLabel(
  song: Pick<Song, "defaultKeyRootMidi" | "tags">,
  transpose: number,
): string {
  const names = song.tags.some((t) => MINOR_FAMILY_TAGS.includes(t)) ? MINOR_KEY_NAMES : MAJOR_KEY_NAMES;
  const midi = song.defaultKeyRootMidi + transpose;
  const name = names[((midi % 12) + 12) % 12];
  return transpose === 0 ? name : `${name} (${transpose > 0 ? "+" : ""}${transpose})`;
}

export function transposedNotes(song: Song, transpose: number): SongNote[] {
  if (transpose === 0) return song.notes;
  return song.notes.map((n) => ({ ...n, midi: n.midi + transpose }));
}

/**
 * What a "phrase" entry holds, as its page and the ear room name it: the
 * song's opening phrase, unless the entry marks it as another part of the
 * song (`excerpt`).
 */
export function phraseName(song: Song): string {
  return song.excerpt ?? "opening phrase";
}

/**
 * Titles a song's sessions were logged under before a rename. The song player
 * files each session by `detail: song.title`, so a renamed song would lose its
 * best score and score trend without these. Add a line whenever a song title
 * changes; never remove one, since old sessions keep the old title for good.
 * Warmups do the same with RETIRED_TITLES (components/warmups/exercises.ts).
 */
export const RETIRED_SONG_TITLES: Readonly<Record<string, readonly string[]>> = {
  // Round 1 (2026-10) renames.
  "Home on the Range (Opening Lines)": ["Home on the Range (Verse & Chorus)"],
  "Amazing Grace (Opening Lines, Verses 1 & 2)": ["Amazing Grace (Verse 1 & 2)"],
};

/** Every title this song's sessions can be logged under: its own, then retired ones. */
export function songTitlesFor(title: string): readonly string[] {
  const retired = RETIRED_SONG_TITLES[title];
  return retired ? [title, ...retired] : [title];
}

/** True when a logged session belongs to the song with this current title. */
export function isSessionOfSong(session: Pick<SessionLog, "type" | "detail">, title: string): boolean {
  return session.type === "song" && session.detail !== undefined && songTitlesFor(title).includes(session.detail);
}

/** Best (highest) previously logged score for this song, if any. */
export function bestScoreForSong(sessions: SessionLog[], title: string): number | undefined {
  let best: number | undefined;
  for (const s of sessions) {
    if (isSessionOfSong(s, title) && s.score !== undefined) {
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

/** Whole-octave shifts a pass may be sung in when either octave counts, the written octave first. */
export const SONG_OCTAVE_SHIFTS = [0, -1, 1, -2, 2] as const;

/**
 * In-tune seconds an octave needs before a pass is scored in it, and the lead
 * it needs over the pass's current octave to replace it (as the warmups'
 * OCTAVE_LEAD_SEC).
 */
export const SONG_OCTAVE_LEAD_SEC = 0.1;

/**
 * Scoring for one pass through a song when either octave counts (no saved
 * range, or the singer chose "Any octave"): one octave per pass, not per
 * frame. Folding every frame to its nearest octave on its own let a melody
 * sung with its octave leap skipped, or its top notes dropped an octave,
 * score Perfect on notes it never sang, and master a song rated hard for that
 * leap. The warm-ups already score one octave per rep (contracts rule
 * warmupOctaveWithoutRange).
 *
 * Each shift in SONG_OCTAVE_SHIFTS earns the seconds a frame sung that many
 * octaves from its note lands within TOLERANCE_CENTS. Once one has
 * SONG_OCTAVE_LEAD_SEC of them it is the pass's octave, and every frame is
 * measured from its note moved by that shift; a later shift replaces it only
 * by getting that far ahead of it. A whole pass sung an octave down or up
 * still scores in full. Until an octave leads, a frame folds to its nearest
 * octave as before. Make a fresh one at the start of every pass.
 */
export function createPassOctave(): {
  /** Signed cents from `midiFloat` to `target` in the pass's octave, crediting `dt` seconds to it. */
  cents(midiFloat: number, target: number, dt: number): number;
  /** The pass's octave shift so far, or null before one leads. */
  readonly shift: number | null;
} {
  const credit = new Map<number, number>();
  let shift: number | null = null;
  const held = (s: number | null) => (s === null ? 0 : (credit.get(s) ?? 0));
  return {
    cents(midiFloat, target, dt) {
      for (const s of SONG_OCTAVE_SHIFTS) {
        if (Math.abs((midiFloat - 12 * s - target) * 100) <= TOLERANCE_CENTS) credit.set(s, held(s) + dt);
      }
      const lead = SONG_OCTAVE_SHIFTS.reduce<number>((best, s) => (held(s) > held(best) ? s : best), 0);
      if (lead !== shift && held(lead) >= held(shift) + SONG_OCTAVE_LEAD_SEC) shift = lead;
      return shift === null ? foldedCents(midiFloat, target, true) : (midiFloat - 12 * shift - target) * 100;
    },
    get shift() {
      return shift;
    },
  };
}

/**
 * The whole-octave shift a frame against `target` is scored in: 0 while only
 * the written octave counts; when either octave counts, the pass's octave
 * (createPassOctave's `shift`) once one leads, and before that the octave
 * nearest the target, where the fold puts it.
 */
export function scoredOctaveShift(
  midiFloat: number,
  target: number,
  octaveAgnostic: boolean,
  passShift: number | null,
): number {
  if (!octaveAgnostic) return 0;
  return passShift ?? Math.round((midiFloat - target) / 12);
}

/**
 * Where the piano roll draws a sung frame. When either octave counts, the
 * voice is drawn in the octave the pass is scored in, as the warm-ups draw it:
 * moved by the pass's shift once one leads; before that, folded to the octave
 * nearest the target (null with no note to fold toward, which leaves it). In
 * the exact octave it is drawn where it was sung. Without this a lower voice
 * singing a treble-written song an octave down, as the songbook invites, was
 * scored in full while its trace and dot ran below the bottom of the roll.
 */
export function displayMidi(
  midiFloat: number,
  target: number | null,
  octaveAgnostic: boolean,
  passShift: number | null,
): number {
  if (!octaveAgnostic) return midiFloat;
  if (passShift !== null) return midiFloat - 12 * passShift;
  if (target === null) return midiFloat;
  return midiFloat - 12 * scoredOctaveShift(midiFloat, target, true, null);
}

/**
 * The tag the piano roll shows while it draws a pass sung in another octave
 * on the written melody's lanes, or null in the written octave. The lanes
 * name the written notes, so without it a baritone singing Twinkle an octave
 * down would read his C3 off a lane labelled C4.
 */
export function sungOctaveTag(shift: number | null): string | null {
  if (shift === null || shift === 0) return null;
  const n = Math.abs(shift);
  const count = n === 1 ? "an octave" : `${n === 2 ? "two" : n} octaves`;
  return `Sung ${count} ${shift < 0 ? "down" : "up"}`;
}

/**
 * The octave a song session was sung in, for filing its notes: the shift
 * whose frames earned the most in-tune seconds (keyed by scoredOctaveShift),
 * and the written octave (0) when nothing was credited or on a tie with it.
 * One shift for the whole session, so the summary and the practice log name
 * every note of the melody in the same octave.
 */
export function sungOctaveShift(inTuneSecByShift: ReadonlyMap<number, number>): number {
  let best = 0;
  let bestSec = inTuneSecByShift.get(0) ?? 0;
  for (const [shift, sec] of inTuneSecByShift) {
    if (sec > bestSec) {
      best = shift;
      bestSec = sec;
    }
  }
  return best;
}

/**
 * The notes as sung `shift` octaves from where they are written, for filing a
 * session's per-note tallies and hardest notes where the singer actually sang
 * them (as the warm-ups file a rep's notes at the rep's octave). The same
 * array when the shift is 0.
 */
export function notesInSungOctave(notes: SongNote[], shift: number): SongNote[] {
  if (shift === 0) return notes;
  return notes.map((n) => ({ ...n, midi: n.midi + 12 * shift }));
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

// ---------------------------------------------------------------------------
// Passes: how much of the guide the singer sings against
// ---------------------------------------------------------------------------

/**
 * Guide level each pass opens at, as a mixer percentage. "listen" and "guided"
 * both play the guide in full; what separates them is that a listen pass is
 * not scored, which the session runtime decides rather than the mixer.
 */
export const PASS_GUIDE_PCT: Record<GuidePass, number> = {
  listen: 100,
  guided: 100,
  solo: 0,
};

/** Our own names for the three passes — one vocabulary for the gate, the player and the summary. */
export const PASS_LABEL: Record<GuidePass, string> = {
  listen: "Listen",
  guided: "Sing along",
  solo: "On your own",
};

/**
 * The score a solo pass has to reach to master a song. Our own number: 80 is
 * already the bar the per-loop pills treat as a clean pass.
 */
export const MASTERY_SCORE = 80;

/**
 * The slowest tempo a run may be sung at and still master the song.
 *
 * Mastery used to ignore tempo entirely, so a song sung at 0.25x — four times
 * slower than written, every note four times easier to hold in tune — counted
 * exactly the same as a clean pass at full speed, and unlocked the next band on
 * the same terms. Singing faster than written is not a problem, so this is a
 * floor rather than an equality.
 *
 * Transposition is deliberately NOT gated: fitting a song to your own range is
 * the point of the transpose control, not a way around the scorer.
 */
export const MASTERY_MIN_TEMPO = 1;

/**
 * The starting note an accompanist gives before an unaccompanied run.
 *
 * An On your own pass plays no guide, and the count-in is four unpitched
 * clicks, so without this a singer had no reference for a key the app may
 * have chosen (fitted to the saved range). A tune sung perfectly a semitone
 * off is 100 cents from every target, outside TOLERANCE_CENTS on every frame,
 * and the only pass that can master a song scored about zero. Every
 * unaccompanied setting — choir, audition, graded exam — gives the note first.
 *
 * Returns the earliest note this run sings (playBeats > 0, so a looped span
 * starts from its own first note) and when to sound it: on the first count-in
 * beat, short enough to end at least COUNT_IN_BEATS − 1.5 beats before the
 * downbeat, so it never overlaps a scored frame.
 */
export const STARTING_NOTE_MAX_SEC = 1.2;
export const STARTING_NOTE_MAX_BEATS = 1.5;

export function startingNote(
  notes: SongNote[],
  playBeats: number[],
  spb: number,
): { midi: number; dur: number } | null {
  let first: SongNote | undefined;
  for (let i = 0; i < notes.length; i++) {
    const n = notes[i];
    if ((playBeats[i] ?? 0) > 0 && (!first || n.startBeat < first.startBeat)) first = n;
  }
  if (!first) return null;
  return {
    midi: first.midi,
    dur: Math.min(STARTING_NOTE_MAX_SEC, STARTING_NOTE_MAX_BEATS * spb),
  };
}

/**
 * Whether a finished run masters the song: a solo pass, sung in performance
 * mode, at or above written tempo, scoring at or above MASTERY_SCORE. An
 * unscored run — a listen pass, or no microphone — masters nothing, because it
 * has no score to judge.
 */
export function isMastered(
  pass: GuidePass,
  mode: SessionMode,
  score: number | undefined,
  fullSoloPerformance = true,
  tempo: number = MASTERY_MIN_TEMPO,
): boolean {
  return (
    fullSoloPerformance &&
    pass === "solo" &&
    mode === "performance" &&
    Number.isFinite(tempo) &&
    tempo >= MASTERY_MIN_TEMPO &&
    score !== undefined &&
    Number.isFinite(score) && score <= 100 &&
    score >= MASTERY_SCORE
  );
}

/**
 * A stable fingerprint of a song's written melody.
 *
 * Mastery records store this so a past mastery can be audited against the song
 * as it is today. A transcription fix — a corrected pitch, a re-barred phrase —
 * means the run that earned the mastery was a run at different content, and
 * without a fingerprint there is no way to know that happened.
 *
 * Only the musically identifying fields go in: pitch, onset, duration, and the
 * note count. Lyrics, line numbers and word breaks are presentation, so fixing a
 * syllable break must not invalidate anyone's mastery. Transposition is excluded
 * on purpose — it shifts every note equally, so it is a property of the run and
 * is recorded alongside the fingerprint rather than inside it.
 *
 * FNV-1a over a canonical string: short, dependency-free and deterministic. It
 * is a change detector, not a security primitive.
 */
export function melodyFingerprint(song: Song): string {
  const canonical = `${song.notes.length}|${song.notes
    .map((n) => `${Math.round(n.midi)}:${n.startBeat.toFixed(4)}:${n.durBeats.toFixed(4)}`)
    .join(",")}`;
  let hash = 0x811c9dc5;
  for (let i = 0; i < canonical.length; i++) {
    hash ^= canonical.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash.toString(16).padStart(8, "0");
}

export interface SessionSummaryData {
  song: Song;
  /** Which mode the run was sung in. */
  mode: SessionMode;
  /** Which guide pass the run was sung on. */
  pass: GuidePass;
  /** Whether this run mastered the song — see isMastered. */
  mastered: boolean;
  /** Overall score 0..100, or undefined when practiced in listen mode (no mic). */
  score: number | undefined;
  perLoopScores: number[];
  /**
   * True when the last entry in `perLoopScores` is a pass the singer stopped
   * part-way (End practice in a rehearsal). It is scored against the part
   * sung, and "Loops sung" counts whole passes only.
   */
  partialLastLoop?: boolean;
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

/** A note this long before a new line is where a singer actually takes the breath. */
export const BREATH_HELD_BEATS = 2;

/**
 * Indices of the notes to draw a breath mark before: every note the melody
 * reaches after a rest of at least one beat, and the first note of a new lyric
 * line when the note before it was held for BREATH_HELD_BEATS or more.
 *
 * The second rule is what makes this sing: the songbook's phrases tile with no
 * written rests (every note starts where the last one ended), so a rest-only
 * rule marks nothing in the whole catalogue. Breath lives at the phrase
 * turnover instead — the held note that closes one line and the line that
 * follows — which is also where Simply Sing's cue lands.
 *
 * The first note is never marked — there is nothing to breathe after — and the
 * rest is measured from the furthest beat the melody has already sung to, so a
 * short note nested under a long one cannot open a gap behind itself.
 */
export function breathMarks(notes: SongNote[]): number[] {
  const marks: number[] = [];
  if (notes.length === 0) return marks;
  let sungTo = notes[0].startBeat + notes[0].durBeats;
  for (let i = 1; i < notes.length; i++) {
    const n = notes[i];
    const prev = notes[i - 1];
    const rested = n.startBeat - sungTo >= 1;
    const newLine = (n.line ?? 0) !== (prev.line ?? 0) && prev.durBeats >= BREATH_HELD_BEATS;
    if (rested || newLine) marks.push(i);
    sungTo = Math.max(sungTo, n.startBeat + n.durBeats);
  }
  return marks;
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
 * How many of the given songs fit the range in the key they open in: fitted
 * to the saved range (songTranspose with no pick), the same judgement as the
 * library's "Fits your range" badge and the "Fits my range" filter. Counting
 * the written key instead told low and narrow voices that nothing fits while
 * the songbook, one tap later, marked the same songs as fitting.
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
    if (rangeFit(song, range, songTranspose(song, range, null)).verdict === "fits") n++;
  }
  return n;
}

/**
 * countSongsFitting over the songs a singer can start right now: the bands
 * opened so far (bandOpen, the songbook's own rule), out of the book they are
 * entitled to. `locked` is how many of that book wait behind a later band, so
 * a count quoted before "Open the songbook" never promises songs the
 * library shows as Locked.
 */
export function countOpenSongsFitting(
  book: readonly Song[],
  masteredIds: ReadonlySet<string>,
  range: VocalRange,
): { fitting: number; total: number; locked: number } {
  const open = book.filter((s) => bandOpen(bandForSong(s), masteredIds, book));
  return {
    fitting: countSongsFitting(open, range),
    total: open.length,
    locked: book.length - open.length,
  };
}

/**
 * A span of the beat timeline the singer loops, from a free A–B choice or a
 * section preset. `endBeat` is exclusive, like `SongSection`.
 */
export interface LoopRange {
  startBeat: number;
  endBeat: number;
}

/**
 * Where a free loop handle is allowed to sit: every beat a note starts on,
 * plus the end of the song.
 *
 * Snapping to note starts is what keeps a free loop honest. The player only
 * sings and scores notes that *start* inside the span, so a start handle
 * dropped mid-note would silently lose that note, and an end handle mid-note
 * would clamp it. On these boundaries neither can happen.
 */
export function loopBoundaries(song: Song): number[] {
  const starts = new Set(song.notes.map((n) => n.startBeat));
  starts.add(songTotalBeats(song));
  return [...starts].sort((a, b) => a - b);
}

/** Index of the boundary closest to `beat`; ties go to the earlier one. */
export function nearestBoundaryIndex(bounds: readonly number[], beat: number): number {
  let best = 0;
  for (let i = 1; i < bounds.length; i++) {
    if (Math.abs(bounds[i] - beat) < Math.abs(bounds[best] - beat)) best = i;
  }
  return best;
}

/**
 * The loop two handles describe, as boundary indices. Always at least one
 * note long: a handle dragged past the other pushes against it instead of
 * inverting the span, and `moved` says which handle the singer is dragging so
 * the other one stays put.
 */
export function loopRangeFromHandles(
  bounds: readonly number[],
  startIndex: number,
  endIndex: number,
  moved: "start" | "end",
): { startIndex: number; endIndex: number; range: LoopRange } {
  const last = bounds.length - 1;
  let s = Math.max(0, Math.min(last - 1, Math.round(startIndex)));
  let e = Math.max(1, Math.min(last, Math.round(endIndex)));
  if (e <= s) {
    if (moved === "start") s = e - 1;
    else e = s + 1;
  }
  return { startIndex: s, endIndex: e, range: { startBeat: bounds[s], endBeat: bounds[e] } };
}

/**
 * Scorable beats of each note a run had reached when the singer stopped it:
 * every whole pass before the one it stopped in, plus the part of that pass up
 * to `beat` (song beats, on the scored clock, which runs behind the audio by
 * the pitch lag). `playBeats` is each note's sung beats per pass, 0 outside
 * the span, as the player fixes them at count-in.
 *
 * A rehearsal ends when the singer presses End practice, rarely on a loop
 * line. Scored against every planned pass, the unsung rest of the last one
 * read as a miss: a perfectly sung run ended a moment into loop 3 summed up as
 * "loop 3 13%", and the notes after the stop looked like the hardest ones.
 */
export function reachedBeats(
  notes: readonly SongNote[],
  playBeats: readonly number[],
  wholePasses: number,
  beat: number,
): number[] {
  return notes.map((n, i) => {
    const play = playBeats[i] ?? 0;
    const partial = Math.min(play, Math.max(0, beat - n.startBeat));
    return play * Math.max(0, wholePasses) + partial;
  });
}

/**
 * True when a run stopped before any of its notes began on the scored clock:
 * End practice in the count-in, or in the moment after it. There is nothing to
 * score, summarise or log, so the player leaves as End practice does from a
 * performance. A summary there had no score and so told a singer on Sing
 * along, microphone on, "This was a listen pass".
 */
export function reachedNothing(
  notes: readonly SongNote[],
  playBeats: readonly number[],
  wholePasses: number,
  beat: number,
): boolean {
  return reachedBeats(notes, playBeats, wholePasses, beat).every((b) => b <= 0);
}

/**
 * How a run was set up in the song player: the key the singer picked (null
 * for the fitted or written key), the rate it started at, the loop, the octave
 * scoring and the desk. The player unmounts while the summary shows, so its own
 * state cannot carry these, and "Sing again" used to reopen the song at the
 * written key, 100%, the whole song and Any octave: the same singing then
 * scored 0. SongsClient keeps the last run's setup for the summary's restarts
 * (mode and pass already live there).
 */
export interface PlayerSetup {
  songId: string;
  pickedSemis: number | null;
  /** The rate at count-in; Auto may have moved it by the end. */
  tempo: Tempo;
  tempoAuto: boolean;
  octaveAgnostic: boolean;
  loop: LoopRange | null;
  guidePct: number;
  clickDuringPlay: boolean;
  recordTake: boolean;
}

/** The setup to reopen a song with: the last run's, when it was this song. */
export function setupForSong(setup: PlayerSetup | null | undefined, songId: string): PlayerSetup | null {
  return setup && setup.songId === songId ? setup : null;
}

/** True when the range is the whole song, i.e. nothing is being drilled. */
export function isWholeSongRange(range: LoopRange | null, song: Song): boolean {
  return range === null || (range.startBeat <= 0 && range.endBeat >= songTotalBeats(song));
}

/** 1-based bar and beat of a beat position, for handle readouts. */
export function barBeatLabel(beat: number, beatsPerBar: number): string {
  const perBar = Math.max(1, beatsPerBar);
  const bar = Math.floor(beat / perBar) + 1;
  const inBar = Math.floor(beat - (bar - 1) * perBar) + 1;
  return `Bar ${bar}, beat ${inBar}`;
}

/**
 * What the loop is called in pills and helper text: a section's own label
 * when the range is exactly that section, otherwise its bars.
 */
export function describeLoopRange(song: Song, range: LoopRange): string {
  const section = song.sections?.find(
    (s) => s.startBeat === range.startBeat && s.endBeat === range.endBeat,
  );
  if (section) return section.label;
  const perBar = Math.max(1, song.beatsPerBar);
  const first = Math.floor(range.startBeat / perBar) + 1;
  // endBeat is exclusive: a loop ending exactly on a barline ends in the bar before.
  const last = Math.max(first, Math.ceil(range.endBeat / perBar));
  return first === last ? `Bar ${first}` : `Bars ${first}–${last}`;
}

/**
 * Work that waits on the microphone's permission prompt, which can stay up for
 * as long as the singer likes while they press other things or leave. `begin`
 * hands back a check that holds until the next `begin` or a `cancel`, so what
 * runs after the await runs for the latest press only, and never once its
 * owner has cancelled it — on unmount, or when the screen that asked changes.
 */
export function createPendingRequest(): {
  /** Starts a request; the check it returns is true while it is still the one to act on. */
  begin(): () => boolean;
  /** Drops the pending request, if any. */
  cancel(): void;
} {
  let latest = 0;
  return {
    begin() {
      const id = ++latest;
      return () => id === latest;
    },
    cancel() {
      latest += 1;
    },
  };
}
