"use client";

import Link from "next/link";
import { useEffect, useState, type MouseEvent } from "react";
import { Button, Card, LinkButton, PageShell, Pill, SectionLabel } from "@/components/ui";
import { ProChip } from "@/components/pro/ui";
import { useIsPro } from "@/lib/pro";
import { localDay } from "@/lib/progress";
import {
  PROGRAMS,
  dayMinutes,
  isRestDay,
  programById,
  programMinutesRange,
  restDayCount,
  type Program,
} from "@/lib/programs";
import { beginProgram, leaveProgram } from "./store";
import { DayItems, ProgramTodayCard } from "./today-card";
import { useActiveProgram, type ActiveProgram } from "./use-program";

function minutesLabel(p: Program): string {
  const { min, max } = programMinutesRange(p);
  return min === max ? `${min} min a day` : `${min}–${max} min a day`;
}

function lengthLabel(p: Program): string {
  return p.weeks === 1 ? "1 week" : `${p.weeks} weeks`;
}

/** A plain left click, which the page handles in place; anything else keeps its browser meaning. */
function plainClick(e: MouseEvent): boolean {
  return !(e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0);
}

function ProgramCard({
  program,
  active,
  onOpen,
}: {
  program: Program;
  active: boolean;
  onOpen: (id: string) => void;
}) {
  return (
    <Card tone="raised" className="flex flex-col">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="text-lg">{program.name}</h2>
        {program.pro && <ProChip />}
        {active && <Pill tone="ok">In progress</Pill>}
      </div>
      <p className="mt-1 font-mono text-xs text-dim">
        {lengthLabel(program)} · {minutesLabel(program)} · {restDayCount(program)} rest{" "}
        {restDayCount(program) === 1 ? "day" : "days"}
      </p>
      <p className="mt-3 flex-1 text-sm text-mut">{program.tagline}</p>
      <div className="mt-4">
        <Link
          href={`/programs?program=${encodeURIComponent(program.id)}`}
          onClick={(e) => {
            if (!plainClick(e)) return;
            e.preventDefault();
            onOpen(program.id);
          }}
          className="text-sm font-medium text-violet-ink underline-offset-4 hover:underline"
        >
          See the {program.days.length}-day calendar
        </Link>
      </div>
    </Card>
  );
}

/**
 * The calendar: a week per row, a tile per day. A tile shows the day number
 * and whether it is done, today, or a rest day; pressing one shows that day's
 * items underneath. Seven columns hold at phone width because a tile carries
 * no more than a number and a mark.
 */
