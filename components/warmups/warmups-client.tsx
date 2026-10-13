"use client";

import { formatClock, useFreeCap } from "@/lib/free-cap";
import { CapWall, FreeAllowance } from "@/components/practice/free-cap";
import { liveStreak } from "@/components/account/save-state";

import { useEffect, useMemo, useState } from "react";
import { usePitch } from "@/lib/audio/use-pitch";
import { localDay, useProgress } from "@/lib/progress";
import { Button, Card, PageShell } from "@/components/ui";
import { ProWhisper } from "@/components/pro/gate";
import { MicAlert } from "@/components/mic-alert";
import { AudioSetup } from "@/components/audio/audio-setup";
import { ContinueCard, useDailyGoal, useGoalDoneSec, nextUpId, starsForExercise } from "@/components/practice/learn-home";
import { IconMic } from "./icons";
import { ALL_EXERCISES, EXERCISES, PRO_PACKS, TIER_ORDER, type WarmupExercise } from "./exercises";
import { getProState, useIsPro, useProReady } from "@/lib/pro";
import { ExercisePlayer } from "./exercise-player";
import { SessionSummary } from "./session-summary";
import { RoutineRunner, type RoutineSummaryData } from "./routine-runner";
import { RoutineSummary } from "./routine-summary";
import { PathSection, RoutineGrid, RoutineMeta, routineStats } from "./routine-home";
import { recentWarmupResults, routineReason, routineSeconds, routineStartingTempo, recommendRoutine, routineById, sizeRoutineToAllowance, stepExercise, type Routine } from "./routines";
import type { SessionSummaryData } from "./lib";
import { DailyThreeCard, DailyThreeCardPlaceholder } from "./daily-three-card";
import { dailyTempoFor, dailyThreeDone, planDailyThree, type DailyPick, type DailyTempo } from "@/lib/daily-three";
import { ProgramEntryCard } from "@/components/programs/today-card";
import { useActiveProgram } from "@/components/programs/use-program";
import { programDayNeedsPro } from "@/components/practice/program-day";
import { prepaintMarker, useHydrated } from "@/components/prepaint";

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

/**
 * The rep count a `?reps=<n>` link asks for, or null for the endless walk.
 * Anything that is not a whole number from 1 to 30 is ignored rather than
 * clamped: a mangled link should open the ordinary exercise.
 */
export function linkedRepCount(raw: string | null | undefined): number | null {
  if (raw === null || raw === undefined || raw.trim() === "") return null;
  const n = Number(raw);
  return Number.isInteger(n) && n >= 1 && n <= 30 ? n : null;
}

/** Where a mic failure has to be shown: the one control the singer pressed. */
type ErrorAt =
  | { kind: "gate" }
  | { kind: "continue" }
  | { kind: "today" }
  | { kind: "routine"; id: string }
  | { kind: "exercise"; id: string }
  | { kind: "daily"; id: string };

