"use client";

/**
 * A program's days, with where this browser is in it. Rendered on the server
 * as a plain plan (nothing started) and brought up to date on the client from
 * the enrolment and the session log.
 */
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useProgress } from "@/lib/progress";
import { loadBreath, type SustainAttempt } from "@/components/breath/store";
import { leaveProgram, recordProgramDays, startProgram, useProgramEnrolment } from "@/lib/program-enrolment";
import {
  dayMinutes,
  programById,
  programComparison,
  programProgress,
  routineStepTasks,
  sustainAttemptLogs,
  taskDone,
  taskHref,
  taskLabel,
} from "@/lib/programs";
import { Button, Card } from "@/components/ui";

export function ProgramDays({ programId }: { programId: string }) {
  const program = programById(programId);
  const enrolment = useProgramEnrolment();
  const { sessions: logged, rangeHistory } = useProgress();
  // The sustain room's own attempt record, deferred to an effect because it is
  // localStorage: attempts under five seconds never reach the session log.
  const [attempts, setAttempts] = useState<SustainAttempt[]>([]);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setAttempts(loadBreath().attempts);
  }, [logged]);
  const sessions = useMemo(() => [...logged, ...sustainAttemptLogs(attempts)], [logged, attempts]);
  const following = program && enrolment?.programId === program.id ? enrolment : null;
  const progress =
    program && following
      ? programProgress(program, sessions, following.startedDay, {
          startedAt: following.startedAt,
          done: following.done,
        })
      : null;
  // Keep what's done: the next computation starts from these days.
  const doneSpans = progress?.spans.filter((s): s is { from: string; to: string } => s !== null) ?? [];
  const doneCount = doneSpans.length;
  const doneKey = JSON.stringify(doneSpans);
  useEffect(() => {
    if (program && doneCount > (following?.done?.length ?? 0)) {
      recordProgramDays(program.id, JSON.parse(doneKey));
    }
  }, [program, following, doneCount, doneKey]);
  if (!program) return null;

  const finished = progress !== null && progress.current >= program.days.length;
  // Practice gathered toward the current program day so far.
  const gathered = progress
    ? sessions.filter(
        (s) => s.day >= progress.countsFrom && (!following?.startedAt || s.date >= following.startedAt),
      )
    : [];
  const other = enrolment && !following ? programById(enrolment.programId) : undefined;

  return (
    <div className="space-y-6">
      <Card>
        <div className="max-w-2xl space-y-3" data-program-status={following ? (finished ? "finished" : "following") : "not-started"}>
          {!following && (
            <>
              <p className="text-mut">
                Start the program and this page keeps your place: a day is done
                once your practice since the previous one covers every task on
                it, and at most one day is done per calendar day. On a free
                account guided practice stops after three minutes a day, so a
                longer program day takes more than one day to finish.
              </p>
              {other && (
                <p className="text-sm text-mut">
                  You&apos;re following {other.name}. Starting this one replaces it;
                  your practice history stays.
                </p>
              )}
              <Button onClick={() => startProgram(program.id)}>Start this program today</Button>
            </>
          )}
          {following && progress && (
            <>
              <p className="text-ink">
                {finished
                  ? `Finished: all ${program.days.length} days done.`
                  : `Day ${progress.current + 1} of ${program.days.length}. Started ${following.startedDay}.`}
              </p>
              {finished && <p className="text-sm text-mut">{program.compare}</p>}
              {finished && <Comparison rows={programComparison(program, progress, sessions, rangeHistory)} />}
              <div className="flex flex-wrap gap-3">
                <Button variant="outline" size="sm" onClick={() => startProgram(program.id)}>
                  Restart from today
                </Button>
                <Button variant="ghost" size="sm" onClick={() => leaveProgram()}>
                  Stop following
                </Button>
              </div>
            </>
          )}
        </div>
      </Card>

      <ol className="space-y-3">
        {program.days.map((day, i) => {
          const doneOn = progress?.doneOn[i] ?? null;
          const isCurrent = progress !== null && progress.current === i;
          return (
            <li key={i} data-program-day={i + 1} data-done={doneOn ? "true" : "false"}>
              <Card tone={isCurrent ? "raised" : "flat"}>
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h2 className="text-lg">
                    <span className="mr-2 font-mono text-sm text-dim">Day {i + 1}</span>
                    {day.focus}
                  </h2>
                  <span className="text-xs text-dim">
                    {doneOn ? `Done ${doneOn}` : isCurrent ? "Up next" : `About ${dayMinutes(day)} min`}
                  </span>
                </div>
                <ul className="mt-3 space-y-1 text-sm">
                  {day.tasks.map((t, j) => {
                    const doneSoFar = isCurrent && taskDone(t, gathered);
                    return (
                      <li key={j} className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                        <span aria-hidden="true" className={doneSoFar ? "text-ok-ink" : "text-dim"}>
                          {doneSoFar ? "✓" : "·"}
                        </span>
                        <Link href={taskHref(t)} className="text-violet-ink hover:underline">
                          {taskLabel(t)}
                        </Link>
                        {t.kind === "ear" && <span className="text-xs text-dim">in ear training</span>}
                        {doneSoFar && <span className="sr-only">done</span>}
                        {t.kind === "routine" && (
                          <RoutineSteps id={t.id} gathered={isCurrent ? gathered : null} />
                        )}
                      </li>
                    );
                  })}
                </ul>
              </Card>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

/** A routine's steps, each openable alone so a stopped routine can be finished later. */
function RoutineSteps({ id, gathered }: { id: string; gathered: ReturnType<typeof sustainAttemptLogs> | null }) {
  const steps = routineStepTasks(id);
  return (
    <details className="w-full basis-full pl-4 text-xs">
      <summary className="cursor-pointer text-dim">Its {steps.length} steps, one at a time</summary>
      <ul className="mt-1 space-y-1">
        {steps.map((st, k) => {
          const done = gathered !== null && taskDone(st, gathered);
          return (
            <li key={k} className="flex items-baseline gap-2">
              <span aria-hidden="true" className={done ? "text-ok-ink" : "text-dim"}>
                {done ? "✓" : "·"}
              </span>
              <Link href={taskHref(st)} className="text-violet-ink hover:underline">
                {taskLabel(st)}
              </Link>
              {done && <span className="sr-only">done</span>}
            </li>
          );
        })}
      </ul>
    </details>
  );
}

function Comparison({ rows }: { rows: ReturnType<typeof programComparison> }) {
  if (!rows.length) return null;
  return (
    <table className="w-full max-w-md text-left text-sm">
      <thead>
        <tr className="text-xs text-dim">
          <th className="py-1 font-normal">Task</th>
          <th className="py-1 font-normal">First day</th>
          <th className="py-1 font-normal">Last day</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => (
          <tr key={r.label} className="border-t border-line/60">
            <td className="py-1 text-mut">{r.label}</td>
            <td className="tabular py-1 font-mono">{r.first ?? "not kept"}</td>
            <td className="tabular py-1 font-mono">{r.last ?? "not kept"}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
