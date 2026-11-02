"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePitch } from "@/lib/audio/use-pitch";
import { tuneZone } from "@/lib/audio/notes";
import { logSession, type LogResult } from "@/lib/progress";
import { useFlushOnExit } from "@/lib/use-flush-on-exit";
import { focusIfDropped } from "@/lib/audio/mic-focus";
import { createPracticeClock } from "@/lib/practice-clock";
import { ProInlineNudge, ProWhisper } from "@/components/pro/gate";
import { AudioSetup } from "@/components/audio/audio-setup";
import { SILENCE_RMS } from "@/lib/audio/pitch";
import {
  HINT_AFTER_MS,
  freshInputHint,
  meterInputHint,
  nextInputHint,
} from "@/components/range/pitch-meter-hint";
import { Button, Card, LinkButton, MicGate, PageShell, Pill, SectionLabel } from "@/components/ui";
import { FigureFrame, TraceFigure } from "@/components/figures";
import { RangeNextStep, useRangeRetestRule } from "@/components/range/pitch-meter";
import { rangeTestHref } from "@/lib/site";
import { CentsGauge } from "./cents-gauge";
import { LevelMeter } from "./level-meter";
import { PitchTrace } from "./pitch-trace";
import { TargetPractice, emptyTargetStats, type TargetStats } from "./target-practice";

const MIN_LOG_SEC = 45;

/**
 * Target time that has to be sung before the session carries a score. A note
 * or two of target practice inside a long tuner session is too small a sample
 * to grade — and a perfect blip would otherwise score 100.
 */
const MIN_SCORE_MS = 5000;

/**
 * The level under which the live hint calls the voice too quiet: the
 * detector's own silence floor. It returns no pitch at all under SILENCE_RMS,
 * so a soft voice there is too quiet to measure, not "heard, but with no
 * pitch", which is what a lower floor (the pitch meter's 0.008) made of it.
 */
const HINT_MIN_VOLUME = SILENCE_RMS;

const BEST_KEY = "suede-sing:studio-best:v1";

/**
 * Best target-practice session on this device. Stored as an object so a
 * later figure (longest combo, say) can join it without a key migration.
 */
interface StudioBest {
  locks: number;
}

function readStudioBest(): StudioBest {
  if (typeof window === "undefined") return { locks: 0 };
  try {
    const raw = window.localStorage.getItem(BEST_KEY);
    const parsed = raw ? (JSON.parse(raw) as unknown) : null;
    const locks =
      typeof parsed === "object" && parsed !== null
        ? (parsed as Partial<StudioBest>).locks
        : undefined;
    return { locks: typeof locks === "number" && locks > 0 ? locks : 0 };
  } catch {
    return { locks: 0 };
  }
}

/** Record a finished session's lock count. Returns true on a new best. */
function saveStudioBest(locks: number): boolean {
  if (locks <= readStudioBest().locks) return false;
  try {
    window.localStorage.setItem(BEST_KEY, JSON.stringify({ locks }));
  } catch {
    // storage unavailable — the best simply isn't remembered
  }
  return true;
}

/** What a finished session has to report, whether or not it was long enough to log. */
export interface StudioResult {
  /** Null when the session ran under MIN_LOG_SEC, or heard nothing — nothing was written. */
  log: LogResult | null;
  locks: number;
  newBest: boolean;
  /**
   * True when the mic heard no note all session, and the session ran long
   * enough (HINT_AFTER_MS, the live hint's own wait) to say so. Nothing was
   * logged and the clock starts over: a dead or muted mic used to log 50
   * seconds of silence as practice, with XP, a streak and "First note".
   */
  silent?: boolean;
}

type PracticeClock = ReturnType<typeof createPracticeClock>;

/**
 * Close out a studio session: bank the personal best and log the practice if
 * it ran long enough and the mic heard a note. Idempotent — the clock pauses
 * first, so every later call falls straight out. That is what makes it safe
 * to fire from the stop button, from unmount, and from the page going away.
 *
 * `heardMs` is the time a note was heard since the last logged session; a
 * stretch with none is thrown away rather than banked, so the silent seconds
 * never join the next session's.
 */
