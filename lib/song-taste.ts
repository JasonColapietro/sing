import { isProSong } from "@/components/songs/data";
import {
  BAND_ORDER,
  bandForSong,
  bandOpen,
  computeDifficulty,
  fitTransposeToRange,
  rangeFit,
} from "@/components/songs/lib";
import type { Song, SongBand, SongForm, SongGenre } from "@/components/songs/types";
import type { VocalRange } from "./progress-shape";

/**
 * The onboarding quiz's answers, and the ranking that turns them into first
 * song picks.
 *
 * Pure on purpose: the store in `components/songs/taste.ts` only persists what
 * `reviveTaste` accepts, and the songs room only renders what `pickForTaste`
 * returns, so both halves of the feature can be tested without a DOM.
 *
 * Favourite singers are deliberately not asked. The singer directory is
 * overwhelmingly pop, R&B and rock; the songbook is public-domain folk, hymns
 * and nursery tunes. Any mapping from "you like Adele" to "try Shenandoah"
 * would be a guess wearing the costume of a recommendation.
 */

export const TASTE_KEY = "suede-sing:taste:v1";

export type TasteLevel = "new" | "some" | "experienced";
/** "either" is a real answer, not a skip: it just stops form from mattering. */
export type TasteGoal = SongForm | "either";

export interface TasteAnswers {
  kind: "answered";
  genres: SongGenre[];
  level: TasteLevel;
  goal: TasteGoal;
  /** ISO timestamp, so a later version can tell a stale answer from a fresh one. */
  at: string;
}

/**
 * Skipping is remembered as its own state rather than as "no answers": the
 * quiz must not re-open on every visit for someone who already said no.
 */
export interface TasteSkipped {
  kind: "skipped";
  at: string;
}

export type Taste = TasteAnswers | TasteSkipped;

export const TASTE_LEVELS: ReadonlyArray<{ value: TasteLevel; label: string; hint: string }> = [
  { value: "new", label: "Brand new", hint: "I have not really sung on purpose before." },
  { value: "some", label: "Some singing", hint: "Choir, lessons a while ago, or lots of singing along." },
  { value: "experienced", label: "Experienced", hint: "I sing regularly and want a challenge." },
];

export const TASTE_GOALS: ReadonlyArray<{ value: TasteGoal; label: string; hint: string }> = [
  { value: "phrase", label: "Short drills", hint: "One phrase, looped until it sits right." },
  { value: "full", label: "Whole songs", hint: "Sing a full arrangement through once." },
  { value: "either", label: "Either is fine", hint: "Mix them up." },
];

/**
 * The band each level aims at. Only an aim: `bandOpen` still decides what can
 * be sung, so an "experienced" newcomer is pointed at the top of what is open
 * to them rather than past the ladder.
 */
const TARGET_BAND: Record<TasteLevel, SongBand> = {
  new: "first",
  some: "easy",
  experienced: "steady",
};

// A Record rather than a list so adding a SongGenre fails the type check here
// instead of silently dropping that genre from every revived answer.
const KNOWN_GENRES: Record<SongGenre, true> = {
  Folk: true, Traditional: true, Hymn: true, Spiritual: true, Classical: true,
  "Sea Shanty": true, Nursery: true, Patriotic: true, Christmas: true,
  Blues: true, Musical: true,
};
const GENRE_SET: ReadonlySet<string> = new Set(Object.keys(KNOWN_GENRES));
const LEVELS = new Set<string>(TASTE_LEVELS.map((l) => l.value));
const GOALS = new Set<string>(TASTE_GOALS.map((g) => g.value));

/**
 * Sanitize whatever came out of localStorage. Never throws; anything it cannot
 * vouch for becomes `null`, which the room treats as a first visit — asking
 * again costs three taps, while trusting a mangled answer quietly skews picks.
 */
