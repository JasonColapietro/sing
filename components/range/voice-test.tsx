"use client";

import { useEffect, useState } from "react";
import { PitchMeter } from "./pitch-meter";
import { RangeTest } from "./range-test";

type Mode = "pitch" | "range";

const MODES: { id: Mode; label: string }[] = [
  { id: "pitch", label: "Pitch" },
  { id: "range", label: "Range test" },
];

/**
 * The voice test. It opens on a plain pitch measurement; the guided range test
 * is one tap away for anyone who chooses it, and `?mode=range` deep-links
 * straight to it so old links and search snippets about the range test land on
 * the thing they promised.
 */
export function VoiceTest() {
  const [mode, setMode] = useState<Mode>("pitch");

  useEffect(() => {
    const q = new URLSearchParams(window.location.search).get("mode");
    // eslint-disable-next-line react-hooks/set-state-in-effect -- read once from the URL after hydration
    if (q === "range") setMode("range");
  }, []);

  const choose = (m: Mode) => {
    setMode(m);
    const url = new URL(window.location.href);
    if (m === "range") url.searchParams.set("mode", "range");
    else url.searchParams.delete("mode");
    window.history.replaceState(null, "", url);
  };

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 sm:py-10">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl sm:text-5xl">
            {mode === "pitch" ? "Pitch meter" : "Vocal range test"}
          </h1>
          <p className="mt-2 max-w-prose text-mut">
            {mode === "pitch"
              ? "Sing any note and see exactly where it lands."
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
              onClick={() => choose(m.id)}
              className={`min-h-11 rounded-full px-5 text-sm font-bold transition-colors ${
                mode === m.id ? "bg-ink text-bg" : "text-mut hover:text-ink"
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>
      {mode === "pitch" ? <PitchMeter /> : <RangeTest embedded />}
    </main>
  );
}
