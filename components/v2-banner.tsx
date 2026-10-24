"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";
import V2TraceGlyph from "@/components/v2-glyph";
import { FREE_DAILY_MINUTES } from "@/lib/practice-limits";

const SEEN_KEY = "suede-sing:v4-0-banner:v1";

/**
 * The release announcement (4.0 as of 2026-10-24; it announced 3.1 from
 * 2026-09-25 and v2 before that): a filled card on the homepage, directly
 * after the hero, led by a large "v4.0" lockup.
 *
 * It is shown to every visitor, first-time ones included, until they close it.
 * Through 3.1 it went only to returning singers (a saved progress record),
 * on the reasoning that a first-time visitor has nothing to compare against.
 * For 4.0 the owner asked for the release to be prominent, and the placement
 * rule below is what makes that cheap: the card renders after the hero's
 * start buttons, so a first-time visitor meets it only after the page's first
 * action, never in front of it. The progress-record condition is gone from
 * both the pre-paint script and bannerWanted().
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
 * singer and a page's first action. That matters more now that the card is
 * several times taller than the 3.1 strip and every visitor sees it.
 * v2-banner.test.tsx pins both halves: no other module imports this one, and
 * on the homepage it comes after the hero. The footer carries the crawlable
 * /changelog link on every page.
 *
 * It sits in the homepage's column, as wide as the hero above it, so it reads
 * as part of the page, not a toast. Its fill is --color-violet-ink, the
 * restored original design's (#229); before that it was --color-brand, kept
 * off violet because violet otherwise marks Pro on this site. The lockup uses
 * only what the site already has: the display serif (h1 and h2 only, so the
 * numerals are the card's h2), white on the fill, and the campaign's trace
 * glyph drawn in --color-cool on a white tile, the same cool trace the
 * /changelog record head carries. Cool on violet-ink would be dark on dark,
 * which is why the trace gets a white ground rather than sitting on the fill.
 * No raster image: the whole mark is type and one SVG path.
 *
 * It started as a 40px hairline strip whose message was hidden below sm, which
 * meant phone visitors saw a bare "V2" chip and a link. It became a solid cool
 * card carrying the message at every width, and for 4.0 a large card with the
 * version as its headline. Bump SEEN_KEY only to deliberately re-broadcast:
 * it was bumped for 3.1, and again for 4.0, so a singer who closed the 3.1
 * card sees the 4.0 one once. Restyling the card is never a reason to bump it.
 *
 * Dismissal has to survive server rendering without a flash or a layout
 * shift, on a site that prerenders every page. The card is always in the
 * homepage's server HTML, and the inline script directly after it hides it
 * before first paint when the seen key is set. The parser executes the script
 * synchronously, so a dismisser never sees a frame of the card, and everyone
 * else gets it in the first paint, never inserted after it. React 19 leaves
 * attributes it never rendered alone during hydration, so the script-set
 * `hidden` sticks; once hydrated, the store below reads the same key and
 * unmounts it for real. A client-side navigation to the homepage mounts it
 * fresh, where an inline script never runs: there the store's client snapshot
 * decides on the first render, so a dismisser never gets a painted frame of
 * it, and the script is left out (React warns about a <script> rendered on the
 * client). Tailwind's preflight keeps `[hidden]` display:none with !important,
 * so no display utility here can override it.
 */

/**
 * Set when the singer closes the banner, so it stays closed in this tab even
 * where storage refuses the write.
 */
let closedHere = false;
const listeners = new Set<() => void>();

/** Exported for the tests, which check that a dismissal reaches the card. */
export function subscribe(onChange: () => void): () => void {
  listeners.add(onChange);
  // Another tab closing it.
  window.addEventListener("storage", onChange);
  return () => {
    listeners.delete(onChange);
    window.removeEventListener("storage", onChange);
  };
}

/**
 * Whether this browser should see the banner: anyone who has not closed it.
 * The same rule as the pre-paint script, which the test checks.
 */
export function bannerWanted(): boolean {
  if (closedHere) return false;
  try {
    return !window.localStorage.getItem(SEEN_KEY);
  } catch {
    // storage unavailable: keep showing rather than flicker, as the
    // pre-paint script does when its own read throws
    return true;
  }
}

/** The server HTML always carries the banner; the pre-paint script decides. */
const inServerHtml = () => true;
const noChanges = () => () => {};
const hydrated = () => true;
const notHydrated = () => false;

