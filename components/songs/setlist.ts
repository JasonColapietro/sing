"use client";

import { useSyncExternalStore } from "react";
import { createLocalStore } from "./favorites";

/**
 * The setlist: songs queued to be sung back to back, karaoke-night style.
 *
 * It persists because the queue is the plan for the evening — a reload, a
 * closed tab, or a mid-song bail should not cost the singer their running
 * order. `cursor` persists for the same reason: it is where in the list the
 * night currently is, not transient UI state.
 */

const KEY = "suede-sing:setlist:v1";

/** More than anyone sings in a sitting; a cap keeps a stuck loop from growing forever. */
const MAX_QUEUE = 25;

export interface SetlistState {
  /** Song ids in singing order. */
  ids: readonly string[];
  /** Index being sung right now; -1 when the setlist isn't running. */
  cursor: number;
}

const NO_IDS: readonly string[] = Object.freeze([]);
const EMPTY: SetlistState = Object.freeze({ ids: NO_IDS, cursor: -1 });

const store = createLocalStore<SetlistState>(KEY, EMPTY, (raw) => {
  if (typeof raw !== "object" || raw === null) return EMPTY;
  const value = raw as Partial<SetlistState>;
  const ids = Object.freeze(
    Array.isArray(value.ids)
      ? value.ids.filter((v): v is string => typeof v === "string").slice(0, MAX_QUEUE)
      : [],
  );
  // A cursor past the end of a truncated or hand-edited list would silently
  // start the night on nothing; clamp it back to "not running".
  const cursor =
    typeof value.cursor === "number" && value.cursor >= 0 && value.cursor < ids.length
      ? value.cursor
      : -1;
  return Object.freeze({ ids, cursor });
});

export function getSetlist(): SetlistState {
  return store.get();
}

export function useSetlist(): SetlistState {
  return useSyncExternalStore(store.subscribe, store.get, store.serverSnapshot);
}

export function isQueued(state: SetlistState, id: string): boolean {
  return state.ids.includes(id);
}

/** Queue a song at the end. A second call for the same song is a no-op. */
export function addToSetlist(id: string): void {
  const s = store.get();
  if (s.ids.includes(id) || s.ids.length >= MAX_QUEUE) return;
  store.set(Object.freeze({ ids: Object.freeze([...s.ids, id]), cursor: s.cursor }));
}

export function removeFromSetlist(id: string): void {
  const s = store.get();
  const i = s.ids.indexOf(id);
  if (i < 0) return;
  const ids = Object.freeze(s.ids.filter((x) => x !== id));
  // Pulling an earlier song out shifts everything down, so the cursor has to
  // follow. Pulling the current song out lets the next one slide into its
  // place, which is what a singer skipping a track expects.
  let cursor = s.cursor;
  if (cursor >= 0) {
    if (i < cursor) cursor -= 1;
    if (cursor >= ids.length) cursor = -1;
  }
  store.set(Object.freeze({ ids, cursor }));
}

/** Move a song one slot earlier (-1) or later (+1). Edges are no-ops. */
export function moveInSetlist(id: string, delta: -1 | 1): void {
  const s = store.get();
  const i = s.ids.indexOf(id);
  const j = i + delta;
  if (i < 0 || j < 0 || j >= s.ids.length) return;
  // The cursor stores a position, but the singer cares about the song sitting
  // there — resolve it first, then find it again after the swap.
  const singing = s.cursor >= 0 ? s.ids[s.cursor] : null;
  const ids = [...s.ids];
  [ids[i], ids[j]] = [ids[j], ids[i]];
  store.set(
    Object.freeze({
      ids: Object.freeze(ids),
      cursor: singing === null ? -1 : ids.indexOf(singing),
    }),
  );
}

export function clearSetlist(): void {
  store.set(EMPTY);
}

/** Start the night at the top. Returns the first song id, or null if empty. */
export function beginSetlist(): string | null {
  const s = store.get();
  if (s.ids.length === 0) return null;
  store.set(Object.freeze({ ids: s.ids, cursor: 0 }));
  return s.ids[0];
}

/**
 * Step to the next queued song. Returns its id, or null at the end of the
 * list (and when nothing is running), having stopped the setlist so the next
 * "Start setlist" begins from the top again.
 */
export function advanceSetlist(): string | null {
  const s = store.get();
  if (s.cursor < 0) return null;
  const next = s.cursor + 1;
  if (next >= s.ids.length) {
    store.set(Object.freeze({ ids: s.ids, cursor: -1 }));
    return null;
  }
  store.set(Object.freeze({ ids: s.ids, cursor: next }));
  return s.ids[next];
}

/** Stop the setlist without clearing it — the singer left mid-night. */
export function endSetlist(): void {
  const s = store.get();
  if (s.cursor < 0) return;
  store.set(Object.freeze({ ids: s.ids, cursor: -1 }));
}
