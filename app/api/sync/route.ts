import { NextResponse } from "next/server";
import { ENTITLING_STATUSES } from "@/lib/pro-shared";
import { verifyProKey } from "@/lib/pro-key";
import { rateLimit } from "@/lib/rate-limit";
import { getRedis } from "@/lib/redis";
import { getStripe, isOurSubscription } from "@/lib/stripe";

/**
 * Cloud sync for a subscriber's practice progress.
 *
 * The Pro key authenticates: its HMAC proves purchase and names the
 * subscription, which becomes the storage key — no accounts needed. Whether
 * that subscription is still paying is re-checked against Stripe at most
 * once a day (cached here in Redis), so a cancelled subscriber loses sync
 * within a day without every sync costing a Stripe call.
 *
 * One POST does either direction: body with `state` stores it, body without
 * `state` fetches what's stored. The client owns merging — this route never
 * interprets the blob beyond safety checks.
 */

/** Progress payload ceiling — roughly 2× a maxed-out 500-session store. */
const MAX_STATE_BYTES = 400_000;
const ENT_TTL_SEC = 24 * 60 * 60;

interface StoredSync {
  state: unknown;
  /** Client clock when the state was captured; used only for display. */
  updatedAt: string | null;
  /** Server clock when it was stored. */
  savedAt: string;
}

async function subscriptionStillPro(subscriptionId: string, customerId: string) {
  const redis = getRedis();
  if (!redis) return false;

  const cacheKey = `sync:ent:${subscriptionId}`;
  const cached = await redis.get<string>(cacheKey);
  if (cached === "yes") return true;
  if (cached === "no") return false;

  const sub = await getStripe().subscriptions.retrieve(subscriptionId);
  const owner = typeof sub.customer === "string" ? sub.customer : sub.customer.id;
  const ok =
    owner === customerId &&
    isOurSubscription(sub) &&
    (ENTITLING_STATUSES as readonly string[]).includes(sub.status);
  await redis.set(cacheKey, ok ? "yes" : "no", { ex: ENT_TTL_SEC });
  return ok;
}

export async function POST(request: Request) {
  const limited = rateLimit(request, "sync", { limit: 30, windowMs: 60_000 });
  if (limited) return limited;

  let key: unknown;
  let state: unknown;
  let updatedAt: unknown;
  try {
    const body = (await request.json()) as {
      key?: unknown;
      state?: unknown;
      updatedAt?: unknown;
    };
    key = body?.key;
    state = body?.state;
    updatedAt = body?.updatedAt;
  } catch {
    return NextResponse.json({ error: "Expected a JSON body." }, { status: 400 });
  }

  const claims = verifyProKey(key);
  if (!claims) {
    return NextResponse.json(
      { error: "Cloud sync needs a valid Pro key." },
      { status: 401 },
    );
  }

  const redis = getRedis();
  if (!redis) {
    return NextResponse.json(
      { error: "Cloud sync isn't set up on the server yet." },
      { status: 503 },
    );
  }

  try {
    const entitled = await subscriptionStillPro(
      claims.subscriptionId,
      claims.customerId,
    );
    if (!entitled) {
      return NextResponse.json(
        { error: "That subscription is no longer active." },
        { status: 403 },
      );
    }

    const storeKey = `sync:state:${claims.subscriptionId}`;

    if (state !== undefined) {
      if (typeof state !== "object" || state === null || Array.isArray(state)) {
        return NextResponse.json(
          { error: "Progress payload must be an object." },
          { status: 400 },
        );
      }
      const serialized = JSON.stringify(state);
      if (serialized.length > MAX_STATE_BYTES) {
        return NextResponse.json(
          { error: "Progress payload is too large to sync." },
          { status: 413 },
        );
      }
      const record: StoredSync = {
        state,
        updatedAt: typeof updatedAt === "string" ? updatedAt : null,
        savedAt: new Date().toISOString(),
      };
      await redis.set(storeKey, record);
      return NextResponse.json({ ok: true, savedAt: record.savedAt });
    }

    const stored = await redis.get<StoredSync>(storeKey);
    return NextResponse.json(
      stored ?? { state: null, updatedAt: null, savedAt: null },
    );
  } catch (error) {
    console.error("[api/sync]", error);
    return NextResponse.json(
      { error: "Could not reach the sync store. Try again in a moment." },
      { status: 502 },
    );
  }
}
