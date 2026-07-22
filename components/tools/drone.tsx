"use client";

import { useEffect, useRef, useState } from "react";
import { startDrone } from "@/lib/audio/synth";
import { getAudioContext } from "@/lib/audio/context";
import { NOTE_NAMES, midiToLabel } from "@/lib/audio/notes";
import { Button, Card, Pill, SectionLabel } from "@/components/ui";

const OCTAVES = [2, 3, 4] as const;

export function Drone({ onActive }: { onActive: (active: boolean) => void }) {
  const [rootPc, setRootPc] = useState(9); // A
  const [octave, setOctave] = useState<(typeof OCTAVES)[number]>(3);
  const [playingMidi, setPlayingMidi] = useState<number | null>(null);
  const [gain, setGain] = useState(0.09);

  const stopRef = useRef<(() => void) | null>(null);
  const gainRef = useRef(gain);
  useEffect(() => {
    gainRef.current = gain;
  }, [gain]);

  const begin = (pc: number, oct: number) => {
    getAudioContext();
    stopRef.current?.();
    const midi = (oct + 1) * 12 + pc;
    stopRef.current = startDrone(midi, gainRef.current);
    setPlayingMidi(midi);
  };

  const stop = () => {
    stopRef.current?.();
    stopRef.current = null;
    setPlayingMidi(null);
  };

  useEffect(() => {
    onActive(playingMidi !== null);
  }, [playingMidi, onActive]);

  // Stop the drone and clear activity when leaving the page.
  useEffect(
    () => () => {
      stopRef.current?.();
      stopRef.current = null;
      onActive(false);
    },
    [onActive],
  );

  // Volume changes restart the drone at the same pitch (debounced).
  useEffect(() => {
    if (playingMidi === null) return;
    const id = window.setTimeout(() => {
      stopRef.current?.();
      stopRef.current = startDrone(playingMidi, gain);
    }, 200);
    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gain]);

  const pickNote = (pc: number) => {
    setRootPc(pc);
    begin(pc, octave);
  };

  const pickOctave = (oct: (typeof OCTAVES)[number]) => {
    setOctave(oct);
    if (playingMidi !== null) begin(rootPc, oct);
  };

  return (
    <Card>
      <div className="mb-5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            aria-hidden="true"
            className="text-amber-ink"
          >
            <path
              d="M1.5 8c1.5-4 2.5-4 4 0s2.5 4 4 0 2.5-4 4 0"
              stroke="currentColor"
              strokeWidth="1.3"
              strokeLinecap="round"
            />
          </svg>
          <SectionLabel>Drone</SectionLabel>
        </div>
        {playingMidi !== null && (
          <Pill tone="amber">
            <span className="animate-recblink h-1.5 w-1.5 rounded-full bg-amber" />
            <span className="tabular font-mono">{midiToLabel(playingMidi)}</span>
          </Pill>
        )}
      </div>

      <p className="mb-5 text-sm text-mut">
        Sing over a drone to sharpen intonation — hold long tones against the
        root and listen until the wobble between your voice and the drone
        disappears.
      </p>

      {/* Root note */}
      <fieldset>
        <legend className="mb-2 font-mono text-[11px] uppercase tracking-[0.14em] text-dim">
          Root note
        </legend>
        <div className="grid grid-cols-6 gap-1.5">
          {NOTE_NAMES.map((name, pc) => {
            const isPlaying =
              playingMidi !== null && ((playingMidi % 12) + 12) % 12 === pc;
            return (
              <button
                key={name}
                type="button"
                aria-label={`Start drone on ${name}${octave}`}
                aria-pressed={isPlaying}
                onClick={() => pickNote(pc)}
                className={`rounded-lg border py-2 font-mono text-sm transition-colors ${
                  isPlaying
                    ? "border-amber bg-amber text-[#241a05]"
                    : pc === rootPc
                      ? "border-amber/50 bg-panel2 text-amber-ink"
                      : "border-line bg-panel2 text-mut hover:border-line2 hover:text-ink"
                }`}
              >
                {name}
              </button>
            );
          })}
        </div>
      </fieldset>

      {/* Octave + volume */}
      <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-3">
        <fieldset className="flex items-center gap-2">
          <legend className="sr-only">Octave</legend>
          <span
            className="font-mono text-[11px] uppercase tracking-[0.14em] text-dim"
            aria-hidden="true"
          >
            Octave
          </span>
          {OCTAVES.map((o) => (
            <button
              key={o}
              type="button"
              aria-pressed={octave === o}
              onClick={() => pickOctave(o)}
              className={`rounded-full border px-3 py-1 font-mono text-xs transition-colors ${
                octave === o
                  ? "border-amber bg-panel2 text-amber-ink"
                  : "border-line text-mut hover:border-line2 hover:text-ink"
              }`}
            >
              {o}
            </button>
          ))}
        </fieldset>

        <div className="flex items-center gap-2">
          <label
            htmlFor="drone-vol"
            className="font-mono text-[11px] uppercase tracking-[0.14em] text-dim"
          >
            Volume
          </label>
          <input
            id="drone-vol"
            type="range"
            min={0.02}
            max={0.2}
            step={0.01}
            value={gain}
            onChange={(e) => setGain(Number(e.target.value))}
            className="accent-amber h-1.5 w-32 cursor-pointer"
          />
        </div>
      </div>

      <div className="mt-5 flex items-center gap-3">
        <Button
          variant="amber"
          onClick={() => begin(rootPc, octave)}
        >
          {playingMidi !== null ? "Restart drone" : "Start drone"}
        </Button>
        <Button variant="outline" onClick={stop} disabled={playingMidi === null}>
          Stop drone
        </Button>
      </div>
    </Card>
  );
}
