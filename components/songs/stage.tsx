"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useModalFocus } from "@/lib/use-modal-focus";

/**
 * True only while *this* module owns the browser's fullscreen. Leaving the
 * stage must never cancel a fullscreen something else put us in, and a
 * fullscreen we did not ask for must not close the stage when it ends.
 *
 * Module scope rather than a ref because it is written from a plain event
 * handler (see below) and read from an effect, and it is set synchronously
 * before any `fullscreenchange` can fire — so there is no race to lose.
 */
let stageOwnsFullscreen = false;

/**
 * Ask the browser for fullscreen. Call this *synchronously from the click or
 * keypress that opens the stage*, never from an effect: measured in Chromium,
 * requesting from a React effect fails with "API can only be initiated by a
 * user gesture", because React runs passive effects in a later task and
 * transient user activation does not survive the hop.
 *
 * That is also why the element being fullscreened is the document root rather
 * than the stage overlay — the overlay does not exist yet at gesture time. The
 * overlay is a `fixed` child of body either way, so it fills the fullscreen
 * viewport exactly as it fills the normal one.
 *
 * Missing (iOS Safari, which only fullscreens `<video>`) or refused: nothing
 * happens, and the overlay alone carries stage mode.
 */
export function requestStageFullscreen(): void {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  if (document.fullscreenElement || !root.requestFullscreen) return;
  stageOwnsFullscreen = true;
  void Promise.resolve(root.requestFullscreen()).catch(() => {
    stageOwnsFullscreen = false;
  });
}

/**
 * Stage mode: a full-viewport performance surface for the lyric band and the
 * score, with the rest of the app out of the way.
 *
 * Two layers of "full screen", deliberately:
 *
 *  1. A portaled `fixed inset-0` overlay. This one always works, and it is what
 *     the singer actually sees.
 *  2. The Fullscreen API underneath it, where the browser has it — which is why
 *     losing it (iOS Safari) costs nothing but the browser chrome.
 *
 * Portaled to document.body because the player sits inside the page shell's
 * centred, padded container, and a viewport-filling overlay should not depend
 * on that container's layout.
 *
 * Escape is *not* handled here — the player owns every keyboard shortcut, so the
 * "don't hijack keys while typing" rule lives in one place. What this component
 * does own is keeping the two layers in sync: when the browser drops fullscreen
 * on its own (its own Escape handling, focus loss, browser chrome) the stage
 * closes with it, so the singer is never left in a half state.
 */
export function Stage({
  open,
  onExit,
  label,
  children,
}: {
  open: boolean;
  onExit: () => void;
  /** Accessible name for the stage, e.g. the song title. */
  label: string;
  children: ReactNode;
}) {
  const panelRef = useRef<HTMLDivElement | null>(null);
  useModalFocus(open, panelRef);

  // Mirrored so the effect below depends only on `open`. The player re-renders
  // several times a second while singing, and an inline `onExit` in the dep list
  // would tear this listener down and rebuild it on every one of those renders.
  const onExitRef = useRef(onExit);
  useEffect(() => {
    onExitRef.current = onExit;
  }, [onExit]);

  useEffect(() => {
    if (!open) return;

    const onFullscreenChange = () => {
      if (stageOwnsFullscreen && !document.fullscreenElement) {
        stageOwnsFullscreen = false;
        onExitRef.current();
      }
    };
    document.addEventListener("fullscreenchange", onFullscreenChange);

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("fullscreenchange", onFullscreenChange);
      document.body.style.overflow = previousOverflow;
      // Clear the flag only on the branch that actually gives fullscreen back.
      // Clearing it unconditionally here looks tidier and is wrong: Strict Mode
      // double-invokes this effect, and that immediate throwaway cleanup wiped
      // the flag while the request was still in flight — measured, the browser
      // then stayed fullscreen after the singer left the stage. The request can
      // only have resolved by the time a *real* cleanup runs, which is why
      // testing `fullscreenElement` distinguishes the two.
      if (stageOwnsFullscreen && document.fullscreenElement) {
        stageOwnsFullscreen = false;
        void document.exitFullscreen?.().catch(() => {});
      }
    };
  }, [open]);

  // No mounted flag: `open` starts false, so the portal is never reached during
  // the server render and there is nothing to mismatch on hydration.
  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-[70] overflow-y-auto bg-bg">
      <div
        ref={panelRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={`${label} — stage mode`}
        className="mx-auto flex min-h-full w-full max-w-4xl flex-col gap-5 px-4 py-6 outline-none sm:px-8 sm:py-10"
      >
        {children}
      </div>
    </div>,
    document.body,
  );
}
