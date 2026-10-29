"use client";

import { createContext, useCallback, useContext, useEffect, useId, useMemo, useState, type ReactNode } from "react";

/**
 * One client-rendered Pro ask per page. Asks register a priority; only the
 * highest (ties: first registered) renders. Registration happens in an
 * effect, so a slotted ask is absent from the server HTML: wrap only asks
 * that are client-only already (they wait for useProReady). Server-rendered
 * asks are rationed at the call site instead, so no layout shifts.
 *
 * Priorities: 3 locked panel, 2 crescendo card, 1 inline nudge, 0 whisper.
 */
type Entry = { id: string; priority: number; order: number };
type Slot = { register: (id: string, priority: number) => () => void; winner: string | null };

const SlotContext = createContext<Slot | null>(null);

let nextOrder = 0;

/** Pick the entry that holds the slot: highest priority, then first registered. */
export function topEntry(entries: readonly Entry[]): Entry | null {
  let best: Entry | null = null;
  for (const e of entries) {
    if (!best || e.priority > best.priority || (e.priority === best.priority && e.order < best.order)) best = e;
  }
  return best;
}

export function ProSlotProvider({ children }: { children: ReactNode }) {
  const [entries, setEntries] = useState<Entry[]>([]);
  // Stable, so registering never re-runs the asks' effects.
  const register = useCallback((id: string, priority: number) => {
    const order = nextOrder++;
    setEntries((list) => [...list.filter((e) => e.id !== id), { id, priority, order }]);
    return () => setEntries((list) => list.filter((e) => e.id !== id));
  }, []);
  const winner = topEntry(entries)?.id ?? null;
  const value = useMemo<Slot>(() => ({ register, winner }), [register, winner]);
  return <SlotContext.Provider value={value}>{children}</SlotContext.Provider>;
}

/** Whether this ask holds the page's slot. Outside a provider every ask does. */
export function useProSlot(priority: number, enabled = true): boolean {
  const slot = useContext(SlotContext);
  const id = useId();
  const register = slot?.register;
  useEffect(() => {
    if (!register || !enabled) return;
    return register(id, priority);
  }, [register, id, priority, enabled]);
  if (!slot) return true;
  return enabled && slot.winner === id;
}

/** Renders `children` only while it holds the slot. For client-only asks. */
export function ProSlot({ priority, children }: { priority: number; children: ReactNode }) {
  return useProSlot(priority) ? <>{children}</> : null;
}
