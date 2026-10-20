"use client";

import { useEffect, useRef, useState } from "react";
import { usePitch } from "@/lib/audio/use-pitch";
import { midiToLabel, voiceFitLabel } from "@/lib/audio/notes";
import { playTone } from "@/lib/audio/synth";
import {
  logSession,
  setVocalRange,
  useProgress,
  type Achievement,
} from "@/lib/progress";
import { emitProResult } from "@/lib/pro-signal";
import {
  Button,
  Card,
  PageShell,
  Pill,
  ProgressBar,
  SectionLabel,
} from "@/components/ui";
import { ProWhisper } from "@/components/pro/gate";
import { MicAlert } from "@/components/mic-alert";
import { AudioSetup } from "@/components/audio/audio-setup";
import { focusIfDropped } from "@/lib/audio/mic-focus";
import { PianoStrip } from "./piano-strip";
import { freshInputHint, nextInputHint } from "./pitch-meter-hint";
import { ResultView, type SaveSummary } from "./result-view";

type Stage = "intro" | "warm" | "low" | "high" | "result";

/**
 * Whether finishing a range test may signal the one-time Pro moment, given
 * the range history as it stood before this test was saved. A singer's first
 * range result is the screen the whole funnel leads to, so it is never
 * covered by a full-screen sales dialog; a retake can carry it. (A history
 * migrated from a pre-history saved range counts as a prior test.)
 */
export function offersProMomentAfterRangeTest(
  priorRangeHistory: readonly unknown[],
): boolean {
  return priorRangeHistory.length > 0;
}

/**
 * The narrowest span saved as a range: the same five semitones the pitch
 * meter waits for before suggesting the test. A bailed-out run that never
 * left its starting note (A3–A3, 0 semitones) is not a measurement, and
 * saving it would replace a real range and collapse every warmup ladder and
 * song key fitted to it.
 */
export const MIN_SAVED_SPAN = 5;

/**
 * The range a test has counted so far: the notes found in each direction,
 * never narrower than the starting note, and whether it is wide enough to
 * save.
 */
export function countedRange(
  anchorMidi: number | null,
  lowFound: number | null,
  highFound: number | null,
): { lowMidi: number; highMidi: number; savable: boolean } {
  const anchor = anchorMidi ?? 57;
  const lowMidi = Math.min(lowFound ?? anchor, anchor);
  const highMidi = Math.max(highFound ?? anchor, anchor);
  return { lowMidi, highMidi, savable: highMidi - lowMidi >= MIN_SAVED_SPAN };
}

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
                  ? "border-violet/50 text-violet-ink"
                  : state === "done"
                    ? "border-ok/40 text-ok-ink"
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

