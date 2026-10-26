"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { analyzeTake, type TakeAnalysis } from "@/lib/audio/analyze-take";
import type { TakeRecord } from "./db";

type Entry = { status: "pending" } | { status: "failed" } | { status: "ready"; analysis: TakeAnalysis };

/** One request per take, with explicit retries and no late result after removal. */
export function useTakeAnalysis() {
  const entriesRef = useRef(new Map<string, Entry>());
  const [entries, setEntries] = useState(new Map<string, Entry>());
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  const ensureAnalysis = useCallback((take: Pick<TakeRecord, "id" | "blob">, retry = false) => {
    const current = entriesRef.current.get(take.id);
    if (current && !(retry && current.status === "failed")) return;
    const pending: Entry = { status: "pending" };
    entriesRef.current.set(take.id, pending);
    setEntries(new Map(entriesRef.current));
    const publish = (entry: Entry) => {
      // A deleted take, a replacement request, or a departed room no longer
      // owns this result. In particular, decoding can finish after Delete.
      if (!mounted.current || entriesRef.current.get(take.id) !== pending) return;
      entriesRef.current.set(take.id, entry);
      setEntries(new Map(entriesRef.current));
    };
    void analyzeTake(take.blob).then(
      (analysis) => publish({ status: "ready", analysis }),
      () => publish({ status: "failed" }),
    );
  }, []);

  const forgetAnalysis = useCallback((id: string) => {
    entriesRef.current.delete(id);
    setEntries(new Map(entriesRef.current));
  }, []);

  const analysisMap = new Map<string, TakeAnalysis>();
  const analysisErrors = new Set<string>();
  for (const [id, entry] of entries) {
    if (entry.status === "ready") analysisMap.set(id, entry.analysis);
    if (entry.status === "failed") analysisErrors.add(id);
  }
  return { analysisMap, analysisErrors, ensureAnalysis, forgetAnalysis };
}
