import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { rateLimit } from "@/lib/rate-limit";
import { getRedis } from "@/lib/redis";
import type { ProgressState } from "@/lib/progress";

/**
 * A free account's backup of its practice record.
 *
 * Deliberately separate from /api/sync, which is the Pro feature: that route
 * is authenticated by a Pro key, keyed by subscription, and does continuous
 * two-way sync. This one is authenticated by a Clerk session, keyed by user,
 * and only holds the last snapshot a browser pushed. Different namespace,
 * different auth, different code path — so nothing here can regress a live
 * subscription flow.
 *
 * GET returns the snapshot or nulls. PUT replaces it. The client owns merging
 * (mergeRemoteProgress in lib/progress.ts is commutative and idempotent), so
 * this route never interprets the payload beyond validating it.
 *
 * Signing in is an offer, never a requirement: the whole app works signed out
 * and simply has no backup. That is the only thing an account buys here.
 */

/** Namespaced away from `sync:*` so the two stores can never collide. */
const KEY_PREFIX = "account:progress:";

/**
 * Ceiling on a serialized snapshot. A maxed-out store is 500 sessions plus 60
 * range tests; this leaves generous headroom above that and still refuses a
 * payload that could only come from a client trying to use Redis as storage.
 */
const MAX_STATE_BYTES = 400_000;

const MAX_SESSIONS = 500;
const MAX_RANGE_HISTORY = 60;
const MAX_ACHIEVEMENTS = 200;
/** One tally per MIDI note, and MIDI only has 128 of them. */
const MAX_NOTE_KEYS = 128;
const MAX_STRING = 400;

