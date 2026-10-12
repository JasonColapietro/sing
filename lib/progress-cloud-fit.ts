import type { ProgressState } from "./progress-shape";

/**
 * The largest progress record /api/sync and /api/account/progress accept, in
 * characters of its JSON (both routes refuse a larger one with a 413).
 */
export const CLOUD_STATE_MAX_CHARS = 400_000;

/** What a push aims under, leaving room below the routes' ceiling. */
export const CLOUD_STATE_TARGET_CHARS = 380_000;

/**
 * The record as it can be sent to the cloud: the same record, or a copy whose
 * oldest sessions have dropped their per-note tallies until it fits.
 *
 * Every warmup session carries a tally per note it scored, and nothing prunes
 * them, so a singer who runs the daily routine every day passes the routes'
 * ceiling within about two months of a full 500-session log. Every automatic
 * push then failed with a 413 that nothing showed, and the cloud copy stopped
 * moving. Tallies are what can go: the session itself, its score and its XP
 * stay, and the newest sessions keep theirs, which are what the per-note
 * charts read first. This device keeps every tally (the copy is only what is
 * sent), and mergeRemoteProgress prefers the copy that carries notes when the
 * same session meets itself, so a pull never strips them here either.
 *
 * One pass: each session's share of the JSON is measured once rather than
 * re-serialising the whole record after every removal. A record still over
 * the target with every tally gone is returned as it then stands; the route
 * refuses it and the caller reports the refusal.
 */
export function fitForCloud(state: ProgressState, target = CLOUD_STATE_TARGET_CHARS): ProgressState {
  let size = JSON.stringify(state).length;
  if (size <= target) return state;
  // Oldest first, by the session's own timestamp rather than the array order.
  const order = state.sessions
    .map((s, i) => ({ i, t: Date.parse(s.date) }))
    .sort((a, b) => (Number.isFinite(a.t) ? a.t : -Infinity) - (Number.isFinite(b.t) ? b.t : -Infinity));
  const sessions = state.sessions.slice();
  for (const { i } of order) {
    if (size <= target) break;
    const s = sessions[i];
    if (s.notes === undefined) continue;
    // `"notes":{…}` plus the comma that separated it from a neighbouring key.
    size -= JSON.stringify(s.notes).length + ',"notes":'.length;
    const copy = { ...s };
    delete copy.notes;
    sessions[i] = copy;
  }
  return { ...state, sessions };
}
