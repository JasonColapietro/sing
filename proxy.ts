import { clerkMiddleware } from "@clerk/nextjs/server";
import { accountsReady } from "@/lib/accounts";
import {
  NextResponse,
  type NextProxy,
  type ProxyConfig,
} from "next/server";

/**
 * No handler argument, and that is the point: with no callback there is no
 * auth.protect() call anywhere, so clerkMiddleware cannot turn a route into a
 * protected one. It runs purely to read the session and make auth state
 * available to the app. Every room stays open to a signed-out visitor, which
 * is what an organic-search funnel depends on. There is no protected-route
 * matcher or auth.protect() call here.
 *
 * It only runs when the keys are real. On a development instance Clerk answers
 * the first HTML request with a 307 to its own accounts.dev handshake
 * (x-clerk-auth-reason: dev-browser-missing) to plant a dev-browser token. That
 * happens with no handler and no matcher, because it is Clerk establishing
 * itself rather than protecting anything - so "nothing is gated" was true and
 * still let every crawler get bounced off the domain. It fires on Accept:
 * text/html and not on Accept: *\/*, which is why curl checks missed it and why
 * robots.txt and sitemap.xml were redirected too.
 */
const withoutClerk: NextProxy = () => {
  // Without real keys there is no session to read, so the only thing Clerk
  // would contribute here is the handshake redirect. Pass the request straight
  // through instead.
  return NextResponse.next();
};

// Clerk must be the function Next invokes, rather than a second proxy called
// from inside our own wrapper. Its auth result is carried to route handlers in
// request-override headers; the nested form dropped those headers in production
// and made auth() report that clerkMiddleware() never ran.
const proxy: NextProxy = accountsReady() ? clerkMiddleware() : withoutClerk;

export default proxy;

export const config: ProxyConfig = {
  // Auth state is useful on pages and /api alike. The explicit API matcher is
  // Clerk's documented pattern and prevents framework matcher changes from
  // silently dropping route-handler coverage. Static assets and build output
  // do not need the check.
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico).*)",
    "/(api|trpc)(.*)",
  ],
};
