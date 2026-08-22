"use client";

import { useId } from "react";
import {
  canChooseOutput,
  canListDevices,
  setInputDevice,
  setMonitoring,
  setOutputDevice,
  useAudioDevices,
  useAudioPrefs,
  type Monitoring,
} from "@/lib/audio/devices";

/**
 * Where the singer says what they are singing into, and what they are
 * listening through.
 *
 * Both halves fix a measurement problem rather than a preference one:
 *
 * The input half exists because the browser's default microphone is chosen by
 * the operating system and is routinely the worst one attached. A laptop with
 * an interface plugged in still defaults to the lid mic beside the fan; a
 * phone on earbuds routes through a speech mic that rolls off above 4 kHz.
 * Every score, and the range test in particular, is then a measurement of the
 * hardware rather than the voice — and the singer has no way to tell.
 *
 * The output half exists because the rooms play reference tones while the mic
 * is open. Through speakers the app hears itself, and a synthesised tone is a
 * cleaner pitch than any human voice, so it wins the detector outright. See
 * `lib/audio/mic.ts` for what the monitoring answer changes.
 */
export function AudioSetup({
  level,
  listening = false,
  className = "",
}: {
  /** Live input level, 0..~0.5, from the room's own analyser. */
  level?: number;
  listening?: boolean;
  className?: string;
}) {
  const { inputId, outputId, monitoring } = useAudioPrefs();
  const { inputs, outputs, needsPermission } = useAudioDevices();
  const inputSelectId = useId();
  const outputSelectId = useId();

  // Firefox and Safari have never shipped setSinkId, so the output row would
  // be a control that silently does nothing. The monitoring question still
  // matters there — it is about the room, not about routing — so only the
  // device list is withheld.
  const outputChoosable = canChooseOutput() && outputs.length > 0;

  if (!canListDevices()) return null;

  return (
    <details
      className={`group rounded-2xl border border-line bg-panel2/60 ${className}`}
    >
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 rounded-2xl px-4 py-3 text-sm text-mut outline-offset-2 hover:text-ink focus-visible:outline-2 focus-visible:outline-amber">
        <span className="flex items-center gap-2">
          <MicGlyph />
          Audio setup
        </span>
        <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-dim">
          {labelFor(inputs, inputId)}
          <span className="mx-1.5 text-line2">·</span>
          {monitoring === "speakers" ? "Speakers" : "Headphones"}
          <span aria-hidden className="ml-2 inline-block transition-transform group-open:rotate-180">
            ▾
          </span>
        </span>
      </summary>

      <div className="space-y-4 border-t border-line px-4 py-4">
        {/* --- input ------------------------------------------------------ */}
        <div>
          <label
            htmlFor={inputSelectId}
            className="block font-mono text-[11px] uppercase tracking-[0.14em] text-dim"
          >
            Microphone
          </label>
          <select
            id={inputSelectId}
            value={inputId}
            onChange={(e) => setInputDevice(e.target.value)}
            className="mt-1.5 w-full rounded-xl border border-line bg-panel px-3 py-2 text-sm text-ink outline-offset-2 focus-visible:outline-2 focus-visible:outline-amber"
          >
            <option value="">System default</option>
            {inputs.map((d) => (
              <option key={d.deviceId} value={d.deviceId}>
                {d.label}
              </option>
            ))}
          </select>
          <p className="mt-1.5 text-xs text-mut">
            {needsPermission
              ? "Enable the mic once and the list will fill in with real device names."
              : "Sing into a better mic than the one your laptop lid picked, and every score gets more honest."}
          </p>
        </div>

        {/* --- level ------------------------------------------------------ */}
        {listening && <LevelMeter level={level ?? 0} />}

        {/* --- monitoring ------------------------------------------------- */}
        <fieldset>
          <legend className="font-mono text-[11px] uppercase tracking-[0.14em] text-dim">
            I&rsquo;m listening through
          </legend>
          <div className="mt-1.5 grid gap-2 sm:grid-cols-2">
            <MonitorChoice
              value="headphones"
              current={monitoring}
              title="Headphones"
              note="Best accuracy. Nothing leaks back into the mic."
            />
            <MonitorChoice
              value="speakers"
              current={monitoring}
              title="Speakers"
              note="Filters the app's own sound out, so it can't score itself."
            />
          </div>
        </fieldset>

        {/* --- output ----------------------------------------------------- */}
        {outputChoosable && (
          <div>
            <label
              htmlFor={outputSelectId}
              className="block font-mono text-[11px] uppercase tracking-[0.14em] text-dim"
            >
              Play sound out of
            </label>
            <select
              id={outputSelectId}
              value={outputId}
              onChange={(e) => setOutputDevice(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-line bg-panel px-3 py-2 text-sm text-ink outline-offset-2 focus-visible:outline-2 focus-visible:outline-amber"
            >
              <option value="">System default</option>
              {outputs.map((d) => (
                <option key={d.deviceId} value={d.deviceId}>
                  {d.label}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>
    </details>
  );
}

/** The summary line needs a name for the current input before the list loads. */
function labelFor(
  inputs: Array<{ deviceId: string; label: string }>,
  id: string,
): string {
  if (!id) return "Default mic";
  const found = inputs.find((d) => d.deviceId === id);
  return found ? found.label : "Chosen mic";
}

function MonitorChoice({
  value,
  current,
  title,
  note,
}: {
  value: Monitoring;
  current: Monitoring;
  title: string;
  note: string;
}) {
  const selected = current === value;
  return (
    <label
      className={`cursor-pointer rounded-xl border p-3 transition-colors ${
        selected
          ? "border-amber/60 bg-amber/10"
          : "border-line bg-panel hover:border-amber/40"
      }`}
    >
      <span className="flex items-center gap-2">
        <input
          type="radio"
          name="suede-monitoring"
          value={value}
          checked={selected}
          onChange={() => setMonitoring(value)}
          className="accent-[var(--color-amber)]"
        />
        <span className="text-sm text-ink">{title}</span>
      </span>
      <span className="mt-1 block text-xs text-mut">{note}</span>
    </label>
  );
}

/**
 * A live input level, so "the app isn't hearing me" stops being a guess.
 *
 * RMS is scaled against 0.25 rather than 1.0: a voice at a sane distance from
 * a mic sits around 0.05–0.2, so a meter drawn on the raw range never leaves
 * the first tenth of its track and reads as broken.
 */
function LevelMeter({ level }: { level: number }) {
  const pct = Math.min(100, Math.round((level / 0.25) * 100));
  const silent = pct < 4;
  return (
    <div>
      <div className="flex items-baseline justify-between">
        <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-dim">
          Input level
        </span>
        {silent && (
          <span className="text-xs text-mut">Not hearing anything yet</span>
        )}
      </div>
      <div
        className="mt-1.5 h-2 overflow-hidden rounded-full bg-panel"
        role="meter"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Microphone input level"
      >
        <div
          className={`h-full rounded-full transition-[width] duration-75 ${
            pct > 92 ? "bg-rec" : "bg-amber"
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function MicGlyph() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
    >
      <rect x="9" y="3" width="6" height="11" rx="3" />
      <path d="M5 11a7 7 0 0 0 14 0M12 18v3" />
    </svg>
  );
}