/** Whether Sing again continues the last session: it stopped short of MIN_LOG_SEC with a note heard, so nothing was logged or thrown away. */
export function carriesOver(last: StudioResult | null): boolean {
  return last !== null && last.log === null && !last.silent;
}

export function finishStudioSession(
  session: {
    clock: PracticeClock;
    stats: { current: TargetStats };
    heardMs: { current: number };
  },
  log: typeof logSession = logSession,
): StudioResult | null {
  const { clock, stats, heardMs } = session;
  if (!clock.pause()) return null;

  const { hits, scoredMs, inTuneMs } = stats.current;
  // Banked before the duration floor: a short session that locked notes
  // still earned the best it set.
  const newBest = hits > 0 && saveStudioBest(hits);

  // No note heard at all: not practice, whatever the clock says, so the
  // silent seconds are thrown away rather than banked. Only a session that
  // ran as long as the live hint waits is called silent: Stop pressed a
  // moment after Start says nothing about the mic, and showed nothing before.
  if (heardMs.current === 0 && hits === 0) {
    const ranMs = clock.elapsedMs();
    clock.reset();
    stats.current = emptyTargetStats();
    return ranMs >= HINT_AFTER_MS
      ? { log: null, locks: 0, newBest: false, silent: true }
      : { log: null, locks: 0, newBest: false };
  }

  const durationSec = Math.floor(clock.elapsedMs() / 1000);
  if (durationSec < MIN_LOG_SEC) {
    // Nothing was logged, so nothing is thrown away either: the seconds and
    // the locks stay banked for the next flush, and the singer interrupted
    // twice still logs the practice they actually did.
    return { log: null, locks: hits, newBest };
  }

  clock.reset();
  stats.current = emptyTargetStats();
  heardMs.current = 0;
  return {
    log: log({
      type: "pitch",
      durationSec,
      detail:
        hits > 0
          ? `Studio: ${hits} lock${hits === 1 ? "" : "s"}`
          : "Studio session",
      // The score is the share of sung target time that landed in tune —
      // the same measure the warmup ladders report, so the two are
      // comparable in the weekly trend. A pure-tuner session never set a
      // target, so it goes in unscored: a 0 there would read as a failed
      // session, not an unscored one, and would drag the trend down with it.
      ...(scoredMs >= MIN_SCORE_MS
        ? { score: Math.round((100 * inTuneMs) / scoredMs) }
        : {}),
    }),
    locks: hits,
    newBest,
  };
}

function fmtTime(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

/** Tape label above the parts list, and the accessible name of that list. */
const PARTS_LABEL = "Inside the studio";

/**
 * The four surfaces this room actually has. The page subtitle names three of
 * them in one sentence and the mic card gives the fourth one line (kept to
 * one so its button clears a 375px phone's tab bar), which is enough to sell
 * the tuner and not enough to explain the rest: the in-tune window, what the
 * trace is good for, and the fact that target practice keeps a record at all
 * were only discoverable after the browser prompt. One line each, before the
 * prompt instead of after it.
 */
const STUDIO_PARTS = [
  {
    name: "Tuner",
    desc: "The note you are singing in large type, its frequency in hertz, and how many cents sharp or flat you are. A level meter under it confirms the mic is hearing you.",
  },
  {
    name: "Cents gauge",
    desc: "A needle that leaves center the moment you drift. Inside fifteen cents reads as in tune.",
  },
  {
    name: "Pitch trace",
    desc: "A scrolling line of your last eight seconds, so a wobble becomes something you can see instead of something you half heard.",
  },
  {
    name: "Target practice",
    desc: "Pick a note, then hold within fifty cents of it for three seconds in total to lock it. The gauge's fifteen-cent in-tune zone is the tighter goal. Locks in a row build a run, and your best session is kept on this device.",
  },
] as const;


/**
 * The Stop card: what the session did, then a next room. The same shape as
 * the /range meter's stopped card, and the same retest rule
 * (components/range/pitch-meter.tsx RangeNextStep): the range test only while
 * one is due, and otherwise the program's note or "retest weeks apart" with
 * practice that uses the saved range.
 */
export function StudioLastSession({
  result,
  elapsedSec,
  retestDue,
  programNote,
  programDayHref,
}: {
  result: StudioResult;
  /** The session clock as it stopped: the logged length, banked time included. */
  elapsedSec: number;
  retestDue: boolean;
  programNote: string | null;
  programDayHref: string | null;
}) {
  return (
    <Card className="mx-auto mb-6 max-w-2xl">
      <SectionLabel>Last session</SectionLabel>
      <p className="mt-2 text-sm text-mut">
        {result.log
          ? `${fmtTime(elapsedSec)} in the studio. +${result.log.xpGained} XP, saved to your progress.`
          : result.silent
            ? "No note was heard, so nothing was logged. Sing a little louder or closer to the mic, or check the input under Audio below."
            : `That one ran under ${MIN_LOG_SEC} seconds, so it wasn’t logged. Sing again adds to the time.`}
      </p>
      {(result.locks > 0 || (result.log?.newAchievements.length ?? 0) > 0) && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {result.locks > 0 && (
            <Pill tone={result.newBest ? "ok" : "violet"}>
              <span className="tabular font-mono">{result.locks}</span>
              {result.newBest ? " locked · new personal best" : " locked"}
            </Pill>
          )}
          {result.log?.newAchievements.map((a) => (
            <Pill key={a.id} tone="ok">
              {a.icon} {a.title}
            </Pill>
          ))}
        </div>
      )}
      {/* The range test and the warmups need the same mic, so after a silent
          session the next step is the input check and Sing again, as on the
          /range meter's silent card. */}
      {!result.silent && (
        <RangeNextStep
          retestDue={retestDue}
          programNote={programNote}
          programDayHref={programDayHref}
          tryRange={<LinkButton href={rangeTestHref()}>Take the 2-minute range test</LinkButton>}
        />
      )}
      {result.log && (
        <div className="mt-3">
          <ProInlineNudge>Pro charts your scored warmups and songs note by note</ProInlineNudge>
        </div>
      )}
    </Card>
  );
}

