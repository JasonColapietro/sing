"use client";

import { BREATH_FALLBACK_SEC } from "./routines";

/**
 * What a drill shows while it waits for the mic to hear a breath: a lamp that
 * lights while an inhale is being heard, and the way round it for a mic or a
 * room that does not carry one.
 *
 * The wording is deliberate. The mic hears the breath; it does not measure it.
 * Nothing here — or anywhere the gate reports — describes support, lung
 * capacity or the diaphragm, because a quiet nasal breath and a gasp are the
 * same event to the detector and the quiet one is often not heard at all.
 */
export function BreathGatePanel({
  inhaling,
  stale,
  onFallback,
}: {
  inhaling: boolean;
  /** Waited BREATH_FALLBACK_SEC with nothing heard: put the fallback first. */
  stale: boolean;
  onFallback: () => void;
}) {
  // Drawn only on the dark session surface, in its scoped tokens.
  const lampOn = "bg-[var(--s-ok)]";
  const lampOff = "bg-[var(--s-over)]";
  const muted = "text-[var(--s-mut)]";
  const lit = "text-[var(--s-ink)]";
  const primary = "bg-[var(--s-ok)] text-[oklch(0.15_0.02_155)] hover:brightness-110";
  const quiet =
    "border border-[var(--s-line2)] text-[var(--s-mut)] hover:bg-[var(--s-over)] hover:text-[var(--s-ink)]";

  return (
    <div className="flex w-full max-w-md flex-col items-center gap-3">
      <div
        className={`flex items-center gap-2 text-sm ${inhaling ? lit : muted}`}
        role="status"
        aria-live="polite"
        data-inhale={inhaling ? "heard" : "listening"}
      >
        <span
          aria-hidden="true"
          className={`h-2.5 w-2.5 rounded-full transition-colors ${inhaling ? lampOn : lampOff}`}
        />
        {inhaling ? "Inhale heard" : "Listening for your breath"}
      </div>
      {stale && (
        <p className={`max-w-sm text-center text-sm ${muted}`}>
          No breath heard in {BREATH_FALLBACK_SEC} seconds. Quiet breaths and
          some mics don&rsquo;t carry one. Start without breath detection and
          the timer runs on sound alone.
        </p>
      )}
      <button
        type="button"
        onClick={onFallback}
        className={`min-h-11 rounded-full px-6 text-sm font-medium transition-[filter,background-color,color] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--s-amber)] ${
          stale ? primary : quiet
        }`}
      >
        Start without breath detection
      </button>
    </div>
  );
}
