"use client";

import { useSyncExternalStore } from "react";

import { MASTERY_MIN_TEMPO, MASTERY_SCORE } from "./lib";

/**
 * Browse memory: which songs the singer starred, and which they sang last.
 *
 * Deliberately separate from `lib/progress`. Progress is the practice record —
 * scored, XP-bearing, and cloud-synced for Pro — while this is disposable
 * browsing state. Keeping it out of that store means a starred song never
 * inflates the synced payload and a corrupt favorites blob can never take the
 * practice history down with it.
 */

const FAV_KEY = "suede-sing:song-favorites:v1";
const RECENT_KEY = "suede-sing:song-recents:v1";
/**
 * Mastery moved to a v2 key rather than upgrading v1 in place.
 *
 * v1 is a bare `string[]`; v2 is an array of records. Writing records into the
 * v1 key would make a rollback to an older deploy read them with
 * `filter(typeof v === "string")` and see zero masteries — every band unlock
 * gone. Leaving v1 where it is costs a few hundred bytes and makes the migration
 * survivable in both directions.
 */
const MASTERED_KEY = "suede-sing:mastered:v2";
const LEGACY_MASTERED_KEY = "suede-sing:mastered:v1";

/** A karaoke night's worth of history; past that, older entries stop earning rent. */
const MAX_RECENTS = 24;
const MAX_FAVORITES = 200;

export interface RecentPlay {
  id: string;
  /** ISO timestamp of when this song was last started. */
  at: string;
}

/**
 * A localStorage-backed store shaped for `useSyncExternalStore`.
 *
 * Three of these exist across this module and `setlist.ts`, so the parse
 * guards live here once rather than three times: an absent, truncated, or
 * hand-edited value must degrade to `empty` instead of throwing, and nothing
 * may touch `window` during SSR.
 *
 * `get` returns a cached reference and only mints a new one inside `set`.
 * React compares snapshots by identity, so returning a fresh array on every
 * read would re-render forever.
 */
export function createLocalStore<T>(
  key: string,
  empty: T,
  /** Sanitize a parsed JSON value into T. Must not throw; return `empty` when unsure. */
  revive: (raw: unknown) => T,
) {
  let cache: T | null = null;
  const listeners = new Set<() => void>();
  let storageBound = false;

  function get(): T {
    if (cache !== null) return cache;
    if (typeof window === "undefined") return empty;
    try {
      const raw = window.localStorage.getItem(key);
      cache = raw === null ? empty : revive(JSON.parse(raw));
    } catch {
      // Absent, unparseable, or storage blocked outright (private mode,
      // third-party-cookie policies) — browse with a clean slate.
      cache = empty;
    }
    return cache;
  }

  function emit() {
    for (const l of listeners) l();
  }

  function set(next: T): T {
    cache = next;
    try {
      window.localStorage.setItem(key, JSON.stringify(next));
    } catch {
      // Quota or a blocked store — keep the in-memory value so the tab still works.
    }
    emit();
    return next;
  }

  function subscribe(cb: () => void): () => void {
    if (!storageBound && typeof window !== "undefined") {
      storageBound = true;
      window.addEventListener("storage", (e) => {
        if (e.key === key) {
          cache = null;
          emit();
        }
      });
    }
    listeners.add(cb);
    return () => listeners.delete(cb);
  }

  return { get, set, subscribe, serverSnapshot: () => empty };
}

/* --------------------------------------------------------------- favorites */

const NO_FAVORITES: readonly string[] = Object.freeze([]);

const favorites = createLocalStore<readonly string[]>(FAV_KEY, NO_FAVORITES, (raw) =>
  Array.isArray(raw)
    ? Object.freeze(
        raw.filter((v): v is string => typeof v === "string").slice(0, MAX_FAVORITES),
      )
    : NO_FAVORITES,
);

export function getFavorites(): readonly string[] {
  return favorites.get();
}

export function useFavorites(): readonly string[] {
  return useSyncExternalStore(
    favorites.subscribe,
    favorites.get,
    favorites.serverSnapshot,
  );
}

/** Star or unstar a song. Returns the new state, for optimistic callers. */
export function toggleFavorite(id: string): boolean {
  const current = favorites.get();
  const starred = current.includes(id);
  favorites.set(
    Object.freeze(
      starred ? current.filter((x) => x !== id) : [id, ...current].slice(0, MAX_FAVORITES),
    ),
  );
  return !starred;
}

/* ---------------------------------------------------------------- recents */

const NO_RECENTS: readonly RecentPlay[] = Object.freeze([]);

function isRecentPlay(v: unknown): v is RecentPlay {
  if (typeof v !== "object" || v === null) return false;
  const r = v as Partial<RecentPlay>;
  return typeof r.id === "string" && typeof r.at === "string";
}

