import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { accountsReady } from "@/lib/accounts";
import {
  NextResponse,
  type NextProxy,
  type ProxyConfig,
} from "next/server";

/**
 * Clerk reads the session for every request and, below, redirects signed-out
 * visitors away from the lesson and tool rooms in GATED_ROUTES.
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
/**
 * Lessons and practice tools need a signed-in account. The famous-singer
 * range pages (/singers) and the reference and marketing pages stay open, so
 * search visitors still land on something before being asked to sign in.
 *
 * The gate only exists when accounts are real (see accountsReady): with the
 * development keys nobody can sign in on the production domain, so gating
 * there would lock every visitor out of every room.
 */
export const GATED_ROUTES = [
  "/studio(.*)",
  "/warmups(.*)",
  "/range(.*)",
  "/ear-training(.*)",
  "/breath(.*)",
  "/songs(.*)",
  "/recorder(.*)",
  "/tools(.*)",
  "/progress(.*)",
  "/analyze(.*)",
  "/programs(.*)",
  "/learn(.*)",
];

const isGated = createRouteMatcher(GATED_ROUTES);

const proxy: NextProxy = accountsReady()
  ? clerkMiddleware(async (auth, request) => {
      if (!isGated(request)) return;
      const { userId } = await auth();
      if (userId) return;
      // Our own sign-in page, not Clerk's hosted portal, with the room they
      // asked for as the place to land afterwards.
      const signIn = new URL("/sign-in", request.url);
      signIn.searchParams.set("redirect_url", request.nextUrl.pathname + request.nextUrl.search);
      return NextResponse.redirect(signIn);
    })
  : withoutClerk;

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
