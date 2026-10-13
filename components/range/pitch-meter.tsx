"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePitch, type PitchFrame } from "@/lib/audio/use-pitch";
import {
  freqToMidiFloat,
  midiToLabel,
  midiToName,
  tuneZone,
} from "@/lib/audio/notes";
import { logSession, rangeRetestDue, useProgress, type LogResult } from "@/lib/progress";
import { useIsPro, useProReady } from "@/lib/pro";
import { createPracticeClock } from "@/lib/practice-clock";
import { FREE_DAILY_MINUTES } from "@/lib/practice-limits";
import { useFlushOnExit } from "@/lib/use-flush-on-exit";
import { Button, Card, LinkButton, MicGate, SectionLabel } from "@/components/ui";
import { AudioSetup } from "@/components/audio/audio-setup";
import { LevelMeter } from "@/components/studio/level-meter";
import { freshInputHint, meterInputHint, nextInputHint } from "./pitch-meter-hint";

/** Ignore near-silent frames, the same floor the range test uses. */
const MIN_VOLUME = 0.008;
/** C1..C7: anything outside is a detector artefact, not a voice. */
const MIN_PLAUSIBLE = 24;
const MAX_PLAUSIBLE = 96;
/** Pixels the trail moves left per second. */
const SCROLL_PX_PER_S = 110;
/** Semitones visible top to bottom. */
const VISIBLE_SEMITONES = 15;
/** Where "now" sits, as a fraction of the width. History lives to its left. */
const PLAYHEAD = 0.78;
/** Practice under this long is not logged: the same floor the studio uses. */
const MIN_LOG_SEC = 45;
/**
 * Semitones between lowest and highest held before the meter suggests the
 * range test. Under that the singer has not explored yet, so there is nothing
 * for the test to sharpen.
 */
const SUGGEST_RANGE_SEMIS = 5;

const COLORS = {
  laneA: "rgba(255,255,255,0.025)",
  laneB: "rgba(255,255,255,0.055)",
  laneC: "rgba(139,92,246,0.16)",
  label: "#a39dc9",
  labelC: "#f6f4ff",
  playhead: "rgba(255,255,255,0.35)",
  trailFrom: "#8b5cf6",
  trailTo: "#ff4fa3",
  inTune: "#2fd49a",
  close: "#ffc24a",
  off: "#ff4fa3",
};

type Point = { t: number; midi: number | null };

function voiced(f: PitchFrame): boolean {
  return (
    f.freq !== null &&
    f.note !== null &&
    f.volume >= MIN_VOLUME &&
    f.note.midi >= MIN_PLAUSIBLE &&
    f.note.midi <= MAX_PLAUSIBLE
  );
}

function tuneColor(cents: number): string {
  const zone = tuneZone(cents);
  if (zone === "in-tune") return COLORS.inTune;
  if (zone === "close") return COLORS.close;
  return COLORS.off;
}

/** Matches the color: amber is a little off, pink is plainly off. */
function tuneWord(cents: number): string {
  const zone = tuneZone(cents);
  if (zone === "in-tune") return "In tune";
  if (zone === "close") return cents < 0 ? "A little flat" : "A little sharp";
  return cents < 0 ? "Flat" : "Sharp";
}

/**
 * The stopped meter's summary: the notes held since the meter opened (or was
 * last Reset; "Sing again" keeps them, as the live readout does), whether the
 * stop saved (and what it earned), and the next step once the singer has
 * explored enough for the range test to sharpen. Not "your last run": after a
 * second start the notes can come from both runs.
 *
 * A singer whose saved range is recent is not sent to retest: the book spaces
 * range tests weeks apart, and their warmups and songs already fit the saved
 * one. They get the practice that builds on it instead.
 */
