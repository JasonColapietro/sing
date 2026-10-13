"use client";

import type { ReactElement } from "react";
import { SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";
import { Button } from "@/components/ui";
import { SING_APPEARANCE } from "@/lib/clerk-appearance";

/**
 * The header's and the drawer's account controls.
 *
 * Its own module, loaded with next/dynamic from components/nav.tsx, because it
 * is the nav's only use of Clerk's React SDK. The nav renders on every page;
 * with this split the nav itself no longer pulls Clerk into every page, and
 * this module loads only once accounts are live and the session has resolved.
 * (The provider is the other Clerk import; see
 * components/account/clerk-shell.tsx.)
 */

/** Neutral head-and-shoulders glyph, drawn to match the nav's MenuIcon line weight. */
function AccountIcon() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
      className="shrink-0"
    >
      <circle cx="8" cy="5.5" r="2.6" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M2.9 13.9c0-2.6 2.3-4.2 5.1-4.2s5.1 1.6 5.1 4.2"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

/**
 * The signed-out half of the account affordance.
 *
 * Two things it deliberately does not do. It passes no redirect URL, so the
 * modal closes onto whatever room the singer was already in — being thrown to
 * /progress mid-warmup would make a free offer feel like a detour. And it never
 * navigates to /sign-in: those pages exist for Clerk's own flows and for anyone
 * who lands on them, and a header control that leaves the page reads as a wall.
 *
 * Which modal opens follows what the browser holds. Someone with practice
 * behind them needs an account created; an empty browser is nearly always
 * someone returning to one they already have, which is exactly the person whose
 * backup is worth recovering. Both modals link to the other, so neither branch
 * is a dead end.
 */
function AccountOffer({
  earned,
  children,
}: {
  earned: boolean;
  /** A single element; Clerk clones it and hangs the modal off its onClick. */
  children: ReactElement;
}) {
  return earned ? (
    <SignUpButton mode="modal" appearance={SING_APPEARANCE}>
      {children}
    </SignUpButton>
  ) : (
    <SignInButton mode="modal" appearance={SING_APPEARANCE}>
      {children}
    </SignInButton>
  );
}

export default function NavAccount({
  placement,
  isSignedIn,
  worthSaving,
  onNavigate,
}: {
  placement: "drawer" | "header";
  isSignedIn: boolean;
  /** hasSomethingToSave(progress): the visitor has practice worth losing. */
  worthSaving: boolean;
  /** Closes the drawer when a control opens a modal over it. */
  onNavigate?: () => void;
}) {
  if (placement === "drawer") {
    return (
      <div className="px-4 pt-4">
        {isSignedIn ? (
          <UserButton
            appearance={SING_APPEARANCE}
            userProfileMode="modal"
            showName
          />
        ) : worthSaving ? (
          <>
            <p className="text-sm text-mut">
              This browser holds the only copy of your practice record. A
              free account keeps a backup.
            </p>
            <AccountOffer earned>
              <Button
                variant="outline"
                size="sm"
                className="mt-2.5"
                onClick={onNavigate}
              >
                Back up my progress
              </Button>
            </AccountOffer>
          </>
        ) : (
          <AccountOffer earned={false}>
            <button
              type="button"
              onClick={onNavigate}
              className="text-sm text-mut underline decoration-line2 underline-offset-4 transition-colors hover:text-ink hover:decoration-ink"
            >
              Sign in
            </button>
          </AccountOffer>
        )}
      </div>
    );
  }

  return isSignedIn ? (
    <span className="flex shrink-0 items-center">
      <UserButton appearance={SING_APPEARANCE} userProfileMode="modal" />
    </span>
  ) : (
    <AccountOffer earned={worthSaving}>
      <button
        type="button"
        // The glyph is neutral; the name carries the offer. It only
        // mentions the practice record once there is one, so a first
        // visit is never told what it stands to lose.
        aria-label={
          worthSaving ? "Sign in to back up your practice record" : "Sign in"
        }
        title={
          worthSaving ? "Sign in to back up your practice record" : "Sign in"
        }
        className="hidden size-7 shrink-0 items-center justify-center rounded-full border border-line text-mut transition-colors hover:border-line2 hover:text-ink sm:inline-flex"
      >
        <AccountIcon />
      </button>
    </AccountOffer>
  );
}
