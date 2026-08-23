"use client";

import { useSyncExternalStore } from "react";
import { isWarmupMode, type WarmupMode } from "@/lib/progress";

/**
 * The warmup room's own preferences: how to sing (with the guide under the
 * voice, or back from memory), how loud the guide sits, and whether the
 * count-in clicks. Same store shape as lib/audio/devices.ts — a module cache,
 * a listener set, and a useSyncExternalStore hook — because these outlive any
 * one exercise the same way the device choice does.
 */

const MODE_KEY = "suede-sing:warmup:mode:v1";
const GUIDE_KEY = "suede-sing:warmup:guide:v1";
const CLICK_KEY = "suede-sing:warmup:click:v1";

export interface WarmupPrefs {
  mode: WarmupMode;
  /** Guide level 0–100. 0 is silent, and is how a singer practises unaccompanied. */
  guidePct: number;
  click: boolean;
}

export const DEFAULT_WARMUP_PREFS: WarmupPrefs = {
  mode: "sing-along",
  guidePct: 70,
  click: true,
};

let prefs: WarmupPrefs | null = null;
const listeners = new Set<() => void>();

function read(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function write(key: string, value: string) {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // storage unavailable — the in-memory preference still applies this session
  }
}

/** Clamp anything a stored string might hold into a real guide level. */
function toGuidePct(raw: string | null): number {
  if (raw === null) return DEFAULT_WARMUP_PREFS.guidePct;
  const parsed = Number(raw);
  if (!Number.isFinite(parsed)) return DEFAULT_WARMUP_PREFS.guidePct;
  return Math.round(Math.min(100, Math.max(0, parsed)));
}

function loadPrefs(): WarmupPrefs {
  if (prefs) return prefs;
  if (typeof window === "undefined") return DEFAULT_WARMUP_PREFS;
  const mode = read(MODE_KEY);
  const click = read(CLICK_KEY);
  prefs = {
    mode: isWarmupMode(mode) ? mode : DEFAULT_WARMUP_PREFS.mode,
    guidePct: toGuidePct(read(GUIDE_KEY)),
    click: click === null ? DEFAULT_WARMUP_PREFS.click : click === "1",
  };
  return prefs;
}

function emit() {
  for (const l of listeners) l();
}

export function getWarmupPrefs(): WarmupPrefs {
  return loadPrefs();
}

export function subscribeWarmupPrefs(cb: () => void): () => void {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export function setWarmupMode(mode: WarmupMode): void {
  prefs = { ...loadPrefs(), mode };
  write(MODE_KEY, mode);
  emit();
}

export function setGuidePct(pct: number): void {
  const clamped = Math.round(Math.min(100, Math.max(0, pct)));
  prefs = { ...loadPrefs(), guidePct: clamped };
  write(GUIDE_KEY, String(clamped));
  emit();
}

export function setClick(on: boolean): void {
  prefs = { ...loadPrefs(), click: on };
  write(CLICK_KEY, on ? "1" : "0");
  emit();
}

export function useWarmupPrefs(): WarmupPrefs {
  return useSyncExternalStore(subscribeWarmupPrefs, getWarmupPrefs, getServerPrefs);
}

function getServerPrefs(): WarmupPrefs {
  return DEFAULT_WARMUP_PREFS;
}

/** Test-only: drop the cache so the next read hits storage again. */
export function resetWarmupPrefsForTest(): void {
  prefs = null;
}
