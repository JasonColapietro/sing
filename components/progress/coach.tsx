"use client";

import Link from "next/link";
import { RANGE_RETEST_DAYS, type ProgressState } from "@/lib/progress";
import { useIsPro } from "@/lib/pro";
import { useFreeCap } from "@/lib/free-cap";
import { FREE_DAILY_MINUTES } from "@/lib/practice-limits";
import { Card } from "@/components/ui";
import { ProInlineNudge } from "@/components/pro/gate";
import { LockGlyph } from "@/components/pro/ui";
import { midiToLabel } from "@/lib/audio/notes";
import { aggregateNotes, overallAccuracy, weakNotes } from "@/lib/analytics";
import {
  EXERCISES,
  OCTAVE_SIREN_MIN_SEMIS,
  computeRootLadder,
  patternSpan,
} from "@/components/warmups/exercises";
import { TOLERANCE_CENTS } from "@/components/warmups/scoring";
import { rangeTestHref } from "@/lib/site";
import { STAR_THRESHOLDS } from "@/lib/stars";
import { programRangeNote, type ProgramRangeTest } from "@/components/practice/program-day";
import { TYPE_META, addDays, localDayStr } from "./format";

/**
 * A note is only weak below this in-tune rate: the two-star floor (lib/stars.ts
 * STAR_THRESHOLDS[1]), the same cut the songbook uses for a song's hardest
 * notes (components/songs/lib.ts hardestNotes). Above it, the quietest note
 * of a strong fortnight is not a weakness, and calling it one sent a singer
 * who was landing nearly everything to six minutes of remedial sirens.
 */
const WEAK_NOTE_MAX_ACCURACY = STAR_THRESHOLDS[1];

/**
 * Why the plan asks for no range test while Recovery week runs. Chapter 12:
 * "A range test taken with a cold measures the cold … start measuring again
 * when you are back to ordinary."
 */
function recoveryRangeLine(program: string): string {
  return `${program} is for a voice that feels tired, so leave the range test until the week is over and your voice feels back to ordinary.`;
}

interface PlanItem {
  title: string;
  href: string;
  minutes: number;
  reason: string;
  /**
   * Warmup exercise to open on arrival, as `/warmups?exercise=<id>`. Free-tier
   * ids only: the warmups page drops pack ids for a singer without Pro, and
   * this is the item a free singer actually sees.
   */
  id?: string;
}

/**
 * Today's plan from the singer's own numbers. `restDayOf` names the running
 * program when today is one of its rest days: the program the singer chose
 * says rest, so the plan does not tell them in red to sing or lose the streak.
 * It says what resting costs the streak instead, and leaves the plan below
 * as optional.
 *
 * `programRange` is the running program's next scheduled range test
 * (components/practice/program-day.ts programRangeTest). While there is one,
 * a stale range does not put a retest at the head of the plan: the program
 * schedules its tests warmed up and compared, chapter 13 asks for no retest
 * between them, and one sung early cannot count toward the program's day. A
 * note says when the program's test falls instead.
 *
 * `recovering` names the running program while it is Recovery week and not
 * finished (program-day.ts recoveryWeekOf): a week for a voice that feels
 * tired, which chapters 8 and 12 say not to measure. While it runs the plan
 * asks for no range test, missing or stale, since a finished test saves a
 * tired reading over the range every warmup and song fits to, and a note says
 * to leave it until the week is over. A weak note near the top of the range
 * gets the smaller Ng siren to the fifth, not six minutes of octave sirens.
 *
 * Exported for its test.
 */
