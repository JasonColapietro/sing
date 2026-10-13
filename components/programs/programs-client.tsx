"use client";

import Link from "next/link";
import { Fragment, useEffect, useState, type MouseEvent } from "react";
import { Button, Card, PageShell, Pill, SectionLabel } from "@/components/ui";
import { ProChip } from "@/components/pro/ui";
import { useIsPro } from "@/lib/pro";
import { localDay } from "@/lib/progress";
import {
  FREE_WEEKS,
  PROGRAMS,
  dayMinutes,
  freePlanCalendarDays,
  isRestDay,
  programById,
  programMinutesRange,
  repeatChoices,
  restDayCount,
  type Program,
} from "@/lib/programs";
import { programViewHref } from "@/lib/program-ids";
import { beginProgram, leaveProgram } from "./store";
import { DayItems, ProgramTodayCard, goBackTo, leaveQuestion, stopQuestion } from "./today-card";
import { useActiveProgram, type ActiveProgram } from "./use-program";
import { prepaintMarker, useHydrated } from "@/components/prepaint";

function minutesLabel(p: Program): string {
  const { min, max } = programMinutesRange(p);
  return min === max ? `${min} min a day` : `${min}–${max} min a day`;
}

function lengthLabel(p: Program): string {
  return p.weeks === 1 ? "1 week" : `${p.weeks} weeks`;
}

function freeLabel(): string {
  return FREE_WEEKS === 1 ? "week 1" : `weeks 1–${FREE_WEEKS}`;
}

/**
 * About how many weeks a free program takes at the free plan's five guided
 * minutes a day, or null when that rounds to its own length. A Pro program's
 * free week already fits the allowance, and its later weeks are Pro anyway.
 * Rounded rather than rounded up: the day count already leans long.
 */
function freePlanWeeks(p: Program): number | null {
  if (p.pro) return null;
  const weeks = Math.round(freePlanCalendarDays(p) / 7);
  return weeks > p.weeks ? weeks : null;
}

/** Whether a program has a range test, which the free plan never caps. */
function hasRangeTest(p: Program): boolean {
  return p.days.some((d) => d.items.some((i) => i.kind === "range"));
}

/** A plain left click, which the page handles in place; anything else keeps its browser meaning. */
function plainClick(e: MouseEvent): boolean {
  return !(e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0);
}

