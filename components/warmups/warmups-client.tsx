"use client";

import { formatClock, sizeToAllowance, useFreeCap } from "@/lib/free-cap";
import { CapWall, FreeAllowance } from "@/components/practice/free-cap";
import { useCappedStart } from "@/components/practice/use-capped-start";
import { liveStreak } from "@/components/account/save-state";

import { useEffect, useMemo, useState } from "react";
import { usePitch } from "@/lib/audio/use-pitch";
import { useIdleMicRelease } from "@/lib/audio/use-idle-mic-release";
import { localDay, useProgress } from "@/lib/progress";
import { Button, Card, PageShell } from "@/components/ui";
import { MicAlert } from "@/components/mic-alert";
import { AudioSetup } from "@/components/audio/audio-setup";
import { FigureFrame } from "@/components/figures/frame";
import { LaneFigure } from "./lane-figure";
import { ContinueCard, useDailyGoal, useGoalDoneSec, nextUpId, starsForExercise } from "@/components/practice/learn-home";
import { IconMic } from "./icons";
import { ALL_EXERCISES, EXERCISES, PRO_PACKS, TIER_ORDER, type WarmupExercise } from "./exercises";
import { getProState, useIsPro, useProReady } from "@/lib/pro";
import { ExercisePlayer } from "./exercise-player";
import { SessionSummary } from "./session-summary";
import { RoutineRunner, type RoutineSummaryData } from "./routine-runner";
import { RoutineSummary } from "./routine-summary";
import { PathSection, RoutineGrid, RoutineMeta, routineStats } from "./routine-home";
import { recentWarmupResults, routineReason, routineSeconds, routineStartingTempo, recommendRoutine, routineById, stepExercise, type Routine } from "./routines";
import type { SessionSummaryData } from "./lib";
import { DailyThreeCard, DailyThreeCardPlaceholder } from "./daily-three-card";
import { dailyTempoFor, dailyThreeDone, planDailyThree, type DailyPick, type DailyTempo } from "@/lib/daily-three";
import { ProgramEntryCard } from "@/components/programs/today-card";
import { useActiveProgram } from "@/components/programs/use-program";
import { programDayNeedsPro, recoveryWeekOf } from "@/components/practice/program-day";
import { DeepLinkSlot, deepLinkMarker, prepaintMarker, useDeepLinkRead, useHydrated } from "@/components/prepaint";

type View = "home" | "session" | "summary" | "routine" | "routine-summary";

/** The paywall: free exercises are in EXERCISES, anything in a pack needs Pro. Every entry point routes through here. */
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

/** Why a single exercise closed itself (the player's "silent" exit), with the input level beside it. */
export function SilentStopNote({
  title,
  listening,
  level,
  onMicOff,
}: {
  title: string;
  listening: boolean;
  level: number;
  /** Closes the microphone this note keeps open for its level meter. */
  onMicOff?: () => void;
}) {
  return (
    <Card className="border-rec/40">
      <h2 className="text-xl">No sound picked up</h2>
      <MicAlert
        message={`${title} stopped after two reps with no note heard, so nothing was logged.`}
        className="mt-2 max-w-xl text-ink"
      />
      <p className="mt-2 max-w-xl text-sm text-mut">
        If you were singing, the mic didn&apos;t pick up a clear note. Sing a little
        louder or closer to the mic, or check the input below, then start it again.
      </p>
      <AudioSetup className="mt-4 max-w-xl" listening={listening} level={level} />
      {listening && onMicOff && (
        <Button variant="ghost" size="sm" className="mt-3" onClick={onMicOff}>
          Turn off the mic
        </Button>
      )}
    </Card>
  );
}

/** Where a mic failure has to be shown: the one control the singer pressed. */
type ErrorAt =
  | { kind: "gate" }
  | { kind: "continue" }
  | { kind: "today" }
  | { kind: "routine"; id: string }
  | { kind: "exercise"; id: string }
  | { kind: "daily"; id: string }
  | { kind: "summary" };

