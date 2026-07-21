"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { logSession } from "@/lib/progress";
import { PageShell, Pill } from "@/components/ui";
import { Metronome } from "./metronome";
import { Piano } from "./piano";
import { Drone } from "./drone";

const CHUNK_SEC = 5 * 60;
/** Don't log tiny scraps of use when leaving the page. */
const MIN_FLUSH_SEC = 15;

/**
 * Tracks cumulative "any tool active" time. Logs a session for every full
 * 5 minutes of use, and flushes the remainder once when leaving the page.
 */
function useToolTime() {
  const [xpNote, setXpNote] = useState<string | null>(null);
  const noteTimer = useRef<number | undefined>(undefined);
  const activeTools = useRef<Set<string>>(new Set());
  const accumSec = useRef(0);
  const activeSince = useRef<number | null>(null);

  const showNote = useCallback((xp: number, minutes: number) => {
    setXpNote(`+${xp} XP · ${minutes} min of tool time logged`);
    window.clearTimeout(noteTimer.current);
    noteTimer.current = window.setTimeout(() => setXpNote(null), 6000);
  }, []);

  const report = useCallback((tool: string, active: boolean) => {
    const set = activeTools.current;
    const wasActive = set.size > 0;
    if (active) set.add(tool);
    else set.delete(tool);
    const isActive = set.size > 0;
    if (!wasActive && isActive) {
      activeSince.current = performance.now();
    } else if (wasActive && !isActive && activeSince.current !== null) {
      accumSec.current += (performance.now() - activeSince.current) / 1000;
      activeSince.current = null;
    }
  }, []);

  // Log a chunk after every full 5 minutes of cumulative use.
  useEffect(() => {
    const id = window.setInterval(() => {
      let total = accumSec.current;
      if (activeSince.current !== null) {
        total += (performance.now() - activeSince.current) / 1000;
      }
      if (total >= CHUNK_SEC) {
        if (activeSince.current !== null) {
          accumSec.current += (performance.now() - activeSince.current) / 1000;
          activeSince.current = performance.now();
        }
        accumSec.current -= CHUNK_SEC;
        const res = logSession({
          type: "tools",
          durationSec: CHUNK_SEC,
          detail: "Practice tools",
        });
        showNote(res.xpGained, 5);
      }
    }, 1000);
    return () => window.clearInterval(id);
  }, [showNote]);

  // Flush the remainder once when leaving the page.
  useEffect(() => {
    const flush = () => {
      if (activeSince.current !== null) {
        accumSec.current += (performance.now() - activeSince.current) / 1000;
        activeSince.current =
          activeTools.current.size > 0 ? performance.now() : null;
      }
      const sec = Math.round(accumSec.current);
      if (sec >= MIN_FLUSH_SEC) {
        accumSec.current = 0;
        logSession({ type: "tools", durationSec: sec, detail: "Practice tools" });
      }
    };
    window.addEventListener("pagehide", flush);
    return () => {
      window.removeEventListener("pagehide", flush);
      flush();
    };
  }, []);

  return { xpNote, report };
}

export default function ToolsClient() {
  const { xpNote, report } = useToolTime();

  const onMetronomeActive = useCallback(
    (a: boolean) => report("metronome", a),
    [report],
  );
  const onPianoActive = useCallback((a: boolean) => report("piano", a), [report]);
  const onDroneActive = useCallback((a: boolean) => report("drone", a), [report]);

  return (
    <PageShell
      kicker="Studio tools"
      title="Tools"
      subtitle="Metronome, keyboard, and drone — the console modules every practice session leans on. No mic needed."
      actions={xpNote ? <Pill tone="ok">{xpNote}</Pill> : undefined}
    >
      <div className="grid gap-6 lg:grid-cols-2">
        <Metronome onActive={onMetronomeActive} />
        <Drone onActive={onDroneActive} />
      </div>
      <div className="mt-6">
        <Piano onActive={onPianoActive} />
      </div>
      <p className="mt-6 text-xs text-dim">
        Time spent with a tool running counts toward your practice XP — sessions
        log automatically every 5 minutes and when you leave the page.
      </p>
    </PageShell>
  );
}
