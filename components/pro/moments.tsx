"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui";
import { ProChip } from "./ui";
import { useIsPro } from "@/lib/pro";
import { useProgress } from "@/lib/progress";
import { useModalFocus } from "@/lib/use-modal-focus";

const SEEN_KEY = "suede-sing:coach-intro:v1";

/**
 * One-time full-screen sales moment after the first completed result. It
 * reacts to the progress store, so the prompt arrives on the result screen
 * instead of waiting for a reload. Never fires for Pro members and never
 * repeats after dismissal; recurring selling happens in session summaries.
 */
export default function ProMoments() {
  const router = useRouter();
  const isPro = useIsPro();
  const progress = useProgress();
  const hasCompletedResult =
    progress.sessions.length > 0 || progress.rangeHistory.length > 0;
  const [show, setShow] = useState(false);
  const dismissedRef = useRef(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  useModalFocus(show && !isPro, dialogRef);

  useEffect(() => {
    try {
      if (isPro || show || dismissedRef.current || !hasCompletedResult) return;
      if (window.localStorage.getItem(SEEN_KEY)) return;
      // eslint-disable-next-line react-hooks/set-state-in-effect -- localStorage is client-only; opening after hydration avoids a server/client mismatch
      setShow(true);
    } catch {
      // storage unavailable — never show rather than show repeatedly
    }
  }, [hasCompletedResult, isPro, show]);

  const markSeen = () => {
    dismissedRef.current = true;
    try {
      window.localStorage.setItem(SEEN_KEY, new Date().toISOString());
    } catch {
      // ignore
    }
  };

  const dismiss = () => {
    markSeen();
    setShow(false);
  };

  useEffect(() => {
    if (!show || isPro) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") dismiss();
    };
    window.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPro, show]);

  const goPro = () => {
    markSeen();
    setShow(false);
    router.push("/pro#plans");
  };

  if (isPro || !show) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Dismiss"
        className="absolute inset-0 bg-ink/40"
        onClick={dismiss}
      />
      <div
        ref={dialogRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label="Go Pro"
        className="animate-fadeup relative max-h-[calc(100dvh-2rem)] w-full max-w-lg overflow-y-auto rounded-2xl border border-amber bg-panel p-6 sm:p-8"
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-amber-soft via-amber to-amber-soft"
        />
        <div className="flex items-center gap-2">
          <ProChip />
          <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-dim">
            Your result is in
          </span>
        </div>
        <h2 className="mt-4 text-2xl sm:text-3xl">Turn this result into a plan</h2>
        <p className="mt-3 text-sm text-mut sm:text-base">
          Suede Pro turns your numbers into tomorrow&apos;s practice: a daily
          plan, weak notes drilled on purpose, and your range charted as it
          grows.
        </p>
        <ul className="mt-4 space-y-2">
          {[
            "A practice plan that rebuilds itself every day",
            "Per-note accuracy and range history",
            "Pitch analysis on every recorded take",
          ].map((line) => (
            <li
              key={line}
              className="flex items-start gap-2.5 text-sm text-mut"
            >
              <span aria-hidden className="mt-0.5 font-mono text-amber-ink">
                ✓
              </span>
              {line}
            </li>
          ))}
        </ul>
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <Button variant="amber" size="md" onClick={goPro}>
            Go Pro — $9.99/month
          </Button>
          <Button variant="ghost" size="md" onClick={dismiss}>
            Not now
          </Button>
        </div>
        <p className="mt-4 font-mono text-[11px] uppercase tracking-[0.14em] text-dim">
          Cancel anytime in Stripe
          <span className="mx-2 text-line2">·</span>
          Review the plan next
        </p>
      </div>
    </div>
  );
}