export function WarmupsClient() {
  const pitch = usePitch();
  // Whether the singer has allowed the microphone on this visit. The stream
  // is closed when the room has been idle for a while (below), so the
  // recording light goes off on the summary and the list; this keeps the gate
  // card and the "Enable mic and start" labels from coming back once the
  // singer has answered them. Adjusted during render, as the deep link below
  // is. A reopen that fails brings the gate card back, with its input picker.
  const [micAllowed, setMicAllowed] = useState(false);
  if (pitch.listening && !micAllowed) setMicAllowed(true);
  const micReady = pitch.listening || (micAllowed && !pitch.error);
  const progress = useProgress();
  const isPro = useIsPro();
  // Every way into a session is guarded, so a capped singer sees the wall rather than a mic prompt.
  const cap = useFreeCap();
  const { guard, reason: unavailableReason } = useCappedStart(cap);
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
  // A `?step=` link opened past step 1 on a day with no warmup logged yet:
  // the runner sings a few easy reps of the routine's first exercise before
  // that step, so a program day the free minutes split never resumes cold on
  // an octave siren the next morning.
  const [routineWarmIn, setRoutineWarmIn] = useState(false);
  const [routineSummary, setRoutineSummary] = useState<RoutineSummaryData | null>(null);
  // The tempo the running exercise starts at: 1x, or the step today's plan
  // chose for it.
  const [activeTempo, setActiveTempo] = useState<DailyTempo>(1);
  // A set rep count from a `?exercise=<id>&reps=<n>` link (a program row
  // sized to the free minutes): the exercise stops itself after n reps
  // instead of walking until End. Null for every other way in.
  const [activeReps, setActiveReps] = useState<number | null>(null);
  // The exercise that just ended itself because the mic heard nothing for two
  // reps (ExercisePlayer's "silent" exit). Nothing was logged, so there is no
  // summary to show; without this the room's home simply reappeared, with no
  // word of why. Cleared by the next start.
  const [silentStop, setSilentStop] = useState<string | null>(null);

  // The coach links here as /warmups?exercise=<id> and the routine cards
  // elsewhere as /warmups?routine=<id>, so a singer arrives on the thing that
  // was picked for them, not on the room's front page. Read from the URL after
  // mount rather than with useSearchParams: that hook needs a Suspense boundary
  // in app/warmups/page.tsx, and the boundary would blank this page's
  // prerendered heading and copy — the same trade the singers directory
  // documents. `undefined` means the URL hasn't been read yet; until it has,
  // the room carries the deep-link marker, which a link's first load uses to
  // hold the room back until its gate names what the link opens
  // (components/prepaint.tsx).
  const [deepLink, setDeepLink] = useState<
    | { exercise: string | null; routine: string | null; step: string | null; reps: string | null }
    | undefined
  >(undefined);
  const deepLinkRead = deepLink !== undefined;
  useDeepLinkRead(deepLinkRead);
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

  // A link into the folded catalogue (/pro's "/warmups#pro-packs" after a
  // purchase) names a card inside a closed <details>: the browser cannot
  // scroll to it, and Safari never opens the fold. Open it and scroll, on
  // load and on every hash change. Re-run when the fold appears or goes.
  const newToWarmups = !progress.sessions.some((s) => s.type === "warmup");
  const homeView = view === "home";
  useEffect(() => {
    if (!homeView) return;
    const reveal = () => {
      const id = decodeURIComponent(window.location.hash.slice(1));
      if (!id) return;
      const target = document.getElementById(id);
      if (revealInFolds(target)) target?.scrollIntoView({ block: "start" });
    };
    reveal();
    window.addEventListener("hashchange", reveal);
    return () => window.removeEventListener("hashchange", reveal);
  }, [homeView, newToWarmups]);

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
  // While Recovery week runs, today's warmup is the week's own quiet set (components/practice/program-day.ts recoveryWeekOf).
  const recovering = activeProgram ? recoveryWeekOf(activeProgram) : null;
  // Sized to the free minutes left: a routine that outlasts them ends on the cap slide.
  const preferred = (recovering ? routineById("recovery") : null) ?? recommendRoutine(routineContext);
  const recommended = cap.capped
    ? preferred
    : sizeToAllowance(preferred, [routineById("morning")], routineSeconds, cap.leftSec);
  const sizedToAllowance = recommended !== preferred;
  // Stars are a floored average of the steps' bests, so a routine sung once
  // at middling scores can read zero; `best` says whether any step was sung.
  const recommendedStats = routineStats(progress, recommended);
  // The prerender has no entitlement, so it always sizes for free. Until the
  // entitlement is read the line holds its place without naming free minutes:
  // a Pro singer would otherwise be told about a limit they paid to remove.
  const proReady = useProReady();
  // When nothing shorter fits what is left today, the pick stands, but the
  // card says where it will stop rather than calling a longer routine "short":
  // the cap is checked between steps, so the step under way always finishes.
  const overAllowance =
    proReady && !cap.isPro && !cap.capped && routineSeconds(recommended) > cap.leftSec;
  // At the cap the button already says when; a top-up reason would offer a
  // routine that cannot start. The no-break space keeps the line's height.
  const recommendedReason = cap.capped
    ? " "
    : sizedToAllowance
      ? !proReady
        ? " "
        : cap.usedSec <= 0
          ? `Fits in today's ${Math.round(cap.capSec / 60)} free minutes.`
          : `Fits in the ${formatClock(cap.leftSec)} of free practice left today.`
      : overAllowance
        ? `${formatClock(cap.leftSec)} of free practice left today: this routine stops after the step that uses it up.`
        : recovering
          ? `${recovering} is running, so today's warmup is the quiet routine.`
          : routineReason(routineContext);
  const pathExercises = isPro ? ALL_EXERCISES : EXERCISES;
  const pathItem = (e: WarmupExercise) => ({ id: e.id, title: e.title, stars: starsForExercise(progress, e.title) });
  const nextId = nextUpId([
    ...TIER_ORDER.map((tier) => ({ title: tier, items: EXERCISES.filter((e) => e.tier === tier).map(pathItem) })),
    ...(isPro ? PRO_PACKS.map((pack) => ({ title: pack.name, items: pack.exercises.map(pathItem) })) : []),
  ]);
  const nextExercise = pathExercises.find((e) => e.id === nextId);
  // Planned from the free catalogue whatever the viewer's plan, and from
  // sessions before today, so it holds still all day unless a range test is
  // saved: then a pattern too wide for the new range drops out, as the
  // routines skip it.
  const rangeLow = progress.range.lowMidi;
  const rangeHigh = progress.range.highMidi;
  const dailyPlan = useMemo(
    () =>
      today
        ? planDailyThree({
            sessions: progress.sessions,
            day: today,
            range: { lowMidi: rangeLow, highMidi: rangeHigh },
          })
        : null,
    [progress.sessions, today, rangeLow, rangeHigh],
  );
  const dailyDone = dailyPlan ? dailyThreeDone(dailyPlan, progress.sessions) : [];

  const startExercise = guard((ex: WarmupExercise, tempo: DailyTempo = 1) => {
    setSilentStop(null);
    setActiveEx(ex);
    setActiveTempo(tempo);
    setActiveReps(null);
    setSummary(null);
    setView("session");
  });

  function startExerciseById(id: string) {
    const ex = ALL_EXERCISES.find((e) => e.id === id);
    // Defense in depth: pack exercises never start for free users.
    if (!ex || !canStart(ex)) return;
    void selectExercise(ex, "summary");
  }

  const startRoutine = guard((r: Routine) => {
    if (!canStartRoutine(r)) return;
    setSilentStop(null);
    setActiveRoutine(r);
    setRoutineStartStep(0);
    setRoutineWarmIn(false);
    setRoutineSummary(null);
    setView("routine");
  });

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

  const selectExercise = guard(async (
    ex: WarmupExercise,
    from: "path" | "continue" | "summary" = "path",
  ) => {
    if (pitch.listening) {
      startExercise(ex);
      return;
    }
    setPending({ kind: "exercise", ex });
    // The next exercise also appears in the catalogue. Its two controls need
    // separate error destinations so only the pressed one announces and scrolls.
    setErrorAt(
      from === "continue"
        ? { kind: "continue" }
        : from === "summary"
          ? { kind: "summary" }
          : { kind: "exercise", id: ex.id },
    );
    const ok = await pitch.start();
    if (!ok) setPending(null);
  });

  /** A row in today's three: the exercise at the tempo the plan set for it. */
  const selectDailyPick = guard(async (p: DailyPick, from: "today" | "summary" = "today") => {
    if (!canStart(p.exercise)) return;
    if (pitch.listening) {
      startExercise(p.exercise, p.tempo);
      return;
    }
    setPending({ kind: "exercise", ex: p.exercise, tempo: p.tempo });
    setErrorAt(from === "summary" ? { kind: "summary" } : { kind: "daily", id: p.exercise.id });
    const ok = await pitch.start();
    if (!ok) setPending(null);
  });

  const selectRoutine = guard(async (r: Routine, from: "today" | "grid" | "summary") => {
    if (!canStartRoutine(r)) return;
    if (pitch.listening) {
      startRoutine(r);
      return;
    }
    setPending({ kind: "routine", routine: r });
    setErrorAt(
      from === "today"
        ? { kind: "today" }
        : from === "summary"
          ? { kind: "summary" }
          : { kind: "routine", id: r.id },
    );
    const ok = await pitch.start();
    if (!ok) setPending(null);
  });

  // The gate card's button, which is its own place on screen.
  const startFromGate = guard(() => {
    setErrorAt({ kind: "gate" });
    void pitch.start();
  });

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
      const linked = Number.isInteger(step) && step >= 1 && step <= deepLinkRoutine.steps.length;
      setActiveRoutine(deepLinkRoutine);
      setRoutineStartStep(linked ? step - 1 : 0);
      // Read now, as the link is used: the warm-in itself logs a warmup.
      setRoutineWarmIn(
        linked &&
          step >= 2 &&
          !progress.sessions.some((s) => s.type === "warmup" && s.day === localDay()),
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
  // whole page. Nor does the gate move up to lead them: on a client-side
  // visit the room paints before it reads its address, and a gate moving to
  // the top would push every card down. On a link's first load the pre-paint
  // state holds the room back until it has read the address
  // (components/prepaint.tsx deepLinkMarker), so the cards and the retitled
  // gate arrive together.
  //
  // The scroll waits two frames, so the cards first paint in the slot's place
  // with the page still at its top, and only then does the view move to the
  // gate. In the same frame as that swap, the browser maps where the rail
  // band and the guide sat under the slot into the scrolled-to screen, and
  // counted them as moving across it: 0.92 on a phone for every /warmups link.
  // Painted first at the top, they are below the screen before and after, and
  // the scroll that follows moves nothing.
  const deepLinkWaiting =
    !pitch.listening && !cap.capped && Boolean(pendingDeepLinkEx || pendingDeepLinkRoutine);
  useEffect(() => {
    if (!deepLinkWaiting) return;
    let inner = 0;
    const outer = requestAnimationFrame(() => {
      inner = requestAnimationFrame(() =>
        document.getElementById("warmup-gate")?.scrollIntoView({ block: "start" }),
      );
    });
    return () => {
      cancelAnimationFrame(outer);
      cancelAnimationFrame(inner);
    };
  }, [deepLinkWaiting]);

  // Out of a session, an open microphone closes after a short idle wait
  // (useIdleMicRelease). It used to stay open on the summary and the list for
  // as long as the page did, with the browser's recording light on and no
  // control to turn it off. Every way into the next session reopens it first
  // (selectExercise, selectDailyPick, selectRoutine), and a start still
  // waiting on the device holds it. So does "No sound picked up"
  // (SilentStopNote): it shows the input level, which needs the mic, and has
  // its own control to turn it off.
  useIdleMicRelease({
    listening: pitch.listening,
    hold: view === "session" || view === "routine" || pending !== null || silentStop !== null,
    stop: pitch.stop,
  });

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
        {/* Outlined unless a link is waiting on it: the start card above
            already carries the room's one rust action, and a second rust
            button a screen and a half down competed with it. A deep link
            brings the singer here to press this one, so then it keeps the
            rust. */}
        <Button variant={deepLinkPending ? "rec" : "outline"} size="lg" onClick={startFromGate}>
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

  // today is null until mount (the plan is seeded by the viewer's local date);
  // the placeholder keeps the card's slot so nothing below it jumps.
  const dailyThree = (
    <>
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
    </>
  );
  const routineGrid = (
    <RoutineGrid
      progress={progress}
      onStart={(r) => void selectRoutine(r, "grid")}
      error={errorAt.kind === "routine" ? pitch.error : null}
      errorRoutineId={errorAt.kind === "routine" ? errorAt.id : null}
      unavailableReason={unavailableReason}
    />
  );
  const pathSection = (
    <PathSection
      progress={progress}
      onSelect={selectExercise}
      micReady={micReady}
      error={errorAt.kind === "exercise" ? pitch.error : null}
      errorExerciseId={errorAt.kind === "exercise" ? errorAt.id : null}
      unavailableReason={unavailableReason}
      recovering={recovering}
    />
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
          ? micReady
            ? "Start today's warmup, or pick a length. Every exercise is scored as you sing."
            : "Vocal warm-up exercises that count you in and score your pitch as you sing: lip trills, hums, sirens and five-note scales, in routines you pick by length. The mic comes on only when you press start, and your audio never leaves this device."
          : undefined
      }
    >
      {view === "home" && (
        <div className="space-y-8" {...deepLinkMarker(deepLinkRead, "warmups")}>
          {/* Both are in the server HTML; each renders only in its own state, and
              until hydration the pre-paint state shows the right one
              (components/prepaint.tsx). */}
          <CapWall cap={cap} />
          <FreeAllowance cap={cap} />
          {/* Only ever after a session the player ended for silence, so never
              in the server HTML and never a shift at hydration. */}
          {silentStop && (
            <SilentStopNote
              title={silentStop}
              listening={pitch.listening}
              level={pitch.frame.volume}
              onMicOff={pitch.stop}
            />
          )}
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
            // A newcomer has no path to continue: the first button starts the recommended routine, sized to the free minutes.
            <ContinueCard
              kicker="Start here"
              title={recommended.name}
              tagline={recommended.tagline}
              meta={<RoutineMeta routine={recommended} />}
              stepTitles={recommended.steps.map((s) => stepExercise(s).title)}
              stars={recommendedStats.stars}
              started={recommendedStats.best !== null}
              goal={{ doneSec: goalDoneSec, goalSec }}
              streakDays={streakDays}
              streakBest={progress.streak.best}
              micReady={micReady}
              unavailableReason={unavailableReason}
              startLabel={cap.capped ? "Available tomorrow" : micReady ? "Start routine" : "Enable mic and start"}
              error={errorAt.kind === "today" ? pitch.error : null}
              onStart={() => void selectRoutine(recommended, "today")}
            >
              <p className="text-xs text-dim sm:text-right">
                {recommendedReason}
              </p>
            </ContinueCard>
          ) : (
            nextExercise && (
              // Today's warmup, below, is the room's one filled start: the
              // finite daily routine. This card's single endless exercise is
              // the outline alternative, and the streak is said here only,
              // where the newcomer's card (the server HTML) says it too, so
              // the card keeps its height at hydration.
              <ContinueCard
                kicker="Continue your path"
                secondary
                streakDays={streakDays}
                streakBest={progress.streak.best}
                title={nextExercise.title}
                // At the cap every exercise below waits for tomorrow too, so
                // the card offers no other choice for now. Never in the server
                // HTML (a newcomer's card is there), so no pre-paint state.
                tagline={
                  cap.capped
                    ? "The next exercise in your lowest unfinished tier."
                    : "The next exercise in your lowest unfinished tier. You can still choose any exercise below."
                }
                onStart={() => void selectExercise(nextExercise, "continue")}
                startLabel={cap.capped ? "Available tomorrow" : micReady ? "Start exercise" : "Enable mic and start"}
                micReady={micReady}
                unavailableReason={unavailableReason}
                error={errorAt.kind === "continue" ? pitch.error : null}
              />
            )
          )}
          {/* Same place for every singer: the server renders a newcomer, so moving it by history shifted the page on hydration. */}
          {dailyThree}
          {/* A newcomer's top card is this routine already; it is offered once. */}
          {!newToWarmups && (
            <ContinueCard
              kicker="Today's warmup"
              showStreak={false}
              title={recommended.name}
              tagline={recommended.tagline}
              meta={<RoutineMeta routine={recommended} />}
              stepTitles={recommended.steps.map((s) => stepExercise(s).title)}
              stars={recommendedStats.stars}
              started={recommendedStats.best !== null}
              goal={{ doneSec: goalDoneSec, goalSec }}
              streakDays={streakDays}
              streakBest={progress.streak.best}
              micReady={micReady}
              unavailableReason={unavailableReason}
              startLabel={cap.capped ? "Available tomorrow" : micReady ? "Start routine" : "Enable mic and start"}
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
          {!micReady && !cap.capped && (
            <div id="warmup-gate" className="scroll-mt-20" {...prepaintMarker(hydrated, { plan: "not-capped" })}>
              <Card>
                {/* The room's instrument beside the prompt, as /songs and /studio show theirs:
                    a column on a wide screen, under the buttons on a phone. */}
                <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,20rem)]">
                  <div>
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
                    {/* No ProWhisper here: FreeAllowance above is this page's one ask. */}
                    <AudioSetup className="mt-6 max-w-xl" />
                  </div>
                  <FigureFrame className="self-start" caption="What a warmup draws">
                    <LaneFigure />
                  </FigureFrame>
                </div>
              </Card>
            </div>
          )}

          {newToWarmups ? (
            // A newcomer's catalogue stays in the HTML, folded, so nothing is
            // lost to a link or a search and the grid is never the first thing read.
            <>
              <details className="group rounded-3xl border border-line bg-panel">
                <summary className="cursor-pointer list-none px-5 py-4 text-lg outline-offset-2 focus-visible:outline-2 focus-visible:outline-violet">
                  All routines
                  <span className="ml-2 font-mono text-[11px] uppercase tracking-[0.14em] text-dim">
                    pick a length
                  </span>
                </summary>
                <div className="border-t border-line px-5 py-5">{routineGrid}</div>
              </details>
              <details className="group rounded-3xl border border-line bg-panel">
                <summary className="cursor-pointer list-none px-5 py-4 text-lg outline-offset-2 focus-visible:outline-2 focus-visible:outline-violet">
                  Every exercise
                  <span className="ml-2 font-mono text-[11px] uppercase tracking-[0.14em] text-dim">
                    the path, one ladder at a time
                  </span>
                </summary>
                <div className="border-t border-line px-5 py-5">{pathSection}</div>
              </details>
            </>
          ) : (
            <>
              {routineGrid}
              {pathSection}
            </>
          )}
        </div>
      )}
      {/* Shown only on a deep link's first load, until the room has read it. */}
      {view === "home" && !deepLinkRead && <DeepLinkSlot room="warmups" read={false} />}

      {view === "routine" && activeRoutine && (
        <RoutineRunner
          initialTempo={routineStartingTempo(routineContext)}
          capped={cap.capped}
          routine={activeRoutine}
          startStep={routineStartStep}
          warmIn={routineWarmIn}
          pitch={pitch}
          range={progress.range}
          onDone={(data) => {
            setRoutineSummary(data);
            setView("routine-summary");
          }}
          onQuit={() => setView("home")}
        />
      )}

      {/* The single-exercise summary's buttons reopen the microphone the room
          closed; a failure to reopen it shows above the summary. The routine
          summary is a full-screen dialog, so it shows its own (micError). */}
      {view === "summary" &&
        errorAt.kind === "summary" &&
        !pitch.listening &&
        pitch.error && <MicAlert message={pitch.error} className="mb-4 max-w-md text-sm text-rec" />}
      {view === "routine-summary" && routineSummary && (
        <RoutineSummary
          data={routineSummary}
          onRepeat={() => void selectRoutine(routineSummary.routine, "summary")}
          onHome={() => {
            // A "Play again" still waiting on the microphone is dropped, so
            // access granted later cannot start a session from the list.
            setPending(null);
            setView("home");
          }}
          micError={errorAt.kind === "summary" && !pitch.listening ? pitch.error : null}
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
          onFinish={(data) => {
            setSummary(data);
            setView("summary");
          }}
          onExit={(reason) => {
            setSilentStop(reason === "silent" ? activeEx.title : null);
            setView("home");
          }}
        />
      )}

      {/* The single-exercise summary starts the next run itself ("Run this
          ladder again", "Sing it", "Next exercise"), so it says how much of
          today's free time is left before the singer picks one. No Pro link
          here: the results nudge below is this view's one ask. */}
      {view === "summary" && summary && !cap.capped && <FreeAllowance cap={cap} className="mb-4" proLink={false} />}
      {view === "summary" && summary && (
        <SessionSummary
          data={summary}
          daily={dailyPlan ? { plan: dailyPlan, done: dailyDone } : null}
          capped={cap.capped}
          onDaily={(p) => {
            if (canStart(p.exercise)) void selectDailyPick(p, "summary");
          }}
          onNext={startExerciseById}
          onLibrary={() => {
            setPending(null);
            setView("home");
          }}
        />
      )}
    </PageShell>
  );
}

/** The parts of an element the fold walk reads; a DOM Element satisfies it. */
type FoldNode = { tagName: string; parentElement: FoldNode | null; open?: boolean };

/**
 * Opens every closed <details> around `target`. Returns true when the target
 * exists, so the caller can scroll to it once the folds are open.
 */
export function revealInFolds(target: FoldNode | null): boolean {
  if (!target) return false;
  for (let el = target.parentElement; el; el = el.parentElement) {
    if (el.tagName === "DETAILS" && !el.open) el.open = true;
  }
  return true;
}