export function StudioClient() {
  const [elapsed, setElapsed] = useState(0);
  const [toast, setToast] = useState<StudioResult | null>(null);
  const [targetMidi, setTargetMidi] = useState<number | null>(null);
  // Keeps short stretches until they clear the logging floor, while hidden
  // intervals contribute nothing. The monotonic clock also ignores wall-clock
  // corrections during a session.
  const [practiceClock] = useState(() => createPracticeClock());
  // Owned here rather than inside TargetPractice: stopping the mic unmounts
  // that component, and the session it scored is logged after it is gone.
  const statsRef = useRef<TargetStats>(emptyTargetStats());
  /** Time a note was heard since the last logged session (finishStudioSession). */
  const heardMsRef = useRef(0);
  /**
   * Why the tuner shows a dash: the pitch meter's too-quiet and no-sound
   * hints (components/range/pitch-meter-hint), on its rule, so a dead or
   * muted mic is named instead of a bar that never fills.
   */
  const inputRef = useRef(freshInputHint());
  const lastTRef = useRef(0);
  const hintRef = useRef<string | null>(null);
  const [hint, setHint] = useState<string | null>(null);
  /** Whether the Stop card's next step is the range test, read as the mic starts. */
  const retestRule = useRangeRetestRule();
  const { readRetestRule } = retestRule;

  const finishSession = useCallback(
    (): StudioResult | null =>
      finishStudioSession({ clock: practiceClock, stats: statsRef, heardMs: heardMsRef }),
    [practiceClock],
  );

  /**
   * Close out the session and show the singer what it logged, or why it did
   * not. A short session that heard a note and kept its seconds banked
   * (carriesOver, with time on the clock) gets the card too, even with no
   * lock: its Sing again is what carries those seconds into the next
   * session. Without the card a tuner-only 30 s stop showed nothing, and the
   * next start threw the 30 s away. A Stop pressed a moment after Start
   * banks nothing (the clock is reset) and still shows nothing.
   */
  const closeSession = useCallback(() => {
    const result = finishSession();
    if (
      result &&
      (result.log ||
        result.locks > 0 ||
        result.silent ||
        (carriesOver(result) && practiceClock.elapsedMs() > 0))
    ) {
      setToast(result);
    }
  }, [finishSession, practiceClock]);

  // A microphone that goes away mid-session (unplugged, a headset dropped)
  // stops the room with its error showing, and the session closes the way
  // Stop closes it: the clock used to go on counting dead-mic time as
  // practice. usePitch calls this only for that, never for its own brief stop
  // while the device picker reopens the stream, which must not cut a session
  // in two and reset the timer.
  const pitch = usePitch({ onMicEnded: closeSession });
  const { frame, latest, listening, error, start, stop, subscribe } = pitch;

  // Every analysed frame: the time a note was heard, and the live hint.
  useEffect(() => {
    if (!listening) return;
    return subscribe((_samples, _sampleRate, f) => {
      const dt = lastTRef.current ? Math.min(120, f.t - lastTRef.current) : 0;
      lastTRef.current = f.t;
      if (dt <= 0) return;
      const voiced = f.note !== null;
      if (voiced) heardMsRef.current += dt;
      nextInputHint(inputRef.current, f, dt, voiced, HINT_MIN_VOLUME);
      const next = meterInputHint(inputRef.current);
      if (hintRef.current !== next) {
        hintRef.current = next;
        setHint(next);
      }
    });
  }, [listening, subscribe]);

  // Session timer while listening.
  useEffect(() => {
    if (!listening) return;
    const id = window.setInterval(() => {
      setElapsed(Math.floor(practiceClock.elapsedMs() / 1000));
    }, 1000);
    return () => window.clearInterval(id);
  }, [listening, practiceClock]);

  const handleStart = async () => {
    readRetestRule();
    const ok = await start();
    if (ok) {
      // A short, unlogged stop keeps its seconds and locks, as its card promises.
      const carry = carriesOver(toast);
      if (!carry) {
        practiceClock.reset();
        statsRef.current = emptyTargetStats();
        heardMsRef.current = 0;
      }
      if (document.visibilityState !== "hidden") practiceClock.resume();
      inputRef.current = freshInputHint();
      lastTRef.current = 0;
      hintRef.current = null;
      setHint(null);
      setElapsed(carry ? Math.floor(practiceClock.elapsedMs() / 1000) : 0);
      setToast(null);
    }
  };

  const handleStop = () => {
    stop();
    closeSession();
  };

  // Flush at the last reliable mobile lifecycle event, but leave the clock
  // paused throughout the absence. Only returning to a visible page while
  // the mic is still on begins another stretch.
  useFlushOnExit(finishSession);
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
    };
  }, [listening, practiceClock]);

  // The gate's button is gone once the mic opens, and focus fell to <body>
  // with it. Stop, in the page header, is the room's live control
  // (lib/audio/mic-focus.ts).
  const stopRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (listening) focusIfDropped(stopRef.current?.querySelector("button"));
  }, [listening]);

  const note = frame.note;
  // The same zones as the pitch meter on /range. These cents are measured to
  // the nearest note, so they never pass ±50: anything not in tune used to
  // read as a red "Sharp" while target practice, scoring to ±50 against its
  // own target, showed the same note green.
  const zone = note ? tuneZone(note.cents) : null;
  const inTune = zone === "in-tune";

  return (
    <PageShell
      kicker="Studio"
      title="Pitch training studio"
      subtitle="This pitch training studio shows singers, in real time, the note they are singing, how many cents sharp or flat it is, and an eight-second trace. It is free with no time limit, and your audio is analyzed on this device."
      actions={
        listening ? (
          <div className="flex flex-col items-end gap-1.5">
            <div ref={stopRef} className="flex items-center gap-2">
              <Pill tone="rec">
                <span className="h-1.5 w-1.5 animate-recblink rounded-full bg-rec" />
                <span className="tabular font-mono">{fmtTime(elapsed)}</span>
              </Pill>
              <Button variant="outline" onClick={handleStop}>
                Stop mic
              </Button>
            </div>
            <p className="text-[11px] text-dim">
              Sessions under {MIN_LOG_SEC} seconds aren&rsquo;t logged.
            </p>
          </div>
        ) : undefined
      }
    >
      {/* The running program's next range test or Recovery week, read only
          when the retest rule needs it (useRangeRetestRule). */}
      {retestRule.probe}
      {toast && (
        <StudioLastSession
          result={toast}
          elapsedSec={elapsed}
          retestDue={retestRule.offerRetest}
          programNote={retestRule.programNote}
          programDayHref={retestRule.programDayHref}
        />
      )}

      {!listening ? (
        <>
          <MicGate
            title="See your pitch live"
            description="Sing any note to see its name, how far off center it is, and its trace."
            enableLabel={toast ? "Sing again" : "Enable microphone"}
            onEnable={handleStart}
            error={error}
            footer={
              <>
                <AudioSetup className="text-left" />
                {/* After Stop the Last session card makes the one ask. */}
                {!toast && <ProWhisper className="mt-4" />}
              </>
            }
          />

          {/* The room's instrument before the browser prompt: the trace the
              gate describes. Below the gate, as on the /range pitch meter, so
              Enable microphone and any mic error stay on a 375x667 phone's
              first screen. */}
          {!toast && (
            <FigureFrame className="mx-auto mt-8 max-w-2xl" caption="What the trace draws once the mic is on">
              <TraceFigure />
            </FigureFrame>
          )}

          {/* Under the gate, so the room is legible before the prompt without competing with it. */}
          <div className="mx-auto mt-8 max-w-2xl">
            <SectionLabel>{PARTS_LABEL}</SectionLabel>
            {/* Named: SectionLabel is a decorative span, so the list otherwise announces as "list, 4 items". */}
            <ul
              aria-label={PARTS_LABEL}
              className="mt-4 grid gap-3 sm:grid-cols-2"
            >
              {STUDIO_PARTS.map(({ name, desc }) => (
                <li
                  key={name}
                  className="rounded-xl border border-line bg-panel2 p-4"
                >
                  <h3 className="font-mono text-[11px] font-normal uppercase tracking-[0.14em] text-violet-ink">
                    {name}
                  </h3>
                  <p className="mt-2 text-sm text-mut">{desc}</p>
                </li>
              ))}
            </ul>
            <p className="mt-4 text-xs text-dim">
              Practice logs to your XP once a session reaches {MIN_LOG_SEC}{" "}
              seconds.
            </p>
          </div>
        </>
      ) : (
        <>
          <div className="grid gap-4 lg:grid-cols-[380px_minmax(0,1fr)]">
            <Card>
              <div className="flex items-center justify-between">
                <SectionLabel>Tuner</SectionLabel>
                {note &&
                  (inTune ? (
                    <Pill tone="ok">In tune</Pill>
                  ) : zone === "close" ? (
                    <Pill tone="violet">
                      {note.cents > 0 ? "A little sharp" : "A little flat"}
                    </Pill>
                  ) : (
                    <Pill tone="rec">{note.cents > 0 ? "Sharp" : "Flat"}</Pill>
                  ))}
              </div>
              <div className="mt-4 text-center">
                <div
                  className={`font-mono text-5xl sm:text-6xl tabular tracking-tight ${
                    note ? (inTune ? "text-ok-ink" : "text-ink") : "text-dim"
                  }`}
                >
                  {note ? note.label : "--"}
                </div>
                <div className="tabular mt-2 font-mono text-sm text-mut">
                  {frame.freq !== null
                    ? `${frame.freq.toFixed(1)} Hz`
                    : "listening"}
                  {" · "}
                  {note
                    ? `${note.cents > 0 ? "+" : ""}${note.cents} cents`
                    : "no note"}
                </div>
              </div>
              <CentsGauge cents={note ? note.cents : null} />
              <div className="mt-5">
                <LevelMeter volume={frame.volume} />
              </div>
              {/* What the mic hears, and why the note reads "--" when it
                  cannot measure: the pitch meter's hint, shared. */}
              <div role="status">
                {hint && <p className="mt-2 text-sm text-mut">{hint}</p>}
              </div>
            </Card>

            <Card className="flex min-h-[320px] flex-col">
              <div className="flex items-center justify-between">
                <SectionLabel>Pitch trace</SectionLabel>
                <span className="font-mono text-[11px] text-dim">last 8 s</span>
              </div>
              <PitchTrace
                latest={latest}
                targetMidi={targetMidi}
                className="mt-4 w-full grow rounded-lg"
              />
            </Card>
          </div>

          <TargetPractice
            className="mt-4"
            frame={frame}
            latest={latest}
            listening={listening}
            targetMidi={targetMidi}
            onTargetChange={setTargetMidi}
            stats={statsRef}
          />
        </>
      )}
    </PageShell>
  );
}