function ProgramCard({
  program,
  active,
  finished,
  onOpen,
}: {
  program: Program;
  active: boolean;
  /** The running program's every day is done: a restart begins a new run. */
  finished: boolean;
  onOpen: (id: string) => void;
}) {
  const isPro = useIsPro();
  const hydrated = useHydrated();
  const freeWeeks = freePlanWeeks(program);
  return (
    <Card tone="raised" className="flex flex-col">
      {/* At least a pill's height (22px), so the running program's pill,
          which arrives with the program store after hydration, does not grow
          the row: on a short finished card the list is on the first screen,
          and the 19px title row moved it 3px. */}
      <div className="flex min-h-[1.375rem] flex-wrap items-center gap-2">
        <h2 className="text-lg">{program.name}</h2>
        {program.pro && <ProChip />}
        {active && <Pill tone="ok">{finished ? "Finished" : "In progress"}</Pill>}
      </div>
      <p className="mt-1 font-mono text-xs text-dim">
        {lengthLabel(program)} · {minutesLabel(program)} · {restDayCount(program)} rest{" "}
        {restDayCount(program) === 1 ? "day" : "days"}
        {program.pro && ` · ${freeLabel()} free`}
      </p>
      {/* Not for Pro, which the prerender cannot know: until hydration the
          pre-paint state hides it from a Pro singer (components/prepaint.tsx). */}
      {!isPro && freeWeeks !== null && (
        <p className="mt-1 text-xs text-dim" {...prepaintMarker(hydrated, { plan: "not-pro" })}>
          On the free plan&apos;s five guided minutes a day, this takes about {freeWeeks} weeks. Pro
          runs it as written.
        </p>
      )}
      <p className="mt-3 text-sm text-mut">{program.tagline}</p>
      {/* What each plan measures, on the list itself: the list's own page,
          /programs, carries no program's calendar. */}
      <p className="mt-2 flex-1 text-xs text-mut">
        <span className="font-medium text-ink">What gets measured. </span>
        {program.measures}
      </p>
      <div className="mt-4">
        {/* A plain anchor (lib/program-ids.ts programViewHref): a plain click
            opens the view in place, and a new tab loads it as a document. */}
        <a
          href={programViewHref(program.id)}
          onClick={(e) => {
            if (!plainClick(e)) return;
            e.preventDefault();
            onOpen(program.id);
          }}
          className="text-sm font-medium text-violet-ink underline-offset-4 hover:underline"
        >
          See the {program.days.length}-day calendar
        </a>
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
  // With the days a repeated fortnight keeps done after it (repeatFortnight).
  const doneDays = new Set([...(mine?.progress.done ?? []), ...(mine?.progress.later ?? [])].map((d) => d.index));
  const current = mine && mine.view.status !== "finished" ? mine.view.index : null;
  const [picked, setPicked] = useState<number | null>(null);
  const shown = picked ?? current ?? 0;
  const day = program.days[shown];
  // Today's day, still to do, is on the card above too: its rows here carry
  // the same ticks and carry-on links, so the two lists never disagree.
  const todays = mine && mine.view.status === "todo" && shown === current ? mine : null;

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
            <DayItems
              day={day}
              done={todays?.itemsDone}
              stepsDone={todays?.stepsDone}
              stepsWaived={todays?.stepsWaived}
              compact
            />
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Today's card appears above a program's detail, so on a phone it lands a
 * screen or more above the button just pressed (a start, a restart, a go-back)
 * and the page looks unchanged. Once it has rendered, take the singer to the
 * day it now shows unless it is in view.
 */
function showToday() {
  requestAnimationFrame(() => {
    const heading = document.getElementById("program-today-heading");
    if (!heading) return;
    // Below the sticky header (html's scroll-padding-top, 4.5rem) and in
    // the top half of the screen already: leave the page where it is.
    const { top } = heading.getBoundingClientRect();
    if (top >= 72 && top <= window.innerHeight / 2) return;
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
    heading.scrollIntoView({ block: "start", behavior: reduce ? "auto" : "smooth" });
  });
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
  const hydrated = useHydrated();
  const running = active?.program.id === program.id;
  // Still the active program once every day is done, but nothing waits in it.
  const finished = running && active?.view.status === "finished";
  // A Pro program starts for anyone: its first week is free, and the today
  // card asks for Pro when the singer reaches the first day past it.
  const trial = program.pro && !isPro;
  // A free program runs past the free plan's daily allowance most days, so it
  // takes longer than its name; say how much longer before it is started.
  const freeWeeks = isPro ? null : freePlanWeeks(program);
  // A book program's running fortnight, and the one before it, to go back to
  // (chapter 13's rules for breaks and fortnights that did not work).
  const doneCount = active?.progress.done.length ?? 0;
  const goBacks = running && !finished ? repeatChoices(program, doneCount) : [];
  const start = () => {
    // Switching away from another program is a deliberate act; say what it costs.
    if (active && !running && !window.confirm(leaveQuestion(active))) return;
    // A restart starts an empty record, so this run's check-in readings go.
    if (
      running &&
      !window.confirm(
        `Restart ${program.name} from day 1?${active && active.readings.length > 0 ? " This run's check-in readings are cleared." : ""}`,
      )
    ) {
      return;
    }
    beginProgram(program.id, active?.today ?? localDay());
    showToday();
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
          {running && <Pill tone="ok">{finished ? "Finished" : "In progress"}</Pill>}
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
        {program.chapters && (
          <div className="mt-4 max-w-2xl text-sm text-mut">
            <span className="font-medium text-ink">Read along. </span>
            {/* What the weeks build on, before the point that needs it. */}
            {program.readFirst?.map((r) => (
              <Fragment key={r.slug}>
                Before {r.before}, read{" "}
                <Link href={`/book/${r.slug}`} className="text-violet-ink underline-offset-4 hover:underline">
                  {r.title}
                </Link>
                : {r.why}.{" "}
              </Fragment>
            ))}
            Each fortnight has a chapter in the book:
            <ul className="mt-2 space-y-1">
              {program.chapters.map((c) => (
                <li key={c.slug}>
                  <Link href={`/book/${c.slug}`} className="text-violet-ink underline-offset-4 hover:underline">
                    {c.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
        {/* This and the free-plan note are not for Pro, which the prerender
            of a program's view cannot know: until hydration the pre-paint
            state hides them from a Pro singer. */}
        {trial && (
          <p className="mt-4 max-w-2xl text-sm text-mut" {...prepaintMarker(hydrated, { plan: "not-pro" })}>
            <span className="font-medium text-ink">
              {freeLabel().replace(/^w/, "W")} is free.
            </span>{" "}
            It uses only free exercises, and each day&apos;s guided practice fits the free plan&apos;s five minutes. Day{" "}
            {FREE_WEEKS * 7 + 1} onward needs <Link href="/pro" className="underline">Pro</Link>.
          </p>
        )}
        {freeWeeks !== null && (
          <p className="mt-4 max-w-2xl text-sm text-mut" {...prepaintMarker(hydrated, { plan: "not-pro" })}>
            <span className="font-medium text-ink">On the free plan.</span> Its days run longer than
            the five guided minutes a day, so each spreads over a few calendar days and the whole
            program takes about {freeWeeks} weeks. <Link href="/pro" className="underline">Pro</Link>{" "}
            removes the cap{hasRangeTest(program) ? "; the range test is always free" : ""}.
          </p>
        )}
        <div className="mt-5 flex flex-wrap items-center gap-2">
          {/* Running, what to press next is today's rows above; a restart is
              the rare case, so it gets the quieter style. */}
          <Button variant={running ? "outline" : "violet"} onClick={start}>
            {running ? "Restart from day 1" : active ? "Switch to this program" : "Start this program"}
          </Button>
          {active &&
            goBacks.map((c) => (
              <Button
                key={c.slug}
                variant="ghost"
                onClick={() => goBackTo(active.progress, active.readings, c) && showToday()}
              >
                {/* The fortnight under way is repeated; the one before is gone back to. */}
                {doneCount < c.toWeek * 7 ? `Repeat weeks ${c.fromWeek}–${c.toWeek}` : `Go back to week ${c.fromWeek}`}
              </Button>
            ))}
          {running && active && (
            <Button variant="ghost" onClick={() => window.confirm(stopQuestion(active)) && leaveProgram()}>
              Stop program
            </Button>
          )}
        </div>
        <p className="mt-3 max-w-2xl text-xs text-dim">
          {running ? "A restart makes today day 1 again." : "Day 1 is today."} A day ticks itself off
          once the practice log shows each of its items, one program day per calendar day at most.
          Your place is kept in this browser only.
          {running
            ? finished
              ? " You finished it; a restart begins a new run."
              : program.chapters
                ? ` Taking a break? The next day waits. Back after two weeks or more away, or stuck on a fortnight whose “Move on when” check has not passed? Chapter 13's rule is to go back rather than forward${goBacks.length > 0 ? ": the buttons above restart this fortnight or go back to the one before" : ""}.`
                : " Taking a break? You don't need to stop: the next day waits until you sing it."
            : " Miss a day and the program waits: the next day is there when you come back."}
        </p>
      </Card>
      <Calendar
        key={program.id + (active?.progress.startedDay ?? "") + (active?.progress.startedAt ?? "")}
        program={program}
        active={active}
      />
    </div>
  );
}

/**
 * The program an address names: `?program=<id>` (the deep link), or the id
 * segment of /programs/<id>, the page next.config.ts serves that link from,
 * should anyone open that path itself.
 */
export function programIdAt(pathname: string, search: string): string | null {
  const query = new URLSearchParams(search).get("program");
  if (query !== null) return query;
  return /^\/programs\/([^/]+)\/?$/.exec(pathname)?.[1] ?? null;
}

/**
 * /programs: the list, a detail view per program, and today's card for the
 * running one. The detail view is `?program=<id>`. A static page cannot read
 * its query, so next.config.ts rewrites each known id onto that program's own
 * prerendered page (app/programs/[program]), which passes it here as
 * `initialProgram`: the deep link's HTML is the program's view from the first
 * paint. After that the view follows the address, kept in step with the
 * history stack by hand: opening a program or going back to the list pushes
 * an entry in place, Back and Forward read it, and the list's own page reads
 * it once after mount, for an entry history restores onto it.
 */
export function ProgramsClient({ initialProgram = null }: { initialProgram?: string | null }) {
  const active = useActiveProgram();
  const hydrated = useHydrated();
  const [selected, setSelected] = useState<string | null>(initialProgram);

  useEffect(() => {
    const read = () => setSelected(programIdAt(window.location.pathname, window.location.search));
    read();
    window.addEventListener("popstate", read);
    return () => window.removeEventListener("popstate", read);
  }, []);

  const open = (id: string | null) => {
    setSelected(id);
    const url = id ? programViewHref(id) : "/programs";
    window.history.pushState(null, "", url);
    window.scrollTo({ top: 0 });
  };

  const program = programById(selected);

  return (
    <PageShell
      kicker="Programs"
      title="Singing practice programs"
      subtitle="Vocal training programs from one week to twelve, worked a day at a time: warmups, breath and range check-ins, with rest days built in. Four are free to follow; on the free plan guided practice is five minutes a day, so a longer day can be spread over several. Pro removes the cap."
    >
      <div className="space-y-8">
        {/* The running program is read from this browser's storage, so the
            prerendered list cannot have today's card above it. Until
            hydration its place is an empty card that the pre-paint state
            sizes for the day's status, and the list starts about where the
            card will leave it (components/prepaint.tsx). */}
        {!hydrated ? (
          <div
            aria-hidden="true"
            className="rounded-3xl border border-line bg-panel"
            {...prepaintMarker(hydrated, { slot: "program-today" })}
            // A program's own view: its card has no "See the whole calendar".
            data-prepaint-view={program ? "" : undefined}
          />
        ) : (
          active &&
          (!program || program.id === active.program.id) && (
            <ProgramTodayCard active={active} onBrowse={program ? null : () => open(active.program.id)} />
          )
        )}
        {program ? (
          <ProgramDetail program={program} active={active} onBack={() => open(null)} />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {PROGRAMS.map((p) => (
              <ProgramCard
                key={p.id}
                program={p}
                active={active?.program.id === p.id}
                finished={active?.program.id === p.id && active.view.status === "finished"}
                onOpen={open}
              />
            ))}
          </div>
        )}
      </div>
    </PageShell>
  );
}
