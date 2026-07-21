"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { UsePitchResult } from "@/lib/audio/use-pitch";
import { freqToMidiFloat } from "@/lib/audio/notes";
import { playTone, clickAt } from "@/lib/audio/synth";
import { audioNow, getAudioContext } from "@/lib/audio/context";
import { logSession, type VocalRange } from "@/lib/progress";
import { Button, Card, LinkButton, Pill, ProgressBar, SectionLabel } from "@/components/ui";
import type { Song } from "./data";
import {
  IconArrowLeft,
  IconMinus,
  IconPause,
  IconPlay,
  IconPlus,
  IconRestart,
} from "./icons";
import { PianoRoll } from "./piano-roll";
import {
  COUNT_IN_BEATS,
  LOOPS,
  MIN_VOLUME,
  TEMPOS,
  TOLERANCE_CENTS,
  clampTranspose,
  fitTransposeToRange,
  foldedCents,
  hardestNotes,
  noteIndexAtBeat,
  secPerBeat,
  songTotalBeats,
  transposedNotes,
  type SessionSummaryData,
  type Tempo,
} from "./lib";

type Phase = "idle" | "running" | "paused" | "finished";
type GuideVolume = "full" | "quiet" | "off";

export function SongPlayer({
  song,
  pitch,
  range,
  onFinish,
  onExit,
}: {
  song: Song;
  pitch: UsePitchResult;
  range: VocalRange;
  onFinish: (summary: SessionSummaryData) => void;
  onExit: () => void;
}) {
  const [transpose, setTranspose] = useState(0);
  const [tempo, setTempo] = useState<Tempo>(1);
  const [guideVolume, setGuideVolume] = useState<GuideVolume>("full");
  const [octaveAgnostic, setOctaveAgnostic] = useState(false);
  const [phase, setPhase] = useState<Phase>("idle");
  const [countInBeat, setCountInBeat] = useState(-1);
  const [loopIndex, setLoopIndex] = useState(0);
  const [runningScore, setRunningScore] = useState(0);
  const [perLoopScores, setPerLoopScores] = useState<number[]>([]);

  const currentNotes = useMemo(() => transposedNotes(song, transpose), [song, transpose]);
  const totalBeats = useMemo(() => songTotalBeats(song), [song]);

  const controlsEnabled = phase === "idle";
  const listening = pitch.listening;

  // Refs mirroring state/props for use inside the audio-clock-driven loops.
  const currentNotesRef = useRef(currentNotes);
  currentNotesRef.current = currentNotes;
  const totalBeatsRef = useRef(totalBeats);
  totalBeatsRef.current = totalBeats;
  const guideVolumeRef = useRef(guideVolume);
  guideVolumeRef.current = guideVolume;
  const octaveAgnosticRef = useRef(octaveAgnostic);
  octaveAgnosticRef.current = octaveAgnostic;
  const listeningRef = useRef(listening);
  listeningRef.current = listening;

  const positionBeatsRef = useRef<number | null>(null);
  const hitRatioRef = useRef<number[]>([]);
  const hitSecRef = useRef<number[]>([]);
  const possibleSecRef = useRef<number[]>([]);
  const loopSnapshotRef = useRef(0);
  const loopIndexTrackRef = useRef(0);
  const perLoopScoresRef = useRef<number[]>([]);

  const spbRef = useRef(secPerBeat(song.bpm, 1));
  const t0Ref = useRef(0);
  const pausedGlobalBeatsRef = useRef(0);
  const scheduledMaskRef = useRef<boolean[]>([]);
  const sessionStartRef = useRef(0);
  const lastTickRef = useRef(0);
  const scoreAccumRef = useRef(0);
  const finishedRef = useRef(false);

  const rafRef = useRef(0);
  const schedTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopLoops = () => {
    cancelAnimationFrame(rafRef.current);
    if (schedTimerRef.current) clearInterval(schedTimerRef.current);
    schedTimerRef.current = null;
  };
  useEffect(() => stopLoops, []);

  function schedTick() {
    const spb = spbRef.current;
    const notes = currentNotesRef.current;
    const total = notes.length;
    const horizon = audioNow() + 0.35;
    const mask = scheduledMaskRef.current;
    for (let slot = 0; slot < total * LOOPS; slot++) {
      if (mask[slot]) continue;
      const loopIdx = Math.floor(slot / total);
      const noteIdx = slot % total;
      const note = notes[noteIdx];
      const beatAbs = loopIdx * totalBeatsRef.current + note.startBeat;
      const time = t0Ref.current + beatAbs * spb;
      if (time > horizon) break; // events are in ascending time order
      mask[slot] = true;
      const gv = guideVolumeRef.current;
      if (gv !== "off") {
        playTone(note.midi, {
          dur: note.durBeats * spb * 0.92,
          gain: gv === "full" ? 0.2 : 0.07,
          at: time - audioNow(),
        });
      }
    }
  }

  function finalize() {
    if (finishedRef.current) return;
    finishedRef.current = true;
    stopLoops();

    const spb = spbRef.current;
    const notes = currentNotesRef.current;
    const denom = notes.reduce((a, n) => a + n.durBeats, 0) * spb;
    const hitTotalNow = hitSecRef.current.reduce((a, b) => a + b, 0);
    const delta = hitTotalNow - loopSnapshotRef.current;
    const lastLoopScore = denom > 0 ? Math.round(Math.min(100, (delta / denom) * 100)) : 0;
    const finalPerLoop = [...perLoopScoresRef.current, lastLoopScore];

    const totalPossible = possibleSecRef.current.reduce((a, b) => a + b, 0);
    const overallScore =
      listeningRef.current && totalPossible > 0
        ? Math.round(Math.min(100, (hitTotalNow / totalPossible) * 100))
        : undefined;
    const durationSec = Math.max(1, Math.round((performance.now() - sessionStartRef.current) / 1000));

    const log = logSession({
      type: "song",
      durationSec,
      score: overallScore,
      detail: song.title,
    });

    const hardest = listeningRef.current ? hardestNotes(notes, hitRatioRef.current) : [];

    setPhase("finished");
    positionBeatsRef.current = null;
    onFinish({
      song,
      score: overallScore,
      perLoopScores: finalPerLoop,
      hardest,
      xpGained: log.xpGained,
      newAchievements: log.newAchievements,
      listenMode: !listeningRef.current,
    });
  }

  function rafTick() {
    const spb = spbRef.current;
    const now = performance.now();
    const dt = Math.min(0.12, lastTickRef.current ? (now - lastTickRef.current) / 1000 : 0);
    lastTickRef.current = now;

    const elapsedGlobal = (audioNow() - t0Ref.current) / spb;
    const totalSessionBeats = LOOPS * totalBeatsRef.current;

    if (elapsedGlobal < 0) {
      positionBeatsRef.current = null;
      const beat = Math.floor(elapsedGlobal + COUNT_IN_BEATS);
      setCountInBeat(Math.min(COUNT_IN_BEATS - 1, Math.max(0, beat)));
      rafRef.current = requestAnimationFrame(rafTick);
      return;
    }
    setCountInBeat(-1);

    if (elapsedGlobal >= totalSessionBeats) {
      finalize();
      return;
    }

    const loopIdx = Math.min(LOOPS - 1, Math.floor(elapsedGlobal / totalBeatsRef.current));
    const beatInLoop = elapsedGlobal - loopIdx * totalBeatsRef.current;
    positionBeatsRef.current = beatInLoop;

    if (loopIdx !== loopIndexTrackRef.current) {
      const notes = currentNotesRef.current;
      const denom = notes.reduce((a, n) => a + n.durBeats, 0) * spb;
      const hitTotalNow = hitSecRef.current.reduce((a, b) => a + b, 0);
      const delta = hitTotalNow - loopSnapshotRef.current;
      const loopScore = denom > 0 ? Math.round(Math.min(100, (delta / denom) * 100)) : 0;
      perLoopScoresRef.current = [...perLoopScoresRef.current, loopScore];
      setPerLoopScores(perLoopScoresRef.current);
      loopSnapshotRef.current = hitTotalNow;
      loopIndexTrackRef.current = loopIdx;
      setLoopIndex(loopIdx);
    }

    if (listeningRef.current) {
      const f = pitch.latest.current;
      const voiced = f.freq !== null && f.volume >= MIN_VOLUME;
      if (voiced && f.freq !== null) {
        const midiFloat = freqToMidiFloat(f.freq);
        const idx = noteIndexAtBeat(currentNotesRef.current, beatInLoop);
        if (idx >= 0) {
          const cents = foldedCents(midiFloat, currentNotesRef.current[idx].midi, octaveAgnosticRef.current);
          if (Math.abs(cents) <= TOLERANCE_CENTS) {
            hitSecRef.current[idx] = (hitSecRef.current[idx] ?? 0) + dt;
          }
        }
      }
      const ratios = hitRatioRef.current;
      for (let i = 0; i < ratios.length; i++) {
        const poss = possibleSecRef.current[i] ?? 0;
        ratios[i] = poss > 0 ? Math.min(1, (hitSecRef.current[i] ?? 0) / poss) : 0;
      }

      scoreAccumRef.current += dt;
      if (scoreAccumRef.current > 0.15) {
        scoreAccumRef.current = 0;
        const totalPossible = possibleSecRef.current.reduce((a, b) => a + b, 0);
        const totalHit = hitSecRef.current.reduce((a, b) => a + b, 0);
        setRunningScore(totalPossible > 0 ? Math.round(Math.min(100, (totalHit / totalPossible) * 100)) : 0);
      }
    }

    rafRef.current = requestAnimationFrame(rafTick);
  }

  /** Full reset + count-in + play, from the top of the phrase. */
  function beginSession() {
    getAudioContext();
    stopLoops();
    finishedRef.current = false;

    const spb = secPerBeat(song.bpm, tempo);
    spbRef.current = spb;
    const notes = currentNotesRef.current;
    possibleSecRef.current = notes.map((n) => n.durBeats * spb * LOOPS);
    hitSecRef.current = notes.map(() => 0);
    hitRatioRef.current = notes.map(() => 0);
    scheduledMaskRef.current = new Array(notes.length * LOOPS).fill(false);
    loopSnapshotRef.current = 0;
    loopIndexTrackRef.current = 0;
    perLoopScoresRef.current = [];
    setPerLoopScores([]);
    setLoopIndex(0);
    setRunningScore(0);
    lastTickRef.current = 0;
    sessionStartRef.current = performance.now();

    const LEAD = 0.15;
    const countInStart = audioNow() + LEAD;
    t0Ref.current = countInStart + COUNT_IN_BEATS * spb;
    for (let i = 0; i < COUNT_IN_BEATS; i++) clickAt(countInStart + i * spb, i === 0);
    pausedGlobalBeatsRef.current = 0;

    setPhase("running");
    schedTimerRef.current = setInterval(schedTick, 90);
    schedTick();
    rafRef.current = requestAnimationFrame(rafTick);
  }

  function pause() {
    stopLoops();
    const spb = spbRef.current;
    const elapsedGlobal = Math.max(0, (audioNow() - t0Ref.current) / spb);
    pausedGlobalBeatsRef.current = elapsedGlobal;
    setPhase("paused");
  }

  function resume() {
    const spb = spbRef.current;
    t0Ref.current = audioNow() - pausedGlobalBeatsRef.current * spb;
    setPhase("running");
    schedTimerRef.current = setInterval(schedTick, 90);
    schedTick();
    lastTickRef.current = 0;
    rafRef.current = requestAnimationFrame(rafTick);
  }

  function togglePlayPause() {
    if (phase === "idle") beginSession();
    else if (phase === "running") pause();
    else if (phase === "paused") resume();
  }

  function restart() {
    beginSession();
  }

  function endPractice() {
    stopLoops();
    onExit();
  }

  // Space bar toggles play/pause (not while typing or another button is focused).
  // Routed through a ref so the listener always calls the latest closure.
  const togglePlayPauseRef = useRef(togglePlayPause);
  togglePlayPauseRef.current = togglePlayPause;
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.code !== "Space") return;
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "BUTTON") return;
      e.preventDefault();
      togglePlayPauseRef.current();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  function applyFitToRange() {
    const semis = fitTransposeToRange(song, range);
    if (semis !== null) setTranspose(semis);
  }

  const hasRange = range.lowMidi !== undefined && range.highMidi !== undefined;
  const effBpm = Math.round(song.bpm * tempo);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={endPractice}
          aria-label="Exit practice"
          className="inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-sm text-mut hover:text-ink"
        >
          <IconArrowLeft />
          Exit
        </button>
        <div className="flex items-center gap-2">
          {!listening && <Pill tone="cool">Listen mode</Pill>}
          <Pill tone="amber">
            Loop {phase === "idle" ? 0 : Math.min(LOOPS, loopIndex + 1)} of {LOOPS}
          </Pill>
        </div>
      </div>
      <ProgressBar value={(loopIndex / LOOPS) * 100} tone="amber" />

      <Card>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <SectionLabel>{song.title}</SectionLabel>
            <h2 className="mt-3 text-xl">
              {phase === "idle"
                ? "Ready"
                : countInBeat >= 0
                  ? "Count-in…"
                  : listening
                    ? "Sing along"
                    : "Listening back"}
            </h2>
            <p className="mt-1.5 max-w-md text-sm text-mut">{song.origin}</p>
          </div>
          <div className="text-right">
            <div className="font-mono text-[11px] uppercase tracking-[0.14em] text-dim">
              Tempo
            </div>
            <div className="tabular mt-1 font-mono text-3xl font-bold text-amber">
              {effBpm}
              <span className="ml-1 text-sm text-mut">bpm</span>
            </div>
          </div>
        </div>

        <div className="mt-6 overflow-x-auto rounded-xl border border-line bg-panel2 p-2">
          <PianoRoll
            notes={currentNotes}
            totalBeats={totalBeats}
            positionBeatsRef={positionBeatsRef}
            hitRatioRef={hitRatioRef}
            latest={pitch.latest}
            showLive={listening}
            className="h-48 w-full"
          />
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-6">
          {listening ? (
            <div>
              <div className="font-mono text-[11px] uppercase tracking-[0.14em] text-dim">
                Running score
              </div>
              <div className="tabular mt-1 font-mono text-2xl text-ok">{runningScore}%</div>
            </div>
          ) : (
            <p className="max-w-sm text-sm text-mut">
              Practicing without a mic. Enable it to see your live score.
            </p>
          )}
          {perLoopScores.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-dim">
                Per loop
              </span>
              {perLoopScores.map((s, i) => (
                <Pill key={i} tone={s >= 80 ? "ok" : s >= 50 ? "amber" : "mut"}>
                  {s}%
                </Pill>
              ))}
            </div>
          )}
          {pitch.error && (
            <p className="font-mono text-xs text-rec" role="alert">
              {pitch.error}
            </p>
          )}
        </div>
      </Card>

      <Card>
        <div className="flex flex-wrap items-center gap-3">
          <Button
            variant={phase === "running" ? "outline" : "amber"}
            size="sm"
            onClick={togglePlayPause}
            aria-label={phase === "running" ? "Pause" : "Play"}
          >
            {phase === "running" ? <IconPause /> : <IconPlay />}
            {phase === "running" ? "Pause" : phase === "paused" ? "Resume" : "Play"}
          </Button>
          <Button variant="ghost" size="sm" onClick={restart}>
            <IconRestart /> Restart
          </Button>

          <div className="flex items-center gap-1 rounded-full border border-line2 px-1 py-1">
            <button
              type="button"
              aria-label="Transpose down a semitone"
              disabled={!controlsEnabled}
              onClick={() => setTranspose((t) => clampTranspose(t - 1))}
              className="rounded-full p-1.5 text-mut hover:text-ink disabled:opacity-40"
            >
              <IconMinus />
            </button>
            <span className="tabular px-1 font-mono text-xs text-mut">
              {transpose > 0 ? `+${transpose}` : transpose}
            </span>
            <button
              type="button"
              aria-label="Transpose up a semitone"
              disabled={!controlsEnabled}
              onClick={() => setTranspose((t) => clampTranspose(t + 1))}
              className="rounded-full p-1.5 text-mut hover:text-ink disabled:opacity-40"
            >
              <IconPlus />
            </button>
          </div>

          {hasRange ? (
            <Button variant="outline" size="sm" disabled={!controlsEnabled} onClick={applyFitToRange}>
              Fit to my range
            </Button>
          ) : (
            <LinkButton href="/range" variant="ghost" size="sm">
              Take the range test to fit
            </LinkButton>
          )}

          <div className="flex items-center gap-1 rounded-full border border-line2 px-1 py-1">
            {TEMPOS.map((tv) => (
              <button
                key={tv}
                type="button"
                disabled={!controlsEnabled}
                onClick={() => setTempo(tv)}
                aria-pressed={tempo === tv}
                className={`rounded-full px-2.5 py-1 font-mono text-xs disabled:opacity-40 ${
                  tempo === tv ? "bg-panel2 text-amber" : "text-mut hover:text-ink"
                }`}
              >
                {tv}×
              </button>
            ))}
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={() =>
              setGuideVolume((g) => (g === "full" ? "quiet" : g === "quiet" ? "off" : "full"))
            }
            aria-label="Cycle guide volume"
          >
            Guide: {guideVolume}
          </Button>

          <Button
            variant="ghost"
            size="sm"
            aria-pressed={octaveAgnostic}
            onClick={() => setOctaveAgnostic((v) => !v)}
          >
            {octaveAgnostic ? "Any octave" : "Exact octave"}
          </Button>

          <span className="flex-1" />

          <Button variant="rec" size="sm" onClick={endPractice}>
            End practice
          </Button>
        </div>
      </Card>
    </div>
  );
}
