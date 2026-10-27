"use client";

import Link from "next/link";
import { Button, Card, LinkButton, ProgressBar, SectionLabel } from "@/components/ui";
import { ProChip } from "@/components/pro/ui";
import { useIsPro, useProReady } from "@/lib/pro";
import { FREE_DAILY_SEC, useFreeCap } from "@/lib/free-cap";
import { FREE_DAILY_MINUTES } from "@/lib/practice-limits";
import { PRICING, formatPrice } from "@/lib/pro-shared";
import { midiToLabel } from "@/lib/audio/notes";
import {
  FREE_WEEKS,
  cappedDaySeconds,
  chapterStartIndex,
  dayMinutes,
  dayNeedsPro,
  isRestDay,
  itemEvidence,
  itemHref,
  itemIsCapped,
  itemIsPro,
  itemLabel,
  itemStepHref,
  itemSteps,
  markDayDone,
  repeatFortnight,
  repeatFrom,
  startProgram,
  type Program,
  type ProgramChapter,
  type ProgramDay,
  type ProgramProgress,
  type ProgramReading,
} from "@/lib/programs";
import { programDayNeedsPro } from "@/components/practice/program-day";
import { programViewHref } from "@/lib/program-ids";
import { saveProgramProgress } from "./store";
import type { ActiveProgram } from "./use-program";

/** Where an unlock button goes: the offer itself, as every cap surface links it. */
const PRO_BUY_HREF = "/pro#buy";
/** What it says: priced, so the wall names the one payment before the click. */
const UNLOCK_LABEL = `Unlock with Pro: ${formatPrice(PRICING.lifetime.amount)} once`;

/** "Week 1 was free" / "weeks 1–2 were free", for the free week's end. */
function freeWeeksWere(capital: boolean): string {
  const w = capital ? "Week" : "week";
  return FREE_WEEKS === 1 ? `${w} 1 was free` : `${w}s 1–${FREE_WEEKS} were free`;
}

/**
 * True when the day after `index` is one a free singer cannot open: the first
 * practice day past a Pro program's free week. A rest day ends both Pro
 * programs' free week, so "opens tomorrow" there would promise a paywall.
 */
function nextNeedsPro(program: Program, index: number, isPro: boolean): boolean {
  const next = program.days[index + 1];
  return !isPro && next !== undefined && !isRestDay(next) && dayNeedsPro(program, index + 1);
}

/**
 * True when today's free guided minutes are used and the day still has a row
 * the allowance counts. The range test and the Recorder sit outside it, so a
 * day with only those left is still open now.
 */
function waitsForTomorrow(capped: boolean, day: ProgramDay, itemsDone: readonly boolean[]): boolean {
  return capped && !isRestDay(day) && day.items.some((item, i) => !itemsDone[i] && itemIsCapped(item));
}

/** The rows still open once the allowance is used, by name: "The range test". */
function openUncappedRows(day: ProgramDay, itemsDone: readonly boolean[]): string | null {
  const names = [
    ...new Set(
      day.items.flatMap((item, i) =>
        itemsDone[i] || itemIsCapped(item) ? [] : [item.kind === "range" ? "the range test" : "the recorded take"],
      ),
    ),
  ];
  if (names.length === 0) return null;
  const list = names.join(" and ");
  return `${list[0].toUpperCase()}${list.slice(1)} ${names.length === 1 ? "sits" : "sit"} outside the allowance and ${names.length === 1 ? "is" : "are"} open now.`;
}

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
 * The 0-based step a part-sung routine or breath set should carry on from:
 * its first step the log does not show, once an earlier one has been sung.
 * -1 when the row should open at its start (nothing sung yet, the item done,
 * or not a routine or set). The rooms run a routine or set from the step they
 * open on to its end, and the free plan stops one between steps, so a row
 * that always opened at step 1 would spend the next day's minutes on steps
 * already ticked and never reach the rest. A step `waived` for the saved
 * range is ticked without being sung, so it is passed over but is not a
 * start on its own.
 */
export function resumeStep(
  item: ProgramDay["items"][number],
  stepsDone: readonly boolean[] | undefined,
  sung: boolean,
  waived: readonly boolean[] = [],
): number {
  if (sung || !stepsDone || itemSteps(item).length < 2) return -1;
  const at = stepsDone.findIndex((d) => !d);
  if (at <= 0) return -1;
  return stepsDone.slice(0, at).some((d, k) => d && !waived[k]) ? at : -1;
}

