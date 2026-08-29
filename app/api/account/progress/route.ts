import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { accountsReady } from "@/lib/accounts";
import { rateLimit } from "@/lib/rate-limit";
import { getRedis } from "@/lib/redis";
import type { ProgressState } from "@/lib/progress";
import { checkProgress, isCleanString } from "@/lib/progress-shape";

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

interface StoredBackup {
  state: ProgressState;
  /** Client clock when the snapshot was taken; display only. */
  updatedAt: string | null;
  /** Server clock when it was stored. */
  savedAt: string;
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

async function authorizedStoreKey(): Promise<string | null> {
  if (!accountsReady()) return null;
  const { userId } = await auth();
  return userId ? storeKeyFor(userId) : null;
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

  const storeKey = await authorizedStoreKey();
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

  const storeKey = await authorizedStoreKey();
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

  // Shape comes from lib/progress-shape.ts, the same module the browser store
  // repairs its own reads with. One definition of what a session looks like, so
  // this route and the client can never drift into disagreeing about it.
  const rejection = checkProgress(state);
  if (rejection) {
    return NextResponse.json(
      { error: rejection.reason },
      { status: rejection.overCap ? 413 : 400 },
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
