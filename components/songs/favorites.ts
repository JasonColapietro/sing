"use client";

import { useSyncExternalStore } from "react";

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
