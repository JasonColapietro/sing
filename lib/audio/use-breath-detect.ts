"use client";

import { useEffect, useState } from "react";
import { InhaleDetector, breathFeatures, type InhaleEvent } from "./breath-detect";
import type { UsePitchResult } from "./use-pitch";

export interface UseBreathDetectResult {
  /** A breath is being heard right now, for a live indicator. */
  inhaling: boolean;
  /**
   * The latest inhale heard, as a new object each time, so an effect keyed on
   * it runs once per breath. Timestamps are `performance.now()` milliseconds,
   * the same clock as `PitchFrame.t`.
   */
  lastInhale: InhaleEvent | null;
}

/**
 * Listens for the singer's inhale on the microphone a room already holds.
 *
 * Rides on `usePitch` rather than opening anything: the pitch loop hands each
 * frame's samples over through `subscribe`, and its own clarity reading comes
 * with them, so the only added work per frame is one 2048-point FFT. See
 * `breath-detect.ts` for what is and is not being heard.
 *
 * `enabled` starts a fresh detector, so the room floor is learned again each
 * time — a drill that switches detection off and on gets a detector that has
 * not been listening to whatever happened in between.
 */
export function useBreathDetect(
  pitch: Pick<UsePitchResult, "subscribe" | "listening">,
  enabled = true,
): UseBreathDetectResult {
  const [inhaling, setInhaling] = useState(false);
  const [lastInhale, setLastInhale] = useState<InhaleEvent | null>(null);
  const { subscribe, listening } = pitch;
  const on = enabled && listening;

  useEffect(() => {
    if (!on) return;
    const detector = new InhaleDetector();
    let was = false;
    const unsubscribe = subscribe((samples, sampleRate, frame) => {
      const update = detector.push(breathFeatures(samples, sampleRate, frame.clarity), frame.t);
      if (update.inhaling !== was) {
        was = update.inhaling;
        setInhaling(was);
      }
      if (update.inhale) setLastInhale(update.inhale);
      // Test hook for e2e/breath-gate.mjs, inert unless the harness created the
      // array before the page loaded — the same arrangement as the pitch probe.
      const probe = (window as { __singBreathProbe?: unknown[] }).__singBreathProbe;
      if (Array.isArray(probe) && (update.inhale || update.rejected)) {
        probe.push({ t: frame.t, inhale: update.inhale, rejected: update.rejected });
      }
    });
    return () => {
      unsubscribe();
      if (was) setInhaling(false);
    };
  }, [on, subscribe]);

  return { inhaling: on && inhaling, lastInhale };
}