export function buildPlan(
  state: ProgressState,
  now: Date,
  restDayOf: string | null = null,
  programRange: ProgramRangeTest | null = null,
  recovering: string | null = null,
): {
  banner: string | null;
  restNote: string | null;
  rangeNote: string | null;
  items: PlanItem[];
} {
  const todayKey = localDayStr(now);
  const yesterdayKey = localDayStr(addDays(now, -1));
  const cutoff = localDayStr(addDays(now, -13));

  const practicedToday = state.sessions.some((s) => s.day === todayKey);
  // A streak that ends tonight unless the singer sings today.
  const streakAtRisk =
    !practicedToday && state.streak.current > 0 && state.streak.lastDay === yesterdayKey;
  const banner =
    restDayOf === null && streakAtRisk && now.getHours() >= 12
      ? `Keep your ${state.streak.current}-day streak alive: one short session today keeps the tape rolling.`
      : null;
  const restNote =
    restDayOf === null
      ? null
      : `Today is a rest day in ${restDayOf}, and the program counts it as done. Nothing below is required.${
          streakAtRisk
            ? " Your streak counts only days you practice, so if you rest today it starts again from 1 at your next session."
            : ""
        }`;

  /* ---- signals, all from the singer's own numbers ---- */

  const recent = state.sessions.filter((s) => s.day >= cutoff);
  const tallies = aggregateNotes(state.sessions, { sinceDay: cutoff });
  const weak = weakNotes(tallies, { limit: 2 }).filter(
    (n) => n.accuracy < WEAK_NOTE_MAX_ACCURACY,
  );
  const accuracy = overallAccuracy(tallies);

  // Weakest scored area over the last 14 days, with a 2-session minimum so a
  // single bad round doesn't get to define an "average".
  const buckets = new Map<"ear" | "song" | "warmup", { sum: number; n: number }>();
  for (const s of recent) {
    if (s.score === undefined) continue;
    if (s.type !== "ear" && s.type !== "song" && s.type !== "warmup") continue;
    const b = buckets.get(s.type) ?? { sum: 0, n: 0 };
    b.sum += s.score;
    b.n += 1;
    buckets.set(s.type, b);
  }
  let weakestArea: { type: "ear" | "song" | "warmup"; avg: number } | null = null;
  for (const [type, b] of buckets) {
    if (b.n < 2) continue;
    const avg = b.sum / b.n;
    if (!weakestArea || avg < weakestArea.avg) weakestArea = { type, avg };
  }

  // A recovery day: yesterday was unusually heavy relative to the recent norm.
  const daySec = new Map<string, number>();
  for (const s of recent) {
    daySec.set(s.day, (daySec.get(s.day) ?? 0) + s.durationSec);
  }
  const yesterdaySec = daySec.get(yesterdayKey) ?? 0;
  const activeDays = [...daySec.entries()].filter(([day]) => day !== todayKey);
  const meanDaySec =
    activeDays.length > 0
      ? activeDays.reduce((a, [, sec]) => a + sec, 0) / activeDays.length
      : 0;
  const heavyYesterday =
    yesterdaySec >= 25 * 60 && yesterdaySec > meanDaySec * 1.6;

  // Range staleness: the range-over-time chart needs fresh measurements.
  const testedAt = state.range.testedAt ? Date.parse(state.range.testedAt) : NaN;
  const rangeAgeDays = Number.isNaN(testedAt)
    ? null
    : Math.floor((now.getTime() - testedAt) / 86_400_000);
  const hasRange = state.range.lowMidi !== undefined;

  /* ---- assemble, most important first ---- */

  const items: PlanItem[] = [];

  // Whether a range prompt already claimed the lead. A missing or stale
  // measurement is the more foundational gap — every other exercise ladders
  // off it — so nothing below is allowed to promote past it.
  let rangeFirst = false;

  if (!hasRange && recovering === null) {
    rangeFirst = true;
    items.push({
      title: "Vocal range test",
      href: rangeTestHref(),
      minutes: 3,
      reason:
        "You haven't measured your range yet. It anchors every other exercise to your voice.",
    });
  } else if (
    recovering === null &&
    programRange === null &&
    rangeAgeDays !== null &&
    rangeAgeDays >= RANGE_RETEST_DAYS
  ) {
    rangeFirst = true;
    items.push({
      title: "Retake the range test",
      href: rangeTestHref(),
      minutes: 3,
      reason: `Your range was last measured ${rangeAgeDays} days ago. A fresh test adds a current point to your range over time.`,
    });
  }
  // Recovery week's note says why the test the plan would have led with is
  // missing. The program's note is shared with the /range pitch meter, so the
  // two never disagree.
  const rangeNote =
    recovering !== null && !hasRange
      ? `You haven't measured your range yet. ${recoveryRangeLine(recovering)}`
      : recovering !== null && rangeAgeDays !== null && rangeAgeDays >= RANGE_RETEST_DAYS
        ? `Your range was last measured ${rangeAgeDays} days ago. ${recoveryRangeLine(recovering)}`
        : hasRange && programRange !== null && rangeAgeDays !== null && rangeAgeDays >= RANGE_RETEST_DAYS
          ? programRangeNote(rangeAgeDays, programRange)
          : null;

  items.push({
    title: "Breathing",
    href: "/breath",
    minutes: heavyYesterday ? 4 : 2,
    reason: heavyYesterday
      ? `Yesterday was a heavy one (${Math.round(yesterdaySec / 60)} min), so start slow and give the voice time to settle.`
      : "Low, steady breaths set up the rest of the session.",
  });

  // The core of the plan: measured weak notes drive the warmup choice.
  if (weak.length > 0) {
    const worst = weak[0];
    const names = weak.map((n) => midiToLabel(n.midi)).join(" and ");
    // A weak note at the top of the range wants the full-octave glide that
    // carries the voice through the break; anything lower wants the smaller,
    // slower siren that sits on the weak spot. The octave is only offered to a
    // singer whose measured span can hold it — below OCTAVE_SIREN_MIN_SEMIS its
    // glides would run from near the measured floor to within two semitones
    // of the ceiling, so those singers get the fifth instead. So does a
    // singer on Recovery week, whose tired voice is not one to work through
    // the top of its range.
    const wantsOctave =
      recovering === null &&
      (state.range.lowMidi !== undefined && state.range.highMidi !== undefined
        ? worst.midi >= state.range.highMidi - 5 &&
          state.range.highMidi - state.range.lowMidi >= OCTAVE_SIREN_MIN_SEMIS
        : worst.midi >= 67);
    // Titled from the catalog so the link and the label can never name
    // different exercises.
    const target = EXERCISES.find(
      (e) => e.id === (wantsOctave ? "octave-siren" : "ng-siren-fifth"),
    );
    // The siren's ladder is fitted inside the measured range, with room to
    // spare at both ends once the span allows it (computeRootLadder), so a weak
    // note near the top or bottom of the range, or outside it, can lie outside
    // every glide. Only promise a ladder through the note when a glide
    // actually sings it, and say why when none does.
    const { lowMidi, highMidi } = state.range;
    let reach = "Ladder through it slowly.";
    if (target && lowMidi !== undefined && highMidi !== undefined) {
      const glides = computeRootLadder(target, lowMidi, highMidi).map(
        (root) => [root, root + patternSpan(target)] as const,
      );
      if (!glides.some(([lo, hi]) => lo <= worst.midi && worst.midi <= hi)) {
        const note = midiToLabel(worst.midi);
        if (worst.midi > Math.max(...glides.map(([, hi]) => hi))) {
          const why =
            worst.midi > highMidi
              ? `${note} is above the top of your measured range (${midiToLabel(highMidi)}), so this siren's glides stop short of it`
              : `This siren keeps clear of the top of your measured range, so its glides stop short of ${note}`;
          reach = `${why}: let them carry you toward it lightly rather than pushing up to reach it.`;
        } else {
          const why =
            worst.midi < lowMidi
              ? `${note} is below the bottom of your measured range (${midiToLabel(lowMidi)}), so this siren's glides stay above it`
              : `This siren keeps clear of the bottom of your measured range, so its glides stay above ${note}`;
          reach = `${why}: let them settle toward it rather than pressing down to reach it.`;
        }
      }
    }
    const item: PlanItem = {
      title: target?.title ?? "Slow sirens through your weak spot",
      href: "/warmups",
      id: target?.id,
      minutes: 6,
      reason: `${names} ${weak.length > 1 ? "are" : "is"} your weakest ${
        weak.length > 1 ? "notes" : "note"
      } right now: ${midiToLabel(worst.midi)} lands within ${TOLERANCE_CENTS} cents of the target just ${worst.accuracy}% of the time${
        worst.cents !== null ? `, off by ~${Math.round(worst.cents)} cents` : ""
      }. ${reach}`,
    };
    // A free singer only ever sees item 0 (CoachCard locks the rest), so the
    // one item built from their own scored notes has to be it — otherwise the
    // whole plan reads as the same generic breathing line for everyone. A
    // range prompt still outranks it.
    if (rangeFirst) items.push(item);
    else items.unshift(item);
  } else {
    items.push({
      title: "Warmups",
      href: "/warmups",
      minutes: 5,
      reason:
        accuracy === null
          ? "Sing one scored warmup with the mic on and tomorrow's plan starts reading your actual notes."
          : "No stand-out weak note in the last two weeks, so a general ladder keeps the whole range honest.",
    });
  }

  if (weakestArea) {
    const avg = Math.round(weakestArea.avg);
    if (weakestArea.type === "ear") {
      items.push({
        title: "Ear training",
        href: TYPE_META.ear.href,
        minutes: 5,
        reason: `Your ear scores averaged ${avg} over the last two weeks, the lowest of your scored areas.`,
      });
    } else if (weakestArea.type === "song") {
      items.push({
        title: "Song practice",
        href: TYPE_META.song.href,
        minutes: 5,
        reason: `Your song scores averaged ${avg} recently. A focused pass will lift them.`,
      });
    } else {
      items.push({
        title: "Pitch practice",
        href: "/studio",
        minutes: 5,
        reason: `Your warmup scores averaged ${avg}. Slow pitch work in the studio tightens accuracy.`,
      });
    }
  } else {
    items.push({
      title: "Ear training",
      href: TYPE_META.ear.href,
      minutes: 5,
      reason: "Not enough recent scores to compare areas yet. A scored round sets your baseline.",
    });
  }

  if (hasRange) {
    items.push({
      title: "Sing a song",
      href: "/songs",
      minutes: 3,
      reason:
        accuracy !== null
          ? `Finish on real music: you're within ${TOLERANCE_CENTS} cents of the target ${accuracy}% of the scored time lately, and songs are where that shows.`
          : "Finish by putting the work into real music.",
    });
  }

  return { banner, restNote, rangeNote, items };
}

