/**
 * The shape of a stored practice record, and the two things you can do with a
 * candidate one: check it, or repair it.
 *
 * This lives apart from lib/progress.ts because that module is `"use client"`
 * and owns the live store — the React binding, the cache, the writes. Shape
 * knowledge has to be reachable from places that have no store at all: a route
 * handler validating an uploaded backup, a test, a migration. Nothing here
 * touches storage, React, or the network.
 *
 * The two entry points answer deliberately different questions, because their
 * callers face deliberately different situations:
 *
 *   isValidProgress()  — "should I accept this?" A server taking a payload can
 *                        say no and let the client try again. Reject wholesale;
 *                        never silently reshape data before storing it.
 *   sanitizeProgress() — "what can I still use?" A browser reading its own
 *                        localStorage has nobody to appeal to. The bytes are
 *                        the only copy the singer has, so keep everything that
 *                        is still meaningful and drop only what isn't.
 *
 * They share every predicate below, so the two answers can never drift into
 * disagreeing about what a session or a range test looks like.
 */

import type { NoteTallies, RangeEntry } from "./analytics";

/**
 * Every activity that can be logged. This is the runtime list as well as the
 * source of the `ActivityType` union, so a validator and a `Record<ActivityType,
 * …>` lookup table can never disagree about which types exist — the disagreement
 * that crashed /progress in the first place.
 */
export const ACTIVITY_TYPES = [
  "warmup",
  "pitch",
  "range",
  "ear",
  "breath",
  "song",
  "recording",
  "tools",
  "analyze",
] as const;

export type ActivityType = (typeof ACTIVITY_TYPES)[number];

const ACTIVITY_TYPE_SET: ReadonlySet<string> = new Set(ACTIVITY_TYPES);

export interface SessionLog {
  id: string;
  type: ActivityType;
  /** ISO timestamp. */
  date: string;
  /** Local calendar day, YYYY-MM-DD. */
  day: string;
  durationSec: number;
  /** 0..100 where the activity produces a score. */
  score?: number;
  /** Short human-readable note, e.g. exercise name or song title. */
  detail?: string;
  xp: number;
  /**
   * Per-note accuracy for exercises that score against target pitches,
   * folded to one tally per MIDI note. Absent for activities with no target
   * (free singing, the metronome) and for sessions logged before Pro
   * analytics existed.
   */
  notes?: NoteTallies;
}

export interface VocalRange {
  lowMidi?: number;
  highMidi?: number;
  voiceType?: string;
  voiceTypeLabel?: string;
  testedAt?: string;
}

export interface ProgressState {
  xp: number;
  sessions: SessionLog[];
  streak: { current: number; best: number; lastDay: string | null };
  /** The most recent range test. */
  range: VocalRange;
  /** Every range test, oldest first — `range` is just the last of these. */
  rangeHistory: RangeEntry[];
  /** Unlocked achievement ids. */
  achievements: string[];
}

/** The six fields a ProgressState has, and nothing else. */
export const DEFAULT_PROGRESS: ProgressState = {
  xp: 0,
  sessions: [],
  streak: { current: 0, best: 0, lastDay: null },
  range: {},
  rangeHistory: [],
  achievements: [],
};

export const MAX_SESSIONS = 500;
export const MAX_RANGE_HISTORY = 60;
export const MAX_ACHIEVEMENTS = 200;
/**
 * A ceiling on lifetime XP.
 *
 * The ladder tops out at 146,400 and one session awards at most about a
 * hundred, so this is decades of daily practice: far past anything a singer
 * can earn, and far short of what a hand-edited record or an imported backup
 * can carry. It has to exist because the level card counts down from a fixed
 * ceiling, and an XP total with no upper bound runs that countdown backwards
 * through the trillions.
 */
export const MAX_XP = 10_000_000;
/** One tally per MIDI note, and MIDI only has 128 of them. */
export const MAX_NOTE_KEYS = 128;
export const MAX_STRING = 400;

const DAY_RE = /^\d{4}-\d{2}-\d{2}$/;

/* ------------------------------------------------------------- predicates */

export function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * A string standing in for an identity — an id, a timestamp, a day key. Empty
 * is refused because nothing downstream can index, sort or dedupe by "".
 */
export function isCleanString(value: unknown, max = MAX_STRING): value is string {
  return typeof value === "string" && value.length > 0 && value.length <= max;
}

/**
 * A string that is only ever shown to the singer — an exercise name, a voice
 * type label. Empty is legitimate here (an untitled recorder take produces one),
 * so only the length ceiling applies.
 */
export function isBoundedString(value: unknown, max = MAX_STRING): value is string {
  return typeof value === "string" && value.length <= max;
}

export function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function optional(value: unknown, ok: (v: unknown) => boolean): boolean {
  return value === undefined || ok(value);
}

export function isActivityType(value: unknown): value is ActivityType {
  return typeof value === "string" && ACTIVITY_TYPE_SET.has(value);
}

/** A local calendar day key, YYYY-MM-DD — what the streak and calendar index by. */
export function isDayKey(value: unknown): value is string {
  return typeof value === "string" && DAY_RE.test(value);
}

