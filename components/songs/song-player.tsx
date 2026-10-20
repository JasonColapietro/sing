"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from "react";
import { PITCH_FFT_SIZE, type UsePitchResult } from "@/lib/audio/use-pitch";
import { freqToMidiFloat } from "@/lib/audio/notes";
import { playTone, clickAt } from "@/lib/audio/synth";
import { audioNow, getAudioContext } from "@/lib/audio/context";
import { liveLags } from "@/lib/audio/latency";
import { logSession, type VocalRange } from "@/lib/progress";
import { tallyFromScores } from "@/lib/analytics";
import { Button, Card, Pill, ProgressBar, SectionLabel } from "@/components/ui";
import { MicAlert } from "@/components/mic-alert";
import type { Song } from "./data";
import {
  IconArrowLeft,
  IconCollapse,
  IconExpand,
  IconMic,
  IconPause,
  IconPlay,
  IconRestart,
} from "./icons";
import { PianoRoll } from "./piano-roll";
import { LyricBand } from "./lyric-band";
import { JudgmentReadout, type JudgmentEvent } from "./judgment";
import { Mixer } from "./mixer";
import { Stage, requestStageFullscreen } from "./stage";
import { startTakeRecorder, type TakeRecorder, type TakeState } from "./take";
import {
  COUNT_IN_BEATS,
  INITIAL_MULTIPLIER,
  MASTERY_MIN_TEMPO,
  MASTERY_SCORE,
  MIN_VOLUME,
  PASS_GUIDE_PCT,
  PASS_LABEL,
  TOLERANCE_CENTS,
  autoTempoStep,
  clampTranspose,
  createPassOctave,
  createPendingRequest,
  defaultOctaveAgnostic,
  emptyTally,
  fitTransposeToRange,
  foldedCents,
  hardestNotes,
  isMastered,
  judgeRatio,
  loopsFor,
  lyricLines,
  multiplierStep,
  noteIndexAtBeat,
  notesInSungOctave,
  pointsFor,
  scoredOctaveShift,
  secPerBeat,
  sectionAtBeat,
  snapTempo,
  songTotalBeats,
  songTranspose,
  startingNote,
  sungOctaveShift,
  transposedNotes,
  type JudgmentTally,
  type PickedTranspose,
  type SessionSummaryData,
  type Tempo,
  describeLoopRange,
  isWholeSongRange,
  reachedBeats,
  reachedNothing,
  setupForSong,
  type LoopRange,
  type PlayerSetup,
} from "./lib";
import type { GuidePass, SessionMode } from "./types";

export type Phase = "idle" | "running" | "paused" | "finished";

/**
 * What the player says, and offers, while the microphone is off. The control
 * sits at the moments the pass switch does, before a run and while paused. A
 * run already under way was sung unheard, so the paused control says it
 * starts over (see `afterMicOn`), and while the song plays the line points at
 * Pause, where the control is, rather than at a control that is not there.
 *
 * `at` is where the control is drawn. Before a run it sits under the line, in
 * the piano-roll card, which the start's scroll keeps on screen. Once paused
 * it sits in the transport row beside Resume: the singer just pressed Pause
 * there, and on a phone scrolled down to the pass chips the piano-roll card
 * (line and control with it) was above the screen.
 */
export function micOffPrompt(phase: Phase): {
  line: string;
  control: string | null;
  at: "line" | "transport" | null;
} {
  if (phase === "running") {
    return { line: "Practicing without a mic. Pause to turn it on and be scored.", control: null, at: null };
  }
  if (phase === "paused") {
    return {
      line: "Practicing without a mic. Turn it on to see your live score.",
      control: "Enable microphone and restart",
      at: "transport",
    };
  }
  return {
    line: "Practicing without a mic. Turn it on to see your live score.",
    control: "Enable microphone",
    at: "line",
  };
}

/**
 * What turning the microphone on from inside the player does, read once the
 * permission prompt has closed (the singer can press other things while it is
 * up). A listen pass scores nothing even with the mic on, so it moves to Sing
 * along, the pass the gate would have started on; a pass the singer picked
 * stays. A run already under way starts over: scoring it from here would judge
 * every note before this moment a miss in one burst and log the score that
 * left, and the coach would read those notes as weak. A finished run is the
 * summary's to restart, so nothing happens.
 */
export function afterMicOn(
  phase: Phase,
  pass: GuidePass,
): { pass: GuidePass; restart: boolean } | null {
  if (phase === "finished") return null;
  return { pass: pass === "listen" ? "guided" : pass, restart: phase !== "idle" };
}

/**
 * The loop pill. A performance counts down its planned loops; a rehearsal has
 * no planned end, so it counts the passes it has made instead. Before a run
 * nothing has been counted, and the pill used to read "Loop 0 of 4" (or
 * "Loop 0"): it gives the plan instead, kept short so the header's pills wrap
 * the same way when Play starts the count.
 */
export function loopPillText(
  phase: Phase,
  mode: SessionMode,
  plannedLoops: number,
  cycle: number,
  loopIndex: number,
): string {
  if (phase === "idle") {
    if (mode === "rehearsal") return "On repeat";
    return plannedLoops === 1 ? "1 loop" : `${plannedLoops} loops`;
  }
  if (mode === "rehearsal") return `Loop ${cycle * plannedLoops + loopIndex + 1}`;
  return `Loop ${Math.min(plannedLoops, loopIndex + 1)} of ${plannedLoops}`;
}

/** The in-page "Stage mode" button, which focus returns to when the stage closes. */
const STAGE_BUTTON_ID = "song-stage-mode";

/** Guide gain with the mixer at 100% — the level the old "full" setting used. */
const GUIDE_MAX_GAIN = 0.2;

/**
 * The guide level a pass runs at. Solo silences the guide; the other two keep
 * the mixer where the singer set it, falling back to the pass's own level only
 * when the mixer is at zero (a solo pass just ended, or a hand-set 0).
 */
function guideLevelFor(next: GuidePass, current: number): number {
  if (next === "solo") return 0;
  return current > 0 ? current : PASS_GUIDE_PCT[next];
}

/**
 * Reps when drilling a single section. A section is picked precisely because it
 * needs repetition, so this does not follow the song's `defaultLoops` (a full
 * arrangement's 1 would defeat the point).
 */
const SECTION_DRILL_LOOPS = 4;

/**
 * How many per-loop pills the in-session readout draws. A rehearsal loops for
 * as long as the singer keeps singing, so the whole list is kept for the
 * summary and only the most recent passes are shown here.
 */
