"use client";

import { useSyncExternalStore } from "react";
import { classifyVoice } from "./audio/notes";
import type { NoteTallies } from "./analytics";
import {
  clampXp,
  DEFAULT_PROGRESS,
  MAX_RANGE_HISTORY,
  MAX_SESSIONS,
  looksLikeProgress,
  sanitizeProgress,
} from "./progress-shape";
import type {
  ActivityType,
  ProgressState,
  SessionLog,
  VocalRange,
  WarmupMode,
} from "./progress-shape";

// The shape and its validators live in ./progress-shape so a server route can
// import them without dragging this `"use client"` module along. Re-exported
// here because `@/lib/progress` is where the rest of the app has always asked
// for them.
export type { ActivityType, ProgressState, SessionLog, VocalRange, WarmupMode };
export { ACTIVITY_TYPES, isWarmupMode, WARMUP_MODES } from "./progress-shape";

export interface Achievement {
  id: string;
  title: string;
  desc: string;
  icon: string;
  check: (s: ProgressState) => boolean;
}

const KEY = "suede-sing:progress:v1";

const DEFAULT = DEFAULT_PROGRESS;

let cache: ProgressState | null = null;
const listeners = new Set<() => void>();
let storageBound = false;

/**
 * The local calendar day as YYYY-MM-DD. Local, not UTC: a session at 23:30
 * has to count for the day the singer thinks they practiced, and the streak
 * is built entirely out of comparisons against this.
 */
export function localDay(d = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/**
 * Backfills fields added after the store first shipped.
 *
 * Runs after sanitizeProgress, so it can trust the shape and only has to worry
 * about what is missing. Returns a new state rather than mutating the one it
 * was handed — nothing here should be able to surprise a caller that kept a
 * reference to the input.
 */
function migrate(state: ProgressState): ProgressState {
  // Range history used to be a single latest-only measurement. Seed it from
  // that so a singer who already tested doesn't start with an empty chart.
  const { lowMidi, highMidi } = state.range;
  if (
    state.rangeHistory.length === 0 &&
    lowMidi !== undefined &&
    highMidi !== undefined
  ) {
    return {
      ...state,
      rangeHistory: [
        {
          lowMidi,
          highMidi,
          voiceTypeLabel: state.range.voiceTypeLabel,
          testedAt: state.range.testedAt ?? new Date().toISOString(),
        },
      ],
    };
  }
  return state;
}

/**
 * Reads the stored record, repairing whatever it finds.
 *
 * localStorage is not a trusted input. It survives releases that rename fields,
 * a half-written write, another tab on an older build, and anyone who opens
 * devtools — and a syntactically valid record with the wrong shape underneath
 * used to sail straight through into consumers that assumed otherwise. One
 * session with an unrecognised `type` was enough to put /progress in its error
 * boundary, which loses the singer a page that was working a moment ago in
 * order to protect a row that was already junk.
 *
 * So every read goes through sanitizeProgress: keep what is still meaningful,
 * drop what isn't, and never hand a consumer a field that lies about its type.
 *
 * The repaired state is deliberately not written back. The bytes on disk are
 * the only copy the singer has, and a future migration may understand them
 * better than this one does; the next real save heals the record anyway.
 */
function load(): ProgressState {
  if (cache) return cache;
  if (typeof window === "undefined") return DEFAULT;
  try {
    const raw = window.localStorage.getItem(KEY);
    cache = migrate(sanitizeProgress(raw ? JSON.parse(raw) : null));
  } catch {
    cache = sanitizeProgress(null);
  }
  return cache;
}

function emit() {
  for (const l of listeners) l();
}

function save(next: ProgressState) {
  cache = next;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // storage full or unavailable — keep the in-memory state
  }
  emit();
}

export function getState(): ProgressState {
  return load();
}

