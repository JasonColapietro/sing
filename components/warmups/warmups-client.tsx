"use client";

import { useEffect, useState } from "react";
import { usePitch } from "@/lib/audio/use-pitch";
import { useProgress } from "@/lib/progress";
import { Button, Card, PageShell } from "@/components/ui";
import { ProWhisper } from "@/components/pro/gate";
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

  if (!pitch.listening) {
    return (
      <PageShell
        kicker="Warmups"
        title="Guided vocal warmups"
        subtitle="Listen to a short melody, then sing it back. Roots climb by semitones to the top of your range, then walk back down — for as long as you keep going."
      >
        <Card>
          <h2 className="text-xl">
            {pendingDeepLink
              ? `Enable your microphone to start “${deepLinkEx.title}”`
              : "Enable your microphone to begin"}
          </h2>
          <p className="mt-2 max-w-md text-sm text-mut">
            Suede Sing needs the mic to score your pitch against the target
            melody. Audio never leaves your browser.
          </p>
          <div className="mt-5">
            <Button variant="rec" size="lg" onClick={pitch.start}>
              <IconMic /> Enable microphone
            </Button>
          </div>
          {pitch.error && (
            <p className="mt-4 max-w-md text-sm text-rec" role="alert">
              {pitch.error}
            </p>
          )}
          <ProWhisper className="mt-4" />
        </Card>
      </PageShell>
    );
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
          ? "Pick an exercise to start your ladder."
          : undefined
      }
    >
      {view === "library" && <Library progress={progress} onSelect={startExercise} />}

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
