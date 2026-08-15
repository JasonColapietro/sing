"use client";

import { useEffect, useRef, useState } from "react";
import type { PitchFrame } from "@/lib/audio/use-pitch";
import { centsOff, midiToLabel, midiToName } from "@/lib/audio/notes";
import { playTone } from "@/lib/audio/synth";
import { Button, Card, Pill, SectionLabel } from "@/components/ui";
import { AMBER, INK, LINE, MONO, OK } from "@/lib/chart-colors";

const HOLD_MS = 3000;
const TOLERANCE = 50;
const KEYS = 25; // two octaves inclusive of the top C
const BASE_MIN = 36; // C2
const BASE_MAX = 60; // C4 (keyboard tops out at C6)
/** Locks in a row that earn the rising two-note flourish. */
const COMBO_FLOURISH = 5;

/**
 * What target practice contributed to the Studio session, kept in a ref the
 * page owns so the score survives this component unmounting (the singer
 * stopping the mic tears the whole listening view down).
 */
export interface TargetStats {
  /** Targets locked. */
  hits: number;
  /** Milliseconds of detected voice while a target was up and unlocked. */
  scoredMs: number;
  /** Of that, the milliseconds spent within TOLERANCE of the target. */
  inTuneMs: number;
  /** Longest unbroken run of locks. */
  bestCombo: number;
}

export function emptyTargetStats(): TargetStats {
  return { hits: 0, scoredMs: 0, inTuneMs: 0, bestCombo: 0 };
}

function pickNearby(current: number, base: number): number {
  const lo = Math.max(base, current - 5);
  const hi = Math.min(base + KEYS - 1, current + 5);
  const options: number[] = [];
  for (let m = lo; m <= hi; m++) if (m !== current) options.push(m);
  return options.length > 0
    ? options[Math.floor(Math.random() * options.length)]
    : current;
}

function MiniKeyboard({
  baseMidi,
  targetMidi,
  locked,
  onPick,
}: {
  baseMidi: number;
  targetMidi: number | null;
  locked: boolean;
  onPick: (midi: number) => void;
}) {
  const midis = Array.from({ length: KEYS }, (_, i) => baseMidi + i);
  const whites = midis.filter((m) => !midiToName(m).includes("#"));
  const blacks = midis.filter((m) => midiToName(m).includes("#"));
  const wCount = whites.length;
  const blackW = (100 / wCount) * 0.62;

  return (
    <div className="relative h-28 select-none">
      <div className="flex h-full gap-[2px]">
        {whites.map((m) => {
          const selected = m === targetMidi;
          return (
            <button
              key={m}
              type="button"
              onClick={() => onPick(m)}
              aria-label={`Set target ${midiToLabel(m)}`}
              aria-pressed={selected}
              className={`flex flex-1 items-end justify-center rounded-b-md border border-line pb-1 transition-colors ${
                selected
                  ? locked
                    ? "bg-ok"
                    : "bg-amber"
                  : "bg-key-white hover:bg-key-white-hover"
              }`}
            >
              {/* Only the C keys are lettered. mut reads on the ivory key but
                  washes out on the amber or green one it becomes when picked. */}
              <span
                className={`font-mono text-[10px] ${selected ? "text-ink" : "text-mut"}`}
              >
                {midiToName(m) === "C" ? midiToLabel(m) : ""}
              </span>
            </button>
          );
        })}
      </div>
      {blacks.map((m) => {
        const idx = whites.filter((w) => w < m).length;
        const left = (idx / wCount) * 100 - blackW / 2;
        const selected = m === targetMidi;
        return (
          <button
            key={m}
            type="button"
            onClick={() => onPick(m)}
            aria-label={`Set target ${midiToLabel(m)}`}
            aria-pressed={selected}
            style={{ left: `${left}%`, width: `${blackW}%` }}
            className={`absolute top-0 z-10 h-[58%] rounded-b-md border border-key-black transition-colors ${
              selected
                ? locked
                  ? "bg-ok"
                  : "bg-amber"
                : "bg-key-black hover:bg-key-black-hover"
            }`}
          />
        );
      })}
    </div>
  );
}

/**
 * Target practice: pick a note, hold it within ±50 cents; after 3 cumulative
 * seconds in tune the target locks. Shuffle auto-advances to a nearby note.
 */
