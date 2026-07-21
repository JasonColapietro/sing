"use client";

import { useEffect, useRef, useState } from "react";
import type { PitchFrame } from "@/lib/audio/use-pitch";
import { centsOff, midiToLabel, midiToName } from "@/lib/audio/notes";
import { playTone } from "@/lib/audio/synth";
import { Button, Card, Pill, SectionLabel } from "@/components/ui";

const HOLD_MS = 3000;
const TOLERANCE = 50;
const KEYS = 25; // two octaves inclusive of the top C
const BASE_MIN = 36; // C2
const BASE_MAX = 60; // C4 (keyboard tops out at C6)

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
              className={`flex flex-1 items-end justify-center rounded-b-md border border-line2 pb-1 transition-colors ${
                selected
                  ? locked
                    ? "bg-ok"
                    : "bg-amber"
                  : "bg-[#e8e1d0] hover:bg-ink"
              }`}
            >
              <span className="font-mono text-[10px] text-[#3a3222]">
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
            className={`absolute top-0 z-10 h-[58%] rounded-b-md border border-line2 transition-colors ${
              selected
                ? locked
                  ? "bg-ok"
                  : "bg-amber"
                : "bg-[#0b0906] hover:bg-panel2"
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
  className,
}: {
  frame: PitchFrame;
  latest: React.RefObject<PitchFrame>;
  listening: boolean;
  targetMidi: number | null;
  onTargetChange: (midi: number | null) => void;
  className?: string;
}) {
  const [baseMidi, setBaseMidi] = useState(48); // C3
  const [shuffle, setShuffle] = useState(false);
  const [hits, setHits] = useState(0);
  const [holdMs, setHoldMs] = useState(0);
  const [lockFlash, setLockFlash] = useState(false);

  const holdRef = useRef(0);
  const lockedRef = useRef(false);
  const shuffleRef = useRef(false);
  const advanceTimer = useRef<number | null>(null);

  useEffect(() => {
    shuffleRef.current = shuffle;
  }, [shuffle]);

  // Reset progress whenever the target changes. Kept as an effect (rather
  // than a render-time guard) because it resets rAF-loop-owned refs
  // (holdRef/lockedRef) in lockstep with the mirrored state below.
  useEffect(() => {
    holdRef.current = 0;
    lockedRef.current = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- mirrors the ref reset above; must stay in the same tick as holdRef/lockedRef
    setHoldMs(0);
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
      if (f.freq === null || Math.abs(centsOff(f.freq, targetMidi)) > TOLERANCE) {
        return;
      }
      holdRef.current = Math.min(HOLD_MS, holdRef.current + dt);
      setHoldMs(holdRef.current);
      if (holdRef.current >= HOLD_MS) {
        lockedRef.current = true;
        setLockFlash(true);
        setHits((h) => h + 1);
        playTone(targetMidi + 12, { dur: 0.3, gain: 0.16 });
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
  }, [listening, targetMidi, baseMidi, latest, onTargetChange]);

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
            <circle cx={38} cy={38} r={R} fill="none" stroke="#2b2519" strokeWidth={6} />
            <circle
              cx={38}
              cy={38}
              r={R}
              fill="none"
              stroke={lockFlash ? "#7fd99a" : "#f5b03e"}
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
              fill={lockFlash ? "#7fd99a" : "#f2ede3"}
              fontFamily='"IBM Plex Mono", ui-monospace, monospace'
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
                    className={`tabular font-mono text-3xl ${lockFlash ? "text-ok" : "text-ink"}`}
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
