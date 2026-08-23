"use client";

import { useEffect, useState } from "react";
import { usePitch } from "@/lib/audio/use-pitch";
import { useProgress } from "@/lib/progress";
import { Button, Card, PageShell } from "@/components/ui";
import { ProWhisper } from "@/components/pro/gate";
import { MicAlert } from "@/components/mic-alert";
import { AudioSetup } from "@/components/audio/audio-setup";
import { IconMic } from "./icons";
import { ALL_EXERCISES, EXERCISES, type WarmupExercise } from "./exercises";
import { getProState } from "@/lib/pro";
import { Library } from "./library";
import { ExercisePlayer } from "./exercise-player";
import { SessionSummary } from "./session-summary";
import type { SessionSummaryData } from "./lib";

type View = "library" | "session" | "summary";

/**
 * Whether this exercise may be started at all. Membership in EXERCISES is the
 * paywall; everything inside a pack needs an active Pro entitlement. Every
 * entry point that isn't a library card — a deep link, a "next exercise" —
 * routes through here, so none of them can become the one that leaks a pack.
 */
function canStart(ex: WarmupExercise): boolean {
  if (EXERCISES.some((e) => e.id === ex.id)) return true;
  return getProState().active;
}

export function WarmupsClient() {
  const pitch = usePitch();
  const progress = useProgress();

  const [view, setView] = useState<View>("library");
  const [activeEx, setActiveEx] = useState<WarmupExercise | null>(null);
  const [summary, setSummary] = useState<SessionSummaryData | null>(null);

  // The coach links here as /warmups?exercise=<id> so a singer arrives on the
  // exercise their own scored notes picked, not on the 37-card grid. Read from
  // the URL after mount rather than with useSearchParams: that hook needs a
  // Suspense boundary in app/warmups/page.tsx, and the boundary would blank
  // this page's prerendered heading and copy — the same trade the singers
  // directory documents. `undefined` means the URL hasn't been read yet.
  const [deepLinkId, setDeepLinkId] = useState<string | null | undefined>(
    undefined,
  );
  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    setDeepLinkId(new URLSearchParams(window.location.search).get("exercise"));
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  function startExercise(ex: WarmupExercise) {
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

  // The exercise a cold visitor picked while the mic was still off, held until
  // permission lands. Without it their choice is thrown away by the prompt.
  const [pendingEx, setPendingEx] = useState<WarmupExercise | null>(null);

  // Where the next mic failure has to appear: the id of the exercise whose card
  // was pressed, or null for the gate card's own button. The library sits under
  // the gate card, so a card near the bottom of the catalogue was asking for the
  // mic and printing the refusal most of a page above the fold. One MicAlert is
  // rendered, in whichever of those two places the singer was actually looking.
  const [errorAt, setErrorAt] = useState<string | null>(null);

  async function selectExercise(ex: WarmupExercise) {
    if (pitch.listening) {
      startExercise(ex);
      return;
    }
    // A cold visitor picked a specific exercise, so the mic prompt is the
    // interruption, not the destination: hold their choice and open it the
    // moment permission lands.
    setPendingEx(ex);
    setErrorAt(ex.id);
    const ok = await pitch.start();
    if (!ok) setPendingEx(null);
  }

  // The gate card's button, which is its own place on screen. Set before the
  // await, but nothing renders during it: start() clears the error first.
  function startFromGate() {
    setErrorAt(null);
    void pitch.start();
  }

  const deepLinkEx = deepLinkId
    ? (ALL_EXERCISES.find((e) => e.id === deepLinkId) ?? null)
    : null;

  // Consumed once, and only after the mic gate clears, so the singer still
  // gets asked for a microphone first and lands on the requested exercise
  // after. Adjusted during render rather than in an effect, per
  // https://react.dev/learn/you-might-not-need-an-effect#adjusting-some-state-when-a-prop-changes
  const [deepLinkDone, setDeepLinkDone] = useState(false);
  if (!deepLinkDone && deepLinkId !== undefined && pitch.listening) {
    setDeepLinkDone(true);
    if (deepLinkEx && canStart(deepLinkEx)) {
      setActiveEx(deepLinkEx);
      setSummary(null);
      setView("session");
    }
  }

  const pendingDeepLink = !deepLinkDone && deepLinkEx && canStart(deepLinkEx);

  // Resolved after the deep link, not before it: both land in the same render
  // when permission arrives, and whoever writes activeEx last wins. A visitor
  // who tapped a specific card asked for that card, so their pick has to
  // outrank the ?exercise= link they happened to arrive on. Adjusted during
  // render rather than in an effect that would paint the library for a frame.
  if (pendingEx && pitch.listening) {
    const ex = pendingEx;
    setPendingEx(null);
    if (canStart(ex)) startExercise(ex);
  }

  return (
    <PageShell
      kicker="Warmups"
      title={
        view === "session" && activeEx
          ? activeEx.title
          : view === "summary" && summary
            ? "Session summary"
            : "Guided vocal warmups"
      }
      subtitle={
        view === "library"
          ? pitch.listening
            ? "Pick an exercise to start your ladder."
            : "Browse every exercise first. The mic comes on when you pick one."
          : undefined
      }
    >
      {/*
        The mic card used to be returned INSTEAD of this page, so a first-time
        visitor could not read a single exercise title before granting
        permission. /range already solved this: explain the loop, then ask.
      */}
      {view === "library" && !pitch.listening && (
        <Card className="mb-8">
          <h2 className="text-xl">
            {pendingDeepLink
              ? `Turn on your mic to start “${deepLinkEx.title}”`
              : "How a warmup ladder works"}
          </h2>
          <ol className="mt-3 max-w-xl list-decimal space-y-2 pl-5 text-sm text-mut">
            <li>
              Pick an exercise from the catalogue below. Titles, ladder spans
              and lengths are all there before you decide.
            </li>
            <li>
              The pattern plays once so you have it, then a two-beat count-in,
              then you sing it with the guide underneath you.
            </li>
            <li>
              Your pitch is scored against the target as you sing, and each rep
              gets a score at the end of it.
            </li>
            <li>
              The root climbs a semitone each rep to the top of your range,
              then walks back down — and keeps going until you end the
              exercise.
            </li>
            <li>
              Prefer to sing it back from memory? Switch to Call and response
              in the exercise controls. It is scored separately, because it is
              a harder thing to do.
            </li>
          </ol>
          <p id="warmups-mic-note" className="mt-3 max-w-xl text-sm text-dim">
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
          {pitch.error && errorAt === null && (
            <MicAlert
              message={pitch.error}
              className="mt-4 max-w-md text-sm text-rec"
            />
          )}
          <AudioSetup className="mt-6 max-w-xl" />
          <ProWhisper className="mt-4" />
        </Card>
      )}

      {view === "library" && (
        <Library
          progress={progress}
          onSelect={selectExercise}
          micReady={pitch.listening}
          error={errorAt === null ? null : pitch.error}
          errorExerciseId={errorAt}
        />
      )}

      {view === "session" && activeEx && (
        <ExercisePlayer
          ex={activeEx}
          pitch={pitch}
          range={progress.range}
          onFinish={(data) => {
            setSummary(data);
            setView("summary");
          }}
          onExit={() => setView("library")}
        />
      )}

      {view === "summary" && summary && (
        <SessionSummary
          data={summary}
          onNext={startExerciseById}
          onLibrary={() => setView("library")}
        />
      )}
    </PageShell>
  );
}