function InputHint({ hint }: { hint: string | null }) {
  return (
    <p
      className="mt-4 max-w-xl border-l-2 border-violet/50 pl-3 text-sm text-mut"
      aria-live="polite"
    >
      {hint}
    </p>
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

export function RangeTest({ embedded = false }: { embedded?: boolean } = {}) {
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

  /** "I can't go higher" was pressed on a span too narrow to save. */
  const [tooNarrow, setTooNarrow] = useState(false);

  /**
   * Which intro button last asked for the mic: the saved-result card's
   * "Retake test" or the how-to card's "Start free range test". A refusal is
   * shown under the button that was pressed; under the other one it sat
   * 490–550px away at the bottom edge of the screen.
   */
  const [micFrom, setMicFrom] = useState<"saved" | "intro">("intro");

  /** Why the note isn't counting, when it isn't. Null while things are fine. */
  const [inputHint, setInputHint] = useState<string | null>(null);

  const lastTRef = useRef(0);
  /** Rolling evidence about the mic, so the hint describes what we measured. */
  const inputRef = useRef(freshInputHint());
  /** Mirrors inputHint so the analysis effect never reads the state it sets. */
  const hintRef = useRef<string | null>(null);
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
    setTooNarrow(false);
    lastTRef.current = 0;
  };

  const resetAll = () => {
    setAnchorMidi(null);
    setLowFound(null);
    setHighFound(null);
    setHoldMs(0);
    setResult(null);
    setInputHint(null);
    hintRef.current = null;
    inputRef.current = freshInputHint();
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

  /** Starts from one of the intro's two buttons, remembering which. */
  const beginFrom = (from: "saved" | "intro") => {
    setMicFrom(from);
    void begin();
  };

  /** Publishes a hint only when it actually changes, so steady state is quiet. */
  const showHint = (next: string | null) => {
    if (hintRef.current === next) return;
    hintRef.current = next;
    setInputHint(next);
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

    // A singer who is too quiet, or too far from the mic, currently gets an
    // empty readout and a bar that never fills — with nothing to act on. The
    // test asks for "normal speaking volume", and with automatic gain
    // deliberately disabled that is often below the floor the detector needs,
    // so this is the common case rather than the odd one. The rule is shared
    // with the pitch meter (./pitch-meter-hint), so both rooms say the same
    // thing about the same input.
    showHint(nextInputHint(inputRef.current, frame, dt, voiced, MIN_VOLUME));

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

  // Each stage swaps in a card of a different height while the page stays put,
  // so on a phone the "counted" line, the too-quiet hint and the button that
  // moves the test on ended up under the bottom tab bar, and the result opened
  // with its readout under the header. Align each new stage with the top of
  // the screen instead. "Start over" goes back to the intro from a page
  // scrolled down to the stage card, which left the intro's heading under the
  // header, so it brings the top of the test back. The first render is left
  // alone: it is where the page landed.
  const topRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const shownStageRef = useRef<Stage>("intro");
  useEffect(() => {
    const from = shownStageRef.current;
    shownStageRef.current = stage;
    if (stage === from) return;
    (stage === "intro" ? topRef : stageRef).current?.scrollIntoView({ block: "start" });
  }, [stage]);

  // The card that replaces the intro takes the pressed button with it, so
  // keyboard focus fell to <body> as the mic opened: a screen reader heard
  // nothing of the new step. Each stage card's heading takes it instead, only
  // when it was dropped (lib/audio/mic-focus.ts).
  const stageHeadingRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    focusIfDropped(stageHeadingRef.current);
  }, [stage]);

  const advanceToHigh = () => {
    resetHunt();
    setStage("high");
  };

  const finish = () => {
    const { lowMidi: low, highMidi: high, savable } = countedRange(anchorMidi, lowFound, highFound);
    // Nothing is saved, logged or offered for a span under the minimum: the
    // mic stays on so the singer can keep sliding, or press Start over.
    if (!savable) {
      setTooNarrow(true);
      return;
    }
    stop();
    const durationSec = Math.max(
      1,
      Math.round((performance.now() - startedAtRef.current) / 1000),
    );
    // Read before the save below appends this test to the history.
    const offerPro = offersProMomentAfterRangeTest(progress.rangeHistory);
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
    if (offerPro) emitProResult();
  };

  const retake = () => {
    stop();
    resetAll();
    setStage("intro");
  };

  const liveMidi = frame.note?.midi ?? null;
  const liveLabel = frame.note?.label ?? "—";
  const savedRange = progress.range;
  const counted = countedRange(anchorMidi, lowFound, highFound);

  // Only while the mic is actually on: a mic that stops mid-test (unplugged,
  // a headset dropped) ends the stream, and the pill used to stay lit over
  // the "microphone stopped" line.
  const pill =
    listening && stage !== "intro" && stage !== "result" ? <ListeningPill /> : undefined;
  // One alert for the intro, under whichever button asked for the mic.
  const introAlert = error ? (
    <MicAlert message={error} className="mt-4 max-w-md text-sm text-rec" />
  ) : null;
  const wrap = (children: React.ReactNode) =>
    embedded ? (
      <div>
        {pill && <div className="mb-4 flex justify-end">{pill}</div>}
        {children}
      </div>
    ) : (
      <PageShell
        kicker="Range test"
        title="Find your vocal range"
        subtitle="A guided two-minute test: hold a comfortable note, slide down to your lowest, then up to your highest."
        actions={pill}
      >
        {children}
      </PageShell>
    );

  return wrap(
    <>
      {/* Where "Start over" scrolls back to: the top of the intro. */}
      <div ref={topRef} />
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
                      {/* Worked out from the notes, not the stored label: a
                          label saved before the two-band rule would name one
                          band where the result screen names both. */}
                      Closest fit:{" "}
                      {voiceFitLabel(savedRange.lowMidi, savedRange.highMidi)}
                      {savedRange.testedAt &&
                        ` · tested ${new Date(savedRange.testedAt).toLocaleDateString()}`}
                    </p>
                  </div>
                  <Button variant="violet" onClick={() => beginFrom("saved")}>
                    Retake test
                  </Button>
                </div>
                {micFrom === "saved" && introAlert}
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
            <h2 className="text-xl">How to find your vocal range</h2>
            <ol className="mt-3 max-w-xl list-decimal space-y-2 pl-5 text-sm text-mut">
              <li>
                Sing a comfortable note out loud and hold it for two seconds.
              </li>
              <li>
                Slide down gradually. Each note you hold clearly counts toward
                your lowest.
              </li>
              <li>Slide up the same way — falsetto counts.</li>
              <li>
                Get your range, a voice-type estimate, and how you compare to
                famous singers.
              </li>
            </ol>
            <p className="mt-3 text-sm text-dim">
              Takes about two minutes. Works best in a quiet room.
            </p>
            <p className="mt-2 max-w-xl text-sm text-rec">
              Use a comfortable volume. Stop if a note causes pain or strain.
            </p>
            <div className="mt-5">
              <Button variant="rec" size="lg" onClick={() => beginFrom("intro")}>
                Start free range test
              </Button>
            </div>
            {/* With no saved card on screen, its button cannot have been the
                one pressed. */}
            {(micFrom === "intro" ||
              savedRange.lowMidi === undefined ||
              savedRange.highMidi === undefined) &&
              introAlert}
            {/* The room where the input device matters most. A laptop lid mic
                rolls off exactly the low end a bass is trying to prove, so the
                test hands back a range short at the bottom and the singer has
                no reason to doubt it. */}
            <AudioSetup className="mt-6 max-w-md" />
            <ProWhisper className="mt-4" />
          </Card>
        </div>
      )}

      {/* Where each stage after the intro scrolls to. No scroll-mt: the
          page's scroll-padding-top already clears the sticky header, and the
          extra 80px would put the button back under a 375x667 phone's tab
          bar. Measured there: "I can't go lower" sits at 499-543 against a
          bar at 610. While the four-line too-quiet hint shows, the hint is in
          view and the button drops to about 595-639, but that hint means no
          pitch is coming through yet, and it clears as soon as one does. */}
      <div id="range-stage" ref={stageRef} />
      {stage === "warm" && (
        <Card>
          <SectionLabel>Step 1 of 4</SectionLabel>
          <h2 ref={stageHeadingRef} tabIndex={-1} className="mt-3 text-xl outline-none">
            Sing a comfortable note
          </h2>
          <p className="mt-2 max-w-xl text-sm text-mut">
            Any easy pitch — an “ahh”, sung out as if to someone across the
            room. A note at talking volume is often too quiet to measure. Hold
            it steady for two seconds to lock in your starting register.
          </p>
          <div className="mt-6 flex items-end gap-6">
            <div>
              <div className="font-mono text-[11px] uppercase tracking-[0.14em] text-dim">
                Hearing
              </div>
              <div
                className="tabular mt-1 font-mono text-5xl font-bold text-violet-ink"
                aria-live="polite"
              >
                {liveLabel}
              </div>
            </div>
            <div className="flex-1 pb-2">
              <ProgressBar
                value={(holdMs / WARM_HOLD_MS) * 100}
                tone="violet"
              />
              <p className="mt-1.5 font-mono text-[11px] text-dim">
                Hold steady — {Math.max(0, ((WARM_HOLD_MS - holdMs) / 1000)).toFixed(1)}s
                to go
              </p>
            </div>
          </div>
          {listening && inputHint && <InputHint hint={inputHint} />}
          <div className="mt-6">
            <PianoStrip
              activeMidi={liveMidi}
              ariaLabel="Keyboard highlighting the note you are singing"
            />
          </div>
          {/* The way out the other stages have: stops the mic and goes back
              to the intro, where the microphone picker is. */}
          <div className="mt-6">
            <Button variant="ghost" size="sm" onClick={retake}>
              Start over
            </Button>
          </div>
        </Card>
      )}

      {(stage === "low" || stage === "high") && (
        <Card>
          <SectionLabel>{stage === "low" ? "Step 2 of 4" : "Step 3 of 4"}</SectionLabel>
          <h2 ref={stageHeadingRef} tabIndex={-1} className="mt-3 text-xl outline-none">
            {stage === "low"
              ? "Slide down to your lowest note"
              : "Slide up to your highest note"}
          </h2>
          {/* Said where the instruction is, not under the buttons: there,
              on a 375x667 phone, the line sat under the tab bar, so pressing
              "I can't go higher" seemed to do nothing. It stands in for the
              instruction (and repeats its strain rule) so the buttons do not
              move down either. */}
          {stage === "high" && tooNarrow && !counted.savable ? (
            <p role="status" className="mt-2 max-w-xl text-sm text-ink">
              So far the test has counted{" "}
              {counted.lowMidi === counted.highMidi
                ? `only ${midiToLabel(counted.lowMidi)}`
                : `${midiToLabel(counted.lowMidi)} to ${midiToLabel(counted.highMidi)}`}
              , too narrow to save as your range
              {savedRange.lowMidi !== undefined
                ? ", so your saved range stays as it is"
                : ""}
              . Keep sliding up and hold each note for a moment, stopping
              before a note strains, or press Start over.
            </p>
          ) : (
            <p className="mt-2 max-w-xl text-sm text-mut">
              {stage === "low"
                ? "Move down gradually, a step at a time. Hold each note clearly for a moment so it counts. Stop when the sound turns to croak, rattle, or air."
                : "Move up gradually and hold each note clearly for a moment. Falsetto and head voice count. Stop before a note causes pain or strain."}
            </p>
          )}
          <div className="mt-6 flex flex-wrap items-end gap-8">
            <div>
              <div className="font-mono text-[11px] uppercase tracking-[0.14em] text-dim">
                Hearing
              </div>
              <div
                className="tabular mt-1 font-mono text-5xl font-bold text-violet-ink"
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
                tone={dwell && dwell.ms >= DWELL_MS ? "ok" : "violet"}
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
          {listening && inputHint && <InputHint hint={inputHint} />}
          <div className="mt-6 flex flex-wrap items-center gap-3">
            {stage === "low" ? (
              <>
                <Button variant="violet" onClick={advanceToHigh}>
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
                <Button variant="violet" onClick={finish}>
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
        <>
          {/* "Retake test" calls begin(), which stays on the result when the
              mic fails to open (busy, unplugged, refused). The intro's alert
              is not rendered here, so without this the press looked dead.
              usePitch clears the error on the next successful start. */}
          {error && (
            <MicAlert message={error} className="mb-4 max-w-md text-sm text-rec" />
          )}
          <ResultView
            lowMidi={result.lowMidi}
            highMidi={result.highMidi}
            save={result.save}
            onRetake={begin}
          />
        </>
      )}

      {stage !== "intro" && stage !== "result" && !listening && (
        <p className="mt-4 text-sm text-rec" role="alert">
          The microphone stopped. Press start over and enable it again.
        </p>
      )}
    </>,
  );
}
