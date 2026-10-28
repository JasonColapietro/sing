"use client";

import { useCallback, useMemo } from "react";
import type { FreeCap } from "@/lib/free-cap";

/** Why a start is unavailable once today's free guided minutes are used. */
export const CAPPED_REASON =
  "Free practice is used for today. It resets at midnight; the free studio is still open.";

/** Bring the cap wall (`id="free-cap"`) into view: a capped tap lands on the reason, not on nothing. */
export function showCapWall() {
  document.getElementById("free-cap")?.scrollIntoView({ behavior: "smooth", block: "center" });
}

/**
 * Every way into a session, guarded by the free cap: `guard(fn)` runs `fn`
 * while the allowance is open and scrolls to the wall once it is spent, and
 * `reason` is the sentence a disabled start explains itself with.
 */
export function useCappedStart(cap: FreeCap): {
  guard: <A extends unknown[]>(fn: (...args: A) => void) => (...args: A) => void;
  showWall: () => void;
  reason: string | undefined;
} {
  const capped = cap.capped;
  const guard = useCallback(
    <A extends unknown[]>(fn: (...args: A) => void) =>
      (...args: A) => {
        if (capped) {
          showCapWall();
          return;
        }
        fn(...args);
      },
    [capped],
  );
  return useMemo(
    () => ({ guard, showWall: showCapWall, reason: capped ? CAPPED_REASON : undefined }),
    [guard, capped],
  );
}
