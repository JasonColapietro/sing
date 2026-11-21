"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui";

/**
 * The buy button that follows a free visitor down /pro: a bar fixed to the
 * bottom of the window, shown only while no other buy button is on screen.
 *
 * Public surface: `BuyBar(props)`, `BUY_ANCHOR` (spread onto every buy button
 * and the buy card on the page), and `buyBarVisible` (the rule, for tests).
 *
 * Rules:
 * - The page decides `enabled`: purchase options showing, Pro not active, no
 *   payment being confirmed or awaiting confirmation, no welcome panel. This
 *   component never reads the entitlement itself.
 * - Nothing renders on the server or before the first observation: the bar
 *   mounts only once an IntersectionObserver has reported that every element
 *   marked BUY_ANCHOR is off screen. So it is never in the server HTML, never
 *   beside another buy button, and where IntersectionObserver is missing it
 *   never shows.
 * - While `enabled`, the document gets bottom padding the bar's height, for
 *   the whole time and not only while the bar shows, so the bar never covers
 *   the footer's last line and the page's length does not change as the bar
 *   comes and goes. Padding the end of the document moves nothing above it.
 * - It sits under the header (z-50) and every dialog (z-60 and up).
 */
export const BUY_ANCHOR = { "data-buy-anchor": "" } as const;
const ANCHOR_SELECTOR = "[data-buy-anchor]";

/** Bar height: a 44px button, 10px above and below, and the top border. */
const PAGE_PAD = "calc(4.0625rem + env(safe-area-inset-bottom, 0px))";

/** Shown only when allowed, observed at least once, and no buy button is on screen. */
export function buyBarVisible(enabled: boolean, anchorsOnScreen: number | null): boolean {
  return enabled && anchorsOnScreen === 0;
}

export function BuyBar({
  enabled,
  label,
  busy,
  error,
  onBuy,
  watchKey,
}: {
  enabled: boolean;
  /** The button's words, price included; the page builds them from PRICING. */
  label: string;
  /** A checkout is opening: the press is ignored, and the button says so. */
  busy: boolean;
  /** A checkout started from this bar that failed, said beside its button. */
  error: string | null;
  onBuy: () => void;
  /** Changes when the page's buy buttons do, so they are looked up again. */
  watchKey: string;
}) {
  // Null until the observer has reported: "not known" is not "none on screen".
  const [onScreen, setOnScreen] = useState<number | null>(null);

  useEffect(() => {
    if (!enabled || typeof IntersectionObserver === "undefined") return;
    const seen = new Map<Element, boolean>();
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) seen.set(entry.target, entry.isIntersecting);
      setOnScreen([...seen.values()].filter(Boolean).length);
    });
    for (const el of document.querySelectorAll(ANCHOR_SELECTOR)) observer.observe(el);
    return () => {
      observer.disconnect();
      setOnScreen(null);
    };
  }, [enabled, watchKey]);

  useEffect(() => {
    if (!enabled) return;
    const { body } = document;
    const before = body.style.paddingBottom;
    body.style.paddingBottom = PAGE_PAD;
    return () => {
      body.style.paddingBottom = before;
    };
  }, [enabled]);

  if (!buyBarVisible(enabled, onScreen)) return null;

  return (
    <div
      role="region"
      aria-label="Buy Suede Pro"
      className="motion-safe:animate-fadeup fixed inset-x-0 bottom-0 z-40 border-t border-line bg-bg pb-[env(safe-area-inset-bottom)]"
    >
      <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-x-4 gap-y-1 px-4 py-2.5 sm:px-6">
        {/* The button alone on a phone: the name beside it would squeeze the
            priced label onto two lines at 375px. */}
        <span className="hidden font-mono text-[11px] uppercase tracking-[0.14em] text-mut sm:inline">
          Suede Pro · lifetime
        </span>
        <Button
          variant="violet"
          size="md"
          className="w-full sm:w-auto"
          onClick={onBuy}
          aria-disabled={busy || undefined}
        >
          {busy ? "Opening Stripe…" : label}
        </Button>
        {error && (
          <p role="alert" className="w-full text-center text-sm text-rec sm:text-right">
            {error}
          </p>
        )}
      </div>
    </div>
  );
}
