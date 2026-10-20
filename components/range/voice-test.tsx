"use client";

import { Suspense, useLayoutEffect } from "react";
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
 * phone the button it reveals would otherwise sit under the bottom tab bar.
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

/**
 * Whether a page that has just mounted the live voice test should line #start
 * up again, and does it.
 *
 * A full load of /range#start (a bookmark, the manifest's "Vocal range test"
 * shortcut, a link from another site) scrolls to the prerendered fallback's
 * #start, and then the live tree replaces that whole fallback, #start
 * included. The browser keeps the scroll anchored on content it had already
 * laid out below the swap (the room rail), so the page moved by however much
 * taller the live tool was: 20px at 768px and up for a new singer, which put
 * the mode tabs under the sticky header, and the whole saved-result card for
 * a returning one, which left the tabs and their own Retake test above the
 * screen. Lining up again as the live tree mounts, before it paints, puts
 * #start back where the fragment put it, and the browser anchors on it from
 * then on.
 */
export function alignStartOnMount(hash: string, scroll: () => void = scrollToStart): boolean {
  if (hash !== "#start") return false;
  scroll();
  return true;
}

function VoiceTestFromLocation() {
  const params = useSearchParams();
  const mode = voiceTestMode(params);
  useLayoutEffect(() => {
    alignStartOnMount(window.location.hash);
  }, []);
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
            sticky header; a scroll-mt here added 80px to it and left the start
            button under a 375px phone's tab bar. */}
        <div
          id="start"
          role="tablist"
          aria-label="Voice test mode"
          className="inline-flex rounded-full border border-line bg-panel p-1"
        >
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
              className={`min-h-11 rounded-full px-5 text-sm font-bold transition-colors ${
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
