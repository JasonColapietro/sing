"use client";

import Link from "next/link";
import { Button, Card, LinkButton, ProgressBar, SectionLabel } from "@/components/ui";
import { ProChip } from "@/components/pro/ui";
import { useIsPro } from "@/lib/pro";
import { FREE_DAILY_SEC } from "@/lib/free-cap";
import {
  dayMinutes,
  daySeconds,
  isRestDay,
  itemEvidence,
  itemHref,
  itemIsPro,
  itemLabel,
  markDayDone,
  startProgram,
  type ProgramDay,
} from "@/lib/programs";
import { saveProgramProgress } from "./store";
import type { ActiveProgram } from "./use-program";

function Chevron() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="mt-1 shrink-0 text-dim"
    >
      <path d="m9 6 6 6-6 6" />
    </svg>
  );
}

/**
 * One row per item of a program day, each a real link into the room that runs
 * it. `done` ticks the items today's log already shows; omitted, the list is a
 * preview with numbers instead of ticks.
 */
export function DayItems({ day, done }: { day: ProgramDay; done?: boolean[] }) {
  return (
    <ol className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-panel">
      {day.items.map((item, i) => {
        const { title, meta } = itemLabel(item);
        const sung = done?.[i] ?? false;
        return (
          <li key={i}>
            <Link
              href={itemHref(item)}
              data-program-item={item.kind}
              // The sessions that would tick this row, for the browser check.
              data-evidence={JSON.stringify(itemEvidence(item).map((e) => ({ type: e.type, detail: e.details?.[0] ?? null })))}
              className="flex min-h-[3.5rem] w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-panel2 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-violet"
            >
              <span
                aria-hidden="true"
                className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs ${
                  sung ? "border-ok bg-ok/15 text-ok-ink" : "border-line2 text-dim"
                }`}
              >
                {sung ? "✓" : i + 1}
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex flex-wrap items-center gap-2">
                  <span className="font-medium">{title}</span>
                  {done && <span className="sr-only">{sung ? "(done today)" : "(not done yet)"}</span>}
                  {itemIsPro(item) && <ProChip />}
                </span>
                <span className="mt-1 block text-sm text-dim">{meta}</span>
              </span>
              <Chevron />
            </Link>
          </li>
        );
      })}
    </ol>
  );
}

/**
 * Today's program day: what to sing, a tick on what the log already shows,
 * and a way to mark the day done by hand for what it cannot. Once today has
 * completed a day the card says so and names tomorrow's, rather than offering
 * the next day early.
 */
export function ProgramTodayCard({
  active,
  onBrowse,
}: {
  active: ActiveProgram;
  /** Opens the calendar in place; null when the calendar is already on screen. */
  onBrowse: (() => void) | null;
}) {
  const isPro = useIsPro();
  const { program, progress, today, view, itemsDone } = active;
  const total = program.days.length;
  const day = program.days[view.index];
  const next = program.days[view.index + 1];
  const pct = (view.completed / total) * 100;
  const count = itemsDone.filter(Boolean).length;
  // Everything but the range test runs against the free allowance.
  const cappedSec = daySeconds({ ...day, items: day.items.filter((i) => i.kind !== "range") });

  return (
    <Card>
      <section aria-labelledby="program-today-heading" data-program-day={view.index} data-status={view.status}>
        <div className="flex flex-wrap items-center gap-2">
          <h2 id="program-today-heading" className="text-base leading-none">
            <SectionLabel>Today · {program.name}</SectionLabel>
          </h2>
          <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-dim">
            {view.completed} of {total} days done
          </span>
          {program.pro && <ProChip />}
        </div>
        <ProgressBar value={pct} tone="ok" className="mt-3 max-w-md" />

        {view.status === "finished" && (
          <div className="mt-4">
            <h3 className="text-xl">You finished {program.name}.</h3>
            <p className="mt-2 max-w-xl text-sm text-mut">
              All {total} days done. Run it again from day 1, or pick another program.
            </p>
          </div>
        )}

        {view.status === "done-today" && (
          <div className="mt-4">
            <h3 className="text-xl">
              {isRestDay(day) ? `Day ${view.index + 1}: rest day` : `Day ${view.index + 1} done`}
            </h3>
            <p className="mt-2 max-w-xl text-sm text-mut">
              {isRestDay(day)
                ? "No program practice today. Your voice gets the day off."
                : `${day.title}. Nice work.`}{" "}
              {next
                ? `Day ${view.index + 2}, “${next.title}”, opens tomorrow.`
                : "That was the last day."}
            </p>
          </div>
        )}

        {view.status === "todo" && (
          <div className="mt-4">
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <h3 className="text-xl">
                Day {view.index + 1} of {total}: {day.title}
              </h3>
              {!isRestDay(day) && (
                <span className="font-mono text-xs text-dim">
                  {dayMinutes(day)} min · {count} of {day.items.length} done
                </span>
              )}
            </div>
            {isRestDay(day) ? (
              <p className="mt-2 text-sm text-mut">Rest day. No program practice today.</p>
            ) : (
              <>
                <p className="mt-2 max-w-xl text-sm text-mut">
                  Each row opens its room. A row ticks itself once today&apos;s log shows it; if
                  you did something the log cannot see, mark the day done yourself.
                </p>
                <div className="mt-4">
                  <DayItems day={day} done={itemsDone} />
                </div>
                {!isPro && cappedSec > FREE_DAILY_SEC && (
                  <p className="mt-3 max-w-xl text-xs text-dim">
                    The free plan covers three guided minutes a day, and this day runs longer.{" "}
                    <Link href="/pro" className="underline">Pro</Link> removes the cap; the range
                    test is always free.
                  </p>
                )}
              </>
            )}
          </div>
        )}

        <div className="mt-5 flex flex-wrap items-center gap-2">
          {view.status === "todo" && !isRestDay(day) && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => saveProgramProgress(markDayDone(program, progress, today))}
            >
              Mark day {view.index + 1} done
            </Button>
          )}
          {view.status === "finished" && (
            <Button
              size="sm"
              onClick={() => saveProgramProgress(startProgram(program.id, today))}
            >
              Start again from day 1
            </Button>
          )}
          {onBrowse && (
            <Button variant="ghost" size="sm" onClick={onBrowse}>
              See the whole calendar
            </Button>
          )}
        </div>
      </section>
    </Card>
  );
}

/**
 * The warmups room's way in: "Your program: day N" with a link to today's
 * plan when a program is running, and a quiet pointer to the programs
 * otherwise. The rows themselves live on /programs, because a link from
 * /warmups back to /warmups?routine= would not re-read the query.
 */
export function ProgramEntryCard({ active }: { active: ActiveProgram | null }) {
  if (!active) {
    return (
      <Card tone="well">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="max-w-xl text-sm text-mut">
            <span className="font-medium text-ink">Programs.</span> One to six weeks of warmups,
            breath and check-ins, planned day by day.
          </p>
          <Link href="/programs" className="text-sm text-violet-ink underline-offset-4 hover:underline">
            Browse programs
          </Link>
        </div>
      </Card>
    );
  }
  const { program, view } = active;
  const day = program.days[view.index];
  const line =
    view.status === "finished"
      ? "Finished. Start it again or pick another."
      : view.status === "done-today"
        ? isRestDay(day)
          ? `Day ${view.index + 1}: rest day. The next day opens tomorrow.`
          : `Day ${view.index + 1} done. The next day opens tomorrow.`
        : isRestDay(day)
          ? `Day ${view.index + 1}: rest day.`
          : `Day ${view.index + 1}: ${day.title} · ${dayMinutes(day)} min`;
  return (
    <Card>
      <section aria-labelledby="program-entry-heading" data-program-day={view.index} data-status={view.status}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <h2 id="program-entry-heading" className="text-base leading-none">
              <SectionLabel>Your program: day {Math.min(view.index + 1, program.days.length)}</SectionLabel>
            </h2>
            <p className="mt-2 font-medium">{program.name}</p>
            <p className="mt-1 text-sm text-mut">{line}</p>
          </div>
          <LinkButton href={`/programs?program=${encodeURIComponent(program.id)}`}>
            {view.status === "todo" && !isRestDay(day) ? "Open today’s plan" : "See the calendar"}
          </LinkButton>
        </div>
      </section>
    </Card>
  );
}
