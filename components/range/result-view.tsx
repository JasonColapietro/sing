"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  VOICE_TYPES,
  classifyVoice,
  midiToLabel,
} from "@/lib/audio/notes";
import { playTone } from "@/lib/audio/synth";
import { useProgress, type Achievement } from "@/lib/progress";
import type { RangeEntry } from "@/lib/analytics";
import { useIsPro, useProReady } from "@/lib/pro";
import { Button, Card, LinkButton, Pill, SectionLabel, Stat } from "@/components/ui";
import { ProCrescendoNudge } from "@/components/pro/gate";
import { LockedPanel, ProChip } from "@/components/pro/ui";
import { RangeHistoryChart } from "@/components/progress/pro-charts";
import {
  AMBER,
  BG,
  DIM,
  INK,
  LINE,
  MUT,
  STRIP_BLACK,
  STRIP_WHITE,
  monoFontStack,
} from "@/lib/chart-colors";
import { PianoStrip } from "./piano-strip";
import { SINGERS_LITE as SINGERS } from "@/lib/singers-lite";
import { rangeOverlap, voiceTypeSlug } from "@/lib/singers-core";
import type { Song } from "@/components/songs/types";
import { countSongsFitting } from "@/components/songs/lib";

/**
 * Household names for the quick post-test comparison, pulled from the full
 * singers library so the numbers here always match /singers/[slug] pages.
 */
const COMPARISON_SLUGS = [
  "freddie-mercury",
  "mariah-carey",
  "axl-rose",
  "johnny-cash",
  "adele",
  "bruno-mars",
  "whitney-houston",
];
const FAMOUS_VOICES = COMPARISON_SLUGS.flatMap((slug) => {
  const s = SINGERS.find((x) => x.slug === slug);
  return s ? [s] : [];
});

function describeSpan(semitones: number): string {
  const oct = Math.floor(semitones / 12);
  const rem = semitones % 12;
  if (oct === 0) return `${rem} semitone${rem === 1 ? "" : "s"}`;
  const base = `${oct} octave${oct === 1 ? "" : "s"}`;
  return rem > 0 ? `${base} + ${rem}` : base;
}

/**
 * Semitones trimmed off each end to get from "the notes I reached" to "the
 * notes I can sing a phrase on". Both extremes came out of pushing, so
 * practising at them trains the reach rather than the voice.
 */
const EDGE_TRIM_SEMIS = 3;

/** The middle of the span, with the pushed edges trimmed. Never inverts. */
function workingRange(lowMidi: number, highMidi: number): [number, number] {
  const trim = Math.min(EDGE_TRIM_SEMIS, Math.floor((highMidi - lowMidi) / 4));
  return [lowMidi + trim, highMidi - trim];
}

/** Under an octave and a half, the useful work is still building the span. */
const LADDER_MAX_SEMIS = 15;

/**
 * Which warmup a fresh result should send the singer to. Both targets are
 * free-tier exercises from components/warmups/exercises.ts — a Pro pack id
 * would be silently dropped by the player's entitlement check.
 */
function warmupForSpan(semis: number): { id: string; title: string; why: string } {
  return semis < LADDER_MAX_SEMIS
    ? {
        id: "five-note-scale",
        title: "Five-note scale",
        why: "A steady ladder through the middle of your range builds the span before you try to stretch it.",
      }
    : {
        id: "octave-siren",
        title: "Octave siren",
        why: "You already cover the span. Sirens keep it one connected voice instead of a low one and a high one.",
      };
}

/** Seven tests a fortnight apart spans exactly the three months the caption claims. */
const SAMPLE_TESTS = 7;
const SAMPLE_INTERVAL_DAYS = 15;

/**
 * A worked example of the range chart, not the singer's data: a test every
 * couple of weeks, ending on the range just measured, widening the way a
 * practising voice does. Shown only when there is nothing real to plot,
 * because an empty chart is the one thing that cannot sell the chart.
 */