export function LastRun({
  low,
  high,
  lastLog,
  onTryRange,
  retestDue = true,
}: {
  low: number;
  high: number;
  /** What the run's flush saved; null when it was under the floor. */
  lastLog: Pick<LogResult, "xpGained"> | null;
  onTryRange?: () => void;
  /** No saved range, or one old enough to retest (lib/progress rangeRetestDue). */
  retestDue?: boolean;
}) {
  return (
    <Card className="mb-4">
      <SectionLabel>Held so far</SectionLabel>
      <p className="mt-2 text-sm text-mut">
        You have held {midiToLabel(low)} to {midiToLabel(high)} so far.{" "}
        {lastLog
          ? `+${lastLog.xpGained} XP, saved to your progress.`
          : `Not saved yet: the meter saves once you have sung ${MIN_LOG_SEC} seconds in all, and singing again adds to that time.`}
      </p>
      {high - low >= SUGGEST_RANGE_SEMIS &&
        (retestDue ? (
          <div className="mt-3 flex flex-wrap gap-3">
            {onTryRange && <Button onClick={onTryRange}>Take the 2-minute range test</Button>}
            <LinkButton href="/warmups" variant="outline">
              Warm up first
            </LinkButton>
          </div>
        ) : (
          <>
            <p className="mt-2 text-sm text-mut">
              Your saved range already fits your warmups and songs. Retest weeks apart,
              not in the same session.
            </p>
            <div className="mt-3 flex flex-wrap gap-3">
              <LinkButton href="/warmups">Warm up</LinkButton>
              <LinkButton href="/songs" variant="outline">
                Sing a song
              </LinkButton>
            </div>
          </>
        ))}
    </Card>
  );
}

/**
 * The default voice test: open the mic and see your pitch, nothing else. A
 * scrolling note lane shows where your voice is and where it has been, the
 * readout names the note and how far off center you are, and the lowest and
 * highest notes you have held this session are kept as a running measurement.
 */
