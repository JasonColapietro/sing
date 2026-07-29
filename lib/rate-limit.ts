import "server-only";

/**
 * A cheap in-process burst limiter for the Stripe routes.
 *
 * This is a floor, not the real defence: counters live in one function
 * instance, so a distributed caller gets roughly this limit per instance and
 * per region. The durable protection is the Vercel WAF `rate_limit` rules on
 * /api/* (see README) — requests blocked there never reach this code and are
 * not billed. What this does buy, for free and with no configuration, is
 * stopping a single naive loop from hammering Stripe.
 */

interface Window {
  count: number;
  resetAt: number;
}

const windows = new Map<string, Window>();
const MAX_TRACKED = 5_000;

function sweep(now: number) {
  for (const [key, window] of windows) {
    if (window.resetAt <= now) windows.delete(key);
  }
  // Pathological key churn (spoofed forwarding headers) must not grow the map
  // without bound; dropping entries only ever loosens the limit.
  if (windows.size > MAX_TRACKED) windows.clear();
}

export interface RateLimitResult {
  ok: boolean;
  /** Seconds until the window resets, for Retry-After. */
  retryAfter: number;
}

export function hit(
  key: string,
  { limit, windowMs }: { limit: number; windowMs: number },
): RateLimitResult {
  const now = Date.now();
  sweep(now);

  const existing = windows.get(key);
  if (!existing || existing.resetAt <= now) {
    windows.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, retryAfter: 0 };
  }

  existing.count += 1;
  if (existing.count > limit) {
    return {
      ok: false,
      retryAfter: Math.max(1, Math.ceil((existing.resetAt - now) / 1000)),
    };
  }
  return { ok: true, retryAfter: 0 };
}

/**
 * Client identity, preferring headers a caller can't forge.
 *
 * `x-forwarded-for` is deliberately last: a client can send its own value and
 * proxies append rather than replace, so trusting its leftmost entry would let
 * anyone rotate their own bucket and skip the limit entirely. Vercel sets
 * `x-vercel-forwarded-for` and `x-real-ip` itself, so those come first. With no
 * header at all, everyone shares one bucket — limiting collectively beats not
 * limiting.
 */
export function clientKey(request: Request): string {
  const trusted =
    request.headers.get("x-vercel-forwarded-for") ??
    request.headers.get("x-real-ip");
  const ip =
    trusted?.trim() || request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return ip && ip.length <= 64 ? ip : "unknown";
}

/** Returns a 429 when the caller is over budget, or null to continue. */
export function rateLimit(
  request: Request,
  route: string,
  options: { limit: number; windowMs: number },
): Response | null {
  const result = hit(`${route}:${clientKey(request)}`, options);
  if (result.ok) return null;
  return Response.json(
    { error: "Too many requests. Wait a moment and try again." },
    {
      status: 429,
      headers: { "retry-after": String(result.retryAfter) },
    },
  );
}
