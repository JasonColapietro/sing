"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Button, Card, PageShell, Pill, SectionLabel } from "@/components/ui";
import { MicAlert } from "@/components/mic-alert";
import { logSession } from "@/lib/progress";
import { useFlushOnExit } from "@/lib/use-flush-on-exit";
import { useAnalyser, type AnalyserFrame } from "@/lib/audio/use-analyser";
import {
  RING_HI_HZ,
  RING_LO_HZ,
} from "@/lib/audio/spectrum";
import {
  EMPTY_DOSE,
  type DoseState,
  accumulate,
  fmtCycles,
  load as loadDose,
  save as saveDose,
  useDose,
} from "@/lib/audio/vocal-dose";
import { Spectrogram } from "./spectrogram";
import { Tone } from "./tone";
import { VocalLoad, fmtTime } from "./vocal-load";

/** Log a practice session for every five minutes of listening. */
const CHUNK_SEC = 5 * 60;
/** Don't log scraps when leaving the page. */
const MIN_FLUSH_SEC = 15;
/** How often the accumulated dose is written to storage while listening. */
const SAVE_EVERY_MS = 10_000;

export default function AnalyzeClient() {
  // The store is the history; `doseRef` is the live total the analysis loop
  // accumulates into between saves, so a frame never goes through React.
  const dose = useDose();
  const doseRef = useRef<DoseState>(EMPTY_DOSE);
  const [xpNote, setXpNote] = useState<string | null>(null);

  const secRef = useRef<HTMLSpanElement | null>(null);
  const cyclesRef = useRef<HTMLSpanElement | null>(null);
  const ringRef = useRef<HTMLSpanElement | null>(null);

  const listenSecRef = useRef(0);
  const sinceSaveRef = useRef(0);
  const noteTimer = useRef<number | undefined>(undefined);

  // localStorage is unreadable during the server render, so the live total
  // seeds from the store after mount.
  useEffect(() => {
    doseRef.current = loadDose();
  }, []);

  /**
   * Called by the analysis loop on every frame. Writes the two live figures
   * straight to the DOM: at 60 fps a setState here would re-render the page
   * sixty times a second to change two strings.
   */
  const onFrame = useCallback((frame: AnalyserFrame, dtSec: number) => {
    listenSecRef.current += dtSec;

    const next = accumulate(doseRef.current, {
      day: frame.day,
      f0: frame.f0,
      dtSec,
    });
    if (next !== doseRef.current) {
      doseRef.current = next;
      const t = next.days.find((d) => d.day === frame.day);
      if (t) {
        if (secRef.current) secRef.current.textContent = fmtTime(t.phonationSec);
        if (cyclesRef.current) cyclesRef.current.textContent = fmtCycles(t.cycles);
      }
    }

    sinceSaveRef.current += dtSec * 1000;
    if (sinceSaveRef.current >= SAVE_EVERY_MS) {
      sinceSaveRef.current = 0;
      saveDose(doseRef.current);
    }
  }, []);

  const { latest, listening, error, sampleRate, start, stop } = useAnalyser({
    onFrame,
  });

  const showNote = useCallback((xp: number) => {
    setXpNote(`+${xp} XP · 5 min of analysis logged`);
    window.clearTimeout(noteTimer.current);
    noteTimer.current = window.setTimeout(() => setXpNote(null), 6000);
  }, []);

  // Log a practice chunk for every full five minutes of listening.
  useEffect(() => {
    if (!listening) return;
    const id = window.setInterval(() => {
      if (listenSecRef.current >= CHUNK_SEC) {
        listenSecRef.current -= CHUNK_SEC;
        const res = logSession({
          type: "analyze",
          durationSec: CHUNK_SEC,
          detail: "Voice analysis",
        });
        showNote(res.xpGained);
      }
    }, 1000);
    return () => window.clearInterval(id);
  }, [listening, showNote]);

  /** Persist the dose and log the remaining listening time. Idempotent. */
  const flush = useCallback(() => {
    saveDose(doseRef.current);
    const sec = Math.round(listenSecRef.current);
    if (sec >= MIN_FLUSH_SEC) {
      listenSecRef.current = 0;
      logSession({ type: "analyze", durationSec: sec, detail: "Voice analysis" });
    }
  }, []);

  // A closed laptop or a swiped-away tab never fires unmount, so unmount
  // alone would lose the tail of every session.
  useFlushOnExit(flush);

  const onStop = useCallback(() => {
    stop();
    flush();
  }, [stop, flush]);

  const onStart = useCallback(async () => {
    // A session started before midnight and continued after it must not credit
    // yesterday; the frame carries its own day, so this only refreshes what the
    // idle readout shows.
    doseRef.current = loadDose();
    await start();
  }, [start]);

  return (
    <PageShell
      kicker="Analysis"
      title="Analyze"
      subtitle="Watch the shape of your voice as you sing it — the harmonics, the ring, and how much work your folds have actually done today."
      actions={
        <div className="flex items-center gap-2">
          {xpNote && <Pill tone="ok">{xpNote}</Pill>}
          {listening ? (
            <Button variant="outline" onClick={onStop}>
              Stop
            </Button>
          ) : (
            <Button onClick={onStart}>Enable microphone</Button>
          )}
        </div>
      }
    >
      {error && (
        <Card className="mb-6 border-rec/40">
          <MicAlert message={error} className="text-sm text-rec" />
        </Card>
      )}

      {!listening && !error && (
        <Card className="mb-6">
          <p className="text-sm text-mut">
            Nothing is uploaded. The microphone is read in your browser, the
            analysis runs on your device, and no audio leaves it.
          </p>
        </Card>
      )}

      <div className="grid gap-6">
        <Card pad={false} className="overflow-hidden">
          <div className="flex items-center justify-between border-b border-line bg-panel2/60 px-4 py-2.5">
            <SectionLabel>Spectrogram</SectionLabel>
            <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-dim">
              {RING_LO_HZ / 1000}–{RING_HI_HZ / 1000}k marked
            </span>
          </div>
          <Spectrogram
            latest={latest}
            running={listening}
            sampleRate={sampleRate}
            className="block h-[260px] w-full sm:h-[320px]"
          />
          <p className="border-t border-line px-4 py-3 text-xs text-mut">
            Time runs left to right, pitch bottom to top. Stacked lines are the
            harmonics of one note; the stack jumping is a register change, and a
            steady ripple is vibrato.
          </p>
        </Card>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <div className="mb-4 flex items-center justify-between">
              <SectionLabel>Tone</SectionLabel>
              <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-dim">
                Ring band <span ref={ringRef} className="text-violet-ink">0.0%</span>
              </span>
            </div>
            <Tone
              latest={latest}
              running={listening}
              sampleRate={sampleRate}
              ringRef={ringRef}
              className="block"
            />
            <p className="mt-3 text-xs text-mut">
              The gold column is the singer&rsquo;s formant, the cluster around
              3 kHz that lets a trained voice sit on top of an orchestra playing
              louder than it. The percentage is that band&rsquo;s share of the
              plotted energy — compare it against your own takes rather than
              against a target.
            </p>
          </Card>

          <Card>
            <div className="mb-4">
              <SectionLabel>Vocal load</SectionLabel>
            </div>
            <VocalLoad
              state={dose}
              running={listening}
              secRef={secRef}
              cyclesRef={cyclesRef}
            />
          </Card>
        </div>
      </div>

      <p className="mt-6 text-xs text-dim">
        Time spent listening counts toward your practice XP — sessions log
        automatically every 5 minutes and when you leave the page.
      </p>
    </PageShell>
  );
}