function Calendar({ program, active }: { program: Program; active: ActiveProgram | null }) {
  const mine = active?.program.id === program.id ? active : null;
  const doneDays = new Set(mine?.progress.done.map((d) => d.index) ?? []);
  const current = mine && mine.view.status !== "finished" ? mine.view.index : null;
  const [picked, setPicked] = useState<number | null>(null);
  const shown = picked ?? current ?? 0;
  const day = program.days[shown];

  const weeks: number[][] = [];
  for (let w = 0; w < program.weeks; w++) {
    weeks.push(Array.from({ length: 7 }, (_, i) => w * 7 + i));
  }

  return (
    <div>
      <div className="space-y-3">
        {weeks.map((days, w) => (
          <div key={w}>
            <div className="mb-1 font-mono text-[11px] uppercase tracking-[0.14em] text-dim">Week {w + 1}</div>
            <ol className="grid grid-cols-7 gap-1.5 sm:gap-2">
              {days.map((i) => {
                const d = program.days[i];
                const isDone = doneDays.has(i);
                const isToday = current === i;
                const rest = isRestDay(d);
                return (
                  <li key={i}>
                    <button
                      type="button"
                      onClick={() => setPicked(i)}
                      aria-pressed={shown === i}
                      aria-label={`Day ${i + 1}: ${rest ? "rest day" : d.title}${isDone ? ", done" : ""}${isToday ? ", today" : ""}`}
                      className={`flex h-14 w-full flex-col items-center justify-center rounded-xl border text-sm transition-colors sm:h-16 ${
                        shown === i ? "border-violet ring-1 ring-violet" : "border-line"
                      } ${isDone ? "bg-ok/15 text-ok-ink" : rest ? "bg-panel2 text-dim" : "bg-panel hover:bg-panel2"}`}
                    >
                      <span className="tabular font-mono">{i + 1}</span>
                      <span aria-hidden="true" className="text-[10px] leading-none">
                        {isDone ? "✓" : isToday ? "today" : rest ? "rest" : `${dayMinutes(d)}m`}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ol>
          </div>
        ))}
      </div>

      <div className="mt-6">
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <h3 className="text-lg">
            Day {shown + 1}: {isRestDay(day) ? "rest day" : day.title}
          </h3>
          {!isRestDay(day) && <span className="font-mono text-xs text-dim">{dayMinutes(day)} min</span>}
        </div>
        {isRestDay(day) ? (
          <p className="mt-2 text-sm text-mut">No program practice. A rest day counts as done once you reach it.</p>
        ) : (
          <div className="mt-3">
            <DayItems day={day} />
          </div>
        )}
      </div>
    </div>
  );
}

function ProgramDetail({
  program,
  active,
  onBack,
}: {
  program: Program;
  active: ActiveProgram | null;
  onBack: () => void;
}) {
  const isPro = useIsPro();
  const running = active?.program.id === program.id;
  const locked = program.pro && !isPro;
  const start = () => {
    if (locked) return;
    // Switching away from another program is a deliberate act; say what it costs.
    if (active && !running && !window.confirm(`Leave ${active.program.name}? Your place in it is not kept.`)) return;
    if (running && !window.confirm(`Restart ${program.name} from day 1?`)) return;
    beginProgram(program.id, active?.today ?? localDay());
  };

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/programs"
          onClick={(e) => {
            if (!plainClick(e)) return;
            e.preventDefault();
            onBack();
          }}
          className="text-sm text-mut underline-offset-4 hover:text-ink hover:underline"
        >
          ← All programs
        </Link>
      </div>
      <Card>
        <div className="flex flex-wrap items-center gap-2">
          <SectionLabel>{lengthLabel(program)}</SectionLabel>
          {program.pro && <ProChip />}
          {running && <Pill tone="ok">In progress</Pill>}
        </div>
        <h2 className="mt-3 text-2xl sm:text-3xl">{program.name}</h2>
        <p className="mt-2 max-w-2xl text-mut">{program.tagline}</p>
        <p className="mt-2 font-mono text-xs text-dim">
          {program.days.length} days · {minutesLabel(program)} · {restDayCount(program)} rest{" "}
          {restDayCount(program) === 1 ? "day" : "days"}
        </p>
        <p className="mt-4 max-w-2xl text-sm text-mut">
          <span className="font-medium text-ink">What gets measured. </span>
          {program.measures}
        </p>
        <p className="mt-2 max-w-2xl text-sm text-rec">
          Sing at a comfortable volume. Stop if a note causes pain.
        </p>
        <div className="mt-5 flex flex-wrap items-center gap-2">
          {locked ? (
            <LinkButton href="/pro">Unlock with Pro</LinkButton>
          ) : (
            <Button onClick={start}>{running ? "Restart from day 1" : active ? "Switch to this program" : "Start this program"}</Button>
          )}
          {running && (
            <Button variant="ghost" onClick={() => window.confirm(`Stop ${program.name}?`) && leaveProgram()}>
              Stop program
            </Button>
          )}
        </div>
        <p className="mt-3 max-w-2xl text-xs text-dim">
          Day 1 is today. A day ticks itself off once the practice log shows each of its items, one
          program day per calendar day at most. Your place is kept in this browser only.
        </p>
      </Card>
      <Calendar key={program.id + (active?.progress.startedDay ?? "")} program={program} active={active} />
    </div>
  );
}

/**
 * /programs: the list, a detail view per program, and today's card for the
 * running one. The detail view is `?program=<id>`, read from the URL after
 * mount rather than with useSearchParams — the same trade the warmups room
 * makes, so the page's heading and list prerender — and kept in step with the
 * history stack by hand.
 */
export function ProgramsClient() {
  const active = useActiveProgram();
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    const read = () => setSelected(new URLSearchParams(window.location.search).get("program"));
    read();
    window.addEventListener("popstate", read);
    return () => window.removeEventListener("popstate", read);
  }, []);

  const open = (id: string | null) => {
    setSelected(id);
    const url = id ? `/programs?program=${encodeURIComponent(id)}` : "/programs";
    window.history.pushState(null, "", url);
    window.scrollTo({ top: 0 });
  };

  const program = programById(selected);

  return (
    <PageShell
      kicker="Programs"
      title="Practice programs"
      subtitle="Named plans from one week to six, worked a day at a time: warmups, breath and check-ins, with rest days built in. Every day opens the rooms you already use."
    >
      <div className="space-y-8">
        {active && (!program || program.id === active.program.id) && (
          <ProgramTodayCard active={active} onBrowse={program ? null : () => open(active.program.id)} />
        )}
        {program ? (
          <ProgramDetail program={program} active={active} onBack={() => open(null)} />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {PROGRAMS.map((p) => (
              <ProgramCard key={p.id} program={p} active={active?.program.id === p.id} onOpen={open} />
            ))}
          </div>
        )}
      </div>
    </PageShell>
  );
}