/**
 * One row per item of a program day, each a real link into the room that runs
 * it. `done` ticks the items the log already shows for this day (anything
 * since the day opened, which may be before today); omitted, the list is a
 * preview with numbers instead of ticks. A routine or set part-way done links
 * to the first step still to sing.
 */
export function DayItems({
  day,
  done,
  stepsDone,
  stepsWaived,
  compact = false,
}: {
  day: ProgramDay;
  done?: boolean[];
  /** Per item, which of its steps are done; given, routines and sets list their steps. */
  stepsDone?: boolean[][];
  /** Per item, which of those steps are skipped for the saved range rather than sung. */
  stepsWaived?: boolean[][];
  /**
   * Ticks and the carry-on links, without the step lists: today's rows a
   * second time on the same page (the calendar under today's card), which
   * must agree with the card without repeating its step lists.
   */
  compact?: boolean;
}) {
  return (
    <ol className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-panel">
      {day.items.map((item, i) => {
        const { title, meta } = itemLabel(item);
        const sung = done?.[i] ?? false;
        const resumeAt = resumeStep(item, stepsDone?.[i], sung, stepsWaived?.[i]);
        return (
          <li key={i}>
            <Link
              href={resumeAt > 0 ? itemStepHref(item, resumeAt) : itemHref(item)}
              data-program-item={item.kind}
              // The sessions that would tick this row, for the browser check.
              data-evidence={JSON.stringify(itemEvidence(item).map((e) => ({ type: e.type, detail: e.details?.[0] ?? null })))}
              className="flex min-h-[3.5rem] w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-panel2 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-violet-ink"
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
                  {/* "(done)", not "(done today)": a row ticks for anything
                      sung since the day opened (countsFrom), which can be an
                      earlier calendar day than today. */}
                  {done && <span className="sr-only">{sung ? "(done)" : "(not done yet)"}</span>}
                  {itemIsPro(item) && <ProChip />}
                </span>
                <span className="mt-1 block text-sm text-dim">
                  {meta}
                  {resumeAt > 0 ? ` · carries on from step ${resumeAt + 1}` : ""}
                </span>
              </span>
              <Chevron />
            </Link>
            {stepsDone && !sung && !compact && (
              <ItemSteps item={item} done={stepsDone[i] ?? []} waived={stepsWaived?.[i] ?? []} />
            )}
          </li>
        );
      })}
    </ol>
  );
}

/**
 * A routine's or breath set's steps, each opening on its own. The row above
 * carries on from the first step still to sing; these let a singer the free
 * plan stopped part way through pick any one of the rest, on this day or a
 * later one. Open once a step has been sung, so the ticks show. A step the
 * routine skips for the saved range (`waived`) needs nothing from the singer:
 * it says so instead of linking to a step that would only skip itself, and it
 * neither counts as sung nor opens the list.
 */
function ItemSteps({
  item,
  done,
  waived,
}: {
  item: ProgramDay["items"][number];
  done: boolean[];
  waived: boolean[];
}) {
  const steps = itemSteps(item);
  if (steps.length < 2) return null;
  const sungCount = done.filter((d, k) => d && !waived[k]).length;
  return (
    <details open={sungCount > 0} className="border-t border-line px-4 py-2 pl-13 text-sm">
      <summary className="cursor-pointer py-1 text-dim">
        Its {steps.length} steps, one at a time ({sungCount} done)
      </summary>
      <ul className="mt-1 space-y-1 pb-1">
        {steps.map((st, k) =>
          waived[k] ? (
            <li key={k} className="flex flex-wrap items-baseline gap-x-2 text-dim">
              <span aria-hidden="true">–</span>
              <span>{itemLabel(st).title}</span>
              <span className="text-xs">skipped for your range</span>
            </li>
          ) : (
            <li key={k} className="flex items-baseline gap-2">
              <span aria-hidden="true" className={done[k] ? "text-ok-ink" : "text-dim"}>
                {done[k] ? "✓" : "·"}
              </span>
              <Link href={itemStepHref(item, k)} className="text-violet-ink underline-offset-4 hover:underline">
                {itemLabel(st).title}
              </Link>
              {done[k] && <span className="sr-only">(done)</span>}
              {itemIsPro(st) && <ProChip />}
            </li>
          ),
        )}
      </ul>
    </details>
  );
}

/**
 * What a restart asks first. A new run starts from an empty record, so the
 * finished run's check-in readings (day 1 beside the last day, the only
 * place a free singer sees them side by side) go with it; the question says
 * so when there are any.
 */
