"use client";

import { useEffect, useRef } from "react";
import { emitProResult } from "./pro-signal";

/**
 * Announces a completed result when the singer leaves it, for a result that
 * sits in the page rather than on a full-screen results screen.
 *
 * A full-screen results screen holds the scroll lock, and the one-time Pro
 * moment (components/pro/moments.tsx) waits for it to be let go, so the
 * singer reads the result before anything covers it. A result in the page
 * holds no lock, so a signal sent as it appeared opened the modal over a
 * score nobody had read yet. Sent on the way out instead (the result
 * unmounts, or `active` turns false), the modal follows the result here as it
 * does everywhere else.
 *
 * Deferred a tick, so a route change has already moved the address the
 * moment's gate reads (/pro, sign-in). Not sent when the way out was straight
 * into another session, which takes the scroll lock: that session ends on a
 * result of its own, and the modal waiting on the lock would otherwise open
 * over it the moment it appeared. A timer left by React's development-only
 * rehearsal unmount is cleared when the effect runs again, so the rehearsal
 * sends nothing.
 */
export function useProResultOnLeave(active: boolean): void {
  const pending = useRef<number | null>(null);
  useEffect(() => {
    if (!active) return;
    if (pending.current !== null) {
      window.clearTimeout(pending.current);
      pending.current = null;
    }
    return () => {
      pending.current = window.setTimeout(() => {
        pending.current = null;
        if (document.body.style.overflow === "hidden") return;
        emitProResult();
      }, 0);
    };
  }, [active]);
}
