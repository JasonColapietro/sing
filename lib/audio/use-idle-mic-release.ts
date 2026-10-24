"use client";

import { useEffect } from "react";

/**
 * How long a room keeps the microphone open while the singer is not in a
 * session (a summary, the list, the library) before closing it.
 *
 * Closing it the moment a run ends turns the recording light off sooner, but
 * every next run then reopens the device, and a quick "Sing again" is the
 * most common next press. Reopening is not free: Firefox can ask for
 * permission again when a grant was not remembered and no track has been live
 * for a while, a Bluetooth headset switches profiles each way (about a second
 * of silence), and iOS moves the page between its record and playback audio
 * routes. Fifteen seconds covers reading a score and pressing again, and still
 * turns the light off soon after the singer stops.
 */
export const MIC_IDLE_RELEASE_MS = 15_000;

/**
 * Closes the microphone after `MIC_IDLE_RELEASE_MS` while it is open and
 * nothing holds it: a session in progress, a start waiting on the device, or
 * a screen that shows the input level. Any change to those restarts the wait.
 *
 * `window.__singMicReleaseMs`, when a page script sets it to a number before
 * load, replaces the delay. It exists for e2e/mic-release.mjs, which would
 * otherwise wait fifteen seconds per case; nothing in the app sets it.
 */
export function useIdleMicRelease({
  listening,
  hold,
  stop,
}: {
  listening: boolean;
  hold: boolean;
  stop: () => void;
}): void {
  useEffect(() => {
    if (!listening || hold) return;
    const override = (window as { __singMicReleaseMs?: unknown }).__singMicReleaseMs;
    const delay = typeof override === "number" && override >= 0 ? override : MIC_IDLE_RELEASE_MS;
    const id = window.setTimeout(stop, delay);
    return () => window.clearTimeout(id);
  }, [listening, hold, stop]);
}