export function restartQuestion(program: Program, readings: readonly ProgramReading[]): string {
  return readings.length > 0
    ? `Start ${program.name} again from day 1? This run's check-in readings above are cleared.`
    : `Start ${program.name} again from day 1?`;
}

/** The finished card's restart, once the singer confirms it. */
export function restartFinished(program: Program, readings: readonly ProgramReading[], today: string): void {
  if (!window.confirm(restartQuestion(program, readings))) return;
  saveProgramProgress(startProgram(program.id, today));
}

/** " Its check-in readings are cleared." when the run has any; leaving starts an empty record. */
function readingsCleared(active: ActiveProgram): string {
  return active.readings.length > 0 ? " Its check-in readings are cleared." : "";
}

/**
 * What switching away from the running program asks first. The new run
 * starts an empty record, so this one's check-in readings go with it, and a
 * finished program has no place left to lose.
 */
export function leaveQuestion(active: ActiveProgram): string {
  return active.view.status === "finished"
    ? `Leave ${active.program.name}? You finished it.${readingsCleared(active)}`
    : `Leave ${active.program.name}? Your place in it is not kept.${readingsCleared(active)}`;
}

/** What Stop asks first. A finished program has no days left to wait. */
export function stopQuestion(active: ActiveProgram): string {
  return active.view.status === "finished"
    ? `Stop ${active.program.name}? You finished it.${readingsCleared(active)}`
    : `Stop ${active.program.name}? Your place in it is not kept.${readingsCleared(active)} To take a break, just come back later: days wait for you.`;
}

/**
 * What going back to the start of a fortnight asks first. On a running
 * program (repeatFrom) the days before it stay done with their readings, and
 * any check-in day from it on is sung again, so its reading goes. `until` is
 * the day the run is finished again at, when it does not run on to its last
 * day: a finished run singing one fortnight again (repeatFortnight), or one
 * already doing so. Then only the days up to it are sung again, and the rest
 * keep their readings too.
 */
export function goBackQuestion(
  chapter: ProgramChapter,
  readings: readonly ProgramReading[],
  until?: number,
): string {
  const start = chapterStartIndex(chapter);
  const end = until ?? Infinity;
  const kept = readings.some((r) => r.index < start || r.index >= end);
  // A finished run has up to four check-ins past week 5 (days 42, 60, 67, 78).
  const cleared = readings.filter((r) => r.index >= start && r.index < end).map((r) => String(r.index + 1));
  const days =
    cleared.length === 1
      ? `day ${cleared[0]}`
      : `days ${cleared.slice(0, -1).join(", ")} and ${cleared.at(-1)}`;
  const sung =
    until === undefined
      ? `Days from day ${start + 1} on are sung again` +
        (kept ? `, and the check-in readings before day ${start + 1} are kept.` : ".")
      : `Days ${start + 1} to ${until} are sung again, then the run is finished again; the other days stay done` +
        (kept ? ", with their check-in readings." : ".");
  return (
    `Go back to the start of weeks ${chapter.fromWeek}–${chapter.toWeek}? ${sung}` +
    (cleared.length === 0
      ? ""
      : ` The ${cleared.length === 1 ? "reading" : "readings"} from ${days} ${cleared.length === 1 ? "is" : "are"} cleared.`)
  );
}

/**
 * Go back to the start of `chapter`'s fortnight, once the singer confirms it.
 * From a finished run (`fortnightOnly`, chapter 19) only that fortnight is
 * sung again, and the run is finished again at its end; on a running one the
 * run carries on from there, to its last day or to the end of a fortnight it
 * is already singing again. True when it went back.
 */
export function goBackTo(
  progress: ProgramProgress,
  readings: readonly ProgramReading[],
  chapter: ProgramChapter,
  fortnightOnly = false,
): boolean {
  const until = fortnightOnly ? chapter.toWeek * 7 : progress.until;
  if (!window.confirm(goBackQuestion(chapter, readings, until))) return false;
  saveProgramProgress(
    fortnightOnly
      ? repeatFortnight(progress, chapter, readings)
      : repeatFrom(progress, chapterStartIndex(chapter), readings),
  );
  return true;
}

/**
 * The fortnights chapter 19 sends a finished run back to: weeks 5 and 6 if
 * the transition never took, weeks 7 and 8 if the top still frays. Each is
 * sung again on its own (repeatFortnight), not with the weeks after it.
 */
