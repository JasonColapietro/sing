"use client";

import { Suspense, useLayoutEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { PitchMeter } from "./pitch-meter";
import { RangeTest } from "./range-test";

export type VoiceTestMode = "pitch" | "range";

const MODES: { id: VoiceTestMode; label: string }[] = [
  { id: "pitch", label: "Pitch" },
  { id: "range", label: "Range test" },
];

/**
 * The voice test. It opens on a plain pitch measurement; the guided range test
 * is one tap away for anyone who chooses it, and `?mode=range` deep-links
 * straight to it. Singer comparison links predate the mode parameter, so a
 * comparison also opens the range test unless an explicit mode says otherwise.
 */
export function VoiceTest() {
  return (
    <Suspense fallback={<VoiceTestContent mode="pitch" />}>
      <VoiceTestFromLocation />
    </Suspense>
  );
}

export function voiceTestMode(params: Pick<URLSearchParams, "get"> | null): VoiceTestMode {
  const explicit = params?.get("mode");
  if (explicit === "pitch" || explicit === "range") return explicit;
  return params?.get("compare")?.trim() ? "range" : "pitch";
}

/** Keep the singer return path and any other query while changing modes. */
export function voiceTestModeUrl(href: string, mode: VoiceTestMode): URL {
  const url = new URL(href);
  url.searchParams.set("mode", mode);
  return url;
}

function scrollToStart() {
  document.getElementById("start")?.scrollIntoView({ block: "start" });
}

/**
 * Change modes, and when that opens the range test, bring its start button
 * into view. The intro tells a visitor to choose Range test, and on a 375px
 * phone the button it reveals would otherwise sit below the fold; #start
 * scrolls to just below the sticky header.
 * The pitch meter's "try the range test" link goes through here too.
 */
export function switchVoiceTestMode(
  current: VoiceTestMode,
  next: VoiceTestMode,
  onModeChange: (mode: VoiceTestMode) => void,
  scroll: () => void = scrollToStart,
) {
  onModeChange(next);
  if (next === "range" && current !== "range") scroll();
}

/** The page just before the live tree replaces the prerendered tool. */
export type BeforeSwap = { scrollY: number; toolBottom: number };

/**
 * What the page's scroll needs as the live voice test mounts: "start" to line
 * #start up again, a position to put back, or null to leave it alone.
 *
 * Both fix the same swap. The static HTML is the prerendered fallback, and
 * the live tree replaces that whole fallback, #start included. The browser
 * keeps the scroll anchored on content it had already laid out below the swap
 * (the room rail), so the page moves by however much taller the live tool is:
 * 20px at 768px and up for a new singer, and the whole saved-result card
 * (317px at 1280px) for a returning one.
 *
 * A full load of /range#start (a bookmark, the manifest's "Vocal range test"
 * shortcut, a link from another site) scrolls to the fallback's #start, so
 * the swap put the mode tabs under the sticky header, or left them and their
 * own Retake test above the screen. Lining up again as the live tree mounts,
 * before it paints, puts #start back where the fragment put it, and the
 * browser anchors on it from then on.
 *
 * A reload, or a Back or Forward that loads the document again, restores the
 * reader's own position instead, whatever the hash; lining #start up there
 * snapped a reader 400px down the result back to the tabs. The swap moves
 * that position too. One that was on the prerendered tool comes back as a
 * plain offset, which the shift overshoots (573 -> 890 at 1280px), so it is
 * put back. Further down Chrome may instead find the element that was at the
 * top of the screen in the fallback page and restore against it, landing the
 * swap's height short, and then the shift is what completes it (3854 ->
 * 4171); it cannot be told which happened, so anything past the prerendered
 * tool is left to the browser, as before. Navigation Timing says which load
 * this was; "prerender" and a browser without the entry are arrivals, like
 * "navigate". window.scrollY cannot tell them apart: the fragment jump has
 * already moved it by the time the live tree mounts, and a reader restored to
 * the top reads 0.
 *
 * Only a mount that replaced the fallback (`before` is null otherwise) moves
 * anything. A client-side mount keeps the document's navigation type but
 * swaps nothing: the router scrolls a link to #start itself, and Back is the
 * browser's to restore.
 */
export function mountScroll(
  hash: string,
  navigationType: NavigationTimingType | undefined,
  before: BeforeSwap | null,
): "start" | { restore: number } | null {
  if (!before) return null;
  if (navigationType === "reload" || navigationType === "back_forward") {
    return before.scrollY < before.toolBottom ? { restore: before.scrollY } : null;
  }
  return hash === "#start" ? "start" : null;
}

function documentNavigationType(): NavigationTimingType | undefined {
  const entry = performance.getEntriesByType?.("navigation")[0] as PerformanceNavigationTiming | undefined;
  return entry?.type;
}

/**
 * Read as the live tree renders, before its commit replaces the prerendered
 * tool (the one whose tabs are inert); null when there is none to replace.
 */
function readBeforeSwap(): BeforeSwap | null {
  if (typeof document === "undefined") return null;
  const tool = document.querySelector('#start [role="tab"]:disabled')?.closest("main");
  if (!tool) return null;
  return { scrollY: window.scrollY, toolBottom: tool.getBoundingClientRect().bottom + window.scrollY };
}

function VoiceTestFromLocation() {
  const params = useSearchParams();
  const mode = voiceTestMode(params);
  const [before] = useState(readBeforeSwap);
  useLayoutEffect(() => {
    const scroll = mountScroll(window.location.hash, documentNavigationType(), before);
    if (scroll === "start") scrollToStart();
    // Only if the swap moved it; otherwise there is nothing to undo.
    else if (scroll && window.scrollY !== scroll.restore) window.scrollTo(0, scroll.restore);
  }, [before]);
  const choose = (next: VoiceTestMode) => {
    window.history.replaceState(null, "", voiceTestModeUrl(window.location.href, next));
  };
  return <VoiceTestContent mode={mode} onModeChange={choose} />;
}

function VoiceTestContent({
  mode,
  onModeChange,
}: {
  mode: VoiceTestMode;
  onModeChange?: (mode: VoiceTestMode) => void;
}) {

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 sm:py-10">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl sm:text-5xl">
            Vocal range test &amp; pitch meter
          </h1>
          <p className="mt-2 max-w-prose text-mut">
            Find your vocal range in about two minutes: the range test listens
            as you slide down and up, then shows your lowest and highest notes,
            octave span and a voice-type estimate. Choose Range test to start,
            or Pitch to check a single note live.
          </p>
        </div>
        {/* #start is where "Start singing" links land: the tool is under
            the fold on a phone, and a singer who already pressed start should
            not have to scroll past the headline to find the button again.
            The page's scroll-padding-top (app/globals.css) already clears the
            sticky header; a scroll-mt here added 80px to it and pushed the
            start button that much further down a 375px phone's screen. */}
        <div
          id="start"
          role="tablist"
          aria-label="Voice test mode"
          className="inline-flex rounded-full border border-line bg-panel p-1"
        >
          {/* The tabs touch, so an outset ring crossed the selected tab's
              ink fill (2.48:1) and the control's border. Inset, the ring sits
              on the tab's own fill, and violet clears 3:1 on both the panel
              (4.07:1) and the ink (3.86:1). */}
          {MODES.map((m) => (
            <button
              key={m.id}
              type="button"
              role="tab"
              aria-selected={mode === m.id}
              onClick={() =>
                onModeChange && switchVoiceTestMode(mode, m.id, onModeChange)
              }
              disabled={!onModeChange}
              className={`min-h-11 rounded-full px-5 text-sm font-bold transition-colors focus-visible:-outline-offset-4 focus-visible:outline-violet ${
                mode === m.id ? "bg-ink text-bg" : "text-mut hover:text-ink"
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>
      {/* The Suspense fallback (mode "pitch", no onModeChange) renders the
          meter's cold mic card, not a one-line "Loading…". useSearchParams
          makes this boundary client-render, so the static HTML is the
          fallback; a line ~400px shorter than the card put the "More practice
          rooms" rail in a 375px phone's first frame, then hydration pushed it
          off screen (CLS 0.17 in e2e/cls.mjs). Same trade as the songs hub
          (components/songs/mic-gate.tsx): the box is the right size from the
          first paint and its button goes live a moment later. A ?mode=range
          link then swaps in the range test, a little taller, below the fold. */}
      {mode === "pitch" ? (
        <PitchMeter
          onTryRange={
            onModeChange &&
            // The range intro is shorter than the meter, so without the
            // scroll the singer is left scrolled past it.
            (() => switchVoiceTestMode("pitch", "range", onModeChange))
          }
        />
      ) : (
        <RangeTest embedded />
      )}
    </main>
  );
}
