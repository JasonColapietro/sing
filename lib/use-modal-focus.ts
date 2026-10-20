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

/**
 * Where focus goes back to when a dialog closes: the element that had it when
 * the dialog opened, while that element is still on the page. A dialog that
 * replaces the part of the page its trigger was in (songs stage mode) leaves
 * that element detached, or had focus fall to the body as it opened; then the
 * dialog's `fallback` takes it, when one is given, rather than the body.
 */
export function focusReturnTarget<T extends { isConnected: boolean }>(
  previous: T | null,
  fallback: T | null | undefined,
  body: unknown,
): T | null {
  if (previous && previous !== body && previous.isConnected) return previous;
  if (fallback && fallback.isConnected) return fallback;
  return previous && previous.isConnected ? previous : null;
}

export function useModalFocus(
  open: boolean,
  ref: RefObject<HTMLElement | null>,
  /** Where focus returns when the opener is gone by then; see focusReturnTarget. */
  fallbackRef?: RefObject<HTMLElement | null>,
) {
  useEffect(() => {
    if (!open) return;
    const node = ref.current;
    if (!node) return;

    const previouslyFocused = document.activeElement as HTMLElement | null;
    // Read when the dialog closes, not now: a fallback that replaces the
    // opener mounts while the dialog is up.
    const fallback = () => fallbackRef?.current ?? null;
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
        focusReturnTarget(previouslyFocused, fallback(), document.body)?.focus?.();
      }
    };
  }, [open, ref, fallbackRef]);
}
