"use client";

import { useFreeCap } from "@/lib/free-cap";
import { CapWall } from "@/components/practice/free-cap";

import { useEffect, useState } from "react";
import { usePitch } from "@/lib/audio/use-pitch";
import { localDay, todayPracticeSec, useProgress } from "@/lib/progress";
import { Button, Card, PageShell } from "@/components/ui";
import { ProWhisper } from "@/components/pro/gate";
import { MicAlert } from "@/components/mic-alert";
import { AudioSetup } from "@/components/audio/audio-setup";
import { ContinueCard, useDailyGoal } from "@/components/practice/learn-home";
import { IconMic } from "./icons";
import { ALL_EXERCISES, EXERCISES, type WarmupExercise } from "./exercises";
import { getProState } from "@/lib/pro";
import { ExercisePlayer } from "./exercise-player";
import { SessionSummary } from "./session-summary";
import { RoutineRunner, type RoutineSummaryData } from "./routine-runner";
import { RoutineSummary } from "./routine-summary";
import { PathSection, RoutineGrid, RoutineMeta, routineStats } from "./routine-home";
import { recommendRoutine, routineById, stepExercise, type Routine } from "./routines";
import type { SessionSummaryData } from "./lib";

type View = "home" | "session" | "summary" | "routine" | "routine-summary";

/**
 * Whether this exercise may be started at all. Membership in EXERCISES is the
 * paywall; everything inside a pack needs an active Pro entitlement. Every
 * entry point that isn't a path row — a deep link, a "next exercise", the
 * results screen's Practice button — routes through here, so none of them can
 * become the one that leaks a pack.
 */
function canStart(ex: WarmupExercise): boolean {
  if (EXERCISES.some((e) => e.id === ex.id)) return true;
  return getProState().active;
}

/** Same gate for a whole routine: a Pro routine is Pro exercises end to end. */
function canStartRoutine(r: Routine): boolean {
  return !r.pro || getProState().active;
}

/** Where a mic failure has to be shown: the one control the singer pressed. */
type ErrorAt =
  | { kind: "gate" }
  | { kind: "today" }
  | { kind: "routine"; id: string }
  | { kind: "exercise"; id: string };

