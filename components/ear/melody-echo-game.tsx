"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Button, Card, ProgressBar } from "@/components/ui";
import { usePitch } from "@/lib/audio/use-pitch";
import { frameDelta, isFrameFresh } from "@/lib/audio/frame-clock";
import { useAudioPrefs } from "@/lib/audio/devices";
import { playSequence } from "@/lib/audio/synth";
import { freqToMidiFloat, midiToLabel } from "@/lib/audio/notes";
import { useProgress } from "@/lib/progress";
import {
  generateMelody,
  midiMatches,
  segmentNotes,
  singableRegister,
  type Difficulty,
  type VoicedFrame,
} from "./lib";
import { NoteLanes } from "./note-lanes";
import {
  GameShell,
  MicGate,
  RoundFeedback,
  SummaryView,
  useEarSession,
} from "./session";

type Phase = "listen" | "sing" | "result";

export function MelodyEchoGame({
  difficulty,
  onExit,
}: {
  difficulty: Difficulty;
  onExit: () => void;
}) {
  const session = useEarSession();
  const { latest, listening, error, start, stop } = usePitch();
  const progress = useProgress();
  const octaveAgnostic = difficulty === "easy";

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

  const [startedAt, setStartedAt] = useState(() => performance.now());
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
      // eslint-disable-next-line react-hooks/set-state-in-effect -- seeds the round that beginRound() below immediately plays audio for
      setStartedAt(performance.now());
      const m = generateMelody(difficulty, singableRegister(progress.range));
      setMelody(m);
      beginRound(m);
    }
  }, [listening, melody, session.done, difficulty, progress.range, beginRound]);

  const finishSinging = useCallback(() => {
    if (phaseRef.current !== "sing" || melody === null) return;
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
  }, [melody, octaveAgnostic, session]);

  // Sing phase: collect voiced frames until window ends or user finishes.
  useEffect(() => {
    if (phase !== "sing" || melody === null) return;
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
  }, [phase, melody, latest, finishSinging]);

  const next = useCallback(() => {
    if (session.done) return;
    const m = generateMelody(difficulty, singableRegister(progress.range));
    setMelody(m);
    beginRound(m);
  }, [session.done, difficulty, progress.range, beginRound]);

  // Keyboard: Enter = done singing / next round, R = hear again.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (session.done || melody === null) return;
      if (e.key === "Enter") {
        if (phase === "sing") finishSinging();
        else if (phase === "result") next();
      }
      if ((e.key === "r" || e.key === "R") && replayAllowed) playMelody(melody);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [session.done, melody, phase, finishSinging, next, playMelody, replayAllowed]);

  useEffect(
    () => () => {
      cancelAnimationFrame(rafRef.current);
      window.clearTimeout(timerRef.current);
    },
    [],
  );

  // Release the mic while the summary is up.
  useEffect(() => {
    if (session.done && listening) stop();
  }, [session.done, listening, stop]);

  if (session.done) {
    return (
      <div className="mx-auto max-w-2xl">
        <SummaryView
          game="melody-echo"
          difficulty={difficulty}
          session={session}
          startedAt={startedAt}
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

  if (!listening) {
    return (
      <div className="mx-auto max-w-2xl">
        <MicGate
          error={error}
          onEnable={() => void start()}
          trains="You'll hear a short melody, then sing it back note for note."
        />
      </div>
    );
  }

  return (
    <GameShell game="melody-echo" difficulty={difficulty} session={session} onExit={onExit}>
      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-mut">
            {phase === "listen" && (
              <span className="text-amber-ink animate-recblink">Listen to the melody…</span>
            )}
            {phase === "sing" &&
              `Sing it back — ${melody?.length ?? 0} notes, one at a time.`}
            {phase === "result" &&
              (octaveAgnostic ? "Any octave counted." : "Exact notes counted.")}
          </p>
          <Button
            variant="outline"
            size="sm"
            disabled={!replayAllowed}
            title={
              phase === "sing" && !replayAllowed
                ? "Replaying through speakers would play the answer into your mic. Switch to headphones in Audio setup to use this while singing."
                : undefined
            }
            onClick={() => melody && playMelody(melody)}
          >
            Hear again
            <span className="font-mono text-xs text-dim" aria-hidden="true">R</span>
          </Button>
        </div>

        {melody && (
          <div className="mt-4 rounded-2xl border border-line bg-bg p-4">
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
                className={`font-mono text-xs ${singing ? "text-ok-ink" : "text-dim"}`}
              >
                {singing ? "voice detected" : "waiting for your voice"}
              </span>
              <span className="tabular font-mono text-xs text-mut">
                {Math.ceil(leftMs / 1000)}s left
              </span>
            </div>
            <ProgressBar
              value={100 - (leftMs / windowMsFor(melody)) * 100}
              tone="amber"
            />
            <Button variant="outline" size="sm" onClick={finishSinging}>
              I&apos;m done
              <span className="font-mono text-xs text-dim" aria-hidden="true">Enter</span>
            </Button>
          </div>
        )}

        {phase === "result" && melody && (
          <div className="mt-5 space-y-4">
            <div className="flex flex-wrap gap-2" aria-label="Per-note results">
              {melody.map((t, i) => {
                const d = detected[i];
                const hit = d !== null && midiMatches(d, t, octaveAgnostic);
                return (
                  <span
                    key={i}
                    className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 font-mono text-xs ${
                      hit ? "border-ok/40 text-ok-ink" : "border-line2 text-mut"
                    }`}
                  >
                    {hit ? <CheckIcon /> : <CrossIcon />}
                    {midiToLabel(t)}
                    {!hit && d !== null && (
                      <span className="text-dim">you sang {midiToLabel(d)}</span>
                    )}
                    {!hit && d === null && <span className="text-dim">missed</span>}
                  </span>
                );
              })}
            </div>
            <RoundFeedback
              correct={correct}
              message={
                correct
                  ? "You echoed the whole melody."
                  : "Compare the amber blocks with the outlines above, then try the next one."
              }
            />
            <Button variant="amber" onClick={next}>
              Next round
              <span className="font-mono text-xs opacity-70" aria-hidden="true">Enter</span>
            </Button>
          </div>
        )}
      </Card>
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