export function WarmupsClient() {
  const pitch = usePitch();
  const progress = useProgress();
  const isPro = useIsPro();
  // Five free minutes of guided practice a day; every way into a session
  // checks it, so a capped singer sees the wall rather than a mic prompt.
  const cap = useFreeCap();
  const unavailableReason = cap.capped
    ? "Free practice is used for today. It resets at midnight; the free studio is still open."
    : undefined;
  const { goalSec } = useDailyGoal();
  // On free, the ring counts the guided minutes the goal is clamped to, not
  // time in the uncapped studio.
  const goalDoneSec = useGoalDoneSec(progress);
  // The stored count outlives a lapsed streak; only a live one is named.
  const streakDays = liveStreak(progress.streak);
  const activeProgram = useActiveProgram();
  const hydrated = useHydrated();

  const [view, setView] = useState<View>("home");
  const [activeEx, setActiveEx] = useState<WarmupExercise | null>(null);
  const [summary, setSummary] = useState<SessionSummaryData | null>(null);
  const [activeRoutine, setActiveRoutine] = useState<Routine | null>(null);
  // The step a `?routine=<id>&step=<n>` link opens on (0-based). A program
  // lists a routine's steps one by one for a singer the free plan stopped
  // between them; opening the routine there keeps the step's rep count.
  const [routineStartStep, setRoutineStartStep] = useState(0);
  const [routineSummary, setRoutineSummary] = useState<RoutineSummaryData | null>(null);
  // The tempo the running exercise starts at: 1x, or the step today's plan
  // chose for it.
  const [activeTempo, setActiveTempo] = useState<DailyTempo>(1);
  // A set rep count from a `?exercise=<id>&reps=<n>` link (a program row
  // sized to the free minutes): the exercise stops itself after n reps
  // instead of walking until End. Null for every other way in.
  const [activeReps, setActiveReps] = useState<number | null>(null);

  // The coach links here as /warmups?exercise=<id> and the routine cards
  // elsewhere as /warmups?routine=<id>, so a singer arrives on the thing that
  // was picked for them, not on the room's front page. Read from the URL after
  // mount rather than with useSearchParams: that hook needs a Suspense boundary
  // in app/warmups/page.tsx, and the boundary would blank this page's
  // prerendered heading and copy — the same trade the singers directory
  // documents. `undefined` means the URL hasn't been read yet.
  const [deepLink, setDeepLink] = useState<
    | { exercise: string | null; routine: string | null; step: string | null; reps: string | null }
    | undefined
  >(undefined);
  // The local hour, for "today's warmup". The server has no idea what time it
  // is where the singer sits, so it renders the daily routine and the
  // client corrects it once — the same shape as the deep-link read above.
  const [hour, setHour] = useState<number | null>(null);
  // The local day seeds today's three, read after mount for the same reason.
  const [today, setToday] = useState<string | null>(null);
  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    /* eslint-disable react-hooks/set-state-in-effect */
    setDeepLink({
      exercise: q.get("exercise"),
      routine: q.get("routine"),
      step: q.get("step"),
      reps: q.get("reps"),
    });
    setHour(new Date().getHours());
    setToday(localDay());
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  // A page left open across midnight must move to the new day: today's three
  // is seeded by the date and ticked off by today's sessions, and the hour
  // picks today's warmup. Re-read both when the tab comes back and once a
  // minute; the setters bail out when nothing changed, so this costs no
  // renders on an ordinary day.
  useEffect(() => {
    const refresh = () => {
      setToday(localDay());
      setHour(new Date().getHours());
    };
    const onVisibility = () => {
      if (document.visibilityState === "visible") refresh();
    };
    document.addEventListener("visibilitychange", onVisibility);
    const id = window.setInterval(refresh, 60_000);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.clearInterval(id);
    };
  }, []);

  const practicedToday = progress.sessions.some((s) => s.day === localDay());
  const routineContext = { practicedToday, hour: hour ?? 12, recent: recentWarmupResults(progress.sessions) };
  // A free singer's guided session has to be one they can finish. The daily
  // and full sets run past the five free minutes, so a first session would end
  // on the cap slide halfway through; when the pick does not fit what is left
  // today, the shorter morning set takes its place, if that fits.
  const preferred = recommendRoutine(routineContext);
  const recommended = cap.capped ? preferred : sizeRoutineToAllowance(preferred, cap.leftSec);
  const sizedToAllowance = recommended !== preferred;
  // The prerender has no entitlement, so it always sizes for free. Until the
  // entitlement is read the line holds its place without naming free minutes:
  // a Pro singer would otherwise be told about a limit they paid to remove.
  const proReady = useProReady();
  // When nothing shorter fits what is left today, the pick stands, but the
  // card says where it will stop rather than calling a longer set "short":
  // the cap is checked between steps, so the step under way always finishes.
  const overAllowance =
    proReady && !cap.isPro && !cap.capped && routineSeconds(recommended) > cap.leftSec;
  const recommendedReason = sizedToAllowance
    ? !proReady
      ? " "
      : cap.usedSec <= 0
        ? `Fits in today's ${Math.round(cap.capSec / 60)} free minutes.`
        : `Fits in the ${formatClock(cap.leftSec)} of free practice left today.`
    : overAllowance
      ? `${formatClock(cap.leftSec)} of free practice left today: this set stops after the step that uses it up.`
      : routineReason(routineContext);
  const pathExercises = isPro ? ALL_EXERCISES : EXERCISES;
  const pathItem = (e: WarmupExercise) => ({ id: e.id, title: e.title, stars: starsForExercise(progress, e.title) });
  const nextId = nextUpId([
    ...TIER_ORDER.map((tier) => ({ title: tier, items: EXERCISES.filter((e) => e.tier === tier).map(pathItem) })),
    ...(isPro ? PRO_PACKS.map((pack) => ({ title: pack.name, items: pack.exercises.map(pathItem) })) : []),
  ]);
  const nextExercise = pathExercises.find((e) => e.id === nextId);
  // Planned from the free catalogue whatever the viewer's plan, and from
  // sessions before today, so it holds still all day.
  const dailyPlan = useMemo(
    () => (today ? planDailyThree({ sessions: progress.sessions, day: today }) : null),
    [progress.sessions, today],
  );
  const dailyDone = dailyPlan ? dailyThreeDone(dailyPlan, progress.sessions) : [];

  function startExercise(ex: WarmupExercise, tempo: DailyTempo = 1) {
    if (cap.capped) return;
    setActiveEx(ex);
    setActiveTempo(tempo);
    setActiveReps(null);
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
    setRoutineStartStep(0);
    setRoutineSummary(null);
    setView("routine");
  }

  // What a cold visitor picked while the mic was still off, held until
  // permission lands. Without it their choice is thrown away by the prompt.
  const [pending, setPending] = useState<
    | { kind: "exercise"; ex: WarmupExercise; tempo?: DailyTempo }
    | { kind: "routine"; routine: Routine }
    | null
  >(null);

  // Where the next mic failure has to appear. The room is long — a card near
  // the bottom used to ask for the mic and print the refusal most of a page
  // above the fold — so exactly one MicAlert is rendered, in whichever place
  // the singer was actually looking.
  const [errorAt, setErrorAt] = useState<ErrorAt>({ kind: "gate" });

  async function selectExercise(ex: WarmupExercise, from: "path" | "continue" = "path") {
    if (cap.capped) return;
    if (pitch.listening) {
      startExercise(ex);
      return;
    }
    setPending({ kind: "exercise", ex });
    // The next exercise also appears in the catalogue. Its two controls need
    // separate error destinations so only the pressed one announces and scrolls.
    setErrorAt(from === "continue" ? { kind: "continue" } : { kind: "exercise", id: ex.id });
    const ok = await pitch.start();
    if (!ok) setPending(null);
  }

  /** A row in today's three: the exercise at the tempo the plan set for it. */
  async function selectDailyPick(p: DailyPick) {
    if (cap.capped || !canStart(p.exercise)) return;
    if (pitch.listening) {
      startExercise(p.exercise, p.tempo);
      return;
    }
    setPending({ kind: "exercise", ex: p.exercise, tempo: p.tempo });
    setErrorAt({ kind: "daily", id: p.exercise.id });
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
    if (cap.capped) return;
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
  if (!deepLinkDone && deepLink !== undefined && pitch.listening && !cap.capped) {
    setDeepLinkDone(true);
    if (deepLinkRoutine && canStartRoutine(deepLinkRoutine)) {
      const step = Number(deepLink.step);
      setActiveRoutine(deepLinkRoutine);
      setRoutineStartStep(
        Number.isInteger(step) && step >= 1 && step <= deepLinkRoutine.steps.length ? step - 1 : 0,
      );
      setRoutineSummary(null);
      setView("routine");
    } else if (deepLinkEx && canStart(deepLinkEx)) {
      setActiveEx(deepLinkEx);
      // A link to one of today's three starts at the tempo the plan set.
      setActiveTempo(dailyTempoFor(dailyPlan, deepLinkEx.id) ?? 1);
      setActiveReps(linkedRepCount(deepLink.reps));
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

  // A link that names an exercise or a routine (the range result's "Start
  // this warmup", the coach, a program day) lands on the card that names it.
  // The room's own start cards sit above that card, and pressing one of them
  // outranks the link, so without this the first button a visitor sees starts
  // something else. Scrolled to rather than hiding the cards above it: those
  // are server-rendered, and removing them after first paint would shift the
  // whole page.
  const deepLinkWaiting =
    !pitch.listening && !cap.capped && Boolean(pendingDeepLinkEx || pendingDeepLinkRoutine);
  useEffect(() => {
    if (deepLinkWaiting) document.getElementById("warmup-gate")?.scrollIntoView({ block: "start" });
  }, [deepLinkWaiting]);

  // Resolved after the deep link, not before it: both land in the same render
  // when permission arrives, and whoever writes the view last wins. A visitor
  // who pressed a specific card asked for that card, so their pick has to
  // outrank the link they happened to arrive on.
  if (pending && pitch.listening) {
    const p = pending;
    setPending(null);
    if (p.kind === "exercise" && canStart(p.ex)) startExercise(p.ex, p.tempo);
    if (p.kind === "routine" && canStartRoutine(p.routine)) startRoutine(p.routine);
  }

  const deepLinkPending = Boolean(pendingDeepLinkEx || pendingDeepLinkRoutine);
  // A program row's link sets a rep count; any other single exercise walks
  // until End. The gate says which, so it never promises an ending that
  // will not come.
  const pendingLinkReps =
    pendingDeepLinkEx && !pendingDeepLinkRoutine ? linkedRepCount(deepLink?.reps) : null;

  const gateTitle = pendingDeepLinkRoutine
    ? `Turn on your mic to start “${pendingDeepLinkRoutine.name}”`
    : pendingDeepLinkEx
      ? `Turn on your mic to start “${pendingDeepLinkEx.title}”`
      : "How a warmup works here";

  const newToWarmups = !progress.sessions.some((s) => s.type === "warmup");
  // A program day still to do is the plan the singer committed to, so it
  // leads, unless it is a Pro day a free singer cannot open: leading with a
  // paywall every visit would cost them the room's real first action.
  const programLeads =
    activeProgram?.view.status === "todo" && !programDayNeedsPro(activeProgram, isPro);

  // The mic gate's three parts. Their order depends on whether a link is
  // waiting to start something; see the gate below.
  const gateSteps = (
    <ol
      className={`${deepLinkPending ? "mt-5" : "mt-3"} max-w-xl list-decimal space-y-2 pl-5 text-sm text-mut`}
    >
      <li>
        Each exercise plays its pattern once, counts you in with two
        beats, then scores your pitch as you sing it back with the
        guide underneath you.
      </li>
      <li>
        The key moves a semitone every rep: most exercises climb and
        then come back down, and the descending ones start high and
        step down. In a routine, after the set number of reps the next
        exercise introduces itself and starts on its own.{" "}
        {pendingLinkReps !== null
          ? `This exercise stops by itself after ${pendingLinkReps} ${pendingLinkReps === 1 ? "rep" : "reps"}.`
          : "A single exercise keeps going until you press End."}
      </li>
      <li>
        At the end you get one summary: score, stars, XP, and the
        streak you just kept alive.
      </li>
    </ol>
  );
  const gateNotes = (
    <>
      {/* The id the path rows point their aria-describedby at, so a
          screen reader user hears that a row asks for the microphone
          before they press it. It only exists while the gate does,
          which is exactly while the rows set that attribute. */}
      <p id="practice-mic-note" className="mt-3 max-w-xl text-sm text-dim">
        Scoring needs your microphone. Audio is read and analyzed in this
        browser and never leaves your device.
      </p>
      <p className="mt-2 max-w-xl text-sm text-rec">
        Sing at a comfortable volume. Stop if a note hurts or feels strained, and rest if your voice turns hoarse or scratchy.
      </p>
    </>
  );
  const gateStart = (
    <>
      <div className="mt-5">
        <Button variant="rec" size="lg" onClick={startFromGate}>
          <IconMic /> {deepLinkPending ? "Enable mic and start" : "Enable microphone"}
        </Button>
      </div>
      {pitch.error && errorAt.kind === "gate" && (
        <MicAlert
          message={pitch.error}
          className="mt-4 max-w-md text-sm text-rec"
        />
      )}
    </>
  );

  return (
    <PageShell
      kicker="Warmups"
      // Every other view runs inside the full-screen session surface, which
      // covers this heading entirely — only the summary of a single exercise
      // still renders as a page under it.
      title={view === "summary" ? "Session summary" : "Guided vocal warm-up exercises"}
      subtitle={
        view === "home"
          ? pitch.listening
            ? "Start today's warmup, or pick a length. Every exercise is scored as you sing."
            : "Singing warm-ups that count you in and score your pitch as you sing. The mic comes on only when you press start, and your audio never leaves this device."
          : undefined
      }
    >
      {view === "home" && (
        <div className="space-y-8">
          {/* Both are in the server HTML; each renders only in its own state, and
              until hydration the pre-paint state shows the right one
              (components/prepaint.tsx). */}
          <CapWall cap={cap} />
          <FreeAllowance cap={cap} />
          {/* A program day still to do leads; done, finished, or behind the
              paywall, it drops back below today's cards. The program is read
              from this browser's storage, so until hydration its place is an
              empty card the pre-paint state sizes for a leading day. */}
          {!hydrated ? (
            <div aria-hidden="true" className="rounded-3xl border border-line bg-panel" {...prepaintMarker(hydrated, { slot: "program-lead" })} />
          ) : (
            programLeads && activeProgram && <ProgramEntryCard active={activeProgram} />
          )}
          {newToWarmups ? (
            // Someone who has never sung a warmup has no path to continue.
            // The homepage's "Start workout" and the Lessons tab promise a
            // short routine that ends, so the first button here starts one:
            // the recommended set, sized to the free minutes. One gentle
            // exercise on its own would walk until End.
            <ContinueCard
              kicker="Start here"
              title={recommended.name}
              tagline={recommended.tagline}
              meta={<RoutineMeta routine={recommended} />}
              stepTitles={recommended.steps.map((s) => stepExercise(s).title)}
              stars={routineStats(progress, recommended).stars}
              goal={{ doneSec: goalDoneSec, goalSec }}
              streakDays={streakDays}
              streakBest={progress.streak.best}
              micReady={pitch.listening}
              unavailableReason={unavailableReason}
              startLabel={cap.capped ? "Available tomorrow" : pitch.listening ? "Start warmup" : "Enable mic and start"}
              error={errorAt.kind === "today" ? pitch.error : null}
              onStart={() => void selectRoutine(recommended, "today")}
            >
              <p className="text-xs text-dim sm:text-right">
                {recommendedReason}
              </p>
            </ContinueCard>
          ) : (
            nextExercise && (
              <ContinueCard
                kicker="Continue your path"
                streakDays={streakDays}
                streakBest={progress.streak.best}
                title={nextExercise.title}
                tagline="The next exercise in your lowest unfinished tier. You can still choose any exercise below."
                onStart={() => void selectExercise(nextExercise, "continue")}
                startLabel={cap.capped ? "Available tomorrow" : pitch.listening ? "Start exercise" : "Enable mic and start"}
                micReady={pitch.listening}
                unavailableReason={unavailableReason}
                error={errorAt.kind === "continue" ? pitch.error : null}
              />
            )
          )}
          {/* today is null until mount (the plan is seeded by the viewer's
              local date); the placeholder keeps the card's slot so nothing
              below it jumps when the plan arrives. */}
          {today === null && <DailyThreeCardPlaceholder />}
          {dailyPlan && (
            <DailyThreeCard
              plan={dailyPlan}
              done={dailyDone}
              onStart={(p) => void selectDailyPick(p)}
              error={errorAt.kind === "daily" ? pitch.error : null}
              errorExerciseId={errorAt.kind === "daily" ? errorAt.id : null}
              unavailableReason={unavailableReason}
            />
          )}
          {/* A newcomer's top card is this routine already; it is offered once. */}
          {!newToWarmups && (
            <ContinueCard
              kicker="Today's warmup"
              title={recommended.name}
              tagline={recommended.tagline}
              meta={<RoutineMeta routine={recommended} />}
              stepTitles={recommended.steps.map((s) => stepExercise(s).title)}
              stars={routineStats(progress, recommended).stars}
              goal={{ doneSec: goalDoneSec, goalSec }}
              streakDays={streakDays}
              streakBest={progress.streak.best}
              micReady={pitch.listening}
              unavailableReason={unavailableReason}
              startLabel={cap.capped ? "Available tomorrow" : pitch.listening ? "Start warmup" : "Enable mic and start"}
              error={errorAt.kind === "today" ? pitch.error : null}
              onStart={() => void selectRoutine(recommended, "today")}
            >
              <p className="text-xs text-dim sm:text-right">
                {recommendedReason}
              </p>
            </ContinueCard>
          )}
          {!programLeads && <ProgramEntryCard active={activeProgram} />}

          {/*
            The mic card used to be returned INSTEAD of this page, so a first-time
            visitor could not read a single exercise title before granting
            permission. /range already solved this: explain the loop, then ask.
          */}
          {!pitch.listening && !cap.capped && (
            <div id="warmup-gate" className="scroll-mt-20" {...prepaintMarker(hydrated, { plan: "not-capped" })}>
              <Card>
                <h2 className="text-xl">{gateTitle}</h2>
                {/* A link that named something (the range result, the coach,
                    a program day) brings the singer here to press one button,
                    so the button comes straight after the privacy and safety
                    lines and the how-it-works list follows it. On a 375×667
                    phone the old order put the button under the tab bar. */}
                {deepLinkPending ? (
                  <>
                    {gateNotes}
                    {gateStart}
                    {gateSteps}
                  </>
                ) : (
                  <>
                    {gateSteps}
                    {gateNotes}
                    {gateStart}
                  </>
                )}
                <AudioSetup className="mt-6 max-w-xl" />
                <ProWhisper className="mt-4" />
              </Card>
            </div>
          )}

          <RoutineGrid
            progress={progress}
            onStart={(r) => void selectRoutine(r, "grid")}
            error={errorAt.kind === "routine" ? pitch.error : null}
            errorRoutineId={errorAt.kind === "routine" ? errorAt.id : null}
            unavailableReason={unavailableReason}
          />

          <PathSection
            progress={progress}
            onSelect={selectExercise}
            micReady={pitch.listening}
            error={errorAt.kind === "exercise" ? pitch.error : null}
            errorExerciseId={errorAt.kind === "exercise" ? errorAt.id : null}
            unavailableReason={unavailableReason}
          />
        </div>
      )}

      {view === "routine" && activeRoutine && (
        <RoutineRunner
          initialTempo={routineStartingTempo(routineContext)}
          capped={cap.capped}
          routine={activeRoutine}
          startStep={routineStartStep}
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
          capped={cap.capped}
        />
      )}

      {view === "session" && activeEx && (
        <ExercisePlayer
          ex={activeEx}
          bounds={
            activeReps === null
              ? undefined
              : { reps: activeReps, stepIndex: 0, stepCount: 1, standalone: true }
          }
          initialTempo={activeTempo}
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
          daily={dailyPlan ? { plan: dailyPlan, done: dailyDone } : null}
          capped={cap.capped}
          onDaily={(p) => {
            if (canStart(p.exercise)) startExercise(p.exercise, p.tempo);
          }}
          onNext={startExerciseById}
          onLibrary={() => setView("home")}
        />
      )}
    </PageShell>
  );
}
