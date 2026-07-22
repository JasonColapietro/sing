"use client";

import { useEffect, useRef, useState } from "react";
import { usePitch } from "@/lib/audio/use-pitch";
import { midiToLabel } from "@/lib/audio/notes";
import { playTone } from "@/lib/audio/synth";
import {
  logSession,
  setVocalRange,
  useProgress,
  type Achievement,
} from "@/lib/progress";
import {
  Button,
  Card,
  PageShell,
  Pill,
  ProgressBar,
  SectionLabel,
} from "@/components/ui";
import { PianoStrip } from "./piano-strip";
import { ResultView, type SaveSummary } from "./result-view";

type Stage = "intro" | "warm" | "low" | "high" | "result";

/** Continuous hold needed on one note to establish the register. */
const WARM_HOLD_MS = 2000;
/** Cumulative voiced time on a note before it counts as reached. */
const DWELL_MS = 600;
/** Ignore implausible detections outside C1..C7. */
const MIN_PLAUSIBLE = 24;
const MAX_PLAUSIBLE = 96;
/** Ignore near-silent frames. */
const MIN_VOLUME = 0.008;

const STEPS: Array<{ id: Stage; label: string }> = [
  { id: "warm", label: "Warm start" },
  { id: "low", label: "Low notes" },
  { id: "high", label: "High notes" },
  { id: "result", label: "Result" },
];

function StepIndicator({ stage }: { stage: Stage }) {
  const idx = STEPS.findIndex((s) => s.id === stage);
  return (
    <ol className="flex flex-wrap items-center gap-2" aria-label="Test steps">
      {STEPS.map((s, i) => {
        const state = i < idx ? "done" : i === idx ? "current" : "todo";
        return (
          <li key={s.id} className="flex items-center gap-2">
            <span
              className={
                "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 font-mono text-[11px] uppercase tracking-[0.1em] " +
                (state === "current"
                  ? "border-amber/50 text-amber-ink"
                  : state === "done"
                    ? "border-ok/40 text-ok"
                    : "border-line text-dim")
              }
              aria-current={state === "current" ? "step" : undefined}
            >
              <span className="tabular">{i + 1}</span> {s.label}
            </span>
            {i < STEPS.length - 1 && (
              <span aria-hidden="true" className="h-px w-3 bg-line2" />
            )}
          </li>
        );
      })}
    </ol>
  );
}

function ListeningPill() {
  return (
    <Pill tone="rec">
      <span
        aria-hidden="true"
        className="animate-recblink inline-block h-1.5 w-1.5 rounded-full bg-rec"
      />
      Listening
    </Pill>
  );
}

