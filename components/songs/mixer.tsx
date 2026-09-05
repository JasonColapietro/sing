"use client";

import { useId, type ReactNode } from "react";
import { Button, LinkButton } from "@/components/ui";
import type { SongSection } from "./data";
import { TEMPO_MAX, TEMPO_MIN, TEMPO_STEP, formatTempoPct } from "./lib";
import {
  IconMetronome,
  IconMinus,
  IconPlus,
  IconSectionLoop,
  IconVolume,
} from "./icons";

const LABEL = "font-mono text-[11px] uppercase tracking-[0.14em] text-dim";

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="min-w-0">
      <div className={LABEL}>{label}</div>
      <div className="mt-2 flex flex-wrap items-center gap-2">{children}</div>
    </div>
  );
}

/** Small pressed-state toggle. `aria-pressed` is the state, colour only echoes it. */
function Toggle({
  pressed,
  onToggle,
  children,
  title,
}: {
  pressed: boolean;
  onToggle: () => void;
  children: ReactNode;
  title?: string;
}) {
  return (
    <button
      type="button"
      title={title}
      aria-pressed={pressed}
      onClick={onToggle}
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition-colors ${
        pressed
          ? "border-violet bg-panel2 text-violet-ink"
          : "border-line2 text-mut hover:text-ink"
      }`}
    >
      {children}
    </button>
  );
}

function Chip({
  active,
  disabled,
  onClick,
  children,
  label,
}: {
  active: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: ReactNode;
  label?: string;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className={`rounded-full px-2.5 py-1 font-mono text-xs transition-colors disabled:opacity-40 ${
        active ? "bg-panel2 text-violet-ink" : "text-mut hover:text-ink"
      }`}
    >
      {children}
    </button>
  );
}

function Key({ keys, action }: { keys: string; action: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <kbd className="rounded border border-line bg-panel px-1.5 font-mono text-[11px] text-dim">
        {keys}
      </kbd>
      <span>{action}</span>
    </span>
  );
}

/**
 * The practice desk: guide level, click, key, tempo, and which span of the song
 * to drill.
 *
 * Everything that changes what gets *scored* — key, tempo, the drilled section —
 * is disabled once a session is running, because the score denominator is fixed
 * at count-in. The guide level and the click are pure monitoring, so they stay
 * live while singing.
 */
export function Mixer({
  controlsEnabled,
  guidePct,
  onGuidePct,
  clickDuringPlay,
  onClickDuringPlay,
  transpose,
  onTranspose,
  tempo,
  onTempo,
  tempoAuto,
  onTempoAuto,
  octaveAgnostic,
  onOctaveAgnostic,
  hasRange,
  onFitToRange,
  sections,
  sectionIndex,
  onSectionIndex,
  drillLoops,
}: {
  controlsEnabled: boolean;
  /** Guide melody level, 0–100. 0 is silent. */
  guidePct: number;
  onGuidePct: (pct: number) => void;
  clickDuringPlay: boolean;
  onClickDuringPlay: (on: boolean) => void;
  transpose: number;
  onTranspose: (semitones: number) => void;
  /** Playback rate, already snapped onto the TEMPO_STEP grid. */
  tempo: number;
  onTempo: (rate: number) => void;
  /** While on, the session moves the rate itself at every loop boundary. */
  tempoAuto: boolean;
  onTempoAuto: (auto: boolean) => void;
  octaveAgnostic: boolean;
  onOctaveAgnostic: (on: boolean) => void;
  hasRange: boolean;
  onFitToRange: () => void;
  sections: SongSection[];
  /** -1 for the whole song, otherwise an index into `sections`. */
  sectionIndex: number;
  onSectionIndex: (index: number) => void;
  /** How many times a drilled section repeats, for the helper line. */
  drillLoops: number;
}) {
  const guideId = useId();
  const tempoId = useId();

  return (
    <div className="space-y-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="min-w-0">
          <label htmlFor={guideId} className={LABEL}>
            Guide melody
          </label>
          <div className="mt-2 flex items-center gap-3">
            <IconVolume className="shrink-0 text-dim" />
            {/* Left at its native height: squashing a range input clips the
                thumb and shrinks the touch target on a phone. */}
            <input
              id={guideId}
              type="range"
              min={0}
              max={100}
              step={5}
              value={guidePct}
              aria-valuetext={guidePct === 0 ? "Off" : `${guidePct} percent`}
              onChange={(e) => onGuidePct(Number(e.target.value))}
              className="min-w-0 flex-1 cursor-pointer accent-violet"
            />
            <span className="tabular w-9 shrink-0 text-right font-mono text-xs text-mut">
              {guidePct === 0 ? "Off" : `${guidePct}%`}
            </span>
          </div>
        </div>

        <Field label="Monitoring">
          <Toggle
            pressed={clickDuringPlay}
            onToggle={() => onClickDuringPlay(!clickDuringPlay)}
            title="Metronome click on every beat while the song plays"
          >
            <IconMetronome /> Click
          </Toggle>
          <Toggle
            pressed={octaveAgnostic}
            onToggle={() => onOctaveAgnostic(!octaveAgnostic)}
            title="Score the pitch class only, so singing an octave away still counts"
          >
            {octaveAgnostic ? "Any octave" : "Exact octave"}
          </Toggle>
        </Field>

        <Field label="Key">
          <div className="flex items-center gap-1 rounded-full border border-line2 px-1 py-1">
            <button
              type="button"
              aria-label="Transpose down a semitone"
              disabled={!controlsEnabled}
              onClick={() => onTranspose(transpose - 1)}
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
              onClick={() => onTranspose(transpose + 1)}
              className="rounded-full p-1.5 text-mut hover:text-ink disabled:opacity-40"
            >
              <IconPlus />
            </button>
          </div>
          {hasRange ? (
            <Button
              variant="outline"
              size="sm"
              disabled={!controlsEnabled}
              onClick={onFitToRange}
            >
              Fit to my range
            </Button>
          ) : (
            <LinkButton href="/range" variant="ghost" size="sm">
              Take the range test to fit
            </LinkButton>
          )}
        </Field>

        <div className="min-w-0">
          <label htmlFor={tempoId} className={LABEL}>
            Tempo
          </label>
          <div className="mt-2 flex items-center gap-3">
            <Toggle
              pressed={tempoAuto}
              onToggle={() => onTempoAuto(!tempoAuto)}
              title="Let the session move the tempo between loops, from how the last one scored"
            >
              Auto
            </Toggle>
            {/* Native height, for the same reason as the guide slider above. */}
            <input
              id={tempoId}
              type="range"
              min={TEMPO_MIN}
              max={TEMPO_MAX}
              step={TEMPO_STEP}
              value={tempo}
              disabled={tempoAuto || !controlsEnabled}
              aria-valuetext={formatTempoPct(tempo)}
              onChange={(e) => onTempo(Number(e.target.value))}
              className="min-w-0 flex-1 cursor-pointer accent-violet disabled:cursor-not-allowed disabled:opacity-40"
            />
            {/* Reads the live rate even while Auto is driving it. */}
            <span className="tabular w-9 shrink-0 text-right font-mono text-xs text-mut">
              {formatTempoPct(tempo)}
            </span>
          </div>
        </div>
      </div>

      {sections.length > 0 && (
        <div className="border-t border-line pt-4">
          <div className={LABEL}>
            <IconSectionLoop className="mr-1.5 inline align-[-2px]" />
            Drill a section
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-1">
            <Chip
              active={sectionIndex < 0}
              disabled={!controlsEnabled}
              onClick={() => onSectionIndex(-1)}
            >
              Whole song
            </Chip>
            {sections.map((section, index) => (
              <Chip
                key={`${section.label}-${section.startBeat}`}
                active={sectionIndex === index}
                disabled={!controlsEnabled}
                onClick={() => onSectionIndex(index)}
                label={`Loop ${section.label} only`}
              >
                {section.label}
              </Chip>
            ))}
          </div>
          <p className="mt-2 text-xs text-mut">
            {sectionIndex < 0
              ? "Singing the whole arrangement. Pick a section to loop just that span."
              : `Looping ${sections[sectionIndex]?.label ?? "a section"} ${drillLoops}× — only those notes are played and scored.`}
          </p>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-line pt-4 text-[11px] text-dim">
        <Key keys="Space" action="play / pause" />
        <Key keys="R" action="restart" />
        <Key keys="F" action="stage mode" />
        <Key keys="Esc" action="leave stage" />
        <Key keys="↑ ↓" action="transpose (while idle)" />
      </div>
    </div>
  );
}