export function CoachCard({
  state,
  restDayOf = null,
  programRange = null,
  recovering = null,
  hideProNudge = false,
}: {
  state: ProgressState;
  /**
   * Another ask owns this screen (the program card's day-unlock, just below),
   * so the card leaves out its own Pro line rather than stack a second one.
   */
  hideProNudge?: boolean;
  /** The running program's name when today is one of its rest days. */
  restDayOf?: string | null;
  /** The running program's next scheduled range test, which the coach leaves to it. */
  programRange?: ProgramRangeTest | null;
  /** Recovery week's name while it runs, when the coach asks for no range test. */
  recovering?: string | null;
}) {
  const isPro = useIsPro();
  // The cap wall's "See your streak" lands here. Today's plan is still
  // today's (its reasons read yesterday and today), so it is not relabelled
  // as tomorrow's; the card says plainly which steps wait for midnight and
  // what is open now.
  const cap = useFreeCap();
  const { banner, restNote, rangeNote, items } = buildPlan(state, new Date(), restDayOf, programRange, recovering);
  // One step is not a plan, it is a screenshot of one. A singer who can see two
  // steps has watched the coach make a decision — this after that, and why —
  // which is the thing Pro actually sells; a singer who sees one has been shown
  // a locked door. buildPlan always produces at least three items, so this
  // never empties the card.
  const shown = isPro ? items.length : Math.min(2, items.length);

  return (
    <Card>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-lg">Today&apos;s session</h2>
        <span className="tabular font-mono text-xs text-dim">
          {items.slice(0, shown).reduce((a, i) => a + i.minutes, 0)} min planned
        </span>
      </div>
      {cap.capped && (
        <p className="mt-3 text-sm text-mut">
          Today&apos;s {FREE_DAILY_MINUTES} free guided minutes are used, so
          warmups, ear training, breath and songs open again at midnight.
          The{" "}
          <Link href="/studio" className="text-violet-ink underline underline-offset-4">
            pitch studio
          </Link>{" "}
          {/* Not the range test during Recovery week: a tired voice is not one
              to measure, so the plan leaves it until the week is over. */}
          {recovering === null ? (
            <>
              and the{" "}
              <Link href={rangeTestHref()} className="text-violet-ink underline underline-offset-4">
                range test
              </Link>{" "}
              are open now.
            </>
          ) : (
            "is open now."
          )}
        </p>
      )}
      {banner && (
        <p className="mt-3 rounded-xl border border-rec/40 bg-rec/10 px-3 py-2 text-sm text-rec">
          {banner}
        </p>
      )}
      {restNote && <p className="mt-3 text-sm text-mut">{restNote}</p>}
      {rangeNote && <p className="mt-3 text-sm text-mut">{rangeNote}</p>}
      <ol className="mt-4 space-y-3">
        {items.map((item, i) =>
          i < shown ? (
            <li key={item.title} className="flex gap-3">
              <span
                aria-hidden="true"
                className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-line2 font-mono text-[11px] text-mut"
              >
                {i + 1}
              </span>
              <div className="min-w-0">
                <div className="flex flex-wrap items-baseline gap-x-2">
                  <Link
                    href={item.id ? `${item.href}?exercise=${item.id}` : item.href}
                    className="font-medium text-ink underline-offset-4 hover:text-violet-ink hover:underline"
                  >
                    {item.title}
                  </Link>
                  <span className="tabular font-mono text-xs text-dim">
                    {item.minutes} min
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-mut">{item.reason}</p>
              </div>
            </li>
          ) : (
            <li key={item.title} className="flex gap-3">
              <span
                aria-hidden="true"
                className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-violet/40 font-mono text-[11px] text-violet-ink"
              >
                {i + 1}
              </span>
              <div className="min-w-0">
                <div className="flex flex-wrap items-baseline gap-x-2">
                  <span className="text-mut">{item.title}</span>
                  <span className="text-violet-ink">
                    <LockGlyph size={11} />
                  </span>
                </div>
              </div>
            </li>
          )
        )}
      </ol>
      <p className="mt-4 text-xs text-dim">
        Built from your scored notes, range tests, and recent practice. No AI,
        just the numbers.
      </p>
      {/* The plan can run past the free allowance, so say so here rather than
          at the cap wall halfway through step two. */}
      {!isPro && !cap.capped && (
        <p className="mt-1 text-xs text-dim">
          On the free plan, warmups, ear training, breath and songs share{" "}
          {FREE_DAILY_MINUTES} guided minutes a day; the range test and the
          pitch studio have no clock.
        </p>
      )}
      {/* Not before the first session: a singer with nothing logged has not
          yet seen the plan read their numbers, which is what the line sells. */}
      {state.sessions.length > 0 && !hideProNudge && (
        <div className="mt-3">
          {/* At the cap the card has just said today's free minutes are used,
              so the line names the limit Pro removes, not the plan. */}
          <ProInlineNudge>
            {cap.capped ? "Pro has no daily limit" : "Pro unlocks the full daily plan"}
          </ProInlineNudge>
        </div>
      )}
    </Card>
  );
}
