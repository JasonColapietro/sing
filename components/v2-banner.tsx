"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import V2TraceGlyph from "@/components/v2-glyph";

const SEEN_KEY = "suede-sing:v2-banner:v1";

/**
 * The v2 announcement: a 40px strip above the sticky header that scrolls away
 * with the page. It shares the header's max-w-6xl grid so the V2 chip sits on
 * the same left edge as the wordmark below it — part of the console, not a
 * toast. No amber anywhere in it: the strip hangs directly over the amber Pro
 * pill, and a gold banner there would announce a pricing event, not a version.
 * Its accent is --color-cool, the pitch trace's colour (see v2-glyph.tsx).
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
        className="relative border-b border-line"
      >
        <span
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cool to-transparent"
        />
        <div className="mx-auto flex h-10 w-full max-w-6xl items-center gap-3 px-4 sm:px-6">
          <V2TraceGlyph className="shrink-0 text-cool" />
          <span className="inline-block shrink-0 rounded border border-cool/40 bg-panel px-1.5 py-0.5 font-mono text-label uppercase tracking-[0.1em] text-cool">
            V2
          </span>
          <span className="hidden truncate text-meta text-mut sm:inline">
            The studio has been rebuilt.
          </span>
          <Link
            href="/changelog"
            className="truncate text-meta text-ink underline decoration-line2 underline-offset-4 transition-colors hover:decoration-ink"
          >
            See what we&apos;ve changed
          </Link>
          {/* The drawer-close pattern from nav.tsx: 44px square hit region
              around a small glyph, spent into the gutter so the 40px strip
              never grows. */}
          <button
            type="button"
            onClick={dismiss}
            aria-label="Dismiss the v2 announcement"
            className="relative -mr-2 ml-auto flex size-11 shrink-0 items-center justify-center rounded-full text-dim transition-colors after:absolute after:inset-0 hover:text-ink"
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