const MAX_LOOP_PILLS = 6;

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
      {/* Named by its visible label alone (the icons are aria-hidden): an
          aria-label of "Play" on a button reading "Resume" left a voice-control
          singer saying "click Resume" with nothing to click. */}
      <Button variant={phase === "running" ? "outline" : "violet"} size={size} onClick={onToggle}>
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
  mode,
  onModeChange,
  pass,
  onPassChange,
  onFinish,
  onExit,
  onTake,
  allowance,
  setup,
}: {
  song: Song;
  pitch: UsePitchResult;
  range: VocalRange;
  mode: SessionMode;
  onModeChange: (mode: SessionMode) => void;
  pass: GuidePass;
  onPassChange: (pass: GuidePass) => void;
  /** The run's summary, and how it was set up so "Sing again" can repeat it. */
  onFinish: (summary: SessionSummaryData, setup: PlayerSetup) => void;
  onExit: () => void;
  /**
   * The recorded take, for the summary: "recording" when a run starts
   * recording, then the take (or "none") a moment after onFinish once the
   * recorder stops, and undefined when a run starts without recording.
   */
  onTake?: (take: TakeState | undefined) => void;
  /**
   * The free minutes left today, drawn directly above the transport row, so
   * the scroll that brings Play into view on every start brings it too.
   */
  allowance?: ReactNode;
  /**
   * How the last run of this song was set up, for a restart from its summary
   * ("Sing again"): read once, as the player opens. Ignored for another song.
   */
  setup?: PlayerSetup | null;
}) {
  // Read at mount only: the state below is the singer's from then on.
  const [initial] = useState(() => setupForSong(setup, song.id));
  /**
   * The key. With a saved range every song opens fitted to it; a key the
   * singer picks with the arrows or the keyboard overrides that for this song
   * only (see songTranspose), and "Fit to my range" returns to the fit.
   */
  const [pickedTranspose, setPickedTranspose] = useState<PickedTranspose | null>(() =>
    initial && initial.pickedSemis !== null ? { songId: song.id, semis: initial.pickedSemis } : null,
  );
  const fittedTranspose = fitTransposeToRange(song, range);
  const transpose = songTranspose(song, range, pickedTranspose);
  const pickTranspose = useCallback(
    (semis: number) => setPickedTranspose({ songId: song.id, semis: clampTranspose(semis) }),
    [song.id],
  );
  const [tempo, setTempo] = useState<Tempo>(initial?.tempo ?? 1);
  const [tempoAuto, setTempoAuto] = useState(initial?.tempoAuto ?? false);
  const [guidePct, setGuidePct] = useState(initial?.guidePct ?? PASS_GUIDE_PCT[pass]);
  const [clickDuringPlay, setClickDuringPlay] = useState(initial?.clickDuringPlay ?? false);
  // Any octave until a range places the song in the singer's own octave.
  const [octaveAgnostic, setOctaveAgnostic] = useState(
    () => initial?.octaveAgnostic ?? defaultOctaveAgnostic(range),
  );
  const [phase, setPhase] = useState<Phase>("idle");
  const phaseRef = useRef<Phase>("idle");
  const pauseRef = useRef<() => void>(() => {});
  /** The latest `restart`, for a call that lands after an await (enableMic). */
  const restartRef = useRef<() => void>(() => {});
  /** An "Enable microphone" press still waiting on its prompt (enableMic). */
  const micRequestRef = useRef(createPendingRequest());
  const [countInBeat, setCountInBeat] = useState(-1);
  const [loopIndex, setLoopIndex] = useState(0);
  /** Whole planned sessions a rehearsal has already looped through. */
  const [cycle, setCycle] = useState(0);
  const [runningScore, setRunningScore] = useState(0);
  const [points, setPoints] = useState(0);
  const [multiplier, setMultiplier] = useState(INITIAL_MULTIPLIER.multiplier);
  const [progressPct, setProgressPct] = useState(0);
  const [perLoopScores, setPerLoopScores] = useState<number[]>([]);
  /**
   * The loop the singer picked, tagged with the song it was picked on. The
   * player is not re-mounted between songs, so a range left over from the last
   * song must not carry into this one; reading it through the id resets it
   * without an effect.
   */
  const [pickedLoop, setPickedLoop] = useState<{ songId: string; range: LoopRange | null }>({
    songId: song.id,
    range: initial?.loop ?? null,
  });
  const [sectionLabel, setSectionLabel] = useState<string | null>(null);
  const [stageMode, setStageMode] = useState(false);
  /**
   * The in-page "Stage mode" button, where focus goes when the stage closes.
   * The stage replaces the whole in-page player, so the button that opened it
   * is gone by then and focus fell to the page's body. Looked up by id when
   * read (the shared Button takes no ref), which is after the in-page player
   * has mounted again.
   */
  const [stageButtonRef] = useState<RefObject<HTMLElement | null>>(() => ({
    get current() {
      return typeof document === "undefined" ? null : document.getElementById(STAGE_BUTTON_ID);
    },
  }));
  /** Record the singer's own take this run, for review in the summary. */
  const [recordTake, setRecordTake] = useState(initial?.recordTake ?? false);
  const takeRecorderRef = useRef<TakeRecorder | null>(null);

  const currentNotes = useMemo(() => transposedNotes(song, transpose), [song, transpose]);
  const totalBeats = useMemo(() => songTotalBeats(song), [song]);
  const lines = useMemo(() => lyricLines(currentNotes), [currentNotes]);
  const sections = useMemo(() => song.sections ?? [], [song]);

  const controlsEnabled = phase === "idle";
  const listening = pitch.listening;
  /**
   * Whether this run is scored. A listen pass plays the guide and scores
   * nothing, the way practicing without a microphone does today, so the two
   * fold into one flag that every scoring gate below reads.
   */
  const scoring = listening && pass !== "listen";

  // The span of the song this session sings: the whole phrase, or a loop the
  // singer set with the handles or a section preset. Fixed at count-in — the
  // loop controls are disabled while running, because the score denominator is
  // built from this.
  const loopRange = pickedLoop.songId === song.id ? pickedLoop.range : null;
  const drilled = isWholeSongRange(loopRange, song) ? null : loopRange;
  const drilledLabel = drilled ? describeLoopRange(song, drilled) : null;
  const spanStart = drilled ? drilled.startBeat : 0;
  const spanEnd = drilled ? drilled.endBeat : totalBeats;
  const plannedLoops = drilled ? SECTION_DRILL_LOOPS : loopsFor(song);
  const setLoopRange = useCallback(
    (range: LoopRange | null) => setPickedLoop({ songId: song.id, range }),
    [song.id],
  );

  // Refs mirroring state/props for use inside the audio-clock-driven loops.
  const currentNotesRef = useRef(currentNotes);
  const guidePctRef = useRef(guidePct);
  const clickDuringPlayRef = useRef(clickDuringPlay);
  const octaveAgnosticRef = useRef(octaveAgnostic);
  /** While either octave counts, the octave this pass is sung in (one per pass, not per frame). */
  const passOctaveRef = useRef(createPassOctave());
  /**
   * In-tune seconds this session, by the octave shift each frame was scored in
   * (0 in the exact octave), restated with the hit seconds whenever the tempo
   * changes (applyTempoRate). The session's notes are filed in the octave that
   * earned the most (sungOctaveShift), so a pass sung an octave down is logged
   * and summarised at the notes actually sung, not the written ones.
   */
  const sungShiftSecRef = useRef(new Map<number, number>());
  const scoringRef = useRef(scoring);
  const modeRef = useRef(mode);
  const passRef = useRef(pass);
  const masteryEligibleRef = useRef(false);
  const tempoAutoRef = useRef(tempoAuto);

  // Publish committed state to the audio callbacks before the next frame.
  useLayoutEffect(() => {
    phaseRef.current = phase;
    currentNotesRef.current = currentNotes;
    guidePctRef.current = guidePct;
    clickDuringPlayRef.current = clickDuringPlay;
    octaveAgnosticRef.current = octaveAgnostic;
    scoringRef.current = scoring;
    modeRef.current = mode;
    passRef.current = pass;
    tempoAutoRef.current = tempoAuto;
  });

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
  /**
   * Which loop the *scored* position is in, as cycle * loops + loop. Scoring
   * runs `scoreLag` behind the audio clock, so loop lines are closed on this,
   * not on `loopIndexTrackRef`, which drives the on-screen loop number.
   */
  const scoredLoopKeyRef = useRef(0);
  /** Whole planned sessions rehearsal has already looped through. */
  const cyclesRef = useRef(0);
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
  // Performance scoring. Rehearsal judges without paying, so these hold their
  // opening values unless the singer switches mode mid-session.
  const multiplierRef = useRef(INITIAL_MULTIPLIER);
  const topMultiplierRef = useRef(INITIAL_MULTIPLIER.multiplier);
  const pointsRef = useRef(0);

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
  /**
   * How this run was set up at count-in, for "Sing again" (see PlayerSetup).
   * The rate is the one it started at, which Auto may have moved since.
   */
  const runSetupRef = useRef<PlayerSetup | null>(null);
  /**
   * Where scoring had got to as of the last frame: whole passes behind it and
   * the scored song beat in the pass under way (-Infinity before the first
   * scored frame). A rehearsal the singer stops is scored up to here.
   */
  const scoredAtRef = useRef({ wholePasses: 0, beat: -Infinity });
  /**
   * The slowest tempo any scored part of this run was sung at.
   *
   * Mastery cannot read the final tempo alone. On Auto a run can open at 0.85x,
   * score well, and be stepped up to 1.00x by the last loop — so three quarters
   * of the performance sat below the bar while the ending tempo says it did
   * not. The minimum is what the gate has to see.
   */
  const minScoredTempoRef = useRef<Tempo>(1);
  /**
   * Seconds a pitch frame lags the moment it describes, seeded at count-in.
   * The frame in hand reports the voice ~68 ms ago (analyser centroid plus
   * median smoothing), and the guide it was following was heard outputLatency
   * after it was scheduled. Scoring at `now` misattributed every note onset
   * to the note before it — see lib/audio/latency.ts.
   */
  const scoreLagRef = useRef(0);
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

    // Only a performance pays. The note is paid at the multiplier it was sung
    // under and the rung moves afterwards, so a streak's reward lands on the
    // notes that follow it rather than on the note that completed it. The
    // thresholds behind multiplierStep and pointsFor are our product decisions;
    // lib.ts documents them.
    if (modeRef.current === "performance") {
      pointsRef.current += pointsFor(judgment, multiplierRef.current.multiplier);
      multiplierRef.current = multiplierStep(multiplierRef.current, judgment);
      topMultiplierRef.current = Math.max(
        topMultiplierRef.current,
        multiplierRef.current.multiplier,
      );
    }
  }

  /** Judge whatever is left of the current loop — at a wrap, or at the end. */
  function flushJudgments() {
    const order = judgeOrderRef.current;
    for (let i = judgeCursorRef.current; i < order.length; i++) judgeNote(order[i].index);
    judgeCursorRef.current = order.length;
  }

  /**
   * How much of everything `possibleSec` covers has actually been sung.
   * Rehearsal keeps adding passes and ends wherever the singer stops, so this
   * is measured against the passes planned so far rather than assumed to be 1.
   */
  function sessionDoneFrac(elapsedBeats: number) {
    const planned = loopsRef.current * (cyclesRef.current + 1);
    if (planned <= 0) return 0;
    const run =
      cyclesRef.current * loopsRef.current +
      Math.min(loopsRef.current, elapsedBeats / spanBeatsRef.current);
    return Math.min(1, run / planned);
  }

  /**
   * Possible seconds per note across every pass this session has planned, at
   * the current beat length. Both move while a song is running — Auto steps the
   * tempo at a loop line, rehearsal keeps adding passes — so this is derived
   * rather than fixed at count-in, which is what keeps the score's numerator
   * and denominator in the same units.
   */
  function refreshPossibleSec() {
    const passes = loopsRef.current * (cyclesRef.current + 1);
    possibleSecRef.current = playBeatsRef.current.map(
      (beats) => beats * spbRef.current * passes,
    );
  }

  /**
   * A fresh scheduling mask for one pass over the planned session. Notes
   * outside a drilled span are pre-marked done so schedTick skips them free.
   */
  function freshScheduleMask() {
    const notes = currentNotesRef.current;
    const playBeats = playBeatsRef.current;
    const mask: boolean[] = new Array(notes.length * loopsRef.current).fill(false);
    for (let slot = 0; slot < mask.length; slot++) {
      if (playBeats[slot % notes.length] === 0) mask[slot] = true;
    }
    return mask;
  }

  /**
   * Change the beat length mid-song without moving the song or the score.
   *
   * `elapsedBeats` is the position on the session clock: t0 is re-based on the
   * new beat length so the current beat stays exactly where it is and only the
   * beats after it get longer or shorter. Every second already banked is
   * restated in the new beat length too, so a change of speed on its own can
   * never move a ratio. Notes already inside schedTick's lookahead keep the
   * times they were scheduled at.
   */
  function applyTempoRate(rate: number, elapsedBeats: number) {
    const next = snapTempo(rate);
    const oldSpb = spbRef.current;
    const newSpb = secPerBeat(song.bpm, next);
    if (newSpb === oldSpb) return;
    const scale = newSpb / oldSpb;
    spbRef.current = newSpb;
    t0Ref.current = audioNow() - elapsedBeats * newSpb;
    hitSecRef.current = hitSecRef.current.map((sec) => sec * scale);
    loopStartHitRef.current = loopStartHitRef.current.map((sec) => sec * scale);
    loopSnapshotRef.current *= scale;
    // Restated like the hit seconds, so the octave a session is filed in is
    // weighed in one beat length, not tilted toward passes Auto slowed down.
    for (const [shift, sec] of sungShiftSecRef.current) sungShiftSecRef.current.set(shift, sec * scale);
    perLoopDenomSecRef.current *= scale;
    refreshPossibleSec();
    sessionTempoRef.current = next;
    // Only a scored pass can earn mastery, so only a scored pass constrains it.
    if (scoringRef.current) {
      minScoredTempoRef.current = Math.min(minScoredTempoRef.current, next) as Tempo;
    }
    setTempo(next);
  }

  /**
   * A loop line: judge the tail of the pass that just ended, record its score,
   * move the per-note baselines onto it, and — on Auto — step the tempo for the
   * pass ahead off the score the pass just earned.
   */
  function closeLoop(elapsedBeats: number) {
    // Judge the tail before the per-note baseline moves, otherwise those notes
    // would be scored against the pass that is only just starting.
    if (scoringRef.current) flushJudgments();
    // Each pass picks its own octave when either octave counts.
    passOctaveRef.current = createPassOctave();
    const denom = perLoopDenomSecRef.current;
    const hitTotalNow = hitSecRef.current.reduce((a, b) => a + b, 0);
    const delta = hitTotalNow - loopSnapshotRef.current;
    const loopScore = denom > 0 ? Math.round(Math.min(100, (delta / denom) * 100)) : 0;
    // Only on a scored run. `flushJudgments` was already gated on
    // listening but this push was not, so listen mode accrued no hit time and
    // dutifully recorded 0% for every loop — rendering "Per loop 0% 0% 0%"
    // directly beside the line explaining that scoring is off. The summary hid
    // them correctly; only the in-session readout leaked them.
    if (scoringRef.current) {
      perLoopScoresRef.current = [...perLoopScoresRef.current, loopScore];
      setPerLoopScores(perLoopScoresRef.current);
    }
    loopSnapshotRef.current = hitTotalNow;
    loopStartHitRef.current = [...hitSecRef.current];
    judgeCursorRef.current = 0;
    // Listen mode banks no hit time, so its loop score is a structural 0 and
    // Auto would ratchet the song down to the floor for nobody. Hold the rate.
    if (tempoAutoRef.current && scoringRef.current) {
      applyTempoRate(autoTempoStep(sessionTempoRef.current, loopScore), elapsedBeats);
    }
  }

  /**
   * End the run and hand back its summary. `stopped` is a run the singer ended
   * part-way (End practice in a rehearsal), scored up to where it got: the
   * unsung rest of the pass it stopped in is neither judged nor counted as
   * possible. A performance that played out has nothing unsung, and its last
   * notes, still inside the pitch lag, are judged here.
   */
  function finalize(stopped = false) {
    if (finishedRef.current) return;
    finishedRef.current = true;
    stopLoops();
    takeRecorderRef.current?.finish();
    takeRecorderRef.current = null;

    const notes = currentNotesRef.current;
    // Notes of a stopped pass whose windows had closed were judged as they
    // closed; the rest were never sung, so they are not judged a miss.
    if (scoringRef.current && !stopped) flushJudgments(); // the last loop's tail
    // Per-note results are filed where the singer sang them: a run sung an
    // octave from the written melody names its notes in that octave, in the
    // practice log (and so the coach and the per-note chart) and in the
    // summary's hardest notes, as the warm-ups file a rep at its octave.
    const sungNotes = notesInSungOctave(notes, sungOctaveShift(sungShiftSecRef.current));

    const spb = spbRef.current;
    const hitTotalNow = hitSecRef.current.reduce((a, b) => a + b, 0);
    const delta = hitTotalNow - loopSnapshotRef.current;

    // possibleSec covers every pass this session planned. A rehearsal ends when
    // the singer stops, which is rarely on a loop line, so the unsung remainder
    // would otherwise be scored as a miss: per note (the log, the coach and the
    // trickiest notes), per section, overall and for the last loop. Each is
    // divided by what was actually reached instead.
    const { wholePasses, beat: stoppedAt } = scoredAtRef.current;
    const possibleSec = stopped
      ? reachedBeats(notes, playBeatsRef.current, wholePasses, stoppedAt).map((b) => b * spb)
      : possibleSecRef.current;
    // The pass the run ended in: whole for a performance that played out, the
    // part reached for a stopped one.
    const lastLoopDenom = stopped
      ? reachedBeats(notes, playBeatsRef.current, 0, stoppedAt).reduce((a, b) => a + b, 0) * spb
      : perLoopDenomSecRef.current;
    const lastLoopPartial = stopped && lastLoopDenom < perLoopDenomSecRef.current - 1e-6;
    const lastLoopScore =
      lastLoopDenom > 0 ? Math.round(Math.min(100, (delta / lastLoopDenom) * 100)) : 0;
    // A pass stopped before any of its notes was over has nothing to say per
    // loop; its sung time still counts in the overall score.
    const keepLastLoop = !lastLoopPartial || judgeCursorRef.current > 0;
    const finalPerLoop = keepLastLoop
      ? [...perLoopScoresRef.current, lastLoopScore]
      : [...perLoopScoresRef.current];

    const totalPossible = possibleSec.reduce((a, b) => a + b, 0);
    const overallScore =
      scoringRef.current && totalPossible > 0
        ? Math.round(Math.min(100, (hitTotalNow / totalPossible) * 100))
        : undefined;
    // Awake time, not wall clock. See awakeSecRef.
    const durationSec = Math.max(1, Math.round(awakeSecRef.current));

    const log = logSession({
      type: "song",
      durationSec,
      score: overallScore,
      detail: song.title,
      // Only meaningful on a scored run — a listen pass scores nothing.
      notes: scoringRef.current
        ? tallyFromScores(
            sungNotes.map((n, i) => ({
              midi: n.midi,
              hitSec: hitSecRef.current[i] ?? 0,
              possibleSec: possibleSec[i] ?? 0,
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
    const ratiosForHardest = possibleSec.map((possible, i) =>
      possible > 0 ? Math.min(1, (hitSecRef.current[i] ?? 0) / possible) : 1,
    );
    const hardest = scoringRef.current ? hardestNotes(sungNotes, ratiosForHardest) : [];

    const sectionScores = scoringRef.current
      ? sections
          .map((section) => {
            let hit = 0;
            let possible = 0;
            notes.forEach((n, i) => {
              if (n.startBeat < section.startBeat || n.startBeat >= section.endBeat) return;
              possible += possibleSec[i] ?? 0;
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

    // The desk stays live through a run (guide, click, octave, Auto), so a
    // restart takes what the singer last set there; the key, the starting rate
    // and the loop are locked once the run starts, so count-in has them.
    const setupNow: PlayerSetup = {
      ...(runSetupRef.current ?? {
        songId: song.id,
        pickedSemis: null,
        tempo: sessionTempoRef.current,
        loop: null,
        recordTake: false,
      }),
      tempoAuto: tempoAutoRef.current,
      octaveAgnostic: octaveAgnosticRef.current,
      guidePct: guidePctRef.current,
      clickDuringPlay: clickDuringPlayRef.current,
    };

    setPhase("finished");
    positionBeatsRef.current = null;
    onFinish({
      song,
      score: overallScore,
      perLoopScores: finalPerLoop,
      partialLastLoop: keepLastLoop && lastLoopPartial,
      hardest,
      xpGained: log.xpGained,
      newAchievements: log.newAchievements,
      listenMode: !scoringRef.current,
      maxCombo: scoringRef.current ? maxComboRef.current : 0,
      judgments: scoringRef.current ? tallyRef.current : emptyTally(),
      sectionScores,
      transpose: sessionTransposeRef.current,
      // The rate the song ended on — Auto may have moved it several times.
      tempo: sessionTempoRef.current,
      // Rehearsal runs as many passes as the singer wants, so report the passes
      // actually sung rather than the ones planned.
      loops: Math.max(loopsRef.current, finalPerLoop.length),
      mode: modeRef.current,
      pass: passRef.current,
      mastered: isMastered(passRef.current, modeRef.current, overallScore, masteryEligibleRef.current, minScoredTempoRef.current),
      points: pointsRef.current,
      topMultiplier: topMultiplierRef.current,
    }, setupNow);
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

  // Leaving the room mid-take releases the microphone recording with it.
  useEffect(() => () => takeRecorderRef.current?.discard(), []);

  // Leaving the room drops a microphone press still waiting on its prompt, so
  // access granted afterwards starts nothing on a player that is gone.
  useEffect(() => {
    const micRequest = micRequestRef.current;
    return () => micRequest.cancel();
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

    // Pitch reports describe the voice `scoreLag` ago, so everything that
    // scores — crediting, judging, closing a loop, ending a performance — runs
    // on this lagged position rather than on the audio clock. Scoring on the
    // audio clock closed each loop before its last note's final reports came
    // in; on a short loop that tail is a large share of the notes (a perfect
    // half-beat loop at 120 bpm scored ~73%).
    const lagBeats = scoreLagRef.current / spb;

    if (modeRef.current === "performance" && elapsedGlobal - lagBeats >= totalSessionBeats) {
      finalize();
      return;
    }
    if (modeRef.current !== "performance" && elapsedGlobal >= totalSessionBeats) {
      // Rehearsal has no last loop: re-base the clock a whole session back so
      // the span comes round again. The pass that just ended is closed a
      // moment later, when the lagged position crosses the line. Only the
      // singer ends a rehearsal — see endSession.
      cyclesRef.current += 1;
      setCycle(cyclesRef.current);
      refreshPossibleSec();
      t0Ref.current += totalSessionBeats * spbRef.current;
      scheduledMaskRef.current = freshScheduleMask();
      // The click cursor counts beats from t0, which just moved; rewinding it
      // lets schedTick clamp it forward to wherever the song now is.
      clickCursorRef.current = 0;
      loopIndexTrackRef.current = 0;
      setLoopIndex(0);
      rafRef.current = requestAnimationFrame(rafTick);
      return;
    }

    const loopIdx = Math.min(loops - 1, Math.floor(elapsedGlobal / spanBeats));
    // Position is reported in *song* beats, not span beats, so the piano roll
    // and the lyric band can keep indexing the song directly while a section
    // loops. Clamped: a performance keeps ticking for `lagBeats` past its end
    // while the last reports come in.
    const beatInSong = Math.min(
      spanStartRef.current + spanBeats,
      spanStartRef.current + (elapsedGlobal - loopIdx * spanBeats),
    );
    positionBeatsRef.current = beatInSong;

    if (loopIdx !== loopIndexTrackRef.current) {
      loopIndexTrackRef.current = loopIdx;
      setLoopIndex(loopIdx);
    }

    // The lagged position. Just after a rehearsal wrap it still belongs to the
    // end of the previous cycle.
    let scoredElapsed = elapsedGlobal - lagBeats;
    let scoredCycle = cyclesRef.current;
    if (scoredElapsed < 0 && scoredCycle > 0) {
      scoredElapsed += totalSessionBeats;
      scoredCycle -= 1;
    }
    const scoredLoop =
      scoredElapsed >= 0 ? Math.min(loops - 1, Math.floor(scoredElapsed / spanBeats)) : -1;
    const scoredBeat =
      scoredLoop >= 0 ? spanStartRef.current + (scoredElapsed - scoredLoop * spanBeats) : -Infinity;
    if (scoredLoop >= 0) {
      const key = scoredCycle * loops + scoredLoop;
      if (key !== scoredLoopKeyRef.current) {
        closeLoop(elapsedGlobal);
        scoredLoopKeyRef.current = key;
      }
      // The key counts the passes before this one: every one of them whole.
      scoredAtRef.current = { wholePasses: key, beat: scoredBeat };
    }

    const label = sectionAtBeat(song, beatInSong)?.label ?? null;
    if (label !== sectionLabelRef.current) {
      sectionLabelRef.current = label;
      setSectionLabel(label);
    }

    if (scoringRef.current) {
      const f = pitch.latest.current;
      const voiced = f.freq !== null && f.volume >= MIN_VOLUME;
      if (voiced && f.freq !== null) {
        const midiFloat = freqToMidiFloat(f.freq);
        // The frame in hand describes the voice `scoreLag` ago, and the guide it
        // was following was heard `outputLag` after it was scheduled. Judge it
        // against where the song was then — `scoredBeat` — not where it is now.
        const idx = noteIndexAtBeat(currentNotesRef.current, scoredBeat);
        // The playBeats guard matters: a note that starts before a drilled
        // section can still cover this beat, and crediting it would add to the
        // score's numerator without adding to its denominator.
        if (idx >= 0 && (playBeatsRef.current[idx] ?? 0) > 0) {
          // Either octave counts: one octave for the whole pass, so a skipped
          // leap or a top note dropped an octave is not scored as sung.
          const target = currentNotesRef.current[idx].midi;
          const cents = octaveAgnosticRef.current
            ? passOctaveRef.current.cents(midiFloat, target, dt)
            : foldedCents(midiFloat, target, false);
          centsSumRef.current[idx] = (centsSumRef.current[idx] ?? 0) + Math.abs(cents);
          centsFramesRef.current[idx] = (centsFramesRef.current[idx] ?? 0) + 1;
          if (Math.abs(cents) <= TOLERANCE_CENTS) {
            hitSecRef.current[idx] = (hitSecRef.current[idx] ?? 0) + dt;
            const shift = scoredOctaveShift(
              midiFloat,
              target,
              octaveAgnosticRef.current,
              passOctaveRef.current.shift,
            );
            const byShift = sungShiftSecRef.current;
            byShift.set(shift, (byShift.get(shift) ?? 0) + dt);
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
      while (cursor < order.length && scoredBeat >= order[cursor].endBeat) {
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
      if (modeRef.current === "performance") {
        setPoints(pointsRef.current);
        setMultiplier(multiplierRef.current.multiplier);
      }
      if (scoringRef.current) {
        // Against the possible seconds *so far*, not the whole session.
        //
        // Dividing by the full multi-loop denominator meant the running score
        // could never exceed elapsed progress — the bar directly above it
        // already reports that — so a singer who had just sung loop 1 of 4
        // perfectly watched "Running score 25%" sitting beside a per-loop pill
        // reading 100%, both in the same row. In stage mode that 25% is the
        // only number on screen, at text-5xl, and it looks like failure.
        // possibleSec covers every pass planned so far, which in a rehearsal
        // grows with each one; sessionDoneFrac scales it to what was sung.
        const possibleSoFar =
          possibleSecRef.current.reduce((a, b) => a + b, 0) *
          sessionDoneFrac(elapsedGlobal);
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
    masteryEligibleRef.current = pass === "solo" && mode === "performance" && !drilled;
    loopsRef.current = loops;
    cyclesRef.current = 0;
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
    refreshPossibleSec();
    perLoopDenomSecRef.current = playBeats.reduce((a, b) => a + b, 0) * spb;

    hitSecRef.current = notes.map(() => 0);
    passOctaveRef.current = createPassOctave();
    sungShiftSecRef.current = new Map();
    hitRatioRef.current = notes.map(() => 0);
    centsSumRef.current = notes.map(() => 0);
    centsFramesRef.current = notes.map(() => 0);
    loopStartHitRef.current = notes.map(() => 0);

    scheduledMaskRef.current = freshScheduleMask();
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
    multiplierRef.current = INITIAL_MULTIPLIER;
    topMultiplierRef.current = INITIAL_MULTIPLIER.multiplier;
    pointsRef.current = 0;

    loopSnapshotRef.current = 0;
    loopIndexTrackRef.current = 0;
    scoredLoopKeyRef.current = 0;
    perLoopScoresRef.current = [];
    sectionLabelRef.current = undefined;
    sessionTransposeRef.current = transpose;
    sessionTempoRef.current = tempo;
    scoredAtRef.current = { wholePasses: 0, beat: -Infinity };
    minScoredTempoRef.current = tempo;
    // The pass owns the guide level at count-in: solo silences it; listen and
    // guided keep the mixer where the singer left it, restoring the pass's own
    // level only if the mixer sits at zero. Spelled out here rather than through
    // guideLevelFor: with both handlers calling the helper, the react-hooks
    // compiler rules start flagging this component's ref mirrors. Written
    // through the ref as well as state, because schedTick runs below before
    // React re-renders.
    const passGuidePct = pass === "solo" ? 0 : guidePct > 0 ? guidePct : PASS_GUIDE_PCT[pass];
    guidePctRef.current = passGuidePct;
    setGuidePct(passGuidePct);
    runSetupRef.current = {
      songId: song.id,
      pickedSemis: pickedTranspose && pickedTranspose.songId === song.id ? pickedTranspose.semis : null,
      tempo,
      tempoAuto,
      octaveAgnostic,
      loop: drilled,
      guidePct: passGuidePct,
      clickDuringPlay,
      recordTake,
    };
    scoreLagRef.current = liveLags(getAudioContext().sampleRate, PITCH_FFT_SIZE).scoreLag;
    setPerLoopScores([]);
    setLoopIndex(0);
    setCycle(0);
    setPoints(0);
    setMultiplier(INITIAL_MULTIPLIER.multiplier);
    setRunningScore(0);
    setProgressPct(0);
    lastTickRef.current = 0;
    sessionStartRef.current = performance.now();
    awakeSecRef.current = 0;

    const LEAD = 0.15;
    const countInStart = audioNow() + LEAD;
    t0Ref.current = countInStart + COUNT_IN_BEATS * spb;
    for (let i = 0; i < COUNT_IN_BEATS; i++) clickAt(countInStart + i * spb, i === 0);
    // Give the starting note, as an accompanist would: the first note this run
    // sings, in the key it is sung in, on the first count-in beat. On your own
    // has no guide, so this is the only pitch a solo run hears before the
    // downbeat; it ends well before t0, so it never overlaps a scored frame.
    const start = startingNote(notes, playBeats, spb);
    if (start) {
      playTone(start.midi, { at: countInStart - audioNow(), dur: start.dur, gain: GUIDE_MAX_GAIN });
    }
    pausedGlobalBeatsRef.current = 0;

    // A restart throws the unfinished take away; a new one starts with the
    // count-in so the singer's first breath is on it.
    takeRecorderRef.current?.discard();
    takeRecorderRef.current = null;
    const stream = recordTake && listening ? pitch.getStream() : null;
    const recorder = stream
      ? startTakeRecorder(stream, song, (take) => onTake?.(take ?? "none"))
      : null;
    takeRecorderRef.current = recorder;
    onTake?.(recorder ? "recording" : undefined);

    setPhase("running");
    schedTimerRef.current = setInterval(schedTick, 90);
    schedTick();
    rafRef.current = requestAnimationFrame(rafTick);
  }

  useLayoutEffect(() => { pauseRef.current = pause; });
  useLayoutEffect(() => { restartRef.current = restart; });

  function pause() {
    stopLoops();
    const spb = spbRef.current;
    const elapsedGlobal = Math.max(0, (audioNow() - t0Ref.current) / spb);
    pausedGlobalBeatsRef.current = elapsedGlobal;
    takeRecorderRef.current?.pause();
    setPhase("paused");
  }

  function resume() {
    const spb = spbRef.current;
    t0Ref.current = audioNow() - pausedGlobalBeatsRef.current * spb;
    // The click cursor counts beats from t0, which just moved; rewinding it lets
    // schedTick clamp it forward to wherever the song now is.
    clickCursorRef.current = 0;
    takeRecorderRef.current?.resume();
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
    takeRecorderRef.current?.discard();
    takeRecorderRef.current = null;
    onExit();
  }

  /**
   * The singer stopping is how a rehearsal ends — it has no last loop — so the
   * End practice button hands back the same summary a performance produces
   * rather than throwing the pass away. Anything else just leaves.
   */
  function endSession() {
    if (modeRef.current === "rehearsal" && (phase === "running" || phase === "paused")) {
      // Stopped in the count-in, before a note of it was sung: nothing to
      // summarise, so it leaves like any other End practice (see reachedNothing).
      const { wholePasses, beat } = scoredAtRef.current;
      if (!reachedNothing(currentNotesRef.current, playBeatsRef.current, wholePasses, beat)) {
        finalize(true);
        return;
      }
    }
    endPractice();
  }

  /** Drops the singer's pick, so the song goes back to its fitted key. */
  function applyFitToRange() {
    setPickedTranspose(null);
  }

  /**
   * Switching passes moves the guide level with it, so a summary that names
   * the pass can never describe a run sung against a different guide. Offered
   * while paused only — the one moment the level can move without landing
   * inside a note the scheduler has already queued.
   */
  function choosePass(next: GuidePass) {
    if (next !== pass) masteryEligibleRef.current = false;
    onPassChange(next);
    const pct = guideLevelFor(next, guidePct);
    guidePctRef.current = pct;
    setGuidePct(pct);
  }


  /**
   * The microphone, turned on from inside the player — a singer who chose
   * "Continue without a mic" at the gate, or denied the prompt by accident and
   * has since allowed it, is told here that the mic is off and needs the
   * control in the same place. Read through refs after the await, because the
   * permission prompt can stay up while the singer presses other things; the
   * restart goes through `restartRef` for the same reason, so it starts the
   * run as the latest render set it up. See `afterMicOn`.
   *
   * Only the latest press acts, and only while the player is on screen: a
   * singer who chose End practice with the prompt up and allowed it afterwards
   * had the restart start timers, frames and the guide on an unmounted player,
   * with nothing left to stop them. Either way the mic stays as usePitch left it.
   */
  async function enableMic() {
    const current = micRequestRef.current.begin();
    if (!(await pitch.start()) || !current()) return;
    const next = afterMicOn(phaseRef.current, passRef.current);
    if (!next) return;
    if (next.pass !== passRef.current) choosePass(next.pass);
    if (next.restart) restartRef.current();
  }

  /** Fullscreen has to be asked for inside the gesture — see `stage.tsx`. */
  function enterStage() {
    requestStageFullscreen();
    setStageMode(true);
  }

  // Keyboard shortcuts. Routed through a ref so the listener always calls the
  // latest closures without re-binding on every render.
  const shortcutsRef = useRef<{
    togglePlayPause: () => void;
    restart: () => void;
    enterStage: () => void;
    nudgeTranspose: (delta: number) => void;
    controlsEnabled: boolean;
    stageMode: boolean;
  } | null>(null);
  useLayoutEffect(() => {
    shortcutsRef.current = {
      togglePlayPause,
      restart,
      enterStage,
      // Read through the ref like everything else here: the listener is bound
      // once, and the current key and song only exist in this render.
      nudgeTranspose: (delta: number) => pickTranspose(transpose + delta),
      controlsEnabled,
      stageMode,
    };
  });
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
      if (!s) return;

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
          s.nudgeTranspose(e.code === "ArrowUp" ? 1 : -1);
          return;
        default:
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const hasRange = range.lowMidi !== undefined && range.highMidi !== undefined;
  const effBpm = Math.round(song.bpm * tempo);
  const loopPill = <Pill tone="violet">{loopPillText(phase, mode, plannedLoops, cycle, loopIndex)}</Pill>;
  // Rehearsal loops for as long as the singer keeps going; the summary gets the
  // whole list, the in-session row only the most recent passes.
  const shownLoopScores = perLoopScores.slice(-MAX_LOOP_PILLS);
  const sectionPill = drilled ? (
    <Pill tone="cool">Drilling {drilledLabel}</Pill>
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
  const judgmentReadout = scoring ? (
    <JudgmentReadout
      eventRef={judgeEventRef}
      comboRef={comboRef}
      size={stageMode ? "lg" : "md"}
    />
  ) : null;
  /**
   * Mode and pass are chosen here, with the song on screen, rather than on the
   * hub's mic step: before the first run starts and again while paused — the
   * two moments a switch cannot land in the middle of a note being judged.
   * Before the run is the only place a mastering run (a solo performance from
   * the top) can be set up without a restart.
   */
  const choosing = phase === "idle" || phase === "paused";
  const micOff = micOffPrompt(phase);
  const modeSwitch =
    choosing ? (
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-dim">
          Mode
        </span>
        <Button
          variant={mode === "rehearsal" ? "violet" : "outline"}
          size="sm"
          aria-pressed={mode === "rehearsal"}
          onClick={() => { masteryEligibleRef.current = false; onModeChange("rehearsal"); }}
        >
          Rehearsal
        </Button>
        <Button
          variant={mode === "performance" ? "violet" : "outline"}
          size="sm"
          aria-pressed={mode === "performance"}
          onClick={() => onModeChange("performance")}
        >
          Performance
        </Button>
      </div>
    ) : null;

  /** The three passes, offered beside the mode switch at the same moments. */
  const passSwitch =
    choosing ? (
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-dim">
          Pass
        </span>
        {(["listen", "guided", "solo"] as const).map((p) => (
          <Button
            key={p}
            variant={pass === p ? "violet" : "outline"}
            size="sm"
            aria-pressed={pass === p}
            onClick={() => choosePass(p)}
          >
            {PASS_LABEL[p]}
          </Button>
        ))}
      </div>
    ) : null;

  if (stageMode) {
    return (
      <Stage
        open
        returnFocusRef={stageButtonRef}
        onExit={() => setStageMode(false)}
        label={song.title}
        points={scoring && mode === "performance" ? points : null}
        multiplier={scoring && mode === "performance" ? multiplier : null}
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <SectionLabel>{song.title}</SectionLabel>
            {sectionPill}
            {loopPill}
            {countInBeat >= 0 && <Pill tone="violet">{COUNT_IN_BEATS - countInBeat}</Pill>}
          </div>
          <Button variant="outline" size="sm" onClick={() => setStageMode(false)}>
            <IconCollapse /> Leave stage
          </Button>
        </div>

        <ProgressBar value={phase === "idle" ? 0 : progressPct} tone="violet" />

        <div className="flex flex-1 flex-col justify-center gap-6 py-4">
          {lyricBand}
          {judgmentReadout}
        </div>

        <div className="flex flex-wrap items-end justify-between gap-6">
          {scoring ? (
            <div>
              <div className="font-mono text-[11px] uppercase tracking-[0.14em] text-dim">
                Score
              </div>
              <div className="tabular mt-1 font-mono text-5xl font-bold text-ok-ink">
                {runningScore}%
              </div>
            </div>
          ) : (
            <p className="text-sm text-mut">
              {listening ? "Listen pass — no scoring." : "Listen mode — no scoring."}
            </p>
          )}
          <div className="flex flex-wrap items-center gap-3">
            {modeSwitch}
            {passSwitch}
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
          <Pill tone="cool">{PASS_LABEL[pass]}</Pill>
          {sectionPill}
          {loopPill}
        </div>
      </div>
      <ProgressBar value={phase === "idle" ? 0 : progressPct} tone="violet" />

      <Card>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <SectionLabel>{song.title}</SectionLabel>
            <h2 className="mt-3 text-xl">
              {phase === "idle"
                ? "Ready"
                : countInBeat >= 0
                  ? `Count-in… ${COUNT_IN_BEATS - countInBeat}`
                  : scoring
                    ? "Sing along"
                    : "Listening back"}
            </h2>
            <p className="mt-1.5 max-w-md text-sm text-mut">{song.origin}</p>
          </div>
          <div className="text-right">
            <div className="font-mono text-[11px] uppercase tracking-[0.14em] text-dim">
              Tempo
            </div>
            <div className="tabular mt-1 font-mono text-3xl font-bold text-violet-ink">
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
            octaveAgnostic={octaveAgnostic}
            passOctaveRef={passOctaveRef}
            className="h-48 w-full"
          />
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-6">
          {scoring ? (
            <div>
              <div className="font-mono text-[11px] uppercase tracking-[0.14em] text-dim">
                Running score
              </div>
              <div className="tabular mt-1 font-mono text-2xl text-ok-ink">{runningScore}%</div>
            </div>
          ) : (
            <div className="max-w-sm">
              <p className="text-sm text-mut">
                {listening
                  ? "Listen pass — the guide sings it. Switch passes to be scored."
                  : micOff.line}
              </p>
              {/* The line above asks for the microphone, so the control sits
                  under it, at the moments the pass switch is offered. A
                  failed start shows in this row's alert. */}
              {!listening && micOff.control && micOff.at === "line" && (
                <Button variant="rec" size="sm" className="mt-2" onClick={enableMic}>
                  <IconMic /> {micOff.control}
                </Button>
              )}
            </div>
          )}
          {shownLoopScores.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-dim">
                Per loop
              </span>
              {shownLoopScores.map((s, i) => (
                <Pill key={i} tone={s >= 80 ? "ok" : s >= 50 ? "violet" : "mut"}>
                  {s}%
                </Pill>
              ))}
            </div>
          )}
          {/* Through MicAlert, like every room's mic failure: the player's own
              "Enable microphone" can now fail here, and on a phone the line
              wraps under the control, where the tab bar can cover it. */}
          {pitch.error && <MicAlert message={pitch.error} className="font-mono text-xs text-rec" />}
        </div>
      </Card>

      <Card>
        {allowance}
        {/* Anchor for SongsClient, which brings this row into view on every
            start. The bottom scroll margin clears the phone's fixed tab bar. */}
        <div
          id="song-transport"
          className="flex scroll-mb-24 flex-wrap items-center gap-3 sm:scroll-mb-6"
        >
          <Transport phase={phase} size="sm" onToggle={togglePlayPause} onRestart={restart} />
          {/* Paused with the mic off, the control sits beside Resume, where
              the singer just pressed Pause (see micOffPrompt). */}
          {!listening && micOff.control && micOff.at === "transport" && (
            <Button variant="rec" size="sm" onClick={enableMic}>
              <IconMic /> {micOff.control}
            </Button>
          )}
          <Button id={STAGE_BUTTON_ID} variant="outline" size="sm" onClick={enterStage}>
            <IconExpand /> Stage mode
          </Button>
          {listening && (
            <button
              type="button"
              aria-pressed={recordTake}
              disabled={!controlsEnabled}
              onClick={() => setRecordTake((on) => !on)}
              title="Record your voice this run, then play it back from the summary"
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition-colors disabled:opacity-40 ${
                recordTake ? "border-rec text-rec" : "border-line2 text-mut hover:text-ink"
              }`}
            >
              <span
                aria-hidden
                className={`size-2 rounded-full ${recordTake ? "bg-rec" : "bg-line2"} ${
                  recordTake && phase === "running" ? "animate-pulse" : ""
                }`}
              />
              Record my take
            </button>
          )}
          <span className="flex-1" />
          <Button variant="rec" size="sm" onClick={endSession}>
            End practice
          </Button>
        </div>
        {(modeSwitch || passSwitch) && (
          <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-3">
            {modeSwitch}
            {passSwitch}
          </div>
        )}
        {/* The rule the band ladder runs on, said where the run is set up. */}
        {phase === "idle" && listening && (
          <p className="mt-3 max-w-xl text-xs text-mut">
            To master a song, sing a full Performance On your own at{" "}
            {Math.round(MASTERY_MIN_TEMPO * 100)}% tempo or faster and score{" "}
            {MASTERY_SCORE} or more. The count-in plays your first note.
            Mastered songs open the next band of the songbook.
          </p>
        )}

        <div className="mt-5 border-t border-line pt-5">
          <Mixer
            controlsEnabled={controlsEnabled}
            guidePct={guidePct}
            onGuidePct={(pct) => {
              if (pass === "solo" && pct > 0) {
                masteryEligibleRef.current = false;
                onPassChange("guided");
              }
              guidePctRef.current = pct;
              setGuidePct(pct);
            }}
            clickDuringPlay={clickDuringPlay}
            onClickDuringPlay={setClickDuringPlay}
            transpose={transpose}
            onTranspose={pickTranspose}
            fitted={fittedTranspose !== null && transpose === fittedTranspose}
            tempo={tempo}
            onTempo={(rate) => setTempo(snapTempo(rate))}
            tempoAuto={tempoAuto}
            onTempoAuto={setTempoAuto}
            octaveAgnostic={octaveAgnostic}
            onOctaveAgnostic={setOctaveAgnostic}
            hasRange={hasRange}
            onFitToRange={applyFitToRange}
            sections={sections}
            song={song}
            loopRange={drilled}
            onLoopRange={setLoopRange}
            drillLoops={SECTION_DRILL_LOOPS}
          />
        </div>
      </Card>
    </div>
  );
}