export function reviveTaste(raw: unknown): Taste | null {
  if (typeof raw !== "object" || raw === null) return null;
  const r = raw as Record<string, unknown>;
  const at = typeof r.at === "string" ? r.at : "";
  if (r.kind === "skipped") return { kind: "skipped", at };
  if (r.kind !== "answered") return null;
  if (typeof r.level !== "string" || !LEVELS.has(r.level)) return null;
  if (typeof r.goal !== "string" || !GOALS.has(r.goal)) return null;
  const genres = Array.isArray(r.genres)
    ? [...new Set(r.genres.filter((g): g is SongGenre => typeof g === "string" && GENRE_SET.has(g)))]
    : [];
  return {
    kind: "answered",
    genres,
    level: r.level as TasteLevel,
    goal: r.goal as TasteGoal,
    at,
  };
}

/**
 * Genres worth offering in the quiz: only ones the singer's catalog actually
 * holds, most-stocked first. A chip for a genre with no songs (the type still
 * lists Blues and Musical) would promise picks the room cannot deliver.
 */
export function tasteGenreOptions(songs: readonly Song[]): SongGenre[] {
  const counts = new Map<SongGenre, number>();
  for (const s of songs) counts.set(s.genre, (counts.get(s.genre) ?? 0) + 1);
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([g]) => g);
}

export interface TastePick {
  song: Song;
  /** True when the song is in a genre the singer chose; drives the card's wording. */
  genreMatch: boolean;
}

export interface TasteContext {
  /** The entitlement-aware catalog the room browses (`SONGS`, plus `PRO_SONGS` for Pro). */
  songs: readonly Song[];
  pro: boolean;
  masteredIds: ReadonlySet<string>;
  range: VocalRange;
}

/**
 * Rank songs for a singer's answers and return the top `limit`.
 *
 * The order of precedence is the point of this function:
 *   1. Eligibility is never negotiable. A song in a locked band, or a Pro song
 *      for a free singer, is dropped before anything is scored — a
 *      recommendation is a deep link, and a deep link to a lock is a dead end.
 *   2. Range fit outranks taste. With a saved range, songs "Fit to my range"
 *      can place inside it (±12 semitones) always come before ones it cannot,
 *      whatever their genre: a favourite style sung out of reach is a worse
 *      first song than a hymn that fits.
 *   3. Within that, genre, then closeness to the level's target band, then the
 *      goal's form. Genre leads because it is the one question the singer
 *      answered about themselves; band closeness keeps a beginner's Folk pick
 *      from being the hardest Folk song that happens to be open.
 *   4. Ties break on difficulty score, then catalog order, so the list is
 *      stable across renders.
 */
export function pickForTaste(
  taste: TasteAnswers,
  ctx: TasteContext,
  limit = 3,
): TastePick[] {
  const wanted = new Set<SongGenre>(taste.genres);
  const target = BAND_ORDER.indexOf(TARGET_BAND[taste.level]);
  const hasRange = ctx.range.lowMidi !== undefined && ctx.range.highMidi !== undefined;

  const scored = ctx.songs
    .map((song, index) => ({ song, index }))
    .filter(({ song }) =>
      (ctx.pro || !isProSong(song.id)) &&
      bandOpen(bandForSong(song), ctx.masteredIds, ctx.songs),
    )
    .map(({ song, index }) => {
      const shift = hasRange ? fitTransposeToRange(song, ctx.range) : null;
      const fits = !hasRange || (shift !== null && rangeFit(song, ctx.range, shift).verdict === "fits");
      const genreMatch = wanted.has(song.genre);
      const bandGap = Math.abs(BAND_ORDER.indexOf(bandForSong(song)) - target);
      const formMatch = taste.goal === "either" || song.form === taste.goal;
      return {
        song,
        index,
        genreMatch,
        fitTier: fits ? 0 : 1,
        // Weights sized so one genre match outweighs any band gap (max 4) plus
        // the form bonus: genre is the question, the rest is tuning.
        taste: (genreMatch ? 10 : 0) - bandGap * 2 + (formMatch ? 1 : 0),
        difficulty: computeDifficulty(song).score,
      };
    });

  scored.sort((a, b) =>
    a.fitTier - b.fitTier ||
    b.taste - a.taste ||
    a.difficulty - b.difficulty ||
    a.index - b.index,
  );

  return scored.slice(0, Math.max(0, limit)).map(({ song, genreMatch }) => ({ song, genreMatch }));
}