export function TargetPractice({
  frame,
  latest,
  listening,
  targetMidi,
  onTargetChange,
  stats,
  className,
}: {
  frame: PitchFrame;
  latest: React.RefObject<PitchFrame>;
  listening: boolean;
  targetMidi: number | null;
  onTargetChange: (midi: number | null) => void;
  /** Session totals, written straight to the page's ref — see TargetStats. */
  stats: React.RefObject<TargetStats>;
  className?: string;
}) {
  const [baseMidi, setBaseMidi] = useState(48); // C3
  const [shuffle, setShuffle] = useState(false);
  const [hits, setHits] = useState(0);
  const [combo, setCombo] = useState(0);
  const [holdMs, setHoldMs] = useState(0);
  const [lockFlash, setLockFlash] = useState(false);

  const holdRef = useRef(0);
  const lockedRef = useRef(false);
  const comboRef = useRef(0);
  const shuffleRef = useRef(false);
  const advanceTimer = useRef<number | null>(null);

  useEffect(() => {
    shuffleRef.current = shuffle;
  }, [shuffle]);

  // Reset progress whenever the target changes. Kept as an effect (rather
  // than a render-time guard) because it resets rAF-loop-owned refs
  // (holdRef/lockedRef) in lockstep with the mirrored state below.
  useEffect(() => {
    // A target the singer got partway into and then swapped or cleared breaks
    // the run: a combo counts targets actually locked. It has to be read here,
    // before the reset below wipes the evidence.
    const abandoned = holdRef.current > 0 && !lockedRef.current;
    if (abandoned) comboRef.current = 0;
    holdRef.current = 0;
    lockedRef.current = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- mirrors the ref reset above; must stay in the same tick as holdRef/lockedRef
    setHoldMs(0);
     
    if (abandoned) setCombo(0);
    setLockFlash(false);
  }, [targetMidi]);

  // Accumulate time-in-tune from the live pitch ref.
  useEffect(() => {
    if (!listening || targetMidi === null) return;
    let raf = 0;
    let last = performance.now();
    const tick = () => {
      raf = requestAnimationFrame(tick);
      const now = performance.now();
      const dt = Math.min(100, now - last);
      last = now;
      if (lockedRef.current) return;
      const f = latest.current;
      if (f.freq === null) return;
      // The session score is the share of *sung* time at a target that landed
      // in tune, so silence is not scored: resting between attempts, or
      // leaving a target up while thinking, is not singing out of tune.
      stats.current.scoredMs += dt;
      if (Math.abs(centsOff(f.freq, targetMidi)) > TOLERANCE) return;
      stats.current.inTuneMs += dt;
      holdRef.current = Math.min(HOLD_MS, holdRef.current + dt);
      setHoldMs(holdRef.current);
      if (holdRef.current >= HOLD_MS) {
        lockedRef.current = true;
        setLockFlash(true);
        setHits((h) => h + 1);
        const run = comboRef.current + 1;
        comboRef.current = run;
        setCombo(run);
        stats.current.hits += 1;
        stats.current.bestCombo = Math.max(stats.current.bestCombo, run);
        playTone(targetMidi + 12, { dur: 0.3, gain: 0.16 });
        // Every fifth lock in a row answers with a second, higher note.
        if (run % COMBO_FLOURISH === 0) {
          playTone(targetMidi + 19, { dur: 0.45, at: 0.18, gain: 0.14 });
        }
        advanceTimer.current = window.setTimeout(() => {
          setLockFlash(false);
          if (shuffleRef.current) {
            const next = pickNearby(targetMidi, baseMidi);
            onTargetChange(next);
            playTone(next, { dur: 0.8 });
          } else {
            holdRef.current = 0;
            lockedRef.current = false;
            setHoldMs(0);
          }
        }, 900);
      }
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      if (advanceTimer.current !== null) window.clearTimeout(advanceTimer.current);
    };
  }, [listening, targetMidi, baseMidi, latest, onTargetChange, stats]);

  const offset =
    targetMidi !== null && frame.freq !== null
      ? centsOff(frame.freq, targetMidi)
      : null;
  const within = offset !== null && Math.abs(offset) <= TOLERANCE;

  const R = 30;
  const CIRC = 2 * Math.PI * R;
  const progress = holdMs / HOLD_MS;

  return (
    <Card className={className}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <SectionLabel>Target practice</SectionLabel>
          <Pill tone="ok">
            <span className="tabular font-mono">{hits}</span> locked
          </Pill>
          {combo >= 2 && (
            <Pill tone="amber">
              <span className="tabular font-mono">{combo}</span> in a row
            </Pill>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={shuffle ? "amber" : "outline"}
            size="sm"
            aria-pressed={shuffle}
            onClick={() => setShuffle((s) => !s)}
          >
            Shuffle {shuffle ? "on" : "off"}
          </Button>
          {targetMidi !== null && (
            <Button variant="ghost" size="sm" onClick={() => onTargetChange(null)}>
              Clear target
            </Button>
          )}
        </div>
      </div>

      <div className="mt-5 grid items-center gap-6 md:grid-cols-[220px_minmax(0,1fr)]">
        <div className="flex items-center gap-4">
          <svg viewBox="0 0 76 76" className="h-20 w-20 shrink-0" role="img"
            aria-label={
              targetMidi === null
                ? "Hold progress: no target set"
                : `Hold progress: ${(holdMs / 1000).toFixed(1)} of 3 seconds`
            }
          >
            <circle cx={38} cy={38} r={R} fill="none" stroke={LINE} strokeWidth={6} />
            <circle
              cx={38}
              cy={38}
              r={R}
              fill="none"
              stroke={lockFlash ? OK : AMBER}
              strokeWidth={6}
              strokeLinecap="round"
              strokeDasharray={CIRC}
              strokeDashoffset={CIRC * (1 - progress)}
              transform="rotate(-90 38 38)"
              style={{ transition: "stroke-dashoffset 100ms linear" }}
            />
            <text
              x={38}
              y={42}
              textAnchor="middle"
              fontSize={13}
              fill={lockFlash ? OK : INK}
              fontFamily={MONO}
            >
              {(holdMs / 1000).toFixed(1)}s
            </text>
          </svg>
          <div>
            {targetMidi === null ? (
              <p className="text-sm text-mut">
                Pick a note on the keyboard, then hold it for 3 seconds to lock
                it in.
              </p>
            ) : (
              <>
                <div className="flex items-center gap-2">
                  <span
                    className={`tabular font-mono text-3xl ${lockFlash ? "text-ok-ink" : "text-ink"}`}
                  >
                    {midiToLabel(targetMidi)}
                  </span>
                  {lockFlash ? (
                    <Pill tone="ok">Locked</Pill>
                  ) : offset !== null ? (
                    <Pill tone={within ? "ok" : "amber"}>
                      <span className="tabular font-mono">
                        {offset > 0 ? "+" : ""}
                        {offset}
                      </span>
                      cents
                    </Pill>
                  ) : (
                    <Pill tone="mut">waiting</Pill>
                  )}
                </div>
                <p className="mt-1 text-xs text-mut">
                  Hold within ±50 cents for 3 cumulative seconds.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  onClick={() => playTone(targetMidi, { dur: 1.1 })}
                >
                  Play reference
                </Button>
              </>
            )}
          </div>
        </div>

        <div>
          <MiniKeyboard
            baseMidi={baseMidi}
            targetMidi={targetMidi}
            locked={lockFlash}
            onPick={(m) => {
              onTargetChange(m);
              playTone(m, { dur: 0.8 });
            }}
          />
          <div className="mt-2 flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              aria-label="Shift keyboard down an octave"
              disabled={baseMidi <= BASE_MIN}
              onClick={() => setBaseMidi((b) => Math.max(BASE_MIN, b - 12))}
            >
              <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
                <path d="M8.5 1.5 4 6l4.5 4.5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Octave down
            </Button>
            <span className="font-mono text-[11px] text-dim">
              {midiToLabel(baseMidi)} – {midiToLabel(baseMidi + KEYS - 1)}
            </span>
            <Button
              variant="ghost"
              size="sm"
              aria-label="Shift keyboard up an octave"
              disabled={baseMidi >= BASE_MAX}
              onClick={() => setBaseMidi((b) => Math.min(BASE_MAX, b + 12))}
            >
              Octave up
              <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
                <path d="M3.5 1.5 8 6l-4.5 4.5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}
