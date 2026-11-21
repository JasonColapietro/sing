"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui";

/**
 * The buy button that follows a free visitor down /pro: a bar fixed to the
 * bottom of the window, shown only while no other buy button is on screen.
 *
 * Public surface: `BuyBar(props)`, `buyBarAllowed(state)` (the page's rule for
 * `enabled`), `BUY_ANCHOR` (spread onto every buy button and the buy card)
 * and `BAR_YIELD` (spread onto a form the bar must never cover).
 *
 * Rules:
 * - The page decides `enabled` with `buyBarAllowed`. This component never
 *   reads the entitlement itself.
 * - Nothing renders on the server or before the first observation: the bar
 *   mounts only once an IntersectionObserver has reported. So it is never in
 *   the server HTML, and where IntersectionObserver is missing it never
 *   shows.
 * - Once mounted it stays mounted, and hides by turning `inert` and
 *   invisible. It is never removed while something inside it has focus, and
 *   it stays on screen until that focus leaves.
 * - Its button is not a Tab stop (tabIndex -1). It repeats buttons that are
 *   already in the Tab order (the hero's, the card's, the last section's),
 *   and a stop that came and went with scrolling renumbered every control
 *   after it mid-walk: e2e/audits/50-keyboard.mjs then read the footer as
 *   already visited and reported its 36 links as unreachable. A pointer, a
 *   touch and a screen reader's cursor still reach it.
 * - It shows only while every BUY_ANCHOR and BAR_YIELD element is off screen
 *   and focus is in no form field: a fixed bar must not sit on the redeem or
 *   restore form, or over the on-screen keyboard's field.
 * - While `enabled`, the document gets bottom padding the bar's height, for
 *   the whole time and not only while the bar shows, so the bar never covers
 *   the footer's last line and the page's length does not change as the bar
 *   comes and goes; and the same scroll padding, so a control that focus or
 *   a jump scrolls to is not left behind the bar.
 * - It sits under the header (z-50) and every dialog (z-60 and up).
 */
export const BUY_ANCHOR = { "data-buy-anchor": "" } as const;
export const BAR_YIELD = { "data-bar-yield": "" } as const;
const WATCHED_SELECTOR = "[data-buy-anchor], [data-bar-yield]";
const FIELD_SELECTOR = "input, textarea, select, [contenteditable]";

/** Bar height: a 44px button, 10px above and below, and the top border. */
const PAGE_PAD = "calc(4.0625rem + env(safe-area-inset-bottom, 0px))";

/**
 * Whether /pro lets the bar follow this visitor: only someone who can buy and
 * has not. Never an owner, subscriber or pass holder, never while a payment
 * is being confirmed or has been taken but not confirmed (the card explains
 * that; a second priced button would invite a second charge), and never over
 * the welcome panel.
 */
export function buyBarAllowed(state: {
  /** The page is showing its purchase options. */
  purchasable: boolean;
  proActive: boolean;
  paidButUnconfirmed: boolean;
  justUpgraded: boolean;
  confirming: boolean;
}): boolean {
  return (
    state.purchasable &&
    !state.proActive &&
    !state.paidButUnconfirmed &&
    !state.justUpgraded &&
    !state.confirming
  );
}

const isField = (node: unknown): boolean =>
  typeof (node as Element | null)?.matches === "function" && (node as Element).matches(FIELD_SELECTOR);

export function BuyBar({
  enabled,
  label,
  busy,
  error,
  onBuy,
}: {
  enabled: boolean;
  /** The button's words, price included; the page builds them from PRICING. */
  label: string;
  /** A checkout is opening: the press is ignored, and the button says so. */
  busy: boolean;
  /** A checkout started from this bar that failed, said beside its button. */
  error: string | null;
  onBuy: () => void;
}) {
  // Null until the observer has reported: "not known" is not "none on screen".
  const [onScreen, setOnScreen] = useState<number | null>(null);
  const [fieldFocused, setFieldFocused] = useState(false);
  // Focus is inside the bar: it stays until that focus leaves.
  const [held, setHeld] = useState(false);

  useEffect(() => {
    if (!enabled || typeof IntersectionObserver === "undefined") return;
    const seen = new Map<Element, boolean>();
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) seen.set(entry.target, entry.isIntersecting);
      setOnScreen([...seen.values()].filter(Boolean).length);
    });
    for (const el of document.querySelectorAll(WATCHED_SELECTOR)) observer.observe(el);
    return () => {
      observer.disconnect();
      setOnScreen(null);
    };
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;
    const focusIn = (event: FocusEvent) => setFieldFocused(isField(event.target));
    // Leaving a field for nothing (the keyboard dismissed) frees the bar too.
    const focusOut = (event: FocusEvent) => setFieldFocused(isField(event.relatedTarget));
    document.addEventListener("focusin", focusIn);
    document.addEventListener("focusout", focusOut);
    return () => {
      document.removeEventListener("focusin", focusIn);
      document.removeEventListener("focusout", focusOut);
      setFieldFocused(false);
    };
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;
    const body = document.body.style;
    const root = document.documentElement.style;
    const before = { pad: body.paddingBottom, scroll: root.scrollPaddingBottom };
    body.paddingBottom = PAGE_PAD;
    root.scrollPaddingBottom = PAGE_PAD;
    return () => {
      body.paddingBottom = before.pad;
      root.scrollPaddingBottom = before.scroll;
    };
  }, [enabled]);

  if (!enabled || onScreen === null) return null;

  const shown = held || (onScreen === 0 && !fieldFocused);

  return (
    <div
      role="region"
      aria-label="Buy Suede Pro"
      inert={!shown}
      onFocus={() => setHeld(true)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setHeld(false);
      }}
      className={`fixed inset-x-0 bottom-0 z-40 border-t border-line bg-bg pb-[env(safe-area-inset-bottom)] ${
        shown ? "motion-safe:animate-fadeup" : "invisible"
      }`}
    >
      {/* The button alone, at every width: a name beside it squeezed the
          priced label onto two lines at 375px, and on a desktop sat under the
          window's fixed corner switch. */}
      <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-end gap-x-4 gap-y-1 px-4 py-2.5 sm:px-6">
        <Button
          variant="violet"
          size="md"
          className="w-full sm:w-auto"
          tabIndex={-1}
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
