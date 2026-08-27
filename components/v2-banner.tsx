"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import V2TraceGlyph from "@/components/v2-glyph";

const SEEN_KEY = "suede-sing:v2-banner:v1";

/**
 * The v2 announcement: a filled band above the sticky header that scrolls away
 * with the page. It shares the header's max-w-6xl grid so the V2 chip sits on
 * the same left edge as the wordmark below it — part of the console, not a
 * toast. No amber anywhere in it: the strip hangs directly over the amber Pro
 * pill, and a gold banner there would announce a pricing event, not a version.
 * Its accent is --color-cool, the pitch trace's colour (see v2-glyph.tsx).
 *
 * It started as a 40px hairline strip whose message was hidden below sm, which
 * meant phone visitors saw a bare "V2" chip and a link. It is now a solid cool
 * band carrying the message at every width. The dismiss key is deliberately
 * unchanged: making the banner louder is not a reason to re-show it to someone
 * who already closed it. Bump SEEN_KEY only to deliberately re-broadcast.
 *
 * Dismissal has to survive server rendering without a flash or a layout
 * shift, on a site that prerenders every page. The banner is always in the
 * server HTML (so every page carries a crawlable link to /changelog), and the
 * inline script directly after it hides it before first paint when the seen
 * key is set — the parser executes the script synchronously, so a returning
 * dismisser never sees a frame of banner. React 19 leaves attributes it never
 * rendered alone during hydration, so the script-set `hidden` sticks; the
 * mount effect then reads the same key and unmounts for real. Tailwind's
 * preflight keeps `[hidden]` display:none with !important, so no display
 * utility here can override it.
 */
export default function V2Banner() {
  const pathname = usePathname();
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Inside a closure, same as ProMoments' gate(): a bare setState in an
    // effect body trips react-hooks/set-state-in-effect.
    const sync = () => {
      try {
        if (window.localStorage.getItem(SEEN_KEY)) setDismissed(true);
      } catch {
        // storage unavailable — keep showing rather than flicker
      }
    };
    sync();
  }, []);

  // On /changelog the banner would link to the page it is already on.
  if (dismissed || pathname === "/changelog") return null;

  const dismiss = () => {
    try {
      window.localStorage.setItem(SEEN_KEY, new Date().toISOString());
    } catch {
      // ignore — dismissal still holds for this mount
    }
    setDismissed(true);
  };

  return (
    <>
      <aside
        id="v2-banner"
        aria-label="What's new in Suede Sing"
        className="relative bg-cool text-white"
      >
        {/* The strip reads as a filled band rather than a hairline: white on
            --color-cool is 7.26:1, so the announcement carries at a glance
            without borrowing amber, which on this site means a pricing event
            (see the file header). The dismiss control is positioned rather
            than in flow so the row can wrap to two lines on a narrow phone
            instead of truncating the message away. */}
        <div className="mx-auto flex min-h-12 w-full max-w-6xl flex-wrap items-center gap-x-3 gap-y-1 py-2 pl-4 pr-12 sm:pl-6 sm:pr-14">
          <V2TraceGlyph className="shrink-0 text-white" />
          <span className="inline-block shrink-0 rounded border border-white/40 px-1.5 py-0.5 font-mono text-label uppercase tracking-[0.1em] text-white">
            V2
          </span>
          <span className="text-meta text-white/85">
            The studio has been rebuilt.
          </span>
          <Link
            href="/changelog"
            className="shrink-0 rounded-full bg-white/15 px-3 py-1 text-meta font-medium text-white ring-1 ring-inset ring-white/30 transition-colors hover:bg-white/25"
          >
            See what we&apos;ve changed
          </Link>
          {/* The drawer-close pattern from nav.tsx: a 44px square hit region
              around a small glyph, here pinned to the right edge so it stays
              reachable whether the row is one line or two. */}
          <button
            type="button"
            onClick={dismiss}
            aria-label="Dismiss the v2 announcement"
            className="absolute right-1 top-1/2 flex size-11 -translate-y-1/2 items-center justify-center rounded-full text-white/70 transition-colors hover:bg-white/15 hover:text-white"
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
      </aside>
      <script
        dangerouslySetInnerHTML={{
          __html: `try{if(localStorage.getItem("${SEEN_KEY}"))document.getElementById("v2-banner").hidden=true}catch(e){}`,
        }}
      />
    </>
  );
}