/**
 * A tally is a small bag of numbers (NoteTally in lib/analytics.ts). A null
 * leaf is allowed because `cents` is genuinely null whenever a note had no
 * voiced frames to measure, and refusing that would reject real practice.
 */
export function isValidNotes(value: unknown): value is NoteTallies {
  if (!isPlainObject(value)) return false;
  const entries = Object.entries(value);
  if (entries.length > MAX_NOTE_KEYS) return false;
  for (const [, tally] of entries) {
    if (!isPlainObject(tally)) return false;
    const leaves = Object.values(tally);
    if (leaves.length > 16) return false;
    if (leaves.some((n) => n !== null && !isFiniteNumber(n))) return false;
  }
  return true;
}

export function isValidSession(value: unknown): value is SessionLog {
  if (!isPlainObject(value)) return false;
  return (
    isCleanString(value.id, 128) &&
    isActivityType(value.type) &&
    isCleanString(value.date, 64) &&
    isDayKey(value.day) &&
    isFiniteNumber(value.durationSec) &&
    isFiniteNumber(value.xp) &&
    optional(value.score, isFiniteNumber) &&
    optional(value.detail, (v) => isBoundedString(v)) &&
    optional(value.notes, isValidNotes)
  );
}

export function isValidRange(value: unknown): value is VocalRange {
  if (!isPlainObject(value)) return false;
  return (
    optional(value.lowMidi, isFiniteNumber) &&
    optional(value.highMidi, isFiniteNumber) &&
    optional(value.voiceType, (v) => isBoundedString(v, 64)) &&
    optional(value.voiceTypeLabel, (v) => isBoundedString(v, 64)) &&
    optional(value.testedAt, (v) => isCleanString(v, 64))
  );
}

export function isValidRangeEntry(value: unknown): value is RangeEntry {
  if (!isPlainObject(value)) return false;
  return (
    isFiniteNumber(value.lowMidi) &&
    isFiniteNumber(value.highMidi) &&
    isCleanString(value.testedAt, 64) &&
    optional(value.voiceTypeLabel, (v) => isBoundedString(v, 64))
  );
}

export function isValidStreak(value: unknown): value is ProgressState["streak"] {
  if (!isPlainObject(value)) return false;
  return (
    isFiniteNumber(value.current) &&
    isFiniteNumber(value.best) &&
    (value.lastDay === null || isCleanString(value.lastDay, 32))
  );
}

export function isValidAchievementId(value: unknown): value is string {
  return isCleanString(value, 64);
}

/* ------------------------------------------------------------------ repair */

/**
 * Salvages one session, or gives up on it.
 *
 * `type` and `day` are the two fields nothing downstream can work around.
 * `type` indexes TYPE_META for the row's label and colour; an unrecognised one
 * reads back as `undefined` and takes the whole page with it. `day` is the key
 * the streak, the calendar and the minutes chart all group by. Neither can be
 * guessed from the rest of the record, so a session missing either is dropped.
 *
 * `id` is likewise required rather than minted: the sync merge treats the id as
 * the identity of a session, and inventing one would let the same practice
 * reappear as a duplicate on the next merge — worse than losing a row that was
 * already corrupt.
 *
 * Everything else is repaired in place. A bad number becomes 0 rather than
 * poisoning every total it feeds into as NaN, and a missing timestamp is filled
 * from the day at local noon: real enough to sort by, and far enough from the
 * edges that it cannot forge the "night owl" or "early bird" achievements.
 */
function repairSession(value: unknown): SessionLog | null {
  if (!isPlainObject(value)) return null;
  if (!isCleanString(value.id, 128)) return null;
  if (!isActivityType(value.type)) return null;
  if (!isDayKey(value.day)) return null;

  const session: SessionLog = {
    id: value.id,
    type: value.type,
    date: isCleanString(value.date, 64) && !Number.isNaN(Date.parse(value.date))
      ? value.date
      : `${value.day}T12:00:00`,
    day: value.day,
    durationSec: isFiniteNumber(value.durationSec)
      ? Math.max(0, Math.round(value.durationSec))
      : 0,
    xp: isFiniteNumber(value.xp) ? Math.max(0, Math.round(value.xp)) : 0,
  };
  if (isFiniteNumber(value.score)) session.score = value.score;
  if (isBoundedString(value.detail)) session.detail = value.detail;
  if (isValidNotes(value.notes)) session.notes = value.notes;
  return session;
}

/** Keeps only the fields VocalRange actually declares, and only if well-typed. */
function repairRange(value: unknown): VocalRange {
  if (!isPlainObject(value)) return {};
  const range: VocalRange = {};
  if (isFiniteNumber(value.lowMidi)) range.lowMidi = value.lowMidi;
  if (isFiniteNumber(value.highMidi)) range.highMidi = value.highMidi;
  if (isBoundedString(value.voiceType, 64)) range.voiceType = value.voiceType;
  if (isBoundedString(value.voiceTypeLabel, 64)) {
    range.voiceTypeLabel = value.voiceTypeLabel;
  }
  if (isCleanString(value.testedAt, 64)) range.testedAt = value.testedAt;
  return range;
}

