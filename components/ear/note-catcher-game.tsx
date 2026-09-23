"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePitch } from "@/lib/audio/use-pitch";
import { frameDelta, isFrameFresh } from "@/lib/audio/frame-clock";
import { playTone } from "@/lib/audio/synth";
import { freqToMidiFloat, midiToLabel } from "@/lib/audio/notes";
import { useProgress } from "@/lib/progress";
import { SONGS } from "@/components/songs/data";
import { centsToTarget, ROUNDS, type Difficulty } from "./lib";
import {
  CATCHER_LEVELS,
  INITIAL_CATCHER,
  catcherDone,
  describeOffset,
  markerMidi,
  onLine,
  randomTargets,
  songRegister,
  songTargets,
  tickCatcher,
  type CatcherState,
  type CatcherTarget,
} from "./note-catcher";
import { NoteCatcherCanvas, type CatcherView } from "./note-catcher-canvas";
import {
  GameShell,
  ShellButton,
  ShellMicGate,
  StepDone,
  SummaryView,
  useEarSession,
  type EarVariant,
  type OnEarComplete,
} from "./session";

type Phase = "idle" | "play" | "paused";

/**
 * How early before a target reaches the line its cue tone may start, and how
 * clear of the line it must have finished. The cue only ever sounds in time
 * nothing is being scored, so a tone leaking from speakers into the open mic
 * (echo cancellation is off) can never catch a note for the singer — the
 * failure pitch match's "Hear again" had to be fenced against.
 */
const CUE_LEAD_MS = 900;
const CUE_CLEAR_MS = 250;

/** How often the text readout re-renders; the canvas runs every frame. */
const READOUT_MS = 200;

interface Readout {
  target: CatcherTarget | null;
  /** 1-based position of the target in the run. */
  n: number;
  live: boolean;
  /** The voice, octave-folded on easy, or null when silent. */
  sung: number | null;
}

const EMPTY_VIEW: CatcherView = {
  targets: [],
  level: CATCHER_LEVELS.medium,
  state: INITIAL_CATCHER,
  markerMidi: null,
};

