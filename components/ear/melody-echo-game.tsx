"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ignoreEarShortcut } from "./keyboard";
import { usePitch, type UsePitchResult } from "@/lib/audio/use-pitch";
import { frameDelta, isFrameFresh } from "@/lib/audio/frame-clock";
import { useAudioPrefs } from "@/lib/audio/devices";
import { playSequence } from "@/lib/audio/synth";
import { freqToMidiFloat, midiToLabel } from "@/lib/audio/notes";
import { useProgress } from "@/lib/progress";
import {
  generateMelody,
  hasSavedRange,
  midiMatches,
  segmentNotes,
  singableRegister,
  type Difficulty,
  type VoicedFrame,
} from "./lib";
import { NoteLanes } from "./note-lanes";
import {
  GameShell,
  RoundFeedback,
  ShellBar,
  ShellButton,
  ShellMicGate,
  StepDone,
  SummaryView,
  useActiveStart,
  useEarSession,
  type OnEarComplete,
} from "./session";

type Phase = "listen" | "sing" | "result";

export function MelodyEchoGame({
  difficulty,
  pitch,
  onExit,
  onComplete,
}: {
  difficulty: Difficulty;
  /** A workout's microphone (EarRunner); see pitch-match-game.tsx. */
  pitch?: UsePitchResult;
  onExit: () => void;
  /** Set when this game is one step of a workout: the result goes up instead
      of being drawn here, and no summary card renders. */
  onComplete?: OnEarComplete;
}) {
  const session = useEarSession();
  const ownPitch = usePitch();
  const { latest, listening, error, start, stop } = pitch ?? ownPitch;
  const progress = useProgress();
  // Any octave on easy, and on every level until a range is saved: the
  // targets sit in a C3–C4 fallback that a higher voice answers an octave up.
  const octaveAgnostic = difficulty === "easy" || !hasSavedRange(progress.range);

  const [melody, setMelody] = useState<number[] | null>(null);
  const [phase, setPhase] = useState<Phase>("listen");
  const { monitoring } = useAudioPrefs();
  /**
   * Whether "Hear again" may sound right now — see pitch-match for the full
   * reasoning. It is worse here: `segmentNotes` takes the first N segments with
   * no alignment, so the replayed notes are prepended to the singer's own and
   * shift every position, mis-scoring the rest of the melody.
   */
  const replayAllowed =
    phase !== "listen" && (phase !== "sing" || monitoring === "headphones");
  const [detected, setDetected] = useState<(number | null)[]>([]);
  const [correct, setCorrect] = useState(false);
  const [leftMs, setLeftMs] = useState(0);
  const [singing, setSinging] = useState(false);

  const [playClock, restartClock] = useActiveStart(session.results.length);
  const framesRef = useRef<VoicedFrame[]>([]);
  const rafRef = useRef(0);
  const timerRef = useRef(0);
  const phaseRef = useRef<Phase>("listen");
  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  const windowMsFor = (m: number[]) => m.length * 900 + 2500;

  const playMelody = useCallback((m: number[]) => {
    return playSequence(m, { noteDur: 0.5, gap: 0.1 });
  }, []);

  const beginRound = useCallback(
    (m: number[]) => {
      window.clearTimeout(timerRef.current);
      setPhase("listen");
      setDetected([]);
      const end = playMelody(m);
      timerRef.current = window.setTimeout(() => {
        if (phaseRef.current === "listen") setPhase("sing");
      }, end * 1000 + 250);
    },
    [playMelody],
  );

  // First round once the mic is on. This bootstraps playback (a side effect
  // that must not run during render), so the state it seeds lives here too.
  useEffect(() => {
    if (listening && melody === null && !session.done) {
      restartClock();
      const m = generateMelody(difficulty, singableRegister(progress.range));
      // eslint-disable-next-line react-hooks/set-state-in-effect -- seeds the round that beginRound() below immediately plays audio for
      setMelody(m);
      beginRound(m);
    }
  }, [listening, melody, session.done, difficulty, progress.range, beginRound, restartClock]);

  // Keep a disconnected mic's retry gate from hiding a running answer
  // clock. Reconnect replays this unscored melody rather than marking the
  // time spent repairing the microphone as a wrong answer.
  const wasListeningRef = useRef(listening);
  useEffect(() => {
    const wasListening = wasListeningRef.current;
    wasListeningRef.current = listening;
    if (!listening) window.clearTimeout(timerRef.current);
    else if (!wasListening && melody !== null && phase !== "result") beginRound(melody);
  }, [listening, melody, phase, beginRound]);

  const finishSinging = useCallback(() => {
    if (!listening || phaseRef.current !== "sing" || melody === null) return;
    cancelAnimationFrame(rafRef.current);
    const notes = segmentNotes(framesRef.current);
    const perNote: (number | null)[] = melody.map((_, i) => notes[i] ?? null);
    const ok = melody.every(
      (t, i) => perNote[i] !== null && midiMatches(perNote[i], t, octaveAgnostic),
    );
    setDetected(perNote);
    setCorrect(ok);
    setPhase("result");
    session.record(ok);
  }, [listening, melody, octaveAgnostic, session]);

  // Sing phase: collect voiced frames until window ends or user finishes.
  useEffect(() => {
    if (!listening || phase !== "sing" || melody === null) return;
    framesRef.current = [];
    const windowMs = windowMsFor(melody);
    let lastT = performance.now();
    // The answer window runs on accumulated capped deltas, not wall clock: a
    // hidden tab used to freeze the countdown on screen and then expire it
    // outright on the first frame back, failing the round on whatever frames
    // happened to exist before the singer switched away.
    let elapsed = 0;

    const tick = () => {
      const now = performance.now();
      elapsed += frameDelta(now, lastT);
      lastT = now;
      const f = latest.current;
      const fresh = f.freq !== null && isFrameFresh(f.t, now);
      if (fresh) {
        framesRef.current.push({ t: now, midi: freqToMidiFloat(f.freq!) });
      }
      setSinging(fresh);
      setLeftMs(Math.max(0, windowMs - elapsed));
      if (elapsed >= windowMs) {
        finishSinging();
        return;
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [phase, melody, latest, finishSinging, listening]);

  const next = useCallback(() => {
    if (session.done) return;
    const m = generateMelody(difficulty, singableRegister(progress.range));
    setMelody(m);
    beginRound(m);
  }, [session.done, difficulty, progress.range, beginRound]);

  // Keyboard: Enter = done singing / next round, R = hear again.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (ignoreEarShortcut(e)) return;
      if (!listening || session.done || melody === null) return;
      if (e.key === "Enter") {
        if (phase === "sing") finishSinging();
        else if (phase === "result") next();
      }
      if ((e.key === "r" || e.key === "R") && replayAllowed) playMelody(melody);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [listening, session.done, melody, phase, finishSinging, next, playMelody, replayAllowed]);

  useEffect(
    () => () => {
      cancelAnimationFrame(rafRef.current);
      window.clearTimeout(timerRef.current);
    },
    [],
  );

  // Release the mic while the summary is up; a lent one is the workout's.
  const ownsMic = pitch === undefined;
  useEffect(() => {
    if (session.done && listening && ownsMic) stop();
  }, [session.done, listening, ownsMic, stop]);

  if (session.done) {
    if (onComplete) {
      return (
        <StepDone
          game="melody-echo"
          difficulty={difficulty}
          session={session}
          startedAt={playClock}
          onExit={onExit}
          onComplete={onComplete}
        />
      );
    }
    return (
      <div className="mx-auto max-w-2xl">
        <SummaryView
          game="melody-echo"
          difficulty={difficulty}
          session={session}
          startedAt={playClock}
          onReplay={() => {
            session.reset();
            setMelody(null);
            setPhase("listen");
            void start();
          }}
          onExit={onExit}
        />
      </div>
    );
  }

  // The gate lives inside the shell, so the surface a singer sees when the
  // game opens is the one they play on.
  if (!listening) {
    return (
      <GameShell game="melody-echo" difficulty={difficulty} session={session} onExit={onExit}>
        <ShellMicGate
          title="This game listens to you sing"
          description="You'll hear a short melody, then sing it back note for note."
          onEnable={() => void start()}
          error={error}
        />
      </GameShell>
    );
  }

  return (
    <GameShell game="melody-echo" difficulty={difficulty} session={session} onExit={onExit}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-[var(--s-mut)]">
          {phase === "listen" && (
            <span className="animate-recblink" style={{ color: "var(--s-voice)" }}>
              Listen to the melody…
            </span>
          )}
          {phase === "sing" &&
            `Sing it back — ${melody?.length ?? 0} notes, one at a time.`}
          {phase === "result" &&
            (octaveAgnostic ? "Any octave counted." : "Exact notes counted.")}
        </p>
        <ShellButton
          disabled={!replayAllowed}
          title={
            phase === "sing" && !replayAllowed
              ? "Replaying through speakers would play the answer into your mic. Switch to headphones under Audio to use this while singing."
              : undefined
          }
          onClick={() => melody && playMelody(melody)}
        >
          Hear again
          <span className="font-mono text-xs text-[var(--s-dim)]" aria-hidden="true">R</span>
        </ShellButton>
      </div>

      {melody && (
        <div className="mt-4 rounded-2xl border border-[var(--s-line)] bg-[var(--s-elev)] p-4">
          <NoteLanes
            target={melody}
            detected={phase === "result" ? detected : undefined}
            octaveAgnostic={octaveAgnostic}
          />
        </div>
      )}

      {phase === "sing" && melody && (
        <div className="mt-4 space-y-2">
          <div className="flex items-center justify-between">
            <span
              className="font-mono text-xs"
              style={{ color: singing ? "var(--s-ok)" : "var(--s-dim)" }}
            >
              {singing ? "voice detected" : "waiting for your voice"}
            </span>
            <span className="tabular font-mono text-xs text-[var(--s-mut)]">
              {Math.ceil(leftMs / 1000)}s left
            </span>
          </div>
          <ShellBar
            value={100 - (leftMs / windowMsFor(melody)) * 100}
            tone="voice"
            label="Answer window"
          />
          <ShellButton onClick={finishSinging}>
            I&apos;m done
            <span className="font-mono text-xs text-[var(--s-dim)]" aria-hidden="true">Enter</span>
          </ShellButton>
        </div>
      )}

      {phase === "result" && melody && (
        <div className="mt-5 space-y-4">
          <div className="flex flex-wrap gap-2" aria-label="Per-note results">
            {melody.map((t, i) => {
              const d = detected[i];
              const hit = d !== null && midiMatches(d, t, octaveAgnostic);
              // When any octave counts the lanes above fold the sung note to
              // the target's octave, so the pill names pitch classes only,
              // as pitch match does; otherwise a higher voice's F4 against a
              // D3 read as fifteen semitones off.
              const label = (m: number) =>
                octaveAgnostic ? midiToLabel(m).replace(/-?\d+$/, "") : midiToLabel(m);
              return (
                <span
                  key={i}
                  className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 font-mono text-xs"
                  style={{
                    borderColor: hit ? "var(--s-ok)" : "var(--s-line2)",
                    color: hit ? "var(--s-ok)" : "var(--s-mut)",
                  }}
                >
                  {hit ? <CheckIcon /> : <CrossIcon />}
                  {label(t)}
                  {!hit && d !== null && (
                    <span className="text-[var(--s-dim)]">you sang {label(d)}</span>
                  )}
                  {!hit && d === null && <span className="text-[var(--s-dim)]">missed</span>}
                </span>
              );
            })}
          </div>
          <RoundFeedback
            correct={correct}
            message={
              correct
                ? "You echoed the whole melody."
                : "Compare the filled blocks with the outlines above, then try the next one."
            }
          />
          <ShellButton tone="primary" onClick={next}>
            Next round
            <span className="font-mono text-xs opacity-70" aria-hidden="true">Enter</span>
          </ShellButton>
        </div>
      )}
    </GameShell>
  );
}

function CheckIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true">
      <path d="M1.5 5.5 4 8l4.5-6" stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CrossIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true">
      <path d="m2 2 6 6M8 2 2 8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}
