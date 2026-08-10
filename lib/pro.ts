"use client";

import { useSyncExternalStore } from "react";
import { INACTIVE, type Entitlement, type ProPlan } from "./pro-shared";

export type { ProPlan, Entitlement };

/**
 * Suede Pro — entitlement on the client.
 *
 * There are no accounts and no database: Stripe is the source of truth, and
 * this store is a local cache of what Stripe last said. That means it can go
 * stale (someone cancels in the portal), so `revalidatePro` re-checks on a
 * schedule, and `restorePro` recovers access on a new device or a cleared
 * browser.
 */

export interface ProState extends Entitlement {
  /** ISO timestamp of when Pro first unlocked on this device. */
  since: string | null;
  /** ISO timestamp of the last successful check against Stripe. */
  lastVerified: string | null;
}

/** v2: v1 held a local-only flag from before checkout existed. */
const KEY = "suede-sing:pro:v2";

const DEFAULT: ProState = { ...INACTIVE, since: null, lastVerified: null };

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

/* ------------------------------------------------------------------ stripe */

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(path, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = (await res.json().catch(() => null)) as
    | (T & { error?: string })
    | null;
  if (!res.ok) {
    throw new Error(data?.error ?? "Something went wrong. Try again.");
  }
  if (!data) throw new Error("Stripe sent back an empty response.");
  return data;
}

function apply(entitlement: Entitlement): ProState {
  const prev = load();
  const next: ProState = {
    ...entitlement,
    since: entitlement.active
      ? (prev.since ?? new Date().toISOString())
      : null,
    lastVerified: new Date().toISOString(),
  };
  save(next);
  return next;
}

/** Hands the singer off to Stripe Checkout. Only returns if the redirect fails. */
export async function startCheckout(plan: ProPlan): Promise<void> {
  const { url } = await post<{ url: string }>("/api/checkout", { plan });
  window.location.href = url;
}

/** Confirms a finished Checkout Session and unlocks Pro on this device. */
export async function confirmCheckout(sessionId: string): Promise<ProState> {
  return apply(await post<Entitlement>("/api/entitlement", { sessionId }));
}

const REVALIDATE_AFTER_MS = 12 * 60 * 60 * 1000;

/**
 * Re-checks the subscription against Stripe so a cancellation or a failed
 * payment takes effect here. Network failures leave the current state alone
 * rather than locking out someone who is paying.
 */
export async function revalidatePro({ force = false } = {}): Promise<void> {
  const state = load();
  if (!state.subscriptionId) return;
  if (
    !force &&
    state.lastVerified &&
    Date.now() - Date.parse(state.lastVerified) < REVALIDATE_AFTER_MS
  ) {
    return;
  }
  try {
    apply(
      await post<Entitlement>("/api/entitlement", {
        subscriptionId: state.subscriptionId,
      }),
    );
  } catch {
    // offline or Stripe hiccup — try again next load
  }
}

/**
 * Recovers Pro on a new device from the subscriber's Pro key. Restoring by
 * email was removed: it let anyone who knew a subscriber's address unlock Pro,
 * and it leaked who was subscribed.
 */
export async function restorePro(key: string): Promise<ProState> {
  const result = await post<Entitlement & { error?: string }>("/api/restore", {
    key: key.trim(),
  });
  const state = apply(result);
  if (!result.active) {
    throw new Error(result.error ?? "That Pro key didn't unlock anything.");
  }
  return state;
}

/**
 * Redeems a comp code for a 30-day pass. The pass is an ordinary Stripe
 * subscription in its trial, so everything downstream — the Pro key, revalidation,
 * expiry — behaves exactly as it does for a paying subscriber.
 */
export async function redeemCode(code: string): Promise<ProState> {
  const result = await post<Entitlement & { error?: string }>("/api/redeem", {
    code: code.trim(),
  });
  const state = apply(result);
  if (!result.active) {
    throw new Error(result.error ?? "That code didn't unlock anything.");
  }
  return state;
}

/** Sends the singer to Stripe's billing portal to cancel or update a card. */
export async function openBillingPortal(): Promise<void> {
  const { customerId, subscriptionId } = load();
  if (!customerId || !subscriptionId) {
    throw new Error("No subscription found on this device.");
  }
  const { url } = await post<{ url: string }>("/api/portal", {
    customerId,
    subscriptionId,
  });
  window.location.href = url;
}

/** Forgets Pro on this device only. Does not touch the Stripe subscription. */
export function clearProLocally(): void {
  save({ ...DEFAULT });
}

/* ---------------------------------------------------------------- pricing */

/**
 * One tier, monthly only. Must match the live Stripe price carrying the
 * `suede_pro_monthly` lookup key — the app resolves the id at request time, so
 * this constant is display copy and nothing else.
 */
export const PRICING = {
  monthly: { perMonth: 9.99, note: "billed monthly" },
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
    title: "Take pitch analysis",
    desc: "A pitch trace of every recorded take, and an A/B overlay that shows which keeper actually sat in tune.",
  },
  {
    id: "songs",
    title: "Full song library",
    desc: "The complete practice catalog across styles, ranges, and skill levels.",
  },
  {
    id: "warmups",
    title: "Pro warmup packs",
    desc: "Genre and voice-type routines: belt prep, head-voice builders, morning resets.",
  },
  {
    id: "book",
    title: "Two books, with PDFs",
    desc: "The Measured Voice has 23 chapters on how the voice works and a twelve-week program. The Voice Atlas is its famous-voices companion. Both are in the app and available as PDFs.",
  },
  {
    id: "history",
    title: "Cloud sync",
    desc: "Progress that follows you across devices and backs up automatically, with no export step.",
  },
];

/** Free-vs-Pro rows for the pricing comparison. */
export const PLAN_ROWS: Array<{
  label: string;
  free: string;
  pro: string;
}> = [
  { label: "Practice rooms (all ten)", free: "Included", pro: "Included" },
  { label: "Real-time pitch feedback", free: "Included", pro: "Included" },
  { label: "Range test + voice type", free: "Included", pro: "Included" },
  { label: "Take recorder + A/B compare", free: "Included", pro: "+ pitch analysis on every take" },
  { label: "Song library", free: "Starter set", pro: "Full catalog" },
  { label: "Warmup routines", free: "Core set", pro: "Core + pro packs" },
  { label: "Coach plan", free: "First step each day", pro: "Full adaptive plan, daily" },
  { label: "Vocal analytics", free: "Session scores", pro: "Per-note, heatmaps, trends" },
  { label: "Range history", free: "Latest test", pro: "Every test, charted over time" },
  { label: "Practice history", free: "Last 20 sessions shown", pro: "Full history + trends" },
  { label: "Backup & sync", free: "Manual export file", pro: "Automatic cloud sync" },
  { label: "The Measured Voice (book)", free: "Contents only", pro: "All 23 chapters + PDF" },
  { label: "The Voice Atlas (book)", free: "Contents + first chapter", pro: "All 27 chapters + PDF" },
];