export function RangeTest() {
  const { frame, listening, error, start, stop } = usePitch();
  const progress = useProgress();

  const [stage, setStage] = useState<Stage>("intro");
  const [anchorMidi, setAnchorMidi] = useState<number | null>(null);
  const [lowFound, setLowFound] = useState<number | null>(null);
  const [highFound, setHighFound] = useState<number | null>(null);
  const [holdMs, setHoldMs] = useState(0);
  const [dwell, setDwell] = useState<{ midi: number; ms: number } | null>(null);
  const [result, setResult] = useState<{
    lowMidi: number;
    highMidi: number;
    save?: SaveSummary;
  } | null>(null);

  const lastTRef = useRef(0);
  const holdRef = useRef<{ target: number | null; ms: number; gapMs: number }>({
    target: null,
    ms: 0,
    gapMs: 0,
  });
  const dwellMapRef = useRef<Map<number, number>>(new Map());
  const startedAtRef = useRef(0);

  const resetHunt = () => {
    dwellMapRef.current = new Map();
    setDwell(null);
    lastTRef.current = 0;
  };

  const resetAll = () => {
    setAnchorMidi(null);
    setLowFound(null);
    setHighFound(null);
    setHoldMs(0);
    setResult(null);
    holdRef.current = { target: null, ms: 0, gapMs: 0 };
    resetHunt();
  };

  const begin = async () => {
    const ok = await start();
    if (!ok) return;
    resetAll();
    startedAtRef.current = performance.now();
    setStage("warm");
  };

  // Per-frame analysis for the active wizard stages.
  useEffect(() => {
    if (stage !== "warm" && stage !== "low" && stage !== "high") return;
    const t = frame.t;
    const last = lastTRef.current;
    lastTRef.current = t;
    if (!last || t <= last) return;
    const dt = Math.min(120, t - last);

    const voiced =
      frame.freq !== null && frame.note !== null && frame.volume >= MIN_VOLUME;
    const midi = voiced && frame.note ? frame.note.midi : null;
    const plausible =
      midi !== null && midi >= MIN_PLAUSIBLE && midi <= MAX_PLAUSIBLE;

    if (stage === "warm") {
      const h = holdRef.current;
      if (plausible && midi !== null) {
        if (h.target !== null && Math.abs(midi - h.target) <= 1) {
          h.ms += dt;
        } else {
          h.target = midi;
          h.ms = dt;
        }
        h.gapMs = 0;
        setHoldMs(h.ms);
        if (h.ms >= WARM_HOLD_MS && h.target !== null) {
          setAnchorMidi(h.target);
          setLowFound(h.target);
          setHighFound(h.target);
          resetHunt();
          setStage("low");
        }
      } else {
        h.gapMs += dt;
        if (h.gapMs > 350 && h.ms > 0) {
          h.target = null;
          h.ms = 0;
          setHoldMs(0);
        }
      }
      return;
    }

    // Low / high hunt: cumulative dwell per note prevents octave-error flukes.
    if (plausible && midi !== null) {
      const map = dwellMapRef.current;
      const ms = (map.get(midi) ?? 0) + dt;
      map.set(midi, ms);
      setDwell({ midi, ms });
      if (ms >= DWELL_MS) {
        if (stage === "low") {
          setLowFound((prev) => (prev === null ? midi : Math.min(prev, midi)));
        } else {
          setHighFound((prev) => (prev === null ? midi : Math.max(prev, midi)));
        }
      }
    }
  }, [frame, stage]);

  const advanceToHigh = () => {
    resetHunt();
    setStage("high");
  };

  const finish = () => {
    const anchor = anchorMidi ?? 57;
    const low = Math.min(lowFound ?? anchor, anchor);
    const high = Math.max(highFound ?? anchor, anchor);
    stop();
    const durationSec = Math.max(
      1,
      Math.round((performance.now() - startedAtRef.current) / 1000),
    );
    const r1 = setVocalRange(low, high);
    const r2 = logSession({
      type: "range",
      durationSec,
      detail: "Range test",
    });
    const seen = new Set<string>();
    const achievements: Achievement[] = [
      ...r1.newAchievements,
      ...r2.newAchievements,
    ].filter((a) => (seen.has(a.id) ? false : (seen.add(a.id), true)));
    setResult({
      lowMidi: low,
      highMidi: high,
      save: { xpGained: r1.xpGained + r2.xpGained, newAchievements: achievements },
    });
    setStage("result");
  };

  const retake = () => {
    stop();
    resetAll();
    setStage("intro");
  };

  const liveMidi = frame.note?.midi ?? null;
  const liveLabel = frame.note?.label ?? "—";
  const savedRange = progress.range;

  return (
    <PageShell
      kicker="Range test"
      title="Find your vocal range"
      subtitle="A guided two-minute test: hold a comfortable note, slide down to your lowest, then up to your highest."
      actions={
        stage !== "intro" && stage !== "result" ? <ListeningPill /> : undefined
      }
    >
      {stage !== "intro" && (
        <div className="mb-6">
          <StepIndicator stage={stage} />
        </div>
      )}

      {stage === "intro" && (
        <div className="space-y-6">
          {savedRange.lowMidi !== undefined &&
            savedRange.highMidi !== undefined && (
              <Card>
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <SectionLabel>Saved result</SectionLabel>
                    <div className="tabular mt-2 font-mono text-3xl font-bold">
                      {midiToLabel(savedRange.lowMidi)}
                      <span className="text-dim"> — </span>
                      {midiToLabel(savedRange.highMidi)}
                    </div>
                    <p className="mt-1 text-sm text-mut">
                      {savedRange.voiceTypeLabel ?? "Unclassified"}
                      {savedRange.testedAt &&
                        ` · tested ${new Date(savedRange.testedAt).toLocaleDateString()}`}
                    </p>
                  </div>
                  <Button variant="amber" onClick={begin}>
                    Retake test
                  </Button>
                </div>
                <div className="mt-5">
                  <PianoStrip
                    rangeLow={savedRange.lowMidi}
                    rangeHigh={savedRange.highMidi}
                    markLow={savedRange.lowMidi}
                    markHigh={savedRange.highMidi}
                    ariaLabel={`Keyboard showing your saved range from ${midiToLabel(savedRange.lowMidi)} to ${midiToLabel(savedRange.highMidi)}`}
                  />
                </div>
              </Card>
            )}

          <Card>
            <h2 className="text-xl">How it works</h2>
            <ol className="mt-3 max-w-xl list-decimal space-y-2 pl-5 text-sm text-mut">
              <li>Sing a comfortable note and hold it for two seconds.</li>
              <li>
                Slide down gradually. Each note you hold clearly counts toward
                your lowest.
              </li>
              <li>Slide up the same way — falsetto counts.</li>
              <li>
                Get your range, voice type, and how you compare to famous
                singers.
              </li>
            </ol>
            <p className="mt-3 text-sm text-dim">
              Takes about two minutes. Works best in a quiet room.
            </p>
            <div className="mt-5">
              <Button variant="rec" size="lg" onClick={begin}>
                Enable microphone
              </Button>
            </div>
            {error && (
              <p className="mt-4 max-w-md text-sm text-rec" role="alert">
                {error}
              </p>
            )}
          </Card>
        </div>
      )}

      {stage === "warm" && (
        <Card>
          <SectionLabel>Step 1 of 4</SectionLabel>
          <h2 className="mt-3 text-xl">Sing a comfortable note</h2>
          <p className="mt-2 max-w-xl text-sm text-mut">
            Any easy pitch — an “ahh” at normal speaking volume works well. Hold
            it steady for two seconds to lock in your starting register.
          </p>
          <div className="mt-6 flex items-end gap-6">
            <div>
              <div className="font-mono text-[11px] uppercase tracking-[0.14em] text-dim">
                Hearing
              </div>
              <div
                className="tabular mt-1 font-mono text-5xl font-bold text-amber-ink"
                aria-live="polite"
              >
                {liveLabel}
              </div>
            </div>
            <div className="flex-1 pb-2">
              <ProgressBar
                value={(holdMs / WARM_HOLD_MS) * 100}
                tone="amber"
              />
              <p className="mt-1.5 font-mono text-[11px] text-dim">
                Hold steady — {Math.max(0, ((WARM_HOLD_MS - holdMs) / 1000)).toFixed(1)}s
                to go
              </p>
            </div>
          </div>
          <div className="mt-6">
            <PianoStrip
              activeMidi={liveMidi}
              ariaLabel="Keyboard highlighting the note you are singing"
            />
          </div>
        </Card>
      )}

      {(stage === "low" || stage === "high") && (
        <Card>
          <SectionLabel>{stage === "low" ? "Step 2 of 4" : "Step 3 of 4"}</SectionLabel>
          <h2 className="mt-3 text-xl">
            {stage === "low"
              ? "Slide down to your lowest note"
              : "Slide up to your highest note"}
          </h2>
          <p className="mt-2 max-w-xl text-sm text-mut">
            {stage === "low"
              ? "Move down gradually, a step at a time. Hold each note clearly for a moment so it counts — croaky vocal fry at the bottom is fine."
              : "Move up gradually and hold each note clearly for a moment. Falsetto and head voice count — flip over and keep going."}
          </p>
          <div className="mt-6 flex flex-wrap items-end gap-8">
            <div>
              <div className="font-mono text-[11px] uppercase tracking-[0.14em] text-dim">
                Hearing
              </div>
              <div
                className="tabular mt-1 font-mono text-5xl font-bold text-amber-ink"
                aria-live="polite"
              >
                {liveLabel}
              </div>
            </div>
            <div>
              <div className="font-mono text-[11px] uppercase tracking-[0.14em] text-dim">
                {stage === "low" ? "Lowest so far" : "Highest so far"}
              </div>
              <div className="tabular mt-1 font-mono text-5xl font-bold">
                {stage === "low"
                  ? lowFound !== null
                    ? midiToLabel(lowFound)
                    : "—"
                  : highFound !== null
                    ? midiToLabel(highFound)
                    : "—"}
              </div>
            </div>
            <div className="min-w-40 flex-1 pb-2">
              <ProgressBar
                value={dwell ? Math.min(100, (dwell.ms / DWELL_MS) * 100) : 0}
                tone={dwell && dwell.ms >= DWELL_MS ? "ok" : "amber"}
              />
              <p className="mt-1.5 font-mono text-[11px] text-dim">
                {dwell
                  ? dwell.ms >= DWELL_MS
                    ? `${midiToLabel(dwell.midi)} counted`
                    : `Holding ${midiToLabel(dwell.midi)}…`
                  : "Waiting for a clear note"}
              </p>
            </div>
          </div>
          <div className="mt-6">
            <PianoStrip
              activeMidi={liveMidi}
              rangeLow={lowFound ?? anchorMidi ?? undefined}
              rangeHigh={
                stage === "low"
                  ? (anchorMidi ?? undefined)
                  : (highFound ?? anchorMidi ?? undefined)
              }
              markLow={lowFound ?? undefined}
              markHigh={stage === "high" ? (highFound ?? undefined) : undefined}
              ariaLabel="Keyboard highlighting the note you are singing and the range reached so far"
            />
          </div>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            {stage === "low" ? (
              <>
                <Button variant="amber" onClick={advanceToHigh}>
                  I can&apos;t go lower
                </Button>
                {lowFound !== null && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => playTone(lowFound)}
                  >
                    Hear my lowest
                  </Button>
                )}
              </>
            ) : (
              <>
                <Button variant="amber" onClick={finish}>
                  I can&apos;t go higher
                </Button>
                {highFound !== null && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => playTone(highFound)}
                  >
                    Hear my highest
                  </Button>
                )}
              </>
            )}
            <Button variant="ghost" size="sm" onClick={retake}>
              Start over
            </Button>
          </div>
        </Card>
      )}

      {stage === "result" && result && (
        <ResultView
          lowMidi={result.lowMidi}
          highMidi={result.highMidi}
          save={result.save}
          onRetake={begin}
        />
      )}

      {stage !== "intro" && stage !== "result" && !listening && (
        <p className="mt-4 text-sm text-rec" role="alert">
          The microphone stopped. Press start over and enable it again.
        </p>
      )}
    </PageShell>
  );
}
