"use client";

import { useState } from "react";
import { usePitch } from "@/lib/audio/use-pitch";
import { useProgress } from "@/lib/progress";
import { Button, Card, PageShell } from "@/components/ui";
import { IconMic } from "./icons";
import { EXERCISES, type WarmupExercise } from "./exercises";
import { Library } from "./library";
import { ExercisePlayer } from "./exercise-player";
import { SessionSummary } from "./session-summary";
import type { SessionSummaryData } from "./lib";

type View = "library" | "session" | "summary";

export function WarmupsClient() {
  const pitch = usePitch();
  const progress = useProgress();

  const [view, setView] = useState<View>("library");
  const [activeEx, setActiveEx] = useState<WarmupExercise | null>(null);
  const [summary, setSummary] = useState<SessionSummaryData | null>(null);

  function startExercise(ex: WarmupExercise) {
    setActiveEx(ex);
    setSummary(null);
    setView("session");
  }

  function startExerciseById(id: string) {
    const ex = EXERCISES.find((e) => e.id === id);
    if (ex) startExercise(ex);
  }

  if (!pitch.listening) {
    return (
      <PageShell
        kicker="Warmups"
        title="Guided vocal warmups"
        subtitle="Listen to a short melody, then sing it back. Roots climb by semitones as you go, like a real warmup ladder."
      >
        <Card>
          <h2 className="text-xl">Enable your microphone to begin</h2>
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
