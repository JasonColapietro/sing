"use client";

import { useId, useSyncExternalStore } from "react";
import {SignInButton, SignUpButton} from "@clerk/nextjs";
import { useAccountAuth } from "@/lib/use-account-auth";
import { Button, Card, SectionLabel } from "@/components/ui";
import { accountsReady } from "@/lib/accounts";
import { useIsPro, useProReady } from "@/lib/pro";
import { useProgress, type ProgressState } from "@/lib/progress";

/**
 * Dismissed once, dismissed for good. A snooze would be kinder to the funnel
 * and worse for the singer: the offer is worth exactly one ask, and anyone who
 * declines it has told us what they think of it.
 */
const DISMISS_KEY = "suede-sing:account-prompt:v1";

/* ------------------------------------------------------- dismissal store */

/**
 * The dismissal flag is external state that lives in localStorage, so it is
 * read through useSyncExternalStore rather than copied into an effect. React
 * serves the server snapshot through hydration and re-reads immediately after,
 * which is what keeps the markup identical on both sides without ever guessing
 * "visible" first and flashing the card at someone who already waved it away.
 */
const listeners = new Set<() => void>();
let cache: boolean | null = null;
let storageBound = false;

function readDismissed(): boolean {
  if (cache !== null) return cache;
  if (typeof window === "undefined") return true;
  try {
    cache = Boolean(window.localStorage.getItem(DISMISS_KEY));
  } catch {
    // Storage blocked. Treat it as dismissed: a dismissal we cannot remember
    // means the card returns on every page, which is the nagging this key
    // exists to prevent.
    cache = true;
  }
  return cache;
}

/** Nothing is dismissed until the browser says so, and the server cannot ask. */
function serverDismissed(): boolean {
  return true;
}