interface StoredBackup {
  state: ProgressState;
  /** Client clock when the snapshot was taken; display only. */
  updatedAt: string | null;
  /** Server clock when it was stored. */
  savedAt: string;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isCleanString(value: unknown, max = MAX_STRING): value is string {
  return typeof value === "string" && value.length <= max;
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function optional(value: unknown, ok: (v: unknown) => boolean): boolean {
  return value === undefined || ok(value);
}

function validSession(value: unknown): boolean {
  if (!isPlainObject(value)) return false;
  if (!isCleanString(value.id, 128)) return false;
  if (!isCleanString(value.type, 32)) return false;
  if (!isCleanString(value.date, 64)) return false;
  if (!isCleanString(value.day, 32)) return false;
  if (!isFiniteNumber(value.durationSec)) return false;
  if (!isFiniteNumber(value.xp)) return false;
  if (!optional(value.score, isFiniteNumber)) return false;
  if (!optional(value.detail, (v) => isCleanString(v))) return false;
  if (value.notes !== undefined) {
    if (!isPlainObject(value.notes)) return false;
    const entries = Object.entries(value.notes);
    if (entries.length > MAX_NOTE_KEYS) return false;
    // A tally is a small bag of numbers (NoteTally in lib/analytics.ts). A null
    // leaf is allowed because `cents` is genuinely null whenever a note had no
    // voiced frames to measure, and refusing that would reject real practice.
    for (const [, tally] of entries) {
      if (isFiniteNumber(tally)) continue;
      if (!isPlainObject(tally)) return false;
      const leaves = Object.values(tally);
      if (leaves.length > 16) return false;
      if (leaves.some((n) => n !== null && !isFiniteNumber(n))) return false;
    }
  }
  return true;
}

function validRange(value: unknown): boolean {
  if (!isPlainObject(value)) return false;
  return (
    optional(value.lowMidi, isFiniteNumber) &&
    optional(value.highMidi, isFiniteNumber) &&
    optional(value.voiceType, (v) => isCleanString(v, 64)) &&
    optional(value.voiceTypeLabel, (v) => isCleanString(v, 64)) &&
    optional(value.testedAt, (v) => isCleanString(v, 64))
  );
}

function validRangeEntry(value: unknown): boolean {
  if (!isPlainObject(value)) return false;
  return (
    isFiniteNumber(value.lowMidi) &&
    isFiniteNumber(value.highMidi) &&
    isCleanString(value.testedAt, 64) &&
    optional(value.voiceTypeLabel, (v) => isCleanString(v, 64))
  );
}

function validStreak(value: unknown): boolean {
  if (!isPlainObject(value)) return false;
  return (
    isFiniteNumber(value.current) &&
    isFiniteNumber(value.best) &&
    (value.lastDay === null || isCleanString(value.lastDay, 32))
  );
}

type Rejection = { error: string; status: number };

/**
 * Checks a payload really is a ProgressState before it reaches Redis.
 *
 * The caps mirror the ones lib/progress.ts already enforces locally (500
 * sessions, 60 range tests). Over-cap payloads are rejected rather than
 * trimmed: a client sending more than the store can hold is not a client whose
 * data we should silently reshape, and truncating server-side would hand back
 * a merge result the singer never agreed to.
 */
function validateProgress(value: unknown): Rejection | null {
  if (!isPlainObject(value)) {
    return { error: "Progress payload must be an object.", status: 400 };
  }
  if (!isFiniteNumber(value.xp)) {
    return { error: "Progress payload is missing xp.", status: 400 };
  }
  if (!Array.isArray(value.sessions)) {
    return { error: "Progress payload is missing sessions.", status: 400 };
  }
  if (value.sessions.length > MAX_SESSIONS) {
    return { error: "Too many sessions to back up.", status: 413 };
  }
  if (!value.sessions.every(validSession)) {
    return { error: "A session in the payload is malformed.", status: 400 };
  }
  if (!validStreak(value.streak)) {
    return { error: "Progress payload has a malformed streak.", status: 400 };
  }
  if (!validRange(value.range)) {
    return { error: "Progress payload has a malformed range.", status: 400 };
  }
  if (!Array.isArray(value.rangeHistory)) {
    return { error: "Progress payload is missing rangeHistory.", status: 400 };
  }
  if (value.rangeHistory.length > MAX_RANGE_HISTORY) {
    return { error: "Too many range tests to back up.", status: 413 };
  }
  if (!value.rangeHistory.every(validRangeEntry)) {
    return { error: "A range test in the payload is malformed.", status: 400 };
  }
  if (!Array.isArray(value.achievements)) {
    return { error: "Progress payload is missing achievements.", status: 400 };
  }
  if (value.achievements.length > MAX_ACHIEVEMENTS) {
    return { error: "Too many achievements to back up.", status: 413 };
  }
  if (!value.achievements.every((a: unknown) => isCleanString(a, 64))) {
    return { error: "An achievement id in the payload is malformed.", status: 400 };
  }
  return null;
}

/**
 * Clerk ids look like `user_2abc…`, but the id becomes a Redis key, so pin the
 * shape rather than trusting it. A rejected id can only ever mean no backup.
 */
function storeKeyFor(userId: string): string | null {
  if (!/^[A-Za-z0-9_-]{1,128}$/.test(userId)) return null;
  return `${KEY_PREFIX}${userId}`;
}

function unauthorized() {
  return NextResponse.json(
    { error: "Sign in to use your practice backup." },
    { status: 401 },
  );
}

function notConfigured() {
  return NextResponse.json(
    { error: "Backups aren't set up on the server yet." },
    { status: 503 },
  );
}

export async function GET(request: Request) {
  const limited = rateLimit(request, "account-progress", {
    limit: 30,
    windowMs: 60_000,
  });
  if (limited) return limited;

  const { userId } = await auth();
  if (!userId) return unauthorized();

  const storeKey = storeKeyFor(userId);
  if (!storeKey) return unauthorized();

  const redis = getRedis();
  if (!redis) return notConfigured();

  try {
    const stored = await redis.get<StoredBackup>(storeKey);
    // An account with nothing backed up yet is a normal, quiet state, not an
    // error — the caller shows "no backup yet" rather than a failure.
    return NextResponse.json(
      stored ?? { state: null, updatedAt: null, savedAt: null },
    );
  } catch (error) {
    console.error("[api/account/progress GET]", error);
    return NextResponse.json(
      { error: "Could not reach your backup. Try again in a moment." },
      { status: 502 },
    );
  }
}

export async function PUT(request: Request) {
  const limited = rateLimit(request, "account-progress", {
    limit: 30,
    windowMs: 60_000,
  });
  if (limited) return limited;

  const { userId } = await auth();
  if (!userId) return unauthorized();

  const storeKey = storeKeyFor(userId);
  if (!storeKey) return unauthorized();

  let state: unknown;
  let updatedAt: unknown;
  try {
    const body = (await request.json()) as {
      state?: unknown;
      updatedAt?: unknown;
    };
    state = body?.state;
    updatedAt = body?.updatedAt;
  } catch {
    return NextResponse.json({ error: "Expected a JSON body." }, { status: 400 });
  }

  const rejection = validateProgress(state);
  if (rejection) {
    return NextResponse.json(
      { error: rejection.error },
      { status: rejection.status },
    );
  }

  // Size is checked after shape because shape alone does not bound bytes. The
  // note tallies are why: 128 note keys of 16 leaves each across 500 sessions
  // clears every check above and still serializes to roughly 17MB. Maxed-out
  // `detail` strings only reach 260KB, so they never trip this. Redis should
  // never see either.
  if (JSON.stringify(state).length > MAX_STATE_BYTES) {
    return NextResponse.json(
      { error: "That practice record is too large to back up." },
      { status: 413 },
    );
  }

  const redis = getRedis();
  if (!redis) return notConfigured();

  try {
    const record: StoredBackup = {
      state: state as ProgressState,
      updatedAt: isCleanString(updatedAt, 64) ? updatedAt : null,
      savedAt: new Date().toISOString(),
    };
    await redis.set(storeKey, record);
    return NextResponse.json({ ok: true, savedAt: record.savedAt });
  } catch (error) {
    console.error("[api/account/progress PUT]", error);
    return NextResponse.json(
      { error: "Could not save your backup. Try again in a moment." },
      { status: 502 },
    );
  }
}
