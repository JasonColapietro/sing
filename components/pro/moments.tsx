"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui";
import { ProChip } from "./ui";
import { getProState } from "@/lib/pro";
import { getState } from "@/lib/progress";

const SEEN_KEY = "suede-sing:coach-intro:v1";

/**
 * One-time full-screen gold moment: shown on the first page load after a
 * singer has logged three sessions — the point where the habit signal is
 * real. Never repeats, never fires for Pro members, and only triggers on
 * mount so it can't interrupt an exercise in progress.
 */
export default function ProMoments() {
  const router = useRouter();
  const [show, setShow] = useState(false);

  useEffect(() => {
    try {
      if (getProState().active) return;
      if (window.localStorage.getItem(SEEN_KEY)) return;
      if (getState().sessions.length < 3) return;
      // eslint-disable-next-line react-hooks/set-state-in-effect -- mount-only client gate reading localStorage after hydration; not derivable during render without a hydration mismatch
      setShow(true);
    } catch {
      // storage unavailable — never show rather than show repeatedly
    }
  }, []);

  const markSeen = () => {
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
    if (!show) return;
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
  }, [show]);

  const goPro = () => {
    markSeen();
    setShow(false);
    router.push("/pro");
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Dismiss"
        className="absolute inset-0 bg-ink/40"
        onClick={dismiss}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Meet your coach"
        className="animate-fadeup relative w-full max-w-lg overflow-hidden rounded-2xl border border-amber bg-panel p-6 sm:p-8"
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-amber-soft via-amber to-amber-soft"
        />
        <div className="flex items-center gap-2">
          <ProChip />
          <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-dim">
            After session three
          </span>
        </div>
        <h2 className="mt-4 text-2xl sm:text-3xl">Meet your coach</h2>
        <p className="mt-3 text-sm text-mut sm:text-base">
          Three sessions in — you&apos;re past kicking the tires. This is
          where a coach takes over: a daily plan built from your numbers,
          weak notes drilled on purpose, and your range charted as it grows.
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
          <Button variant="amber" size="md" onClick={goPro} autoFocus>
            See Suede Pro — from $2.50/mo
          </Button>
          <Button variant="ghost" size="md" onClick={dismiss}>
            Keep it free
          </Button>
        </div>
        <p className="mt-4 font-mono text-[11px] uppercase tracking-[0.14em] text-dim">
          Founding price, locked for life<span className="mx-2 text-line2">·</span>
          Free stays free
        </p>
      </div>
    </div>
  );
}