export function WarmupsClient() {
  const pitch = usePitch();
  const progress = useProgress();
  // Three free minutes of guided practice a day; every way into a session
  // checks it, so a capped singer sees the wall rather than a mic prompt.
  const cap = useFreeCap();
  const { goalSec } = useDailyGoal();

  const [view, setView] = useState<View>("home");
  const [activeEx, setActiveEx] = useState<WarmupExercise | null>(null);
  const [summary, setSummary] = useState<SessionSummaryData | null>(null);
  const [activeRoutine, setActiveRoutine] = useState<Routine | null>(null);
  const [routineSummary, setRoutineSummary] = useState<RoutineSummaryData | null>(null);

  // The coach links here as /warmups?exercise=<id> and the routine cards
  // elsewhere as /warmups?routine=<id>, so a singer arrives on the thing that
  // was picked for them, not on the room's front page. Read from the URL after
  // mount rather than with useSearchParams: that hook needs a Suspense boundary
  // in app/warmups/page.tsx, and the boundary would blank this page's
  // prerendered heading and copy — the same trade the singers directory
  // documents. `undefined` means the URL hasn't been read yet.
  const [deepLink, setDeepLink] = useState<
    { exercise: string | null; routine: string | null } | undefined
  >(undefined);
  // The local hour, for "today's warmup". The server has no idea what time it
  // is where the singer sits, so it renders the daily routine and the
  // client corrects it once — the same shape as the deep-link read above.
  const [hour, setHour] = useState<number | null>(null);
  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    /* eslint-disable react-hooks/set-state-in-effect */
    setDeepLink({ exercise: q.get("exercise"), routine: q.get("routine") });
    setHour(new Date().getHours());
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  const practicedToday = progress.sessions.some((s) => s.day === localDay());
  const recommended = recommendRoutine({ practicedToday, hour: hour ?? 12 });

  function startExercise(ex: WarmupExercise) {
    if (cap.capped) return;
    setActiveEx(ex);
    setSummary(null);
    setView("session");
  }

  function startExerciseById(id: string) {
    const ex = ALL_EXERCISES.find((e) => e.id === id);
    // Defense in depth: pack exercises never start for free users.
    if (!ex || !canStart(ex)) return;
    startExercise(ex);
  }

  function startRoutine(r: Routine) {
    if (!canStartRoutine(r) || cap.capped) return;
    setActiveRoutine(r);
    setRoutineSummary(null);
    setView("routine");
  }

  // What a cold visitor picked while the mic was still off, held until
  // permission lands. Without it their choice is thrown away by the prompt.
  const [pending, setPending] = useState<
    { kind: "exercise"; ex: WarmupExercise } | { kind: "routine"; routine: Routine } | null
  >(null);

  // Where the next mic failure has to appear. The room is long — a card near
  // the bottom used to ask for the mic and print the refusal most of a page
  // above the fold — so exactly one MicAlert is rendered, in whichever place
  // the singer was actually looking.
  const [errorAt, setErrorAt] = useState<ErrorAt>({ kind: "gate" });

  async function selectExercise(ex: WarmupExercise) {
    if (cap.capped) return;
    if (pitch.listening) {
      startExercise(ex);
      return;
    }
    setPending({ kind: "exercise", ex });
    setErrorAt({ kind: "exercise", id: ex.id });
    const ok = await pitch.start();
    if (!ok) setPending(null);
  }

  async function selectRoutine(r: Routine, from: "today" | "grid") {
    if (!canStartRoutine(r) || cap.capped) return;
    if (pitch.listening) {
      startRoutine(r);
      return;
    }
    setPending({ kind: "routine", routine: r });
    setErrorAt(from === "today" ? { kind: "today" } : { kind: "routine", id: r.id });
    const ok = await pitch.start();
    if (!ok) setPending(null);
  }

  // The gate card's button, which is its own place on screen. Set before the
  // await, but nothing renders during it: start() clears the error first.
  function startFromGate() {
    setErrorAt({ kind: "gate" });
    void pitch.start();
  }

  const deepLinkEx = deepLink?.exercise
    ? (ALL_EXERCISES.find((e) => e.id === deepLink.exercise) ?? null)
    : null;
  const deepLinkRoutine = routineById(deepLink?.routine);

  // Consumed once, and only after the mic gate clears, so the singer still
  // gets asked for a microphone first and lands on the requested thing after.
  // A routine link outranks an exercise link when both are present. Adjusted
  // during render rather than in an effect, per
  // https://react.dev/learn/you-might-not-need-an-effect#adjusting-some-state-when-a-prop-changes
  const [deepLinkDone, setDeepLinkDone] = useState(false);
  if (!deepLinkDone && deepLink !== undefined && pitch.listening) {
    setDeepLinkDone(true);
    if (deepLinkRoutine && canStartRoutine(deepLinkRoutine)) {
      setActiveRoutine(deepLinkRoutine);
      setRoutineSummary(null);
      setView("routine");
    } else if (deepLinkEx && canStart(deepLinkEx)) {
      setActiveEx(deepLinkEx);
      setSummary(null);
      setView("session");
    }
  }

  const pendingDeepLinkEx =
    !deepLinkDone && deepLinkEx && canStart(deepLinkEx) ? deepLinkEx : null;
  const pendingDeepLinkRoutine =
    !deepLinkDone && deepLinkRoutine && canStartRoutine(deepLinkRoutine)
      ? deepLinkRoutine
      : null;

  // Resolved after the deep link, not before it: both land in the same render
  // when permission arrives, and whoever writes the view last wins. A visitor
  // who pressed a specific card asked for that card, so their pick has to
  // outrank the link they happened to arrive on.
  if (pending && pitch.listening) {
    const p = pending;
    setPending(null);
    if (p.kind === "exercise" && canStart(p.ex)) startExercise(p.ex);
    if (p.kind === "routine" && canStartRoutine(p.routine)) startRoutine(p.routine);
  }

  const gateTitle = pendingDeepLinkRoutine
    ? `Turn on your mic to start “${pendingDeepLinkRoutine.name}”`
    : pendingDeepLinkEx
      ? `Turn on your mic to start “${pendingDeepLinkEx.title}”`
      : "How a warmup works here";

  return (
    <PageShell
      kicker="Warmups"
      // Every other view runs inside the full-screen session surface, which
      // covers this heading entirely — only the summary of a single exercise
      // still renders as a page under it.
      title={view === "summary" ? "Session summary" : "Guided vocal warmups"}
      subtitle={
        view === "home"
          ? pitch.listening
            ? "Start today's warmup, or pick a length. Every exercise is scored as you sing."
            : "Pick a warmup. The mic comes on when you press start, and nothing leaves this device."
          : undefined
      }
    >
      {view === "home" && (
        <div className="space-y-8">
          {cap.capped && <CapWall cap={cap} />}
          <ContinueCard
            kicker="Today's warmup"
            title={recommended.name}
            tagline={recommended.tagline}
            meta={<RoutineMeta routine={recommended} />}
            stepTitles={recommended.steps.map((s) => stepExercise(s).title)}
            stars={routineStats(progress, recommended).stars}
            goal={{ doneSec: todayPracticeSec(progress), goalSec }}
            streakDays={progress.streak.current}
            micReady={pitch.listening}
            startLabel={pitch.listening ? "Start warmup" : "Enable mic and start"}
            error={errorAt.kind === "today" ? pitch.error : null}
            onStart={() => void selectRoutine(recommended, "today")}
          >
            <p className="text-xs text-dim sm:text-right">
              Each exercise starts itself. Just sing when it says your turn.
            </p>
          </ContinueCard>

          {/*
            The mic card used to be returned INSTEAD of this page, so a first-time
            visitor could not read a single exercise title before granting
            permission. /range already solved this: explain the loop, then ask.
          */}
          {!pitch.listening && (
            <Card>
              <h2 className="text-xl">{gateTitle}</h2>
              <ol className="mt-3 max-w-xl list-decimal space-y-2 pl-5 text-sm text-mut">
                <li>
                  Each exercise plays its pattern once, counts you in with two
                  beats, then scores your pitch as you sing it back with the
                  guide underneath you.
                </li>
                <li>
                  The key climbs a semitone every rep. After the set number of
                  reps the next exercise introduces itself and starts on its
                  own — you never have to pick what comes next.
                </li>
                <li>
                  At the end you get one summary: score, stars, XP, and the
                  streak you just kept alive.
                </li>
              </ol>
              {/* The id the path rows point their aria-describedby at, so a
                  screen reader user hears that a row asks for the microphone
                  before they press it. It only exists while the gate does,
                  which is exactly while the rows set that attribute. */}
              <p id="practice-mic-note" className="mt-3 max-w-xl text-sm text-dim">
                Scoring needs your microphone. Audio is read and analyzed in this
                browser and never leaves your device.
              </p>
              <p className="mt-2 max-w-xl text-sm text-rec">
                Sing at a comfortable volume. Stop if a note causes pain or strain.
              </p>
              <div className="mt-5">
                <Button variant="rec" size="lg" onClick={startFromGate}>
                  <IconMic /> Enable microphone
                </Button>
              </div>
              {pitch.error && errorAt.kind === "gate" && (
                <MicAlert
                  message={pitch.error}
                  className="mt-4 max-w-md text-sm text-rec"
                />
              )}
              <AudioSetup className="mt-6 max-w-xl" />
              <ProWhisper className="mt-4" />
            </Card>
          )}

          <RoutineGrid
            progress={progress}
            onStart={(r) => void selectRoutine(r, "grid")}
            error={errorAt.kind === "routine" ? pitch.error : null}
            errorRoutineId={errorAt.kind === "routine" ? errorAt.id : null}
          />

          <PathSection
            progress={progress}
            onSelect={selectExercise}
            micReady={pitch.listening}
            error={errorAt.kind === "exercise" ? pitch.error : null}
            errorExerciseId={errorAt.kind === "exercise" ? errorAt.id : null}
          />
        </div>
      )}

      {view === "routine" && activeRoutine && (
        <RoutineRunner
          capped={cap.capped}
          routine={activeRoutine}
          pitch={pitch}
          range={progress.range}
          onDone={(data) => {
            setRoutineSummary(data);
            setView("routine-summary");
          }}
          onQuit={() => setView("home")}
        />
      )}

      {view === "routine-summary" && routineSummary && (
        <RoutineSummary
          data={routineSummary}
          onRepeat={() => startRoutine(routineSummary.routine)}
          onHome={() => setView("home")}
          onPractice={startExerciseById}
        />
      )}

      {view === "session" && activeEx && (
        <ExercisePlayer
          ex={activeEx}
          pitch={pitch}
          range={progress.range}
          variant="session"
          onFinish={(data) => {
            setSummary(data);
            setView("summary");
          }}
          onExit={() => setView("home")}
        />
      )}

      {view === "summary" && summary && (
        <SessionSummary
          data={summary}
          onNext={startExerciseById}
          onLibrary={() => setView("home")}
        />
      )}
    </PageShell>
  );
}
