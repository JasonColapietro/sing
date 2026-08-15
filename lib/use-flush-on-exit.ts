"use client";

import { useEffect, useRef } from "react";

/**
 * Runs `flush` whenever the page is going away, including every case React's
 * unmount cleanup never sees: a closed tab, a closed laptop, iOS Safari
 * discarding a backgrounded tab, a PWA swiped out of the app switcher.
 *
 * Both events are registered because neither alone is enough. `pagehide` is
 * what a desktop tab close fires; `visibilitychange` to hidden is the last
 * event mobile browsers guarantee before they may freeze or discard the page
 * without ever firing `pagehide`.
 *
 * That means `flush` runs more than once per session — once every time the
 * page is hidden, and again on unmount — so it has to be idempotent: a
 * second call with nothing left to record must be a no-op. Do not wire this
 * to a save path that logs unconditionally, or backgrounding the tab
 * mid-exercise will double-count it.
 *
 * `flush` is held in a ref so a caller passing a fresh closure each render
 * doesn't churn the listeners — or, worse, fire the cleanup flush on every
 * re-render.
 */
export function useFlushOnExit(flush: () => void): void {
  const flushRef = useRef(flush);
  useEffect(() => {
    flushRef.current = flush;
  }, [flush]);

  useEffect(() => {
    const run = () => flushRef.current();
    const onVisibility = () => {
      if (document.visibilityState === "hidden") run();
    };
    window.addEventListener("pagehide", run);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.removeEventListener("pagehide", run);
      document.removeEventListener("visibilitychange", onVisibility);
      run();
    };
  }, []);
}
