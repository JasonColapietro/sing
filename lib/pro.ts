"use client";

import { useSyncExternalStore } from "react";

/**
 * Suede Pro — client-side entitlement state.
 *
 * Front-end only for now: `activatePro` flips a local flag so the whole
 * funnel (pricing page → upgrade → gold state everywhere) is demoable end
 * to end. Real checkout wiring replaces the body of `activatePro` later;
 * nothing else in the app should need to change.
 */

export type ProPlan = "monthly" | "annual";

export interface ProState {
  active: boolean;
  plan: ProPlan | null;
  /** ISO timestamp of activation. */
  since: string | null;
}

const KEY = "suede-sing:pro:v1";

const DEFAULT: ProState = { active: false, plan: null, since: null };

let cache: ProState | null = null;
const listeners = new Set<() => void>();
let storageBound = false;

function load(): ProState {
  if (cache) return cache;
  if (typeof window === "undefined") return DEFAULT;
  try {
    const raw = window.localStorage.getItem(KEY);
    cache = raw
      ? { ...DEFAULT, ...(JSON.parse(raw) as Partial<ProState>) }
      : { ...DEFAULT };
  } catch {
    cache = { ...DEFAULT };
  }
  return cache;
}

function emit() {
  for (const l of listeners) l();
}

function save(next: ProState) {
  cache = next;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // storage unavailable — keep the in-memory state
  }
  emit();
}

export function getProState(): ProState {
  return load();
}

export function subscribePro(cb: () => void): () => void {
  if (!storageBound && typeof window !== "undefined") {
    storageBound = true;
    window.addEventListener("storage", (e) => {
      if (e.key === KEY) {
        cache = null;
        emit();
      }
    });
  }
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export function useProState(): ProState {
  return useSyncExternalStore(subscribePro, getProState, () => DEFAULT);
}

export function useIsPro(): boolean {
  return useProState().active;
}

export function activatePro(plan: ProPlan): ProState {
  const next: ProState = {
    active: true,
    plan,
    since: new Date().toISOString(),
  };
  save(next);
  return next;
}

export function deactivatePro(): void {
  save({ ...DEFAULT });
}

/* ---------------------------------------------------------------- pricing */

export const PRICING = {
  monthly: { perMonth: 4, note: "billed monthly" },
  annual: { perMonth: 2.5, perYear: 30, note: "billed once a year", save: "save 38%" },
} as const;

/* ------------------------------------------------------------------ perks */

export interface ProPerk {
  id: string;
  title: string;
  desc: string;
}

export const PRO_PERKS: ProPerk[] = [
  {
    id: "coach",
    title: "Adaptive coach plan",
    desc: "A daily practice plan that reshapes itself around your scores, streak, and weak notes.",
  },
  {
    id: "analytics",
    title: "Deep vocal analytics",
    desc: "Per-note accuracy, range growth over time, and pitch heatmaps of every session.",
  },
  {
    id: "takes",
    title: "Take analysis + backup",
    desc: "A pitch overlay on every recorded take, and cloud backup so a cleared browser never eats a keeper.",
  },
  {
    id: "songs",
    title: "Full song library",
    desc: "The complete practice catalog, with new songs added every week.",
  },
  {
    id: "warmups",
    title: "Pro warmup packs",
    desc: "Genre and voice-type routines: belt prep, head-voice builders, morning resets.",
  },
  {
    id: "history",
    title: "Cloud sync",
    desc: "Progress that follows you across devices, backed up automatically — no export files.",
  },
];

/** Free-vs-Pro rows for the pricing comparison. */
export const PLAN_ROWS: Array<{
  label: string;
  free: string;
  pro: string;
}> = [
  { label: "Practice rooms (all nine)", free: "Included", pro: "Included" },
  { label: "Real-time pitch feedback", free: "Included", pro: "Included" },
  { label: "Range test + voice type", free: "Included", pro: "Included" },
  { label: "Take recorder + A/B compare", free: "Included", pro: "+ pitch analysis, cloud backup" },
  { label: "Song library", free: "Starter set", pro: "Full catalog, weekly drops" },
  { label: "Warmup routines", free: "Core set", pro: "Core + pro packs" },
  { label: "Coach plan", free: "Daily suggestion", pro: "Adaptive, score-aware" },
  { label: "Vocal analytics", free: "Session scores", pro: "Per-note, heatmaps, trends" },
  { label: "Range history", free: "Latest test", pro: "Every test, charted over time" },
  { label: "Practice history", free: "Last 20 sessions shown", pro: "Full history + trends" },
  { label: "Backup & sync", free: "Manual export file", pro: "Automatic cloud sync" },
];