export function subscribe(cb: () => void): () => void {
  if (!storageBound && typeof window !== "undefined") {
    storageBound = true;
    window.addEventListener("storage", (e) => {
      if (e.key === KEY) {
        cache = null;
        emit();
      }
    });
  }
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export function useProgress(): ProgressState {
  return useSyncExternalStore(subscribe, getState, () => DEFAULT);
}

export const LEVEL_TITLES = [
  "Shower Singer",
  "Humming Novice",
  "Melody Seeker",
  "Pitch Apprentice",
  "Tone Crafter",
  "Scale Runner",
  "Range Explorer",
  "Steady Voice",
  "Stage Ready",
  "Velvet Voice",
  "Studio Regular",
  "Vocal Athlete",
  "Resident Soloist",
  "Maestro",
  "Suede Legend",
];

/** Cumulative XP required to *reach* level n+1 (levels are 1-based). */
function xpThreshold(level: number): number {
  return 40 * level * (level + 1);
}

/** The last rung. XP past xpThreshold(MAX_LEVEL) buys nothing. */
const MAX_LEVEL = 60;

export function levelForXp(xp: number): {
  level: number;
  title: string;
  intoLevel: number;
  toNext: number;
  /** 0..1 progress through the current level. */
  progress: number;
} {
  // The store behind this has survived hand edits, imported backups and a
  // merge that sums another device's numbers, so the argument is untrusted
  // even though it is typed. clampXp is the store's own bound, applied here so
  // the card can never be handed a total the ladder has no rung for.
  const total = clampXp(xp);
  let level = 1;
  while (level < MAX_LEVEL && total >= xpThreshold(level)) level++;
  const floor = level === 1 ? 0 : xpThreshold(level - 1);
  const span = xpThreshold(level) - floor;
  // Below the cap this is just `total - floor`. At the cap there is no next
  // level to count down to, so XP beyond it fills the bar instead of driving
  // the remainder negative.
  const intoLevel = Math.min(total - floor, span);
  return {
    level,
    title: LEVEL_TITLES[Math.min(level - 1, LEVEL_TITLES.length - 1)],
    intoLevel,
    toNext: span - intoLevel,
    progress: intoLevel / span,
  };
}

function sumDaySec(s: ProgressState, day: string): number {
  return s.sessions
    .filter((x) => x.day === day)
    .reduce((a, x) => a + x.durationSec, 0);
}

export const ACHIEVEMENTS: Achievement[] = [
  {
    id: "first-note",
    title: "First note",
    desc: "Complete your first practice session.",
    icon: "🎤",
    check: (s) => s.sessions.length >= 1,
  },
  {
    id: "warmed-up",
    title: "Warmed up",
    desc: "Finish a guided warmup.",
    icon: "🔥",
    check: (s) => s.sessions.some((x) => x.type === "warmup"),
  },
  {
    id: "range-found",
    title: "Range found",
    desc: "Complete the vocal range test.",
    icon: "🗺️",
    check: (s) => s.range.lowMidi !== undefined,
  },
  {
    id: "two-octaves",
    title: "Two octaves",
    desc: "Measure a range of two octaves or more.",
    icon: "🌉",
    check: (s) =>
      s.range.lowMidi !== undefined &&
      s.range.highMidi !== undefined &&
      s.range.highMidi - s.range.lowMidi >= 24,
  },
  {
    id: "streak-3",
    title: "Three in a row",
    desc: "Practice three days in a row.",
    icon: "📆",
    check: (s) => s.streak.current >= 3,
  },
  {
    id: "streak-7",
    title: "Full week",
    desc: "Practice seven days in a row.",
    icon: "🗓️",
    check: (s) => s.streak.current >= 7,
  },
  {
    id: "streak-30",
    title: "The month",
    desc: "Practice thirty days in a row.",
    icon: "🏆",
    check: (s) => s.streak.current >= 30,
  },
  {
    id: "marathon",
    title: "Marathon",
    desc: "Practice 30 minutes in one day.",
    icon: "⏱️",
    check: (s) =>
      s.sessions.length > 0 && sumDaySec(s, s.sessions[0].day) >= 30 * 60,
  },
  {
    id: "xp-500",
    title: "Warmed engine",
    desc: "Earn 500 XP.",
    icon: "⚡",
    check: (s) => s.xp >= 500,
  },
  {
    id: "xp-2500",
    title: "Serious about this",
    desc: "Earn 2,500 XP.",
    icon: "💪",
    check: (s) => s.xp >= 2500,
  },
  {
    id: "ear-ace",
    title: "Golden ear",
    desc: "Score 100 on an ear training round.",
    icon: "👂",
    check: (s) => s.sessions.some((x) => x.type === "ear" && x.score === 100),
  },
  {
    id: "high-scorer",
    title: "In the pocket",
    desc: "Score 90 or higher on any exercise.",
    icon: "🎯",
    check: (s) => s.sessions.some((x) => (x.score ?? 0) >= 90),
  },
  {
    id: "all-rounder",
    title: "All-rounder",
    desc: "Try six different practice areas.",
    icon: "🎛️",
    check: (s) => new Set(s.sessions.map((x) => x.type)).size >= 6,
  },
  {
    id: "night-owl",
    title: "Night owl",
    desc: "Practice between midnight and 5 am.",
    icon: "🌙",
    check: (s) => {
      const h = s.sessions[0] ? new Date(s.sessions[0].date).getHours() : -1;
      return h >= 0 && h < 5;
    },
  },
  {
    id: "early-bird",
    title: "Early bird",
    desc: "Practice before 8 am.",
    icon: "🌅",
    check: (s) => {
      const h = s.sessions[0] ? new Date(s.sessions[0].date).getHours() : -1;
      return h >= 5 && h < 8;
    },
  },
  {
    id: "fifty-sessions",
    title: "Fifty sessions",
    desc: "Log fifty practice sessions.",
    icon: "📼",
    check: (s) => s.sessions.length >= 50,
  },
];

function unlockAchievements(next: ProgressState): Achievement[] {
  const fresh: Achievement[] = [];
  for (const a of ACHIEVEMENTS) {
    if (!next.achievements.includes(a.id) && a.check(next)) {
      next.achievements = [...next.achievements, a.id];
      next.xp += 30;
      fresh.push(a);
    }
  }
  return fresh;
}

export interface LogResult {
  xpGained: number;
  newAchievements: Achievement[];
  state: ProgressState;
}

/** Record a completed practice activity. Call once per finished exercise/session. */
export function logSession(input: {
  type: ActivityType;
  durationSec: number;
  score?: number;
  detail?: string;
  /** Per-note accuracy, when the exercise scored against target pitches. */
  notes?: NoteTallies;
  /** How a warmup was sung, for the activities that have modes. */
  mode?: WarmupMode;
}): LogResult {
  const prev = load();
  const now = new Date();
  const day = localDay(now);

  let xp = Math.max(4, Math.min(80, Math.round((input.durationSec / 60) * 10)));
  if (input.score !== undefined) {
    if (input.score >= 95) xp += 25;
    else if (input.score >= 85) xp += 15;
    else if (input.score >= 70) xp += 8;
  }

  const session: SessionLog = {
    id: `${now.getTime()}-${Math.floor(Math.random() * 1e6)}`,
    type: input.type,
    date: now.toISOString(),
    day,
    durationSec: Math.round(input.durationSec),
    score: input.score,
    detail: input.detail,
    xp,
    // Omit the key entirely when there's nothing to say, so old sessions and
    // target-less activities stay as small as they were.
    ...(input.notes && Object.keys(input.notes).length > 0
      ? { notes: input.notes }
      : {}),
    ...(input.mode ? { mode: input.mode } : {}),
  };

  /**
   * The calendar day before `now`, by the calendar rather than by 86,400,000ms.
   *
   * Subtracting a fixed day is wrong twice a year. On the morning the clocks
   * spring forward the previous day was 23 hours long, so between midnight and
   * 1 a.m. local this landed two days back: practise on 2026-03-08, practise
   * again at 00:30 on 2026-03-09, and `lastDay` matched neither `day` nor
   * `yesterday`, so a streak of any length silently reset to 1. Verified under
   * TZ=America/New_York.
   *
   * `setDate` walks the calendar and is what every other date helper in this
   * codebase already uses — `streakFromSessions` below, and `addDays` in
   * components/progress/format.ts. This was the one place still doing
   * arithmetic on the clock, which meant the merge path computed the streak
   * correctly while the write path threw it away.
   */
  const yesterdayDate = new Date(now);
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);
  const yesterday = localDay(yesterdayDate);
  let { current, best } = prev.streak;
  if (prev.streak.lastDay !== day) {
    current = prev.streak.lastDay === yesterday ? current + 1 : 1;
    best = Math.max(best, current);
  }

  const next: ProgressState = {
    ...prev,
    xp: prev.xp + xp,
    sessions: [session, ...prev.sessions].slice(0, MAX_SESSIONS),
    streak: { current, best, lastDay: day },
  };
  const newAchievements = unlockAchievements(next);
  save(next);
  return {
    xpGained: xp + newAchievements.length * 30,
    newAchievements,
    state: next,
  };
}

