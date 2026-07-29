"use client";

import { useSyncExternalStore } from "react";

/**
 * Pro entitlement, stored locally like everything else in Suede Sing.
 * The Stripe Checkout session id doubles as the license key; the token is
 * server-issued proof (HMAC) that the session was verified as paid.
 */
export interface ProState {
  sessionId: string;
  token: string;
  activatedAt: string;
}

const KEY = "suede-sing:pro:v1";

let cache: ProState | null | undefined;
const listeners = new Set<() => void>();
let storageBound = false;

function load(): ProState | null {
  if (cache !== undefined) return cache;
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(KEY);
    const parsed = raw ? (JSON.parse(raw) as Partial<ProState>) : null;
    cache =
      parsed &&
      typeof parsed.sessionId === "string" &&
      typeof parsed.token === "string"
        ? {
            sessionId: parsed.sessionId,
            token: parsed.token,
            activatedAt: parsed.activatedAt ?? new Date(0).toISOString(),
          }
        : null;
  } catch {
    cache = null;
  }
  return cache;
}

function emit() {
  for (const l of listeners) l();
}

function save(next: ProState | null) {
  cache = next;
  try {
    if (next === null) window.localStorage.removeItem(KEY);
    else window.localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // storage unavailable — keep the in-memory state
  }
  emit();
}

export function getPro(): ProState | null {
  return load();
}

export function subscribe(cb: () => void): () => void {
  if (!storageBound && typeof window !== "undefined") {
    storageBound = true;
    window.addEventListener("storage", (e) => {
      if (e.key === KEY) {
        cache = undefined;
        emit();
      }
    });
  }
  listeners.add(cb);
  return () => listeners.delete(cb);
}

/** Reactive Pro state. null = free tier (and always null during SSR). */
export function usePro(): ProState | null {
  return useSyncExternalStore(subscribe, getPro, () => null);
}

export function activatePro(sessionId: string, token: string): void {
  save({ sessionId, token, activatedAt: new Date().toISOString() });
}

/** Remove the unlock from this device (does not refund anything). */
export function deactivatePro(): void {
  save(null);
}
