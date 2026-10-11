"use client";

import { Suspense } from "react";
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

function VoiceTestFromLocation() {
  const params = useSearchParams();
  const mode = voiceTestMode(params);
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
          <p className="mt-2 max-w-prose text-mut">
            {mode === "pitch"
              ? "Sing a comfortable note and see its detected pitch."
              : "A guided two-minute test: hold a comfortable note, slide down to your lowest, then up to your highest."}
          </p>
        </div>
        <div
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
              onClick={() => onModeChange?.(m.id)}
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
      {!onModeChange ? (
        <p className="py-8 text-sm text-mut" role="status">Loading voice tools…</p>
      ) : mode === "pitch" ? <PitchMeter /> : <RangeTest embedded />}
    </main>
  );
}
