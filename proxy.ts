import { clerkMiddleware } from "@clerk/nextjs/server";
import {
  NextResponse,
  type NextProxy,
  type NextRequest,
  type ProxyConfig,
} from "next/server";
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
 *
 * Returns null when the request is already on a host we are happy to serve, so
 * the caller can carry on rather than short-circuit.
 */
function canonicalRedirect(request: NextRequest) {
  const host = request.headers.get("host") ?? "";
  if (!host.endsWith(".vercel.app")) return null;

  const canonical = new URL(SITE_URL);
  // If SITE_URL is itself a vercel.app host, redirecting would loop.
  if (canonical.host === host || canonical.host.endsWith(".vercel.app")) {
    return null;
  }

  const target = new URL(request.nextUrl.pathname + request.nextUrl.search, canonical);
  return NextResponse.redirect(target, 308);
}

/**
 * No handler argument, and that is the point: with no callback there is no
 * auth.protect() call anywhere, so clerkMiddleware cannot turn a route into a
 * protected one. It runs purely to read the session and make auth state
 * available to the app. Every room stays open to a signed-out visitor, which
 * is what an organic-search funnel depends on. A route matcher here would gate
 * the site, so there isn't one.
 */
const withClerk = clerkMiddleware();

export const proxy: NextProxy = (request, event) => {
  // Canonical first. The redirect must not depend on Clerk resolving a session
  // or on the Clerk keys being present, because landing on the wrong origin is
  // what costs someone a subscription they paid for. A visitor on a vercel.app
  // host leaves before any auth work happens, and Clerk then runs normally on
  // the canonical host they land on.
  const redirect = canonicalRedirect(request);
  if (redirect) return redirect;

  return withClerk(request, event);
};

export const config: ProxyConfig = {
  // Unchanged from before Clerk. It still covers every path the canonical
  // redirect covered, which is also every path where auth state is worth
  // having — pages and /api alike. Static assets and the build output do not
  // need the check, and a redirect on them would only cost a round trip.
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
