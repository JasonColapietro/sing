import { NextResponse, type NextRequest } from "next/server";
import { SITE_URL } from "@/lib/site";

/**
 * Sends the raw *.vercel.app hosts to the canonical domain.
 *
 * Both sing-red.vercel.app and sing.vercel.app serve this app on 200, which
 * is duplicate content — the canonical tag points home, so search engines
 * mostly cope. The funnel does not.
 *
 * Entitlement lives in localStorage, and localStorage is per origin. Someone
 * who reaches a vercel.app host and subscribes gets a Stripe success_url built
 * from the host they arrived on, lands back on vercel.app, and their Pro
 * unlocks *there* — so on sing.suedeai.ai they are still a free user, having
 * paid. Redirecting before any of that can happen is the fix; lib/stripe.ts
 * pinning the origin to SITE_URL is the second line.
 *
 * Deliberately narrow: it only fires for *.vercel.app. A broad "anything that
 * is not SITE_URL" rule would take the whole site down if NEXT_PUBLIC_SITE_URL
 * were ever unset, since lib/site.ts falls back to a vercel.app default.
 */
export function proxy(request: NextRequest) {
  const host = request.headers.get("host") ?? "";
  if (!host.endsWith(".vercel.app")) return NextResponse.next();

  const canonical = new URL(SITE_URL);
  // If SITE_URL is itself a vercel.app host, redirecting would loop.
  if (canonical.host === host || canonical.host.endsWith(".vercel.app")) {
    return NextResponse.next();
  }

  const target = new URL(request.nextUrl.pathname + request.nextUrl.search, canonical);
  return NextResponse.redirect(target, 308);
}

export const config = {
  // Static assets and the build output do not need the check, and a redirect
  // on them would only cost a round trip.
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
