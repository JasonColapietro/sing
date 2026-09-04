"use client";

import Link from "next/link";
import type { ProgressState } from "@/lib/progress";
import { useIsPro } from "@/lib/pro";
import { Button, Card, Pill, SectionLabel } from "@/components/ui";
import { ProChip, ProLockTag } from "@/components/pro/ui";
import { MicAlert } from "@/components/mic-alert";
import { IconMic, IconPlay } from "./icons";
import {
  PRO_ROUTINES,
  ROUTINES,
  routineMinutes,
  stepExercise,
  type Routine,
} from "./routines";

/** How many exercise names the strip under a routine shows before "+N". */
const STRIP_MAX = 5;

function StepStrip({ routine, max = STRIP_MAX }: { routine: Routine; max?: number }) {
  const titles = routine.steps.map((s) => stepExercise(s).title);
  const shown = titles.slice(0, max);
  const more = titles.length - shown.length;
  return (
    <ol className="mt-4 flex flex-wrap gap-1.5" aria-label="Exercises in this routine">
      {shown.map((t, i) => (
        <li key={`${t}-${i}`}>
          <Pill tone="mut">{t}</Pill>
        </li>
      ))}
      {more > 0 && (
        <li>
          <Pill tone="mut">+{more} more</Pill>
        </li>
      )}
    </ol>
  );
}

function Meta({ routine }: { routine: Routine }) {
  return (
    <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-dim">
      {routine.steps.length} exercises
      <span className="mx-2 text-line2">·</span>~{routineMinutes(routine)} min
      <span className="mx-2 text-line2">·</span>Scored as you sing
    </p>
  );
}

/**
 * The first thing in the room: one routine, picked for this moment, and one
 * button. A singer who opens the room to warm up should not have to choose
 * from a thirty-card catalogue before they have sung a note.
 */
export function TodayCard({
  routine,
  progress,
  micReady,
  error,
  onStart,
}: {
  routine: Routine;
  progress: ProgressState;
  micReady: boolean;
  /** A mic failure that came from this card's button, or null. */
  error: string | null;
  onStart: () => void;
}) {
  const streak = progress.streak.current;
  return (
    <Card className="border-violet/40 bg-[radial-gradient(700px_260px_at_0%_0%,rgba(139,92,246,0.07),transparent_65%)]">
      <div className="flex flex-wrap items-start justify-between gap-6">
        <div className="max-w-xl">
          <div className="flex flex-wrap items-center gap-2">
            <SectionLabel>Today&apos;s warmup</SectionLabel>
            {streak >= 2 && (
              <Pill tone="ok">
                <span aria-hidden="true">🔥</span> {streak}-day streak
              </Pill>
            )}
          </div>
          <h2 className="mt-3 text-3xl sm:text-4xl">{routine.name}</h2>
          <p className="mt-2 text-mut">{routine.tagline}</p>
          <div className="mt-4">
            <Meta routine={routine} />
          </div>
          <StepStrip routine={routine} />
        </div>
        <div className="flex w-full flex-col items-stretch gap-3 sm:w-auto sm:items-end">
          <Button variant="rec" size="lg" onClick={onStart} className="w-full sm:w-auto">
            {micReady ? <IconPlay /> : <IconMic />}
            {micReady ? "Start warmup" : "Enable mic and start"}
          </Button>
          <p className="text-xs text-dim sm:text-right">
            Each exercise starts itself. Just sing when it says your turn.
          </p>
        </div>
      </div>
      {error && <MicAlert message={error} className="mt-4 text-sm text-rec" />}
    </Card>
  );
}

/**
 * Every routine, the free four then the Pro packs. Pro cards are rendered
 * from PRO_ROUTINES either way; for a free singer they link to /pro instead of
 * starting, and the exercises inside stay behind the paywall in the player.
 */
export function RoutineGrid({
  onStart,
  error,
  errorRoutineId,
}: {
  onStart: (routine: Routine) => void;
  error: string | null;
  errorRoutineId: string | null;
}) {
  const isPro = useIsPro();

  const card = (routine: Routine) => {
    const locked = routine.pro && !isPro;
    const failed = error !== null && errorRoutineId === routine.id;
    const body = (
      <Card
        tone="raised"
        className={`h-full ${failed ? "border-rec/50" : ""}`}
      >
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-lg">{routine.name}</h3>
          {routine.pro ? locked ? <ProLockTag /> : <ProChip /> : null}
        </div>
        <p className="mt-2 text-sm text-mut">{routine.tagline}</p>
        <div className="mt-4">
          <Meta routine={routine} />
        </div>
        <StepStrip routine={routine} max={3} />
      </Card>
    );
    return (
      <div key={routine.id} className="flex flex-col">
        {locked ? (
          <Link href="/pro" className="flex-1">
            {body}
          </Link>
        ) : (
          <button type="button" onClick={() => onStart(routine)} className="flex-1 text-left">
            {body}
          </button>
        )}
        {failed && <MicAlert message={error} className="mt-2 text-sm text-rec" />}
      </div>
    );
  };

  return (
    <section>
      <div className="flex flex-wrap items-center gap-2">
        <SectionLabel>Routines</SectionLabel>
        <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-dim">
          Pick a length, press start
        </span>
      </div>
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {ROUTINES.map(card)}
        {PRO_ROUTINES.map(card)}
      </div>
    </section>
  );
}