/**
 * Store a measured vocal range. Appends to the history as well as replacing
 * `range`, so retaking the test builds a record of the voice widening instead
 * of erasing the previous measurement.
 */
export function setVocalRange(lowMidi: number, highMidi: number): LogResult {
  const prev = load();
  const voice = classifyVoice(lowMidi, highMidi);
  const testedAt = new Date().toISOString();
  const next: ProgressState = {
    ...prev,
    range: {
      lowMidi,
      highMidi,
      voiceType: voice.id,
      voiceTypeLabel: voice.label,
      testedAt,
    },
    rangeHistory: [
      ...prev.rangeHistory,
      { lowMidi, highMidi, voiceTypeLabel: voice.label, testedAt },
    ].slice(-MAX_RANGE_HISTORY),
  };
  const newAchievements = unlockAchievements(next);
  save(next);
  return { xpGained: newAchievements.length * 30, newAchievements, state: next };
}

export function todayPracticeSec(s: ProgressState = load()): number {
  return sumDaySec(s, localDay());
}

/** Wipe all progress. Ask the user to confirm before calling. */
export function clearProgress(): void {
  // A fresh state rather than a spread of DEFAULT: the spread would share
  // DEFAULT's nested streak/range objects with the live store, and DEFAULT is
  // now a const other modules hold too.
  save(sanitizeProgress(null));
}

