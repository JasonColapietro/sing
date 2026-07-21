"use client";

import { useSyncExternalStore } from "react";
import { classifyVoice } from "./audio/notes";

export type ActivityType =
  | "warmup"
  | "pitch"
  | "range"
  | "ear"
  | "breath"
  | "song"
  | "recording"
  | "tools";

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
  range: VocalRange;
  /** Unlocked achievement ids. */
  achievements: string[];
}

export interface Achievement {
  id: string;
  title: string;
  desc: string;
  icon: string;
  check: (s: ProgressState) => boolean;
}

const KEY = "suede-sing:progress:v1";

const DEFAULT: ProgressState = {
  xp: 0,
  sessions: [],
  streak: { current: 0, best: 0, lastDay: null },
  range: {},
  achievements: [],
};

let cache: ProgressState | null = null;
const listeners = new Set<() => void>();
let storageBound = false;

function localDay(d = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function load(): ProgressState {
  if (cache) return cache;
  if (typeof window === "undefined") return DEFAULT;
  try {
    const raw = window.localStorage.getItem(KEY);
    cache = raw
      ? { ...DEFAULT, ...(JSON.parse(raw) as Partial<ProgressState>) }
      : { ...DEFAULT };
  } catch {
    cache = { ...DEFAULT };
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

export function levelForXp(xp: number): {
  level: number;
  title: string;
  intoLevel: number;
  toNext: number;
  /** 0..1 progress through the current level. */
  progress: number;
} {
  let level = 1;
  while (level < 60 && xp >= xpThreshold(level)) level++;
  const floor = level === 1 ? 0 : xpThreshold(level - 1);
  const ceil = xpThreshold(level);
  const intoLevel = xp - floor;
  const span = ceil - floor;
  return {
    level,
    title: LEVEL_TITLES[Math.min(level - 1, LEVEL_TITLES.length - 1)],
    intoLevel,
    toNext: ceil - xp,
    progress: Math.min(1, intoLevel / span),
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
  };

  const yesterday = localDay(new Date(now.getTime() - 24 * 3600 * 1000));
  let { current, best } = prev.streak;
  if (prev.streak.lastDay !== day) {
    current = prev.streak.lastDay === yesterday ? current + 1 : 1;
    best = Math.max(best, current);
  }

  const next: ProgressState = {
    ...prev,
    xp: prev.xp + xp,
    sessions: [session, ...prev.sessions].slice(0, 500),
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

/** Store the measured vocal range (from the range test). */
export function setVocalRange(lowMidi: number, highMidi: number): LogResult {
  const prev = load();
  const voice = classifyVoice(lowMidi, highMidi);
  const next: ProgressState = {
    ...prev,
    range: {
      lowMidi,
      highMidi,
      voiceType: voice.id,
      voiceTypeLabel: voice.label,
      testedAt: new Date().toISOString(),
    },
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
  save({ ...DEFAULT, sessions: [], achievements: [] });
}

/** Export progress as a JSON string (for backup / transfer). */
export function exportProgress(): string {
  return JSON.stringify(load(), null, 2);
}

/** Import progress from a JSON string. Returns false if it doesn't parse. */
export function importProgress(json: string): boolean {
  try {
    const parsed = JSON.parse(json) as Partial<ProgressState>;
    if (typeof parsed !== "object" || parsed === null) return false;
    save({ ...DEFAULT, ...parsed });
    return true;
  } catch {
    return false;
  }
}
