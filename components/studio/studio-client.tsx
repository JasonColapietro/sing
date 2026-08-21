"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePitch } from "@/lib/audio/use-pitch";
import { logSession, type LogResult } from "@/lib/progress";
import { useFlushOnExit } from "@/lib/use-flush-on-exit";
import { ProInlineNudge, ProWhisper } from "@/components/pro/gate";
import { MicAlert } from "@/components/mic-alert";
import { Button, Card, PageShell, Pill, SectionLabel } from "@/components/ui";
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
interface StudioResult {
  /** Null when the session ran under MIN_LOG_SEC — nothing was written. */
  log: LogResult | null;
  locks: number;
  newBest: boolean;
}

function fmtTime(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

/** Tape label above the parts list, and the accessible name of that list. */
const PARTS_LABEL = "Inside the studio";

/**
 * The four surfaces this room actually has. The mic card names all four in a
 * single sentence, which is enough to sell the tuner and not enough to explain
 * the rest: the in-tune window, what the trace is good for, and the fact that
 * target practice keeps a record at all were only discoverable after the
 * browser prompt. One line each, before the prompt instead of after it.
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
    desc: "Pick a note and hold it in tune until it locks. Locks in a row build a run, and your best session is kept on this device.",
  },
] as const;

function MicIcon() {
  return (
    <svg
      width="28"
      height="28"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="9" y="2.5" width="6" height="11" rx="3" />
      <path d="M5.5 11a6.5 6.5 0 0 0 13 0" />
      <path d="M12 17.5V21M8.5 21h7" />
    </svg>
  );
}

export function StudioClient() {
  const { frame, latest, listening, error, start, stop } = usePitch();
  const [elapsed, setElapsed] = useState(0);
  const [toast, setToast] = useState<StudioResult | null>(null);
  const [targetMidi, setTargetMidi] = useState<number | null>(null);
  const startedAtRef = useRef<number | null>(null);
  // Seconds already sung this session that were too short to log on their own.
  // A phone that hides the page every time the screen locks flushes below the
  // floor over and over; without this, each of those stretches would be thrown
  // away and a long interrupted practice would log nothing at all.
  const carriedSecRef = useRef(0);
  // Owned here rather than inside TargetPractice: stopping the mic unmounts
  // that component, and the session it scored is logged after it is gone.
  const statsRef = useRef<TargetStats>(emptyTargetStats());

  // Session timer while listening.
  useEffect(() => {
    if (!listening) return;
    const id = window.setInterval(() => {
      if (startedAtRef.current !== null) {
        setElapsed(
          carriedSecRef.current +
            Math.floor((Date.now() - startedAtRef.current) / 1000),
        );
      }
    }, 1000);
    return () => window.clearInterval(id);
  }, [listening]);

  const handleStart = async () => {
    const ok = await start();
    if (ok) {
      startedAtRef.current = Date.now();
      carriedSecRef.current = 0;
      statsRef.current = emptyTargetStats();
      setElapsed(0);
      setToast(null);
    }
  };

  /**
   * Close out the session: bank the personal best and log the practice if it
   * ran long enough. Idempotent — `startedAtRef` is nulled first, so every
   * later call falls straight out. That is what makes it safe to fire from
   * the stop button, from unmount, and from the page going away.
   */
  const finishSession = useCallback((): StudioResult | null => {
    const startedAt = startedAtRef.current;
    startedAtRef.current = null;
    if (startedAt === null) return null;

    const { hits, scoredMs, inTuneMs } = statsRef.current;
    // Banked before the duration floor: a short session that locked notes
    // still earned the best it set.
    const newBest = hits > 0 && saveStudioBest(hits);

    const durationSec =
      carriedSecRef.current + Math.floor((Date.now() - startedAt) / 1000);
    if (durationSec < MIN_LOG_SEC) {
      // Nothing was logged, so nothing is thrown away either: the seconds and
      // the locks stay banked for the next flush, and the singer interrupted
      // twice still logs the practice they actually did.
      carriedSecRef.current = durationSec;
      return { log: null, locks: hits, newBest };
    }

    carriedSecRef.current = 0;
    statsRef.current = emptyTargetStats();
    return {
      log: logSession({
        type: "pitch",
        durationSec,
        detail:
          hits > 0
            ? `Studio — ${hits} lock${hits === 1 ? "" : "s"}`
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
  }, []);

  const handleStop = () => {
    stop();
    const result = finishSession();
    if (result && (result.log || result.locks > 0)) setToast(result);
  };

  // Unmount alone loses the session: a closed tab, a closed laptop, and a
  // swiped-away PWA never fire it. Backgrounding also fires here and usually
  // isn't the end of anything, so the clock picks up again when the mic is
  // still on — either from zero because the first stretch banked a log, or
  // from carriedSecRef because it was too short to.
  const flushOnExit = useCallback(() => {
    if (finishSession() && listening) startedAtRef.current = Date.now();
  }, [finishSession, listening]);
  useFlushOnExit(flushOnExit);

  const note = frame.note;
  const inTune = note !== null && Math.abs(note.cents) <= 15;

  return (
    <PageShell
      kicker="Studio"
      title="Pitch studio"
      subtitle="Sing into the mic and watch every note land — name, cents, and an eight-second trace."
      actions={
        listening ? (
          <div className="flex flex-col items-end gap-1.5">
            <div className="flex items-center gap-2">
              <Pill tone="rec">
                <span className="h-1.5 w-1.5 animate-recblink rounded-full bg-rec" />
                <span className="tabular font-mono">{fmtTime(elapsed)}</span>
              </Pill>
              <Button variant="outline" onClick={handleStop}>
                Stop
              </Button>
            </div>
            <p className="text-[11px] text-dim">
              Sessions under {MIN_LOG_SEC} seconds aren&rsquo;t logged.
            </p>
          </div>
        ) : undefined
      }
    >
      {toast && (
        <Card className="mb-6 border-amber/40 bg-panel2">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3">
              {toast.log ? (
                <>
                  <span className="tabular font-mono text-xl text-amber-ink">
                    +{toast.log.xpGained} XP
                  </span>
                  <span className="text-sm text-mut">Session saved.</span>
                </>
              ) : (
                <span className="text-sm text-mut">
                  That one ran under {MIN_LOG_SEC} seconds, so it wasn&rsquo;t
                  logged.
                </span>
              )}
              {toast.locks > 0 && (
                <Pill tone={toast.newBest ? "ok" : "amber"}>
                  <span className="tabular font-mono">{toast.locks}</span>
                  {toast.newBest ? " locked · new personal best" : " locked"}
                </Pill>
              )}
              {toast.log?.newAchievements.map((a) => (
                <Pill key={a.id} tone="ok">
                  {a.icon} {a.title}
                </Pill>
              ))}
            </div>
            <Button variant="ghost" size="sm" onClick={() => setToast(null)}>
              Dismiss
            </Button>
          </div>
          <div className="mt-2">
            <ProInlineNudge>
              Pro keeps a per-note report of this session
            </ProInlineNudge>
          </div>
        </Card>
      )}

      {!listening ? (
        <>
          <Card className="mx-auto max-w-2xl py-10 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-line2 bg-panel2 text-amber-ink">
              <MicIcon />
            </div>
            <h2 className="mt-5 text-2xl">The voice oscilloscope</h2>
            <p className="mx-auto mt-2 max-w-md text-mut">
              Sing or hum any note and watch it land on the dial in real time —
              note name, cents sharp or flat, and a scrolling trace of your last
              eight seconds. Pick a target note to practice locking your pitch.
            </p>
            <p className="mt-2 text-xs text-dim">
              Audio is analyzed on this device and never uploaded.
            </p>
            <Button
              variant="rec"
              size="lg"
              className="mt-6"
              onClick={handleStart}
            >
              Enable microphone
            </Button>
            {/* This card is the only control on the page, so the message has
                always been where the singer was looking. It was a plain <p>
                though, which meant a refused mic was silent to anyone using a
                screen reader. */}
            {error && (
              <MicAlert message={error} className="mt-4 text-sm text-rec" />
            )}
            <ProWhisper className="mt-4" />
          </Card>

          {/*
           * The card above is the only button on this page and it stays that
           * way. This block sits under it so the room is legible before the
           * browser prompt, not so it competes with the prompt.
           */}
          <div className="mx-auto mt-8 max-w-2xl">
            <SectionLabel>{PARTS_LABEL}</SectionLabel>
            {/*
             * SectionLabel is a decorative span, not a heading, so without an
             * explicit name this list announces as "list, 4 items" with no clue
             * what it lists. Naming the list beats promoting the tape to a
             * heading, which would put a second h2 on the page.
             */}
            <ul
              aria-label={PARTS_LABEL}
              className="mt-4 grid gap-3 sm:grid-cols-2"
            >
              {STUDIO_PARTS.map(({ name, desc }) => (
                <li
                  key={name}
                  className="rounded-xl border border-line bg-panel2 p-4"
                >
                  <h3 className="font-mono text-[11px] uppercase tracking-[0.14em] text-amber-ink">
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
                  ) : (
                    <Pill tone="amber">{note.cents > 0 ? "Sharp" : "Flat"}</Pill>
                  ))}
              </div>
              <div className="mt-4 text-center">
                <div
                  className={`tabular font-mono text-7xl tracking-tight ${
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