export function NoteCatcherGame({
  difficulty,
  songId,
  onExit,
  onComplete,
}: {
  difficulty: Difficulty;
  /** Chase this song's opening instead of random notes. Free songs only. */
  songId?: string;
  onExit: () => void;
  /** Set when this game is one step of a workout: the result goes up instead
      of being drawn here, and no summary card renders. */
  onComplete?: OnEarComplete;
}) {
  const session = useEarSession();
  const { latest, listening, error, start, stop } = usePitch();
  const progress = useProgress();
  const level = CATCHER_LEVELS[difficulty];
  const song = useMemo(
    () => (songId ? (SONGS.find((s) => s.id === songId) ?? null) : null),
    [songId],
  );
  const variant = useMemo<EarVariant | undefined>(
    () => (song ? { key: `song:${song.id}`, label: `Chase: ${song.title}` } : undefined),
    [song],
  );

  const [phase, setPhase] = useState<Phase>("idle");
  const [targets, setTargets] = useState<CatcherTarget[] | null>(null);
  const [cues, setCues] = useState(true);
  const [readout, setReadout] = useState<Readout>({ target: null, n: 1, live: false, sung: null });
  const [announce, setAnnounce] = useState("");
  const [startedAt, setStartedAt] = useState(() => performance.now());

  const viewRef = useRef<CatcherView>(EMPTY_VIEW);
  const stateRef = useRef<CatcherState>(INITIAL_CATCHER);
  const cuedRef = useRef<Set<number>>(new Set());
  const cuesRef = useRef(cues);
  useEffect(() => {
    cuesRef.current = cues;
  }, [cues]);
  const rafRef = useRef(0);

  /** Deal a fresh set of targets and start the clock. Called from a click. */
  const begin = useCallback(() => {
    const ts = song
      ? songTargets(song, songRegister(progress.range), difficulty)
      : randomTargets(difficulty, progress.range);
    stateRef.current = INITIAL_CATCHER;
    cuedRef.current = new Set();
    viewRef.current = { targets: ts, level, state: INITIAL_CATCHER, markerMidi: null };
    setTargets(ts);
    setReadout({ target: ts[0] ?? null, n: 1, live: false, sung: null });
    setAnnounce(`Get ready. First note ${midiToLabel(ts[0].midi)}.`);
    setStartedAt(performance.now());
    setPhase("play");
  }, [song, progress.range, difficulty, level]);

  // The game loop. Runs only while playing; pausing tears it down and resuming
  // starts a new one on the same state, so paused time is never counted.
  useEffect(() => {
    if (phase !== "play" || targets === null) return;
    let lastT = performance.now();
    let lastReadout = 0;
    let stopped = false;

    const tick = () => {
      const now = performance.now();
      const dt = frameDelta(now, lastT);
      lastT = now;

      const f = latest.current;
      // A frame left in the ref from before a hidden tab is not evidence.
      const midi =
        f.freq !== null && isFrameFresh(f.t, now) ? freqToMidiFloat(f.freq) : null;

      const prev = stateRef.current;
      const next = tickCatcher(prev, dt, midi, targets, level);
      stateRef.current = next;

      // Hand each newly resolved target to the shared session as a round.
      for (let i = prev.results.length; i < next.results.length; i++) {
        const t = targets[i];
        session.record(next.results[i]);
        const label = t.lyric ? `${midiToLabel(t.midi)}, "${t.lyric}"` : midiToLabel(t.midi);
        const upcoming = targets[i + 1];
        setAnnounce(
          `${next.results[i] ? "Caught" : "Missed"} ${label}.` +
            (upcoming ? ` Next ${midiToLabel(upcoming.midi)}.` : ""),
        );
      }

      const current = targets[next.index] ?? null;
      const anchor = current?.midi ?? targets[targets.length - 1].midi;
      const shown = midi === null ? null : markerMidi(midi, anchor, level.octaveAgnostic);
      viewRef.current = { targets, level, state: next, markerMidi: shown };

      // The cue for the next target, in the quiet stretch before it arrives.
      if (current && cuesRef.current && !cuedRef.current.has(next.index)) {
        const until = current.arriveMs - next.elapsed;
        if (until <= CUE_LEAD_MS && until > CUE_CLEAR_MS + 120) {
          cuedRef.current.add(next.index);
          playTone(current.midi, {
            dur: Math.min(0.5, (until - CUE_CLEAR_MS) / 1000),
            gain: 0.2,
          });
        }
      }

      if (now - lastReadout >= READOUT_MS) {
        lastReadout = now;
        setReadout({
          target: current,
          n: Math.min(next.index + 1, targets.length),
          live: current !== null && onLine(current, next.elapsed, level),
          sung: shown,
        });
      }

      if (catcherDone(next, targets)) {
        stopped = true;
        return;
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (!stopped) cancelAnimationFrame(rafRef.current);
    };
    // `session.record` is stable; the session object itself changes every round.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, targets, level, latest]);

  // The logged session length is `now - startedAt`, so each pause moves
  // startedAt forward by its own length: time spent paused (or with the tab
  // parked on the pause screen) is not practice, and must not earn XP or use
  // up a free singer's daily minutes.
  const pausedAtRef = useRef<number | null>(null);
  const togglePause = useCallback(() => {
    if (phase === "play") {
      pausedAtRef.current = performance.now();
      setPhase("paused");
    } else if (phase === "paused") {
      const at = pausedAtRef.current;
      pausedAtRef.current = null;
      if (at !== null) {
        const pausedMs = performance.now() - at;
        setStartedAt((s) => s + pausedMs);
      }
      setPhase("play");
    }
  }, [phase]);

  // A hidden tab pauses the game, as the songs room does: nothing can be
  // caught while nobody is looking, and the pause keeps that time out of the
  // logged session.
  const togglePauseRef = useRef(togglePause);
  useEffect(() => {
    togglePauseRef.current = togglePause;
  }, [togglePause]);
  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState === "hidden" && phase === "play") togglePauseRef.current();
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, [phase]);

  // Keyboard: Space pauses and resumes.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (session.done || phase === "idle") return;
      if (e.key === " " && !(e.target instanceof HTMLButtonElement)) {
        e.preventDefault();
        togglePause();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [session.done, phase, togglePause]);

  useEffect(() => () => cancelAnimationFrame(rafRef.current), []);

  // Release the mic while the results are up.
  useEffect(() => {
    if (session.done && listening) stop();
  }, [session.done, listening, stop]);

  if (session.done) {
    if (onComplete) {
      return (
        <StepDone
          game="note-catcher"
          difficulty={difficulty}
          session={session}
          startedAt={startedAt}
          onExit={onExit}
          onComplete={onComplete}
          variant={variant}
        />
      );
    }
    return (
      <div className="mx-auto max-w-2xl">
        <SummaryView
          game="note-catcher"
          difficulty={difficulty}
          session={session}
          startedAt={startedAt}
          variant={variant}
          onReplay={() => {
            session.reset();
            setPhase("idle");
            setTargets(null);
            void start().then((ok) => ok && begin());
          }}
          onExit={onExit}
        />
      </div>
    );
  }

  // The gate lives inside the shell, so the surface a singer sees when the
  // game opens is the one they play on. Enabling the mic starts the run: the
  // lead-in gives them a moment to find the first note before it arrives.
  if (!listening || phase === "idle") {
    return (
      <GameShell
        game="note-catcher"
        difficulty={difficulty}
        session={session}
        onExit={onExit}
        variant={variant}
      >
        <ShellMicGate
          title={song ? `Chase the notes of ${song.title}` : "This game listens to you sing"}
          description={
            song
              ? "The song's opening notes slide toward a line, in your range. Your voice moves the marker; hold each note as it crosses to catch it."
              : "Notes slide toward a line. Your voice moves the marker up and down; hold each note as it crosses to catch it."
          }
          onEnable={() => {
            void start().then((ok) => ok && begin());
          }}
          error={error}
        />
      </GameShell>
    );
  }

  const t = readout.target;
  const cents =
    t && readout.sung !== null ? centsToTarget(readout.sung, t.midi, false) : null;

  return (
    <GameShell
      game="note-catcher"
      difficulty={difficulty}
      session={session}
      onExit={onExit}
      variant={variant}
    >
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="font-mono text-[11px] uppercase tracking-[0.14em] text-[var(--s-dim)]">
            Note {readout.n} of {ROUNDS}
            {readout.live ? " · catch it now" : ""}
          </div>
          <div className="tabular mt-1 font-mono text-3xl" style={{ color: "var(--s-voice)" }}>
            {t ? midiToLabel(t.midi) : "—"}
            {t?.lyric && (
              <span className="ml-2 font-sans text-base text-[var(--s-mut)]">“{t.lyric}”</span>
            )}
          </div>
          {level.octaveAgnostic && (
            <div className="mt-0.5 text-xs text-[var(--s-mut)]">any octave counts</div>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <ShellButton
            onClick={() => setCues((c) => !c)}
            title="Play each note softly just before it reaches the line"
            className={cues ? "text-[var(--s-ink)]" : ""}
          >
            <span aria-hidden="true">{cues ? "♪" : "–"}</span>
            <span>Note cues {cues ? "on" : "off"}</span>
          </ShellButton>
          <ShellButton onClick={togglePause}>
            {phase === "paused" ? "Resume" : "Pause"}
            <span className="font-mono text-xs text-[var(--s-dim)]" aria-hidden="true">
              Space
            </span>
          </ShellButton>
        </div>
      </div>

      <div className="relative mt-4 overflow-hidden rounded-2xl border border-[var(--s-line)]">
        <NoteCatcherCanvas viewRef={viewRef} className="block h-[min(52vh,320px)] w-full" />
        {phase === "paused" && (
          <div className="absolute inset-0 flex items-center justify-center bg-[color-mix(in_oklch,var(--s-bg)_70%,transparent)]">
            <ShellButton tone="primary" onClick={togglePause}>
              Resume
            </ShellButton>
          </div>
        )}
      </div>

      {/* The same state in words. Not live: it changes five times a second.
          The announcer below speaks only when a note is caught or missed. */}
      <p className="mt-3 font-mono text-xs text-[var(--s-mut)]">
        {readout.sung === null
          ? "You: not singing"
          : `You: ${midiToLabel(Math.round(readout.sung))}` +
            (cents !== null ? ` · ${describeOffset(cents, level.tolerance)}` : "")}
      </p>
      <p className="sr-only" role="status" aria-live="polite">
        {announce}
      </p>

      <p className="mt-4 text-sm text-[var(--s-mut)]">
        Sing to move the marker. Hold a note inside ±{level.tolerance} cents for{" "}
        {(level.dwellMs / 1000).toFixed(1)}s while it crosses the line to catch it.
      </p>
    </GameShell>
  );
}
