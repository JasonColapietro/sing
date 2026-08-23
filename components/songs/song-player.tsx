"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { UsePitchResult } from "@/lib/audio/use-pitch";
import { freqToMidiFloat } from "@/lib/audio/notes";
import { playTone, clickAt } from "@/lib/audio/synth";
import { audioNow, getAudioContext } from "@/lib/audio/context";
import { logSession, type VocalRange } from "@/lib/progress";
import { tallyFromScores } from "@/lib/analytics";
import { Button, Card, Pill, ProgressBar, SectionLabel } from "@/components/ui";
import type { Song } from "./data";
import {
  IconArrowLeft,
  IconCollapse,
  IconExpand,
  IconPause,
  IconPlay,
  IconRestart,
} from "./icons";
import { PianoRoll } from "./piano-roll";
import { LyricBand } from "./lyric-band";
import { JudgmentReadout, type JudgmentEvent } from "./judgment";
import { Mixer } from "./mixer";
import { Stage, requestStageFullscreen } from "./stage";
import {
  COUNT_IN_BEATS,
  MIN_VOLUME,
  TOLERANCE_CENTS,
  clampTranspose,
  emptyTally,
  fitTransposeToRange,
  foldedCents,
  hardestNotes,
  judgeRatio,
  loopsFor,
  lyricLines,
  noteIndexAtBeat,
  secPerBeat,
  sectionAtBeat,
  songTotalBeats,
  transposedNotes,
  type JudgmentTally,
  type SessionSummaryData,
  type Tempo,
} from "./lib";

type Phase = "idle" | "running" | "paused" | "finished";

/** Guide gain with the mixer at 100% — the level the old "full" setting used. */
const GUIDE_MAX_GAIN = 0.2;

/**
 * Reps when drilling a single section. A section is picked precisely because it
 * needs repetition, so this does not follow the song's `defaultLoops` (a full
 * arrangement's 1 would defeat the point).
 */
const SECTION_DRILL_LOOPS = 4;

