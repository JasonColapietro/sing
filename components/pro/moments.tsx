"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui";
import { ProChip } from "./ui";
import { getProState, subscribePro } from "@/lib/pro";
import { proHeadline } from "@/lib/pro-shared";
import { getState as getProgressState } from "@/lib/progress";
import { subscribeProResult } from "@/lib/pro-signal";
import { useModalFocus } from "@/lib/use-modal-focus";

const SEEN_KEY = "suede-sing:coach-intro:v1";

/**
 * One-time full-screen sales moment after the first completed result. Never
 * fires for Pro members and never repeats after dismissal; recurring selling
 * happens in session summaries.
 *
 * It cannot interrupt an exercise in progress, because it listens for an
 * explicit "a result is on screen" signal (`lib/pro-signal`) rather than
 * subscribing to the progress store. The store fires on every write — XP
 * banked mid-drill, a cross-tab `storage` sync — so a store subscription
 * could drop a full-screen modal over someone who was still singing, or over
 * a second tab that never saw a result at all. Entitlement and progress are
 * read synchronously instead, since both stores hand back their DEFAULT
 * snapshot on the server and the hook forms would flip false->true after
 * hydration on every route.
 *
 * Four refusals guard the open. All are deferrable, not terminal: none sets
 * a flag and none writes the seen key, so the next result signal re-runs the
 * gate and can still open.
 *
 * 1. Checkout return. Stripe sends buyers back to a URL carrying `checkout`
 *    and `session_id` query markers (see app/api/checkout/route.ts:36-37).
 *    On that hard load the entitlement is not live yet — the confirm call
 *    runs in a later effect — so a customer who just paid would be read as
 *    free and sold to. Worse, the resulting Pro unlock auto-closes the modal
 *    and burns their one lifetime impression. Refusing on the markers
 *    themselves keeps the guard tied to the incident rather than to a URL
 *    that may move.
 *
 * 2. The Pro page itself. A full-screen modal whose only CTA pushes to
 *    /pro#plans has nothing to offer someone already reading that page. The
 *    test is exact-segment on purpose: a bare prefix match would also swallow
 *    /progress, which is precisely the page a returning free user with logged
 *    sessions is most likely to hard-load — the cohort the mount pass exists
 *    to reach.
 *
 * 3. The sign-in and sign-up routes. A full-screen upsell over an auth form
 *    hides the form, and its overlay eats the first click meant for the card
 *    beneath it. Prefix-matched, unlike /pro: both are catch-all segments and
 *    Clerk pushes further steps onto the path as the flow advances.
 *
 * 4. Scroll lock. If the body overflow slot is already taken, the modal
 *    declines to open. The check on the mount pass is a documented no-op —
 *    ProMoments renders before {children} in app/layout.tsx, so the slot
 *    reads "" at mount essentially always — and is kept only for symmetry
 *    with the emit pass. The state it actually defends is a non-empty slot at
 *    *emit* time, left stale by the cooperative save/restore of that one slot
 *    across components/nav.tsx and components/songs/stage.tsx.
 */
export default function ProMoments() {
  const router = useRouter();
  const [show, setShow] = useState(false);
  const dismissedRef = useRef(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  useModalFocus(show, dialogRef);

  useEffect(() => {
    const gate = () => {
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
        // Another surface owns the scroll lock. Decline this pass and leave
        // every flag untouched so a later result can still open.
        if (document.body.style.overflow === "hidden") return;
        // Opening from an effect (rather than from render) is deliberate:
        // localStorage is client-only, so deciding after hydration is what
        // avoids a server/client mismatch. No `react-hooks/set-state-in-effect`
        // disable is needed now that this sits inside `gate` — adding one back
        // would only report as an unused directive.
        setShow(true);
      } catch {
        // storage unavailable — never show rather than show repeatedly
      }
    };
    // Runs once for a result that landed before this mount, then on every
    // later one. The early returns above skip OPENING, never subscribing.
    gate();
    return subscribeProResult(gate);
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
    router.push("/pro#plans");
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
            {`Go Pro — ${proHeadline()}`}
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
