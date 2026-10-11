"use client";

import { useSyncExternalStore } from "react";

export interface ProgressCloudState {
  paused: boolean;
  /** Changes on both pause and resume, so an old request never becomes current again. */
  generation: string;
  /** Changes only on erase; another tab resuming must not discard unsaved practice. */
  resetGeneration: string;
}

export const PROGRESS_CLOUD_STORAGE_KEY = "suede-sing:progress-cloud:v1";
const DEFAULT: ProgressCloudState = { paused: false, generation: "initial", resetGeneration: "initial" };
const UNAVAILABLE: ProgressCloudState = { paused: true, generation: "unavailable", resetGeneration: "unavailable" };
let cache: ProgressCloudState | null = null;
let lastRaw: string | null | undefined;
let memoryOnly = false;
let unavailable: ProgressCloudState | null = null;
let storageBound = false;
const listeners = new Set<() => void>();

function parse(raw: string | null): ProgressCloudState {
  if (raw === null) return DEFAULT;
  try {
    const value = JSON.parse(raw) as Partial<ProgressCloudState>;
    if (typeof value.paused === "boolean" && typeof value.generation === "string" && value.generation) {
      return {
        paused: value.paused,
        generation: value.generation,
        resetGeneration: typeof value.resetGeneration === "string" && value.resetGeneration
          ? value.resetGeneration
          : value.generation,
      };
    }
  } catch {
    // A damaged preference must not silently authorize restoring erased work.
  }
  return UNAVAILABLE;
}

/** Re-read storage at request boundaries; another tab's storage event may be late. */
export function getProgressCloudState(): ProgressCloudState {
  if (typeof window === "undefined") return DEFAULT;
  try {
    const raw = window.localStorage.getItem(PROGRESS_CLOUD_STORAGE_KEY);
    if (memoryOnly && cache && (lastRaw === undefined || raw === lastRaw)) {
      lastRaw = raw;
      return cache;
    }
    if (cache && raw === lastRaw) return cache;
    lastRaw = raw;
    cache = parse(raw);
    memoryOnly = false;
    unavailable = null;
    return cache;
  } catch {
    // An explicit action still works in memory when browser storage is blocked.
    // Otherwise fail closed: an unreadable preference might hold a reset.
    if (memoryOnly || cache?.paused) return cache ?? UNAVAILABLE;
    return unavailable ??= {
      paused: true,
      generation: cache?.generation ?? "unavailable",
      resetGeneration: cache?.resetGeneration ?? "unavailable",
    };
  }
}

function emit() {
  for (const listener of listeners) listener();
}

export function subscribeProgressCloud(listener: () => void): () => void {
  if (!storageBound && typeof window !== "undefined") {
    storageBound = true;
    window.addEventListener("storage", (event) => {
      if (event.key === PROGRESS_CLOUD_STORAGE_KEY || event.key === null) {
        getProgressCloudState();
        emit();
      }
    });
  }
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useProgressCloudState(): ProgressCloudState {
  return useSyncExternalStore(subscribeProgressCloud, getProgressCloudState, () => DEFAULT);
}

/** Retry after clearing the progress record has freed storage space. */
export function retryProgressCloudPersistence(): void {
  if (!memoryOnly || !cache || typeof window === "undefined") return;
  try {
    const raw = JSON.stringify(cache);
    window.localStorage.setItem(PROGRESS_CLOUD_STORAGE_KEY, raw);
    lastRaw = raw;
    memoryOnly = false;
  } catch {
    // Keep the same in-memory generation; a readable old value cannot undo it.
  }
}

function setPaused(paused: boolean): void {
  const previous = getProgressCloudState();
  const generation = typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random()}`;
  cache = {
    paused,
    generation,
    resetGeneration: paused ? generation : previous.resetGeneration,
  };
  memoryOnly = true;
  unavailable = null;
  retryProgressCloudPersistence();
  emit();
}

export function pauseProgressCloud(): void {
  setPaused(true);
}

/** Explicit user action: subsequent sync/restore may bring saved history back. */
export function resumeProgressCloud(): void {
  setPaused(false);
}

export class ProgressCloudPausedError extends Error {
  constructor() {
    super("Cloud backup and sync are paused on this browser. Resume to restore your saved progress.");
    this.name = "ProgressCloudPausedError";
  }
}

export class ProgressCloudInterruptedError extends Error {
  constructor() {
    super("This request was interrupted because progress was reset or cloud sync changed. Please try again.");
    this.name = "ProgressCloudInterruptedError";
  }
}

export function captureProgressCloudGeneration(): string | null {
  const state = getProgressCloudState();
  return state.paused ? null : state.generation;
}

export function isProgressCloudGenerationCurrent(generation: string): boolean {
  const state = getProgressCloudState();
  return !state.paused && state.generation === generation;
}

export function requireProgressCloudGeneration(): string {
  const generation = captureProgressCloudGeneration();
  if (generation === null) throw new ProgressCloudPausedError();
  return generation;
}

export function assertProgressCloudGeneration(generation: string): void {
  if (!isProgressCloudGenerationCurrent(generation)) throw new ProgressCloudInterruptedError();
}
