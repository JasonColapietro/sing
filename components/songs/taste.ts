"use client";

import { useSyncExternalStore } from "react";

import { reviveTaste, TASTE_KEY, type Taste, type TasteAnswers } from "@/lib/song-taste";
import { createLocalStore } from "./favorites";

/**
 * The onboarding quiz's answers, kept on this device only.
 *
 * Browse memory like favorites, not practice record: it stays out of
 * `lib/progress` so it never rides the Pro sync payload, and a corrupt value
 * costs a re-ask rather than anything the singer earned. `null` means the
 * quiz has never been answered or skipped here — the first-visit state.
 */
const taste = createLocalStore<Taste | null>(TASTE_KEY, null, reviveTaste);

export function useTaste(): Taste | null {
  return useSyncExternalStore(taste.subscribe, taste.get, taste.serverSnapshot);
}

export function saveTaste(answers: Omit<TasteAnswers, "kind" | "at">): void {
  taste.set({ kind: "answered", ...answers, at: new Date().toISOString() });
}

export function skipTaste(): void {
  taste.set({ kind: "skipped", at: new Date().toISOString() });
}
