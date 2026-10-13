import { describe, expect, it } from "vitest";
import type { NoteTallies } from "./analytics";
import { DEFAULT_PROGRESS, MAX_SESSIONS, type ProgressState, type SessionLog } from "./progress-shape";
import { CLOUD_STATE_MAX_CHARS, CLOUD_STATE_TARGET_CHARS, fitForCloud } from "./progress-cloud-fit";

/** A routine step's tallies: about sixteen distinct notes, as the daily routine scores. */
function tallies(seed: number): NoteTallies {
  const out: NoteTallies = {};
  for (let k = 0; k < 16; k++) {
    out[String(45 + k)] = { sec: 1.84 + k / 10, hitSec: 1.31 + seed / 1000, cents: 12.7 + k, frames: 110 + k };
  }
  return out;
}

/** A full log, newest first as logSession writes it, one session per routine step. */
function bigState(): ProgressState {
  const start = Date.UTC(2026, 6, 1, 8);
  const sessions: SessionLog[] = Array.from({ length: MAX_SESSIONS }, (_, i) => {
    const date = new Date(start + (MAX_SESSIONS - 1 - i) * 3 * 3_600_000).toISOString();
    return {
      id: `session-${i}`,
      type: "warmup",
      date,
      day: date.slice(0, 10),
      durationSec: 95,
      score: 82,
      detail: "Lip trill five-note scale",
      xp: 12,
      notes: tallies(i),
    };
  });
  return { ...DEFAULT_PROGRESS, xp: 6000, sessions, achievements: ["first-session"] };
}

const size = (s: ProgressState) => JSON.stringify(s).length;

describe("fitForCloud", () => {
  it("leaves a record that already fits untouched", () => {
    const small = { ...bigState(), sessions: bigState().sessions.slice(0, 50) };
    expect(fitForCloud(small)).toBe(small);
  });

  it("brings a daily-routine singer's full log under the routes' ceiling", () => {
    const state = bigState();
    // The case the finding measured: past the ceiling, so every push was a 413.
    expect(size(state)).toBeGreaterThan(CLOUD_STATE_MAX_CHARS);
    const before = JSON.stringify(state);
    const fitted = fitForCloud(state);
    expect(size(fitted)).toBeLessThanOrEqual(CLOUD_STATE_TARGET_CHARS);
    // Only a copy is changed: this device keeps every tally.
    expect(JSON.stringify(state)).toBe(before);
    // Every session is still there, with its score and XP.
    expect(fitted.sessions.map((s) => s.id)).toEqual(state.sessions.map((s) => s.id));
    expect(fitted.sessions.every((s) => s.score === 82 && s.xp === 12)).toBe(true);
  });

  it("drops tallies oldest first, and no more of them than it has to", () => {
    const state = bigState();
    const fitted = fitForCloud(state);
    const kept = fitted.sessions.map((s) => s.notes !== undefined);
    // Newest first: a run of kept tallies, then a run of dropped ones.
    const firstDropped = kept.indexOf(false);
    expect(firstDropped).toBeGreaterThan(0);
    expect(kept.slice(0, firstDropped).every(Boolean)).toBe(true);
    expect(kept.slice(firstDropped).some(Boolean)).toBe(false);
    // Putting back the newest dropped one would go over the target again.
    const sessions = fitted.sessions.slice();
    sessions[firstDropped] = state.sessions[firstDropped];
    expect(size({ ...fitted, sessions })).toBeGreaterThan(CLOUD_STATE_TARGET_CHARS);
  });

  it("orders by each session's date, not by where it sits in the list", () => {
    const state = bigState();
    const shuffled = { ...state, sessions: [...state.sessions].reverse() };
    const fitted = fitForCloud(shuffled);
    const newest = fitted.sessions.find((s) => s.id === "session-0")!;
    const oldest = fitted.sessions.find((s) => s.id === `session-${MAX_SESSIONS - 1}`)!;
    expect(newest.notes).toBeDefined();
    expect(oldest.notes).toBeUndefined();
    expect(size(fitted)).toBeLessThanOrEqual(CLOUD_STATE_TARGET_CHARS);
  });
});