/** Export progress as a JSON string (for backup / transfer). */
export function exportProgress(): string {
  return JSON.stringify(load(), null, 2);
}

/**
 * Import progress from a JSON string. Returns false if the file isn't one of
 * ours, which is the caller's cue to say so and change nothing.
 *
 * Repaired on the way in for the same reason a stored record is: a backup file
 * is a stored record that took a detour through a filesystem, and it can be
 * just as stale or just as hand-edited. What repair must not do is run on a
 * file that was never a practice record. sanitizeProgress accepts any object
 * and returns an empty state for one it cannot read, so importing a
 * package.json — or anything else in the file picker — used to overwrite a
 * singer's whole record with zeros and report "Progress imported". An import
 * that silently erases is worse than one that refuses, and the erase control
 * on this same page makes you type the word "erase" for that outcome.
 *
 * looksLikeProgress is the identity check, and it stops at identity on
 * purpose: a real first-release export carries no `rangeHistory` key at all,
 * so anything stricter would reject the very backups this feature exists to
 * restore.
 *
 * migrate() runs here as well as in load(), so an old export shows its
 * backfilled range chart immediately rather than only after the next reload.
 */
export function importProgress(json: string): boolean {
  try {
    const parsed: unknown = JSON.parse(json);
    if (!looksLikeProgress(parsed)) return false;
    save(migrate(sanitizeProgress(parsed)));
    return true;
  } catch {
    return false;
  }
}

/* ------------------------------------------------------------------ merge */

