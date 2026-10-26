"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { decodeTakeBlob, encodeWavMono } from "./wav";
import type { TakeRecord } from "./db";

/** WAV conversion is independent per take, with retry after a decode failure. */
export function useWavDownloads(save: (blob: Blob, take: TakeRecord) => void) {
  const [busyIds, setBusyIds] = useState(new Set<string>());
  const [errors, setErrors] = useState(new Set<string>());
  const pending = useRef(new Map<string, object>());
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    const requests = pending.current;
    return () => { mounted.current = false; requests.clear(); };
  }, []);

  const forget = useCallback((id: string) => {
    pending.current.delete(id);
    setBusyIds((previous) => { const next = new Set(previous); next.delete(id); return next; });
    setErrors((previous) => { const next = new Set(previous); next.delete(id); return next; });
  }, []);

  const download = useCallback(async (take: TakeRecord) => {
    if (pending.current.has(take.id)) return;
    const request = {};
    pending.current.set(take.id, request);
    setBusyIds((previous) => new Set(previous).add(take.id));
    setErrors((previous) => { const next = new Set(previous); next.delete(take.id); return next; });
    const current = () => mounted.current && pending.current.get(take.id) === request;
    try {
      const buffer = await decodeTakeBlob(take.blob);
      if (current()) save(encodeWavMono(buffer), take);
    } catch {
      if (current()) setErrors((previous) => new Set(previous).add(take.id));
    } finally {
      if (current()) {
        pending.current.delete(take.id);
        setBusyIds((previous) => { const next = new Set(previous); next.delete(take.id); return next; });
      }
    }
  }, [save]);
  return { busyIds, errors, download, forget };
}
