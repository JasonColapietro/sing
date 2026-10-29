"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import dynamic from "next/dynamic";
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
import { FigureFrame, RangeFigure } from "@/components/figures";
import { AudioSetup } from "@/components/audio/audio-setup";
import { LevelMeter } from "@/components/studio/level-meter";
import { recoveryRangeNote, staleRangeProgramNote } from "@/components/practice/program-range-note";
import type { ProgramRangeLink } from "@/components/practice/program-range-probe";
import { focusIfDropped } from "@/lib/audio/mic-focus";
import { freshInputHint, meterInputHint, nextInputHint } from "./pitch-meter-hint";
import { retryWhenOnline } from "./retry-when-online";
import { AMBER, COOL, DIM, INK, OK, PANEL, REC } from "@/lib/chart-colors";
import { PREPAINT_KEYS } from "@/lib/prepaint";

/**
 * The running program's next range test, and whether it is Recovery week,
 * read only once the mic starts for a singer whose saved range is stale, or
 * who has no saved range and a program in this browser: the cases the meter
 * needs it for. Its own chunk: lib/programs carries every program and the
 * song catalog, and this page's cold traffic (the homepage's "Start
 * singing", the Sing tab) has no program, the same reason result-view.tsx
 * loads the catalog late.
 *
 * The chunk is optional, and loads that way. Offline it waits for the
 * connection (./retry-when-online) inside a Suspense boundary of its own
 * (`loading`), and the meter runs without it, as it does for a singer with no
 * program. A failed load used to throw in render and replace the whole room
 * with app/error.tsx; suspending with no boundary of its own would hide the
 * meter behind the voice test's fallback. PitchMeter also fetches it as it
 * mounts for a singer whose saved range is already stale, so one who loses
 * the connection after the page loaded (on a train) still has it.
 */
export const ProgramRangeProbe = dynamic(
  () => retryWhenOnline(() => import("@/components/practice/program-range-probe")),
  { loading: () => null },
);

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
 * Whether this browser holds a program record, running or finished, read
 * from the store's key alone (lib/prepaint.ts restates it; its test holds the
 * two together) so the meter need not load lib/programs to ask. Only such a
 * singer can be on Recovery week, so only they load ProgramRangeProbe without
 * a saved range. A blocked store reads as none, as the store itself does.
 */
export function programStored(): boolean {
  try {
    const raw = window.localStorage.getItem(PREPAINT_KEYS.program);
    return raw !== null && raw !== "null";
  } catch {
    return false;
  }
}

/**
 * Semitones between lowest and highest held before the live panel suggests
 * the range test. Under that the singer has not explored yet, so there is
 * nothing for the test to sharpen mid-run. The stopped card offers it either
 * way, and under this span says what the test adds: the meter asks for one
 * note, and a singer who did just that must not be left without a next step.
 */
const SUGGEST_RANGE_SEMIS = 5;

