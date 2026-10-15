"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";
import V2TraceGlyph from "@/components/v2-glyph";
import { PROGRESS_STORAGE_KEY } from "@/lib/progress";

const SEEN_KEY = "suede-sing:v3-1-banner:v1";

/**
 * The release announcement (3.1 as of 2026-09-25; it announced v2 before
 * that): a filled card on the homepage, directly after the hero.
 *
 * It is shown only to returning singers (a saved progress record exists); a
 * first-time visitor has nothing to compare against.
 *
 * Where it renders is the rule, not a list of pages to keep it off. It used to
 * be a band above the sticky header on every page, and on a 375×667 phone its
 * 131px pushed the page's main button under the tab bar for exactly the
 * returning singers it targets: /pro, the practice rooms, the song and
 * can-you-sing pages, /singers/records, /singers/methodology, the voice-type
 * atlas, /book and /extension were all measured, and a list of exact paths to
 * hide it on missed each page nobody had measured yet. Now the homepage (the
 * installed app's start_url) is the only page that renders it, and it renders
 * it after the hero and its start buttons, so it can never stand between a
 * singer and a page's first action. v2-banner.test.tsx pins both halves: no
 * other module imports this one, and on the homepage it comes after the hero.
 * The footer carries the crawlable /changelog link on every page.
 *
 * It sits in the homepage's column, as wide as the hero above it, so it reads
 * as part of the page, not a toast. No violet anywhere in it: on this site
 * violet means a pricing event (the Pro pill, the Pro section further down the
 * homepage), and a release is not one. Its accent is --color-cool, the pitch
 * trace's colour (see v2-glyph.tsx).
 *
 * It started as a 40px hairline strip whose message was hidden below sm, which
 * meant phone visitors saw a bare "V2" chip and a link. It is now a solid cool
 * card carrying the message at every width. The dismiss key is deliberately
 * unchanged: making the banner louder is not a reason to re-show it to someone
 * who already closed it. Bump SEEN_KEY only to deliberately re-broadcast; it
 * was bumped for 3.1, which is a release worth re-showing to v2 dismissers.
 *
 * Dismissal has to survive server rendering without a flash or a layout
 * shift, on a site that prerenders every page. The banner is always in the
 * homepage's server HTML, and the inline script directly after it hides it
 * before first paint when the seen key is set or there is no progress record —
 * the parser executes the script synchronously, so neither a returning
 * dismisser nor a first-time visitor sees a frame of banner. React 19 leaves
 * attributes it never rendered alone during hydration, so the script-set
 * `hidden` sticks; once hydrated, the store below reads the same keys and
 * unmounts it for real. A client-side navigation to the homepage mounts it
 * fresh, where an inline script never runs: there the store's client snapshot
 * decides on the first render, so a singer who should not see it never gets a
 * painted frame of it, and the script is left out (React warns about a
 * <script> rendered on the client). Tailwind's preflight keeps `[hidden]`
 * display:none with !important, so no display utility here can override it.
 */

/**
 * Set when the singer closes the banner, so it stays closed in this tab even
 * where storage refuses the write.
 */
let closedHere = false;
const listeners = new Set<() => void>();

function subscribe(onChange: () => void): () => void {
  listeners.add(onChange);
  // Another tab closing it, or saving a first session.
  window.addEventListener("storage", onChange);
  return () => {
    listeners.delete(onChange);
    window.removeEventListener("storage", onChange);
  };
}

/**
 * Whether this browser should see the banner: a returning singer who has not
 * closed it. The same rule as the pre-paint script, which the test checks.
 */
export function bannerWanted(): boolean {
  if (closedHere) return false;
  try {
    return (
      !window.localStorage.getItem(SEEN_KEY) &&
      Boolean(window.localStorage.getItem(PROGRESS_STORAGE_KEY))
    );
  } catch {
    // storage unavailable — keep showing rather than flicker
    return true;
  }
}

/** The server HTML always carries the banner; the pre-paint script decides. */
const inServerHtml = () => true;
const noChanges = () => () => {};
const hydrated = () => true;
const notHydrated = () => false;

function close(): void {
  closedHere = true;
  try {
    window.localStorage.setItem(SEEN_KEY, new Date().toISOString());
  } catch {
    // ignore — closedHere holds the dismissal for this tab
  }
  for (const notify of listeners) notify();
}

export default function V2Banner() {
  const wanted = useSyncExternalStore(subscribe, bannerWanted, inServerHtml);
  // False while rendering the server HTML and hydrating it, true on a
  // client-side mount: the pre-paint script belongs only to the former.
  const isClientMount = useSyncExternalStore(noChanges, hydrated, notHydrated);

  if (!wanted) return null;

  return (
    <>
      {/* suppressHydrationWarning: the script below may set `hidden` before
          React hydrates; without it development warns about an attribute
          React did not render, on every first-time visitor's homepage. */}
      <section
        id="v2-banner"
        aria-label="What's new in Suede Sing"
        className="relative mt-6 rounded-3xl bg-violet-ink text-white sm:mt-8"
        suppressHydrationWarning
      >
        {/* The card reads as a filled band rather than a hairline: white on
            --color-brand is 5.70:1, so the announcement carries at a glance
            without borrowing violet, which on this site means a pricing event
            (see the file header). The dismiss control is positioned rather
            than in flow so the row can wrap to two lines on a narrow phone
            instead of truncating the message away. */}
        <div className="flex min-h-12 flex-wrap items-center gap-x-3 gap-y-1 py-3 pl-5 pr-14 sm:pl-6 sm:pr-16">
          <V2TraceGlyph className="shrink-0 text-white" />
          <span className="inline-block shrink-0 rounded border border-white/40 px-1.5 py-0.5 font-mono text-label uppercase tracking-[0.1em] text-white">
            3.1
          </span>
          <span className="text-meta text-white/85">
            102 voice lessons, multi-week programs, and songs that score you.
          </span>
          {/* The pill is recessed (a black tint), not raised: white/15 over
              the brand fill lifted the backdrop to rgb(144,87,240), where
              white 13px text drops to 4.37:1. Black/15 is 7.25:1 at rest and
              8.54:1 on hover. */}
          <Link
            href="/changelog"
            className="relative inline-flex min-h-11 shrink-0 items-center rounded-full bg-black/15 px-3 py-1 text-meta font-medium text-white ring-1 ring-inset ring-white/40 transition-colors hover:bg-black/25"
          >
            See what&apos;s new
          </Link>
          {/* The drawer-close pattern from nav.tsx: a 44px square hit region
              around a small glyph, here pinned to the right edge so it stays
              reachable whether the row is one line or two. */}
          <button
            type="button"
            onClick={close}
            aria-label="Dismiss the 3.1 announcement"
            className="absolute right-2 top-1/2 flex size-11 -translate-y-1/2 items-center justify-center rounded-full text-white/70 transition-colors hover:bg-white/15 hover:text-white"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 14 14"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M3.5 3.5l7 7m0-7l-7 7"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>
      </section>
      {!isClientMount && (
        <script
          dangerouslySetInnerHTML={{
            __html: `try{if(localStorage.getItem("${SEEN_KEY}")||!localStorage.getItem("${PROGRESS_STORAGE_KEY}"))document.getElementById("v2-banner").hidden=true}catch(e){}`,
          }}
        />
      )}
    </>
  );
}