/** Transport, shared by the in-page player and stage mode. */
function Transport({
  phase,
  size,
  onToggle,
  onRestart,
}: {
  phase: Phase;
  size: "sm" | "md";
  onToggle: () => void;
  onRestart: () => void;
}) {
  return (
    <>
      <Button
        variant={phase === "running" ? "outline" : "amber"}
        size={size}
        onClick={onToggle}
        aria-label={phase === "running" ? "Pause" : "Play"}
      >
        {phase === "running" ? <IconPause /> : <IconPlay />}
        {phase === "running" ? "Pause" : phase === "paused" ? "Resume" : "Play"}
      </Button>
      <Button variant="ghost" size={size} onClick={onRestart}>
        <IconRestart /> Restart
      </Button>
    </>
  );
}

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
  const [guidePct, setGuidePct] = useState(100);
  const [clickDuringPlay, setClickDuringPlay] = useState(false);
  const [octaveAgnostic, setOctaveAgnostic] = useState(false);
  const [phase, setPhase] = useState<Phase>("idle");
  const phaseRef = useRef<Phase>("idle");
  phaseRef.current = phase;
  const pauseRef = useRef<() => void>(() => {});
  const [countInBeat, setCountInBeat] = useState(-1);
  const [loopIndex, setLoopIndex] = useState(0);
  const [runningScore, setRunningScore] = useState(0);
  const [progressPct, setProgressPct] = useState(0);
  const [perLoopScores, setPerLoopScores] = useState<number[]>([]);
  /** -1 = the whole song; otherwise an index into `song.sections`. */
  const [sectionIndex, setSectionIndex] = useState(-1);
  const [sectionLabel, setSectionLabel] = useState<string | null>(null);
  const [stageMode, setStageMode] = useState(false);

  const currentNotes = useMemo(() => transposedNotes(song, transpose), [song, transpose]);
  const totalBeats = useMemo(() => songTotalBeats(song), [song]);
  const lines = useMemo(() => lyricLines(currentNotes), [currentNotes]);
  const sections = useMemo(() => song.sections ?? [], [song]);

  const controlsEnabled = phase === "idle";
  const listening = pitch.listening;

  // The span of the song this session sings: the whole phrase, or one section
  // when the singer is drilling. Fixed at count-in — the section picker is
  // disabled while running, because the score denominator is built from this.
  const drilled = sectionIndex >= 0 ? sections[sectionIndex] : undefined;
  const spanStart = drilled ? drilled.startBeat : 0;
  const spanEnd = drilled ? drilled.endBeat : totalBeats;
  const plannedLoops = drilled ? SECTION_DRILL_LOOPS : loopsFor(song);

  // Refs mirroring state/props for use inside the audio-clock-driven loops.
  const currentNotesRef = useRef(currentNotes);
  currentNotesRef.current = currentNotes;
  const guidePctRef = useRef(guidePct);
  guidePctRef.current = guidePct;
  const clickDuringPlayRef = useRef(clickDuringPlay);
  clickDuringPlayRef.current = clickDuringPlay;
  const octaveAgnosticRef = useRef(octaveAgnostic);
  octaveAgnosticRef.current = octaveAgnostic;
  const listeningRef = useRef(listening);
  listeningRef.current = listening;

  const positionBeatsRef = useRef<number | null>(null);
  const hitRatioRef = useRef<number[]>([]);
  const hitSecRef = useRef<number[]>([]);
  const possibleSecRef = useRef<number[]>([]);
  // Per-note cents error, for the Pro analytics. Summed over voiced frames so
  // a note can report how sharp or flat it tends to be, not just hit or miss.
  const centsSumRef = useRef<number[]>([]);
  const centsFramesRef = useRef<number[]>([]);
  const loopSnapshotRef = useRef(0);
  const loopIndexTrackRef = useRef(0);
  const perLoopScoresRef = useRef<number[]>([]);

  // Fixed at count-in: what is being sung, how many times, and how much of each
  // note counts. Everything downstream of the score reads these, never state.
  const loopsRef = useRef(plannedLoops);
  const spanStartRef = useRef(0);
  const spanBeatsRef = useRef(1);
  /** Beats of each note actually sung per loop; 0 for notes outside the span. */
  const playBeatsRef = useRef<number[]>([]);
  /** Scorable seconds in one loop — the per-loop score's denominator. */
  const perLoopDenomSecRef = useRef(0);

  // Judging: in-span notes ordered by when their window closes, plus a cursor so
  // each note is judged exactly once per loop rather than every frame.
  const judgeOrderRef = useRef<Array<{ index: number; endBeat: number }>>([]);
  const judgeCursorRef = useRef(0);
  const loopStartHitRef = useRef<number[]>([]);
  const tallyRef = useRef<JudgmentTally>(emptyTally());
  const comboRef = useRef(0);
  const maxComboRef = useRef(0);
  const judgeSeqRef = useRef(0);
  const judgeEventRef = useRef<JudgmentEvent | null>(null);

  const spbRef = useRef(secPerBeat(song.bpm, 1));
  const t0Ref = useRef(0);
  const pausedGlobalBeatsRef = useRef(0);
  const scheduledMaskRef = useRef<boolean[]>([]);
  const clickCursorRef = useRef(0);
  const sessionStartRef = useRef(0);
  /**
   * Seconds this session was actually being played and watched.
   *
   * `sessionStartRef` is wall clock, and wall clock counts two things that are
   * not practice: time the tab spent hidden (rAF is suspended, so no note is
   * scored and nothing is drawn) and time spent paused (`pause()` never
   * adjusted the start, so an eight-minute pause inside a thirty-second phrase
   * still billed eight and a half minutes). `logSession` derives XP from the
   * duration and clamps it to 80, so both paths handed out the ceiling for a
   * phrase nobody sang, and both counted toward the thirty-minutes-in-a-day
   * achievement. This accumulates capped frame deltas instead — see
   * lib/audio/frame-clock — so it can only ever advance while the loop is awake.
   */
  const awakeSecRef = useRef(0);
  const sessionTransposeRef = useRef(0);
  const sessionTempoRef = useRef<Tempo>(1);
  const lastTickRef = useRef(0);
  const scoreAccumRef = useRef(0);
  const finishedRef = useRef(false);
  // undefined (not null) so the first frame always syncs the label to state.
  const sectionLabelRef = useRef<string | null | undefined>(undefined);

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
    const loops = loopsRef.current;
    const playBeats = playBeatsRef.current;
    const spanBeats = spanBeatsRef.current;
    const horizon = audioNow() + 0.35;
    const mask = scheduledMaskRef.current;
    const gain = (guidePctRef.current / 100) * GUIDE_MAX_GAIN;

    for (let slot = 0; slot < total * loops; slot++) {
      if (mask[slot]) continue; // includes out-of-span notes, pre-marked done
      const loopIdx = Math.floor(slot / total);
      const noteIdx = slot % total;
      const note = notes[noteIdx];
      const beatAbs = loopIdx * spanBeats + (note.startBeat - spanStartRef.current);
      const time = t0Ref.current + beatAbs * spb;
      if (time > horizon) break; // events are in ascending time order
      mask[slot] = true;
      if (gain > 0) {
        playTone(note.midi, {
          dur: playBeats[noteIdx] * spb * 0.92,
          gain,
          at: time - audioNow(),
        });
      }
    }

    // Metronome through the song, on the same lookahead clock as the guide so
    // it cannot drift against it. The cursor is clamped forward to the current
    // position, which is what stops a burst of stale clicks after a resume.
    if (clickDuringPlayRef.current) {
      const sessionBeats = loops * spanBeats;
      let beat = Math.max(
        clickCursorRef.current,
        Math.ceil((audioNow() - t0Ref.current) / spb),
      );
      while (beat < sessionBeats) {
        const time = t0Ref.current + beat * spb;
        if (time > horizon) break;
        const songBeat = spanStartRef.current + (beat % spanBeats);
        clickAt(time, Math.round(songBeat) % song.beatsPerBar === 0);
        beat++;
      }
      clickCursorRef.current = beat;
    }
  }

  /** Judge one note against how much of it was held in tune *this* loop. */
  function judgeNote(index: number) {
    const scorableSec = (playBeatsRef.current[index] ?? 0) * spbRef.current;
    const gained = (hitSecRef.current[index] ?? 0) - (loopStartHitRef.current[index] ?? 0);
    const ratio = scorableSec > 0 ? Math.min(1, Math.max(0, gained / scorableSec)) : 0;
    const judgment = judgeRatio(ratio);

    tallyRef.current[judgment] += 1;
    if (judgment === "miss") comboRef.current = 0;
    else {
      comboRef.current += 1;
      maxComboRef.current = Math.max(maxComboRef.current, comboRef.current);
    }
    judgeSeqRef.current += 1;
    judgeEventRef.current = {
      judgment,
      combo: comboRef.current,
      seq: judgeSeqRef.current,
    };
  }

  /** Judge whatever is left of the current loop — at a wrap, or at the end. */
  function flushJudgments() {
    const order = judgeOrderRef.current;
    for (let i = judgeCursorRef.current; i < order.length; i++) judgeNote(order[i].index);
    judgeCursorRef.current = order.length;
  }

  function finalize() {
    if (finishedRef.current) return;
    finishedRef.current = true;
    stopLoops();

    const notes = currentNotesRef.current;
    if (listeningRef.current) flushJudgments(); // the last loop's tail

    const denom = perLoopDenomSecRef.current;
    const hitTotalNow = hitSecRef.current.reduce((a, b) => a + b, 0);
    const delta = hitTotalNow - loopSnapshotRef.current;
    const lastLoopScore = denom > 0 ? Math.round(Math.min(100, (delta / denom) * 100)) : 0;
    const finalPerLoop = [...perLoopScoresRef.current, lastLoopScore];

    const totalPossible = possibleSecRef.current.reduce((a, b) => a + b, 0);
    const overallScore =
      listeningRef.current && totalPossible > 0
        ? Math.round(Math.min(100, (hitTotalNow / totalPossible) * 100))
        : undefined;
    // Awake time, not wall clock. See awakeSecRef.
    const durationSec = Math.max(1, Math.round(awakeSecRef.current));

    const log = logSession({
      type: "song",
      durationSec,
      score: overallScore,
      detail: song.title,
      // Only meaningful with a mic — listen mode scores nothing.
      notes: listeningRef.current
        ? tallyFromScores(
            notes.map((n, i) => ({
              midi: n.midi,
              hitSec: hitSecRef.current[i] ?? 0,
              possibleSec: possibleSecRef.current[i] ?? 0,
              centsSum: centsSumRef.current[i] ?? 0,
              centsFrames: centsFramesRef.current[i] ?? 0,
            })),
          )
        : undefined,
    });

    // A note that was never sung (outside a drilled section) has a hit ratio of
    // zero, which would make it look like the hardest note in the song. Report
    // it as perfect so `hardestNotes` filters it out, rather than filtering the
    // array here and shifting every index.
    const ratiosForHardest = hitRatioRef.current.map((ratio, i) =>
      (possibleSecRef.current[i] ?? 0) > 0 ? ratio : 1,
    );
    const hardest = listeningRef.current ? hardestNotes(notes, ratiosForHardest) : [];

    const sectionScores = listeningRef.current
      ? sections
          .map((section) => {
            let hit = 0;
            let possible = 0;
            notes.forEach((n, i) => {
              if (n.startBeat < section.startBeat || n.startBeat >= section.endBeat) return;
              possible += possibleSecRef.current[i] ?? 0;
              hit += hitSecRef.current[i] ?? 0;
            });
            return {
              label: section.label,
              score: possible > 0 ? Math.round(Math.min(100, (hit / possible) * 100)) : 0,
              possible,
            };
          })
          // A section outside the drilled span was never sung, so it has no
          // score to report — not a zero.
          .filter((s) => s.possible > 0)
          .map(({ label, score }) => ({ label, score }))
      : [];

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
      maxCombo: listeningRef.current ? maxComboRef.current : 0,
      judgments: listeningRef.current ? tallyRef.current : emptyTally(),
      sectionScores,
      transpose: sessionTransposeRef.current,
      tempo: sessionTempoRef.current,
      loops: loopsRef.current,
    });
  }

  /**
   * Leaving the tab pauses the song instead of destroying the session.
   *
   * rAF stops in a hidden tab but the AudioContext clock does not, and rafTick
   * is the only thing that accumulates score or can end a session. So the first
   * frame after coming back read the audio clock, found it past the end, and
   * finalized immediately: every note whose window had passed while hidden had
   * accumulated zero hit time and was judged a miss in one burst, producing a
   * near-zero score. The wall-clock duration meanwhile included the entire
   * absence, which hit the 80 XP ceiling. logSession runs before onFinish, so
   * that result was already permanent — in the practice log, in the personal
   * best, in the achievement counters — before the summary rendered, with no
   * confirmation and no way to discard it. Alt-tabbing mid-song is routine.
   *
   * Pausing is the whole fix: resume() rebases t0 on the audio clock, so the
   * song picks up where it left off and nothing is judged in absentia.
   */
  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState === "hidden" && phaseRef.current === "running") {
        pauseRef.current();
      }
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  function rafTick() {
    const spb = spbRef.current;
    const now = performance.now();
    const dt = Math.min(0.12, lastTickRef.current ? (now - lastTickRef.current) / 1000 : 0);
    lastTickRef.current = now;
    awakeSecRef.current += dt;

    const loops = loopsRef.current;
    const spanBeats = spanBeatsRef.current;
    const elapsedGlobal = (audioNow() - t0Ref.current) / spb;
    const totalSessionBeats = loops * spanBeats;

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

    const loopIdx = Math.min(loops - 1, Math.floor(elapsedGlobal / spanBeats));
    // Position is reported in *song* beats, not span beats, so the piano roll
    // and the lyric band can keep indexing the song directly while a section
    // loops.
    const beatInSong = spanStartRef.current + (elapsedGlobal - loopIdx * spanBeats);
    positionBeatsRef.current = beatInSong;

    if (loopIdx !== loopIndexTrackRef.current) {
      // Judge the tail of the loop that just ended before the per-note baseline
      // moves, otherwise those notes would be scored against the new loop.
      if (listeningRef.current) flushJudgments();
      const denom = perLoopDenomSecRef.current;
      const hitTotalNow = hitSecRef.current.reduce((a, b) => a + b, 0);
      const delta = hitTotalNow - loopSnapshotRef.current;
      // Only when there is a microphone. `flushJudgments` was already gated on
      // listening but this push was not, so listen mode accrued no hit time and
      // dutifully recorded 0% for every loop — rendering "Per loop 0% 0% 0%"
      // directly beside the line explaining that scoring is off. The summary
      // hid them correctly; only the in-session readout leaked them.
      if (listeningRef.current) {
        const loopScore =
          denom > 0 ? Math.round(Math.min(100, (delta / denom) * 100)) : 0;
        perLoopScoresRef.current = [...perLoopScoresRef.current, loopScore];
        setPerLoopScores(perLoopScoresRef.current);
      }
      loopSnapshotRef.current = hitTotalNow;
      loopStartHitRef.current = [...hitSecRef.current];
      judgeCursorRef.current = 0;
      loopIndexTrackRef.current = loopIdx;
      setLoopIndex(loopIdx);
    }

    const label = sectionAtBeat(song, beatInSong)?.label ?? null;
    if (label !== sectionLabelRef.current) {
      sectionLabelRef.current = label;
      setSectionLabel(label);
    }

    if (listeningRef.current) {
      const f = pitch.latest.current;
      const voiced = f.freq !== null && f.volume >= MIN_VOLUME;
      if (voiced && f.freq !== null) {
        const midiFloat = freqToMidiFloat(f.freq);
        const idx = noteIndexAtBeat(currentNotesRef.current, beatInSong);
        // The playBeats guard matters: a note that starts before a drilled
        // section can still cover this beat, and crediting it would add to the
        // score's numerator without adding to its denominator.
        if (idx >= 0 && (playBeatsRef.current[idx] ?? 0) > 0) {
          const cents = foldedCents(midiFloat, currentNotesRef.current[idx].midi, octaveAgnosticRef.current);
          centsSumRef.current[idx] = (centsSumRef.current[idx] ?? 0) + Math.abs(cents);
          centsFramesRef.current[idx] = (centsFramesRef.current[idx] ?? 0) + 1;
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

      // Every in-span note whose window has closed since the last frame.
      const order = judgeOrderRef.current;
      let cursor = judgeCursorRef.current;
      while (cursor < order.length && beatInSong >= order[cursor].endBeat) {
        judgeNote(order[cursor].index);
        cursor++;
      }
      judgeCursorRef.current = cursor;

    }

    // One throttled state write for both readouts. Progress has to be measured
    // in elapsed beats, not completed loops: a `form: "full"` arrangement runs
    // once through, so a loop-counting bar would sit at zero the whole song.
    scoreAccumRef.current += dt;
    if (scoreAccumRef.current > 0.15) {
      scoreAccumRef.current = 0;
      setProgressPct(Math.min(100, (elapsedGlobal / totalSessionBeats) * 100));
      if (listeningRef.current) {
        // Against the possible seconds *so far*, not the whole session.
        //
        // Dividing by the full multi-loop denominator meant the running score
        // could never exceed elapsed progress — the bar directly above it
        // already reports that — so a singer who had just sung loop 1 of 4
        // perfectly watched "Running score 25%" sitting beside a per-loop pill
        // reading 100%, both in the same row. In stage mode that 25% is the
        // only number on screen, at text-5xl, and it looks like failure.
        const elapsedFrac = Math.min(1, elapsedGlobal / totalSessionBeats);
        const possibleSoFar =
          possibleSecRef.current.reduce((a, b) => a + b, 0) * elapsedFrac;
        const totalHit = hitSecRef.current.reduce((a, b) => a + b, 0);
        setRunningScore(
          possibleSoFar > 0
            ? Math.round(Math.min(100, (totalHit / possibleSoFar) * 100))
            : 0,
        );
      }
    }

    rafRef.current = requestAnimationFrame(rafTick);
  }

  /** Full reset + count-in + play, from the top of the span. */
  function beginSession() {
    getAudioContext();
    stopLoops();
    finishedRef.current = false;

    const spb = secPerBeat(song.bpm, tempo);
    spbRef.current = spb;
    const notes = currentNotesRef.current;
    const loops = plannedLoops;
    loopsRef.current = loops;
    spanStartRef.current = spanStart;
    spanBeatsRef.current = Math.max(0.001, spanEnd - spanStart);

    // Beats of each note that actually get sung, clamped to the span's end. A
    // note outside the span contributes nothing — that is the single fact the
    // scheduler, the denominator, and the judging all derive from.
    const playBeats = notes.map((n) =>
      n.startBeat >= spanStart && n.startBeat < spanEnd
        ? Math.max(0, Math.min(n.startBeat + n.durBeats, spanEnd) - n.startBeat)
        : 0,
    );
    playBeatsRef.current = playBeats;
    possibleSecRef.current = playBeats.map((beats) => beats * spb * loops);
    perLoopDenomSecRef.current = playBeats.reduce((a, b) => a + b, 0) * spb;

    hitSecRef.current = notes.map(() => 0);
    hitRatioRef.current = notes.map(() => 0);
    centsSumRef.current = notes.map(() => 0);
    centsFramesRef.current = notes.map(() => 0);
    loopStartHitRef.current = notes.map(() => 0);

    const mask = new Array(notes.length * loops).fill(false);
    for (let slot = 0; slot < mask.length; slot++) {
      if (playBeats[slot % notes.length] === 0) mask[slot] = true;
    }
    scheduledMaskRef.current = mask;
    clickCursorRef.current = 0;

    judgeOrderRef.current = notes
      .map((n, i) => ({ index: i, endBeat: Math.min(n.startBeat + n.durBeats, spanEnd) }))
      .filter((entry) => playBeats[entry.index] > 0)
      .sort((a, b) => a.endBeat - b.endBeat);
    judgeCursorRef.current = 0;
    tallyRef.current = emptyTally();
    comboRef.current = 0;
    maxComboRef.current = 0;
    judgeSeqRef.current = 0;
    judgeEventRef.current = null;

    loopSnapshotRef.current = 0;
    loopIndexTrackRef.current = 0;
    perLoopScoresRef.current = [];
    sectionLabelRef.current = undefined;
    sessionTransposeRef.current = transpose;
    sessionTempoRef.current = tempo;
    setPerLoopScores([]);
    setLoopIndex(0);
    setRunningScore(0);
    setProgressPct(0);
    lastTickRef.current = 0;
    sessionStartRef.current = performance.now();
    awakeSecRef.current = 0;

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

  pauseRef.current = pause;

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
    // The click cursor counts beats from t0, which just moved; rewinding it lets
    // schedTick clamp it forward to wherever the song now is.
    clickCursorRef.current = 0;
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

  function applyFitToRange() {
    const semis = fitTransposeToRange(song, range);
    if (semis !== null) setTranspose(semis);
  }

  /** Fullscreen has to be asked for inside the gesture — see `stage.tsx`. */
  function enterStage() {
    requestStageFullscreen();
    setStageMode(true);
  }

  // Keyboard shortcuts. Routed through a ref so the listener always calls the
  // latest closures without re-binding on every render.
  const shortcutsRef = useRef({
    togglePlayPause,
    restart,
    enterStage,
    controlsEnabled,
    stageMode,
  });
  shortcutsRef.current = { togglePlayPause, restart, enterStage, controlsEnabled, stageMode };
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      // Never fight the browser's own chords (⌘R, ⌥↑, and friends).
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const target = e.target as HTMLElement | null;
      const tag = target?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || target?.isContentEditable) {
        return;
      }
      const s = shortcutsRef.current;

      switch (e.code) {
        case "Space":
          // A focused button owns Space itself — that is how it is activated.
          if (tag === "BUTTON") return;
          e.preventDefault();
          s.togglePlayPause();
          return;
        case "KeyR":
          e.preventDefault();
          s.restart();
          return;
        case "KeyF":
          e.preventDefault();
          if (s.stageMode) setStageMode(false);
          else s.enterStage();
          return;
        case "Escape":
          if (!s.stageMode) return;
          e.preventDefault();
          setStageMode(false);
          return;
        case "ArrowUp":
        case "ArrowDown":
          if (!s.controlsEnabled) return;
          e.preventDefault();
          setTranspose((t) => clampTranspose(t + (e.code === "ArrowUp" ? 1 : -1)));
          return;
        default:
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const hasRange = range.lowMidi !== undefined && range.highMidi !== undefined;
  const effBpm = Math.round(song.bpm * tempo);
  const loopPill = (
    <Pill tone="amber">
      Loop {phase === "idle" ? 0 : Math.min(plannedLoops, loopIndex + 1)} of {plannedLoops}
    </Pill>
  );
  const sectionPill = drilled ? (
    <Pill tone="cool">Drilling {drilled.label}</Pill>
  ) : sectionLabel ? (
    <Pill tone="cool">{sectionLabel}</Pill>
  ) : null;

  const lyricBand = (
    <LyricBand
      lines={lines}
      notes={currentNotes}
      positionBeatsRef={positionBeatsRef}
      size={stageMode ? "lg" : "md"}
    />
  );
  const judgmentReadout = listening ? (
    <JudgmentReadout
      eventRef={judgeEventRef}
      comboRef={comboRef}
      size={stageMode ? "lg" : "md"}
    />
  ) : null;

  if (stageMode) {
    return (
      <Stage open onExit={() => setStageMode(false)} label={song.title}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <SectionLabel>{song.title}</SectionLabel>
            {sectionPill}
            {loopPill}
            {countInBeat >= 0 && <Pill tone="amber">{COUNT_IN_BEATS - countInBeat}</Pill>}
          </div>
          <Button variant="outline" size="sm" onClick={() => setStageMode(false)}>
            <IconCollapse /> Leave stage
          </Button>
        </div>

        <ProgressBar value={phase === "idle" ? 0 : progressPct} tone="amber" />

        <div className="flex flex-1 flex-col justify-center gap-6 py-4">
          {lyricBand}
          {judgmentReadout}
        </div>

        <div className="flex flex-wrap items-end justify-between gap-6">
          {listening ? (
            <div>
              <div className="font-mono text-[11px] uppercase tracking-[0.14em] text-dim">
                Score
              </div>
              <div className="tabular mt-1 font-mono text-5xl font-bold text-ok-ink">
                {runningScore}%
              </div>
            </div>
          ) : (
            <p className="text-sm text-mut">Listen mode — no scoring.</p>
          )}
          <div className="flex flex-wrap items-center gap-3">
            <Transport phase={phase} size="md" onToggle={togglePlayPause} onRestart={restart} />
          </div>
        </div>
        <p className="text-xs text-dim">
          Esc or Leave stage to go back. Space plays and pauses.
        </p>
      </Stage>
    );
  }

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
        <div className="flex flex-wrap items-center gap-2">
          {!listening && <Pill tone="cool">Listen mode</Pill>}
          {sectionPill}
          {loopPill}
        </div>
      </div>
      <ProgressBar value={phase === "idle" ? 0 : progressPct} tone="amber" />

      <Card>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <SectionLabel>{song.title}</SectionLabel>
            <h2 className="mt-3 text-xl">
              {phase === "idle"
                ? "Ready"
                : countInBeat >= 0
                  ? `Count-in… ${COUNT_IN_BEATS - countInBeat}`
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
            <div className="tabular mt-1 font-mono text-3xl font-bold text-amber-ink">
              {effBpm}
              <span className="ml-1 text-sm text-mut">bpm</span>
            </div>
          </div>
        </div>

        <div className="mt-6 rounded-xl border border-line bg-panel2 px-4 py-4">
          {lyricBand}
        </div>
        {judgmentReadout && <div className="mt-3">{judgmentReadout}</div>}

        <div className="mt-4 overflow-x-auto rounded-xl border border-line bg-panel2 p-2">
          <PianoRoll
            notes={currentNotes}
            totalBeats={totalBeats}
            spanStartBeat={spanStart}
            spanEndBeat={spanEnd}
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
              <div className="tabular mt-1 font-mono text-2xl text-ok-ink">{runningScore}%</div>
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
          <Transport phase={phase} size="sm" onToggle={togglePlayPause} onRestart={restart} />
          <Button variant="outline" size="sm" onClick={enterStage}>
            <IconExpand /> Stage mode
          </Button>
          <span className="flex-1" />
          <Button variant="rec" size="sm" onClick={endPractice}>
            End practice
          </Button>
        </div>

        <div className="mt-5 border-t border-line pt-5">
          <Mixer
            controlsEnabled={controlsEnabled}
            guidePct={guidePct}
            onGuidePct={setGuidePct}
            clickDuringPlay={clickDuringPlay}
            onClickDuringPlay={setClickDuringPlay}
            transpose={transpose}
            onTranspose={(semis) => setTranspose(clampTranspose(semis))}
            tempo={tempo}
            onTempo={setTempo}
            octaveAgnostic={octaveAgnostic}
            onOctaveAgnostic={setOctaveAgnostic}
            hasRange={hasRange}
            onFitToRange={applyFitToRange}
            sections={sections}
            sectionIndex={sectionIndex}
            onSectionIndex={setSectionIndex}
            drillLoops={SECTION_DRILL_LOOPS}
          />
        </div>
      </Card>
    </div>
  );
}