/** Consecutive practice days ending at the newest session day. */
function streakFromSessions(sessions: SessionLog[]): number {
  const days = new Set(sessions.map((s) => s.day));
  if (days.size === 0) return 0;
  const latest = [...days].sort().pop()!;
  let current = 0;
  const cursor = new Date(`${latest}T00:00:00`);
  while (days.has(localDay(cursor))) {
    current += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return current;
}

/**
 * Two-way merge of a remote ProgressState into the local one, for cloud
 * sync. Every rule is a union, max, or latest-wins, which makes the merge
 * commutative and idempotent — the properties an eventually-consistent
 * two-device sync actually needs. Nothing a device recorded is ever lost,
 * beyond what the store's own caps (500 sessions, 60 range tests) already
 * discard.
 */
export function mergeRemoteProgress(remoteRaw: unknown): ProgressState {
  const local = load();
  if (typeof remoteRaw !== "object" || remoteRaw === null) return local;
  // The other device is no more trustworthy than our own localStorage — it may
  // be a tab on an older build, and whatever it sends lands in the state this
  // page renders. Repair it on arrival, same as a local read. sanitizeProgress
  // is idempotent, so two healthy devices merge exactly as they did before.
  const remote = sanitizeProgress(remoteRaw);

  // Sessions: union by id. Same id means the same session (ids are minted
  // once at log time); on collision prefer whichever copy carries notes.
  const byId = new Map<string, SessionLog>();
  for (const s of remote.sessions) {
    byId.set(s.id, s);
  }
  for (const s of local.sessions) {
    const other = byId.get(s.id);
    byId.set(s.id, other?.notes && !s.notes ? other : s);
  }
  const sessions = [...byId.values()]
    .sort((a, b) => Date.parse(b.date) - Date.parse(a.date))
    .slice(0, MAX_SESSIONS);

  const achievements = [
    ...new Set([...local.achievements, ...remote.achievements]),
  ];

  // Range history: testedAt is minted per test, so it works as an id.
  const historyByTest = new Map(
    [...remote.rangeHistory, ...local.rangeHistory].map(
      (e) => [e.testedAt, e] as const,
    ),
  );
  const rangeHistory = [...historyByTest.values()]
    .sort((a, b) => Date.parse(a.testedAt) - Date.parse(b.testedAt))
    .slice(-MAX_RANGE_HISTORY);

  // Latest measurement wins wholesale, keeping voiceType consistent with it.
  const localTested = Date.parse(local.range.testedAt ?? "");
  const remoteTested = Date.parse(remote.range.testedAt ?? "");
  const range =
    Number.isNaN(remoteTested) || remoteTested <= (localTested || 0)
      ? local.range
      : { ...remote.range };

  // XP: recomputing from the merged work credits both devices exactly; the
  // max() floor guarantees no device ever watches its number go down.
  const recomputedXp =
    sessions.reduce((a, s) => a + s.xp, 0) + 30 * achievements.length;
  // Clamped because this total is saved straight to the store: the sum of 500
  // sessions' xp fields skips sanitizeProgress on the way in, and a backup can
  // put any finite number in every one of them.
  const xp = clampXp(Math.max(local.xp, remote.xp, recomputedXp));

  const remoteStreak = remote.streak;
  const lastDay =
    [local.streak.lastDay, remoteStreak.lastDay]
      .filter((d): d is string => typeof d === "string")
      .sort()
      .pop() ?? null;
  const current = Math.max(
    streakFromSessions(sessions),
    lastDay === local.streak.lastDay ? local.streak.current : 0,
    lastDay === remoteStreak.lastDay ? remoteStreak.current : 0,
  );
  const best = Math.max(local.streak.best, remoteStreak.best, current);

  const next: ProgressState = {
    xp,
    sessions,
    streak: { current, best, lastDay },
    range,
    rangeHistory,
    achievements,
  };
  save(next);
  return next;
}

/** Monday-based calendar weeks, using the same local day keys as the streak. */
export function weeklyReport(sessions: readonly SessionLog[], now = new Date()) {
  const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  monday.setDate(monday.getDate() - (monday.getDay() + 6) % 7);
  const previous = new Date(monday);
  previous.setDate(previous.getDate() - 7);
  const start = localDay(monday), lastStart = localDay(previous), today = localDay(now);
  const thisWeek = { stars: 0, sessions: 0, durationSec: 0 };
  const lastWeek = { stars: 0, sessions: 0, durationSec: 0 };
  for (const session of sessions) {
    if (session.day < lastStart || session.day > today) continue;
    const period = session.day >= start ? thisWeek : lastWeek;
    period.sessions++;
    period.durationSec += session.durationSec;
    const score = session.score;
    period.stars += score === undefined ? 0 : score >= 90 ? 3 : score >= 75 ? 2 : score >= 50 ? 1 : 0;
  }
  return { thisWeek, lastWeek, start, lastStart };
}