const recents = createLocalStore<readonly RecentPlay[]>(RECENT_KEY, NO_RECENTS, (raw) =>
  Array.isArray(raw)
    ? Object.freeze(raw.filter(isRecentPlay).slice(0, MAX_RECENTS))
    : NO_RECENTS,
);

export function getRecentlyPlayed(): readonly RecentPlay[] {
  return recents.get();
}

export function useRecentlyPlayed(): readonly RecentPlay[] {
  return useSyncExternalStore(recents.subscribe, recents.get, recents.serverSnapshot);
}

/**
 * Record that a song was started. Safe to call more than once for the same
 * start — one entry per song, so a repeat call only refreshes the timestamp.
 * Call it wherever practice actually begins, including the "sing it again"
 * path, so the row reflects singing rather than clicking.
 */
export function recordSongPlayed(id: string): void {
  const rest = recents.get().filter((r) => r.id !== id);
  recents.set(
    Object.freeze([{ id, at: new Date().toISOString() }, ...rest].slice(0, MAX_RECENTS)),
  );
}

/** Epoch ms this song was last started, or undefined if never (or unparseable). */
export function lastPlayedAt(
  list: readonly RecentPlay[],
  id: string,
): number | undefined {
  const entry = list.find((r) => r.id === id);
  if (!entry) return undefined;
  const ms = Date.parse(entry.at);
  return Number.isNaN(ms) ? undefined : ms;
}