function sampleHistory(lowMidi: number, highMidi: number): RangeEntry[] {
  const span = highMidi - lowMidi;
  // Clamped so the earliest sample still spans at least two semitones —
  // rangeSeries drops any entry whose high is not above its low.
  const growth = Math.max(
    0,
    Math.min(4, Math.floor(span / 6), Math.floor((span - 2) / 2)),
  );
  const end = Date.now();
  const steps = SAMPLE_TESTS - 1;
  return Array.from({ length: SAMPLE_TESTS }, (_, i) => {
    const back = steps - i;
    const inset = Math.round((back / steps) * growth);
    return {
      lowMidi: lowMidi + inset,
      highMidi: highMidi - inset,
      testedAt: new Date(
        end - back * SAMPLE_INTERVAL_DAYS * 24 * 60 * 60 * 1000,
      ).toISOString(),
    };
  });
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

  const mono = monoFontStack();

  // Paper ground with the same soft violet wash the site body carries
  ctx.fillStyle = BG;
  ctx.fillRect(0, 0, W, H);
  const glow = ctx.createRadialGradient(W / 2, -120, 60, W / 2, -120, 760);
  glow.addColorStop(0, "rgba(197, 150, 66, 0.12)");
  glow.addColorStop(1, "rgba(197, 150, 66, 0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, H);

  // Panel frame
  ctx.strokeStyle = LINE;
  ctx.lineWidth = 2;
  ctx.strokeRect(28.5, 28.5, W - 57, H - 57);

  ctx.textAlign = "center";

  // Kicker
  ctx.fillStyle = AMBER;
  ctx.font = `600 22px ${mono}`;
  ctx.fillText("V O C A L   R A N G E", W / 2, 118);

  // Big readout
  ctx.fillStyle = INK;
  ctx.font = `700 124px ${mono}`;
  ctx.fillText(`${midiToLabel(lowMidi)} — ${midiToLabel(highMidi)}`, W / 2, 268);

  // Voice type + span
  const voice = classifyVoice(lowMidi, highMidi);
  const semis = highMidi - lowMidi;
  ctx.fillStyle = MUT;
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
      ctx.fillStyle = STRIP_WHITE;
      ctx.strokeStyle = LINE;
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
      ctx.fillStyle = STRIP_BLACK;
      ctx.fillRect(cx - whiteW * 0.28, kbY, whiteW * 0.56, kbH * 0.6);
    } else {
      wi++;
    }
  }
  const clampMidi = (m: number) => Math.max(axisLow, Math.min(axisHigh, m));
  const x0 = (centers.get(clampMidi(lowMidi)) ?? kbX) - whiteW / 2;
  const x1 = (centers.get(clampMidi(highMidi)) ?? kbX + kbW) + whiteW / 2;
  ctx.fillStyle = "rgba(197, 150, 66, 0.30)";
  ctx.fillRect(x0, kbY, Math.max(0, x1 - x0), kbH);
  ctx.strokeStyle = AMBER;
  ctx.lineWidth = 2;
  ctx.strokeRect(x0, kbY, Math.max(0, x1 - x0), kbH);
  ctx.fillStyle = AMBER;
  ctx.font = `600 22px ${mono}`;
  ctx.fillText(midiToLabel(lowMidi), x0, kbY + kbH + 30);
  ctx.fillText(midiToLabel(highMidi), x1, kbY + kbH + 30);

  // Footer
  ctx.fillStyle = DIM;
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

  const [workLow, workHigh] = workingRange(lowMidi, highMidi);
  const warmup = warmupForSpan(semis);

  const isPro = useIsPro();
  const proReady = useProReady();
  // The catalog is ~30 KB of per-note data and all this panel wants from it is
  // a count, so it loads after the result renders rather than riding in the
  // /range bundle — this route's cold traffic never reaches the songbook.
  // Held until the entitlement cache has been read, because the book counted
  // has to be the one the singer can actually open: quoting the free set to a
  // subscriber understates what they paid for, and quoting the full set to a
  // free reader promises access they hit a paywall on one click later.
  const [book, setBook] = useState<readonly Song[] | null>(null);
  useEffect(() => {
    if (!proReady) return;
    let live = true;
    void import("@/components/songs/data").then((m) => {
      if (live) setBook(isPro ? [...m.SONGS, ...m.PRO_SONGS] : m.SONGS);
    });
    return () => {
      live = false;
    };
  }, [isPro, proReady]);

  const counted = useMemo(
    () =>
      book === null
        ? null
        : {
            fitting: countSongsFitting(book, { lowMidi, highMidi }),
            total: book.length,
          },
    [book, lowMidi, highMidi],
  );

  const famous = useMemo(() => {
    const rows = FAMOUS_VOICES.map((f) => ({
      ...f,
      overlap: rangeOverlap(lowMidi, highMidi, f.lowMidi, f.highMidi),
    })).sort((a, b) => b.overlap - a.overlap);
    return { rows, best: rows[0] };
  }, [lowMidi, highMidi]);

  // Axis for the famous comparison: octave-snapped around every listed range
  // (and the singer's own, in case it reaches beyond them).
  const FAME_LOW =
    Math.floor(
      Math.min(lowMidi, ...famous.rows.map((f) => f.lowMidi)) / 12,
    ) * 12;
  const FAME_HIGH =
    Math.ceil(
      Math.max(highMidi, ...famous.rows.map((f) => f.highMidi)) / 12,
    ) * 12;

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
            <Stat label="Semitones" value={semis} tone="violet" />
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
            <span className="tabular font-mono text-sm text-ok-ink">
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

      {/* The result used to end at the number. Two edges and a voice-type
          label are a diagnosis with no prescription, so this is the one card
          that says what to go and do with them. */}
      <Card>
        <SectionLabel>What to do with this</SectionLabel>
        <h2 className="mt-3 text-xl">
          Practise in the middle:{" "}
          <span className="text-violet-ink">
            {midiToLabel(workLow)}–{midiToLabel(workHigh)}
          </span>
        </h2>
        <p className="mt-2 max-w-2xl text-sm text-mut">
          {midiToLabel(lowMidi)} and {midiToLabel(highMidi)} are edges — you
          found them by pushing, and a note you can only just reach is not a
          note you can hold a phrase on. The middle of the span is where
          warmups and songs should sit, and it is the part that widens with
          practice.
        </p>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-line bg-panel2/60 p-4">
            <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-dim">
              Warm up
            </span>
            <h3 className="mt-2 text-base font-semibold">{warmup.title}</h3>
            <p className="mt-1.5 text-sm text-mut">{warmup.why}</p>
            <div className="mt-4">
              {/* ?exercise= is the warmup room's deep-link contract; an
                  unrecognised param just lands on the library, so this stays
                  safe either way. */}
              <LinkButton
                href={`/warmups?exercise=${warmup.id}`}
                variant="outline"
                size="sm"
              >
                Start this warmup
              </LinkButton>
            </div>
          </div>
          <div className="rounded-xl border border-line bg-panel2/60 p-4">
            <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-dim">
              Sing something
            </span>
            <h3 className="mt-2 text-base font-semibold">
              {counted === null
                ? "Find one that fits"
                : counted.fitting > 0
                  ? `${counted.fitting} song${counted.fitting === 1 ? "" : "s"} already fit`
                  : "Nothing fits as written — yet"}
            </h3>
            <p className="mt-1.5 text-sm text-mut">
              {counted === null
                ? "Every song shifts up to an octave either way, so the book comes to the range you just measured."
                : counted.fitting > 0
                  ? `${counted.fitting} of the ${counted.total} songs in ${isPro ? "your book" : "the free book"} stay inside your range in their written key. The rest transpose.`
                  : `None of the ${counted.total} songs in ${isPro ? "your book" : "the free book"} stay inside your range in their written key, so start from one that transposes — every song shifts up to an octave either way.`}
            </p>
            <div className="mt-4">
              {/* Plain /songs, no filter param: the library seeds its browse
                  state from a constant and reads nothing off the URL, so a
                  ?fit=1 here would name a landing it cannot deliver. The count
                  above is stated here rather than promised there. */}
              <LinkButton href="/songs" variant="outline" size="sm">
                Open the songbook
              </LinkButton>
            </div>
          </div>
        </div>
      </Card>

      {/* Voice type chart */}
      <Card>
        <SectionLabel>Voice type</SectionLabel>
        <h2 className="mt-3 text-xl">
          Closest fit: <span className="text-violet-ink">{voice.label}</span>
        </h2>
        <p className="mt-2 max-w-2xl text-sm text-mut">
          Voice types are rough guides borrowed from choral music. Your range
          overlaps the {voice.label.toLowerCase()} band the most, but plenty of
          great singers sit between categories — treat this as a starting
          point, not a box.
        </p>
        {/* The classification used to end here. Every label the classifier can
            produce has a page of singers behind it, so it should be the next
            click rather than the last word. */}
        <Link
          href={`/singers/voice-type/${voiceTypeSlug(voice.label)}`}
          className="mt-3 inline-flex items-center gap-1.5 text-sm text-violet-ink underline decoration-violet/40 underline-offset-4 hover:decoration-violet"
        >
          See the {voice.label.toLowerCase()}s in the library
          <span aria-hidden>→</span>
        </Link>
        <div className="mt-6 space-y-2">
          {VOICE_TYPES.map((v) => {
            const left = axisPct(v.lowMidi, 36, 84);
            const width = axisPct(v.highMidi, 36, 84) - left;
            const isMatch = v.id === voice.id;
            return (
              <div key={v.id} className="flex items-center gap-3">
                <span
                  className={`w-28 shrink-0 text-right font-mono text-xs ${isMatch ? "text-violet-ink" : "text-mut"}`}
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
            <span className="w-28 shrink-0 text-right font-mono text-xs font-semibold text-violet-ink">
              You
            </span>
            <div className="relative h-5 flex-1 rounded bg-panel2">
              <div
                className="absolute inset-y-0 rounded bg-violet"
                style={{
                  left: `${axisPct(lowMidi, 36, 84)}%`,
                  width: `${Math.max(1, axisPct(highMidi, 36, 84) - axisPct(lowMidi, 36, 84))}%`,
                }}
              />
            </div>
            <span className="tabular w-20 shrink-0 font-mono text-[11px] text-violet-ink">
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
          <span className="text-violet-ink">{famous.best.name}</span>
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
                <Link
                  href={`/singers/${f.slug}`}
                  className={`w-36 shrink-0 truncate text-right font-mono text-xs underline decoration-transparent underline-offset-2 transition-colors hover:decoration-current ${isBest ? "text-violet-ink" : "text-mut"}`}
                >
                  {f.name}
                </Link>
                <div className="relative h-5 flex-1 rounded bg-panel2">
                  <div
                    className={`absolute inset-y-0 rounded ${isBest ? "bg-cool/50" : "bg-cool/25"}`}
                    style={{ left: `${left}%`, width: `${width}%` }}
                  />
                  <div
                    className="absolute inset-y-1 rounded bg-violet/70"
                    style={{ left: `${uLeft}%`, width: `${uWidth}%` }}
                  />
                </div>
                <span className="tabular w-24 shrink-0 font-mono text-[11px] text-dim">
                  {midiToLabel(f.lowMidi)}–{midiToLabel(f.highMidi)}{" "}
                  <span className={isBest ? "text-violet-ink" : ""}>
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
        <div className="mt-4">
          <Link
            href="/singers"
            className="text-sm text-violet-ink underline decoration-violet/50 underline-offset-2 hover:decoration-violet"
          >
            Compare against every famous voice →
          </Link>
        </div>
      </Card>

      {/* Every other completion screen carries the offer; this one, the
          highest-intent moment in the product, carried only a locked chart.
          Self-hides for Pro, so it collapses out of the stack entirely. */}
      <ProCrescendoNudge
        line="Pro charts every retake, so gained semitones show as a line"
        title="Watch this number move"
        body="Pro keeps every range test on one chart — the semitones you gain show up as growth instead of a number you have to remember."
        context="Range test"
      />

      {/* Range over time — real history for Pro, the same chart faded as the
          preview for free. */}
      <RangeOverTime lowMidi={lowMidi} highMidi={highMidi} />
    </div>
  );
}

function RangeOverTime({
  lowMidi,
  highMidi,
}: {
  lowMidi: number;
  highMidi: number;
}) {
  const isPro = useIsPro();
  const history = useProgress().rangeHistory;

  if (isPro) {
    return (
      <Card>
        <div className="flex items-center justify-between gap-2">
          <SectionLabel>Range over time</SectionLabel>
          <ProChip />
        </div>
        <div className="mt-4">
          <RangeHistoryChart history={history} />
        </div>
      </Card>
    );
  }

  // A first-time tester has nothing to plot, so the free panel used to sell
  // the chart with an empty chart. Plot a worked example instead — and say so
  // in the panel label, which is the only part of a LockedPanel that is not
  // aria-hidden, so the sample can never read as their own history.
  const hasHistory = history.length >= 2;

  return (
    <LockedPanel
      label={hasHistory ? "Range over time" : "Range over time · sample"}
    >
      <div className="p-4 sm:p-5">
        {/* Above the chart, not below it: the panel pins its lock row over the
            bottom of whatever it wraps, and a caption there would be buried. */}
        {!hasHistory && (
          <p className="mb-3 font-mono text-[11px] uppercase tracking-[0.14em] text-dim">
            Sample — this is what three months of tests looks like
          </p>
        )}
        <RangeHistoryChart
          history={hasHistory ? history : sampleHistory(lowMidi, highMidi)}
        />
      </div>
    </LockedPanel>
  );
}