const COLORS = {
  laneA: "rgba(72,58,32,0.025)",
  laneB: "rgba(72,58,32,0.055)",
  laneC: "rgba(197,150,66,0.12)",
  label: DIM,
  labelC: INK,
  playhead: "rgba(72,58,32,0.35)",
  trailFrom: COOL,
  trailTo: COOL,
  inTune: OK,
  close: AMBER,
  off: REC,
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

/** Matches the color: amber is a little off, brick red is plainly off. */
function tuneWord(cents: number): string {
  const zone = tuneZone(cents);
  if (zone === "in-tune") return "In tune";
  if (zone === "close") return cents < 0 ? "A little flat" : "A little sharp";
  return cents < 0 ? "Flat" : "Sharp";
}

/**
 * The next step for a singer the meter does not send to the range test:
 * practice that uses the saved range (or, during Recovery week with none
 * saved, warmups on the nominal ladder and songs in their written keys).
 * When the running program's range test is on today's day, its plan comes
 * first, since the note says to take the test there.
 */
function PracticeActions({ programDayHref }: { programDayHref: string | null }) {
  return (
    <div className="mt-3 flex flex-wrap gap-3">
      {programDayHref && (
        <LinkButton href={programDayHref} fullLoad>
          Open today’s plan
        </LinkButton>
      )}
      <LinkButton href="/warmups" variant={programDayHref ? "outline" : undefined}>
        Warm up
      </LinkButton>
      <LinkButton href="/songs" variant="outline">
        Sing a song
      </LinkButton>
    </div>
  );
}

/**
 * The next step on a stopped card, by the retest rule: the range test while
 * one is due (no saved range, or one six weeks old, that no running program
 * schedules or asks to leave), and otherwise the program's note or "retest
 * weeks apart", then practice that uses the saved range. The /range meter's
 * stopped card and the studio's Stop card both end on it, so one room never
 * sends a singer to retest the day the other says not to.
 */
export function RangeNextStep({
  retestDue,
  programNote,
  programDayHref,
  tryRange,
  explain = false,
}: {
  retestDue: boolean;
  programNote: string | null;
  programDayHref: string | null;
  /** The room's way into the range test; offered only while one is due. */
  tryRange?: ReactNode;
  /** Say what the range test adds, beside its button. */
  explain?: boolean;
}) {
  return retestDue ? (
    <>
      {explain && tryRange && (
        <p className="mt-2 text-sm text-mut">
          Next, the 2-minute range test walks you down to your lowest note and up to
          your highest, and saves them for your warmups and songs.
        </p>
      )}
      <div className="mt-3 flex flex-wrap gap-3">
        {tryRange}
        <LinkButton href="/warmups" variant="outline">
          Warm up first
        </LinkButton>
      </div>
    </>
  ) : (
    <>
      <p className="mt-2 text-sm text-mut">
        {programNote ??
          "Your saved range already fits your warmups and songs. Retest weeks apart, not in the same session."}
      </p>
      <PracticeActions programDayHref={programDayHref} />
    </>
  );
}

/**
 * Whether a room's next step is the range test, read the instant its mic
 * starts (readRetestRule, from an event handler, never during render): no
 * saved range or a stale one, less a test the running program schedules
 * (its note says when) or Recovery week (its note says to leave the test).
 * The program is read from its own chunk (ProgramRangeProbe, `probe`, which
 * the room renders), only for a stale saved range, or none with a program in
 * this browser. The /range meter and the studio share it.
 */
export function useRangeRetestRule() {
  const isPro = useIsPro();
  const { range } = useProgress();
  /**
   * Whether the range is due a test: no saved range, or one six weeks old
   * (lib/progress RANGE_RETEST_DAYS). Read when the mic starts, so the clock
   * is read in an event handler rather than during render.
   */
  const [retestDue, setRetestDue] = useState(true);
  /** Date.now() when the mic last started: the instant retestDue was read. */
  const [micStartedAt, setMicStartedAt] = useState<number | null>(null);
  /** The running program's next range test, from ProgramRangeProbe. */
  const [programRange, setProgramRange] = useState<ProgramRangeLink | null>(null);
  /** Recovery week's name while it runs, from ProgramRangeProbe. */
  const [recovering, setRecovering] = useState<string | null>(null);
  /** Whether this browser held a program record when the mic last started. */
  const [programKept, setProgramKept] = useState(false);
  const rangeSaved = range.lowMidi !== undefined && range.highMidi !== undefined;
  // retestDue with a saved range means it is six weeks old or more.
  const staleSaved = micStartedAt !== null && retestDue && rangeSaved;
  /** No saved range, and a program that may be Recovery week. */
  const unmeasuredInProgram = micStartedAt !== null && !rangeSaved && programKept;
  /**
   * What the running program says in place of "a retest is due", in the
   * /progress coach's words. Recovery week: leave the test, stale or never
   * taken, until the week is over, since a tired voice is not one to measure
   * (chapters 8 and 12) and a finished test would save its reading as the
   * range every warmup and song fits to. Otherwise a stale range whose next
   * test the program schedules: when it falls. Chapter 13 asks for no retest
   * between the program's points, and one sung here would not count toward
   * its day.
   */
  const programNote =
    micStartedAt === null
      ? null
      : recovering !== null
        ? recoveryRangeNote(range, recovering, micStartedAt)
        : staleSaved
          ? staleRangeProgramNote(range, programRange, micStartedAt)
          : null;
  const programDayHref = programNote !== null && programRange?.today ? programRange.href : null;
  /** The range test is the next step: due, and no running program schedules it or asks to leave it. */
  const offerRetest = retestDue && programNote === null;
  const readsProgram = staleSaved || unmeasuredInProgram;
  const probe = readsProgram ? (
    <ProgramRangeProbe isPro={isPro} onProgramRange={setProgramRange} onRecovering={setRecovering} />
  ) : null;
  // The probe's chunk, fetched while the connection is known to be there: a
  // saved range that is stale now will be when the mic starts, and so will a
  // missing one with a program in this browser.
  useEffect(() => {
    if (range.lowMidi === undefined || range.highMidi === undefined) {
      if (!programStored()) return;
    } else if (!rangeRetestDue(range, Date.now())) return;
    const quit = new AbortController();
    void retryWhenOnline(() => import("@/components/practice/program-range-probe"), {
      signal: quit.signal,
    });
    return () => quit.abort();
  }, [range]);
  const readRetestRule = useCallback(() => {
    const now = Date.now();
    setMicStartedAt(now);
    setRetestDue(rangeRetestDue(range, now));
    setProgramKept(programStored());
  }, [range]);
  return { range, offerRetest, programNote, programDayHref, probe, readRetestRule };
}

/**
 * The stopped meter's summary: the notes held since the meter opened (or was
 * last Reset; "Sing again" keeps them, as the live readout does), whether the
 * stop saved (and what it earned), and always a next step. Not "your last
 * run": after a second start the notes can come from both runs.
 *
 * A singer whose saved range is recent is not sent to retest: the book spaces
 * range tests weeks apart, and their warmups and songs already fit the saved
 * one. They get the practice that builds on it instead. So is a singer whose
 * running program schedules the next test: they get the /progress coach's
 * note saying when it falls (programNote), not a retest of their own. And so
 * is one on Recovery week, with a stale range or none: the coach's note says
 * to leave the test until the week is over.
 */
export function LastRun({
  low,
  high,
  lastLog,
  onTryRange,
  retestDue = true,
  programNote = null,
  programDayHref = null,
}: {
  low: number;
  high: number;
  /** What the run's flush saved; null when it was under the floor. */
  lastLog: Pick<LogResult, "xpGained"> | null;
  onTryRange?: () => void;
  /**
   * No saved range, or one old enough to retest (lib/progress rangeRetestDue)
   * that no running program schedules a test for or asks to leave.
   */
  retestDue?: boolean;
  /**
   * What the running program says about the range test in place of one, as
   * components/practice/program-range-note.ts says it: when a stale range's
   * scheduled test falls, or Recovery week's reason to leave the test.
   */
  programNote?: string | null;
  /** That test is on today's program day: the program's view, to take it there. */
  programDayHref?: string | null;
}) {
  return (
    <Card className="mb-4">
      <SectionLabel>Held so far</SectionLabel>
      <p className="mt-2 text-sm text-mut">
        {/* One note is what the gate asks for, so it is a common first
            result: "held A3", not "held A3 to A3". */}
        {low === high
          ? `You have held ${midiToLabel(low)} so far.`
          : `You have held ${midiToLabel(low)} to ${midiToLabel(high)} so far.`}{" "}
        {lastLog
          ? `+${lastLog.xpGained} XP, saved to your progress.`
          : `Not saved yet: the meter saves once you have sung ${MIN_LOG_SEC} seconds in all, and singing again adds to that time.`}
      </p>
      {/* The gate asks for one note, so a run of a note or two is the
          expected first result, not a reason to withhold the next step. On a
          stop the view scrolls to this card, which puts the Pitch | Range
          test tabs under the sticky header: the card has to carry the step. */}
      <RangeNextStep
        retestDue={retestDue}
        programNote={programNote}
        programDayHref={programDayHref}
        // Only beside the button it explains: without onTryRange there is
        // nothing on the card to take the test with.
        explain={Boolean(onTryRange) && high - low < SUGGEST_RANGE_SEMIS}
        tryRange={onTryRange && <Button onClick={onTryRange}>Take the 2-minute range test</Button>}
      />
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
  // Whether the range test is the next step (useRangeRetestRule), read as
  // the mic starts.
  const { range, offerRetest, programNote, programDayHref, probe, readRetestRule } =
    useRangeRetestRule();
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
      grad.addColorStop(0, "rgba(17,97,93,0)");
      grad.addColorStop(0.35, COLORS.trailFrom);
      grad.addColorStop(1, COLORS.trailTo);
      ctx.strokeStyle = grad;
      ctx.lineWidth = 5;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.shadowColor = COLORS.trailTo;
      ctx.shadowBlur = 0;
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
        ctx.shadowBlur = 0;
        ctx.beginPath();
        ctx.arc(px, y, 9, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.fillStyle = PANEL;
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

  // "Start singing" goes with the gate as the mic opens, and focus fell to
  // <body>. The live panel takes it: it is where the gate's button was, a
  // screen reader names it, and Tab goes on to Reset and Stop mic from there
  // (lib/audio/mic-focus.ts).
  const liveRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (listening) focusIfDropped(liveRef.current);
  }, [listening]);

  const begin = async () => {
    readRetestRule();
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
        {probe}
        {/* Stopping used to drop the singer back on a first-visit screen: the
            notes they held, the save and the next step all vanished. The
            measurement survives the stop, and "Sing again" carries it on
            (begin() clears the save, not the notes) until Reset. */}
        {low !== null && high !== null && (
          <LastRun
            low={low}
            high={high}
            lastLog={lastLog}
            onTryRange={onTryRange}
            retestDue={offerRetest}
            programNote={programNote}
            programDayHref={programDayHref}
          />
        )}
        <MicGate
          title="See your pitch"
          description="Sing any note out loud, an easy “ah” as if to someone across the room. You will see exactly which note you are on, how close to center you are, and a live line of your voice."
          enableLabel={low !== null ? "Sing again" : "Start singing"}
          onEnable={begin}
          error={error}
        />
        <AudioSetup className="mx-auto mt-6 max-w-md" />
        {/* Below the gate so the start button and any mic error stay on a phone's first screen after a #start link. */}
        {low === null && (
          <FigureFrame className="mx-auto mt-8 max-w-2xl" caption="What the range test draws for you">
            <RangeFigure />
          </FigureFrame>
        )}
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
      {probe}
      <div
        ref={liveRef}
        tabIndex={-1}
        role="group"
        aria-label="Live pitch meter"
        className="overflow-hidden rounded-2xl border border-line bg-panel outline-none"
      >
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
        <div className="rounded-2xl border border-line bg-panel p-4">
          <div className="text-label font-extrabold uppercase tracking-[0.12em] text-dim">Lowest held</div>
          <div className="tabular mt-1 text-3xl font-extrabold">{low !== null ? midiToLabel(low) : "—"}</div>
        </div>
        <div className="rounded-2xl border border-line bg-panel p-4">
          <div className="text-label font-extrabold uppercase tracking-[0.12em] text-dim">Highest held</div>
          <div className="tabular mt-1 text-3xl font-extrabold">{high !== null ? midiToLabel(high) : "—"}</div>
        </div>
      </div>

      {/* The meter used to end at two numbers and a Reset button. Once a
          singer has explored a little, those numbers are a rough range with
          nowhere to go; the guided test is what turns them into a saved
          result the warmups and songs can use. A singer whose saved range is
          recent already has that result, and the book spaces retests weeks
          apart, so they are pointed at practice that uses it instead. So is
          one whose running program schedules the next test, with the note
          the /progress coach gives on when it falls, and one on Recovery
          week, saved range or not, with the coach's note to leave the test
          until the week is over. */}
      {explored && low !== null && high !== null && !offerRetest && (saved || programNote !== null) && (
        <div className="rounded-2xl border border-violet/40 bg-panel p-4">
          <p className="text-sm text-mut">
            {programNote
              ? `You have held ${midiToLabel(low)} to ${midiToLabel(high)} so far. ${programNote}`
              : saved
                ? `You have held ${midiToLabel(low)} to ${midiToLabel(high)} so far. Your saved range, ${midiToLabel(saved.low)}–${midiToLabel(saved.high)}, already fits your warmups and songs. Retest weeks apart, under similar conditions, rather than today.`
                : null}
          </p>
          <PracticeActions programDayHref={programDayHref} />
          {proReady && !isPro && (
            <p className="mt-3 text-xs text-dim">
              On the free plan, warmups, songs, ear and breath training share{" "}
              {FREE_DAILY_MINUTES} minutes of guided practice a day, and Pro removes
              that limit.
            </p>
          )}
        </div>
      )}
      {explored && low !== null && high !== null && (offerRetest || (!saved && programNote === null)) && (
        <div className="rounded-2xl border border-violet/40 bg-panel p-4">
          {/* offerRetest with a saved range means it is six weeks old or
              more (an undated one counts as current) and no running program
              schedules the next test or asks to leave it, so a retest is due
              rather than a first result. */}
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