function subscribeDismissed(cb: () => void): () => void {
  if (!storageBound && typeof window !== "undefined") {
    storageBound = true;
    // Waving the card away in one tab should settle it in the others too.
    window.addEventListener("storage", (e) => {
      if (e.key !== DISMISS_KEY) return;
      cache = null;
      for (const l of listeners) l();
    });
  }
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

function markDismissed(): void {
  cache = true;
  try {
    window.localStorage.setItem(DISMISS_KEY, new Date().toISOString());
  } catch {
    // ignore — the in-memory cache still hides it for this page session
  }
  for (const l of listeners) l();
}

/**
 * True once the visitor has practice worth losing.
 *
 * Deliberately independent of the caller's own trigger. A wiring mistake that
 * drops this on a cold page is a wall in disguise on a site whose entire funnel
 * is organic search, so the component refuses on its own evidence as well as
 * on the caller's. Recorded takes are covered by `sessions` — they land there
 * as type "recording" (lib/progress.ts ActivityType).
 */
export function hasSomethingToSave(s: ProgressState): boolean {
  return (
    s.sessions.length > 0 ||
    s.streak.current >= 2 ||
    s.range.lowMidi !== undefined
  );
}

/** House prose joins lists without the Oxford comma. */
function joinList(parts: string[]): string {
  if (parts.length <= 1) return parts[0] ?? "";
  return `${parts.slice(0, -1).join(", ")} and ${parts[parts.length - 1]}`;
}

/**
 * Names what is actually at stake, counted from the store rather than
 * described in the abstract. "The only copy of" rather than "these live in"
 * keeps the verb agreement out of the plural handling, and it happens to be
 * the more honest sentence: for a signed-out free user this browser really is
 * the only copy.
 */
function stakeSentence(s: ProgressState): string {
  const parts: string[] = [];
  const n = s.sessions.length;
  if (n > 0) parts.push(`${n} practice ${n === 1 ? "session" : "sessions"}`);
  if (s.streak.current >= 2) parts.push(`a ${s.streak.current}-day streak`);
  if (s.range.lowMidi !== undefined) parts.push("your measured range");
  return `This browser holds the only copy of ${joinList(parts)}.`;
}

/**
 * What the account actually buys, and deliberately nothing more. Continuous
 * multi-device sync is a Pro benefit; this sentence promises recovery from a
 * cleared browser and must never be widened into a sync claim.
 */
const PROMISE =
  "An account keeps a second copy, so clearing this browser doesn't put you back at zero.";

/**
 * Both sentences as one string, on purpose. Rendered as two JSX children the
 * space between them is eaten by JSX whitespace trimming ("range.An account"),
 * and a {" "} fix does not survive the formatter. One text node cannot lose it.
 */
function bodyCopy(s: ProgressState): string {
  return `${stakeSentence(s)} ${PROMISE}`;
}

/**
 * A quiet, earned offer to back up the practice record.
 *
 * Everything on this site works signed out and stays that way, so this is an
 * offer and never a gate. It is pitched below the Pro nudges on purpose: no
 * gold, no chip, no price. Pro is being sold; this is being mentioned.
 *
 * What it promises is bounded by what the free tier actually delivers, which
 * is a second copy of localStorage "suede-sing:progress:v1". Continuous
 * multi-device sync is a Pro benefit and this copy must never imply it.
 *
 * Four independent refusals, any one of which renders nothing:
 *
 * 1. Signed in. Nothing to offer someone who already took it. Also holds
 *    while Clerk is still loading, so a returning member never sees a flash
 *    of a pitch they already accepted.
 * 2. Pro. A Pro member's record is already syncing (ProSync in the layout),
 *    which makes "this browser holds the only copy" simply false for them.
 *    This is an accuracy refusal, not a courtesy one.
 * 3. Dismissed, per the localStorage-backed store above.
 * 4. Nothing at risk — the caller's `when`, and our own check.
 *
 * It is inline rather than a modal, so there is no scroll lock, no overlay and
 * no focus trap to escape from. The named <section> makes it one stop for a
 * screen reader's landmark list, which is also one stop to skip.
 */
export function AccountSavePrompt({
  when,
  context = "Your practice record",
  className = "",
}: {
  /**
   * The caller's moment: a session just logged, a take just finished, a range
   * test just landed. Callers own the timing because only they know what just
   * happened; this component owns the floor beneath it.
   */
  when: boolean;
  /** Mono tape label naming the moment, e.g. "Take saved". */
  context?: string;
  className?: string;
}) {
  const { isLoaded, isSignedIn } = useAccountAuth();
  const isPro = useIsPro();
  const proReady = useProReady();
  const progress = useProgress();
  const headingId = useId();
  const dismissed = useSyncExternalStore(
    subscribeDismissed,
    readDismissed,
    serverDismissed,
  );

  // Never offer an account this deployment cannot actually create. On a
  // development Clerk instance the sign-in completes and then every call comes
  // back 401, which is a worse experience than no offer at all.
  if (!accountsReady()) return null;
  if (!isLoaded || isSignedIn) return null;
  if (!proReady || isPro) return null;
  if (dismissed) return null;
  if (!when || !hasSomethingToSave(progress)) return null;

  return (
    <section aria-labelledby={headingId} className={className}>
      {/* animate-fadeup only: globals.css already collapses every animation
          under prefers-reduced-motion, so there is nothing to opt out of. */}
      <Card className="animate-fadeup">
        <SectionLabel>{context}</SectionLabel>
        <h2
          id={headingId}
          className="mt-3 font-display text-xl font-extrabold text-ink"
        >
          Keep a copy of your progress
        </h2>
        <p className="mt-1.5 max-w-xl text-sm text-mut">{bodyCopy(progress)}</p>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          {/* Explicit type on both: <button> defaults to submit, and this
              card is meant to be droppable anywhere, forms included. */}
          <SignUpButton mode="modal">
            <Button type="button" variant="outline" size="sm">
              Back up my progress
            </Button>
          </SignUpButton>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={markDismissed}
          >
            Not now
          </Button>
        </div>
        <p className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 font-mono text-[11px] uppercase tracking-[0.14em] text-dim">
          <span>Free</span>
          <span aria-hidden className="text-line2">
            ·
          </span>
          <span>Everything keeps working signed out</span>
          <span aria-hidden className="text-line2">
            ·
          </span>
          <SignInButton mode="modal">
            <button
              type="button"
              className="uppercase tracking-[0.14em] text-mut underline decoration-line2 underline-offset-4 hover:text-ink hover:decoration-ink"
            >
              Sign in
            </button>
          </SignInButton>
        </p>
      </Card>
    </section>
  );
}

export default AccountSavePrompt;