/**
 * Lifetime XP, held inside what the ladder and the level card can render.
 *
 * Exported because levelForXp bounds its own argument the same way, and the
 * store and the card disagreeing about how much XP a record may claim is
 * exactly how a negative countdown got on screen.
 */
export function clampXp(value: unknown): number {
  if (!isFiniteNumber(value)) return 0;
  return Math.min(MAX_XP, Math.max(0, Math.round(value)));
}

function repairStreak(value: unknown): ProgressState["streak"] {
  if (!isPlainObject(value)) return { ...DEFAULT_PROGRESS.streak };
  const current = isFiniteNumber(value.current)
    ? Math.max(0, Math.round(value.current))
    : 0;
  const best = isFiniteNumber(value.best) ? Math.max(0, Math.round(value.best)) : 0;
  return {
    current,
    // A best that trails the current run is arithmetic that cannot be true.
    best: Math.max(best, current),
    lastDay: isDayKey(value.lastDay) ? value.lastDay : null,
  };
}

/**
 * Turns anything at all into a ProgressState the app can render.
 *
 * Always returns exactly the six declared fields — unknown keys from an older
 * or hand-edited record are dropped rather than carried along, so a consumer
 * can trust that what it holds is what the type says it is.
 *
 * Idempotent: sanitizing an already-clean state returns an equal state, which
 * is what lets the sync merge run its input through this without changing the
 * meaning of a merge between two healthy devices.
 */
export function sanitizeProgress(value: unknown): ProgressState {
  if (!isPlainObject(value)) return { ...DEFAULT_PROGRESS, streak: { ...DEFAULT_PROGRESS.streak } };

  const sessions: SessionLog[] = [];
  if (Array.isArray(value.sessions)) {
    for (const raw of value.sessions) {
      const session = repairSession(raw);
      if (session) sessions.push(session);
      if (sessions.length >= MAX_SESSIONS) break;
    }
  }

  const rangeHistory = Array.isArray(value.rangeHistory)
    ? (value.rangeHistory.filter(isValidRangeEntry) as RangeEntry[]).slice(
        -MAX_RANGE_HISTORY,
      )
    : [];

  const achievements = Array.isArray(value.achievements)
    ? [...new Set(value.achievements.filter(isValidAchievementId))].slice(
        0,
        MAX_ACHIEVEMENTS,
      )
    : [];

  return {
    xp: clampXp(value.xp),
    sessions,
    streak: repairStreak(value.streak),
    range: repairRange(value.range),
    rangeHistory,
    achievements,
  };
}

/* ------------------------------------------------------------- acceptance */

export interface ProgressRejection {
  /** Human-readable and safe to hand back to the client. */
  reason: string;
  /**
   * True when the payload is shaped correctly but holds more than the store
   * can. Callers that speak HTTP turn this into 413 rather than 400 — the
   * client's mistake is quantity, not grammar.
   */
  overCap: boolean;
}

function malformed(reason: string): ProgressRejection {
  return { reason, overCap: false };
}

function tooMuch(reason: string): ProgressRejection {
  return { reason, overCap: true };
}

/**
 * Why a payload is not an acceptable ProgressState, or null if it is.
 *
 * For callers that must refuse rather than repair — an API boundary storing a
 * client's backup, where quietly reshaping the singer's record would hand back
 * a merge they never agreed to. Over-cap payloads are refused rather than
 * trimmed, for the same reason.
 *
 * Deliberately knows nothing about HTTP: it reports what is wrong and how, and
 * leaves status codes to whoever is speaking a protocol.
 */
export function checkProgress(value: unknown): ProgressRejection | null {
  if (!isPlainObject(value)) {
    return malformed("Progress payload must be an object.");
  }
  if (!isFiniteNumber(value.xp)) {
    return malformed("Progress payload is missing xp.");
  }
  if (!Array.isArray(value.sessions)) {
    return malformed("Progress payload is missing sessions.");
  }
  if (value.sessions.length > MAX_SESSIONS) {
    return tooMuch("Too many sessions to back up.");
  }
  if (!value.sessions.every(isValidSession)) {
    return malformed("A session in the payload is malformed.");
  }
  if (!isValidStreak(value.streak)) {
    return malformed("Progress payload has a malformed streak.");
  }
  if (!isValidRange(value.range)) {
    return malformed("Progress payload has a malformed range.");
  }
  if (!Array.isArray(value.rangeHistory)) {
    return malformed("Progress payload is missing rangeHistory.");
  }
  if (value.rangeHistory.length > MAX_RANGE_HISTORY) {
    return tooMuch("Too many range tests to back up.");
  }
  if (!value.rangeHistory.every(isValidRangeEntry)) {
    return malformed("A range test in the payload is malformed.");
  }
  if (!Array.isArray(value.achievements)) {
    return malformed("Progress payload is missing achievements.");
  }
  if (value.achievements.length > MAX_ACHIEVEMENTS) {
    return tooMuch("Too many achievements to back up.");
  }
  if (!value.achievements.every(isValidAchievementId)) {
    return malformed("An achievement id in the payload is malformed.");
  }
  return null;
}
