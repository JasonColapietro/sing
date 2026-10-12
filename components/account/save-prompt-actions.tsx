"use client";

import { SignInButton, SignUpButton } from "@clerk/nextjs";
import { Button } from "@/components/ui";

/**
 * The account offer's buttons, the save prompt's only use of Clerk.
 *
 * A module of its own, loaded with next/dynamic by save-prompt.tsx, so the
 * rooms that mount the prompt (/progress, the recorder) do not download
 * Clerk's React SDK on a deployment where accounts are off and only the
 * file-backup card can render.
 */
export default function SavePromptAccountActions({
  onDismiss,
}: {
  onDismiss: () => void;
}) {
  return (
    <>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        {/* Explicit type on both: <button> defaults to submit, and this
            card is meant to be droppable anywhere, forms included. */}
        <SignUpButton mode="modal">
          <Button type="button" variant="outline" size="sm">
            Back up my progress
          </Button>
        </SignUpButton>
        <Button type="button" variant="ghost" size="sm" onClick={onDismiss}>
          Not now
        </Button>
      </div>
      <p className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 font-mono text-[11px] uppercase tracking-[0.14em] text-dim">
        <span>Free</span>
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
    </>
  );
}