export function PitchMeter({
  onTryRange,
}: {
  /** Switches the voice test to the guided range test. */
  onTryRange?: () => void;
} = {}) {
  const { frame, latest, listening, error, start, stop } = usePitch();
  const isPro = useIsPro();
  const proReady = useProReady();
  const { range } = useProgress();
  /**
   * Whether the range test is worth suggesting: no saved range, or one six
   * weeks old (lib/progress RANGE_RETEST_DAYS). Read when the mic starts, so
   * the clock is read in an event handler rather than during render.
   */
  const [retestDue, setRetestDue] = useState(true);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pointsRef = useRef<Point[]>([]);
  /** The midi value the view is centered on, eased toward the singer. */
  const centerRef = useRef(57); // A3 until we hear something
  const [low, setLow] = useState<number | null>(null);
  const [high, setHigh] = useState<number | null>(null);
  /**
   * What the last flush saved, for the stopped view. Cleared on every start
   * that opens the mic, so a later short run is never reported with an
   * earlier run's XP.
   */
  const [lastLog, setLastLog] = useState<LogResult | null>(null);
  const lowRef = useRef<number | null>(null);
  const highRef = useRef<number | null>(null);
  const heldRef = useRef<{ midi: number | null; ms: number; lastT: number }>({
    midi: null,
    ms: 0,
    lastT: 0,
  });
  /**
   * The too-quiet hint, the range test's rule (./pitch-meter-hint): the meter
   * used to show a dash forever to a singer the mic could not hear. The state
   * lives in a ref the draw loop updates; the hint renders only on a change.
   */
  const inputRef = useRef(freshInputHint());
  const [hint, setHint] = useState<string | null>(null);
  /** Mirrors `hint`, so the draw loop never reads the state it sets. */
  const hintRef = useRef<string | null>(null);
  // This is where the homepage's "Start singing" lands, and it used to save
  // nothing: no session, no streak, no reason to come back tomorrow. It logs
  // the way the studio does, counting only time the mic is on and the page is
  // on screen.
  const [practiceClock] = useState(() => createPracticeClock());

  /**
   * Log the practice once it has run long enough to count. Idempotent: the
   * clock pauses first, so stopping the mic, hiding the tab and unmounting can
   * all call it. A stretch under the floor stays banked for the next flush.
   */
  const flushLog = useCallback(() => {
    if (!practiceClock.pause()) return;
    const durationSec = Math.floor(practiceClock.elapsedMs() / 1000);
    if (durationSec < MIN_LOG_SEC) return;
    practiceClock.reset();
    setLastLog(logSession({ type: "pitch", durationSec, detail: "Pitch meter" }));
  }, [practiceClock]);
  useFlushOnExit(flushLog);

  useEffect(() => {
    if (!listening) return;
    const onVisibility = () => {
      if (document.visibilityState === "visible") practiceClock.resume();
    };
    onVisibility();
    document.addEventListener("visibilitychange", onVisibility);
    // A bfcache restore can already be visible, with no visibility transition.
    window.addEventListener("pageshow", onVisibility);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pageshow", onVisibility);
      // The mic stopped (or the meter is going away): close the stretch.
      flushLog();
    };
  }, [listening, practiceClock, flushLog]);

  // The lane: its own rAF loop reading the latest frame by ref.
  useEffect(() => {
    if (!listening) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let raf = 0;

    const draw = () => {
      raf = requestAnimationFrame(draw);
      const dpr = window.devicePixelRatio || 1;
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
        canvas.width = Math.round(w * dpr);
        canvas.height = Math.round(h * dpr);
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);

      const now = performance.now();
      const f = latest.current;

      // Count a note toward low/high only once it has been held for a moment,
      // so a crack or a consonant never sets the record.
      const held = heldRef.current;
      const dt = held.lastT ? Math.min(120, now - held.lastT) : 0;
      held.lastT = now;
      if (f && voiced(f) && f.note) {
        const m = f.note.midi;
        if (held.midi === m) held.ms += dt;
        else {
          held.midi = m;
          held.ms = 0;
        }
        if (held.ms >= 300) {
          if (lowRef.current === null || m < lowRef.current) {
            lowRef.current = m;
            setLow(m);
          }
          if (highRef.current === null || m > highRef.current) {
            highRef.current = m;
            setHigh(m);
          }
        }
      } else {
        held.midi = null;
        held.ms = 0;
      }
      if (f && dt > 0) {
        nextInputHint(inputRef.current, f, dt, voiced(f), MIN_VOLUME);
        const nextHint = meterInputHint(inputRef.current);
        if (hintRef.current !== nextHint) {
          hintRef.current = nextHint;
          setHint(nextHint);
        }
      }
      const midiF = f && voiced(f) && f.freq ? freqToMidiFloat(f.freq) : null;
      const pts = pointsRef.current;
      pts.push({ t: now, midi: midiF });
      const horizonMs = ((w * PLAYHEAD) / SCROLL_PX_PER_S) * 1000 + 200;
      while (pts.length && now - pts[0].t > horizonMs) pts.shift();

      // Follow the voice: ease the window toward the recent median.
      const recent = pts.filter((p) => p.midi !== null && now - p.t < 1500).map((p) => p.midi as number);
      if (recent.length) {
        const sorted = [...recent].sort((a, b) => a - b);
        const target = sorted[Math.floor(sorted.length / 2)];
        centerRef.current += (target - centerRef.current) * 0.04;
      }
      const top = centerRef.current + VISIBLE_SEMITONES / 2;
      const laneH = h / VISIBLE_SEMITONES;
      const yFor = (m: number) => (top - m) * laneH;

      // Lanes, one per semitone, C lanes tinted and lettered.
      ctx.font = "600 11px ui-sans-serif, system-ui, sans-serif";
      ctx.textBaseline = "middle";
      const first = Math.floor(top - VISIBLE_SEMITONES) - 1;
      for (let m = first; m <= Math.ceil(top) + 1; m++) {
        const yC = yFor(m);
        const isC = midiToName(m) === "C";
        const sharp = midiToName(m).includes("#");
        ctx.fillStyle = isC ? COLORS.laneC : sharp ? COLORS.laneA : COLORS.laneB;
        ctx.fillRect(0, yC - laneH / 2 + 1, w, laneH - 2);
        if (!sharp && laneH >= 14) {
          ctx.fillStyle = isC ? COLORS.labelC : COLORS.label;
          ctx.fillText(midiToLabel(m), 10, yC);
        }
      }

      // Playhead.
      const px = w * PLAYHEAD;
      ctx.strokeStyle = COLORS.playhead;
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 6]);
      ctx.beginPath();
      ctx.moveTo(px, 0);
      ctx.lineTo(px, h);
      ctx.stroke();
      ctx.setLineDash([]);

      // Trail.
      const grad = ctx.createLinearGradient(0, 0, px, 0);
      grad.addColorStop(0, "rgba(139,92,246,0)");
      grad.addColorStop(0.35, COLORS.trailFrom);
      grad.addColorStop(1, COLORS.trailTo);
      ctx.strokeStyle = grad;
      ctx.lineWidth = 5;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.shadowColor = COLORS.trailTo;
      ctx.shadowBlur = 12;
      ctx.beginPath();
      let pen = false;
      for (const p of pts) {
        if (p.midi === null) {
          pen = false;
          continue;
        }
        const x = px - ((now - p.t) / 1000) * SCROLL_PX_PER_S;
        const y = yFor(p.midi);
        if (!pen) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
        pen = true;
      }
      ctx.stroke();
      ctx.shadowBlur = 0;

      // The head: where your voice is right now, colored by tuning.
      if (midiF !== null && f?.note) {
        const y = yFor(midiF);
        const color = tuneColor(f.note.cents);
        ctx.fillStyle = color;
        ctx.shadowColor = color;
        ctx.shadowBlur = 22;
        ctx.beginPath();
        ctx.arc(px, y, 9, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.arc(px, y, 3.5, 0, Math.PI * 2);
        ctx.fill();
      }
    };
    draw();
    return () => cancelAnimationFrame(raf);
  }, [listening, latest]);

  // "Stop mic" sits at the foot of the live view, so a phone is scrolled well
  // down when it is pressed. The stopped view is far shorter, and the scroll
  // position stays where it was: on a 375x667 phone that left the summary
  // above the screen, with only the gate's lower half in view. Bring the top
  // of the stopped view back, as the range test does on each stage change.
  // Only on a stop, never on the first mount: that is where the page landed.
  const stoppedRef = useRef<HTMLDivElement>(null);
  const wasListeningRef = useRef(false);
  useEffect(() => {
    const was = wasListeningRef.current;
    wasListeningRef.current = listening;
    if (was && !listening) stoppedRef.current?.scrollIntoView({ block: "start" });
  }, [listening]);

  const begin = async () => {
    setRetestDue(rangeRetestDue(range, Date.now()));
    pointsRef.current = [];
    heldRef.current = { midi: null, ms: 0, lastT: 0 };
    inputRef.current = freshInputHint();
    hintRef.current = null;
    setHint(null);
    // Cleared once the mic is on, so a later short run is never reported
    // with an earlier run's XP. A start that fails (the mic refused or
    // unplugged) leaves the last save on the card: it still happened.
    if (await start()) setLastLog(null);
  };

  const reset = () => {
    setLow(null);
    setHigh(null);
    lowRef.current = null;
    highRef.current = null;
    pointsRef.current = [];
  };

  if (!listening) {
    return (
      <div ref={stoppedRef}>
        {/* Stopping used to drop the singer back on a first-visit screen: the
            notes they held, the save and the next step all vanished. The
            measurement survives the stop, and "Sing again" carries it on
            (begin() clears the save, not the notes) until Reset. */}
        {low !== null && high !== null && (
          <LastRun low={low} high={high} lastLog={lastLog} onTryRange={onTryRange} retestDue={retestDue} />
        )}
        <MicGate
          title="See your pitch"
          description="Sing any note out loud, an easy “ah” as if to someone across the room. You will see exactly which note you are on, how close to center you are, and a live line of your voice."
          enableLabel={low !== null ? "Sing again" : "Start singing"}
          onEnable={begin}
          error={error}
        />
        <AudioSetup className="mx-auto mt-6 max-w-md" />
      </div>
    );
  }

  const on = voiced(frame) && frame.note ? frame.note : null;
  const cents = on ? Math.round(on.cents) : 0;
  const color = on ? tuneColor(on.cents) : undefined;
  const explored =
    low !== null && high !== null && high - low >= SUGGEST_RANGE_SEMIS;
  const saved =
    range.lowMidi !== undefined && range.highMidi !== undefined
      ? { low: range.lowMidi, high: range.highMidi }
      : null;

  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-3xl border border-line bg-panel">
        <div className="flex items-end justify-between gap-4 px-5 pt-5 sm:px-6">
          <div>
            <div className="text-label font-extrabold uppercase tracking-[0.12em] text-dim">
              Your note
            </div>
            <div
              className="tabular mt-1 text-6xl font-extrabold leading-none sm:text-7xl"
              style={{ color: color ?? "var(--color-dim)" }}
              aria-live="off"
            >
              {on ? on.label : "—"}
            </div>
          </div>
          <div className="text-right">
            <div className="tabular text-2xl font-extrabold text-ink">
              {on && frame.freq ? `${frame.freq.toFixed(1)} Hz` : "—"}
            </div>
            <div className="mt-1 text-sm font-bold" style={{ color: color ?? "var(--color-dim)" }}>
              {on ? `${cents > 0 ? "+" : ""}${cents}¢ · ${tuneWord(on.cents)}` : "Sing a note"}
            </div>
          </div>
        </div>

        {/* Tuner bar: center is perfect, each side is 50 cents. */}
        <div className="px-5 pt-4 sm:px-6" aria-hidden="true">
          <div className="relative h-2 rounded-full bg-panel2">
            <div className="absolute inset-y-0 left-[35%] right-[35%] rounded-full bg-ok/25" />
            <div className="absolute inset-y-[-4px] left-1/2 w-px bg-ink/50" />
            {on && (
              <div
                className="absolute top-1/2 size-4 -translate-x-1/2 -translate-y-1/2 rounded-full ring-2 ring-bg transition-[left] duration-75"
                style={{ left: `${50 + Math.max(-50, Math.min(50, cents))}%`, background: color }}
              />
            )}
          </div>
          <div className="mt-1 flex justify-between text-[11px] font-bold text-dim">
            <span>Flat</span>
            <span>Sharp</span>
          </div>
        </div>

        {/* What the mic hears, and why the note reads "—" when it cannot
            measure: the range test's too-quiet hint, shared. */}
        <div className="px-5 pt-3 sm:px-6">
          <LevelMeter volume={frame.volume} />
        </div>
        <div role="status" className="px-5 sm:px-6">
          {hint && <p className="pt-2 text-sm text-mut">{hint}</p>}
        </div>

        <canvas
          ref={canvasRef}
          className="mt-3 block h-[clamp(260px,46vh,440px)] w-full"
          role="img"
          aria-label={on ? `Live pitch: ${on.label}` : "Live pitch lane"}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-3xl border border-line bg-panel p-4">
          <div className="text-label font-extrabold uppercase tracking-[0.12em] text-dim">Lowest held</div>
          <div className="tabular mt-1 text-3xl font-extrabold">{low !== null ? midiToLabel(low) : "—"}</div>
        </div>
        <div className="rounded-3xl border border-line bg-panel p-4">
          <div className="text-label font-extrabold uppercase tracking-[0.12em] text-dim">Highest held</div>
          <div className="tabular mt-1 text-3xl font-extrabold">{high !== null ? midiToLabel(high) : "—"}</div>
        </div>
      </div>

      {/* The meter used to end at two numbers and a Reset button. Once a
          singer has explored a little, those numbers are a rough range with
          nowhere to go; the guided test is what turns them into a saved
          result the warmups and songs can use. A singer whose saved range is
          recent already has that result, and the book spaces retests weeks
          apart, so they are pointed at practice that uses it instead. */}
      {explored && low !== null && high !== null && !retestDue && saved && (
        <div className="rounded-3xl border border-violet/40 bg-panel p-4">
          <p className="text-sm text-mut">
            You have held {midiToLabel(low)} to {midiToLabel(high)} so far. Your saved
            range, {midiToLabel(saved.low)}–{midiToLabel(saved.high)}, already fits your
            warmups and songs. Retest weeks apart, under similar conditions, rather than
            today.
          </p>
          <div className="mt-3 flex flex-wrap gap-3">
            <LinkButton href="/warmups">Warm up</LinkButton>
            <LinkButton href="/songs" variant="outline">
              Sing a song
            </LinkButton>
          </div>
          {proReady && !isPro && (
            <p className="mt-3 text-xs text-dim">
              On the free plan, warmups, songs, ear and breath training share{" "}
              {FREE_DAILY_MINUTES} minutes of guided practice a day, and Pro removes
              that limit.
            </p>
          )}
        </div>
      )}
      {explored && low !== null && high !== null && (retestDue || !saved) && (
        <div className="rounded-3xl border border-violet/40 bg-panel p-4">
          {/* retestDue with a saved range means it is six weeks old or more
              (an undated one counts as current), so a retest is due rather
              than a first result. */}
          <p className="text-sm text-mut">
            {saved
              ? `You have held ${midiToLabel(low)} to ${midiToLabel(high)} so far. Your saved range, ${midiToLabel(saved.low)}–${midiToLabel(saved.high)}, is six weeks old or more, so a retest is due: the 2-minute range test saves your lowest and highest clear notes today, the span, and a voice-type estimate, and warmups and songs then open fitted to it.`
              : `You have held ${midiToLabel(low)} to ${midiToLabel(high)} so far. The 2-minute range test turns that into a saved result: your lowest and highest clear notes, the span, and a voice-type estimate. Warmups and songs then open fitted to it.`}
          </p>
          <div className="mt-3 flex flex-wrap gap-3">
            {onTryRange && (
              <Button onClick={onTryRange}>Take the 2-minute range test</Button>
            )}
            <LinkButton href="/warmups" variant="outline">
              Warm up first
            </LinkButton>
          </div>
          {proReady && !isPro && (
            <p className="mt-3 text-xs text-dim">
              The range test has no daily limit. On the free plan, warmups,
              songs, ear and breath training share {FREE_DAILY_MINUTES}{" "}
              minutes of guided practice a day, and Pro removes that limit.
            </p>
          )}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <Button variant="outline" onClick={reset}>
          Reset
        </Button>
        <Button variant="ghost" onClick={stop}>
          Stop mic
        </Button>
        <span className="text-xs text-dim">
          Singing for {MIN_LOG_SEC} seconds or more saves to your progress.
        </span>
      </div>
    </div>
  );
}