/** Coarse "when" label for the recently-sung row. Deliberately vague past a week. */
export function relativeTime(iso: string): string {
  const ms = Date.parse(iso);
  if (Number.isNaN(ms)) return "";
  const mins = Math.floor((Date.now() - ms) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return "a while ago";
}

/* --------------------------------------------------------------- mastered */

/**
 * What a song was mastered *under* — the half that used to be thrown away.
 *
 * The store was a bare array of song ids. That made two things impossible. The
 * gate could not be re-evaluated: when mastery gained a tempo floor, every
 * record already on disk had been earned under no floor at all, possibly at
 * quarter speed, and was indistinguishable from a clean pass at written tempo —
 * so fixing the rule did not fix the records it was wrong about. And a mastery
 * could not be audited: a singer looking at a mastered badge, or anyone looking
 * at a band unlock, had no way to ask what run earned it.
 *
 * So the conditions are stored and the gate is applied on read. Raising
 * `MASTERY_SCORE` or `MASTERY_MIN_TEMPO` now retroactively stops counting the
 * records that no longer clear it, with no migration.
 */
export interface MasteryConditions {
  /** The tempo multiplier the run ended on. Gated: see MASTERY_MIN_TEMPO. */
  tempo: number;
  /**
   * Semitones transposed. Recorded and deliberately never gated — fitting a
   * song to your own range is the point of the transpose control. Recording it
   * is what lets an audit see the run without changing what qualifies.
   */
  transpose: number;
  /** Overall score, 0..100. Gated: see MASTERY_SCORE. */
  score: number;
  /** `melodyFingerprint` of the song as it was when this was earned. */
  melody: string;
}

export interface MasteryRecord {
  id: string;
  /** ISO timestamp. */
  at: string;
  /**
   * `null` for a record migrated from v1, which carried no conditions. Those
   * cannot be verified and must not claim to be: see `masteryHolds`.
   */
  conditions: MasteryConditions | null;
}

const NO_MASTERED: readonly MasteryRecord[] = Object.freeze([]);
const EMPTY_MASTERED: ReadonlySet<string> = new Set<string>();

function isConditions(v: unknown): v is MasteryConditions {
  if (typeof v !== "object" || v === null) return false;
  const c = v as Partial<MasteryConditions>;
  return (
    typeof c.tempo === "number" && Number.isFinite(c.tempo) &&
    typeof c.transpose === "number" && Number.isFinite(c.transpose) &&
    typeof c.score === "number" && Number.isFinite(c.score) &&
    typeof c.melody === "string" && c.melody.length > 0
  );
}

function reviveRecord(v: unknown): MasteryRecord | null {
  if (typeof v !== "object" || v === null) return null;
  const r = v as Partial<MasteryRecord>;
  if (typeof r.id !== "string" || !r.id || typeof r.at !== "string") return null;
  // An unrecognisable conditions blob degrades to "unverifiable" rather than
  // being dropped: a hand-edited or truncated value should cost the audit, not
  // the singer's unlock.
  return { id: r.id, at: r.at, conditions: isConditions(r.conditions) ? r.conditions : null };
}

/** v1 ids, read once so a returning singer keeps what they earned. */
function legacyRecords(): readonly MasteryRecord[] {
  if (typeof window === "undefined") return NO_MASTERED;
  try {
    const raw = window.localStorage.getItem(LEGACY_MASTERED_KEY);
    if (raw === null) return NO_MASTERED;
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return NO_MASTERED;
    return Object.freeze(
      parsed
        .filter((v): v is string => typeof v === "string")
        .map((id) => ({ id, at: "", conditions: null })),
    );
  } catch {
    return NO_MASTERED;
  }
}

const mastered = createLocalStore<readonly MasteryRecord[]>(MASTERED_KEY, NO_MASTERED, (raw) => {
  if (!Array.isArray(raw)) return NO_MASTERED;
  const records = raw.map(reviveRecord).filter((r): r is MasteryRecord => r !== null);
  return Object.freeze(records);
});

/**
 * Every record, v2 plus anything still only in v1.
 *
 * The merge happens on read rather than by rewriting v1 into v2, so the
 * migration is idempotent and a singer who opens an older tab later still finds
 * their v1 data intact. A song present in both keeps its v2 record, which is the
 * one that carries conditions.
 */
function allRecords(): readonly MasteryRecord[] {
  const current = mastered.get();
  const legacy = legacyRecords();
  if (legacy.length === 0) return current;
  const known = new Set(current.map((r) => r.id));
  const extra = legacy.filter((r) => !known.has(r.id));
  return extra.length === 0 ? current : Object.freeze([...current, ...extra]);
}

/**
 * Whether a record still satisfies today's mastery rule.
 *
 * A record with conditions is re-judged against the current constants, which is
 * the entire point of storing them. A record without them — migrated from v1 —
 * is honoured: it was earned under whatever rule was in force at the time, and
 * silently revoking someone's unlock because this app once failed to write down
 * the tempo is a cost to put on the app, not on the singer. `isVerified` is how
 * a caller tells the two apart without guessing.
 */
export function masteryHolds(record: MasteryRecord): boolean {
  if (record.conditions === null) return true;
  return (
    record.conditions.tempo >= MASTERY_MIN_TEMPO &&
    record.conditions.score >= MASTERY_SCORE
  );
}

/** Whether this mastery can be checked at all. False only for v1 records. */
export function isVerified(record: MasteryRecord): boolean {
  return record.conditions !== null;
}

/**
 * Records whose stored melody no longer matches the song as it is now.
 *
 * Returned rather than revoked. A transcription fix means the mastery was earned
 * on different content, which an auditor should see; whether it should also cost
 * the singer their unlock is a product decision, and this function is what makes
 * that decision possible to take later instead of impossible to take at all.
 */
export function staleMasteries(
  songs: readonly { id: string; notes: unknown[] }[],
  fingerprint: (song: never) => string,
): MasteryRecord[] {
  const byId = new Map(songs.map((song) => [song.id, song]));
  return allRecords().filter((record) => {
    const song = byId.get(record.id);
    if (!song || record.conditions === null) return false;
    return fingerprint(song as never) !== record.conditions.melody;
  });
}

export function getMasteredRecords(): readonly MasteryRecord[] {
  return allRecords();
}

let masteredSetCache: { records: readonly MasteryRecord[]; set: ReadonlySet<string> } | null = null;

/**
 * The ids that count as mastered today.
 *
 * Callers want a Set (the library asks "is this one mastered?" once per card)
 * but JSON cannot carry one, so the store keeps records and the Set is minted
 * from them and cached against the array's identity. Returning a fresh Set on
 * every read would re-render forever, as `get` warns above.
 */
function masteredSnapshot(): ReadonlySet<string> {
  const records = allRecords();
  if (masteredSetCache === null || masteredSetCache.records !== records) {
    masteredSetCache = { records, set: new Set(records.filter(masteryHolds).map((r) => r.id)) };
  }
  return masteredSetCache.set;
}

function masteredServerSnapshot(): ReadonlySet<string> {
  return EMPTY_MASTERED;
}

export function getMastered(): ReadonlySet<string> {
  return masteredSnapshot();
}

export function useMastered(): ReadonlySet<string> {
  return useSyncExternalStore(
    mastered.subscribe,
    masteredSnapshot,
    masteredServerSnapshot,
  );
}

/**
 * Record a song as mastered, with the conditions it was earned under.
 *
 * Re-mastering an already-recorded song replaces the record when the new run
 * clears today's rule, so a singer who masters a song again at written tempo
 * upgrades an unverified or now-failing record instead of being stuck with it.
 * Otherwise the write is skipped, which keeps a repeat pass from waking every
 * subscriber.
 */
export function recordMastered(id: string, conditions: MasteryConditions): void {
  const current = mastered.get();
  const existing = current.find((r) => r.id === id);
  const record: MasteryRecord = { id, at: new Date().toISOString(), conditions };
  if (existing && isVerified(existing) && masteryHolds(existing)) return;
  mastered.set(
    Object.freeze(existing ? current.map((r) => (r.id === id ? record : r)) : [...current, record]),
  );
}