export function finishedGoBacks(program: Program): ProgramChapter[] {
  return (program.chapters ?? []).filter((c) => c.fromWeek === 5 || c.fromWeek === 7);
}

/** The check-in days' range and sustain readings, oldest first. */
function Readings({ readings }: { readings: ProgramReading[] }) {
  if (readings.length === 0) return null;
  return (
    <div className="mt-5" data-program-readings>
      <h4 className="text-sm font-medium">Your check-in readings</h4>
      <table className="mt-2 w-full max-w-lg text-left text-sm">
        <thead>
          <tr className="text-xs text-dim">
            <th className="py-1 pr-3 font-normal">Day</th>
            <th className="py-1 pr-3 font-normal">Range test</th>
            <th className="py-1 font-normal">Longest sustain</th>
          </tr>
        </thead>
        <tbody>
          {readings.map((r) => (
            <tr key={r.index} className="border-t border-line">
              <td className="py-1 pr-3 text-mut">
                Day {r.index + 1} <span className="text-xs text-dim">{r.day}</span>
              </td>
              <td className="tabular py-1 pr-3 font-mono">
                {r.range === undefined
                  ? "—"
                  : r.range === null
                    ? "not logged"
                    : `${midiToLabel(r.range.lowMidi)}–${midiToLabel(r.range.highMidi)}`}
              </td>
              <td className="tabular py-1 font-mono">
                {r.sustainSec === undefined ? "—" : r.sustainSec === null ? "not logged" : `${r.sustainSec.toFixed(1)} s`}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="mt-2 max-w-xl text-xs text-dim">
        The notes the range test found and the seconds the sustain timer counted, on the days
        that took them. A single reading is one day&apos;s, not a lasting change.
      </p>
    </div>
  );
}

/**
 * Today's program day: what to sing, a tick on what the log already shows,
 * and a way to mark the day done by hand for what it cannot. Once today has
 * completed a day the card says so and names tomorrow's, rather than offering
 * the next day early, or says tomorrow's needs Pro when the free week ends.
 * Once a free singer's guided minutes for today are used, it says the day
 * picks up after midnight instead of inviting a start now.
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
  const cap = useFreeCap();
  const { program, progress, today, view, itemsDone, stepsDone, stepsWaived, countsFrom, readings } = active;
  const total = program.days.length;
  const day = program.days[view.index];
  const next = program.days[view.index + 1];
  const pct = (view.completed / total) * 100;
  const count = itemsDone.filter(Boolean).length;
  const cappedSec = cappedDaySeconds(day);
  // Past a Pro program's free week, a free singer is asked for Pro instead of
  // shown rows they cannot open. Their place is kept.
  const paywalled = programDayNeedsPro(active, isPro);
  // Today's free guided minutes are used: the rows the allowance counts open
  // on their rooms' cap walls, so the card says the day resumes after midnight
  // rather than inviting a start now.
  const waits = view.status === "todo" && !paywalled && waitsForTomorrow(cap.capped, day, itemsDone);
  const stillOpen = waits ? openUncappedRows(day, itemsDone) : null;
  // A rest day ends a Pro program's free week, so tomorrow's day needs Pro.
  const nextLocked = view.status === "done-today" && nextNeedsPro(program, view.index, isPro);
  // A book program's finished run goes back a block rather than to day 1.
  const goBacks = view.status === "finished" ? finishedGoBacks(program) : [];

  return (
    <Card>
      <section aria-labelledby="program-today-heading" data-program-day={view.index} data-status={view.status}>
        <div className="flex flex-wrap items-center gap-2">
          <h2 id="program-today-heading" className="text-base">
            <SectionLabel>Today · {program.name}</SectionLabel>
          </h2>
          <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-dim">
            {view.completed} of {total} days done
          </span>
          {program.pro && <ProChip />}
        </div>
        <ProgressBar
          value={pct}
          label={`${program.name}: days done`}
          tone="ok"
          className="mt-3 max-w-md"
        />

        {view.status === "finished" && (
          <div className="mt-4">
            <h3 className="text-xl">You finished {program.name}.</h3>
            <p className="mt-2 max-w-xl text-sm text-mut">
              {/* A program's own next step where running it again is the
                  wrong advice (Recovery week's referral, chapter 6). */}
              {program.finished
                ? `All ${total} days done. ${program.finished}`
                : goBacks.length > 0
                  ? `All ${total} days done. Chapter 19 says what next: if the transition never quite took, go back to weeks 5 and 6; if the top still frays, to weeks 7 and 8; if it all held together, keep three warmup sessions a week and add songs rather than starting again.`
                  : `All ${total} days done. Run it again from day 1, or pick another program.`}
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
              {!next
                ? "That was the last day."
                : nextLocked
                  ? `${freeWeeksWere(true)}. Day ${view.index + 2} onward needs Pro, and your place is kept.`
                  : isRestDay(next)
                    ? `Tomorrow, day ${view.index + 2}, is a rest day.`
                    : `Day ${view.index + 2}, “${next.title}”, opens tomorrow.`}
            </p>
            {nextLocked && (
              <div className="mt-3">
                <LinkButton href={PRO_BUY_HREF} size="sm">{UNLOCK_LABEL}</LinkButton>
              </div>
            )}
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
            ) : paywalled ? (
              <div className="mt-2 max-w-xl text-sm text-mut">
                <p>
                  {FREE_WEEKS === 1 ? "Week 1 was" : `Weeks 1–${FREE_WEEKS} were`} free. The rest of{" "}
                  {program.name} needs Pro. Your place is kept, so you can carry on from day{" "}
                  {view.index + 1} once it is unlocked.
                </p>
                <div className="mt-3">
                  <LinkButton href={PRO_BUY_HREF} size="sm">{UNLOCK_LABEL}</LinkButton>
                </div>
              </div>
            ) : (
              <>
                {waits ? (
                  <p className="mt-2 max-w-xl text-sm text-mut" data-program-waits>
                    Today&apos;s {FREE_DAILY_MINUTES} free guided minutes are used.{" "}
                    {count > 0
                      ? `Rows already ticked stay ticked, and day ${view.index + 1} picks up where you left off after midnight.`
                      : `Day ${view.index + 1} is kept, and its guided rows open again after midnight.`}
                    {stillOpen ? ` ${stillOpen}` : ""}
                  </p>
                ) : (
                  <p className="mt-2 max-w-xl text-sm text-mut">
                    Each row opens its room. A row ticks itself once your log shows it
                    {countsFrom < today ? ` (anything since ${countsFrom} counts)` : ""}; if you did
                    something the log cannot see, mark the day done yourself.
                  </p>
                )}
                <div className="mt-4">
                  <DayItems day={day} done={itemsDone} stepsDone={stepsDone} stepsWaived={stepsWaived} />
                </div>
                {!isPro && cappedSec > FREE_DAILY_SEC && (
                  <p className="mt-3 max-w-xl text-xs text-dim">
                    The free plan covers five guided minutes a day, and this day runs longer, so
                    spread it over a few days: it completes once every row is ticked, and a
                    routine&apos;s steps can be sung one at a time.{" "}
                    <Link href="/pro" className="underline">Pro</Link> removes the cap; the range
                    test is always free.
                  </p>
                )}
              </>
            )}
          </div>
        )}

        {progress.until !== undefined && view.status !== "finished" && (
          // A finished run singing a fortnight again (repeatFortnight).
          <p className="mt-3 max-w-xl text-xs text-dim" data-program-repeat>
            A second pass from your finished run: once day {progress.until} is done, the run is finished
            again. Days {progress.until + 1} to {total} stay done.
          </p>
        )}

        <Readings readings={readings} />

        <div className="mt-5 flex flex-wrap items-center gap-2">
          {view.status === "todo" && !isRestDay(day) && !paywalled && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => saveProgramProgress(markDayDone(program, progress, today))}
            >
              Mark day {view.index + 1} done
            </Button>
          )}
          {goBacks.map((c) => (
            <Button key={c.slug} variant="outline" size="sm" onClick={() => goBackTo(progress, readings, c, true)}>
              Repeat weeks {c.fromWeek}–{c.toWeek}
            </Button>
          ))}
          {view.status === "finished" && (
            // Chapter 19 asks a run that held together not to start again
            // tomorrow, so there the restart is not the filled button.
            <Button
              variant={goBacks.length > 0 ? "outline" : undefined}
              size="sm"
              onClick={() => restartFinished(program, readings, today)}
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
 * /warmups back to /warmups?routine= would not re-read the query. A day past
 * a Pro program's free week says it needs Pro rather than offering a plan
 * that opens on a paywall, once the entitlement cache has been read; so does
 * the rest day that ends the free week, about tomorrow. Once a free singer's
 * guided minutes for today are used, the day says it carries on after
 * midnight rather than leading with "Open today's plan".
 */
export function ProgramEntryCard({ active }: { active: ActiveProgram | null }) {
  const isPro = useIsPro();
  const proReady = useProReady();
  // Read before the early return below, so the hook order never changes when
  // a program starts or stops.
  const cap = useFreeCap();
  if (!active) {
    return (
      <Card tone="well">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="max-w-xl text-sm text-mut">
            <span className="font-medium text-ink">Programs.</span> One to twelve weeks of warmups,
            breath and check-ins, planned day by day.
          </p>
          {/* min-h-11: a bare text-sm link is a 20px-tall target, under the
              WCAG 2.5.8 floor and well under a thumb. The text stays put. */}
          <Link
            href="/programs"
            className="inline-flex min-h-11 items-center text-sm text-violet-ink underline-offset-4 hover:underline"
          >
            Browse programs
          </Link>
        </div>
      </Card>
    );
  }
  const { program, view, itemsDone } = active;
  const day = program.days[view.index];
  const next = program.days[view.index + 1];
  const locked = proReady && programDayNeedsPro(active, isPro);
  // Today's free guided minutes are used and the day still has rows they
  // count: those open on cap walls until midnight, so this card must not be
  // the one surface still saying "open today's plan".
  const waits = proReady && !locked && view.status === "todo" && waitsForTomorrow(cap.capped, day, itemsDone);
  // Tomorrow is past a Pro program's free week (a rest day ends it).
  const nextLocked = proReady && view.status === "done-today" && nextNeedsPro(program, view.index, isPro);
  // A document load, not a client navigation (lib/program-ids.ts).
  const calendarHref = programViewHref(program.id);
  const doneLine = isRestDay(day) ? `Day ${view.index + 1}: rest day.` : `Day ${view.index + 1} done.`;
  const line = locked
    ? `Day ${view.index + 1} needs Pro. ${freeWeeksWere(true)}, and your place is kept.`
    : view.status === "finished"
      ? program.chapters
        ? "Finished. The calendar has chapter 19's next steps."
        : program.finished
          ? // The calendar's finished card carries the full referral.
            "Finished. The calendar says what next if your voice is still rough."
          : "Finished. Start it again or pick another."
      : view.status === "done-today"
        ? nextLocked
          ? `${doneLine} Day ${view.index + 2} onward needs Pro; ${freeWeeksWere(false)}.`
          : next && isRestDay(next)
            ? `${doneLine} Tomorrow is a rest day${isRestDay(day) ? " too" : ""}.`
            : `${doneLine} The next day opens tomorrow.`
        : isRestDay(day)
          ? `Day ${view.index + 1}: rest day.`
          : waits
            ? `Day ${view.index + 1}: ${day.title} · ${itemsDone.filter(Boolean).length} of ${day.items.length} done. Today’s ${FREE_DAILY_MINUTES} free guided minutes are used; carry on after midnight.`
            : `Day ${view.index + 1}: ${day.title} · ${dayMinutes(day)} min`;
  return (
    <Card>
      <section aria-labelledby="program-entry-heading" data-program-day={view.index} data-status={view.status}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <h2 id="program-entry-heading" className="text-base">
              <SectionLabel>Your program: day {Math.min(view.index + 1, program.days.length)}</SectionLabel>
            </h2>
            <p className="mt-2 font-medium">{program.name}</p>
            <p className="mt-1 text-sm text-mut" data-program-waits={waits ? "" : undefined}>
              {line}
            </p>
          </div>
          {locked ? (
            <div className="flex flex-wrap items-center gap-3">
              {/* Priced and violet, like the wall in the program's own view
                  (UNLOCK_LABEL): the same moment, the same offer. */}
              <LinkButton href={PRO_BUY_HREF}>
                {`Unlock day ${view.index + 1} with Pro: ${formatPrice(PRICING.lifetime.amount)} once`}
              </LinkButton>
              <a
                href={calendarHref}
                className="inline-flex min-h-11 items-center text-sm text-violet-ink underline-offset-4 hover:underline"
              >
                See the calendar
              </a>
            </div>
          ) : (
            <LinkButton href={calendarHref} variant={waits ? "outline" : undefined} fullLoad>
              {waits
                ? "See today’s plan"
                : view.status === "todo" && !isRestDay(day)
                  ? "Open today’s plan"
                  : "See the calendar"}
            </LinkButton>
          )}
        </div>
      </section>
    </Card>
  );
}
