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

const READY = () => true;
const NOT_READY = () => false;

/**
 * Whether the entitlement cache has been read on this device yet.
 *
 * Every gated page is prerendered, and there is no server-side entitlement to
 * prerender with — no accounts, no database, and the cache lives in
 * localStorage — so the static HTML always says "not Pro". Rendering the upsell
 * straight from `useIsPro()` therefore ships a sales pitch to the subscriber
 * who already paid, and flashes it away on hydration. Surfaces that would
 * assert something false in that window hold a neutral state until this flips
 * true on the client.
 *
 * Only useful for telling "not Pro" apart from "don't know yet": `useIsPro()`
 * is false in both cases, so anything that merely *adds* on Pro can keep
 * reading it directly.
 */
export function useProReady(): boolean {
  return useSyncExternalStore(subscribePro, READY, NOT_READY);
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

/**
 * Folds a fresh entitlement into what this device already knows.
 *
 * `keepCredentials` exists because revalidation deliberately answers without
 * them. `/api/entitlement` will not mint a Pro key, a customer id or an email
 * from a bare subscription id — that id is a bearer string in localStorage, not
 * proof of ownership, and handing back the full entitlement turned it into a
 * master key for someone else's billing portal and practice record.
 *
 * So a status check returns nulls in those three fields, and blanking the
 * device's real credentials every twelve hours would take the portal and the
 * Pro key away from the subscriber who legitimately earned them at checkout.
 * They are kept while the subscription is active and cleared the moment it is
 * not, which is the only case where forgetting them is correct.
 */
function apply(
  entitlement: Entitlement,
  { keepCredentials = false } = {},
): ProState {
  const prev = load();
  const carry = keepCredentials && entitlement.active;
  const next: ProState = {
    ...entitlement,
    customerId: carry
      ? (entitlement.customerId ?? prev.customerId)
      : entitlement.customerId,
    proKey: carry ? (entitlement.proKey ?? prev.proKey) : entitlement.proKey,
    email: carry ? (entitlement.email ?? prev.email) : entitlement.email,
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

/* ------------------------------------------------------ pending checkout */

/** Where the unconfirmed checkout session waits. */
const PENDING_KEY = "suede-sing:pro:pending-checkout";

/**
 * The checkout session id, parked until entitlement is confirmed.
 *
 * The id exists in exactly one place — the URL Stripe returns to — and /pro
 * strips that query immediately so a refresh doesn't re-run confirmation.
 * Parking it first is what makes the confirmation retryable: without this, a
 * single failed call (a Stripe hiccup, a 429 from a shared office IP) left
 * someone who had already been charged with no Pro, no Pro key, no way to try
 * again, and nothing to quote at support.
 *
 * It is cleared as soon as Stripe gives a definitive answer, so it only ever
 * survives an inconclusive one.
 */
export function rememberPendingCheckout(sessionId: string): void {
  try {
    window.localStorage.setItem(PENDING_KEY, sessionId);
  } catch {
    // storage unavailable — confirmation still runs, it just can't be retried
  }
}

export function pendingCheckout(): string | null {
  try {
    return window.localStorage.getItem(PENDING_KEY);
  } catch {
    return null;
  }
}

export function clearPendingCheckout(): void {
  try {
    window.localStorage.removeItem(PENDING_KEY);
  } catch {
    // nothing parked, or storage unavailable
  }
}

/**
 * Confirms a finished Checkout Session and unlocks Pro on this device.
 *
 * Retries a transient failure rather than surfacing it, because the singer
 * has already paid by the time this runs: the difference between one attempt
 * and three is the difference between a support email and a working account.
 * A definitive answer from Stripe — including "not active" — returns on the
 * first pass and is never retried.
 */
export async function confirmCheckout(
  sessionId: string,
  attempts = 3,
): Promise<ProState> {
  let last: unknown;
  for (let attempt = 0; attempt < attempts; attempt++) {
    if (attempt > 0) {
      await new Promise((r) => setTimeout(r, 700 * attempt));
    }
    try {
      const state = apply(await post<Entitlement>("/api/entitlement", { sessionId }));
      clearPendingCheckout();
      return state;
    } catch (error) {
      last = error;
    }
  }
  throw last instanceof Error
    ? last
    : new Error("Could not confirm the payment.");
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
      // Status-only reply — keep the Pro key and customer id this device got
      // at checkout. See `apply`.
      { keepCredentials: true },
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
 * Re-exported, not redefined: the price lives in `pro-shared` so the server
 * routes and the client read one number. A second copy here is how the page
 * and the checkout drift apart.
 */
export { PRICING } from "./pro-shared";

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
    // No heatmap claim here. "Pitch heatmaps of every session" shipped in this
    // list for months and existed in no file — the only heatmap in the repo is
    // the practice-days calendar, which is free and ungated. A subscriber can
    // falsify a line like that in sixty seconds, and the one they catch is what
    // makes them doubt the perks that were true.
    desc: "Per-note accuracy, and your range charted over months rather than one test at a time.",
  },
  {
    id: "takes",
    title: "Take pitch analysis",
    desc: "A pitch trace of every recorded take, and an A/B overlay that shows which keeper actually sat in tune.",
  },
  {
    id: "songs",
    title: "Every song, scored and kept",
    // The songbook itself moved to free — six public-domain folk tunes were a
    // gate that argued against buying. What Pro sells on this surface is the
    // record of singing them, which is the thing that compounds. No cadence
    // promise: the catalog is a checked-in array, so "new songs every week" is
    // a claim only a weekly deploy could keep.
    desc: "All 26 songs are free. Pro keeps the scoring history for each one, so you can hear month one against month six.",
  },
  {
    id: "warmups",
    title: "Pro warmup packs",
    desc: "Genre and voice-type routines: belt prep, head-voice builders, morning resets.",
  },
  {
    id: "book",
    title: "Two books, with PDFs",
    desc: "50 chapters and 82,734 words: The Measured Voice (how the voice works, plus a twelve-week program) and The Voice Atlas (420 measured voices). Both open in full the moment you subscribe, and both as PDFs to keep.",
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
  { label: "Practice rooms (all ten)", free: "Included", pro: "Included" },
  { label: "Real-time pitch feedback", free: "Included", pro: "Included" },
  { label: "Range test + voice type", free: "Included", pro: "Included" },
  { label: "Take recorder + A/B compare", free: "Included", pro: "+ pitch analysis on every take" },
  { label: "Song library (all 26)", free: "Included", pro: "+ scoring history per song" },
  { label: "Warmup routines", free: "17 exercises", pro: "17 + 15 in 2 pro packs" },
  { label: "Coach plan", free: "First two steps each day", pro: "Full adaptive plan, daily" },
  { label: "Vocal analytics", free: "Session scores", pro: "Per-note accuracy and trends" },
  { label: "Range history", free: "Latest test", pro: "Every test, charted over time" },
  { label: "Practice history", free: "Last 20 sessions", pro: "Every session you have ever sung" },
  { label: "Backup & sync", free: "Account backup, every 6 hours", pro: "Continuous two-way sync across devices" },
  { label: "The Measured Voice (book)", free: "Contents + 3 chapters", pro: "All 23 chapters + PDF" },
  { label: "The Voice Atlas (book)", free: "Contents + first 3 chapters", pro: "All 27 chapters + PDF" },
  // 420 singer pages have always been free and the comparison table never said
  // so — the single largest free asset in the product, invisible on the page
  // whose whole job is to argue that free is generous.
  { label: "Famous voices (all 420)", free: "Every singer page", pro: "+ the Atlas chapters behind them" },
  { label: "Glossary (31 terms)", free: "Included", pro: "Included" },
];
