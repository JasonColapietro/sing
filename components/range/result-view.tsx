"use client";

import { useMemo, useState } from "react";
import {
  VOICE_TYPES,
  classifyVoice,
  midiToLabel,
} from "@/lib/audio/notes";
import { playTone } from "@/lib/audio/synth";
import type { Achievement } from "@/lib/progress";
import { Button, Card, Pill, SectionLabel, Stat } from "@/components/ui";
import { PianoStrip } from "./piano-strip";
import { FAMOUS_VOICES, rangeOverlap } from "./famous-voices";

function describeSpan(semitones: number): string {
  const oct = Math.floor(semitones / 12);
  const rem = semitones % 12;
  if (oct === 0) return `${rem} semitone${rem === 1 ? "" : "s"}`;
  const base = `${oct} octave${oct === 1 ? "" : "s"}`;
  return rem > 0 ? `${base} + ${rem}` : base;
}

/** 0..100 position of a midi value on a fixed axis. */
function axisPct(midi: number, low: number, high: number): number {
  return Math.min(100, Math.max(0, ((midi - low) / (high - low)) * 100));
}

function safeFileLabel(midi: number): string {
  return midiToLabel(midi).replace("#", "s");
}

function renderCardDataUrl(lowMidi: number, highMidi: number): string | null {
  const W = 1200;
  const H = 630;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  const mono = "'IBM Plex Mono', ui-monospace, monospace";

  // Studio-dark background with a soft amber wash from the top
  ctx.fillStyle = "#f7f0e7";
  ctx.fillRect(0, 0, W, H);
  const glow = ctx.createRadialGradient(W / 2, -120, 60, W / 2, -120, 760);
  glow.addColorStop(0, "rgba(245, 176, 62, 0.12)");
  glow.addColorStop(1, "rgba(245, 176, 62, 0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, H);

  // Panel frame
  ctx.strokeStyle = "#ddd4c4";
  ctx.lineWidth = 2;
  ctx.strokeRect(28.5, 28.5, W - 57, H - 57);

  ctx.textAlign = "center";

  // Kicker
  ctx.fillStyle = "#c59642";
  ctx.font = `600 22px ${mono}`;
  ctx.fillText("V O C A L   R A N G E", W / 2, 118);

  // Big readout
  ctx.fillStyle = "#20201d";
  ctx.font = `700 124px ${mono}`;
  ctx.fillText(`${midiToLabel(lowMidi)} — ${midiToLabel(highMidi)}`, W / 2, 268);

  // Voice type + span
  const voice = classifyVoice(lowMidi, highMidi);
  const semis = highMidi - lowMidi;
  ctx.fillStyle = "#5c564d";
  ctx.font = `500 30px ${mono}`;
  ctx.fillText(
    `${voice.label} · ${semis} semitones · ${describeSpan(semis)}`,
    W / 2,
    330,
  );

  // Mini keyboard C2..C6 with range band
  const kbX = 120;
  const kbY = 392;
  const kbW = W - 240;
  const kbH = 96;
  const axisLow = 36;
  const axisHigh = 84;
  const whiteCount = 29;
  const whiteW = kbW / whiteCount;
  const blackPcs = new Set([1, 3, 6, 8, 10]);
  const centers = new Map<number, number>();
  let wi = 0;
  for (let m = axisLow; m <= axisHigh; m++) {
    const pc = ((m % 12) + 12) % 12;
    if (blackPcs.has(pc)) {
      centers.set(m, kbX + wi * whiteW);
    } else {
      centers.set(m, kbX + wi * whiteW + whiteW / 2);
      ctx.fillStyle = "#e9e2d3";
      ctx.strokeStyle = "#ddd4c4";
      ctx.lineWidth = 1;
      ctx.fillRect(kbX + wi * whiteW + 0.5, kbY, whiteW - 1, kbH);
      ctx.strokeRect(kbX + wi * whiteW + 0.5, kbY, whiteW - 1, kbH);
      wi++;
    }
  }
  wi = 0;
  for (let m = axisLow; m <= axisHigh; m++) {
    const pc = ((m % 12) + 12) % 12;
    if (blackPcs.has(pc)) {
      const cx = centers.get(m) ?? kbX;
      ctx.fillStyle = "#fffaf2";
      ctx.fillRect(cx - whiteW * 0.28, kbY, whiteW * 0.56, kbH * 0.6);
    } else {
      wi++;
    }
  }
  const clampMidi = (m: number) => Math.max(axisLow, Math.min(axisHigh, m));
  const x0 = (centers.get(clampMidi(lowMidi)) ?? kbX) - whiteW / 2;
  const x1 = (centers.get(clampMidi(highMidi)) ?? kbX + kbW) + whiteW / 2;
  ctx.fillStyle = "rgba(245, 176, 62, 0.30)";
  ctx.fillRect(x0, kbY, Math.max(0, x1 - x0), kbH);
  ctx.strokeStyle = "#c59642";
  ctx.lineWidth = 2;
  ctx.strokeRect(x0, kbY, Math.max(0, x1 - x0), kbH);
  ctx.fillStyle = "#c59642";
  ctx.font = `600 22px ${mono}`;
  ctx.fillText(midiToLabel(lowMidi), x0, kbY + kbH + 30);
  ctx.fillText(midiToLabel(highMidi), x1, kbY + kbH + 30);

  // Footer
  ctx.fillStyle = "#8a8272";
  ctx.font = `500 22px ${mono}`;
  ctx.fillText("sing.suedeai — free vocal studio", W / 2, H - 52);

  return canvas.toDataURL("image/png");
}

export interface SaveSummary {
  xpGained: number;
  newAchievements: Achievement[];
}

export function ResultView({
  lowMidi,
  highMidi,
  save,
  onRetake,
}: {
  lowMidi: number;
  highMidi: number;
  /** XP/achievement summary from saving — undefined for a previously saved result. */
  save?: SaveSummary;
  onRetake: () => void;
}) {
  const [downloadError, setDownloadError] = useState(false);
  const semis = highMidi - lowMidi;
  const voice = useMemo(
    () => classifyVoice(lowMidi, highMidi),
    [lowMidi, highMidi],
  );

  const famous = useMemo(() => {
    const rows = FAMOUS_VOICES.map((f) => ({
      ...f,
      overlap: rangeOverlap(lowMidi, highMidi, f.lowMidi, f.highMidi),
    })).sort((a, b) => b.overlap - a.overlap);
    return { rows, best: rows[0] };
  }, [lowMidi, highMidi]);

  // Fixed axis for the famous comparison: F1..G7 covers every listed range.
  const FAME_LOW = 29;
  const FAME_HIGH = 103;

  const playRange = () => {
    playTone(lowMidi, { dur: 0.6 });
    playTone(lowMidi, { dur: 1.4, at: 0.7, glideToMidi: highMidi });
    playTone(highMidi, { dur: 0.6, at: 2.2 });
  };

  const downloadCard = () => {
    setDownloadError(false);
    const url = renderCardDataUrl(lowMidi, highMidi);
    if (!url) {
      setDownloadError(true);
      return;
    }
    const a = document.createElement("a");
    a.href = url;
    a.download = `vocal-range-${safeFileLabel(lowMidi)}-${safeFileLabel(highMidi)}.png`;
    a.click();
  };

  return (
    <div className="space-y-6">
      {/* Big readout */}
      <Card>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <SectionLabel>Your range</SectionLabel>
            <div className="tabular mt-3 font-mono text-5xl font-bold sm:text-7xl">
              {midiToLabel(lowMidi)}
              <span className="text-dim"> — </span>
              {midiToLabel(highMidi)}
            </div>
          </div>
          <div className="flex gap-8">
            <Stat label="Semitones" value={semis} tone="amber" />
            <Stat label="Span" value={describeSpan(semis)} tone="ink" />
            <Stat label="Voice type" value={voice.label} tone="cool" />
          </div>
        </div>
        <div className="mt-6">
          <PianoStrip
            rangeLow={lowMidi}
            rangeHigh={highMidi}
            markLow={lowMidi}
            markHigh={highMidi}
            ariaLabel={`Keyboard showing your range from ${midiToLabel(lowMidi)} to ${midiToLabel(highMidi)}`}
          />
        </div>
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <Button variant="outline" size="sm" onClick={playRange}>
            Play my range
          </Button>
          <Button variant="outline" size="sm" onClick={downloadCard}>
            Download result card
          </Button>
          <Button variant="ghost" size="sm" onClick={onRetake}>
            Retake test
          </Button>
        </div>
        {downloadError && (
          <p className="mt-3 text-sm text-rec">
            The image could not be generated. Try a different browser, or take
            a screenshot instead.
          </p>
        )}
      </Card>

      {/* Save summary */}
      {save && (
        <Card className="border-ok/30">
          <div className="flex flex-wrap items-center gap-3">
            <Pill tone="ok">Saved to your progress</Pill>
            <span className="tabular font-mono text-sm text-ok">
              +{save.xpGained} XP
            </span>
          </div>
          {save.newAchievements.length > 0 && (
            <ul className="mt-4 space-y-2">
              {save.newAchievements.map((a) => (
                <li key={a.id} className="flex items-center gap-3 text-sm">
                  <span aria-hidden="true">{a.icon}</span>
                  <span className="font-medium">{a.title}</span>
                  <span className="text-mut">{a.desc}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      )}

      {/* Voice type chart */}
      <Card>
        <SectionLabel>Voice type</SectionLabel>
        <h2 className="mt-3 text-xl">
          Closest fit: <span className="text-amber">{voice.label}</span>
        </h2>
        <p className="mt-2 max-w-2xl text-sm text-mut">
          Voice types are rough guides borrowed from choral music. Your range
          overlaps the {voice.label.toLowerCase()} band the most, but plenty of
          great singers sit between categories — treat this as a starting
          point, not a box.
        </p>
        <div className="mt-6 space-y-2">
          {VOICE_TYPES.map((v) => {
            const left = axisPct(v.lowMidi, 36, 84);
            const width = axisPct(v.highMidi, 36, 84) - left;
            const isMatch = v.id === voice.id;
            return (
              <div key={v.id} className="flex items-center gap-3">
                <span
                  className={`w-28 shrink-0 text-right font-mono text-xs ${isMatch ? "text-amber" : "text-mut"}`}
                >
                  {v.label}
                </span>
                <div className="relative h-5 flex-1 rounded bg-panel2">
                  <div
                    className={`absolute inset-y-0 rounded ${isMatch ? "bg-cool/50" : "bg-cool/25"}`}
                    style={{ left: `${left}%`, width: `${width}%` }}
                  />
                </div>
                <span className="tabular w-20 shrink-0 font-mono text-[11px] text-dim">
                  {midiToLabel(v.lowMidi)}–{midiToLabel(v.highMidi)}
                </span>
              </div>
            );
          })}
          {/* User range overlay row */}
          <div className="flex items-center gap-3">
            <span className="w-28 shrink-0 text-right font-mono text-xs font-semibold text-amber">
              You
            </span>
            <div className="relative h-5 flex-1 rounded bg-panel2">
              <div
                className="absolute inset-y-0 rounded bg-amber"
                style={{
                  left: `${axisPct(lowMidi, 36, 84)}%`,
                  width: `${Math.max(1, axisPct(highMidi, 36, 84) - axisPct(lowMidi, 36, 84))}%`,
                }}
              />
            </div>
            <span className="tabular w-20 shrink-0 font-mono text-[11px] text-amber">
              {midiToLabel(lowMidi)}–{midiToLabel(highMidi)}
            </span>
          </div>
          <div className="flex items-center gap-3 pt-1">
            <span className="w-28 shrink-0" />
            <div className="flex flex-1 justify-between font-mono text-[10px] text-dim">
              <span>C2</span>
              <span>C3</span>
              <span>C4</span>
              <span>C5</span>
              <span>C6</span>
            </div>
            <span className="w-20 shrink-0" />
          </div>
        </div>
      </Card>

      {/* Famous voices */}
      <Card>
        <SectionLabel>Famous company</SectionLabel>
        <h2 className="mt-3 text-xl">
          Your range overlaps most with{" "}
          <span className="text-amber">{famous.best.name}</span>
        </h2>
        <p className="mt-2 max-w-2xl text-sm text-mut">
          Reported ranges — approximate figures fans and journalists commonly
          cite, not lab measurements.
        </p>
        <div className="mt-6 space-y-2">
          {famous.rows.map((f, i) => {
            const left = axisPct(f.lowMidi, FAME_LOW, FAME_HIGH);
            const width = axisPct(f.highMidi, FAME_LOW, FAME_HIGH) - left;
            const uLeft = axisPct(lowMidi, FAME_LOW, FAME_HIGH);
            const uWidth = Math.max(
              1,
              axisPct(highMidi, FAME_LOW, FAME_HIGH) - uLeft,
            );
            const isBest = i === 0;
            return (
              <div key={f.name} className="flex items-center gap-3">
                <span
                  className={`w-36 shrink-0 truncate text-right font-mono text-xs ${isBest ? "text-amber" : "text-mut"}`}
                >
                  {f.name}
                </span>
                <div className="relative h-5 flex-1 rounded bg-panel2">
                  <div
                    className={`absolute inset-y-0 rounded ${isBest ? "bg-cool/50" : "bg-cool/25"}`}
                    style={{ left: `${left}%`, width: `${width}%` }}
                  />
                  <div
                    className="absolute inset-y-1 rounded bg-amber/70"
                    style={{ left: `${uLeft}%`, width: `${uWidth}%` }}
                  />
                </div>
                <span className="tabular w-24 shrink-0 font-mono text-[11px] text-dim">
                  {midiToLabel(f.lowMidi)}–{midiToLabel(f.highMidi)}{" "}
                  <span className={isBest ? "text-amber" : ""}>
                    ({f.overlap}st)
                  </span>
                </span>
              </div>
            );
          })}
        </div>
        <p className="mt-4 font-mono text-[11px] uppercase tracking-[0.14em] text-dim">
          Amber = your range · st = semitones of overlap
        </p>
      </Card>
    </div>
  );
}
