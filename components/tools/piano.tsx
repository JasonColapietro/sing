"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { playTone } from "@/lib/audio/synth";
import { getAudioContext } from "@/lib/audio/context";
import { midiToLabel } from "@/lib/audio/notes";
import { Card, SectionLabel } from "@/components/ui";

const LOW_MIDI = 48; // C3
const HIGH_MIDI = 84; // C6
const BLACK_PCS = new Set([1, 3, 6, 8, 10]);

const WHITE_W = 44;
const WHITE_H = 150;
const BLACK_W = 26;
const BLACK_H = 94;

/** a-row keyboard mapping: semitone offsets from the keyboard base note. */
const KEY_OFFSETS: Record<string, number> = {
  a: 0,
  w: 1,
  s: 2,
  e: 3,
  d: 4,
  f: 5,
  t: 6,
  g: 7,
  y: 8,
  h: 9,
  u: 10,
  j: 11,
  k: 12,
};

type LabelMode = "always" | "press" | "off";

interface KeyGeom {
  midi: number;
  black: boolean;
  x: number;
}

export function Piano({ onActive }: { onActive: (active: boolean) => void }) {
  const [active, setActive] = useState<Set<number>>(() => new Set());
  const [sustain, setSustain] = useState(false);
  const [volume, setVolume] = useState(0.2);
  const [labelMode, setLabelMode] = useState<LabelMode>("always");
  const [kbBase, setKbBase] = useState(60); // C4

  const sustainRef = useRef(sustain);
  const volumeRef = useRef(volume);
  const kbBaseRef = useRef(kbBase);
  useEffect(() => {
    sustainRef.current = sustain;
    volumeRef.current = volume;
    kbBaseRef.current = kbBase;
  }, [sustain, volume, kbBase]);

  // "Played recently" activity ping for session logging.
  const pingTimer = useRef<number | undefined>(undefined);
  const ping = useCallback(() => {
    onActive(true);
    window.clearTimeout(pingTimer.current);
    pingTimer.current = window.setTimeout(() => onActive(false), 4000);
  }, [onActive]);
  useEffect(
    () => () => {
      window.clearTimeout(pingTimer.current);
      onActive(false);
    },
    [onActive],
  );

  const press = useCallback(
    (midi: number) => {
      getAudioContext();
      playTone(midi, {
        dur: sustainRef.current ? 2.4 : 0.7,
        gain: volumeRef.current,
      });
      setActive((prev) => {
        const next = new Set(prev);
        next.add(midi);
        return next;
      });
      ping();
    },
    [ping],
  );

  const release = useCallback((midi: number) => {
    setActive((prev) => {
      if (!prev.has(midi)) return prev;
      const next = new Set(prev);
      next.delete(midi);
      return next;
    });
  }, []);

  // Computer keyboard: a-row plays, z/x shift the octave.
  useEffect(() => {
    const held = new Map<string, number>(); // key -> midi
    const isTypingTarget = (t: EventTarget | null) =>
      t instanceof HTMLElement &&
      (t.tagName === "INPUT" ||
        t.tagName === "TEXTAREA" ||
        t.tagName === "SELECT" ||
        t.isContentEditable);

    const down = (e: KeyboardEvent) => {
      if (e.repeat || e.metaKey || e.ctrlKey || e.altKey) return;
      if (isTypingTarget(e.target)) return;
      const k = e.key.toLowerCase();
      if (k === "z") {
        setKbBase((b) => Math.max(LOW_MIDI, b - 12));
        return;
      }
      if (k === "x") {
        setKbBase((b) => Math.min(HIGH_MIDI - 12, b + 12));
        return;
      }
      const offset = KEY_OFFSETS[k];
      if (offset === undefined || held.has(k)) return;
      const midi = kbBaseRef.current + offset;
      if (midi < LOW_MIDI || midi > HIGH_MIDI) return;
      held.set(k, midi);
      press(midi);
    };
    const up = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      const midi = held.get(k);
      if (midi !== undefined) {
        held.delete(k);
        release(midi);
      }
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, [press, release]);

  const { keys, totalWidth } = useMemo(() => {
    const list: KeyGeom[] = [];
    let whiteIndex = 0;
    for (let m = LOW_MIDI; m <= HIGH_MIDI; m++) {
      const black = BLACK_PCS.has(((m % 12) + 12) % 12);
      if (black) {
        list.push({ midi: m, black: true, x: whiteIndex * WHITE_W - BLACK_W / 2 });
      } else {
        list.push({ midi: m, black: false, x: whiteIndex * WHITE_W });
        whiteIndex++;
      }
    }
    return { keys: list, totalWidth: whiteIndex * WHITE_W };
  }, []);

  const showLabel = (midi: number) =>
    labelMode === "always" || (labelMode === "press" && active.has(midi));

  const keyButton = (k: KeyGeom) => {
    const isActive = active.has(k.midi);
    const label = midiToLabel(k.midi);
    const base =
      "absolute top-0 flex items-end justify-center rounded-b-md border pb-1.5 transition-colors duration-75 select-none touch-none";
    const cls = k.black
      ? `${base} z-10 ${
          isActive
            ? "border-amber bg-amber"
            : "border-[#080705] bg-[#0b0a07] hover:bg-[#171410]"
        }`
      : `${base} ${
          isActive ? "border-amber bg-amber" : "border-line bg-[#faf6ec] hover:bg-[#e4dccb]"
        }`;
    return (
      <button
        key={k.midi}
        type="button"
        aria-label={`Play ${label}`}
        aria-pressed={isActive}
        className={cls}
        style={{
          left: k.x,
          width: k.black ? BLACK_W : WHITE_W - 2,
          height: k.black ? BLACK_H : WHITE_H,
        }}
        onPointerDown={(e) => {
          e.preventDefault();
          press(k.midi);
        }}
        onPointerUp={() => release(k.midi)}
        onPointerLeave={() => release(k.midi)}
        onPointerCancel={() => release(k.midi)}
        onClick={(e) => {
          // Keyboard activation (Enter/Space) — pointer clicks have detail > 0.
          if (e.detail === 0) {
            press(k.midi);
            window.setTimeout(() => release(k.midi), 250);
          }
        }}
      >
        {showLabel(k.midi) && (
          <span
            className={`pointer-events-none font-mono ${
              k.black
                ? `text-[9px] ${isActive ? "text-[#241a05]" : "text-mut"}`
                : "text-[10px] text-[#57503f]"
            }`}
          >
            {label}
          </span>
        )}
      </button>
    );
  };

  return (
    <Card>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            aria-hidden="true"
            className="text-amber-ink"
          >
            <rect
              x="1.5"
              y="2.5"
              width="13"
              height="11"
              rx="1.5"
              stroke="currentColor"
              strokeWidth="1.3"
            />
            <path
              d="M5.8 2.5v6M10.2 2.5v6"
              stroke="currentColor"
              strokeWidth="1.3"
              strokeLinecap="round"
            />
          </svg>
          <SectionLabel>Virtual piano</SectionLabel>
        </div>
        <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-dim">
          C3–C6
        </span>
      </div>

      {/* Keys */}
      <div className="no-scrollbar overflow-x-auto rounded-xl border border-line bg-[#0b0a07] p-3">
        <div
          className="relative"
          style={{ width: totalWidth, height: WHITE_H }}
          role="group"
          aria-label="Piano keys, C3 to C6"
        >
          {keys.filter((k) => !k.black).map(keyButton)}
          {keys.filter((k) => k.black).map(keyButton)}
        </div>
      </div>

      {/* Controls */}
      <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-3">
        <button
          type="button"
          aria-pressed={sustain}
          onClick={() => setSustain((s) => !s)}
          className={`rounded-full border px-3 py-1 font-mono text-xs transition-colors ${
            sustain
              ? "border-amber bg-panel2 text-amber-ink"
              : "border-line text-mut hover:border-line2 hover:text-ink"
          }`}
        >
          Sustain {sustain ? "on" : "off"}
        </button>

        <div className="flex items-center gap-2">
          <label
            htmlFor="piano-vol"
            className="font-mono text-[11px] uppercase tracking-[0.14em] text-dim"
          >
            Volume
          </label>
          <input
            id="piano-vol"
            type="range"
            min={0.02}
            max={0.4}
            step={0.01}
            value={volume}
            onChange={(e) => setVolume(Number(e.target.value))}
            className="accent-amber h-1.5 w-32 cursor-pointer"
          />
        </div>

        <fieldset className="flex items-center gap-2">
          <legend className="sr-only">Note labels</legend>
          <span
            className="font-mono text-[11px] uppercase tracking-[0.14em] text-dim"
            aria-hidden="true"
          >
            Labels
          </span>
          {(
            [
              { id: "always", label: "Always" },
              { id: "press", label: "On press" },
              { id: "off", label: "Off" },
            ] as const
          ).map((o) => (
            <button
              key={o.id}
              type="button"
              aria-pressed={labelMode === o.id}
              onClick={() => setLabelMode(o.id)}
              className={`rounded-full border px-2.5 py-1 font-mono text-xs transition-colors ${
                labelMode === o.id
                  ? "border-amber bg-panel2 text-amber-ink"
                  : "border-line text-mut hover:border-line2 hover:text-ink"
              }`}
            >
              {o.label}
            </button>
          ))}
        </fieldset>
      </div>

      {/* Keyboard legend */}
      <div className="mt-4 rounded-xl border border-line bg-panel2 px-4 py-3 text-xs text-mut">
        <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-dim">
          Keyboard
        </span>{" "}
        A row plays notes — A=C, W=C#, S=D, E=D#, D=E, F=F, T=F#, G=G, Y=G#,
        H=A, U=A#, J=B, K=C above. Z and X shift the octave. Current range:{" "}
        <span className="tabular font-mono text-amber-ink">
          {midiToLabel(kbBase)}–{midiToLabel(kbBase + 12)}
        </span>
      </div>
    </Card>
  );
}
