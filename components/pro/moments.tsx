"use client";

import { useEffect, useId, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui";
import { ProChip } from "./ui";
import { getProState, subscribePro } from "@/lib/pro";
import { proHeadline } from "@/lib/pro-shared";
import { getState as getProgressState } from "@/lib/progress";
import { PRO_MOMENT_SEEN_KEY as SEEN_KEY, subscribeProResult } from "@/lib/pro-signal";
import { useModalFocus } from "@/lib/use-modal-focus";

/**
 * One-time full-screen sales moment after a completed result (never a first
 * range test, never for Pro, never twice). It opens on the explicit result
 * signal (lib/pro-signal), not on store writes, and each refusal in `gate`
 * is deferrable: none writes the seen key, so a later result can still open.
 */
export default function ProMoments() {
  const router = useRouter();
  const pathname = usePathname();
  const [show, setShow] = useState(false);
  // Browser Back can bring an already-open result modal from /range here.
  // Clear that pending impression without marking it seen, so it can still
  // be offered after a later completed practice on an eligible route.
  if (show && (pathname === "/can-you-sing" || pathname.startsWith("/can-you-sing/"))) {
    setShow(false);
  }
  const dismissedRef = useRef(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  // The dialog is named by its heading and described by its first paragraph,
  // so a screen reader announces what is on screen rather than "Go Pro".
  const titleId = useId();
  const descId = useId();
  // Where focus goes when the modal closes and what had it is gone. The
  // result this follows usually took its own button with it (Continue, Back
  // to library), so focus had fallen to <body> and closing the modal left a
  // keyboard user at the top of the document. The page's content, the skip
  // link's target, is the next best place.
  const contentRef = useRef<HTMLElement | null>(null);
  useModalFocus(show, dialogRef, contentRef);

  useEffect(() => {
    // Set while a result waits for a full-screen results screen to let go of
    // the scroll lock (see the scroll-lock refusal below).
    let waiting: MutationObserver | null = null;
    // The frame the open is waiting on (see `settled` below); 0 when none.
    let frame = 0;
    const stopWaiting = () => {
      waiting?.disconnect();
      waiting = null;
    };
    const gate = (settled = false) => {
      try {
        if (dismissedRef.current) return;
        if (getProState().active) return;
        if (window.localStorage.getItem(SEEN_KEY)) return;
        const progress = getProgressState();
        if (progress.sessions.length === 0 && progress.rangeHistory.length === 0)
          return;
        // Fresh back from Stripe Checkout. app/api/checkout/route.ts:36-37
        // builds the return URLs that carry these markers, for the paid and
        // the cancelled path alike. Entitlement is still false here — the
        // confirm call lives in a later effect on the page itself — so the
        // getProState check above cannot catch this buyer.
        //
        // Reading the query synchronously is safe because ProMoments renders
        // before {children} in app/layout.tsx, so this mount effect runs
        // before the Pro page's own effect replaceState's the markers away.
        const q = new URLSearchParams(window.location.search);
        if (q.get("checkout") || q.get("session_id")) return;
        // Already on the page this modal sells. Exact segment, never a bare
        // prefix: /progress would match a prefix test and lose its modal.
        const p = window.location.pathname;
        if (p === "/pro" || p.startsWith("/pro/")) return;
        if (p === "/can-you-sing" || p.startsWith("/can-you-sing/")) return;
        // Mid sign-up or sign-in. A full-screen upsell dropped over an auth
        // form covers the exact thing the visitor navigated here to do, and
        // because the overlay is a button the first click aimed at the card
        // underneath dismisses this instead of landing. Someone reaching these
        // routes has a practice record and is trying to protect it, which is a
        // worse moment to interrupt than most and not one Pro needs to win.
        // Unlike /pro these are catch-all segments, so Clerk can push a further
        // step onto the path ("/sign-in/factor-one") and the match has to
        // travel with it.
        if (/^\/sign-(in|up)(\/|$)/.test(p)) return;
        // Another surface owns the scroll lock. Every ear game, warmup
        // routine and breath set ends on a full-screen results screen that
        // holds it, so declining outright dropped those results for good. Wait
        // for the lock to be let go (the singer closes the results), then run
        // the whole gate again; a lock that is never released, the stale case
        // this check exists for, simply never opens, as before. Play again
        // takes the lock straight back, so the wait carries on.
        if (document.body.style.overflow === "hidden") {
          if (!waiting && typeof MutationObserver !== "undefined") {
            waiting = new MutationObserver(() => {
              if (document.body.style.overflow === "hidden") return;
              stopWaiting();
              gate();
            });
            waiting.observe(document.body, { attributes: true, attributeFilter: ["style"] });
          }
          return;
        }
        stopWaiting();
        // Two frames on, then every check again. A results screen that just
        // let go of the lock hands the page back in that commit and the
        // effects after it: the room under it puts back its scroll and its
        // focus. Opened inside that commit, the modal locked the page first
        // and took <body> as the place to return focus to, so closing it
        // dropped a keyboard user at the top of the document.
        if (!settled) {
          if (frame) return;
          frame = requestAnimationFrame(() => {
            frame = requestAnimationFrame(() => {
              frame = 0;
              gate(true);
            });
          });
          return;
        }
        // Opening from an effect (rather than from render) is deliberate:
        // localStorage is client-only, so deciding after hydration is what
        // avoids a server/client mismatch. No `react-hooks/set-state-in-effect`
        // disable is needed now that this sits inside `gate` — adding one back
        // would only report as an unused directive.
        contentRef.current = document.getElementById("content");
        setShow(true);
      } catch {
        // storage unavailable — never show rather than show repeatedly
      }
    };
    // The mount pass is for /progress only: a returning singer hard-loading
    // their dashboard is looking at their results, which is what this sells.
    // On any other cold load (the homepage, a practice room) there is no
    // result on screen, and a dialog selling "this result" over it was an
    // interruption that claimed something false. Every later result signal
    // still runs the gate on any route. The early returns above skip OPENING,
    // never subscribing.
    if (window.location.pathname === "/progress") gate();
    const unsubscribe = subscribeProResult(() => gate());
    return () => {
      unsubscribe();
      stopWaiting();
      cancelAnimationFrame(frame);
    };
  }, []);

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

  // Pro can unlock in another tab while this is open (or in this one, on the
  // way back from Checkout). Close it rather than sell to a paying member.
  useEffect(() => {
    if (!show) return;
    return subscribePro(() => {
      if (!getProState().active) return;
      markSeen();
      setShow(false);
    });
  }, [show]);

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
    // The button states the price, so it lands on the card that sells at
    // that price, not on the top of the plans section.
    router.push("/pro#buy");
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
        ref={dialogRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descId}
        // outline-none: useModalFocus focuses the dialog itself, and the
        // global focus ring drew a red box around the whole card.
        className="animate-fadeup relative max-h-[calc(100dvh-2rem)] w-full max-w-lg overflow-y-auto rounded-2xl border border-violet bg-panel p-6 outline-none sm:p-8"
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-violet via-violet to-violet"
        />
        <div className="flex items-center gap-2">
          <ProChip />
          <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-dim">
            Result saved
          </span>
        </div>
        <h2 id={titleId} className="mt-4 text-2xl sm:text-3xl">
          Turn this result into a plan
        </h2>
        {/* The free plan shows two steps of the same plan; this sells the rest. */}
        <p id={descId} className="mt-3 text-sm text-mut sm:text-base">
          Pro reads results like this one and lays out what to sing next: the
          full daily plan, every step of it, with your accuracy note by note
          and your range tests charted over time.
        </p>
        <ul className="mt-4 space-y-2">
          {[
            "No daily limit on guided practice",
            "The coach's full daily plan: every step, built from your own scores.",
            "Both books in full, with PDFs to keep",
            "Pitch analysis on every recorded take",
          ].map((line) => (
            <li
              key={line}
              className="flex items-start gap-2.5 text-sm text-mut"
            >
              <span aria-hidden className="mt-0.5 font-mono text-violet-ink">
                ✓
              </span>
              {line}
            </li>
          ))}
        </ul>
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <Button variant="violet" size="md" onClick={goPro}>
            {`Go Pro: ${proHeadline()}`}
          </Button>
          <Button variant="ghost" size="md" onClick={dismiss}>
            Not now
          </Button>
        </div>
        <p className="mt-4 font-mono text-[11px] uppercase tracking-[0.14em] text-dim">
          One payment
          <span className="mx-2 text-line2">·</span>
          Never renews
          <span className="mx-2 text-line2">·</span>
          Voice stays on device
        </p>
      </div>
    </div>
  );
}
