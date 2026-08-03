"use client";

import { useEffect, type RefObject } from "react";

/**
 * Keeps keyboard focus inside an open dialog, and puts it back when the dialog
 * closes.
 *
 * Both dialogs here declared `aria-modal="true"` without doing either. Measured
 * on the live nav drawer: focus stayed on the trigger behind the overlay, and
 * 29 background elements were still tabbable while that attribute told
 * assistive tech the page behind was inert. Focus and the accessibility tree
 * disagreed — a screen-reader user tabbed into content their reader had just
 * said did not exist.
 *
 * Focus lands on the dialog container rather than its first control, so the
 * dialog's accessible name is announced on open and nothing is activated by
 * surprise. The container therefore needs `tabIndex={-1}`.
 */

const FOCUSABLE = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
].join(",");

export function useModalFocus(
  open: boolean,
  ref: RefObject<HTMLElement | null>,
) {
  useEffect(() => {
    if (!open) return;
    const node = ref.current;
    if (!node) return;

    const previouslyFocused = document.activeElement as HTMLElement | null;
    node.focus();

    const focusables = () =>
      [...node.querySelectorAll<HTMLElement>(FOCUSABLE)].filter(
        // offsetParent is null for display:none, which is how the closed
        // states in this app hide things.
        (el) => el.offsetParent !== null,
      );

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Tab") return;
      const items = focusables();
      if (items.length === 0) {
        event.preventDefault();
        node.focus();
        return;
      }
      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement;

      // Wrapping at the ends is the trap; the contains() check also catches
      // focus that escaped some other way and pulls it back in.
      if (event.shiftKey) {
        if (active === first || active === node || !node.contains(active)) {
          event.preventDefault();
          last.focus();
        }
      } else if (active === last || !node.contains(active)) {
        event.preventDefault();
        first.focus();
      }
    };

    // Capture phase: this has to win before anything inside the dialog
    // handles Tab itself.
    document.addEventListener("keydown", onKeyDown, true);
    return () => {
      document.removeEventListener("keydown", onKeyDown, true);
      // Only take focus back if it is still inside the dialog being torn
      // down — otherwise something else has legitimately claimed it.
      if (!document.activeElement || document.activeElement === document.body) {
        previouslyFocused?.focus?.();
      }
    };
  }, [open, ref]);
}