/** The dismiss button's action. Exported for the tests. */
export function dismissBanner(): void {
  closedHere = true;
  try {
    window.localStorage.setItem(SEEN_KEY, new Date().toISOString());
  } catch {
    // ignore: closedHere holds the dismissal for this tab
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
    // The homepage's column and gutters (max-w-6xl, px-4/px-6), so the card
    // lines up with the hero text and the sections below instead of running
    // edge to edge with its rounded corners cut off by the screen. The
    // wrapper has no height of its own: hidden before paint, the section
    // takes its margins with it.
    <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
      {/* suppressHydrationWarning: the script below may set `hidden` before
          React hydrates; without it development warns about an attribute
          React did not render, on every dismisser's homepage. */}
      <section
        id="v2-banner"
        aria-label="Suede Sing 4.0 announcement"
        className="relative my-6 rounded-3xl bg-violet-ink text-white sm:my-8"
        suppressHydrationWarning
      >
        {/* White on --color-violet-ink is 7.1:1 and the message's white/85
            5.5:1, so everything here reads at a glance. The lockup and the
            message share a wrapping row: side by side where the message
            keeps at least 20rem, stacked otherwise. A grid sized to the
            lockup squeezed the message to one word a line between 640 and
            768px, and on a phone pushed it off the card, once a visitor
            enlarged their default text. The right padding on the lockup
            keeps it clear of the positioned dismiss control. */}
        <div className="flex flex-wrap items-center gap-x-10 gap-y-5 p-5 sm:p-8 sm:pr-20">
          <div className="flex max-w-full flex-wrap items-end gap-4 pr-12 sm:pr-0">
            {/* The version is the headline. The hidden words give it its
                full name for a screen reader and the page's outline; the
                eye gets the numerals alone. */}
            <h2 className="text-[clamp(4.5rem,14vw,8rem)] leading-[0.85] tracking-[-0.03em] text-white">
              <span className="sr-only">Suede Sing </span>v4.0
            </h2>
            <span className="mb-1 flex size-14 shrink-0 items-center justify-center rounded-2xl bg-white sm:mb-2 sm:size-20">
              <V2TraceGlyph className="h-auto w-10 text-cool sm:w-14" />
            </span>
          </div>
          <div className="min-w-0 flex-1 basis-[20rem]">
            <p className="font-mono text-label uppercase tracking-[0.14em] text-white/85">
              {/* Real spaces around the hidden dot, so the line reads "New
                  release October 2026", not "New releaseOctober 2026". */}
              New release{" "}
              <span className="mx-1" aria-hidden>
                ·
              </span>{" "}
              <span className="whitespace-nowrap">October 2026</span>
            </p>
            {/* Only what main ships and the October log records: the
                restored homepage and navigation (#229, the 15th) and the
                daily free minutes (#212, the 10th), read from the same
                constant the hero quotes so the two cannot disagree. */}
            <p className="mt-2 max-w-xl text-base leading-relaxed text-white/85 sm:text-lg">
              The original Suede Sing homepage and navigation are back.
              Guided practice now includes {FREE_DAILY_MINUTES} free minutes
              a day.
            </p>
            {/* A solid white pill: the card's one call to action, in the
                fill's own ink (violet-ink on white is 7.1:1). It recedes to
                --color-panel on hover rather than tinting, so the label's
                contrast never drops. Both controls here take a white focus
                ring: the site's --color-rec ring (globals.css) reads about
                1.1:1 against this fill, and white reads 7.1:1. */}
            <Link
              href="/changelog"
              className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-full bg-white px-5 py-2 text-sm font-semibold text-violet-ink transition-colors hover:bg-panel focus-visible:outline-white!"
            >
              See what&apos;s new
              <span aria-hidden>→</span>
            </Link>
          </div>
        </div>
        {/* The drawer-close pattern from nav.tsx: a 44px square hit region
            around a small glyph, pinned to the top-right corner so it stays
            put however the card wraps. */}
        <button
          type="button"
          onClick={(event) => {
            // Unmounting the card would drop keyboard focus to <body>. Hand it
            // to the first heading of the section that follows, where the
            // reader would be had the card never been there.
            const next = event.currentTarget
              .closest("#v2-banner")
              ?.parentElement?.nextElementSibling?.querySelector<HTMLElement>("h2, h3");
            dismissBanner();
            if (next) {
              next.tabIndex = -1;
              next.focus();
            }
          }}
          aria-label="Dismiss the 4.0 announcement"
          className="absolute right-2 top-2 flex size-11 items-center justify-center rounded-full text-white/70 transition-colors hover:bg-white/15 hover:text-white focus-visible:outline-white! sm:right-3 sm:top-3"
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
      </section>
      {!isClientMount && (
        <script
          dangerouslySetInnerHTML={{
            __html: `try{if(localStorage.getItem("${SEEN_KEY}"))document.getElementById("v2-banner").hidden=true}catch(e){}`,
          }}
        />
      )}
    </div>
  );
}
