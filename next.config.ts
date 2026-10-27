import type { NextConfig } from "next";
import { randomUUID } from "node:crypto";
import path from "path";
import { EXERCISES } from "./components/warmups/exercises";
import { accountsReady } from "./lib/accounts";
import { PROGRAM_IDS } from "./lib/program-ids";

/**
 * With accounts off on this build (no production Clerk key), the root
 * layout's account provider resolves to a Clerk-free stand-in with the same
 * default export, so Clerk's React SDK stays out of every page. Next loads
 * every client component the layout's imports reach, rendered or not, so
 * skipping the render alone did not skip the download. See
 * components/account/clerk-shell.tsx. Evaluated once per build: the deploy
 * that gains a pk_live_ key builds with the real provider and no alias.
 */
const ACCOUNTS_OFF = !accountsReady();
const CLERK_SHELL = "@/components/account/clerk-shell";
const CLERK_SHELL_OFF = "./components/account/clerk-shell-off.tsx";

const nextConfig: NextConfig = {
  // Next inlines this non-secret value into the legacy image handler at build
  // time. A fresh build refreshes scraper caches even when only the renderer
  // changed, leaving the card's data ID unchanged. This is independent of
  // Next's private metadata source hash and is never generated per request.
  env: { SING_OG_RENDER_REVISION: randomUUID() },
  images: {
    // The optimizer re-fetched every /_next/image variant after four hours
    // (Next's default). The sources are files in public/ that change only by
    // deploy, and the `dpl` query Vercel appends already moves the URL per
    // deploy, so a month costs nothing in freshness.
    minimumCacheTTL: 2592000,
  },
  async headers() {
    return [
      {
        // Every response, pages and /api alike. Production carried only
        // strict-transport-security (Vercel's). No Content-Security-Policy
        // yet: the inline JSON-LD, pre-paint and Stripe scripts make that a
        // project of its own.
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            // The studio, range test and recorder open the microphone, so
            // it stays allowed on this origin. Nothing uses a camera or
            // location.
            key: "Permissions-Policy",
            value: "microphone=(self), camera=(), geolocation=()",
          },
          {
            // Nothing embeds this site in a frame: the Chrome extension runs
            // its own analysis in a side panel, Stripe Checkout is hosted
            // (not embedded), and the native apps are separate builds.
            key: "X-Frame-Options",
            value: "SAMEORIGIN",
          },
        ],
      },
      {
        // The image files in public/ (icons, badges, screenshots, the
        // portrait) were served `max-age=0, must-revalidate`, so every page
        // view re-asked for each one. None of them changes in place: a new
        // picture gets a new file name. Files that do change at a fixed URL
        // (the IndexNow key, llms.txt, the sitemaps, the audio) are other
        // types and keep Next's default.
        source: "/:path*.(png|jpg|jpeg|webp|svg|ico|woff2)",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
    ];
  },
  turbopack: {
    root: path.join(__dirname),
    ...(ACCOUNTS_OFF ? { resolveAlias: { [CLERK_SHELL]: CLERK_SHELL_OFF } } : {}),
  },
  // The same swap for `next dev --webpack` (scripts/audit-warmup-timing.mjs
  // measures under it) and any `next build --webpack`. Next's tsconfig-paths
  // resolver plugin can rewrite "@/…" to an absolute path before
  // resolve.alias sees the request, so both spellings are aliased, each as
  // an exact match.
  webpack(config) {
    if (ACCOUNTS_OFF) {
      const off = path.join(__dirname, CLERK_SHELL_OFF);
      config.resolve.alias = {
        ...config.resolve.alias,
        [`${CLERK_SHELL}$`]: off,
        [`${path.join(__dirname, "components/account/clerk-shell")}$`]: off,
      };
    }
    return config;
  },
  // The Pro book PDFs live outside public/ so they can't be fetched without a
  // subscription check; make sure the serving route's bundle includes them.
  outputFileTracingIncludes: {
    "/api/book/pdf": ["./content/pdfs/**"],
  },
  async rewrites() {
    return {
      // Before the filesystem: /programs is a page of its own, and a rewrite
      // in the default (afterFiles) phase never reaches a path a page owns.
      beforeFiles: [
        // Versioned cards replaced these formerly published image URLs.
        // Next does not allow a route.ts alongside the metadata file, so
        // route only these legacy paths to a handler that validates the slug
        // and temporarily redirects to its current card version. Unknown
        // slugs still return 404; versioned URLs never match these rules.
        ...[
          "/singers",
          "/singers/records",
          "/singers/:slug",
          "/songs/:slug",
          "/singers/genre/:genre",
          "/singers/voice-type/:type",
        ].map((page) => ({
          source: `${page}/opengraph-image`,
          destination: `/legacy-share-card${page}`,
        })),
        {
          // A program's own view is a query-string deep link (today's card,
          // /progress, the book and GuitarHub's contract all use it), and a
          // static page cannot read its query, so the prerendered list used
          // to paint and then swap to the calendar after mount. Each known id
          // is served the program's own prerendered page instead, at the same
          // address; an unknown id matches nothing and gets the list, as the
          // contract says. The ids are anchored (Next matches `^value$`).
          source: "/programs",
          has: [{ type: "query", key: "program", value: `(?<program>${PROGRAM_IDS.join("|")})` }],
          destination: "/programs/:program",
        },
      ],
      afterFiles: [],
      fallback: [],
    };
  },
  async redirects() {
    return [
      {
        // Redirect raw Vercel hosts before Proxy runs. Clerk authenticates
        // before invoking its callback and can emit its own handshake redirect,
        // so canonicalization inside clerkMiddleware is too late to guarantee
        // that paid entitlement stays on sing.suedeai.ai's localStorage origin.
        source: "/:path*",
        has: [
          {
            type: "host",
            value: ".+\\.vercel\\.app",
          },
        ],
        destination: "https://sing.suedeai.ai/:path*",
        permanent: true,
      },
      {
        // The library files this category as Contralto, but "alto" is the
        // commoner word and what the range test used to answer. Both the
        // stored label on a returning singer's device and anyone searching
        // "alto singers" should land somewhere real.
        source: "/singers/voice-type/alto",
        destination: "/singers/voice-type/contralto",
        permanent: true,
      },

      {
        // Same failure, other taxonomy. slugify() folds "&" to "and", so "R&B"
        // is served at /singers/genre/randb — a slug nobody guesses. /llms.txt
        // advertised /singers/genre/r-b to answer engines for months (fixed in
        // the same PR as this line), so that URL is already in crawler and
        // model memory and needs somewhere real to land.
        source: "/singers/genre/r-b",
        destination: "/singers/genre/randb",
        permanent: true,
      },

      {
        // The warmups room deep-links as /warmups?exercise=<id>, but the id
        // reads like a path segment and visitors type it as one: production
        // logged /warmups/five-note-scale as a 404. Only real exercise ids
        // match, so a typo under /warmups still gets the not-found page.
        source: `/warmups/:exercise(${EXERCISES.map((e) => e.id).join("|")})`,
        destination: "/warmups?exercise=:exercise",
        permanent: false,
      },

      // --- Legacy paths Google still holds for this host (2026-08-08) ---
      // The 2026-08-02 consolidation moved the brand's marketing home from
      // print.suedeai.ai to this host. Google kept asking this host for the
      // old site's paths and got a 404 on every one; Next's not-found ships
      // `noindex`, which is why Search Console filed them under "Excluded by
      // 'noindex' tag" rather than "Not found (404)". Nothing on this site
      // links to any of them — they are inbound-only URLs, so a 404 throws
      // away whatever equity and traffic they still carry. Each one now lands
      // on its real successor.
      {
        // The browser studio IS the web app now. Deliberately not pointed at
        // print.suedeai.ai/app: that companion is `noindex` by design, so
        // redirecting a page Google wants to index into a noindexed one would
        // just move the exclusion rather than clear it.
        source: "/app",
        destination: "/studio",
        permanent: true,
      },
      {
        // Same mapping print.suedeai.ai/demo already uses, so both hosts'
        // copies of this URL converge on one destination.
        source: "/demo",
        destination: "/range",
        permanent: true,
      },
      // Policy and support live on the org site and are what both store
      // listings declare, so these are pointers, not pages to rebuild here.
      // Trailing slashes are the canonical form suedeai.org serves — linking
      // the unslashed form would add a second hop through its own 308.
      {
        source: "/privacy",
        destination: "https://suedeai.org/voice/privacy/",
        permanent: true,
      },
      {
        source: "/support",
        destination: "https://suedeai.org/voice/support/",
        permanent: true,
      },
      {
        source: "/terms",
        destination: "https://suedeai.org/voice/terms/",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
